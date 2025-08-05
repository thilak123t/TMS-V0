"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  DollarSign,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  FileText,
  Star,
  StarOff,
  ArrowUpDown,
} from "lucide-react"
import { format } from "date-fns"

interface Tender {
  id: string
  title: string
  description: string
  creator: string
  status: "published" | "closed" | "awarded"
  category: "open" | "closed"
  basePrice: number
  deadline: string
  createdAt: string
  myBidStatus?: "none" | "pending" | "revised" | "accepted" | "rejected"
  myBidAmount?: number
  location?: string
  favorite?: boolean
  notifications?: number
}

export default function VendorTenders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("deadline")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [tenders, setTenders] = useState<Tender[]>([
    {
      id: "9",
      title: "Community Center Construction",
      description:
        "Construction of a new community center with multipurpose halls, gymnasium, library, and meeting rooms. The facility will serve as a hub for local community activities and events.",
      creator: "City Community Development",
      status: "published",
      category: "open",
      basePrice: 850000,
      deadline: "2024-04-30", // Future date - well beyond current date
      createdAt: "2024-01-25",
      myBidStatus: "none", // No bid submitted yet
      location: "Community District",
      favorite: true,
      notifications: 2,
    },
    {
      id: "1",
      title: "Modern Office Complex Construction",
      description:
        "Construction of a 10-story modern office complex with sustainable features, smart building technology, LEED certification requirements, and underground parking for 200 vehicles.",
      creator: "Metro Development Corp",
      status: "published",
      category: "open",
      basePrice: 2500000,
      deadline: "2024-03-20",
      createdAt: "2024-01-15",
      myBidStatus: "none",
      location: "Downtown Metro City",
      favorite: false,
    },
    {
      id: "2",
      title: "Office Building Construction",
      description:
        "Complete construction of a 5-story office building with modern amenities, parking facilities, and green building standards compliance.",
      creator: "John Creator",
      status: "published",
      category: "open",
      basePrice: 500000,
      deadline: "2024-03-15",
      createdAt: "2024-01-10",
      myBidStatus: "revised",
      myBidAmount: 485000,
      location: "Business District",
      favorite: true,
      notifications: 1,
    },
    {
      id: "3",
      title: "Residential Complex Development",
      description:
        "Development of a 50-unit residential complex with amenities including swimming pool, gym, and community center.",
      creator: "Housing Authority",
      status: "awarded",
      category: "closed",
      basePrice: 1200000,
      deadline: "2024-01-30",
      createdAt: "2024-01-05",
      myBidStatus: "accepted",
      myBidAmount: 1150000,
      location: "Suburban Area",
      favorite: false,
    },
    {
      id: "4",
      title: "Shopping Mall Renovation",
      description:
        "Complete renovation of existing shopping mall including facade updates, interior modernization, and infrastructure improvements.",
      creator: "Retail Properties Inc",
      status: "closed",
      category: "open",
      basePrice: 800000,
      deadline: "2024-01-25",
      createdAt: "2024-01-01",
      myBidStatus: "rejected",
      myBidAmount: 820000,
      location: "City Center Mall",
      favorite: false,
    },
    {
      id: "5",
      title: "Hospital Wing Extension",
      description: "Extension of hospital's east wing with 30 additional patient rooms and modern medical facilities.",
      creator: "City Medical Center",
      status: "published",
      category: "closed",
      basePrice: 1800000,
      deadline: "2024-03-25",
      createdAt: "2024-01-18",
      myBidStatus: "none",
      location: "City Medical Center",
      favorite: false,
    },
    {
      id: "6",
      title: "School Cafeteria Renovation",
      description:
        "Complete renovation of school cafeteria including kitchen equipment upgrade and dining area modernization.",
      creator: "City School District",
      status: "published",
      category: "open",
      basePrice: 150000,
      deadline: "2024-03-10",
      createdAt: "2024-01-20",
      myBidStatus: "pending",
      myBidAmount: 145000,
      location: "Lincoln Elementary School",
      favorite: false,
      notifications: 3,
    },
    {
      id: "7",
      title: "Warehouse Construction",
      description: "Construction of a 50,000 sq ft warehouse facility with loading docks and office space.",
      creator: "Logistics Corp",
      status: "published",
      category: "closed",
      basePrice: 750000,
      deadline: "2024-03-28",
      createdAt: "2024-01-22",
      myBidStatus: "none",
      location: "Industrial District",
      favorite: false,
    },
    {
      id: "8",
      title: "Bridge Repair Project",
      description: "Structural repairs and maintenance of the downtown bridge including deck replacement and painting.",
      creator: "City Public Works",
      status: "closed",
      category: "open",
      basePrice: 300000,
      deadline: "2024-01-20",
      createdAt: "2023-12-15",
      myBidStatus: "rejected",
      myBidAmount: 295000,
      location: "Downtown Bridge",
      favorite: false,
    },
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getBidStatusIcon = (status?: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "revised":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getBidStatusBadge = (status?: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Won</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Lost</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
      case "revised":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Revised</Badge>
      case "none":
        return <Badge variant="outline">Not Bid</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const toggleFavorite = (id: string) => {
    setTenders(tenders.map((tender) => (tender.id === id ? { ...tender, favorite: !tender.favorite } : tender)))
  }

  const sortTenders = (a: Tender, b: Tender) => {
    let comparison = 0

    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title)
        break
      case "deadline":
        comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        break
      case "basePrice":
        comparison = a.basePrice - b.basePrice
        break
      case "status":
        comparison = (a.status || "").localeCompare(b.status || "")
        break
      default:
        comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    }

    return sortOrder === "asc" ? comparison : -comparison
  }

  const filteredTenders = tenders
    .filter((tender) => {
      const matchesSearch =
        tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || tender.status === statusFilter
      const matchesCategory = categoryFilter === "all" || tender.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort(sortTenders)

  const activeTenders = filteredTenders.filter((t) => t.status === "published")
  const completedTenders = filteredTenders.filter((t) => t.status === "closed" || t.status === "awarded")
  const myBids = filteredTenders.filter((t) => t.myBidStatus && t.myBidStatus !== "none")
  const favoriteTenders = filteredTenders.filter((t) => t.favorite)

  const getDaysUntilDeadline = (deadline: string) => {
    return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const renderSortIcon = (column: string) => {
    if (sortBy === column) {
      return <span className="ml-1 inline-block">{sortOrder === "asc" ? "↑" : "↓"}</span>
    }
    return null
  }

  const renderTenderRow = (tender: Tender) => (
    <TableRow key={tender.id} className="hover:bg-gray-50">
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFavorite(tender.id)}>
            {tender.favorite ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="sr-only">{tender.favorite ? "Remove from favorites" : "Add to favorites"}</span>
          </Button>
          <div className="space-y-1">
            <Link
              href={`/vendor/tenders/${tender.id}`}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              {tender.title}
              {tender.notifications && (
                <Badge className="ml-2 bg-red-100 text-red-800 border-red-300">{tender.notifications} new</Badge>
              )}
            </Link>
            <p className="text-sm text-muted-foreground">{tender.creator}</p>
            {tender.location && <p className="text-xs text-muted-foreground">📍 {tender.location}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={tender.category === "open" ? "border-green-500" : "border-purple-500"}>
            {tender.category}
          </Badge>
          <Badge
            variant="outline"
            className={
              tender.status === "published"
                ? "border-blue-500"
                : tender.status === "awarded"
                  ? "border-green-500"
                  : "border-gray-500"
            }
          >
            {tender.status}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="font-medium">{formatCurrency(tender.basePrice)}</TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="text-sm">{format(new Date(tender.deadline), "MMM dd, yyyy")}</p>
          {tender.status === "published" && (
            <p className={`text-xs ${getDaysUntilDeadline(tender.deadline) <= 3 ? "text-red-600" : "text-green-600"}`}>
              {getDaysUntilDeadline(tender.deadline) > 0
                ? `${getDaysUntilDeadline(tender.deadline)} days left`
                : "Expired"}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getBidStatusIcon(tender.myBidStatus)}
          {getBidStatusBadge(tender.myBidStatus)}
        </div>
        {tender.myBidAmount && (
          <p className="text-xs text-muted-foreground mt-1">{formatCurrency(tender.myBidAmount)}</p>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Link href={`/vendor/tenders/${tender.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          {tender.myBidStatus && tender.myBidStatus !== "none" && (
            <Link href={`/vendor/bids?tenderId=${tender.id}`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Bid
              </Button>
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <DashboardLayout userRole="vendor" userName="Vendor User" userEmail="vendor@tms.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Available Tenders</h1>
            <p className="text-muted-foreground">Browse and bid on available tenders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenders.length}</div>
              <p className="text-xs text-muted-foreground">Available for bidding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Bids</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myBids.length}</div>
              <p className="text-xs text-muted-foreground">Total submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Tenders</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myBids.filter((t) => t.myBidStatus === "accepted").length}</div>
              <p className="text-xs text-muted-foreground">Successfully awarded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  myBids.filter((t) => t.myBidStatus === "accepted").reduce((sum, t) => sum + (t.myBidAmount || 0), 0),
                )}
              </div>
              <p className="text-xs text-muted-foreground">Won contracts value</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Sorting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenders..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="open">Open Bidding</SelectItem>
                  <SelectItem value="closed">Closed Bidding</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="basePrice">Base Price</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="w-10 h-10"
              >
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""} transition-transform`} />
                <span className="sr-only">Toggle sort order</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tenders Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tenders ({filteredTenders.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeTenders.length})</TabsTrigger>
            <TabsTrigger value="favorites">Favorites ({favoriteTenders.length})</TabsTrigger>
            <TabsTrigger value="mybids">My Bids ({myBids.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTenders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Tenders</CardTitle>
                <CardDescription>Complete list of all available tenders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                          Tender Details {renderSortIcon("title")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                          Category & Status {renderSortIcon("status")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("basePrice")}>
                          Base Price {renderSortIcon("basePrice")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("deadline")}>
                          Deadline {renderSortIcon("deadline")}
                        </TableHead>
                        <TableHead>My Bid Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTenders.length > 0 ? (
                        filteredTenders.map(renderTenderRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No tenders found matching your criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Tenders</CardTitle>
                <CardDescription>Tenders currently accepting bids</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                          Tender Details {renderSortIcon("title")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                          Category & Status {renderSortIcon("status")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("basePrice")}>
                          Base Price {renderSortIcon("basePrice")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("deadline")}>
                          Deadline {renderSortIcon("deadline")}
                        </TableHead>
                        <TableHead>My Bid Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTenders.length > 0 ? (
                        activeTenders.map(renderTenderRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No active tenders available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Tenders</CardTitle>
                <CardDescription>Tenders you've marked as favorites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                          Tender Details {renderSortIcon("title")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                          Category & Status {renderSortIcon("status")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("basePrice")}>
                          Base Price {renderSortIcon("basePrice")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("deadline")}>
                          Deadline {renderSortIcon("deadline")}
                        </TableHead>
                        <TableHead>My Bid Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {favoriteTenders.length > 0 ? (
                        favoriteTenders.map(renderTenderRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            You haven't marked any tenders as favorites yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Tenders</CardTitle>
                <CardDescription>Tenders that have been closed or awarded</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                          Tender Details {renderSortIcon("title")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                          Category & Status {renderSortIcon("status")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("basePrice")}>
                          Base Price {renderSortIcon("basePrice")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("deadline")}>
                          Deadline {renderSortIcon("deadline")}
                        </TableHead>
                        <TableHead>My Bid Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedTenders.length > 0 ? (
                        completedTenders.map(renderTenderRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No completed tenders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mybids">
            <Card>
              <CardHeader>
                <CardTitle>My Bids</CardTitle>
                <CardDescription>Tenders where you have submitted bids</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                          Tender Details {renderSortIcon("title")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                          Category & Status {renderSortIcon("status")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("basePrice")}>
                          Base Price {renderSortIcon("basePrice")}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("deadline")}>
                          Deadline {renderSortIcon("deadline")}
                        </TableHead>
                        <TableHead>My Bid Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myBids.length > 0 ? (
                        myBids.map(renderTenderRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            You haven't submitted any bids yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
