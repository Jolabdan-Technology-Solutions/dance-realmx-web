import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";
import { 
  Package, Plus, Loader2, User, Award, 
  Search, Filter, Download, FileText, X,
  Music, Video, Image, RefreshCw, ChevronDown,
  Grid3X3, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { API_ENDPOINTS, DEFAULT_RESOURCE_IMAGE } from "@/lib/constants";
import { Resource, ResourceCategory } from "@shared/schema";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CachedImage } from "@/components/ui/cached-image";
import { ResourceDetailsModal } from "@/components/curriculum/resource-details-modal";
import { cn } from "@/lib/utils";

// Function to get seller data
const useSellers = (resources: any[]) => {
  // Get unique seller IDs - ensure we're dealing with a proper array and handle null/undefined
  const sellerIds = resources && Array.isArray(resources)
    ? resources
        .map(resource => resource?.sellerId)
        .filter((id): id is number => id !== null && id !== undefined)
        .filter((id, index, self) => self.indexOf(id) === index)
    : [];
  
  // Create an array to hold seller data
  const [sellers, setSellers] = useState<any[]>([]);
  
  // Fetch seller data
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        console.log('DEBUG SELLERS: Fetching sellers for IDs:', sellerIds);
        
        const sellerDataPromises = sellerIds.map(async (sellerId) => {
          try {
            if (!sellerId) return null;
            
            const response = await fetch(`/api/users/${sellerId}`);
            if (!response.ok) {
              console.warn(`Failed to fetch seller ${sellerId} details, status: ${response.status}`);
              // Return a basic placeholder instead of null
              return {
                id: sellerId,
                username: `Seller #${sellerId}`,
                profile_image_url: null
              };
            }
            return await response.json();
          } catch (error) {
            console.error(`Error fetching seller ${sellerId}:`, error);
            // Return a basic placeholder instead of null
            return {
              id: sellerId,
              username: `Seller #${sellerId}`,
              profile_image_url: null
            };
          }
        });
        
        const sellerData = await Promise.all(sellerDataPromises);
        console.log('DEBUG SELLERS: Fetched seller data:', sellerData);
        setSellers(sellerData.filter(Boolean));
      } catch (err) {
        console.error('DEBUG SELLERS: Error in fetchSellers:', err);
        // Don't set sellers to empty to avoid loss of previous data
      }
    };
    
    if (sellerIds.length > 0) {
      fetchSellers();
    } else {
      console.log('DEBUG SELLERS: No seller IDs to fetch');
    }
  }, [sellerIds]);
  
  return sellers;
};

// The combined curriculum page with search and filter features - Teachers Pay Teachers style
export default function CurriculumPageCombined() {
  // Force the browser URL to be /curriculum to ensure we get proper referer handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/curriculum') {
        console.log('CURRICULUM DEBUG: Enforcing /curriculum path');
        window.history.replaceState(null, '', '/curriculum');
      }
    }
  }, []);
  const { toast } = useToast();
  const { addItem } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    danceStyle: "",
    ageRange: "",
    difficultyLevel: "",
    priceRange: "",
    format: "",
    seller: "",
  });
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // State for resource details modal
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // Function to handle adding a resource to the cart
  const handleAddToCart = (resource: any) => {
    addItem({
      title: resource.title,
      price: resource.price || "0.00",
      itemType: 'resource',
      itemId: resource.id,
      quantity: 1,
      imageUrl: resource.imageUrl || resource.thumbnailUrl,
      details: resource
    });
    
    toast({
      title: "Added to Cart",
      description: `${resource.title} has been added to your cart`,
    });
  };
  
  // Use try-catch to handle the case when AuthContext is not available
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // If AuthContext is not available, user remains null (guest mode)
  }

  // Fetch resources with React Query - use the special curriculum-all endpoint that always returns ALL resources
  const { data: resources = [], isLoading: resourcesLoading, isError: resourcesError, error: resourcesErrorObj } = useQuery({
    queryKey: ['/api/curriculum-all', new Date().getTime()], // Add timestamp to disable caching
    staleTime: 0, // Force it to be stale immediately
    gcTime: 0, // Don't cache at all (TanStack Query v5 uses gcTime instead of cacheTime)
    queryFn: async () => {
      try {
        console.log('DEBUG CURRICULUM CLIENT: Making fetch request to special curriculum-all endpoint');
        
        // Use a timestamp parameter to avoid browser caching
        const timestamp = new Date().getTime();
        const url = `/api/curriculum-all?t=${timestamp}`;
        console.log('DEBUG CURRICULUM CLIENT: Request URL:', url);
        
        const response = await fetch(url, {
          headers: {
            // Tell browser to bypass cache
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('DEBUG CURRICULUM CLIENT: Request made, response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`DEBUG CURRICULUM CLIENT: Received response:`, data);
        
        // Make sure data is an array
        if (!Array.isArray(data)) {
          console.error('DEBUG CURRICULUM CLIENT: Expected array but got:', typeof data);
          return []; // Return empty array instead of throwing
        }
        
        console.log(`DEBUG CURRICULUM CLIENT: Received ${data.length} resources`);
        return data;
      } catch (err) {
        console.error('DEBUG CURRICULUM CLIENT: Error fetching resources:', err);
        throw err;
      }
    }
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/resource-categories'],
    queryFn: async () => {
      const response = await fetch('/api/resource-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });
  
  // Get seller data using our custom hook
  const sellers = useSellers(resources);
  
  // Map seller data to resources and remove ratings
  const resourcesWithSellers = resources.map((resource: any) => {
    const seller = sellers.find((s: any) => s?.id === resource.sellerId);
    // Strip out rating property entirely
    const { rating, ...resourceWithoutRating } = resource;
    return { ...resourceWithoutRating, seller };
  });

  // Function to handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Filter and sort the resources
  const filteredResources = resourcesWithSellers.filter((resource: any) => {
    // Search filter
    if (searchTerm && !resource.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !resource.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Apply category filters
    if (filters.danceStyle && resource.danceStyle !== filters.danceStyle) {
      return false;
    }

    if (filters.ageRange && resource.ageRange !== filters.ageRange) {
      return false;
    }

    if (filters.difficultyLevel && resource.difficultyLevel !== filters.difficultyLevel) {
      return false;
    }
    
    if (filters.seller && resource.sellerId !== parseInt(filters.seller)) {
      return false;
    }

    if (filters.format) {
      const formatMap: Record<string, string[]> = {
        'pdf': ['pdf', 'application/pdf'],
        'video': ['mp4', 'video/mp4', 'video'],
        'audio': ['mp3', 'audio/mpeg', 'audio'],
        'image': ['jpg', 'jpeg', 'png', 'image/jpeg', 'image/png', 'image']
      };
      
      if (!resource.fileType || !formatMap[filters.format]?.includes(resource.fileType.toLowerCase())) {
        return false;
      }
    }

    // Apply price range filter
    if (filters.priceRange) {
      const price = parseFloat(resource.price || "0");
      switch (filters.priceRange) {
        case 'free':
          if (price !== 0) return false;
          break;
        case 'under10':
          if (price > 10) return false;
          break;
        case '10to20':
          if (price < 10 || price > 20) return false;
          break;
        case 'over20':
          if (price <= 20) return false;
          break;
      }
    }

    return true;
  });

  // Sort the filtered resources
  const sortedResources = [...filteredResources].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case 'priceAsc':
        return parseFloat(a.price || "0") - parseFloat(b.price || "0");
      case 'priceDesc':
        return parseFloat(b.price || "0") - parseFloat(a.price || "0");
      case 'downloads':
        return (b.downloadCount || 0) - (a.downloadCount || 0);

      default:
        return 0;
    }
  });

  // Helper function to get unique values for filter options
  const getUniqueValues = (field: string) => {
    const values = new Set(resources.map((r: any) => r[field]).filter(Boolean));
    return Array.from(values);
  };

  // Count resources by various attributes for faceted navigation
  const getDanceStyleCounts = () => {
    const counts: Record<string, number> = {};
    resources.forEach((r: any) => {
      if (r.danceStyle) {
        counts[r.danceStyle] = (counts[r.danceStyle] || 0) + 1;
      }
    });
    return counts;
  };

  const getAgeCounts = () => {
    const counts: Record<string, number> = {};
    resources.forEach((r: any) => {
      if (r.ageRange) {
        counts[r.ageRange] = (counts[r.ageRange] || 0) + 1;
      }
    });
    return counts;
  };

  const getDifficultyCounts = () => {
    const counts: Record<string, number> = {};
    resources.forEach((r: any) => {
      if (r.difficultyLevel) {
        counts[r.difficultyLevel] = (counts[r.difficultyLevel] || 0) + 1;
      }
    });
    return counts;
  };

  const getFormatCounts = () => {
    const formatMap: Record<string, string[]> = {
      'Document': ['pdf', 'application/pdf', 'doc', 'docx'],
      'Video': ['mp4', 'video/mp4', 'video'],
      'Audio': ['mp3', 'audio/mpeg', 'audio'],
      'Image': ['jpg', 'jpeg', 'png', 'image/jpeg', 'image/png', 'image']
    };
    
    const counts: Record<string, number> = {
      'Document': 0,
      'Video': 0,
      'Audio': 0,
      'Image': 0
    };
    
    resources.forEach((r: any) => {
      if (r.fileType) {
        const fileType = r.fileType.toLowerCase();
        for (const [format, extensions] of Object.entries(formatMap)) {
          if (extensions.includes(fileType)) {
            counts[format]++;
            break;
          }
        }
      }
    });
    
    return counts;
  };

  const getPriceCounts = () => {
    const counts: Record<string, number> = {
      'Free': 0,
      'Under $10': 0,
      '$10 - $20': 0,
      'Over $20': 0
    };
    
    resources.forEach((r: any) => {
      const price = parseFloat(r.price || "0");
      if (price === 0) {
        counts['Free']++;
      } else if (price < 10) {
        counts['Under $10']++;
      } else if (price >= 10 && price <= 20) {
        counts['$10 - $20']++;
      } else {
        counts['Over $20']++;
      }
    });
    
    return counts;
  };

  // Get counts for faceted navigation
  const danceStyleCounts = getDanceStyleCounts();
  const ageCounts = getAgeCounts();
  const difficultyCounts = getDifficultyCounts();
  const formatCounts = getFormatCounts();
  const priceCounts = getPriceCounts();

  // Render loading state
  if (resourcesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render error state
  if (resourcesError) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-2">Unable to Load Resources</h2>
        <p className="text-muted-foreground mb-6">Failed to load resources. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header and Search Bar - Top section */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Dance Curriculum Resources</h1>
            <p className="text-muted-foreground">
              Browse our collection of professional dance curriculum resources
            </p>
          </div>
        </div>
        {user && (user.role === "seller" || user.role === "curriculum_officer" || user.role === "admin") && (
          <div className="flex justify-center mt-4">
            <Link href="/upload-resource">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Resource
              </Button>
            </Link>
            <Link href="/simple-upload" className="ml-2">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Simple Upload
              </Button>
            </Link>
          </div>
        )}
        
        {/* Search bar */}
        <div className="relative w-full mt-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for dance curriculum resources..."
            className="pl-10 py-6 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-3 top-2"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>
      
      {/* Main content area with sidebar and results */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-4 border rounded-md overflow-hidden bg-card">
            <div className="p-4 bg-muted/50 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h2>
            </div>
            
            {/* Filter by Resource Type/Format */}
            <div className="p-4 border-b">
              <h3 className="font-medium mb-3">Resource Format</h3>
              <div className="space-y-2">
                {Object.entries(formatCounts).map(([format, count]) => (
                  count > 0 && (
                    <div key={format} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox 
                          id={`format-${format}`}
                          checked={filters.format === format.toLowerCase()}
                          onCheckedChange={() => {
                            if (filters.format === format.toLowerCase()) {
                              handleFilterChange('format', '');
                            } else {
                              handleFilterChange('format', format.toLowerCase());
                            }
                          }}
                        />
                        <label 
                          htmlFor={`format-${format}`}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {format}
                        </label>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {count}
                      </Badge>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            {/* Filter by Price */}
            <div className="p-4 border-b">
              <h3 className="font-medium mb-3">Price</h3>
              <div className="space-y-2">
                {Object.entries(priceCounts).map(([range, count]) => {
                  const rangeValue = range === 'Free' ? 'free' : 
                                    range === 'Under $10' ? 'under10' : 
                                    range === '$10 - $20' ? '10to20' : 'over20';
                  
                  return count > 0 && (
                    <div key={range} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox 
                          id={`price-${rangeValue}`}
                          checked={filters.priceRange === rangeValue}
                          onCheckedChange={() => {
                            if (filters.priceRange === rangeValue) {
                              handleFilterChange('priceRange', '');
                            } else {
                              handleFilterChange('priceRange', rangeValue);
                            }
                          }}
                        />
                        <label 
                          htmlFor={`price-${rangeValue}`}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {range}
                        </label>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Filter by Dance Style */}
            <div className="p-4 border-b">
              <h3 className="font-medium mb-3">Dance Style</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {Object.entries(danceStyleCounts).map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`style-${style}`}
                        checked={filters.danceStyle === style}
                        onCheckedChange={() => {
                          if (filters.danceStyle === style) {
                            handleFilterChange('danceStyle', '');
                          } else {
                            handleFilterChange('danceStyle', style);
                          }
                        }}
                      />
                      <label 
                        htmlFor={`style-${style}`}
                        className="ml-2 text-sm cursor-pointer"
                      >
                        {style}
                      </label>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter by Age Range */}
            <div className="p-4 border-b">
              <h3 className="font-medium mb-3">Age Range</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {Object.entries(ageCounts).map(([age, count]) => (
                  <div key={age} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`age-${age}`}
                        checked={filters.ageRange === age}
                        onCheckedChange={() => {
                          if (filters.ageRange === age) {
                            handleFilterChange('ageRange', '');
                          } else {
                            handleFilterChange('ageRange', age);
                          }
                        }}
                      />
                      <label 
                        htmlFor={`age-${age}`}
                        className="ml-2 text-sm cursor-pointer"
                      >
                        {age}
                      </label>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter by Difficulty Level */}
            <div className="p-4 border-b">
              <h3 className="font-medium mb-3">Difficulty Level</h3>
              <div className="space-y-2">
                {Object.entries(difficultyCounts).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`level-${level}`}
                        checked={filters.difficultyLevel === level}
                        onCheckedChange={() => {
                          if (filters.difficultyLevel === level) {
                            handleFilterChange('difficultyLevel', '');
                          } else {
                            handleFilterChange('difficultyLevel', level);
                          }
                        }}
                      />
                      <label 
                        htmlFor={`level-${level}`}
                        className="ml-2 text-sm cursor-pointer"
                      >
                        {level}
                      </label>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter by Seller */}
            <div className="p-4 border-b">
              <h3 className="font-medium mb-3">Sellers</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {sellers.map((seller: any) => {
                  // Count resources from this seller
                  const sellerResourceCount = resources.filter((r: any) => 
                    r.sellerId === seller.id
                  ).length;
                  
                  const sellerName = `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.username;
                  
                  return (
                    <div key={seller.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox 
                          id={`seller-${seller.id}`}
                          checked={filters.seller === seller.id.toString()}
                          onCheckedChange={() => {
                            if (filters.seller === seller.id.toString()) {
                              handleFilterChange('seller', '');
                            } else {
                              handleFilterChange('seller', seller.id.toString());
                            }
                          }}
                        />
                        <label 
                          htmlFor={`seller-${seller.id}`}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {sellerName}
                        </label>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {sellerResourceCount}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Clear all filters button */}
            {Object.values(filters).some(Boolean) && (
              <div className="p-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setFilters({
                    danceStyle: "",
                    ageRange: "",
                    difficultyLevel: "",
                    priceRange: "",
                    format: "",
                    seller: "",
                  })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </aside>
        
        {/* Main content area */}
        <main className="flex-1">
          {/* Active filters and sort controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-card border rounded-md">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                let displayValue = value;
                
                // Format price range values for display
                if (key === 'priceRange') {
                  displayValue = value === 'free' ? 'Free' : 
                              value === 'under10' ? 'Under $10' : 
                              value === '10to20' ? '$10 - $20' : 'Over $20';
                }
                
                // Format seller values for display
                if (key === 'seller') {
                  const seller = sellers.find((s: any) => s.id.toString() === value);
                  if (seller) {
                    displayValue = `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.username;
                  }
                }
                
                // Format filter name for display
                const filterName = key === 'danceStyle' ? 'Style' : 
                                key === 'ageRange' ? 'Age' : 
                                key === 'difficultyLevel' ? 'Level' : 
                                key === 'priceRange' ? 'Price' :
                                key === 'format' ? 'Format' :
                                key === 'seller' ? 'Seller' : key;
                
                return (
                  <Badge 
                    key={key} 
                    variant="secondary" 
                    className="px-3 py-1.5 gap-1 text-sm"
                  >
                    <span>{filterName}: {displayValue}</span>
                    <X 
                      className="h-3.5 w-3.5 ml-1 cursor-pointer hover:text-primary" 
                      onClick={() => handleFilterChange(key, "")}
                    />
                  </Badge>
                );
              })}
              
              {searchTerm && (
                <Badge 
                  variant="secondary" 
                  className="px-3 py-1.5 gap-1 text-sm"
                >
                  <span>Search: {searchTerm}</span>
                  <X 
                    className="h-3.5 w-3.5 ml-1 cursor-pointer hover:text-primary" 
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              
              {(Object.values(filters).some(Boolean) || searchTerm) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      danceStyle: "",
                      ageRange: "",
                      difficultyLevel: "",
                      priceRange: "",
                      format: "",
                      seller: "",
                    });
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="flex-shrink-0">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                    <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                    <SelectItem value="downloads">Most Downloaded</SelectItem>

                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex border rounded-md overflow-hidden">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9 border-r",
                    viewMode === "grid" && "bg-accent"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9",
                    viewMode === "list" && "bg-accent"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mb-6 text-muted-foreground">
            <p>
              {sortedResources.length} {sortedResources.length === 1 ? 'result' : 'results'}
              {(Object.values(filters).some(Boolean) || searchTerm) && ' for your search'}
            </p>
          </div>
          
          {/* Resources display */}
          {viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResources.map((resource: any) => (
                <Card key={resource.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
                  <div 
                    className="cursor-pointer" 
                    onClick={() => {
                      setSelectedResource(resource);
                      setDetailsModalOpen(true);
                    }}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <CachedImage
                        src={resource.thumbnailUrl || resource.imageUrl || DEFAULT_RESOURCE_IMAGE}
                        alt={resource.title}
                        className="object-cover w-full h-full transition-transform hover:scale-105"
                      />
                      {resource.price === "0" || parseFloat(resource.price || "0") === 0 ? (
                        <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-700">Free</Badge>
                      ) : (
                        <Badge className="absolute top-2 left-2">${parseFloat(resource.price).toFixed(2)}</Badge>
                      )}
                      {resource.isFeatured && (
                        <Badge variant="secondary" className="absolute top-2 right-2">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="py-3 px-4">
                    <div 
                      className="cursor-pointer" 
                      onClick={() => {
                        setSelectedResource(resource);
                        setDetailsModalOpen(true);
                      }}
                    >
                      <CardTitle className="text-lg hover:text-primary line-clamp-2">
                        {resource.title}
                      </CardTitle>
                    </div>
                    <Link href={`/profile/${resource.sellerId}`}>
                      <CardDescription className="flex items-center gap-1 mt-1 hover:text-primary">
                        <User className="h-3 w-3" />
                        <span>
                          {resource.seller ? `${resource.seller.first_name || ''} ${resource.seller.last_name || ''}`.trim() || resource.seller.username : 'Unknown Seller'}
                        </span>
                      </CardDescription>
                    </Link>
                  </CardHeader>
                  <CardContent className="px-4 py-0 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {resource.description || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{resource.downloadCount || 0}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{resource.fileType?.toUpperCase() || "FILE"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        ${parseFloat(resource.price || "0").toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedResource(resource);
                          setDetailsModalOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      
                      <Button 
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(resource);
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {sortedResources.map((resource: any) => (
                <div key={resource.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-md hover:shadow-md transition-all">
                  <div 
                    className="sm:w-1/4 shrink-0 cursor-pointer" 
                    onClick={() => {
                      setSelectedResource(resource);
                      setDetailsModalOpen(true);
                    }}
                  >
                    <div className="aspect-video relative overflow-hidden rounded-md">
                      <CachedImage
                        src={resource.thumbnailUrl || resource.imageUrl || DEFAULT_RESOURCE_IMAGE}
                        alt={resource.title}
                        className="object-cover w-full h-full transition-transform hover:scale-105"
                      />
                      {resource.price === "0" || parseFloat(resource.price || "0") === 0 ? (
                        <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-700">Free</Badge>
                      ) : (
                        <Badge className="absolute top-2 left-2">${parseFloat(resource.price).toFixed(2)}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div 
                      className="cursor-pointer" 
                      onClick={() => {
                        setSelectedResource(resource);
                        setDetailsModalOpen(true);
                      }}
                    >
                      <h3 className="text-lg font-semibold hover:text-primary line-clamp-1">
                        {resource.title}
                      </h3>
                    </div>
                    <Link href={`/profile/${resource.sellerId}`}>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 hover:text-primary">
                        <User className="h-3 w-3" />
                        <span>
                          {resource.seller ? `${resource.seller.first_name || ''} ${resource.seller.last_name || ''}`.trim() || resource.seller.username : 'Unknown Seller'}
                        </span>
                      </p>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-2 mb-auto line-clamp-2">
                      {resource.description || "No description provided."}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{resource.downloadCount || 0} downloads</span>
                      </div>

                      {resource.danceStyle && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-normal">
                            {resource.danceStyle}
                          </Badge>
                        </div>
                      )}
                      {resource.ageRange && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-normal">
                            {resource.ageRange}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:w-32 flex sm:flex-col items-center justify-end gap-2 mt-4 sm:mt-0">
                    {resource.isFeatured && (
                      <Badge variant="secondary" className="mb-auto">
                        Featured
                      </Badge>
                    )}
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-bold">
                        {resource.price === "0" || parseFloat(resource.price || "0") === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          <span>${parseFloat(resource.price).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <Button 
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedResource(resource);
                            setDetailsModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="w-full"
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(resource);
                          }}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty state */}
          {sortedResources.length === 0 && (
            <div className="text-center py-12 border rounded-lg">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium mt-4">No resources found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your filters or search term
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setFilters({
                    danceStyle: "",
                    ageRange: "",
                    difficultyLevel: "",
                    priceRange: "",
                    format: "",
                    seller: "",
                  });
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </main>
      </div>
      
      {/* Resource Details Modal */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </div>
  );
}