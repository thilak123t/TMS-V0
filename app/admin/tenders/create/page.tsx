"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, X, CalendarIcon, Users, Save, Send, FileText, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Vendor {
  id: string
  name: string
  email: string
  company: string
}

export default function CreateTender() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [deadline, setDeadline] = useState<Date>()

  const [formData, setFormData] = useState({
    title: "",
    category: "" as "open" | "closed" | "",
    basePrice: "",
    description: "",
    duration: "",
    attachments: [] as File[],
  })

  const [selectedVendors, setSelectedVendors] = useState<string[]>([])

  // Mock vendor data - replace with API call
  const vendors: Vendor[] = [
    { id: "1", name: "John Vendor", email: "john@vendor.com", company: "Vendor Corp" },
    { id: "2", name: "Mike Builder", email: "mike@builder.com", company: "Builder Inc" },
    { id: "3", name: "Sarah Tech", email: "sarah@tech.com", company: "Tech Solutions" },
    { id: "4", name: "David Construction", email: "david@construction.com", company: "Construction Ltd" },
  ]

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

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]))
  }

  const handleSubmit = async (action: "draft" | "publish") => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Tender data:", {
        ...formData,
        deadline,
        selectedVendors,
        status: action === "draft" ? "draft" : "published",
      })

      router.push("/admin/tenders")
    } catch (error) {
      console.error("Error creating tender:", error)
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
            <h1 className="text-3xl font-bold">Create New Tender</h1>
            <p className="text-muted-foreground">Fill in the details to create a new tender</p>
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
                <CardDescription>Enter the basic details of the tender</CardDescription>
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
                <CardDescription>Upload relevant documents and files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">Upload files</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
                      </Label>
                      <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">PDF, DOC, DOCX, XLS, XLSX up to 10MB each</p>
                  </div>

                  {formData.attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files</Label>
                      {formData.attachments.map((file, index) => (
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
                  Invite Vendors
                </CardTitle>
                <CardDescription>Select vendors to invite for bidding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={vendor.id}
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={() => handleVendorToggle(vendor.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={vendor.id} className="text-sm font-medium cursor-pointer">
                          {vendor.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{vendor.company}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedVendors.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Selected Vendors:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedVendors.map((vendorId) => {
                        const vendor = vendors.find((v) => v.id === vendorId)
                        return (
                          <Badge key={vendorId} variant="secondary" className="text-xs">
                            {vendor?.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Save or publish your tender</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isFormValid && (
                  <Alert>
                    <AlertDescription>Please fill in all required fields before saving or publishing.</AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => handleSubmit("draft")}
                  disabled={isLoading || !isFormValid}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>

                <Button
                  className="w-full"
                  onClick={() => handleSubmit("publish")}
                  disabled={isLoading || !isFormValid || selectedVendors.length === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isLoading ? "Publishing..." : "Publish & Invite Vendors"}
                </Button>

                {selectedVendors.length === 0 && isFormValid && (
                  <p className="text-xs text-muted-foreground">Select at least one vendor to publish the tender</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
