import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Resource, ResourceCategory } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { API_ENDPOINTS, DEFAULT_RESOURCE_IMAGE, RESOURCE_THUMBNAILS } from "@/lib/constants";
import { 
  Search, Filter, Download, Award, ThumbsUp, FileText, 
  Music, Video, Image, Package, Plus, Loader2 
} from "lucide-react";
import { CachedImage } from "@/components/ui/cached-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type ResourceFilters = {
  search: string;
  category: string;
  fileType: string;
  sortBy: "popular" | "newest" | "price-low" | "price-high";
};

export default function CurriculumPage() {
  // Use try-catch to handle the case when AuthContext is not available
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Auth context not available, user will be null
    console.log("Auth context not available");
  }
  
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<ResourceFilters>({
    search: "",
    category: "all-categories",
    fileType: "all-types",
    sortBy: "popular",
  });

  // Fetch uploaded resources from our own system
  const { toast } = useToast();
  const { data: uploadedResources = [], isLoading: isLoadingUploadedResources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    retry: 3,
    refetchOnWindowFocus: false,
    // Using the QueryObserverOptions API instead of onError for compatibility
    onSuccess: (data) => {
      console.log("Successfully fetched resources:", data);
      // Display a success toast if we have resources
      if (data && data.length > 0) {
        toast({
          title: "Resources loaded",
          description: `Found ${data.length} curriculum resources.`,
          variant: "default"
        });
      }
    },
    onSettled: (data, error) => {
      if (error) {
        console.error("Error fetching resources:", error);
        toast({
          title: "Error loading resources",
          description: "There was a problem loading curriculum resources. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  // Map WooCommerce products to resource format and combine with uploaded resources
  const resources = useMemo(() => {
    console.log("Calculating resources array...");
    console.log("Upload resources:", uploadedResources);
    
    // Process uploaded resources (from our database)
    let processedResources: any[] = [];
    if (uploadedResources && Array.isArray(uploadedResources)) {
      console.log("Database resources found:", uploadedResources.length);
      processedResources = uploadedResources.map(resource => {
        // Create a new object with all properties from the resource
        return {
          // Ensure required properties are present
          id: resource.id || 0,
          title: resource.title || "Untitled Resource",
          description: resource.description || "",
          price: resource.price || "0",
          fileType: resource.fileType || "pdf",
          // Image handling - use consistent field
          imageUrl: resource.imageUrl || resource.fileUrl || resource.thumbnailUrl || DEFAULT_RESOURCE_IMAGE,
          downloadCount: resource.downloadCount || 0,
          status: resource.status || "active",
          sellerId: resource.sellerId || 1,
          // Other fields with fallbacks
          createdAt: resource.createdAt || new Date().toISOString(),
          updatedAt: resource.updatedAt || new Date().toISOString(),
          pricePremium: resource.pricePremium || resource.price || "0",
          priceRoyalty: resource.priceRoyalty || resource.price || "0",
          isFeatured: resource.isFeatured || false,
          // Include all other properties as is
          ...resource
        };
      });
    }
    
    // Combine WooCommerce resources with our uploaded resources
    const combinedResources = [...processedResources];
    console.log("Combined resources:", combinedResources.length);
    
    return combinedResources;
  }, [uploadedResources]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    // If "all-categories" is selected, set category filter to empty
    const categoryValue = value === "all-categories" ? "" : value;
    setFilters({ ...filters, category: categoryValue });
  };

  // Handle file type filter change
  const handleFileTypeChange = (value: string) => {
    // If "all-types" is selected, set fileType filter to empty
    const fileTypeValue = value === "all-types" ? "" : value;
    setFilters({ ...filters, fileType: fileTypeValue });
  };

  // Handle sort by change
  const handleSortByChange = (value: "popular" | "newest" | "price-low" | "price-high") => {
    setFilters({ ...filters, sortBy: value });
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Filter and sort resources
  const filteredResources = resources.filter((resource) => {
    // Filter by search term
    if (filters.search && !resource.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filter by file type
    if (filters.fileType && resource.fileType !== filters.fileType) {
      return false;
    }
    
    // Filter by category
    if (filters.category) {
      // This would require a join with resource categories
      // For now, we'll just assume each resource has categoryIds
      // const resourceCategories = resource.categoryIds || [];
      // return resourceCategories.includes(Number(filters.category));
      return true; // Placeholder until we implement category filtering properly
    }
    
    return true;
  });

  // Sort resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (filters.sortBy) {
      case "newest":
        // Handle potential null dates safely
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      case "price-low":
        return Number(a.price) - Number(b.price);
      case "price-high":
        return Number(b.price) - Number(a.price);
      case "popular":
      default:
        return (b.downloadCount || 0) - (a.downloadCount || 0);
    }
  });

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

  const isLoading = isLoadingUploadedResources;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Dance Curriculum Resources</h1>
        <p className="text-gray-600 text-xl max-w-3xl mx-auto">
          Browse our collection of high-quality resources to enhance your dance teaching and practice.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search resources..."
              className="pl-10"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={filters.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.fileType}
              onValueChange={handleFileTypeChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="pdf">PDF Documents</SelectItem>
                <SelectItem value="audio">Audio Files</SelectItem>
                <SelectItem value="video">Video Tutorials</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.sortBy}
              onValueChange={handleSortByChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Resource Tabs and Upload Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="choreography">Choreography</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {user && (
          <Link href="/curriculum/upload">
            <Button className="mt-4 md:mt-0 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </Link>
        )}
      </div>

      {/* Resources Grid */}
      {sortedResources.length === 0 ? (
        <div className="text-center py-16 bg-gray-100 rounded-lg">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">No Resources Found</h2>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or check back later.
          </p>
          <Button onClick={() => setFilters({ search: "", category: "all-categories", fileType: "all-types", sortBy: "popular" })}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedResources.map((resource) => (
            <div key={resource.id}>
              <Card className="overflow-hidden flex flex-col h-full w-full">
                <div className="h-40 overflow-hidden bg-gray-100 flex items-center justify-center">
                  <CachedImage
                    src={resource.imageUrl || resource.fileUrl || resource.thumbnailUrl || DEFAULT_RESOURCE_IMAGE}
                    alt={resource.title}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover transition-transform hover:scale-105"
                    contentType="resource"
                    fallback={
                      <div className="h-40 w-full flex items-center justify-center bg-gray-100">
                        {getFileTypeIcon(resource.fileType || "other")}
                      </div>
                    }
                  />
                </div>
                <CardHeader className="flex-none">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{resource.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0 h-5 bg-gray-50"
                    >
                      {resource.fileType || "Document"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-500">{resource.downloadCount || 0} downloads</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between mt-auto">
                  <div className="font-bold text-xl">
                    {Number(resource.price) === 0 
                      ? <span className="text-green-600">Free</span> 
                      : <span>${Number(resource.price).toFixed(2)}</span>
                    }
                  </div>
                  <Link href={`/curriculum/${resource.id}`}>
                    <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Featured Collections Banner */}
      <div className="mt-16 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">Premium Dance Collections</h2>
            <p className="text-gray-700 mb-6">
              Get access to curated collections of resources created by top dance educators.
              Each collection includes lesson plans, music, choreography notes, and more.
            </p>
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              Browse Collections
            </Button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">Lesson Plans</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <Music className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm font-medium">Music Tracks</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <Video className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm font-medium">Tutorial Videos</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Complete Packages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}