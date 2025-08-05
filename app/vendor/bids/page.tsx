"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  DollarSign,
  FileText,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  Download,
  MessageSquare,
  Target,
  ArrowUpDown,
  Edit,
  Trash2,
  Upload,
  X,
  AlertCircle,
  Calendar,
  Building,
  Tag,
  Star,
  StarOff,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface VendorBid {
  id: string
  tenderId: string
  tenderTitle: string
  category: string
  basePrice: number
  bidAmount: number
  bidDate: string
  deadline: string
  status: "pending" | "won" | "lost" | "revised"
  ranking?: number
  totalBidders: number
  variance: number
  documents: string[]
  notes: string
  submissionTime: string
  evaluationCriteria: {
    price: number
    technical: number
    experience: number
    timeline: number
  }
  scores?: {
    price: number
    technical: number
    experience: number
    timeline: number
    total: number
  }
  favorite?: boolean
  notifications?: number
  feedback?: string
  canRevise?: boolean
}

interface BidStats {
  totalBids: number
  wonBids: number
  lostBids: number
  pendingBids: number
  winRate: number
  totalValue: number
  avgBidValue: number
  bestRanking: number
}

export default function VendorBids() {
  const searchParams = useSearchParams()
  const tenderId = searchParams.get("tenderId")
  const { toast } = useToast()

  const [bids, setBids] = useState<VendorBid[]>([])
  const [filteredBids, setFilteredBids] = useState<VendorBid[]>([])
  const [stats, setStats] = useState<BidStats>({
    totalBids: 0,
    wonBids: 0,
    lostBids: 0,
    pendingBids: 0,
    winRate: 0,
    totalValue: 0,
    avgBidValue: 0,
    bestRanking: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("bidDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedBid, setSelectedBid] = useState<VendorBid | null>(null)

  // Revision form state
  const [isRevising, setIsRevising] = useState(false)
  const [revisedAmount, setRevisedAmount] = useState("")
  const [revisedNotes, setRevisedNotes] = useState("")
  const [revisedDocuments, setRevisedDocuments] = useState<File[]>([])
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false)

  // Withdrawal state
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  useEffect(() => {
    loadBids()
  }, [])

  useEffect(() => {
    filterBids()
    calculateStats()
  }, [bids, searchTerm, statusFilter, categoryFilter, activeTab, sortBy, sortOrder])

  useEffect(() => {
    // If tenderId is provided in URL, filter to that specific bid
    if (tenderId) {
      const specificBid = bids.find((bid) => bid.tenderId === tenderId)
      if (specificBid) {
        setSelectedBid(specificBid)
      }
    }
  }, [tenderId, bids])

  const loadBids = () => {
    try {
      // Load vendor bids data
      const vendorBids: VendorBid[] = [
        {
          id: "B001",
          tenderId: "2",
          tenderTitle: "Office Building Construction",
          category: "Construction",
          basePrice: 500000,
          bidAmount: 485000,
          bidDate: "2024-01-12",
          deadline: "2024-03-15",
          status: "revised",
          ranking: 2,
          totalBidders: 8,
          variance: -3.0,
          documents: ["technical_proposal.pdf", "pricing_breakdown.xlsx", "company_profile.pdf"],
          notes: "Competitive pricing with premium materials and accelerated timeline.",
          submissionTime: "2024-01-12T14:30:00Z",
          evaluationCriteria: {
            price: 40,
            technical: 30,
            experience: 20,
            timeline: 10,
          },
          scores: {
            price: 38,
            technical: 28,
            experience: 18,
            timeline: 9,
            total: 93,
          },
          favorite: true,
          notifications: 1,
          feedback: "Your technical proposal is strong, but we'd like to see more detail on the timeline.",
          canRevise: true,
        },
        {
          id: "B002",
          tenderId: "3",
          tenderTitle: "Residential Complex Development",
          category: "Construction",
          basePrice: 1200000,
          bidAmount: 1150000,
          bidDate: "2024-01-08",
          deadline: "2024-01-30",
          status: "won",
          ranking: 1,
          totalBidders: 15,
          variance: -4.2,
          documents: ["residential_proposal.pdf", "project_timeline.pdf", "team_credentials.pdf"],
          notes: "Comprehensive residential development with sustainable features.",
          submissionTime: "2024-01-08T16:45:00Z",
          evaluationCriteria: {
            price: 35,
            technical: 35,
            experience: 25,
            timeline: 5,
          },
          scores: {
            price: 33,
            technical: 35,
            experience: 24,
            timeline: 5,
            total: 97,
          },
          favorite: true,
          feedback: "Excellent proposal with strong sustainability features. Your team's experience was a key factor.",
        },
        {
          id: "B003",
          tenderId: "4",
          tenderTitle: "Shopping Mall Renovation",
          category: "Renovation",
          basePrice: 800000,
          bidAmount: 820000,
          bidDate: "2024-01-03",
          deadline: "2024-01-25",
          status: "lost",
          ranking: 5,
          totalBidders: 10,
          variance: 2.5,
          documents: ["renovation_proposal.pdf", "phased_approach.pdf"],
          notes: "Detailed renovation plan with minimal business disruption.",
          submissionTime: "2024-01-03T11:20:00Z",
          evaluationCriteria: {
            price: 50,
            technical: 25,
            experience: 15,
            timeline: 10,
          },
          scores: {
            price: 35,
            technical: 23,
            experience: 14,
            timeline: 8,
            total: 80,
          },
          favorite: false,
          feedback: "Your bid was higher than competitors and lacked detail on cost-saving measures.",
        },
        {
          id: "B004",
          tenderId: "6",
          tenderTitle: "School Cafeteria Renovation",
          category: "Renovation",
          basePrice: 150000,
          bidAmount: 145000,
          bidDate: "2024-01-21",
          deadline: "2024-03-10",
          status: "pending",
          ranking: 3,
          totalBidders: 7,
          variance: -3.3,
          documents: ["cafeteria_proposal.pdf", "equipment_timeline.xlsx"],
          notes: "Cost-effective renovation with modern equipment and quick turnaround.",
          submissionTime: "2024-01-21T09:15:00Z",
          evaluationCriteria: {
            price: 45,
            technical: 25,
            experience: 20,
            timeline: 10,
          },
          favorite: false,
          notifications: 3,
          canRevise: true,
        },
        {
          id: "B005",
          tenderId: "9",
          tenderTitle: "Community Center Construction",
          category: "Construction",
          basePrice: 850000,
          bidAmount: 830000,
          bidDate: "2024-01-28",
          deadline: "2024-04-30",
          status: "pending",
          totalBidders: 5,
          variance: -2.4,
          documents: ["community_center_proposal.pdf", "construction_timeline.pdf", "sustainability_plan.pdf"],
          notes: "Comprehensive proposal with community engagement plan and sustainable design elements.",
          submissionTime: "2024-01-28T15:30:00Z",
          evaluationCriteria: {
            price: 30,
            technical: 40,
            experience: 20,
            timeline: 10,
          },
          favorite: false,
          notifications: 2,
          canRevise: true,
        },
      ]

      setBids(vendorBids)
    } catch (error) {
      console.error("Error loading bids:", error)
      toast({
        title: "Error",
        description: "Failed to load bid data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalBids = bids.length
    const wonBids = bids.filter((bid) => bid.status === "won").length
    const lostBids = bids.filter((bid) => bid.status === "lost").length
    const pendingBids = bids.filter((bid) => bid.status === "pending" || bid.status === "revised").length
    const winRate = totalBids > 0 ? (wonBids / (wonBids + lostBids)) * 100 : 0
    const totalValue = bids.reduce((sum, bid) => sum + bid.bidAmount, 0)
    const avgBidValue = totalBids > 0 ? totalValue / totalBids : 0
    const bestRanking = Math.min(...bids.filter((bid) => bid.ranking).map((bid) => bid.ranking!))

    setStats({
      totalBids,
      wonBids,
      lostBids,
      pendingBids,
      winRate,
      totalValue,
      avgBidValue,
      bestRanking: bestRanking === Number.POSITIVE_INFINITY ? 0 : bestRanking,
    })
  }

  const filterBids = () => {
    let filtered = bids

    // Filter by active tab
    if (activeTab !== "all") {
      if (activeTab === "pending") {
        filtered = filtered.filter((bid) => bid.status === "pending" || bid.status === "revised")
      } else {
        filtered = filtered.filter((bid) => bid.status === activeTab)
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (bid) =>
          bid.tenderTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bid.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bid.notes.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter((bid) => bid.status === "pending" || bid.status === "revised")
      } else {
        filtered = filtered.filter((bid) => bid.status === statusFilter)
      }
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((bid) => bid.category === categoryFilter)
    }

    // Sort bids
    filtered = filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "tenderTitle":
          comparison = a.tenderTitle.localeCompare(b.tenderTitle)
          break
        case "bidDate":
          comparison = new Date(a.bidDate).getTime() - new Date(b.bidDate).getTime()
          break
        case "bidAmount":
          comparison = a.bidAmount - b.bidAmount
          break
        case "deadline":
          comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = new Date(a.bidDate).getTime() - new Date(b.bidDate).getTime()
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredBids(filtered)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "won":
        return <CheckCircle className="h-4 w-4" />
      case "lost":
        return <XCircle className="h-4 w-4" />
      case "revised":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "won":
        return "bg-green-100 text-green-800"
      case "lost":
        return "bg-red-100 text-red-800"
      case "revised":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-red-600"
    if (variance < 0) return "text-green-600"
    return "text-gray-600"
  }

  const getRankingColor = (ranking: number, total: number) => {
    const percentage = ranking / total
    if (percentage <= 0.3) return "text-green-600"
    if (percentage <= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const categories = [...new Set(bids.map((bid) => bid.category))]

  const getTabCounts = () => {
    return {
      all: bids.length,
      pending: bids.filter((b) => b.status === "pending" || b.status === "revised").length,
      won: bids.filter((b) => b.status === "won").length,
      lost: bids.filter((b) => b.status === "lost").length,
    }
  }

  const tabCounts = getTabCounts()

  const toggleFavorite = (id: string) => {
    setBids(bids.map((bid) => (bid.id === id ? { ...bid, favorite: !bid.favorite } : bid)))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setRevisedDocuments((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setRevisedDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitRevision = async () => {
    if (!revisedAmount) {
      toast({
        title: "Error",
        description: "Please enter a revised bid amount",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(revisedAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingRevision(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update the bid in the local state
      if (selectedBid) {
        const updatedBids = bids.map((bid) =>
          bid.id === selectedBid.id
            ? {
                ...bid,
                bidAmount: amount,
                notes: revisedNotes || bid.notes,
                status: "revised" as const,
                submissionTime: new Date().toISOString(),
                documents: [...bid.documents, ...revisedDocuments.map((file) => file.name)].filter(
                  (doc, index, self) => self.indexOf(doc) === index,
                ), // Remove duplicates
              }
            : bid,
        )

        setBids(updatedBids)

        // Update the selected bid
        const updatedBid = updatedBids.find((bid) => bid.id === selectedBid.id)
        if (updatedBid) {
          setSelectedBid(updatedBid)
        }
      }

      toast({
        title: "Revision Submitted",
        description: "Your bid revision has been submitted successfully.",
      })

      // Reset form
      setRevisedAmount("")
      setRevisedNotes("")
      setRevisedDocuments([])
      setIsRevising(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit revision. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingRevision(false)
    }
  }

  const handleWithdrawBid = async () => {
    if (!withdrawalReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for withdrawal",
        variant: "destructive",
      })
      return
    }

    setIsWithdrawing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Remove the bid from the local state
      if (selectedBid) {
        setBids(bids.filter((bid) => bid.id !== selectedBid.id))
        setSelectedBid(null)
      }

      toast({
        title: "Bid Withdrawn",
        description: "Your bid has been withdrawn successfully.",
      })

      // Reset and close dialog
      setWithdrawalReason("")
      setWithdrawalDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to withdraw bid. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout userRole="vendor" userName="Vendor User" userEmail="vendor@example.com">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
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
          <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
          <p className="text-gray-600">Track and manage all your bid submissions</p>
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
              <p className="text-xs text-muted-foreground">{stats.pendingBids} pending results</p>
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
              <p className="text-xs text-muted-foreground">Best ranking: #{stats.bestRanking || "N/A"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">Avg: {formatCurrency(stats.avgBidValue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search bids..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending & Revised</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bidDate">Bid Date</SelectItem>
                  <SelectItem value="tenderTitle">Tender Title</SelectItem>
                  <SelectItem value="bidAmount">Bid Amount</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({tabCounts.pending})</TabsTrigger>
            <TabsTrigger value="won">Won ({tabCounts.won})</TabsTrigger>
            <TabsTrigger value="lost">Lost ({tabCounts.lost})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredBids.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
                    <p className="text-gray-600">
                      {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "You haven't submitted any bids yet"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBids.map((bid) => (
                  <Card key={bid.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-lg">{bid.tenderTitle}</CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleFavorite(bid.id)}
                            >
                              {bid.favorite ? (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              ) : (
                                <StarOff className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="sr-only">
                                {bid.favorite ? "Remove from favorites" : "Add to favorites"}
                              </span>
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={getStatusColor(bid.status)}>
                              {getStatusIcon(bid.status)}
                              <span className="ml-1 capitalize">{bid.status}</span>
                            </Badge>
                            <Badge variant="outline">{bid.category}</Badge>
                            {bid.notifications && (
                              <Badge className="bg-red-100 text-red-800 border-red-300">{bid.notifications} new</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Pricing Information */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Base Price:</span>
                          <span className="font-medium">{formatCurrency(bid.basePrice)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Your Bid:</span>
                          <span className="font-medium">{formatCurrency(bid.bidAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Variance:</span>
                          <span className={`font-medium flex items-center gap-1 ${getVarianceColor(bid.variance)}`}>
                            {bid.variance > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {bid.variance > 0 ? "+" : ""}
                            {bid.variance}%
                          </span>
                        </div>

                        {/* Ranking Information */}
                        {bid.ranking && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Ranking:</span>
                            <span className={`font-medium ${getRankingColor(bid.ranking, bid.totalBidders)}`}>
                              #{bid.ranking} of {bid.totalBidders}
                            </span>
                          </div>
                        )}

                        {/* Score Information */}
                        {bid.scores && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Score:</span>
                            <span className="font-medium">{bid.scores.total}/100</span>
                          </div>
                        )}

                        {/* Submission Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Submitted:</span>
                          <span className="text-sm">{new Date(bid.bidDate).toLocaleDateString()}</span>
                        </div>

                        {/* Documents */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Documents:</span>
                          <span className="text-sm">{bid.documents.length} files</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t space-y-2">
                          <Button
                            variant="outline"
                            className="w-full bg-transparent"
                            onClick={() => setSelectedBid(bid)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button asChild className="w-full">
                            <Link href={`/vendor/tenders/${bid.tenderId}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              View Tender
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Bid Details Dialog */}
        {selectedBid && (
          <Dialog open={!!selectedBid} onOpenChange={(open) => !open && setSelectedBid(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedBid.tenderTitle}</span>
                  <Badge variant="outline" className={getStatusColor(selectedBid.status)}>
                    {getStatusIcon(selectedBid.status)}
                    <span className="ml-1 capitalize">{selectedBid.status}</span>
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Bid submitted on {new Date(selectedBid.bidDate).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Bid Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(selectedBid.bidAmount)}</div>
                    <div className="text-sm text-gray-600">Bid Amount</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getVarianceColor(selectedBid.variance)}`}>
                      {selectedBid.variance > 0 ? "+" : ""}
                      {selectedBid.variance}%
                    </div>
                    <div className="text-sm text-gray-600">Variance</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">#{selectedBid.ranking || "N/A"}</div>
                    <div className="text-sm text-gray-600">Ranking</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedBid.scores?.total || "N/A"}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>

                {/* Tender Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tender Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-medium">{selectedBid.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Deadline</p>
                        <p className="font-medium">{format(new Date(selectedBid.deadline), "PPP")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Base Price</p>
                        <p className="font-medium">{formatCurrency(selectedBid.basePrice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total Bidders</p>
                        <p className="font-medium">{selectedBid.totalBidders}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluation Scores */}
                {selectedBid.scores && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Evaluation Scores</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Price ({selectedBid.evaluationCriteria.price}%)</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(selectedBid.scores.price / selectedBid.evaluationCriteria.price) * 100}
                            className="w-24"
                          />
                          <span className="font-medium">
                            {selectedBid.scores.price}/{selectedBid.evaluationCriteria.price}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Technical ({selectedBid.evaluationCriteria.technical}%)</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(selectedBid.scores.technical / selectedBid.evaluationCriteria.technical) * 100}
                            className="w-24"
                          />
                          <span className="font-medium">
                            {selectedBid.scores.technical}/{selectedBid.evaluationCriteria.technical}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Experience ({selectedBid.evaluationCriteria.experience}%)</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(selectedBid.scores.experience / selectedBid.evaluationCriteria.experience) * 100}
                            className="w-24"
                          />
                          <span className="font-medium">
                            {selectedBid.scores.experience}/{selectedBid.evaluationCriteria.experience}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Timeline ({selectedBid.evaluationCriteria.timeline}%)</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(selectedBid.scores.timeline / selectedBid.evaluationCriteria.timeline) * 100}
                            className="w-24"
                          />
                          <span className="font-medium">
                            {selectedBid.scores.timeline}/{selectedBid.evaluationCriteria.timeline}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {selectedBid.feedback && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Feedback</h3>
                    <Alert
                      className={`${selectedBid.status === "won" ? "bg-green-50" : selectedBid.status === "lost" ? "bg-red-50" : "bg-blue-50"}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{selectedBid.feedback}</AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Submitted Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedBid.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Bid Notes</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedBid.notes}</p>
                  </div>
                </div>

                {/* Submission Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Submission Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Submission Time:</span>
                      <div className="font-medium">{new Date(selectedBid.submissionTime).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Deadline:</span>
                      <div className="font-medium">{new Date(selectedBid.deadline).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-3 justify-end">
                    {selectedBid.canRevise &&
                      (selectedBid.status === "pending" || selectedBid.status === "revised") && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRevisedAmount(selectedBid.bidAmount.toString())
                            setRevisedNotes(selectedBid.notes)
                            setIsRevising(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Revise Bid
                        </Button>
                      )}

                    {(selectedBid.status === "pending" || selectedBid.status === "revised") && (
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={() => setWithdrawalDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Withdraw Bid
                      </Button>
                    )}

                    <Button asChild>
                      <Link href={`/vendor/tenders/${selectedBid.tenderId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Tender
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Revision Dialog */}
        <Dialog open={isRevising} onOpenChange={(open) => !open && setIsRevising(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Revise Bid</DialogTitle>
              <DialogDescription>Update your bid details for {selectedBid?.tenderTitle}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revisedAmount">Revised Bid Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="revisedAmount"
                    type="number"
                    placeholder="Enter your revised bid amount"
                    className="pl-9"
                    value={revisedAmount}
                    onChange={(e) => setRevisedAmount(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Current bid: {selectedBid ? formatCurrency(selectedBid.bidAmount) : ""}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revisedNotes">Revised Notes</Label>
                <Textarea
                  id="revisedNotes"
                  placeholder="Add any notes about your revised bid..."
                  value={revisedNotes}
                  onChange={(e) => setRevisedNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Documents</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <Label htmlFor="revision-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">Upload files</span>
                  </Label>
                  <Input id="revision-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS up to 10MB each</p>
                </div>

                {revisedDocuments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {revisedDocuments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRevising(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRevision} disabled={!revisedAmount || isSubmittingRevision}>
                {isSubmittingRevision ? "Submitting..." : "Submit Revision"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdrawal Dialog */}
        <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Withdraw Bid</DialogTitle>
              <DialogDescription>
                Are you sure you want to withdraw your bid for {selectedBid?.tenderTitle}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawalReason">Reason for Withdrawal</Label>
                <Textarea
                  id="withdrawalReason"
                  placeholder="Please provide a reason for withdrawing your bid..."
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWithdrawalDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleWithdrawBid}
                disabled={!withdrawalReason.trim() || isWithdrawing}
              >
                {isWithdrawing ? "Processing..." : "Withdraw Bid"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
