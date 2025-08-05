"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, Gavel, Trophy } from "lucide-react"

export default function AdminDashboard() {
  // Mock data - replace with actual API calls
  const stats = {
    totalUsers: 45,
    totalTenders: 23,
    activeBids: 67,
    awardedTenders: 12,
  }

  const recentActivity = [
    {
      id: 1,
      type: "bid",
      message: "New bid submitted for Construction Project Alpha",
      time: "2 hours ago",
      user: "Vendor Corp",
    },
    {
      id: 2,
      type: "tender",
      message: "New tender created: Office Renovation",
      time: "4 hours ago",
      user: "John Creator",
    },
    { id: 3, type: "user", message: "New vendor registered: Tech Solutions Ltd", time: "6 hours ago", user: "System" },
    { id: 4, type: "award", message: "Tender awarded: IT Infrastructure Setup", time: "1 day ago", user: "Admin" },
  ]

  const tendersByStatus = [
    { status: "Draft", count: 5, color: "bg-gray-500" },
    { status: "Published", count: 8, color: "bg-blue-500" },
    { status: "Closed", count: 6, color: "bg-orange-500" },
    { status: "Awarded", count: 4, color: "bg-green-500" },
  ]

  return (
    <DashboardLayout userRole="admin" userName="Admin User" userEmail="admin@tms.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your tenders.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenders}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBids}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">+23%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awarded Tenders</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.awardedTenders}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+4</span> this month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tender Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Tender Status Breakdown</CardTitle>
              <CardDescription>Current status distribution of all tenders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tendersByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                    <Progress value={(item.count / 23) * 100} className="w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your tender management system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.user}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
