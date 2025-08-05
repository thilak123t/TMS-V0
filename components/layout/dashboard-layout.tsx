"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sidebar } from "./sidebar"
import { NotificationCenter } from "../notifications/notification-center"
import { VendorNotificationCenter } from "../notifications/vendor-notification-center"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "admin" | "tender-creator" | "vendor"
  userName?: string
  userEmail?: string
}

export function DashboardLayout({ children, userRole, userName, userEmail }: DashboardLayoutProps) {
  const [sessionWarning, setSessionWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isInactive, setIsInactive] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const warningTimerRef = useRef<NodeJS.Timeout>()
  const logoutTimerRef = useRef<NodeJS.Timeout>()
  const countdownTimerRef = useRef<NodeJS.Timeout>()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get session timeout from user preferences (default 30 minutes)
  const getSessionTimeout = useCallback(() => {
    const timeout = localStorage.getItem("sessionTimeout")
    return timeout ? Number.parseInt(timeout) : 30
  }, [])

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

    const timeoutMinutes = getSessionTimeout()
    const warningTime = (timeoutMinutes - 5) * 60 * 1000 // 5 minutes before timeout
    const logoutTime = timeoutMinutes * 60 * 1000

    // Set warning timer (5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      setSessionWarning(true)
      setTimeLeft(5 * 60) // 5 minutes in seconds
      setIsInactive(true)

      // Start countdown
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Auto logout
            handleLogout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, warningTime)

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      handleLogout()
    }, logoutTime)
  }, [getSessionTimeout])

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (sessionWarning) {
      setSessionWarning(false)
      setIsInactive(false)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
    resetTimers()
  }, [sessionWarning, resetTimers])

  const handleLogout = useCallback(() => {
    // Clear all timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

    // Clear session data
    localStorage.removeItem("userSession")

    // Redirect to login
    window.location.href = "/login"
  }, [])

  const extendSession = useCallback(() => {
    updateActivity()
  }, [updateActivity])

  // Activity detection
  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    const activityHandler = () => {
      updateActivity()
    }

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, activityHandler, true)
    })

    // Initial timer setup
    resetTimers()

    // Listen for session timeout changes
    const handleSessionTimeoutChange = (event: CustomEvent) => {
      resetTimers()
    }

    window.addEventListener("sessionTimeoutChanged", handleSessionTimeoutChange as EventListener)

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, activityHandler, true)
      })
      window.removeEventListener("sessionTimeoutChanged", handleSessionTimeoutChange as EventListener)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [updateActivity, resetTimers])

  // Listen for tender data updates and refresh page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tenderData" || e.key === "tenders") {
        // Force page refresh to show updated data
        window.location.reload()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar userRole={userRole} userName={userName} userEmail={userEmail} />

      <div className="md:ml-64">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Welcome back, {userName}</h2>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Role-specific notification center */}
              {userRole === "vendor" ? <VendorNotificationCenter /> : <NotificationCenter userRole={userRole} />}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 relative">
          {children}

          {/* Session timeout overlay when inactive */}
          {isInactive && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-amber-600" />
                  <h3 className="text-lg font-semibold">Session Timeout Warning</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Your session will expire in {formatTime(timeLeft)} due to inactivity.
                </p>
                <div className="flex gap-3">
                  <Button onClick={extendSession} className="flex-1">
                    Stay Logged In
                  </Button>
                  <Button variant="outline" onClick={handleLogout} className="flex-1 bg-transparent">
                    Logout Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
