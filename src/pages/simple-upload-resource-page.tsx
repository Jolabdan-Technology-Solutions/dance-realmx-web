import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function SimpleUploadResourcePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Fetch resource categories
  const { data: categories = [] } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/resource-categories"],
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    detailedDescription: "",
    price: "0",
    categoryId: categories.length > 0 ? categories[0].id.toString() : "",
    isFree: true,
    termsAccepted: false,
    fileType: "pdf" // Default file type
  });
  
  // Update category ID when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({
        ...prev,
        categoryId: categories[0].id.toString()
      }));
    }
  }, [categories]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or image file (JPG, PNG, GIF, WEBP)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (20MB max)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 20MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
      
      // Auto-populate title from filename if empty
      if (!formData.title) {
        const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setFormData({
          ...formData,
          title: filename.replace(/_/g, " ")
        });
      }
      
      // Set file type based on MIME type
      let fileType = "other";
      if (file.type.startsWith('image/')) {
        fileType = "image";
      } else if (file.type === 'application/pdf') {
        fileType = "pdf";
      }
      
      setFormData(prev => ({
        ...prev,
        fileType
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "File Required",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a multi-part form data
      const submitData = new FormData();
      submitData.append("file", selectedFile);
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("detailedDescription", formData.detailedDescription || "");
      
      // Ensure price is correctly formatted and parsed
      let priceValue = formData.isFree ? "0" : formData.price;
      
      // Make sure we have a valid number before formatting
      if (!formData.isFree && priceValue) {
        try {
          // Convert to number and format with 2 decimal places, then back to string
          const numValue = parseFloat(priceValue);
          if (!isNaN(numValue)) {
            priceValue = numValue.toFixed(2);
          }
        } catch (e) {
          // Error formatting price
        }
      }
      
      
      console.log("Uploading resource with price:", priceValue);
      submitData.append("price", priceValue);
      
      // Use the user-selected fileType rather than the auto-detected one
      submitData.append("fileType", formData.fileType);
      
      if (formData.categoryId) {
        submitData.append("categoryId", formData.categoryId);
      }

      // Enhanced debugging for file upload
      const entries = Array.from(submitData.keys());
      try {
        const entries = Array.from(submitData.entries());
      } catch (err) {
        // Could not iterate form data entries
      }

      // Direct submission to the server endpoint that handles both file and resource data
      
      // Get auth token for the request
      const token = localStorage.getItem("access_token");      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/resources/upload-simple", {
        method: "POST",
        headers,
        body: submitData,
        // Don't set Content-Type header, browser will set it with boundary for multipart/form-data
        credentials: 'same-origin' // Include session cookies
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || "Failed to upload resource";
        } catch (e) {
          errorMessage = `Failed to upload resource: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // Success!
      const result = await response.json();
      
      toast({
        title: "Upload Successful",
        description: "Your resource has been uploaded successfully.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/my-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/seller"] });
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum"] });
      
      // Redirect to curriculum page instead of my-resources
      navigate("/curriculum");
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload resource",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get file size display
  const getFileSizeDisplay = (size: number): string => {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to upload resources.</p>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header with back navigation */}
      <div className="mb-8">
        <Link href="/resources">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Upload Resource</h1>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Resource</CardTitle>
            <CardDescription>
              Upload a file and provide details about your resource
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Resource File *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {!selectedFile ? (
                    <>
                      <Label 
                        htmlFor="file-upload" 
                        className="cursor-pointer flex flex-col items-center justify-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to browse files or drop files here
                        </span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Browse Files
                        </Button>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept="application/pdf,image/*,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-gray-500 text-sm mt-4">
                        Supported file types: PDF, DOC, DOCX, JPG, PNG
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Maximum file size: 20 MB
                      </p>
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        {previewUrl ? (
                          <div className="h-16 w-16 mr-4 rounded-md overflow-hidden">
                            <img
                              src={previewUrl}
                              alt="File preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mr-4">
                            {selectedFile.type === 'application/pdf' ? (
                              <FileText className="h-12 w-12 text-red-500" />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-green-500" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{selectedFile.name}</h3>
                          <p className="text-gray-500 text-sm">
                            {getFileSizeDisplay(selectedFile.size)}
                          </p>
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a title for your resource"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Briefly describe your resource (max 200 characters)"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-gray-500">
                  This will appear in search results and resource lists
                </p>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <Label htmlFor="detailedDescription">Detailed Description</Label>
                <Textarea
                  id="detailedDescription"
                  name="detailedDescription"
                  value={formData.detailedDescription}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed description of your resource"
                  className="min-h-[120px]"
                />
                <p className="text-xs text-gray-500">
                  Explain what users will learn or how they can use this resource
                </p>
              </div>

              {/* File Type */}
              <div className="space-y-2">
                <Label htmlFor="fileType">Resource Type *</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("fileType", value)}
                  value={formData.fileType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="curriculum">Curriculum</SelectItem>
                    <SelectItem value="lesson">Lesson Plan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  This helps users understand what type of resource they're purchasing
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                  value={formData.categoryId || (categories.length > 0 ? categories[0].id.toString() : "default")}
                  defaultValue={categories.length > 0 ? categories[0].id.toString() : "default"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default">No categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFree"
                    checked={formData.isFree}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("isFree", checked === true)
                    }
                  />
                  <Label htmlFor="isFree">This is a free resource</Label>
                </div>
              </div>

              {/* Price (if not free) */}
              {!formData.isFree && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.99"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500">
                    Set your price for this resource
                  </p>
                </div>
              )}

              {/* Terms & Conditions */}
              <div className="space-y-2 border p-4 rounded-md">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("termsAccepted", checked === true)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="termsAccepted" className="cursor-pointer">Terms and Conditions *</Label>
                    <p className="text-xs text-gray-500">
                      I confirm that this resource is my original work or I have the right to distribute it.
                      I agree to the DanceRealmX Terms of Service.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/resources")}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-black border-t-transparent rounded-full"></div>
                    Uploading...
                  </>
                ) : (
                  "Upload Resource"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}