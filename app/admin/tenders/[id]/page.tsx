"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Users,
  MessageSquare,
  Trophy,
  Clock,
  Download,
  Send,
  CheckCircle,
} from "lucide-react"
import { format } from "date-fns"

interface Bid {
  id: string
  vendorName: string
  vendorEmail: string
  amount: number
  submittedAt: string
  revisedAt?: string
  documents: string[]
  status: "pending" | "revised" | "selected" | "rejected"
}

interface Comment {
  id: string
  author: string
  role: "admin" | "vendor" | "tender-creator"
  message: string
  timestamp: string
}

export default function TenderDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [newComment, setNewComment] = useState("")
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  const [isAwarding, setIsAwarding] = useState(false)
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Construction Corp",
      role: "vendor",
      message: "Could you please clarify the specific requirements for the parking structure foundation?",
      timestamp: "2024-01-13T11:30:00Z",
    },
    {
      id: "2",
      author: "Admin User",
      role: "admin",
      message:
        "The foundation should be reinforced concrete with a minimum depth of 8 feet. Please refer to attachment 2 for detailed specifications.",
      timestamp: "2024-01-13T14:20:00Z",
    },
    {
      id: "3",
      author: "Builder Inc",
      role: "vendor",
      message: "What is the expected timeline for material delivery approvals?",
      timestamp: "2024-01-14T09:45:00Z",
    },
  ])

  // Mock data - replace with API calls
  const tender = {
    id: params.id,
    title: "Office Building Construction",
    description:
      "Complete construction of a 5-story office building with modern amenities, parking facilities, and green building standards compliance.",
    creator: "John Creator",
    status: "published" as const,
    category: "open" as const,
    basePrice: 500000,
    deadline: "2024-02-15",
    duration: "180",
    createdAt: "2024-01-10",
    attachments: ["project_specs.pdf", "site_plan.dwg", "requirements.docx"],
  }

  const [tenderStatus, setTenderStatus] = useState(tender.status)

  const bids: Bid[] = [
    {
      id: "1",
      vendorName: "Construction Corp",
      vendorEmail: "contact@construction.com",
      amount: 485000,
      submittedAt: "2024-01-12T10:30:00Z",
      revisedAt: "2024-01-14T15:20:00Z",
      documents: ["proposal.pdf", "timeline.xlsx"],
      status: "revised",
    },
    {
      id: "2",
      vendorName: "Builder Inc",
      vendorEmail: "info@builder.com",
      amount: 520000,
      submittedAt: "2024-01-13T09:15:00Z",
      documents: ["bid_proposal.pdf"],
      status: "pending",
    },
    {
      id: "3",
      vendorName: "Elite Builders",
      vendorEmail: "hello@elite.com",
      amount: 475000,
      submittedAt: "2024-01-14T14:45:00Z",
      documents: ["detailed_proposal.pdf", "certifications.pdf"],
      status: "pending",
    },
  ]

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

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "revised":
        return "bg-blue-100 text-blue-800"
      case "selected":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: Date.now().toString(),
        author: "Admin User",
        role: "admin" as const,
        message: newComment,
        timestamp: new Date().toISOString(),
      }

      setComments((prev) => [...prev, newCommentObj])
      console.log("Adding comment:", newCommentObj)
      setNewComment("")
    }
  }

  const handleAwardTender = async () => {
    if (!selectedWinner) return

    setIsAwarding(true)
    try {
      // TODO: Award tender via API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update tender status to awarded
      setTenderStatus("awarded")

      // Save the status update to localStorage so the list view can pick it up
      localStorage.setItem(
        "updatedTenderStatus",
        JSON.stringify({
          tenderId: params.id,
          status: "awarded",
        }),
      )

      // Find the winning bid and update its status
      const winningBid = bids.find((bid) => bid.id === selectedWinner)
      console.log("Awarding tender to:", winningBid?.vendorName)

      // Close the dialog
      setSelectedWinner(null)

      // Show success message
      alert(`Tender awarded to ${winningBid?.vendorName}!`)

      // Navigate back to tender list after a short delay
      setTimeout(() => {
        router.push("/admin/tenders")
      }, 1000)
    } catch (error) {
      console.error("Error awarding tender:", error)
    } finally {
      setIsAwarding(false)
    }
  }

  const lowestBid = Math.min(...bids.map((bid) => bid.amount))
  const averageBid = bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length

  return (
    <DashboardLayout userRole="admin" userName="Admin User" userEmail="admin@tms.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{tender.title}</h1>
              <p className="text-muted-foreground">Created by {tender.creator}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(tenderStatus)}>{tenderStatus}</Badge>
            {tenderStatus === "published" && bids.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Trophy className="mr-2 h-4 w-4" />
                    Award Tender
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Award Tender</DialogTitle>
                    <DialogDescription>
                      Select the winning bid for this tender. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {bids.map((bid) => (
                      <div
                        key={bid.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedWinner === bid.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                        onClick={() => setSelectedWinner(bid.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{bid.vendorName}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(bid.amount)}</p>
                          </div>
                          {selectedWinner === bid.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedWinner(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAwardTender} disabled={!selectedWinner || isAwarding}>
                      {isAwarding ? "Awarding..." : "Award Tender"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tender Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tender Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Base Price</p>
                      <p className="font-medium">{formatCurrency(tender.basePrice)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-medium">{format(new Date(tender.deadline), "PPP")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{tender.duration} days</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{tender.description}</p>
                </div>

                {tender.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {tender.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file}</span>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bids */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Vendor Bids ({bids.length})
                </CardTitle>
                <CardDescription>
                  {tender.category === "open"
                    ? "Open bidding - all bids are visible"
                    : "Closed bidding - bids are private"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Bid Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Documents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.map((bid) => (
                        <TableRow key={bid.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{bid.vendorName}</p>
                              <p className="text-sm text-muted-foreground">{bid.vendorEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatCurrency(bid.amount)}</p>
                              {bid.amount === lowestBid && (
                                <Badge variant="outline" className="text-xs">
                                  Lowest
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getBidStatusColor(bid.status)}>{bid.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{format(new Date(bid.submittedAt), "PPp")}</p>
                              {bid.revisedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Revised: {format(new Date(bid.revisedAt), "PPp")}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {bid.documents.map((doc, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span className="text-xs">{doc}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments & Queries
                </CardTitle>
                <CardDescription>Communication thread for this tender</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{comment.author}</p>
                          <Badge variant="outline" className="text-xs">
                            {comment.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{format(new Date(comment.timestamp), "PPp")}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment or respond to queries..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bid Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Bid Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Bids</span>
                  <span className="font-medium">{bids.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Lowest Bid</span>
                  <span className="font-medium">{formatCurrency(lowestBid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Bid</span>
                  <span className="font-medium">{formatCurrency(averageBid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Base Price</span>
                  <span className="font-medium">{formatCurrency(tender.basePrice)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tender.createdAt), "PPp")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Published</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tender.createdAt), "PPp")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    <div>
                      <p className="text-sm text-muted-foreground">Closed</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    <div>
                      <p className="text-sm text-muted-foreground">Awarded</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
