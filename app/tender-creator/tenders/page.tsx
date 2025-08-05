"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Upload, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useNotifications } from "@/hooks/use-notifications"

interface Tender {
  id: string
  title: string
  creator: string
  status: "draft" | "published" | "closed" | "awarded"
  category: "open" | "closed"
  basePrice: number
  deadline: string
  bidsCount: number
  createdAt: string
}

export default function TenderCreatorTenderManagement() {
  const router = useRouter()
  const [tenders, setTenders] = useState<Tender[]>([
    {
      id: "1",
      title: "Office Building Construction",
      creator: "Tender Creator",
      status: "published",
      category: "open",
      basePrice: 500000,
      deadline: "2024-02-15",
      bidsCount: 5,
      createdAt: "2024-01-10",
    },
    {
      id: "2",
      title: "IT Infrastructure Setup",
      creator: "Tender Creator",
      status: "awarded",
      category: "closed",
      basePrice: 75000,
      deadline: "2024-01-30",
      bidsCount: 8,
      createdAt: "2024-01-05",
    },
    {
      id: "3",
      title: "Marketing Campaign Design",
      creator: "Tender Creator",
      status: "draft",
      category: "open",
      basePrice: 25000,
      deadline: "2024-02-20",
      bidsCount: 0,
      createdAt: "2024-01-12",
    },
  ])

  // Add after existing state declarations
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [vendorSearchTerm, setVendorSearchTerm] = useState("")
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false)

  // Mock vendor data - in real app, this would come from the users API
  const availableVendors = [
    { id: "1", name: "John Vendor", email: "john.vendor@example.com", company: "ABC Construction" },
    { id: "2", name: "Mike Vendor", email: "mike.vendor@example.com", company: "XYZ Engineering" },
    { id: "3", name: "Sarah Builder", email: "sarah@builders.com", company: "Builder's Inc" },
    { id: "4", name: "Tom Contractor", email: "tom@contractors.com", company: "Tom's Contracting" },
    { id: "5", name: "Lisa Materials", email: "lisa@materials.com", company: "Materials Plus" },
  ]

  const filteredVendors = availableVendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
      vendor.company.toLowerCase().includes(vendorSearchTerm.toLowerCase()),
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    basePrice: "",
    duration: "",
    deadline: "",
    description: "",
  })

  const { sendNotification } = useNotifications("tender-creator")

  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.creator.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tender.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleDeleteTender = (tenderId: string) => {
    setTenders(tenders.filter((tender) => tender.id !== tenderId))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]))
  }

  const removeSelectedVendor = (vendorId: string) => {
    setSelectedVendors((prev) => prev.filter((id) => id !== vendorId))
  }

  const getSelectedVendorDetails = () => {
    return availableVendors.filter((vendor) => selectedVendors.includes(vendor.id))
  }

  const handleCreateTender = async (isDraft = false) => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newTender: Tender = {
        id: Date.now().toString(),
        title: formData.title,
        creator: "Tender Creator",
        status: isDraft ? "draft" : "published",
        category: formData.category as "open" | "closed",
        basePrice: Number.parseFloat(formData.basePrice) || 0,
        deadline: formData.deadline,
        bidsCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      }

      setTenders((prev) => [newTender, ...prev])

      // Send notification if tender is published
      if (!isDraft) {
        await sendNotification("tender_created", {
          tenderId: newTender.id,
          title: newTender.title,
        })
      }

      // Reset form
      setFormData({
        title: "",
        category: "",
        basePrice: "",
        duration: "",
        deadline: "",
        description: "",
      })
      setUploadedFiles([])
      setSelectedVendors([])
      setVendorSearchTerm("")
      setIsDialogOpen(false)

      console.log("Tender created:", { ...newTender, files: uploadedFiles, vendors: selectedVendors })
    } catch (error) {
      console.error("Error creating tender:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Add click outside handler for vendor dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".vendor-search-container")) {
        setIsVendorDropdownOpen(false)
      }
    }

    if (isVendorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isVendorDropdownOpen])

  // Add useEffect to listen for tender status updates from localStorage or global state
  useEffect(() => {
    const handleTenderUpdate = () => {
      // Check for tender status updates (in a real app, this would be from an API or global state)
      const updatedTenderStatus = localStorage.getItem("updatedTenderStatus")
      if (updatedTenderStatus) {
        const { tenderId, status } = JSON.parse(updatedTenderStatus)
        setTenders((prev) => prev.map((tender) => (tender.id === tenderId ? { ...tender, status } : tender)))
        localStorage.removeItem("updatedTenderStatus")
      }
    }

    // Listen for storage events or set up polling
    window.addEventListener("storage", handleTenderUpdate)

    // Check on component mount
    handleTenderUpdate()

    return () => {
      window.removeEventListener("storage", handleTenderUpdate)
    }
  }, [])

  return (
    <DashboardLayout userRole="tender-creator" userName="Tender Creator" userEmail="creator@tms.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tender Management</h1>
            <p className="text-muted-foreground">Create and manage all your tenders</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Tender
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Tender</DialogTitle>
                <DialogDescription>Fill in the details to create a new tender</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Tender Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter tender title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Bidding Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bidding type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open Bidding</SelectItem>
                          <SelectItem value="closed">Closed Bidding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="basePrice">Base Price (USD) *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        placeholder="0.00"
                        value={formData.basePrice}
                        onChange={(e) => handleInputChange("basePrice", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="duration">Duration (Days) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="30"
                        value={formData.duration}
                        onChange={(e) => handleInputChange("duration", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange("deadline", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed description of the tender requirements..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  {/* Vendor Invitation Section */}
                  <div className="grid gap-2 vendor-search-container">
                    <Label>Invite Vendors</Label>
                    <div className="space-y-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search vendors by name, email, or company..."
                          value={vendorSearchTerm}
                          onChange={(e) => setVendorSearchTerm(e.target.value)}
                          onFocus={() => setIsVendorDropdownOpen(true)}
                          className="pl-10"
                        />
                      </div>

                      {/* Dropdown Results */}
                      {isVendorDropdownOpen && vendorSearchTerm && (
                        <div className="relative">
                          <div className="absolute top-0 left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredVendors.length > 0 ? (
                              filteredVendors.map((vendor) => (
                                <div
                                  key={vendor.id}
                                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                                    selectedVendors.includes(vendor.id) ? "bg-blue-50" : ""
                                  }`}
                                  onClick={() => {
                                    handleVendorToggle(vendor.id)
                                    setVendorSearchTerm("")
                                    setIsVendorDropdownOpen(false)
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-sm">{vendor.name}</div>
                                      <div className="text-xs text-muted-foreground">{vendor.email}</div>
                                      <div className="text-xs text-blue-600">{vendor.company}</div>
                                    </div>
                                    {selectedVendors.includes(vendor.id) && (
                                      <div className="text-green-600">
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-sm text-muted-foreground text-center">
                                No vendors found matching your search
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Selected Vendors Display */}
                      {selectedVendors.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Selected Vendors ({selectedVendors.length})</Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {getSelectedVendorDetails().map((vendor) => (
                              <div
                                key={vendor.id}
                                className="flex items-center justify-between p-2 bg-blue-50 rounded-md"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{vendor.name}</div>
                                  <div className="text-xs text-muted-foreground">{vendor.company}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSelectedVendor(vendor.id)}
                                  className="h-6 w-6 p-0 hover:bg-red-100"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Helper Text */}
                      <p className="text-xs text-muted-foreground">
                        Search and select vendors to invite them to bid on this tender. Selected vendors will receive
                        notifications when the tender is published.
                      </p>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="grid gap-2">
                    <Label>Attachments</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <div>
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">Upload files</span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        PDF, DOC, DOCX, XLS, XLSX, TXT up to 10MB each
                      </p>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Files</Label>
                        {uploadedFiles.map((file, index) => (
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
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleCreateTender(true)}
                  disabled={isLoading || !formData.title}
                >
                  {isLoading ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  onClick={() => handleCreateTender(false)}
                  disabled={isLoading || !formData.title || !formData.category || !formData.basePrice}
                >
                  {isLoading ? "Creating..." : "Create Tender"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">My Tenders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenders.filter((t) => t.status === "published").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenders.reduce((sum, t) => sum + t.bidsCount, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Awarded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenders.filter((t) => t.status === "awarded").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>My Tenders</CardTitle>
            <CardDescription>Manage and track all your tenders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenders by title..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tenders Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenders.map((tender) => (
                    <TableRow key={tender.id}>
                      <TableCell className="font-medium">{tender.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(tender.status)}>{tender.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(tender.category)}>{tender.category} bid</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(tender.basePrice)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {tender.deadline}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tender.bidsCount} bids</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/tender-creator/tenders/${tender.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Navigate to edit page using router
                              router.push(`/tender-creator/tenders/${tender.id}/edit`)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTender(tender.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
