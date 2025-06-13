import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Filter, FileText, BarChart, FilePlus, 
  PlusCircle, Sparkles, Edit, Eye, ShoppingBag,
  Award, Download, CircleDollarSign, Settings,
  Clock, Send, Share, Heart, MessageSquare, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { CachedImage } from "@/components/ui/cached-image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API_ENDPOINTS, DEFAULT_SELLER_IMAGE, DEFAULT_RESOURCE_IMAGE } from "@/lib/constants";

// Resource type definition (simplified from schema.ts)
interface Resource {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  price: string;
  dance_style?: string;
  age_range?: string;
  difficulty_level?: string;
  download_count: number;
  sale_count: number;
  created_at: string;
  is_featured?: boolean;
}

// User type definition (simplified from schema.ts)
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  profile_image_url?: string;
  role: string;
}

// Format date utility
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function SellerStorePage() {
  const { sellerId } = useParams();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("resources");
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [danceStyleFilter, setDanceStyleFilter] = useState<string | null>(null);
  const [ageRangeFilter, setAgeRangeFilter] = useState<string | null>(null);
  const [difficultyLevelFilter, setDifficultyLevelFilter] = useState<string | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  // Convert sellerId to number
  const sellerIdNum = sellerId ? parseInt(sellerId) : currentUser?.id;
  
  // Is the current user viewing their own store?
  const isOwnStore = currentUser?.id === sellerIdNum;
  
  // Fetch seller information
  const { data: seller, isLoading: isLoadingSeller } = useQuery<User>({
    queryKey: [`/api/users/${sellerIdNum}`],
    enabled: !!sellerIdNum,
  });
  
  // Build query parameters for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (danceStyleFilter && danceStyleFilter !== 'all') params.append('danceStyle', danceStyleFilter);
    if (ageRangeFilter && ageRangeFilter !== 'all') params.append('ageRange', ageRangeFilter);
    if (difficultyLevelFilter && difficultyLevelFilter !== 'all') params.append('difficultyLevel', difficultyLevelFilter);
    if (showFeaturedOnly) params.append('featured', 'true');
    return params.toString();
  };
  
  // Fetch seller's resources with filters
  const { data: resources = [], isLoading: isLoadingResources } = useQuery<Resource[]>({
    queryKey: [`/api/resources/seller/${sellerIdNum}`, buildQueryParams()],
    enabled: !!sellerIdNum,
    queryFn: async () => {
      const params = buildQueryParams();
      const endpoint = `/api/resources/seller/${sellerIdNum}${params ? `?${params}` : ''}`;
      const response = await apiRequest(endpoint, { method: 'GET' });
      return response.json();
    }
  });
  
  // Filter resources by search term locally
  const filteredResources = resources.filter(resource => 
    searchTerm === "" || 
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get featured resources
  const featuredResources = resources.filter(resource => resource.is_featured);
  
  // Get recent uploads (last 3)
  const recentUploads = [...resources]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  // Calculate total sales and downloads
  const totalSales = resources.reduce((sum, resource) => sum + resource.sale_count, 0);
  const totalDownloads = resources.reduce((sum, resource) => sum + resource.download_count, 0);
  
  // Toggle Featured Resource mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ resourceId, isFeatured }: { resourceId: number, isFeatured: boolean }) => {
      const endpoint = API_ENDPOINTS.RESOURCES.TOGGLE_FEATURED(resourceId);
      const response = await apiRequest(endpoint, { 
        method: 'PATCH',
        data: { isFeatured },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update resource');
      }
      return response.json();
    },
    onSuccess: (updatedResource) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: [`/api/resources/seller/${sellerIdNum}`]
      });
      
      toast({
        title: updatedResource.isFeatured ? "Resource featured" : "Resource unfeatured",
        description: `"${updatedResource.title}" has been ${updatedResource.isFeatured ? "marked as featured" : "removed from featured resources"}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating resource",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const isLoading = isLoadingSeller || isLoadingResources || toggleFeatureMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Seller Not Found</h1>
        <p className="mb-8">The seller you're looking for doesn't exist or has been removed.</p>
        <Link href="/curriculum">
          <Button>Browse Curriculum</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Banner with seller info */}
      <div className="w-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col md:flex-row items-center mb-4 md:mb-0">
            <CachedAvatar
              src={seller.profile_image_url || DEFAULT_SELLER_IMAGE}
              alt={`${seller.first_name} ${seller.last_name}`}
              className="h-24 w-24 border-4 border-white mb-4 md:mb-0 md:mr-6"
              fallbackClassName="text-4xl"
              fallbackText={`${seller.first_name?.[0]}${seller.last_name?.[0]}`}
            />
            <div className="text-center md:text-left text-white">
              <h1 className="text-3xl font-bold mb-1">{seller.first_name} {seller.last_name}</h1>
              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4">
                <div className="flex items-center justify-center md:justify-start">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">Verified Seller</Badge>
                </div>
                {/* Rating display removed */}
                <div className="flex items-center justify-center md:justify-start">
                  <Award className="h-4 w-4 text-yellow-300 mr-1" />
                  <span>Premium Educator</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {isOwnStore ? (
              <>
                <Button variant="outline" className="bg-white text-purple-600 hover:bg-white/90" onClick={() => navigate("/profile/edit")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white text-purple-600 hover:bg-white/90" 
                  onClick={() => navigate("/seller/payments")}
                >
                  <CircleDollarSign className="h-4 w-4 mr-2" />
                  Payments
                </Button>
              </>
            ) : (
              <Button variant="outline" className="bg-white text-purple-600 hover:bg-white/90">
                <Send className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content with seller info and resources */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar with seller details */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">About the Seller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700">
                    {seller.bio || "This seller hasn't added a bio yet."}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold text-sm">Contact Information</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {seller.email}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold text-sm mb-2">Seller Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{resources.length}</p>
                      <p className="text-xs text-gray-500">Resources</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{totalSales}</p>
                      <p className="text-xs text-gray-500">Sales</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{totalDownloads}</p>
                      <p className="text-xs text-gray-500">Downloads</p>
                    </div>
                    {/* Rating display removed */}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold text-sm mb-2">Dance Specialties</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ballet</Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Contemporary</Badge>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Jazz</Badge>
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Hip-Hop</Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tap</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold text-sm mb-2">Member Since</h3>
                  <p className="text-sm text-gray-700">April 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {featuredResources.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Featured Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featuredResources.slice(0, 3).map(resource => (
                    <div key={resource.id} className="flex space-x-3">
                      <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                        {resource.image_url ? (
                          <CachedImage 
                            src={resource.image_url || DEFAULT_RESOURCE_IMAGE} 
                            alt={resource.title} 
                            className="h-full w-full"
                            fallback={
                              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                                <FileText className="h-6 w-6" />
                              </div>
                            }
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                            <FileText className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{resource.title}</h4>
                        <p className="text-sm text-blue-600 font-medium mt-1">${resource.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main content column */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Curriculum Resources</CardTitle>
                  <CardDescription>
                    Browse {isOwnStore ? "your" : `${seller.first_name}'s`} dance curriculum resources
                  </CardDescription>
                </div>
                {isOwnStore && (
                  <div className="flex space-x-2">
                    <Button onClick={() => navigate("/upload-resource")} className="bg-purple-600 hover:bg-purple-700">
                      <FilePlus className="h-4 w-4 mr-2" />
                      Create Resource
                    </Button>
                    <Button onClick={() => navigate("/simple-upload")} variant="outline" className="border-purple-600 text-purple-600">
                      <FilePlus className="h-4 w-4 mr-2" />
                      Simple Upload
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="resources" 
                value={selectedTab} 
                onValueChange={setSelectedTab}
                className="h-full"
              >
                <TabsList className="mb-6 w-full justify-start">
                  <TabsTrigger value="resources" className="flex-1 max-w-[180px]">
                    <FileText className="h-4 w-4 mr-2" />
                    All Resources
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex-1 max-w-[180px]">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Popular
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="flex-1 max-w-[180px]">
                    <Clock className="h-4 w-4 mr-2" />
                    Recently Added
                  </TabsTrigger>
                  {isOwnStore && (
                    <TabsTrigger value="analytics" className="flex-1 max-w-[180px]">
                      <BarChart className="h-4 w-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="resources" className="h-full">
                  {resources.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-semibold mb-2">No resources yet</h3>
                      <p className="text-gray-500 mb-4">
                        {isOwnStore 
                          ? "You haven't uploaded any curriculum resources yet." 
                          : `${seller.first_name} hasn't uploaded any curriculum resources yet.`}
                      </p>
                      {isOwnStore && (
                        <Button onClick={() => navigate("/upload-resource")} className="bg-purple-600 hover:bg-purple-700">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Your First Resource
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Search and Filter Controls */}
                      <div className="mb-6 space-y-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search resources..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        
                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                          {/* Dance Style Filter */}
                          <Select
                            value={danceStyleFilter || "all"}
                            onValueChange={(value) => setDanceStyleFilter(value === "all" ? null : value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Dance Style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Styles</SelectItem>
                              <SelectItem value="ballet">Ballet</SelectItem>
                              <SelectItem value="jazz">Jazz</SelectItem>
                              <SelectItem value="contemporary">Contemporary</SelectItem>
                              <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                              <SelectItem value="tap">Tap</SelectItem>
                              <SelectItem value="ballroom">Ballroom</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Age Range Filter */}
                          <Select
                            value={ageRangeFilter || "all"}
                            onValueChange={(value) => setAgeRangeFilter(value === "all" ? null : value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Age Range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Ages</SelectItem>
                              <SelectItem value="kids">Kids (3-12)</SelectItem>
                              <SelectItem value="teens">Teens (13-17)</SelectItem>
                              <SelectItem value="adults">Adults (18+)</SelectItem>
                              <SelectItem value="seniors">Seniors (55+)</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Difficulty Level Filter */}
                          <Select
                            value={difficultyLevelFilter || "all"}
                            onValueChange={(value) => setDifficultyLevelFilter(value === "all" ? null : value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Featured Toggle */}
                          <Button 
                            variant={showFeaturedOnly ? "default" : "outline"}
                            size="sm" 
                            className="h-10 flex items-center gap-1"
                            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                          >
                            <Award className="h-4 w-4" />
                            {showFeaturedOnly ? "Featured Only" : "All Resources"}
                          </Button>
                          
                          {/* Clear Filters */}
                          {(danceStyleFilter || ageRangeFilter || difficultyLevelFilter || showFeaturedOnly || searchTerm) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-10"
                              onClick={() => {
                                setDanceStyleFilter(null);
                                setAgeRangeFilter(null);
                                setDifficultyLevelFilter(null);
                                setShowFeaturedOnly(false);
                                setSearchTerm("");
                              }}
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Featured Resources Section */}
                      {!showFeaturedOnly && featuredResources.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center mb-4">
                            <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                            <h3 className="text-lg font-semibold">Featured Resources</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {featuredResources.map((resource) => (
                              <Card key={`featured-${resource.id}`} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="h-44 bg-gray-100 relative">
                                  <CachedImage 
                                    src={resource.image_url || DEFAULT_RESOURCE_IMAGE} 
                                    alt={resource.title}
                                    className="w-full h-full"
                                    imgClassName="object-cover transition-transform hover:scale-105"
                                    fallback={
                                      <div className="h-full w-full flex items-center justify-center bg-blue-50">
                                        <FileText className="h-12 w-12 text-blue-300" />
                                      </div>
                                    }
                                  />
                                  <Badge className="absolute top-2 right-2 bg-yellow-400 text-white border-0">
                                    <Award className="h-3 w-3 mr-1 fill-white" />
                                    Featured
                                  </Badge>
                                  {resource.dance_style && (
                                    <Badge variant="outline" className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-blue-700 border-blue-200">
                                      {resource.dance_style}
                                    </Badge>
                                  )}
                                </div>
                                <CardHeader className="pb-2 pt-4">
                                  <CardTitle className="text-lg leading-tight line-clamp-2">{resource.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-blue-600 text-xl font-bold">${parseFloat(resource.price).toFixed(2)}</p>
                                    <div className="flex items-center text-sm text-gray-500">
                                      <ShoppingBag className="h-3.5 w-3.5 mr-1 text-gray-400" /> 
                                      <span>{resource.sale_count}</span>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                                      <Link href={`/curriculum/${resource.id}`}>
                                        <Eye className="h-4 w-4 mr-2" /> View Details
                                      </Link>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* All Resources */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          {showFeaturedOnly ? "Featured Resources" : "All Resources"}
                          {searchTerm && ` matching "${searchTerm}"`}
                        </h3>
                        
                        {filteredResources.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold mb-2">No matching resources</h3>
                            <p className="text-gray-500 mb-4">
                              Try adjusting your filters or search criteria.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.map((resource) => (
                              <Card key={resource.id} className="h-full overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="relative h-44 overflow-hidden bg-gray-100">
                                  <CachedImage 
                                    src={resource.image_url} 
                                    alt={resource.title}
                                    className="w-full h-full"
                                    imgClassName="object-cover transition-transform hover:scale-105"
                                    fallback={
                                      <div className="h-full w-full flex items-center justify-center bg-blue-50">
                                        <FileText className="h-12 w-12 text-blue-300" />
                                      </div>
                                    }
                                  />
                                  {resource.is_featured && (
                                    <Badge className="absolute top-2 right-2 bg-yellow-400 text-white border-0">
                                      <Award className="h-3 w-3 mr-1 fill-white" />
                                      Featured
                                    </Badge>
                                  )}
                                  {resource.dance_style && (
                                    <Badge variant="outline" className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-blue-700 border-blue-200">
                                      {resource.dance_style}
                                    </Badge>
                                  )}
                                </div>
                                <CardHeader className="pb-2 pt-4">
                                  <CardTitle className="text-lg leading-tight line-clamp-2">{resource.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-2 flex-grow">
                                  <div className="flex items-center mb-3">
                                    <p className="text-blue-600 text-xl font-bold">${parseFloat(resource.price).toFixed(2)}</p>
                                    <div className="ml-auto flex items-center text-sm text-gray-500">
                                      <ShoppingBag className="h-3.5 w-3.5 mr-1 text-gray-400" /> 
                                      <span>{resource.sale_count}</span>
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                    {resource.description}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {resource.age_range && (
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                        {resource.age_range}
                                      </Badge>
                                    )}
                                    {resource.difficulty_level && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        {resource.difficulty_level}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                                <CardFooter className="pt-0 border-t">
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" /> 
                                      <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      {isOwnStore && (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <Settings className="h-4 w-4" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Resource Settings</DialogTitle>
                                              <DialogDescription>
                                                Manage settings for "{resource.title}"
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                              <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                  <h4 className="font-medium">Featured Resource</h4>
                                                  <p className="text-sm text-gray-500">
                                                    Display this resource in the featured section
                                                  </p>
                                                </div>
                                                <Switch 
                                                  checked={resource.is_featured} 
                                                  onCheckedChange={(checked) => {
                                                    toggleFeatureMutation.mutate({
                                                      resourceId: resource.id,
                                                      isFeatured: checked
                                                    });
                                                  }}
                                                />
                                              </div>
                                            </div>
                                            <DialogFooter>
                                              <Button 
                                                variant="outline" 
                                                onClick={() => {
                                                  const closeButton = document.querySelector('[data-state="open"][role="dialog"] button[aria-label="Close"]');
                                                  if (closeButton && closeButton instanceof HTMLElement) {
                                                    closeButton.click();
                                                  }
                                                }}
                                              >
                                                Close
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                      {(isOwnStore) && (
                                        <Button size="sm" variant="outline" asChild>
                                          <Link href={`/curriculum/${resource.id}/edit`}>
                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                          </Link>
                                        </Button>
                                      )}
                                      <Button size="sm" asChild>
                                        <Link href={`/curriculum/${resource.id}`}>
                                          <Eye className="h-4 w-4 mr-1" /> View
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </CardFooter>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>
                
                {isOwnStore && (
                  <TabsContent value="analytics">
                    <div className="space-y-8">
                      {/* Summary cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-500">Total Resources</p>
                              <FileText className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold">{resources.length}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-500">Total Sales</p>
                              <ShoppingBag className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold">{totalSales}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-500">Total Downloads</p>
                              <Download className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold">{totalDownloads}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-500">Featured Resources</p>
                              <Award className="h-4 w-4 text-yellow-500" />
                            </div>
                            <p className="text-3xl font-bold">{featuredResources.length}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Featured vs Non-Featured Comparison */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Featured vs. Regular Resources</CardTitle>
                          <CardDescription>
                            Compare performance between featured and regular resources
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-4">Performance Overview</h4>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                                    <span className="text-sm">Featured Resources</span>
                                  </div>
                                  <span className="font-medium">{featuredResources.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                                    <span className="text-sm">Regular Resources</span>
                                  </div>
                                  <span className="font-medium">{resources.length - featuredResources.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <span className="text-sm">Featured Downloads</span>
                                  </div>
                                  <span className="font-medium">
                                    {featuredResources.reduce((sum, r) => sum + r.download_count, 0)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                    <span className="text-sm">Featured Sales</span>
                                  </div>
                                  <span className="font-medium">
                                    {featuredResources.reduce((sum, r) => sum + r.sale_count, 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Simple chart visualization */}
                            <div className="flex flex-col">
                              <h4 className="text-sm font-medium text-gray-500 mb-4">Sales Comparison</h4>
                              <div className="flex-1 flex items-end space-x-2">
                                {/* Featured Resources Bar */}
                                <div className="flex flex-col items-center">
                                  <div 
                                    className="w-10 bg-primary rounded-t"
                                    style={{ 
                                      height: `${Math.min(100, (featuredResources.reduce((sum, r) => sum + r.sale_count, 0) / Math.max(1, totalSales)) * 100)}%` 
                                    }}
                                  ></div>
                                  <p className="text-xs mt-1">Featured</p>
                                </div>
                                
                                {/* Non-Featured Resources Bar */}
                                <div className="flex flex-col items-center">
                                  <div 
                                    className="w-10 bg-gray-300 rounded-t"
                                    style={{ 
                                      height: `${Math.min(100, ((totalSales - featuredResources.reduce((sum, r) => sum + r.sale_count, 0)) / Math.max(1, totalSales)) * 100)}%` 
                                    }}
                                  ></div>
                                  <p className="text-xs mt-1">Regular</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Top Performers */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Top Performing Resources</CardTitle>
                          <CardDescription>
                            Resources with the highest downloads and sales
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Top Downloads */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-3">By Downloads</h4>
                              <div className="space-y-4">
                                {[...resources]
                                  .sort((a, b) => b.download_count - a.download_count)
                                  .slice(0, 3)
                                  .map((resource, index) => (
                                    <div key={`download-${resource.id}`} className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                                        <span className="font-medium text-gray-700">{index + 1}</span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium line-clamp-1">{resource.title}</p>
                                        <div className="flex items-center gap-2">
                                          <Download className="h-3 w-3 text-gray-400" />
                                          <span className="text-xs text-gray-500">{resource.download_count} downloads</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            
                            {/* Top Sales */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-3">By Sales</h4>
                              <div className="space-y-4">
                                {[...resources]
                                  .sort((a, b) => b.sale_count - a.sale_count)
                                  .slice(0, 3)
                                  .map((resource, index) => (
                                    <div key={`sale-${resource.id}`} className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                                        <span className="font-medium text-gray-700">{index + 1}</span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium line-clamp-1">{resource.title}</p>
                                        <div className="flex items-center gap-2">
                                          <CircleDollarSign className="h-3 w-3 text-gray-400" />
                                          <span className="text-xs text-gray-500">{resource.sale_count} sales</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Recent Uploads */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {recentUploads.length > 0 ? (
                            recentUploads.map((resource) => (
                              <Card key={resource.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                                      {resource.image_url ? (
                                        <img 
                                          src={resource.image_url} 
                                          alt={resource.title} 
                                          className="h-full w-full object-cover rounded-md"
                                        />
                                      ) : (
                                        <FileText className="h-6 w-6 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm line-clamp-1">{resource.title}</p>
                                      <p className="text-xs text-gray-500">{formatDate(resource.created_at)}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <p className="text-gray-500 col-span-3 text-center py-4">No uploads yet</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Resource Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Resource Distribution</CardTitle>
                          <CardDescription>
                            Breakdown of your resources by categories
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Dance Styles */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-3">By Dance Style</h4>
                              <div className="space-y-2">
                                {Object.entries(
                                  resources.reduce((acc, resource) => {
                                    const style = resource.dance_style || "Unspecified";
                                    acc[style] = (acc[style] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                                )
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([style, count]) => (
                                    <div key={style} className="flex items-center justify-between">
                                      <span className="text-sm">{style}</span>
                                      <span className="text-sm font-medium">{count}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            
                            {/* Age Ranges */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-3">By Age Range</h4>
                              <div className="space-y-2">
                                {Object.entries(
                                  resources.reduce((acc, resource) => {
                                    const range = resource.age_range || "Unspecified";
                                    acc[range] = (acc[range] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                                )
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([range, count]) => (
                                    <div key={range} className="flex items-center justify-between">
                                      <span className="text-sm">{range}</span>
                                      <span className="text-sm font-medium">{count}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            
                            {/* Difficulty Levels */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-3">By Difficulty</h4>
                              <div className="space-y-2">
                                {Object.entries(
                                  resources.reduce((acc, resource) => {
                                    const level = resource.difficulty_level || "Unspecified";
                                    acc[level] = (acc[level] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                                )
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([level, count]) => (
                                    <div key={level} className="flex items-center justify-between">
                                      <span className="text-sm">{level}</span>
                                      <span className="text-sm font-medium">{count}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}