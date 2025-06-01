import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Resource, ResourcePurchase } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, FileText, Music, Video, Image, 
  Package, Download, Award, ThumbsUp, Filter, Search, Pencil, 
  Plus, Trash2, AlertCircle, Check, BarChart, Calendar 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CachedImage } from "@/components/ui/cached-image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"created" | "purchased">("created");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "alphabetical">("newest");
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch resources created by the user
  const { data: createdResources = [], isLoading: isLoadingCreated } = useQuery<Resource[]>({
    queryKey: ["/api/resources/my-resources"],
    enabled: !!user && activeTab === "created",
    onSuccess: (data) => {
      console.log("My Resources API Call Succeeded:", data);
    },
    onError: (error) => {
      console.error("My Resources API Call Failed:", error);
    }
  });

  // Fetch resources purchased by the user
  const { data: purchasedResources = [], isLoading: isLoadingPurchased } = useQuery<ResourcePurchase[]>({
    queryKey: ["/api/resources/purchased"],
    enabled: !!user && activeTab === "purchased",
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const res = await apiRequest("DELETE", `/api/resources/${resourceId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources/my-resources"] });
      setShowDeleteDialog(false);
      setResourceToDelete(null);
      toast({
        title: "Resource Deleted",
        description: "Your resource has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle file type filter change
  const handleFileTypeChange = (value: string) => {
    setFileTypeFilter(value);
  };

  // Handle sort by change
  const handleSortByChange = (value: "newest" | "popular" | "alphabetical") => {
    setSortBy(value);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "created" | "purchased");
  };

  // Handle resource delete button click
  const handleDeleteResource = (resource: Resource) => {
    setResourceToDelete(resource);
    setShowDeleteDialog(true);
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />;
      case "audio":
        return <Music className="h-6 w-6 text-purple-500" />;
      case "video":
        return <Video className="h-6 w-6 text-blue-500" />;
      case "image":
        return <Image className="h-6 w-6 text-green-500" />;
      default:
        return <Package className="h-6 w-6 text-gray-500" />;
    }
  };

  // Filter and sort resources
  const filterAndSortResources = (resources: Resource[]) => {
    return resources
      .filter(resource => {
        // Filter by search query
        if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Filter by file type
        if (fileTypeFilter && resource.fileType !== fileTypeFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "popular":
            return (b.downloadCount || 0) - (a.downloadCount || 0);
          case "alphabetical":
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  };

  // Get purchased resources with details
  const getPurchasedResourceDetails = () => {
    // This assumes that the purchasedResources endpoint returns a joined result
    // with both purchase info and resource details
    return purchasedResources.map(purchase => ({
      ...purchase.resource,
      purchaseDate: purchase.orderedAt,
      purchaseStatus: purchase.status
    }));
  };

  const filteredCreatedResources = filterAndSortResources(createdResources);
  const purchasedResourceDetails = getPurchasedResourceDetails();
  
  const isLoading = activeTab === "created" ? isLoadingCreated : isLoadingPurchased;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to view your resources.</p>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">My Resources</h1>
        <Link href="/resources/upload">
          <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
            <Plus className="mr-2 h-4 w-4" />
            Upload New Resource
          </Button>
        </Link>
      </div>

      {/* Tabs for Created/Purchased Resources */}
      <Tabs defaultValue="created" value={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="created">Resources I Created</TabsTrigger>
          <TabsTrigger value="purchased">Resources I Purchased</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={fileTypeFilter}
                onValueChange={handleFileTypeChange}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF Documents</SelectItem>
                  <SelectItem value="audio">Audio Files</SelectItem>
                  <SelectItem value="video">Video Tutorials</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={sortBy}
                onValueChange={(value) => handleSortByChange(value as "newest" | "popular" | "alphabetical")}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Created Resources Tab */}
        <TabsContent value="created" className="mt-0">
          {!isLoading && filteredCreatedResources.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-semibold mb-2">No Resources Created</h2>
              <p className="text-gray-600 mb-6">
                You haven't created any resources yet. Upload your first resource to share with the community.
              </p>
              <Link href="/resources/upload">
                <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Resource
                </Button>
              </Link>
            </div>
          ) : !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreatedResources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden">
                  <div className="h-40 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <CachedImage
                      src={resource.imageUrl || resource.fileUrl || resource.thumbnailUrl}
                      alt={resource.title}
                      className="w-full h-full"
                      imgClassName="object-cover transition-transform hover:scale-105"
                      contentType="resource"
                      fallback={
                        <div className="text-center p-4">
                          {getFileTypeIcon(resource.fileType || "other")}
                        </div>
                      }
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-1">{resource.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0 h-5 bg-gray-50"
                      >
                        {resource.fileType || "Document"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created on {formatDate(resource.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-500">{resource.downloadCount || 0}</span>
                      </div>
                      <div>
                        {Number(resource.price) === 0 
                          ? <span className="text-green-600 font-medium">Free</span> 
                          : <span className="font-medium">${Number(resource.price).toFixed(2)}</span>
                        }
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <BarChart className="mr-2 h-4 w-4" />
                          View Statistics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Resource
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteResource(resource)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Resource
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href={`/resources/${resource.id}`}>
                      <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Purchased Resources Tab */}
        <TabsContent value="purchased" className="mt-0">
          {!isLoading && purchasedResourceDetails.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-semibold mb-2">No Purchased Resources</h2>
              <p className="text-gray-600 mb-6">
                You haven't purchased any resources yet. Browse the resource marketplace to find valuable teaching materials.
              </p>
              <Link href="/resources">
                <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                  Browse Resources
                </Button>
              </Link>
            </div>
          ) : !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedResourceDetails.map((purchase) => (
                <Card key={purchase.id} className="overflow-hidden">
                  <div className="h-40 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <CachedImage
                      src={purchase.imageUrl || purchase.fileUrl || purchase.thumbnailUrl}
                      alt={purchase.title}
                      className="w-full h-full"
                      imgClassName="object-cover transition-transform hover:scale-105"
                      contentType="resource"
                      fallback={
                        <div className="text-center p-4">
                          {getFileTypeIcon(purchase.fileType || "other")}
                        </div>
                      }
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-1">{purchase.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0 h-5 bg-gray-50"
                      >
                        {purchase.fileType || "Document"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Purchased on {formatDate(purchase.purchaseDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      {purchase.purchaseStatus === 'completed' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Purchase Complete
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {purchase.purchaseStatus}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="font-bold">
                      ${Number(purchase.price).toFixed(2)}
                    </div>
                    <Link href={`/resources/${purchase.id}`}>
                      <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resourceToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resourceToDelete && deleteResourceMutation.mutate(resourceToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteResourceMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}