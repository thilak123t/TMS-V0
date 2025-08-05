"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Users, Gavel, Trophy, Calendar, DollarSign, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function TenderCreatorDashboard() {
  // Mock data - replace with actual API calls
  const stats = {
    myTenders: 12,
    activeBids: 34,
    completedTenders: 8,
    totalVendors: 25,
  }

  const myTenders = [
    {
      id: "1",
      title: "Office Building Construction",
      status: "published",
      deadline: "2024-02-15",
      basePrice: 500000,
      bidsCount: 5,
      category: "open",
      createdAt: "2024-01-10",
    },
    {
      id: "2",
      title: "Marketing Campaign Design",
      status: "draft",
      deadline: "2024-02-20",
      basePrice: 25000,
      bidsCount: 0,
      category: "open",
      createdAt: "2024-01-12",
    },
    {
      id: "3",
      title: "Website Development",
      status: "awarded",
      deadline: "2024-01-25",
      basePrice: 45000,
      bidsCount: 6,
      category: "closed",
      createdAt: "2024-01-05",
    },
    {
      id: "4",
      title: "Mobile App Development",
      status: "closed",
      deadline: "2024-01-30",
      basePrice: 80000,
      bidsCount: 8,
      category: "open",
      createdAt: "2024-01-08",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "bid",
      message: "New bid submitted for Office Building Construction",
      time: "2 hours ago",
      tender: "Office Building Construction",
    },
    {
      id: 2,
      type: "bid",
      message: "Bid updated for Website Development",
      time: "4 hours ago",
      tender: "Website Development",
    },
    {
      id: 3,
      type: "comment",
      message: "New question from vendor on Mobile App Development",
      time: "6 hours ago",
      tender: "Mobile App Development",
    },
    {
      id: 4,
      type: "deadline",
      message: "Deadline approaching for Marketing Campaign Design",
      time: "1 day ago",
      tender: "Marketing Campaign Design",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "published":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-orange-100 text-orange-800"
      case "awarded":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    return category === "open" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
  }

  const tendersByStatus = [
    { status: "Draft", count: myTenders.filter((t) => t.status === "draft").length, color: "bg-gray-500" },
    { status: "Published", count: myTenders.filter((t) => t.status === "published").length, color: "bg-blue-500" },
    { status: "Closed", count: myTenders.filter((t) => t.status === "closed").length, color: "bg-orange-500" },
    { status: "Awarded", count: myTenders.filter((t) => t.status === "awarded").length, color: "bg-green-500" },
  ]

  return (
    <DashboardLayout userRole="tender-creator" userName="Tender Creator" userEmail="creator@tms.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tender Creator Dashboard</h1>
            <p className="text-muted-foreground">Manage your tenders and track vendor responses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Tenders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myTenders}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> from last month
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
                <span className="text-blue-600">+8</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTenders}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">67%</span> success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVendors}</div>
              <p className="text-xs text-muted-foreground">In the system</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Tenders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Tenders</CardTitle>
                <CardDescription>Tenders you have created and their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Bids</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myTenders.map((tender) => (
                        <TableRow key={tender.id}>
                          <TableCell className="font-medium">{tender.title}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(tender.status)}>{tender.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryBadgeColor(tender.category)}>{tender.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(tender.basePrice)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tender.bidsCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(tender.deadline), "MMM dd")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/tender-creator/tenders/${tender.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tender Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Tender Status</CardTitle>
                <CardDescription>Distribution of your tenders by status</CardDescription>
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
                      <Progress value={(item.count / myTenders.length) * 100} className="w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates on your tenders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{activity.tender}</span>
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
      </div>
    </DashboardLayout>
  )
}
