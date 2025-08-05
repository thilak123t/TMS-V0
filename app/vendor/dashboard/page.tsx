"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Clock,
  Award,
  FileText,
  Calendar,
  DollarSign,
  Target,
  Activity,
  MessageSquare,
  Bell,
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalBids: number
  wonBids: number
  pendingBids: number
  winRate: number
  totalValue: number
  avgBidValue: number
}

interface RecentActivity {
  id: string
  type: "invitation" | "comment" | "award" | "deadline"
  title: string
  description: string
  time: string
  tenderId?: string
  priority: "high" | "medium" | "low"
}

interface UpcomingDeadline {
  id: string
  tenderTitle: string
  deadline: string
  daysLeft: number
  status: "invited" | "draft" | "submitted"
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBids: 0,
    wonBids: 0,
    pendingBids: 0,
    winRate: 0,
    totalValue: 0,
    avgBidValue: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = () => {
    try {
      // Load bids data
      const bidsData = JSON.parse(localStorage.getItem("vendorBids") || "[]")
      const invitationsData = JSON.parse(localStorage.getItem("vendorInvitations") || "[]")

      // Calculate stats
      const totalBids = bidsData.length
      const wonBids = bidsData.filter((bid: any) => bid.status === "won").length
      const pendingBids = bidsData.filter((bid: any) => bid.status === "pending").length
      const winRate = totalBids > 0 ? (wonBids / totalBids) * 100 : 0
      const totalValue = bidsData.reduce((sum: number, bid: any) => sum + (bid.amount || 0), 0)
      const avgBidValue = totalBids > 0 ? totalValue / totalBids : 0

      setStats({
        totalBids,
        wonBids,
        pendingBids,
        winRate,
        totalValue,
        avgBidValue,
      })

      // Load recent activity
      const activities: RecentActivity[] = [
        {
          id: "1",
          type: "invitation",
          title: "New Tender Invitation",
          description: 'You have been invited to bid on "Office Renovation Project"',
          time: "2 hours ago",
          tenderId: "T001",
          priority: "high",
        },
        {
          id: "2",
          type: "comment",
          title: "Question Answered",
          description: "Your question about delivery timeline was answered",
          time: "4 hours ago",
          tenderId: "T002",
          priority: "medium",
        },
        {
          id: "3",
          type: "award",
          title: "Bid Won!",
          description: 'Congratulations! You won the "IT Equipment Supply" tender',
          time: "1 day ago",
          tenderId: "T003",
          priority: "high",
        },
        {
          id: "4",
          type: "deadline",
          title: "Deadline Reminder",
          description: 'Bid submission deadline is tomorrow for "Marketing Services"',
          time: "1 day ago",
          tenderId: "T004",
          priority: "high",
        },
      ]
      setRecentActivity(activities)

      // Load upcoming deadlines
      const deadlines: UpcomingDeadline[] = [
        {
          id: "1",
          tenderTitle: "Office Renovation Project",
          deadline: "2024-01-15",
          daysLeft: 3,
          status: "invited",
        },
        {
          id: "2",
          tenderTitle: "Marketing Services Contract",
          deadline: "2024-01-18",
          daysLeft: 6,
          status: "draft",
        },
        {
          id: "3",
          tenderTitle: "Security System Installation",
          deadline: "2024-01-22",
          daysLeft: 10,
          status: "invited",
        },
      ]
      setUpcomingDeadlines(deadlines)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "invitation":
        return <Bell className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "award":
        return <Award className="h-4 w-4" />
      case "deadline":
        return <Clock className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "invited":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "submitted":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="vendor" userName="Vendor User" userEmail="vendor@example.com">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="vendor" userName="Vendor User" userEmail="vendor@example.com">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600">Track your bids, manage tenders, and monitor performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBids}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingBids} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
              <Progress value={stats.winRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Bids</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wonBids}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Avg: ${stats.avgBidValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates on your tenders and bids</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    {activity.tenderId && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendor/tenders/${activity.tenderId}`}>View</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/vendor/notifications">View All Activity</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Don't miss these important submission dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{deadline.tenderTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(deadline.status)}>
                          {deadline.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(deadline.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          deadline.daysLeft <= 3
                            ? "text-red-600"
                            : deadline.daysLeft <= 7
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {deadline.daysLeft} days
                      </div>
                      <p className="text-xs text-gray-500">remaining</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/vendor/tenders">View All Tenders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your bidding performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.wonBids}</div>
                <p className="text-sm text-gray-600">Successful Bids</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.pendingBids}</div>
                <p className="text-sm text-gray-600">Pending Results</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {stats.totalBids - stats.wonBids - stats.pendingBids}
                </div>
                <p className="text-sm text-gray-600">Unsuccessful</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
