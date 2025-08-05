"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, CheckCheck, Trash2, Settings, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"

interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  timestamp: string
  read: boolean
  category: "system" | "tender" | "user" | "bid"
  actionUrl?: string
}

interface NotificationCenterProps {
  userRole: "admin" | "tender-creator" | "vendor"
}

export function NotificationCenter({ userRole }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "info",
      title: "New Tender Created",
      message: "Office Building Construction tender has been published",
      timestamp: "2024-01-15T10:30:00Z",
      read: false,
      category: "tender",
      actionUrl: "/admin/tenders/1",
    },
    {
      id: "2",
      type: "success",
      title: "Bid Submitted",
      message: "Construction Corp submitted a bid for $485,000",
      timestamp: "2024-01-15T09:15:00Z",
      read: false,
      category: "bid",
      actionUrl: "/admin/tenders/1",
    },
    {
      id: "3",
      type: "warning",
      title: "Deadline Approaching",
      message: "Marketing Campaign Design tender closes in 2 days",
      timestamp: "2024-01-14T16:45:00Z",
      read: true,
      category: "tender",
      actionUrl: "/admin/tenders/3",
    },
    {
      id: "4",
      type: "info",
      title: "New User Registration",
      message: "Elite Builders has registered as a vendor",
      timestamp: "2024-01-14T14:20:00Z",
      read: true,
      category: "user",
      actionUrl: "/admin/users",
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationBgColor = (type: string, read: boolean) => {
    const opacity = read ? "50" : "100"
    switch (type) {
      case "success":
        return `bg-green-${opacity} border-green-200`
      case "warning":
        return `bg-yellow-${opacity} border-yellow-200`
      case "error":
        return `bg-red-${opacity} border-red-200`
      default:
        return `bg-blue-${opacity} border-blue-200`
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-l-4 ${getNotificationBgColor(notification.type, notification.read)} ${
                    !notification.read ? "bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-600"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.timestamp), "MMM dd, HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {notification.actionUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-2 text-xs"
                      onClick={() => {
                        markAsRead(notification.id)
                        window.location.href = notification.actionUrl!
                      }}
                    >
                      View Details →
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <div className="p-2 flex justify-between">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={`/${userRole}/profile`}>
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </a>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
