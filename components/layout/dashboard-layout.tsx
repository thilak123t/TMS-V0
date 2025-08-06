"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { VendorNotificationCenter } from "@/components/notifications/vendor-notification-center"
import { useAuth } from "@/hooks/use-auth"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: string
  userName: string
  userEmail: string
}

export function DashboardLayout({ children, userRole, userName, userEmail }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        userRole={user.role} 
        userName={`${user.first_name} ${user.last_name}`} 
        userEmail={user.email} 
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back, {user.first_name}
            </h1>
            <div className="flex items-center space-x-4">
              {user.role === 'vendor' ? (
                <VendorNotificationCenter />
              ) : (
                <NotificationCenter />
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
