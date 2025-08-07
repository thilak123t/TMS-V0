"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, LayoutDashboard, Users, FileText, UserCheck, Settings, LogOut, Menu, X, Gavel } from 'lucide-react'
import { cn } from "@/lib/utils"
import { isActiveRoute, NavigationManager } from "@/lib/navigation-utils"

interface SidebarProps {
  userRole: "admin" | "tender-creator" | "vendor"
  userName?: string
  userEmail?: string
}

const navigationItems = {
  admin: [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Tender Management", href: "/admin/tenders", icon: FileText },
    { name: "Invited Vendors", href: "/admin/invited-vendors", icon: UserCheck },
  ],
  "tender-creator": [
    { name: "Dashboard", href: "/tender-creator/dashboard", icon: LayoutDashboard },
    { name: "Tender Management", href: "/tender-creator/tenders", icon: FileText },
    { name: "Invited Vendors", href: "/tender-creator/invited-vendors", icon: UserCheck },
  ],
  vendor: [
    { name: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
    { name: "My Tenders", href: "/vendor/tenders", icon: FileText },
    { name: "My Bids", href: "/vendor/bids", icon: Gavel },
  ],
}

// Get user data based on role with fallbacks
const getUserData = (userRole: string, userName?: string, userEmail?: string) => {
  // Try to get updated profile data from localStorage first
  if (typeof window !== 'undefined') {
    const profileKey = `${userRole}Profile`
    const savedProfile = localStorage.getItem(profileKey)

    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        return {
          name: `${profile.firstName} ${profile.lastName}`,
          email: profile.email,
        }
      } catch (error) {
        console.error("Error parsing saved profile:", error)
      }
    }
  }

  // Use provided props or fallback to defaults
  if (userName && userEmail) {
    return { name: userName, email: userEmail }
  }

  // Default fallbacks based on role
  const defaults = {
    admin: { name: "Admin User", email: "admin@tms.com" },
    "tender-creator": { name: "Tender Creator", email: "creator@tms.com" },
    vendor: { name: "Vendor User", email: "vendor@tms.com" },
  }

  return defaults[userRole as keyof typeof defaults] || { name: "User", email: "user@tms.com" }
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true) // Start collapsed on mobile
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentUserData, setCurrentUserData] = useState(() => getUserData(userRole, userName, userEmail))
  const pathname = usePathname()
  const router = useRouter()

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      const updatedData = getUserData(userRole, userName, userEmail)
      setCurrentUserData(updatedData)
    }

    if (typeof window !== 'undefined') {
      // Listen for storage changes (profile updates)
      window.addEventListener("storage", handleProfileUpdate)
      // Listen for custom profile update events
      window.addEventListener("profileUpdated", handleProfileUpdate)
      // Check for updates on mount
      handleProfileUpdate()

      return () => {
        window.removeEventListener("storage", handleProfileUpdate)
        window.removeEventListener("profileUpdated", handleProfileUpdate)
      }
    }
  }, [userRole, userName, userEmail])

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 768) {
          setIsCollapsed(false) // Show sidebar on desktop
        } else {
          setIsCollapsed(true) // Hide sidebar on mobile
        }
      }
    }

    if (typeof window !== 'undefined') {
      handleResize() // Set initial state
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      // Clear all stored data
      localStorage.removeItem(`${userRole}Profile`)
      localStorage.removeItem("sessionTimeout")
      localStorage.removeItem("userSession")
    }
    // Redirect to login
    router.push("/login")
  }

  const handleNavigation = (href: string) => {
    // Show loading state
    setIsNavigating(true)

    // Auto-close mobile menu on navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsCollapsed(true)
    }

    // Clear loading state after navigation
    setTimeout(() => setIsNavigating(false), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isCollapsed) {
      setIsCollapsed(true)
    }
  }

  // Handle navigation manager integration
  useEffect(() => {
    const navigationManager = NavigationManager.getInstance()
    const unsubscribe = navigationManager.onNavigate((path) => {
      setIsNavigating(true)
      setTimeout(() => setIsNavigating(false), 300)
    })

    return unsubscribe
  }, [])

  const navItems = navigationItems[userRole]

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md border"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Open navigation menu" : "Close navigation menu"}
      >
        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out shadow-lg md:shadow-none md:relative md:translate-x-0",
          isCollapsed && "-translate-x-full md:translate-x-0",
          !isCollapsed && "translate-x-0"
        )}
        onKeyDown={handleKeyDown}
        role="complementary"
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">TMS</h1>
                <p className="text-xs text-gray-500 capitalize">{userRole.replace("-", " ")}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3" role="navigation" aria-label="Main navigation">
            <nav className="space-y-1 py-4" role="menu">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.href, pathname)

                return (
                  <Link key={item.name} href={item.href} onClick={() => handleNavigation(item.href)} className="block">
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3 transition-all duration-200",
                        isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100 border-r-2 border-blue-600 font-medium",
                        !isActive && "hover:bg-gray-50 text-gray-700 hover:text-gray-900",
                        isNavigating && "opacity-50",
                      )}
                      aria-current={isActive ? "page" : undefined}
                      role="menuitem"
                      disabled={isNavigating}
                    >
                      <Icon className={cn("h-4 w-4", isActive && "text-blue-600")} />
                      <span className="truncate">{item.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          <Separator />

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 p-2 h-auto hover:bg-gray-50"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                      {currentUserData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUserData.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUserData.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    // Close mobile menu if open
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setIsCollapsed(true)
                    }
                    // Navigate to profile settings page
                    router.push(`/${userRole}/profile`)
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
