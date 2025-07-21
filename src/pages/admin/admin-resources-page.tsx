import {
  FileText,
  Search,
  Trash,
  Edit,
  Package,
  X,
  Plus,
  Upload,
  Image,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ResourceType } from "./ResourceType";

// API Configuration
const API_BASE_URL = "https://api.livetestdomain.com";
const UPLOAD_ENDPOINT = "https://api.livetestdomain.com/api/upload";

// Helper for price formatting
const formatPrice = (price: string | number | null) => {
  if (!price) return "$0.00";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
};

// Helper for file type detection
const getResourceType = (fileUrl: string, fileName: string = "") => {
  const url = fileUrl.toLowerCase();
  const name = fileName.toLowerCase();

  if (
    url.includes(".mp4") ||
    url.includes(".mov") ||
    url.includes(".avi") ||
    name.includes(".mp4")
  ) {
    return "VIDEO";
  }
  if (
    url.includes(".mp3") ||
    url.includes(".wav") ||
    url.includes(".m4a") ||
    name.includes(".mp3")
  ) {
    return "AUDIO";
  }
  if (url.includes(".pdf") || name.includes(".pdf")) {
    return "DOCUMENT";
  }
  if (
    url.includes(".jpg") ||
    url.includes(".png") ||
    url.includes(".jpeg") ||
    name.includes(".jpg")
  ) {
    return "IMAGE";
  }
  return "DOCUMENT"; // Default fallback
};

// Dance styles options
const DANCE_STYLES = [
  "Ballet",
  "Hip-Hop",
  "Jazz",
  "Contemporary",
  "Salsa",
  "Bachata",
  "Ballroom",
  "Latin",
  "Tap",
  "Lyrical",
  "Commercial",
  "Breakdancing",
  "Krump",
  "House",
  "Waacking",
  "Voguing",
  "Other",
];

// Difficulty levels
const DIFFICULTY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Professional",
];

// Age ranges
const AGE_RANGES = [
  "3-5",
  "6-8",
  "9-12",
  "13-17",
  "18-25",
  "26-35",
  "36-45",
  "46+",
  "All Ages",
];

export default function AdminResourcesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<
    string | null
  >(null);
  const [resourceType, setResourceType] = useState<string>("VIDEO");
  const [isMainFileUploading, setIsMainFileUploading] = useState(false);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  // Add isFeatured state
  const [isFeatured, setIsFeatured] = useState(false);

  // Fetch resources from the new API
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["/api/resources"],
    queryFn: async () => {
      const res = await apiRequest(`/api/resources`, {
        method: "GET",
      });
      if (!res) {
        throw new Error("Failed to fetch resources");
      }
      const data = await res;
      console.log("Resources from API:", data);
      return data;
    },
  });
  console.log(resources);

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/resource-categories"],
    queryFn: async () => {
      const res = await apiRequest("/api/resource-categories", {
        method: "GET",
      });
      console.log("Resource categories", res);
      return await res;
    },
  });

  // Create resource mutation with new API
  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      const response = await apiRequest(`/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(resourceData),
      });

      if (!response) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Created Successfully",
        description: `Resource has been added to the curriculum.`,
      });
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description:
          error instanceof Error ? error.message : "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`${API_BASE_URL}/api/resources/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Updated",
        description: "The resource has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/resources/${id}`, {
        method: "DELETE",
      });

      if (!response) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.status === 204 ? {} : await response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Deleted",
        description: "The resource has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // Reset create form
  const resetCreateForm = () => {
    setUploadedFileUrl(null);
    setUploadedThumbnailUrl(null);
    setResourceType("VIDEO");
    setIsMainFileUploading(false);
    setIsThumbnailUploading(false);
    setIsFeatured(false); // Reset isFeatured
  };

  // Calculate counts for each category
  const pendingCount = resources.filter((r: any) => {
    const status = (r.status || "").toLowerCase();
    return (
      status === "pending" ||
      status === "pending_approval" ||
      r.isApproved === false
    );
  }).length;

  const approvedCount = resources.filter((r: any) => {
    const status = (r.status || "").toLowerCase();
    return (
      status === "approved" ||
      status === "published" ||
      status === "active" ||
      r.isApproved === true
    );
  }).length;

  const rejectedCount = resources.filter((r: any) => {
    const status = (r.status || "").toLowerCase();
    return status === "rejected";
  }).length;

  const featuredCount = resources.filter(
    (r: any) => r.isFeatured === true
  ).length;

  // Filter resources based on search and tab
  const filteredResources = resources.filter((resource: any) => {
    const matchesSearch =
      !searchQuery ||
      resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.danceStyle?.toLowerCase().includes(searchQuery.toLowerCase());

    const resourceStatus = (resource.status || "").toLowerCase();
    const isResourcePending =
      resourceStatus === "pending" ||
      resourceStatus === "pending_approval" ||
      resource.isApproved === false;

    const isResourceApproved =
      resourceStatus === "approved" ||
      resourceStatus === "published" ||
      resourceStatus === "active" ||
      resource.isApproved === true;

    const isResourceRejected = resourceStatus === "rejected";
    const isResourceFeatured = resource.isFeatured === true;

    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "pending") return matchesSearch && isResourcePending;
    if (selectedTab === "approved") return matchesSearch && isResourceApproved;
    if (selectedTab === "rejected") return matchesSearch && isResourceRejected;
    if (selectedTab === "featured") return matchesSearch && isResourceFeatured;

    return matchesSearch;
  });

  // Handle resource creation form submission
  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    // Enhanced validation with better error messages
    if (!uploadedFileUrl) {
      toast({
        title: "Main File Required",
        description:
          "Please upload the main resource file before creating the resource. Click 'Choose Main File' to upload.",
        variant: "destructive",
      });
      return;
    }

    if (isMainFileUploading || isThumbnailUploading) {
      toast({
        title: "Upload In Progress",
        description:
          "Please wait for the file upload to complete before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Check required form fields
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const danceStyle = formData.get("danceStyle") as string;
    const difficultyLevel = formData.get("difficultyLevel") as string;
    const ageRange = formData.get("ageRange") as string;

    if (
      !title ||
      !description ||
      !danceStyle ||
      !difficultyLevel ||
      !ageRange
    ) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields (marked with *).",
        variant: "destructive",
      });
      return;
    }

    // Build the payload according to API specification
    const resourcePayload: {
      title: string;
      description: string;
      price: number;
      ageRange: string;
      categoryId: number | null;
      danceStyle: string;
      difficultyLevel: string;
      thumbnailUrl: string;
      type: ResourceType;
      url: string;
      isFeatured: boolean; // Add isFeatured to the payload
    } = {
      title,
      description,
      price: parseFloat(price || "0"),
      ageRange,
      categoryId: parseInt(formData.get("categoryId") as string) || null,
      danceStyle,
      difficultyLevel,
      thumbnailUrl: uploadedThumbnailUrl || "",
      type: resourceType as ResourceType,
      url: uploadedFileUrl!,
      isFeatured, // Include isFeatured in the payload
    };

    console.log("Sending resource payload:", resourcePayload);

    // Show a loading toast
    toast({
      title: "Creating Resource",
      description: "Please wait while we create your resource...",
    });

    createResourceMutation.mutate(resourcePayload);
  };

  // Handle resource edit
  const handleUpdateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    const formData = new FormData(e.target as HTMLFormElement);

    const updateData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: parseFloat((formData.get("price") as string) || "0"),
      ageRange: formData.get("ageRange") as string,
      danceStyle: formData.get("danceStyle") as string,
      difficultyLevel: formData.get("difficultyLevel") as string,
      // status: formData.get("status") as string,
      isFeatured: formData.has("isFeatured"),
    };

    updateResourceMutation.mutate({
      id: selectedResource.id,
      data: updateData,
    });
  };

  // Handle quick status change
  const handleQuickStatusChange = (id: number, status: string) => {
    const isApproved =
      status === "approved" ? true : status === "rejected" ? false : null;

    updateResourceMutation.mutate({
      id,
      data: {
        status,
        isApproved,
      },
    });
  };

  // Handle featured toggle
  const handleFeaturedToggle = (id: number, isFeatured: boolean) => {
    updateResourceMutation.mutate({
      id,
      data: { isFeatured: !isFeatured },
    });
  };

  // Dialog handlers
  const openEditDialog = (resource: any) => {
    setSelectedResource(resource);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (resource: any) => {
    setSelectedResource(resource);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string, isApproved?: boolean) => {
    const statusLower = (status || "").toLowerCase();

    if (statusLower === "approved") {
      return <Badge className="bg-green-600">Approved</Badge>;
    } else if (statusLower === "published" || statusLower === "active") {
      return <Badge className="bg-green-600">Published</Badge>;
    } else if (
      statusLower === "pending" ||
      statusLower === "pending_approval" ||
      isApproved === false
    ) {
      return <Badge className="bg-yellow-600">Pending</Badge>;
    } else if (statusLower === "rejected") {
      return <Badge className="bg-red-600">Rejected</Badge>;
    } else {
      return <Badge className="bg-gray-600">{status || "Unknown"}</Badge>;
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "VIDEO":
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      case "AUDIO":
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      case "DOCUMENT":
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case "IMAGE":
        return <div className="w-2 h-2 rounded-full bg-purple-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500"></div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Resource Management
          </h1>
          <p className="text-gray-400">
            Manage dance curriculum resources and content
          </p>
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
          placeholder="Search resources by title, description, or dance style..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Resources ({resources.length})
          </TabsTrigger>
          {/* <TabsTrigger value="pending" className="relative">
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
          </TabsTrigger> */}
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
                  <p className="text-gray-400 text-center">
                    No resources found
                  </p>
                  {searchQuery && (
                    <p className="text-sm text-gray-500 mt-2">
                      Try adjusting your search criteria
                    </p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Type & Style</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Price</TableHead>
                        {/* <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.map((resource: any) => (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-12 rounded bg-gray-800 flex items-center justify-center overflow-hidden">
                                {resource.thumbnailUrl ? (
                                  <img
                                    src={resource.thumbnailUrl}
                                    alt={resource.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {resource.title}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {resource.description
                                    ? resource.description.length > 50
                                      ? resource.description.substring(0, 50) +
                                        "..."
                                      : resource.description
                                    : "No description"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getResourceTypeIcon(resource.type)}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {resource.type}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {resource.danceStyle}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-gray-400">Level:</span>{" "}
                                {resource.difficultyLevel}
                              </div>
                              <div>
                                <span className="text-gray-400">Age:</span>{" "}
                                {resource.ageRange}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatPrice(resource.price)}
                            </div>
                          </TableCell>
                          {/* <TableCell>
                            {getStatusBadge(
                              resource.status || "pending",
                              resource.isApproved
                            )}
                          </TableCell> */}
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* {resource.status !== "approved" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleQuickStatusChange(
                                      resource.id,
                                      "approved"
                                    )
                                  }
                                  className="bg-green-950 hover:bg-green-900 text-white"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )} */}
                              {/* {resource.status !== "rejected" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleQuickStatusChange(
                                      resource.id,
                                      "rejected"
                                    )
                                  }
                                  className="bg-red-950 hover:bg-red-900 text-white"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              )} */}
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

      {/* Create Resource Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Dance Resource</DialogTitle>
            <DialogDescription>
              Upload a new dance curriculum resource to the platform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateResource}>
            <div className="grid gap-6 py-4">
              {/* File Upload Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Resource Files
                </Label>

                {/* Main Resource File */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div>
                      <Label className="text-sm font-medium">
                        Main Resource File *
                      </Label>
                      <p className="text-xs text-gray-500">
                        Upload your dance instruction video, audio, or document
                      </p>
                    </div>
                  </div>

                  {/* Custom File Selection and Upload */}
                  <div className="mt-4 space-y-4">
                    {!uploadedFileUrl ? (
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-blue-50 border-blue-200 text-blue-700"
                          onClick={() =>
                            document.getElementById("main-file-input")?.click()
                          }
                          disabled={isMainFileUploading}
                        >
                          {isMainFileUploading ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Main File
                            </>
                          )}
                        </Button>

                        {/* Hidden file input */}
                        <input
                          id="main-file-input"
                          type="file"
                          accept="video/*,audio/*,application/pdf,.doc,.docx,image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            console.log(file);
                            // Validate file size
                            if (file.size > 50 * 1024 * 1024) {
                              toast({
                                title: "File Too Large",
                                description:
                                  "Please select a file smaller than 50MB.",
                                variant: "destructive",
                              });
                              return;
                            }

                            setIsMainFileUploading(true);

                            try {
                              console.log(
                                "Starting file upload to:",
                                UPLOAD_ENDPOINT
                              );
                              console.log("Using authentication: Bearer token");
                              console.log("File details:", {
                                name: file.name,
                                size:
                                  (file.size / 1024 / 1024).toFixed(2) + "MB",
                                type: file.type,
                              });
                              console.log(
                                "Sending only file data (no additional metadata)"
                              );

                              // Create FormData
                              const formData = new FormData();
                              formData.append("file", file);
                              // Remove type and entity_type fields as API doesn't expect them

                              // Debug FormData contents
                              console.log("Thumbnail FormData contents:");
                              for (let [key, value] of formData.entries()) {
                                if (value instanceof File) {
                                  console.log(
                                    `- ${key}: File[${value.name}, ${value.size} bytes, ${value.type}]`
                                  );
                                } else {
                                  console.log(`- ${key}: ${value}`);
                                }
                              }

                              // Debug FormData contents
                              console.log("FormData contents:");
                              for (let [key, value] of formData.entries()) {
                                if (value instanceof File) {
                                  console.log(
                                    `- ${key}: File[${value.name}, ${value.size} bytes, ${value.type}]`
                                  );
                                } else {
                                  console.log(`- ${key}: ${value}`);
                                }
                              }

                              // Upload to server
                              const response = await apiRequest(
                                UPLOAD_ENDPOINT,
                                {
                                  method: "POST",
                                  data: formData,
                                  headers: {
                                    "Content-Type": "multipart/form-data",
                                  },
                                }
                              );

                              if (!response) {
                                let errorMessage = `Upload failed with status ${response.status}`;
                                try {
                                  const errorData = await response.data;
                                  console.error(
                                    "API Error Response:",
                                    errorData
                                  );
                                  errorMessage =
                                    errorData.message ||
                                    errorData.error ||
                                    errorMessage;
                                  if (Array.isArray(errorData.message)) {
                                    errorMessage = errorData.message.join(", ");
                                  }
                                } catch (parseError) {
                                  const errorText = await response;
                                  console.error(
                                    "Raw error response:",
                                    errorText
                                  );
                                  errorMessage = errorText || errorMessage;
                                }
                                throw new Error(errorMessage);
                              }

                              const result = await response.data;
                              console.log(
                                "Upload successful - Full response:",
                                result
                              );

                              // Try multiple possible URL field names
                              const fileUrl =
                                result.url ||
                                result.file_url ||
                                result.fileUrl ||
                                result.downloadUrl ||
                                result.path ||
                                result.location ||
                                result.data?.url ||
                                result.data?.file_url;

                              console.log("Extracted file URL:", fileUrl);
                              console.log(
                                "Available response keys:",
                                Object.keys(result)
                              );

                              if (!fileUrl) {
                                console.error(
                                  "No file URL found in response. Available fields:",
                                  Object.keys(result)
                                );
                                throw new Error(
                                  `No file URL returned from server. Response keys: ${Object.keys(result).join(", ")}`
                                );
                              }

                              setUploadedFileUrl(fileUrl);

                              // Detect resource type
                              const detectedType = getResourceType(
                                fileUrl,
                                file.name
                              );
                              setResourceType(detectedType);

                              console.log(
                                "File upload completed successfully:",
                                {
                                  url: fileUrl,
                                  type: detectedType,
                                  uploadedFileUrl: fileUrl,
                                }
                              );

                              toast({
                                title: "File Uploaded Successfully",
                                description: `${file.name} has been uploaded as a ${detectedType.toLowerCase()} resource.`,
                              });
                            } catch (error) {
                              console.error("Upload error:", error);
                              toast({
                                title: "Upload Failed",
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to upload file. Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsMainFileUploading(false);
                              // Reset the input
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getResourceTypeIcon(resourceType)}
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                ✓ File uploaded successfully
                              </p>
                              <p className="text-xs text-green-600">
                                {uploadedFileUrl.split("/").pop()} (
                                {resourceType})
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById("main-file-input")
                                  ?.click()
                              }
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Change File
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadedFileUrl(null);
                                setResourceType("VIDEO");
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* File validation info */}
                    <div className="text-xs text-gray-500 text-center">
                      <p>
                        Supported formats: MP4, MOV, MP3, WAV, PDF, DOC, DOCX,
                        JPG, PNG
                      </p>
                      <p>Maximum file size: 50MB</p>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Image className="h-4 w-4 text-gray-500" />
                    <Label className="text-sm font-medium">
                      Thumbnail Image (Optional)
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload a preview image for your resource
                  </p>

                  {/* Custom Thumbnail Selection and Upload */}
                  <div className="space-y-3">
                    {!uploadedThumbnailUrl ? (
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          onClick={() =>
                            document
                              .getElementById("thumbnail-file-input")
                              ?.click()
                          }
                          disabled={isThumbnailUploading}
                        >
                          {isThumbnailUploading ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Image className="h-4 w-4 mr-2" />
                              Choose Thumbnail
                            </>
                          )}
                        </Button>

                        {/* Hidden thumbnail file input */}
                        <input
                          id="thumbnail-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Validate file size
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: "Image Too Large",
                                description:
                                  "Please select an image smaller than 5MB.",
                                variant: "destructive",
                              });
                              return;
                            }

                            setIsThumbnailUploading(true);

                            try {
                              console.log(
                                "Starting thumbnail upload to:",
                                UPLOAD_ENDPOINT
                              );
                              console.log("Using authentication: Bearer token");
                              console.log("Thumbnail details:", {
                                name: file.name,
                                size:
                                  (file.size / 1024 / 1024).toFixed(2) + "MB",
                                type: file.type,
                              });
                              console.log(
                                "Sending only file data (no additional metadata)"
                              );

                              // Create FormData
                              const formData = new FormData();
                              formData.append("file", file);
                              // Remove type and entity_type fields as API doesn't expect them

                              // Upload to server
                              const response = await apiRequest(
                                UPLOAD_ENDPOINT,
                                {
                                  method: "POST",
                                  data: formData,
                                  headers: {
                                    "Content-Type": "multipart/form-data",
                                  },
                                }
                              );

                              if (!response) {
                                let errorMessage = `Thumbnail upload failed with status ${response.status}`;
                                try {
                                  const errorData = await response;
                                  console.error(
                                    "Thumbnail API Error Response:",
                                    errorData
                                  );
                                  errorMessage =
                                    errorData.message ||
                                    errorData.error ||
                                    errorMessage;
                                  if (Array.isArray(errorData.message)) {
                                    errorMessage = errorData.message.join(", ");
                                  }
                                } catch (parseError) {
                                  const errorText = await response;
                                  console.error(
                                    "Raw thumbnail error response:",
                                    errorText
                                  );
                                  errorMessage = errorText || errorMessage;
                                }
                                throw new Error(errorMessage);
                              }

                              const result = await response;
                              console.log(
                                "Thumbnail upload successful - Full response:",
                                result
                              );

                              // Try multiple possible URL field names
                              const imageUrl =
                                result.url ||
                                result.image_url ||
                                result.fileUrl ||
                                result.file_url ||
                                result.downloadUrl ||
                                result.path ||
                                result.location ||
                                result.data?.url ||
                                result.data?.image_url;

                              console.log("Extracted thumbnail URL:", imageUrl);
                              console.log(
                                "Available response keys:",
                                Object.keys(result)
                              );

                              if (!imageUrl) {
                                console.error(
                                  "No image URL found in response. Available fields:",
                                  Object.keys(result)
                                );
                                throw new Error(
                                  `No image URL returned from server. Response keys: ${Object.keys(result).join(", ")}`
                                );
                              }

                              setUploadedThumbnailUrl(imageUrl);

                              console.log(
                                "Thumbnail upload completed successfully:",
                                {
                                  url: imageUrl,
                                  uploadedThumbnailUrl: imageUrl,
                                }
                              );

                              toast({
                                title: "Thumbnail Uploaded",
                                description: `${file.name} has been uploaded successfully.`,
                              });
                            } catch (error) {
                              console.error("Thumbnail upload error:", error);
                              toast({
                                title: "Thumbnail Upload Failed",
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to upload thumbnail. Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsThumbnailUploading(false);
                              // Reset the input
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={uploadedThumbnailUrl}
                              alt="Thumbnail preview"
                              className="h-10 w-10 rounded object-cover border border-green-300"
                            />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                ✓ Thumbnail uploaded
                              </p>
                              <p className="text-xs text-green-600">
                                {uploadedThumbnailUrl.split("/").pop()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById("thumbnail-file-input")
                                  ?.click()
                              }
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadedThumbnailUrl(null)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 text-center">
                      <p>Supported formats: JPG, PNG, GIF, WebP</p>
                      <p>Maximum file size: 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Basic Information
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      placeholder="e.g., Beginner Salsa Routine"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="29.99"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    required
                    placeholder="Describe what students will learn from this resource..."
                  />
                </div>
              </div>

              <Separator />

              {/* Dance Specifics */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Dance Specifics
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="danceStyle">Dance Style *</Label>
                    <Select name="danceStyle" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dance style" />
                      </SelectTrigger>
                      <SelectContent>
                        {DANCE_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficultyLevel">Difficulty Level *</Label>
                    <Select name="difficultyLevel" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ageRange">Age Range *</Label>
                    <Select name="ageRange" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age range" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Resource Type Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Resource Type *
                </Label>
                <Select
                  value={resourceType}
                  onValueChange={(val) => setResourceType(val as ResourceType)}
                  required
                  name="resourceType"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ResourceType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryId">Category (Optional)</Label>
                  <Select name="categoryId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add isFeatured checkbox to the form */}
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    name="isFeatured"
                  />
                  <span>Featured Resource</span>
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              {/* Status indicator for form completion */}
              <div className="flex-1 text-left">
                {!uploadedFileUrl && (
                  <div className="text-sm text-amber-600 mb-2">
                    {/* <span className="font-medium">⚠️ Upload a main file to enable resource creation</span> */}
                  </div>
                )}
                {uploadedFileUrl && !createResourceMutation.isPending && (
                  <div className="text-sm text-green-600 mb-2">
                    <span className="font-medium">
                      ✅ Ready to create resource
                    </span>
                  </div>
                )}
                {(isMainFileUploading || isThumbnailUploading) && (
                  <div className="text-sm text-blue-600 mb-2">
                    <span className="font-medium">
                      ⏳ Upload in progress...
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createResourceMutation.isPending ||
                    // !uploadedFileUrl ||
                    isMainFileUploading ||
                    isThumbnailUploading
                  }
                  className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createResourceMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Resource"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={selectedResource.title}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={selectedResource.description}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="danceStyle">Dance Style</Label>
                      <Select
                        name="danceStyle"
                        defaultValue={selectedResource.danceStyle}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dance style" />
                        </SelectTrigger>
                        <SelectContent>
                          {DANCE_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                      <Select
                        name="difficultyLevel"
                        defaultValue={selectedResource.difficultyLevel}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ageRange">Age Range</Label>
                      <Select
                        name="ageRange"
                        defaultValue={selectedResource.ageRange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_RANGES.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={selectedResource.price || "0.00"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        name="status"
                        defaultValue={selectedResource.status || "pending"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="isFeatured"
                        name="isFeatured"
                        defaultChecked={selectedResource.isFeatured}
                      />
                      <Label htmlFor="isFeatured">Featured Resource</Label>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateResourceMutation.isPending}
                >
                  {updateResourceMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
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
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedResource && (
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center overflow-hidden">
                  {selectedResource.thumbnailUrl ? (
                    <img
                      src={selectedResource.thumbnailUrl}
                      alt={selectedResource.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{selectedResource.title}</div>
                  <div className="text-sm text-gray-400">
                    {selectedResource.danceStyle} •{" "}
                    {selectedResource.difficultyLevel}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedResource &&
                deleteResourceMutation.mutate(selectedResource.id)
              }
              disabled={deleteResourceMutation.isPending}
            >
              {deleteResourceMutation.isPending
                ? "Deleting..."
                : "Delete Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
