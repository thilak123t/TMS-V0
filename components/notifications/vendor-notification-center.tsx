"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Bell, Mail, Award, Clock, MessageSquare, CheckCircle, Info, X, Settings } from "lucide-react"
import Link from "next/link"

interface VendorNotification {
  id: string
  type: "invitation" | "comment" | "update" | "award" | "deadline" | "result"
  title: string
  message: string
  tenderId?: string
  tenderTitle?: string
  timestamp: string
  read: boolean
  priority: "high" | "medium" | "low"
  actionUrl?: string
}

export function VendorNotificationCenter() {
  const [notifications, setNotifications] = useState<VendorNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadNotifications()

    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail
      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)
    }

    window.addEventListener("newVendorNotification", handleNewNotification as EventListener)

    return () => {
      window.removeEventListener("newVendorNotification", handleNewNotification as EventListener)
    }
  }, [])

  const loadNotifications = () => {
    // Load vendor-specific notifications
    const vendorNotifications: VendorNotification[] = [
      {
        id: "VN001",
        type: "invitation",
        title: "New Tender Invitation",
        message: "You have been invited to bid on 'Office Renovation Project'",
        tenderId: "T001",
        tenderTitle: "Office Renovation Project",
        timestamp: "2024-01-12T10:30:00Z",
        read: false,
        priority: "high",
        actionUrl: "/vendor/tenders/T001",
      },
      {
        id: "VN002",
        type: "comment",
        title: "Question Answered",
        message: "Your question about delivery timeline has been answered",
        tenderId: "T002",
        tenderTitle: "IT Equipment Supply",
        timestamp: "2024-01-12T08:15:00Z",
        read: false,
        priority: "medium",
        actionUrl: "/vendor/tenders/T002#comments",
      },
      {
        id: "VN003",
        type: "award",
        title: "Congratulations! Bid Won",
        message: "You have won the 'Marketing Services Contract' tender",
        tenderId: "T003",
        tenderTitle: "Marketing Services Contract",
        timestamp: "2024-01-11T16:45:00Z",
        read: false,
        priority: "high",
        actionUrl: "/vendor/bids/B002",
      },
      {
        id: "VN004",
        type: "deadline",
        title: "Deadline Reminder",
        message: "Bid submission deadline is in 2 days for 'Security System Installation'",
        tenderId: "T004",
        tenderTitle: "Security System Installation",
        timestamp: "2024-01-11T09:00:00Z",
        read: true,
        priority: "high",
        actionUrl: "/vendor/tenders/T004",
      },
      {
        id: "VN005",
        type: "update",
        title: "Tender Requirements Updated",
        message: "Requirements have been updated for 'Catering Services Annual Contract'",
        tenderId: "T005",
        tenderTitle: "Catering Services Annual Contract",
        timestamp: "2024-01-10T14:20:00Z",
        read: true,
        priority: "medium",
        actionUrl: "/vendor/tenders/T005",
      },
      {
        id: "VN006",
        type: "result",
        title: "Bid Result Available",
        message: "Results are now available for 'Security System Installation'",
        tenderId: "T004",
        tenderTitle: "Security System Installation",
        timestamp: "2024-01-10T11:30:00Z",
        read: true,
        priority: "medium",
        actionUrl: "/vendor/bids/B003",
      },
      {
        id: "VN007",
        type: "comment",
        title: "New Comment Added",
        message: "A new comment has been added to your question in 'Office Furniture Supply'",
        tenderId: "T006",
        tenderTitle: "Office Furniture Supply",
        timestamp: "2024-01-09T13:45:00Z",
        read: true,
        priority: "low",
        actionUrl: "/vendor/tenders/T006#comments",
      },
    ]

    setNotifications(vendorNotifications)
    setUnreadCount(vendorNotifications.filter((n) => !n.read).length)
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "invitation":
        return <Mail className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "update":
        return <Info className="h-4 w-4" />
      case "award":
        return <Award className="h-4 w-4" />
      case "deadline":
        return <Clock className="h-4 w-4" />
      case "result":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "text-red-600 bg-red-50"
    if (type === "award") return "text-green-600 bg-green-50"
    if (type === "deadline") return "text-orange-600 bg-orange-50"
    return "text-blue-600 bg-blue-50"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  const groupNotificationsByTime = (notifications: VendorNotification[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups = {
      unread: notifications.filter((n) => !n.read),
      today: notifications.filter((n) => n.read && new Date(n.timestamp) >= today),
      yesterday: notifications.filter(
        (n) => n.read && new Date(n.timestamp) >= yesterday && new Date(n.timestamp) < today,
      ),
      thisWeek: notifications.filter(
        (n) => n.read && new Date(n.timestamp) >= thisWeek && new Date(n.timestamp) < yesterday,
      ),
      older: notifications.filter((n) => n.read && new Date(n.timestamp) < thisWeek),
    }

    return groups
  }

  const groupedNotifications = groupNotificationsByTime(notifications)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vendor/notifications">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <CardDescription>Stay updated on your tender invitations and bids</CardDescription>
          </CardHeader>
          <Separator />
          <ScrollArea className="h-96">
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Unread Notifications */}
                  {groupedNotifications.unread.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <h4 className="text-sm font-medium text-gray-900">Unread</h4>
                      </div>
                      {groupedNotifications.unread.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 border-b cursor-pointer ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            markAsRead(notification.id)
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl
                            }
                            setIsOpen(false)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={getPriorityBadge(notification.priority)}>
                                    {notification.priority}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                              {notification.tenderTitle && (
                                <p className="text-xs text-blue-600 mb-1">Tender: {notification.tenderTitle}</p>
                              )}
                              <p className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Today */}
                  {groupedNotifications.today.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <h4 className="text-sm font-medium text-gray-900">Today</h4>
                      </div>
                      {groupedNotifications.today.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50 border-b cursor-pointer"
                          onClick={() => {
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl
                            }
                            setIsOpen(false)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                              {notification.tenderTitle && (
                                <p className="text-xs text-blue-600 mb-1">Tender: {notification.tenderTitle}</p>
                              )}
                              <p className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* This Week */}
                  {groupedNotifications.thisWeek.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <h4 className="text-sm font-medium text-gray-900">This Week</h4>
                      </div>
                      {groupedNotifications.thisWeek.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50 border-b cursor-pointer"
                          onClick={() => {
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl
                            }
                            setIsOpen(false)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                              {notification.tenderTitle && (
                                <p className="text-xs text-blue-600 mb-1">Tender: {notification.tenderTitle}</p>
                              )}
                              <p className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Older */}
                  {groupedNotifications.older.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <h4 className="text-sm font-medium text-gray-900">Older</h4>
                      </div>
                      {groupedNotifications.older.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50 border-b cursor-pointer"
                          onClick={() => {
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl
                            }
                            setIsOpen(false)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                              {notification.tenderTitle && (
                                <p className="text-xs text-blue-600 mb-1">Tender: {notification.tenderTitle}</p>
                              )}
                              <p className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </ScrollArea>
          <Separator />
          <div className="p-3">
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/vendor/notifications">View All Notifications</Link>
            </Button>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
