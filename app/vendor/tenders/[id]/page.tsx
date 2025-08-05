"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  X,
  Send,
  MessageSquare,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface TenderData {
  id: string
  title: string
  description: string
  creator: string
  status: "published" | "closed" | "awarded"
  category: "open" | "closed"
  basePrice: number
  deadline: string
  duration: string
  createdAt: string
  attachments: string[]
  requirements: string[]
  location?: string
  contactPerson?: string
  contactEmail?: string
}

interface MyBidData {
  id: string
  amount: number
  submittedAt: string
  revisedAt?: string
  documents: string[]
  status: "pending" | "revised" | "accepted" | "rejected"
  notes?: string
}

interface OtherBid {
  id: string
  vendorName: string
  amount: number
  submittedAt: string
  ranking?: number
}

interface Comment {
  id: string
  author: string
  role: "admin" | "vendor" | "tender-creator"
  message: string
  timestamp: string
}

export default function VendorTenderDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [bidAmount, setBidAmount] = useState("")
  const [bidDocuments, setBidDocuments] = useState<File[]>([])
  const [bidNotes, setBidNotes] = useState("")
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get tender data based on ID
  const getTenderData = (id: string): TenderData => {
    const tenderDatabase: Record<string, TenderData> = {
      "1": {
        id: "1",
        title: "Modern Office Complex Construction",
        description:
          "Construction of a 10-story modern office complex with sustainable features, smart building technology, LEED certification requirements, and underground parking for 200 vehicles. The project includes modern amenities such as fitness center, cafeteria, and rooftop garden.",
        creator: "Metro Development Corp",
        status: "published",
        category: "open",
        basePrice: 2500000,
        deadline: "2024-03-20",
        duration: "365",
        createdAt: "2024-01-15",
        attachments: [
          "project_specifications.pdf",
          "architectural_plans.dwg",
          "site_survey.pdf",
          "environmental_requirements.docx",
          "leed_certification_guide.pdf",
        ],
        requirements: [
          "LEED Gold certification mandatory",
          "Minimum 10 years construction experience",
          "Licensed general contractor",
          "Bonding capacity of $3M minimum",
          "Previous high-rise experience required",
        ],
        location: "Downtown Metro City",
        contactPerson: "Sarah Johnson",
        contactEmail: "sarah.johnson@metrodev.com",
      },
      "2": {
        id: "2",
        title: "Office Building Construction",
        description:
          "Complete construction of a 5-story office building with modern amenities, parking facilities, and green building standards compliance. The building will house 200+ employees with modern workspace design.",
        creator: "John Creator",
        status: "published",
        category: "open",
        basePrice: 500000,
        deadline: "2024-03-15",
        duration: "180",
        createdAt: "2024-01-10",
        attachments: ["project_specs.pdf", "site_plan.dwg", "requirements.docx"],
        requirements: [
          "Licensed contractor required",
          "5+ years experience",
          "Insurance coverage minimum $1M",
          "Local permits handling",
        ],
        location: "Business District",
        contactPerson: "John Creator",
        contactEmail: "john@company.com",
      },
      "3": {
        id: "3",
        title: "Residential Complex Development",
        description:
          "Development of a 50-unit residential complex with amenities including swimming pool, gym, and community center. Family-friendly design with playground and green spaces.",
        creator: "Housing Authority",
        status: "awarded",
        category: "closed",
        basePrice: 1200000,
        deadline: "2024-01-30",
        duration: "240",
        createdAt: "2024-01-05",
        attachments: ["residential_specs.pdf", "site_layout.dwg", "amenities_plan.pdf"],
        requirements: [
          "Residential construction license",
          "Previous multi-unit experience",
          "Environmental compliance",
          "Safety certifications",
        ],
        location: "Suburban Area",
        contactPerson: "Housing Authority",
        contactEmail: "projects@housing.gov",
      },
      "4": {
        id: "4",
        title: "Shopping Mall Renovation",
        description:
          "Complete renovation of existing shopping mall including facade updates, interior modernization, and infrastructure improvements. Project includes new food court and entertainment area.",
        creator: "Retail Properties Inc",
        status: "closed",
        category: "open",
        basePrice: 800000,
        deadline: "2024-01-25",
        duration: "150",
        createdAt: "2024-01-01",
        attachments: ["renovation_plans.pdf", "current_state_photos.zip", "requirements.docx"],
        requirements: [
          "Commercial renovation experience",
          "Working with occupied buildings",
          "Retail construction background",
          "Project management certification",
        ],
        location: "City Center Mall",
        contactPerson: "Mike Wilson",
        contactEmail: "mike@retailprops.com",
      },
      "5": {
        id: "5",
        title: "Hospital Wing Extension",
        description:
          "Extension of hospital's east wing with 30 additional patient rooms and modern medical facilities. Includes specialized equipment installation and medical gas systems.",
        creator: "City Medical Center",
        status: "published",
        category: "closed",
        basePrice: 1800000,
        deadline: "2024-03-25",
        duration: "300",
        createdAt: "2024-01-18",
        attachments: [
          "medical_facility_specs.pdf",
          "equipment_requirements.xlsx",
          "safety_protocols.pdf",
          "medical_gas_plans.dwg",
        ],
        requirements: [
          "Healthcare facility construction license",
          "Medical equipment installation experience",
          "HIPAA compliance knowledge",
          "Specialized medical construction background",
          "24/7 construction capability",
        ],
        location: "City Medical Center",
        contactPerson: "Dr. Emily Chen",
        contactEmail: "projects@citymedical.org",
      },
      "6": {
        id: "6",
        title: "School Cafeteria Renovation",
        description:
          "Complete renovation of school cafeteria including kitchen equipment upgrade, dining area modernization, and compliance with health department standards. Project includes new flooring, lighting, and ventilation systems.",
        creator: "City School District",
        status: "published",
        category: "open",
        basePrice: 150000,
        deadline: "2024-03-10",
        duration: "90",
        createdAt: "2024-01-20",
        attachments: ["cafeteria_plans.pdf", "equipment_specs.xlsx", "health_requirements.pdf"],
        requirements: [
          "Food service construction license",
          "Health department compliance",
          "School construction experience",
          "Background checks for all workers",
        ],
        location: "Lincoln Elementary School",
        contactPerson: "Maria Rodriguez",
        contactEmail: "maria.rodriguez@cityschools.edu",
      },
      "7": {
        id: "7",
        title: "Warehouse Construction",
        description:
          "Construction of a 50,000 sq ft warehouse facility with loading docks, office space, and modern inventory management systems. Includes climate control and security systems installation.",
        creator: "Logistics Corp",
        status: "published",
        category: "closed",
        basePrice: 750000,
        deadline: "2024-03-28",
        duration: "200",
        createdAt: "2024-01-22",
        attachments: ["warehouse_blueprints.dwg", "site_specifications.pdf", "logistics_requirements.docx"],
        requirements: [
          "Industrial construction license",
          "Warehouse construction experience",
          "Loading dock installation expertise",
          "Security system integration capability",
        ],
        location: "Industrial District",
        contactPerson: "Robert Chen",
        contactEmail: "robert.chen@logisticscorp.com",
      },
      "8": {
        id: "8",
        title: "Bridge Repair Project",
        description:
          "Structural repairs and maintenance of the downtown bridge including deck replacement, steel beam reinforcement, and complete repainting. Project requires traffic management and safety protocols.",
        creator: "City Public Works",
        status: "closed",
        category: "open",
        basePrice: 300000,
        deadline: "2024-01-20",
        duration: "120",
        createdAt: "2023-12-15",
        attachments: ["bridge_inspection_report.pdf", "structural_plans.dwg", "traffic_management.pdf"],
        requirements: [
          "Bridge construction license",
          "Structural engineering certification",
          "Traffic management experience",
          "Safety protocol compliance",
        ],
        location: "Downtown Bridge",
        contactPerson: "James Wilson",
        contactEmail: "james.wilson@citypublicworks.gov",
      },
      "9": {
        id: "9",
        title: "Community Center Construction",
        description:
          "Construction of a new community center with multipurpose halls, gymnasium, library, and meeting rooms. The facility will serve as a hub for local community activities and events. The project includes modern amenities such as accessible entrances, energy-efficient systems, and flexible spaces that can accommodate various community programs.",
        creator: "City Community Development",
        status: "published",
        category: "open",
        basePrice: 850000,
        deadline: "2024-04-30", // Future deadline - plenty of time to bid
        duration: "240",
        createdAt: "2024-01-25",
        attachments: [
          "community_center_plans.pdf",
          "site_specifications.dwg",
          "accessibility_requirements.pdf",
          "environmental_impact_study.pdf",
          "community_needs_assessment.pdf",
        ],
        requirements: [
          "General contractor license required",
          "Minimum 8 years construction experience",
          "ADA compliance certification",
          "Community facility construction experience",
          "LEED Silver certification preferred",
          "Local hiring preference (30% minimum)",
        ],
        location: "Community District - 123 Main Street",
        contactPerson: "Jennifer Martinez",
        contactEmail: "jennifer.martinez@citydev.gov",
      },
    }

    return (
      tenderDatabase[id] || {
        id: id,
        title: `Tender #${id} - Not Found`,
        description: `The tender with ID "${id}" could not be found in our database. This might be because the tender has been removed, the ID is incorrect, or there's a system issue. Please check the tender list and try again.`,
        creator: "System",
        status: "published" as const,
        category: "open" as const,
        basePrice: 0,
        deadline: "2024-12-31",
        duration: "0",
        createdAt: "2024-01-01",
        attachments: [],
        requirements: ["Tender not found - please return to tender list"],
        location: "Unknown",
        contactPerson: "Support Team",
        contactEmail: "support@tms.com",
      }
    )
  }

  // Get my bid data based on tender ID
  const getMyBidData = (tenderId: string): MyBidData | null => {
    const myBidsDatabase: Record<string, MyBidData> = {
      "2": {
        id: "bid-2",
        amount: 485000,
        submittedAt: "2024-01-12T10:30:00Z",
        revisedAt: "2024-01-14T15:20:00Z",
        documents: ["proposal.pdf", "timeline.xlsx", "budget_breakdown.xlsx"],
        status: "revised",
        notes: "Competitive pricing with premium materials and accelerated timeline.",
      },
      "3": {
        id: "bid-3",
        amount: 1150000,
        submittedAt: "2024-01-08T14:20:00Z",
        documents: ["residential_proposal.pdf", "project_timeline.pdf", "team_credentials.pdf"],
        status: "accepted",
        notes: "Comprehensive residential development with sustainable features.",
      },
      "4": {
        id: "bid-4",
        amount: 820000,
        submittedAt: "2024-01-03T09:15:00Z",
        documents: ["renovation_proposal.pdf", "phased_approach.pdf"],
        status: "rejected",
        notes: "Detailed renovation plan with minimal business disruption.",
      },
      "6": {
        id: "bid-6",
        amount: 145000,
        submittedAt: "2024-01-21T16:45:00Z",
        documents: ["cafeteria_proposal.pdf", "equipment_timeline.xlsx"],
        status: "pending",
        notes: "Cost-effective renovation with modern equipment and quick turnaround.",
      },
    }

    return myBidsDatabase[tenderId] || null
  }

  // Get other bids - only visible for OPEN category tenders
  const getOtherBids = (tenderId: string, category: "open" | "closed"): OtherBid[] => {
    // CLOSED tenders don't show other bids for privacy
    if (category === "closed") {
      return []
    }

    const otherBidsDatabase: Record<string, OtherBid[]> = {
      "1": [
        {
          id: "other-1-1",
          vendorName: "Elite Construction Co",
          amount: 2450000,
          submittedAt: "2024-01-16T09:15:00Z",
          ranking: 2,
        },
        {
          id: "other-1-2",
          vendorName: "Premier Builders Ltd",
          amount: 2380000,
          submittedAt: "2024-01-17T14:45:00Z",
          ranking: 1,
        },
        {
          id: "other-1-3",
          vendorName: "Skyline Construction",
          amount: 2520000,
          submittedAt: "2024-01-18T11:30:00Z",
          ranking: 3,
        },
      ],
      "2": [
        {
          id: "other-2-1",
          vendorName: "Builder Inc",
          amount: 520000,
          submittedAt: "2024-01-13T09:15:00Z",
          ranking: 3,
        },
        {
          id: "other-2-2",
          vendorName: "Elite Builders",
          amount: 475000,
          submittedAt: "2024-01-14T14:45:00Z",
          ranking: 1,
        },
        {
          id: "other-2-3",
          vendorName: "Quality Construction",
          amount: 495000,
          submittedAt: "2024-01-15T11:20:00Z",
          ranking: 2,
        },
      ],
      "4": [
        {
          id: "other-4-1",
          vendorName: "Renovation Experts",
          amount: 785000,
          submittedAt: "2024-01-02T16:30:00Z",
          ranking: 1,
        },
        {
          id: "other-4-2",
          vendorName: "Mall Specialists Inc",
          amount: 795000,
          submittedAt: "2024-01-03T10:45:00Z",
          ranking: 2,
        },
        {
          id: "other-4-3",
          vendorName: "Retail Renovators",
          amount: 810000,
          submittedAt: "2024-01-04T14:15:00Z",
          ranking: 3,
        },
      ],
      "9": [
        {
          id: "other-9-1",
          vendorName: "Community Builders LLC",
          amount: 825000,
          submittedAt: "2024-01-26T10:30:00Z",
          ranking: 1,
        },
        {
          id: "other-9-2",
          vendorName: "Metro Construction Group",
          amount: 840000,
          submittedAt: "2024-01-27T14:15:00Z",
          ranking: 2,
        },
      ],
    }

    return otherBidsDatabase[tenderId] || []
  }

  // Get comments based on tender ID
  const getComments = (tenderId: string): Comment[] => {
    const commentsDatabase: Record<string, Comment[]> = {
      "1": [
        {
          id: "comment-1-1",
          author: "Vendor User",
          role: "vendor",
          message:
            "Could you please provide more details about the LEED certification requirements and the timeline for the certification process?",
          timestamp: "2024-01-16T11:30:00Z",
        },
        {
          id: "comment-1-2",
          author: "Sarah Johnson",
          role: "tender-creator",
          message:
            "The project requires LEED Gold certification. All materials and construction methods must comply with LEED v4.1 standards. The certification timeline is included in the project specifications document. We expect the certification process to run parallel with construction phases.",
          timestamp: "2024-01-16T14:20:00Z",
        },
        {
          id: "comment-1-3",
          author: "Elite Construction Co",
          role: "vendor",
          message: "What are the specific requirements for the underground parking structure foundation?",
          timestamp: "2024-01-17T09:45:00Z",
        },
        {
          id: "comment-1-4",
          author: "Sarah Johnson",
          role: "tender-creator",
          message:
            "The underground parking requires reinforced concrete with waterproofing systems. Detailed structural requirements are in the architectural plans. The foundation must support 200 vehicle capacity with proper drainage systems.",
          timestamp: "2024-01-17T15:30:00Z",
        },
      ],
      "2": [
        {
          id: "comment-2-1",
          author: "Vendor User",
          role: "vendor",
          message: "Could you please clarify the specific requirements for the parking structure foundation?",
          timestamp: "2024-01-13T11:30:00Z",
        },
        {
          id: "comment-2-2",
          author: "John Creator",
          role: "tender-creator",
          message:
            "The foundation should be reinforced concrete with a minimum depth of 8 feet. Please refer to attachment 2 for detailed specifications.",
          timestamp: "2024-01-13T14:20:00Z",
        },
      ],
      "5": [
        {
          id: "comment-5-1",
          author: "Vendor User",
          role: "vendor",
          message:
            "What are the specific requirements for medical gas systems installation and are there any preferred vendors for medical equipment?",
          timestamp: "2024-01-19T10:15:00Z",
        },
        {
          id: "comment-5-2",
          author: "Dr. Emily Chen",
          role: "tender-creator",
          message:
            "Medical gas systems must comply with NFPA 99 standards. We have preferred vendors list available upon request. All installations require certified medical gas technicians and must pass rigorous testing before commissioning.",
          timestamp: "2024-01-19T16:45:00Z",
        },
      ],
      "6": [
        {
          id: "comment-6-1",
          author: "Vendor User",
          role: "vendor",
          message: "What are the specific health department requirements for the kitchen equipment?",
          timestamp: "2024-01-21T10:30:00Z",
        },
        {
          id: "comment-6-2",
          author: "Maria Rodriguez",
          role: "tender-creator",
          message:
            "All equipment must be NSF certified and meet local health department standards. We'll provide the complete compliance checklist upon award.",
          timestamp: "2024-01-21T14:15:00Z",
        },
      ],
      "9": [
        {
          id: "comment-9-1",
          author: "City Community Development",
          role: "tender-creator",
          message:
            "Welcome to the Community Center Construction tender! This is an exciting project that will benefit our entire community. Please review all requirements carefully and don't hesitate to ask questions.",
          timestamp: "2024-01-25T09:00:00Z",
        },
        {
          id: "comment-9-2",
          author: "Local Contractor",
          role: "vendor",
          message: "What are the specific requirements for the gymnasium flooring and equipment installation?",
          timestamp: "2024-01-26T14:30:00Z",
        },
        {
          id: "comment-9-3",
          author: "Jennifer Martinez",
          role: "tender-creator",
          message:
            "The gymnasium requires professional-grade hardwood flooring suitable for basketball and volleyball. Equipment installation includes retractable bleachers and scoreboards. Full specifications are in attachment 2.",
          timestamp: "2024-01-26T16:45:00Z",
        },
      ],
    }

    return commentsDatabase[tenderId] || []
  }

  const tender = getTenderData(params.id)
  const myBid = getMyBidData(params.id)
  const otherBids = getOtherBids(params.id, tender.category)
  const comments = getComments(params.id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setBidDocuments((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setBidDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitBid = async () => {
    if (!bidAmount) {
      toast({
        title: "Error",
        description: "Please enter a bid amount",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(bidAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      })
      return
    }

    if (bidDocuments.length === 0) {
      toast({
        title: "Warning",
        description: "Consider uploading supporting documents to strengthen your bid",
        variant: "default",
      })
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Bid Submitted Successfully!",
        description: `Your bid of ${formatCurrency(amount)} has been submitted for "${tender.title}".`,
      })

      console.log("Submitting bid:", {
        tenderId: params.id,
        tenderTitle: tender.title,
        amount: amount,
        documents: bidDocuments.map((f) => f.name),
        notes: bidNotes,
        submittedAt: new Date().toISOString(),
      })

      // Clear form
      setBidAmount("")
      setBidDocuments([])
      setBidNotes("")

      // Redirect back to tenders list after a short delay
      setTimeout(() => {
        router.push("/vendor/tenders")
      }, 1500)
    } catch (error) {
      console.error("Error submitting bid:", error)
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        toast({
          title: "Comment Added",
          description: "Your comment has been posted successfully.",
        })
        console.log("Adding comment:", {
          tenderId: params.id,
          message: newComment,
          timestamp: new Date().toISOString(),
        })
        setNewComment("")
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add comment. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const daysUntilDeadline = Math.ceil(
    (new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  const canBid = daysUntilDeadline > 0 && tender.status === "published" && !myBid

  return (
    <DashboardLayout userRole="vendor" userName="Vendor User" userEmail="vendor@tms.com">
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

          {tender.title.includes("Not Found") && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Tender Not Found:</strong> The requested tender could not be located.
                <Link href="/vendor/tenders" className="underline ml-2">
                  Return to tender list
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={tender.category === "open" ? "border-green-500" : "border-purple-500"}>
              {tender.category} bidding
            </Badge>
            {daysUntilDeadline > 0 ? (
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                {daysUntilDeadline} days left
              </Badge>
            ) : (
              <Badge variant="destructive">Deadline passed</Badge>
            )}
            <Badge variant="outline" className={tender.status === "published" ? "border-blue-500" : "border-gray-500"}>
              {tender.status}
            </Badge>
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

                {tender.location && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Location</h4>
                      <p className="text-muted-foreground">{tender.location}</p>
                    </div>
                  </>
                )}

                {tender.requirements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {tender.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

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

                {tender.contactPerson && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <div className="text-muted-foreground">
                        <p>Contact Person: {tender.contactPerson}</p>
                        {tender.contactEmail && <p>Email: {tender.contactEmail}</p>}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Other Bids (Open Bidding Only) */}
            {tender.category === "open" && otherBids.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Other Bids
                  </CardTitle>
                  <CardDescription>
                    This is an open tender - you can see other vendor bids for transparency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Bid Amount</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Ranking</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {otherBids
                          .sort((a, b) => (a.ranking || 999) - (b.ranking || 999))
                          .map((bid) => (
                            <TableRow key={bid.id}>
                              <TableCell className="font-medium">{bid.vendorName}</TableCell>
                              <TableCell>{formatCurrency(bid.amount)}</TableCell>
                              <TableCell>{format(new Date(bid.submittedAt), "PPp")}</TableCell>
                              <TableCell>
                                {bid.ranking && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      bid.ranking === 1
                                        ? "border-green-500 text-green-700"
                                        : bid.ranking === 2
                                          ? "border-yellow-500 text-yellow-700"
                                          : bid.ranking === 3
                                            ? "border-orange-500 text-orange-700"
                                            : "border-gray-500 text-gray-700"
                                    }
                                  >
                                    #{bid.ranking}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Closed Bidding Privacy Notice */}
            {tender.category === "closed" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <EyeOff className="h-5 w-5" />
                    Closed Bidding
                  </CardTitle>
                  <CardDescription>
                    This is a closed tender - other vendor bids are kept confidential for privacy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      In closed bidding, vendor bids are not visible to other participants to ensure fair competition
                      and confidentiality.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments & Queries
                </CardTitle>
                <CardDescription>Ask questions or communicate with the tender creator</CardDescription>
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
                    placeholder="Ask a question or add a comment..."
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
            {/* My Bid */}
            <Card>
              <CardHeader>
                <CardTitle>My Bid</CardTitle>
                <CardDescription>
                  {myBid ? "Your existing bid for this tender" : "Submit your bid for this tender"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myBid && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Bid Status: {myBid.status.toUpperCase()}</strong>
                      <br />
                      Amount: <strong>{formatCurrency(myBid.amount)}</strong>
                      <br />
                      {myBid.revisedAt ? "Last revised" : "Submitted"}:{" "}
                      {format(new Date(myBid.revisedAt || myBid.submittedAt), "PPp")}
                      <br />
                      Documents: {myBid.documents.length} files
                    </AlertDescription>
                  </Alert>
                )}

                {!myBid && canBid && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Submit your competitive bid for this tender. Make sure to include all required documents.
                    </AlertDescription>
                  </Alert>
                )}

                {!canBid && !myBid && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {daysUntilDeadline <= 0
                        ? "Bidding deadline has passed."
                        : tender.status !== "published"
                          ? "This tender is no longer accepting bids."
                          : "Bidding is not available for this tender."}
                    </AlertDescription>
                  </Alert>
                )}

                {canBid && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bidAmount">Bid Amount (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="bidAmount"
                          type="number"
                          placeholder="Enter your bid amount"
                          className="pl-9"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Base price: {formatCurrency(tender.basePrice)}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bidNotes">Bid Notes (Optional)</Label>
                      <Textarea
                        id="bidNotes"
                        placeholder="Add any notes about your bid..."
                        value={bidNotes}
                        onChange={(e) => setBidNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Supporting Documents</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <Label htmlFor="bid-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">Upload files</span>
                        </Label>
                        <Input id="bid-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                        <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS up to 10MB each</p>
                      </div>

                      {bidDocuments.length > 0 && (
                        <div className="space-y-2">
                          {bidDocuments.map((file, index) => (
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

                    <Button className="w-full" onClick={handleSubmitBid} disabled={!bidAmount || isSubmitting}>
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Bid"}
                    </Button>
                  </>
                )}

                {myBid && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Submitted Documents</h4>
                    <div className="space-y-1">
                      {myBid.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{doc}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {myBid.notes && (
                      <div className="mt-3">
                        <h4 className="font-medium mb-1">Bid Notes</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">{myBid.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bid Comparison (Open Bidding Only) */}
            {tender.category === "open" && otherBids.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bid Comparison</CardTitle>
                  <CardDescription>Market analysis for this tender</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lowest Bid</span>
                    <span className="font-medium">{formatCurrency(Math.min(...otherBids.map((b) => b.amount)))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Highest Bid</span>
                    <span className="font-medium">{formatCurrency(Math.max(...otherBids.map((b) => b.amount)))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Bid</span>
                    <span className="font-medium">
                      {formatCurrency(otherBids.reduce((sum, b) => sum + b.amount, 0) / otherBids.length)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Bidders</span>
                    <span className="font-medium">{otherBids.length + (myBid ? 1 : 0)}</span>
                  </div>
                  {myBid && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">My Bid</span>
                      <span className="font-medium">{formatCurrency(myBid.amount)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tender Info */}
            <Card>
              <CardHeader>
                <CardTitle>Tender Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="outline">{tender.category} bidding</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline">{tender.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{format(new Date(tender.createdAt), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Bids</span>
                  <span className="text-sm">{otherBids.length + (myBid ? 1 : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Days Remaining</span>
                  <span className={`text-sm ${daysUntilDeadline <= 3 ? "text-red-600" : "text-green-600"}`}>
                    {daysUntilDeadline > 0 ? `${daysUntilDeadline} days` : "Expired"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
