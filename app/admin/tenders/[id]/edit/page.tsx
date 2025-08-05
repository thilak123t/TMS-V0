"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, X, CalendarIcon, Users, Save, FileText, DollarSign, Search, Check } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  email: string
  company: string
}

export default function EditTender({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [deadline, setDeadline] = useState<Date>()
  const [vendorSearch, setVendorSearch] = useState("")
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)

  // Mock existing tender data - in real app, fetch from API
  const existingTender = {
    id: params.id,
    title: "Office Building Construction",
    category: "open" as "open" | "closed",
    basePrice: "500000",
    description:
      "Complete construction of a 5-story office building with modern amenities, parking facilities, and green building standards compliance.",
    duration: "180",
    deadline: "2024-02-15",
    attachments: ["project_specs.pdf", "site_plan.dwg", "requirements.docx"],
    selectedVendors: ["1", "2", "3"],
  }

  const [formData, setFormData] = useState({
    title: existingTender.title,
    category: existingTender.category,
    basePrice: existingTender.basePrice,
    description: existingTender.description,
    duration: existingTender.duration,
    attachments: [] as File[],
    existingAttachments: existingTender.attachments,
  })

  const [selectedVendors, setSelectedVendors] = useState<string[]>(existingTender.selectedVendors)

  // Set initial deadline
  useEffect(() => {
    setDeadline(new Date(existingTender.deadline))
  }, [])

  // Mock vendor data - replace with API call
  const vendors: Vendor[] = [
    { id: "1", name: "John Vendor", email: "john@vendor.com", company: "Vendor Corp" },
    { id: "2", name: "Mike Builder", email: "mike@builder.com", company: "Builder Inc" },
    { id: "3", name: "Sarah Tech", email: "sarah@tech.com", company: "Tech Solutions" },
    { id: "4", name: "David Construction", email: "david@construction.com", company: "Construction Ltd" },
  ]

  // Filter vendors based on search
  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      vendor.email.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      vendor.company.toLowerCase().includes(vendorSearch.toLowerCase()),
  )

  // Handle vendor selection from dropdown
  const handleVendorSelect = (vendorId: string) => {
    handleVendorToggle(vendorId)
    setVendorSearch("")
    setShowVendorDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowVendorDropdown(false)
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }))
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const removeExistingFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter((_, i) => i !== index),
    }))
  }

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Updated tender data:", {
        id: params.id,
        ...formData,
        deadline,
        selectedVendors,
      })

      // Update the tender in localStorage so the list view can pick it up
      const updatedTender = {
        id: params.id,
        title: formData.title,
        category: formData.category,
        basePrice: Number.parseFloat(formData.basePrice) || 0,
        description: formData.description,
        duration: formData.duration,
        deadline: deadline ? deadline.toISOString().split("T")[0] : "",
        selectedVendors,
        attachments: formData.attachments,
        existingAttachments: formData.existingAttachments,
      }

      // Save the updated tender data to localStorage
      localStorage.setItem("updatedTenderData", JSON.stringify(updatedTender))

      // Save update notification to localStorage
      localStorage.setItem(
        "tenderUpdated",
        JSON.stringify({
          tenderId: params.id,
          message: "Tender updated successfully",
        }),
      )

      router.push("/admin/tenders")
    } catch (error) {
      console.error("Error updating tender:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    formData.title && formData.category && formData.basePrice && formData.description && formData.duration && deadline

  return (
    <DashboardLayout userRole="admin" userName="Admin User" userEmail="admin@tms.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Tender</h1>
            <p className="text-muted-foreground">Update the tender details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Update the basic details of the tender</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Tender Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter tender title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Bidding Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: "open" | "closed") => handleInputChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bidding type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open Bidding</SelectItem>
                        <SelectItem value="closed">Closed Bidding</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.category === "open"
                        ? "Vendors can see other bids"
                        : formData.category === "closed"
                          ? "Vendors cannot see other bids"
                          : "Choose bidding visibility"}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="basePrice">Base Price (USD) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="basePrice"
                        type="number"
                        placeholder="0.00"
                        className="pl-9"
                        value={formData.basePrice}
                        onChange={(e) => handleInputChange("basePrice", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed description of the tender requirements..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label>Deadline *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadline ? format(deadline, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Attachments
                </CardTitle>
                <CardDescription>Update relevant documents and files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Existing Files */}
                  {formData.existingAttachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Current Files</Label>
                      {formData.existingAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm">{file}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeExistingFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">Upload new files</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
                      </Label>
                      <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">PDF, DOC, DOCX, XLS, XLSX up to 10MB each</p>
                  </div>

                  {formData.attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>New Files to Upload</Label>
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vendor Invitation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Update Vendor List
                </CardTitle>
                <CardDescription>Search and modify vendors invited for bidding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Vendor Search */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search vendors by name, email, or company..."
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        onFocus={() => setShowVendorDropdown(true)}
                        className="pl-9"
                      />
                    </div>

                    {/* Vendor Dropdown */}
                    {showVendorDropdown && vendorSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredVendors.length > 0 ? (
                          filteredVendors.map((vendor) => (
                            <div
                              key={vendor.id}
                              className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                                selectedVendors.includes(vendor.id) ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleVendorSelect(vendor.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{vendor.name}</p>
                                  <p className="text-xs text-muted-foreground">{vendor.company}</p>
                                  <p className="text-xs text-muted-foreground">{vendor.email}</p>
                                </div>
                                {selectedVendors.includes(vendor.id) && (
                                  <div className="text-blue-600">
                                    <Check className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            No vendors found matching "{vendorSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Vendors Display */}
                  {selectedVendors.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Selected Vendors ({selectedVendors.length})</Label>
                      </div>

                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedVendors.map((vendorId) => {
                          const vendor = vendors.find((v) => v.id === vendorId)
                          if (!vendor) return null

                          return (
                            <div key={vendorId} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{vendor.name}</p>
                                <p className="text-xs text-muted-foreground">{vendor.company}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVendorToggle(vendorId)}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {selectedVendors.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No vendors selected</p>
                      <p className="text-xs">Search and select vendors to invite for bidding</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Update Tender</CardTitle>
                <CardDescription>Save your changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isFormValid && (
                  <Alert>
                    <AlertDescription>Please fill in all required fields before saving.</AlertDescription>
                  </Alert>
                )}

                <Button className="w-full" onClick={handleSubmit} disabled={isLoading || !isFormValid}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Updating..." : "Update Tender"}
                </Button>

                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
