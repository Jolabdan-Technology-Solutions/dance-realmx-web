import { FileText, Search, Trash, Edit, Award, ThumbsUp, Package, Check, X, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";

// Helper for price formatting
const formatPrice = (price: string | null) => {
  if (!price) return "$0.00";
  return `$${parseFloat(price).toFixed(2)}`;
};

// Placeholder seller image
const DEFAULT_SELLER_IMAGE = "https://ui-avatars.com/api/?name=Unknown&background=random";

export default function AdminResourcesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  
  // Fetch resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["/api/admin/resources"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/resources");
      const data = await res.json();
      console.log("Resources from API:", data);
      // Check for any pending resources (including pending and pending_approval)
      const pendingResources = data.filter((r: any) => {
        const status = (r.status || "").toLowerCase();
        return status === "pending" || status === "pending_approval";
      });
      console.log("Pending approval resources:", pendingResources);
      return data;
    }
  });
  
  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/resource-categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/resource-categories");
      return await res.json();
    }
  });
  
  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/resources/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({
        title: "Resource Updated",
        description: "The resource has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update resource",
        variant: "destructive",
      });
    }
  });
  
  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/resources/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({
        title: "Resource Deleted",
        description: "The resource has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    }
  });
  
  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/resources", formData, { isFormData: true });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({
        title: "Resource Created",
        description: "The resource has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setUploadedFileUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create resource",
        variant: "destructive",
      });
    }
  });
  
  // Calculate counts for each category - this logic must match the isResourcePending logic in the filteredResources
  const pendingCount = resources.filter((r: any) => {
    const status = (r.status || "").toLowerCase();
    // This must match the isResourcePending criteria below
    return status === "pending" || status === "pending_approval" || r.isApproved === false;
  }).length;
  
  const approvedCount = resources.filter((r: any) => {
    const status = (r.status || "").toLowerCase();
    return status === "approved" || status === "published" || status === "active" || r.isApproved === true;
  }).length;
  
  const rejectedCount = resources.filter((r: any) => {
    const status = (r.status || "").toLowerCase();
    return status === "rejected";
  }).length;
  
  const featuredCount = resources.filter((r: any) => r.isFeatured === true).length;
  
  // Filter resources based on search and tab
  console.log("Current selected tab:", selectedTab);
  console.log("Resources from API:", resources);
  console.log("Pending count:", pendingCount);
  
  const filteredResources = resources.filter((resource: any) => {
    // Log all resource statuses to help debug
    console.log(`Resource ID ${resource.id}, title: "${resource.title}", status: "${resource.status}", isFeatured: ${!!resource.isFeatured}`);
    
    const matchesSearch = 
      !searchQuery || 
      resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.sellerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle status value case sensitivity and nulls
    const resourceStatus = (resource.status || "").toLowerCase();
    
    // Group similar statuses together for filtering
    // Make sure both logics use the same criteria
    const isResourcePending = resourceStatus === "pending" || 
                             resourceStatus === "pending_approval" || 
                             resource.isApproved === false;
    
    // Consider both "approved" and "published"/"active" as approved statuses
    const isResourceApproved = resourceStatus === "approved" || 
                             resourceStatus === "published" || 
                             resourceStatus === "active" ||
                             resource.isApproved === true;
                             
    const isResourceRejected = resourceStatus === "rejected";
    const isResourceFeatured = resource.isFeatured === true; // Ensure strict boolean check
    
    // Add extra logging for the current tab
    console.log(`Tab: ${selectedTab}, Resource: ${resource.id}, Matches: ${
      selectedTab === "all" ? "true" : 
      selectedTab === "pending" && isResourcePending ? "true" : 
      selectedTab === "approved" && isResourceApproved ? "true" : 
      selectedTab === "rejected" && isResourceRejected ? "true" : 
      selectedTab === "featured" && isResourceFeatured ? "true" : "false"
    }`);
    
    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "pending") return matchesSearch && isResourcePending;
    if (selectedTab === "approved") return matchesSearch && isResourceApproved;
    if (selectedTab === "rejected") return matchesSearch && isResourceRejected;
    if (selectedTab === "featured") return matchesSearch && isResourceFeatured;
    
    return matchesSearch;
  });
  
  // Handle resource edit form submission
  const handleUpdateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Helper to safely format price values
    const safeFormatPrice = (value: string | null): string | undefined => {
      if (!value || value === '') return undefined;
      const numValue = parseFloat(value);
      return isNaN(numValue) ? undefined : numValue.toString();
    };
    
    const price = safeFormatPrice(formData.get("price") as string);
    const pricePremium = safeFormatPrice(formData.get("pricePremium") as string);
    const priceRoyalty = safeFormatPrice(formData.get("priceRoyalty") as string);
    
    const data: any = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      isFeatured: formData.has("isFeatured"),
    };
    
    // Only add price fields if they have valid values
    if (price !== undefined) data.price = price;
    if (pricePremium !== undefined) data.pricePremium = pricePremium;
    if (priceRoyalty !== undefined) data.priceRoyalty = priceRoyalty;
    
    updateResourceMutation.mutate({ id: selectedResource.id, data });
  };
  
  // Handle quick status change
  const handleQuickStatusChange = (id: number, status: string) => {
    // Update both status and isApproved fields for consistency
    const isApproved = status === "approved" ? true : (status === "rejected" ? false : null);
    
    updateResourceMutation.mutate({ 
      id, 
      data: { 
        status,
        isApproved
      } 
    });
  };
  
  // Handle quick featured toggle
  const handleFeaturedToggle = (id: number, isFeatured: boolean) => {
    updateResourceMutation.mutate({ 
      id, 
      data: { isFeatured: !isFeatured } 
    });
  };
  
  // Open the edit dialog with a resource
  const openEditDialog = (resource: any) => {
    setSelectedResource(resource);
    setIsEditDialogOpen(true);
  };
  
  // Open the delete confirmation dialog
  const openDeleteDialog = (resource: any) => {
    setSelectedResource(resource);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle resource creation form submission
  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    // If no file URL is available, show an error
    if (!uploadedFileUrl) {
      toast({
        title: "File Required",
        description: "Please upload a file for this resource.",
        variant: "destructive",
      });
      return;
    }
    
    // Add the file URL to the form data
    formData.append("fileUrl", uploadedFileUrl);
    
    // Set default values for fields that might be empty
    if (!formData.get("status")) {
      formData.append("status", "pending");
    }
    
    createResourceMutation.mutate(formData);
  };
  
  const getStatusBadge = (status: string, isApproved?: boolean) => {
    const statusLower = (status || "").toLowerCase();
    
    // Check both status value and isApproved flag
    if (statusLower === "approved") {
      return <Badge className="bg-green-600">Approved</Badge>;
    } else if (statusLower === "published" || statusLower === "active") {
      return <Badge className="bg-green-600">Published</Badge>;
    } else if (statusLower === "pending" || statusLower === "pending_approval" || isApproved === false) {
      return <Badge className="bg-yellow-600">Pending</Badge>;
    } else if (statusLower === "rejected") {
      return <Badge className="bg-red-600">Rejected</Badge>;
    } else {
      return <Badge className="bg-gray-600">{status || "Unknown"}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Management</h1>
          <p className="text-gray-400">Manage curriculum resources</p>
        </div>
        
        <Button 
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Resource
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search resources by title, description, or seller..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Resources ({resources.length})</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-600 text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            {approvedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-green-600 text-white">
                {approvedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            {rejectedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-600 text-white">
                {rejectedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="featured">
            Featured
            {featuredCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-600 text-white">
                {featuredCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedTab === "all" && "All Resources"}
                {selectedTab === "pending" && "Pending Resources"}
                {selectedTab === "approved" && "Approved Resources"}
                {selectedTab === "rejected" && "Rejected Resources"}
                {selectedTab === "featured" && "Featured Resources"}
                <span className="ml-2 text-sm text-gray-400">
                  ({filteredResources.length} resources)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-400 text-center">No resources found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.map((resource: any) => (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center overflow-hidden">
                                {resource.imageUrl ? (
                                  <img 
                                    src={resource.imageUrl} 
                                    alt={resource.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">{resource.title}</span>
                                <span className="text-xs text-gray-400">
                                  {resource.description ? 
                                    (resource.description.length > 50 
                                      ? resource.description.substring(0, 50) + "..." 
                                      : resource.description)
                                    : "No description"
                                  }
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="h-6 w-6 rounded-full overflow-hidden">
                                <img 
                                  src={resource.seller.profile_image_url || DEFAULT_SELLER_IMAGE}
                                  alt={resource.sellerName} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span>{resource.sellerName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(resource.status || "pending", resource.isApproved)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div>Standard: {formatPrice(resource.price)}</div>
                              <div className="text-blue-400">Premium: {formatPrice(resource.pricePremium)}</div>
                              <div className="text-purple-400">Royalty: {formatPrice(resource.priceRoyalty)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={resource.isFeatured ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleFeaturedToggle(resource.id, resource.isFeatured)}
                              className={resource.isFeatured ? "bg-blue-600 hover:bg-blue-700" : ""}
                            >
                              {resource.isFeatured ? (
                                <Award className="h-4 w-4 text-white" />
                              ) : (
                                <Award className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="ml-2">{resource.isFeatured ? "Featured" : "Not Featured"}</span>
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {resource.status !== "approved" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusChange(resource.id, "approved")}
                                  className="bg-green-950 hover:bg-green-900 text-white"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {resource.status !== "rejected" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusChange(resource.id, "rejected")}
                                  className="bg-red-950 hover:bg-red-900 text-white"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(resource)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(resource)}
                                className="bg-red-950 hover:bg-red-900 text-white"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Make changes to the resource properties below.
            </DialogDescription>
          </DialogHeader>
          
          {selectedResource && (
            <form onSubmit={handleUpdateResource}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={selectedResource.title}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={selectedResource.description}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <Select name="status" defaultValue={selectedResource.status || "pending"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id="isFeatured" 
                        name="isFeatured"
                        defaultChecked={selectedResource.isFeatured}
                      />
                      <label htmlFor="isFeatured" className="text-sm font-medium">
                        Featured Resource
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium mb-1">
                        Standard Price
                      </label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={selectedResource.price || "0.00"}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="pricePremium" className="block text-sm font-medium mb-1">
                        Premium Price
                      </label>
                      <Input
                        id="pricePremium"
                        name="pricePremium"
                        type="number"
                        step="0.01"
                        defaultValue={selectedResource.pricePremium || "0.00"}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="priceRoyalty" className="block text-sm font-medium mb-1">
                        Royalty Price
                      </label>
                      <Input
                        id="priceRoyalty"
                        name="priceRoyalty"
                        type="number"
                        step="0.01"
                        defaultValue={selectedResource.priceRoyalty || "0.00"}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateResourceMutation.isPending}
                >
                  {updateResourceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedResource && (
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center overflow-hidden">
                  {selectedResource.imageUrl ? (
                    <img 
                      src={selectedResource.imageUrl} 
                      alt={selectedResource.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{selectedResource.title}</div>
                  <div className="text-sm text-gray-400">By {selectedResource.sellerName}</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedResource && deleteResourceMutation.mutate(selectedResource.id)}
              disabled={deleteResourceMutation.isPending}
            >
              {deleteResourceMutation.isPending ? "Deleting..." : "Delete Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Resource Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Resource</DialogTitle>
            <DialogDescription>
              Upload a new curriculum resource to the platform.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateResource}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileUpload
                    onUploadComplete={(url) => {
                      setUploadedFileUrl(url);
                      
                      // Extract file type from URL
                      const fileType = url.includes('.pdf') ? 'pdf' 
                        : url.includes('.mp3') ? 'audio'
                        : url.includes('.mp4') ? 'video'
                        : (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) ? 'image'
                        : 'application';
                    }}
                    uploadEndpoint="/api/upload/curriculum-resource"
                    acceptedTypes="application/pdf,image/*,audio/*,video/*,.doc,.docx"
                    label="Resource File"
                    buttonText="Browse Files"
                    maxSizeMB={20}
                  />
                  
                  {uploadedFileUrl && (
                    <div className="mt-4 bg-gray-50 rounded-md p-3 flex items-center">
                      <FileText className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-500">
                        {uploadedFileUrl.split('/').pop()}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-gray-500 text-sm mt-4">
                    Supported file types: PDF, DOC, DOCX, MP3, MP4, JPG, PNG
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Maximum file size: 20 MB
                  </p>
                </div>
                
                {/* Basic Info */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="Enter resource title"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description *
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    required
                    placeholder="Enter a description of the resource"
                  />
                </div>
                
                <div>
                  <label htmlFor="detailedDescription" className="block text-sm font-medium mb-1">
                    Detailed Description (Optional)
                  </label>
                  <Textarea
                    id="detailedDescription"
                    name="detailedDescription"
                    rows={5}
                    placeholder="Enter a detailed description with formatting guidelines, usage instructions, etc."
                  />
                </div>
                
                {/* Categories */}
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
                    Category (Optional)
                  </label>
                  <Select name="categoryId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium mb-1">
                      Standard Price ($)
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="pricePremium" className="block text-sm font-medium mb-1">
                      Premium Price ($)
                    </label>
                    <Input
                      id="pricePremium"
                      name="pricePremium"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="priceRoyalty" className="block text-sm font-medium mb-1">
                      Royalty Price ($)
                    </label>
                    <Input
                      id="priceRoyalty"
                      name="priceRoyalty"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                </div>
                
                {/* Status & Featured */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <Select name="status" defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox 
                      id="isFeatured" 
                      name="isFeatured"
                    />
                    <label htmlFor="isFeatured" className="text-sm font-medium">
                      Featured Resource
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createResourceMutation.isPending || !uploadedFileUrl}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                {createResourceMutation.isPending ? "Creating..." : "Create Resource"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}