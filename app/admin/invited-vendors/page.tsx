"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Mail, Eye, Clock, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"

interface InvitedVendor {
  id: string
  vendorName: string
  vendorEmail: string
  tenderTitle: string
  tenderId: string
  invitedAt: string
  status: "invited" | "viewed" | "submitted" | "declined"
  bidAmount?: number
  submittedAt?: string
}

export default function InvitedVendors() {
  const [invitedVendors, setInvitedVendors] = useState<InvitedVendor[]>([
    {
      id: "1",
      vendorName: "Construction Corp",
      vendorEmail: "contact@construction.com",
      tenderTitle: "Office Building Construction",
      tenderId: "1",
      invitedAt: "2024-01-10T10:00:00Z",
      status: "submitted",
      bidAmount: 485000,
      submittedAt: "2024-01-12T10:30:00Z",
    },
    {
      id: "2",
      vendorName: "Builder Inc",
      vendorEmail: "info@builder.com",
      tenderTitle: "Office Building Construction",
      tenderId: "1",
      invitedAt: "2024-01-10T10:00:00Z",
      status: "submitted",
      bidAmount: 520000,
      submittedAt: "2024-01-13T09:15:00Z",
    },
    {
      id: "3",
      vendorName: "Elite Builders",
      vendorEmail: "hello@elite.com",
      tenderTitle: "Office Building Construction",
      tenderId: "1",
      invitedAt: "2024-01-10T10:00:00Z",
      status: "viewed",
    },
    {
      id: "4",
      vendorName: "Tech Solutions",
      vendorEmail: "contact@techsolutions.com",
      tenderTitle: "IT Infrastructure Setup",
      tenderId: "2",
      invitedAt: "2024-01-05T14:00:00Z",
      status: "submitted",
      bidAmount: 72000,
      submittedAt: "2024-01-08T16:20:00Z",
    },
    {
      id: "5",
      vendorName: "Creative Agency",
      vendorEmail: "hello@creative.com",
      tenderTitle: "Marketing Campaign Design",
      tenderId: "3",
      invitedAt: "2024-01-12T09:00:00Z",
      status: "invited",
    },
    {
      id: "6",
      vendorName: "Design Studio",
      vendorEmail: "info@designstudio.com",
      tenderTitle: "Marketing Campaign Design",
      tenderId: "3",
      invitedAt: "2024-01-12T09:00:00Z",
      status: "declined",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tenderFilter, setTenderFilter] = useState<string>("all")

  const filteredVendors = invitedVendors.filter((vendor) => {
    const matchesSearch =
      vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.vendorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.tenderTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter
    const matchesTender = tenderFilter === "all" || vendor.tenderId === tenderFilter
    return matchesSearch && matchesStatus && matchesTender
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "invited":
        return "bg-blue-100 text-blue-800"
      case "viewed":
        return "bg-yellow-100 text-yellow-800"
      case "submitted":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "invited":
        return <Mail className="h-3 w-3" />
      case "viewed":
        return <Eye className="h-3 w-3" />
      case "submitted":
        return <CheckCircle className="h-3 w-3" />
      case "declined":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleResendInvitation = (vendorId: string) => {
    // TODO: Implement resend invitation logic
    console.log("Resending invitation to vendor:", vendorId)
    alert("Invitation resent successfully!")
  }

  // Get unique tenders for filter
  const uniqueTenders = Array.from(new Set(invitedVendors.map((v) => v.tenderTitle))).map((title) => {
    const vendor = invitedVendors.find((v) => v.tenderTitle === title)
    return { id: vendor?.tenderId || "", title }
  })

  const stats = {
    totalInvited: invitedVendors.length,
    submitted: invitedVendors.filter((v) => v.status === "submitted").length,
    pending: invitedVendors.filter((v) => v.status === "invited" || v.status === "viewed").length,
    declined: invitedVendors.filter((v) => v.status === "declined").length,
  }

  return (
    <DashboardLayout userRole="admin" userName="Admin User" userEmail="admin@tms.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Invited Vendors</h1>
            <p className="text-muted-foreground">Track vendor invitations and responses across all tenders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Invited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvited}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Submitted Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Invitations</CardTitle>
            <CardDescription>Monitor all vendor invitations and their responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vendor name, email, or tender..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tenderFilter} onValueChange={setTenderFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by tender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenders</SelectItem>
                  {uniqueTenders.map((tender) => (
                    <SelectItem key={tender.id} value={tender.id}>
                      {tender.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invitations Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited Date</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Response Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.vendorName}</p>
                          <p className="text-sm text-muted-foreground">{vendor.vendorEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{vendor.tenderTitle}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(vendor.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(vendor.status)}
                            {vendor.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(vendor.invitedAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        {vendor.bidAmount ? (
                          <span className="font-medium">{formatCurrency(vendor.bidAmount)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vendor.submittedAt ? (
                          format(new Date(vendor.submittedAt), "MMM dd, yyyy")
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {vendor.status === "invited" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(vendor.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/admin/tenders/${vendor.tenderId}`}>
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
