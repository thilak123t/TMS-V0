"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { VendorNotificationCenter } from "@/components/notifications/vendor-notification-center"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

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
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Sidebar skeleton */}
          <div className="hidden md:flex w-64 bg-card border-r">
            <div className="flex flex-col w-full p-6 space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="flex-1 flex flex-col">
            <div className="h-16 bg-card border-b px-6 flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          userRole={user.role} 
          userName={`${user.first_name} ${user.last_name}`} 
          userEmail={user.email} 
        />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-card shadow-sm border-b px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                  Welcome back, {user.first_name}
                </h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {user.role === 'vendor' ? (
                  <VendorNotificationCenter />
                ) : (
                  <NotificationCenter />
                )}
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
