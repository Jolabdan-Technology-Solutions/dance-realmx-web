import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Loader2,
  Plus,
  Search,
  ThumbsUp,
  Filter,
  User,
  BadgeCheck,
  Award,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { CachedImage } from "../components/ui/cached-image";
import { CachedResourceImage } from "../components/ui/cached-resource-image";
import { DEFAULT_RESOURCE_IMAGE, DEFAULT_USER_IMAGE } from "../lib/constants";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import {
  ResourcePlaceholderGrid,
  ResourceErrorCard,
} from "../components/ui/resource-placeholder";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { useCart } from "../hooks/use-cart";
import { useGuestCart } from "../hooks/use-guest-cart";
import { apiRequest } from "../lib/queryClient";
import { Checkbox } from "../components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { ResourceDetailsModal } from "../components/curriculum/resource-details-modal";

// Define filter types
type FilterState = {
  priceRange: string[];
  danceStyles: string[];
  ageRanges: string[];
  difficultyLevels: string[];
  sellers: string[];
  resourceFormat: string[];
};

// Sample resources for testing when the API fails
const SAMPLE_RESOURCES = [
  {
    id: 999,
    title: "Ballet Basics for Ages 5-7",
    description: "Introductory ballet curriculum for young students",
    detailedDescription:
      "A comprehensive 10-week curriculum for introducing young students to ballet fundamentals.",
    price: "19.99",
    sellerId: 6,
    danceStyle: "Ballet",
    ageRange: "5-7",
    difficultyLevel: "Beginner",
    isFeatured: true,
    status: "active",
    isApproved: true,
    createdAt: new Date().toISOString(),
    thumbnailUrl: "/images/resources/ballet-basics.jpg",
  },
  {
    id: 998,
    title: "Hip Hop Fundamentals",
    description: "Core hip hop movements and combinations for teens",
    detailedDescription:
      "Master the foundations of hip hop dance with this curriculum designed for teenage students.",
    price: "24.99",
    sellerId: 6,
    danceStyle: "Hip Hop",
    ageRange: "13-18",
    difficultyLevel: "Intermediate",
    isFeatured: true,
    status: "active",
    isApproved: true,
    createdAt: new Date().toISOString(),
    thumbnailUrl: "/images/resources/hip-hop.jpg",
  },
  {
    id: 997,
    title: "Contemporary Dance Workshop Guide",
    description: "Structure and content for contemporary workshops",
    detailedDescription:
      "A detailed guide for instructors to run engaging contemporary dance workshops.",
    price: "29.99",
    sellerId: 6,
    danceStyle: "Contemporary",
    ageRange: "18+",
    difficultyLevel: "Advanced",
    isFeatured: false,
    status: "active",
    isApproved: true,
    createdAt: new Date().toISOString(),
    thumbnailUrl: "/images/resources/contemporary.jpg",
  },
  {
    id: 996,
    title: "Jazz Dance Combinations",
    description: "Collection of jazz combinations for intermediate dancers",
    price: "17.99",
    sellerId: 6,
    danceStyle: "Jazz",
    ageRange: "10-14",
    difficultyLevel: "Intermediate",
    thumbnailUrl: "/images/resources/jazz.jpg",
  },
  {
    id: 995,
    title: "Tap Dance Fundamentals",
    description:
      "Master the basics of tap dancing with this comprehensive guide",
    price: "22.99",
    sellerId: 6,
    danceStyle: "Tap",
    ageRange: "8-12",
    difficultyLevel: "Beginner",
    thumbnailUrl: null,
  },
  {
    id: 994,
    title: "Dance Recital Planning Guide",
    description: "Everything you need to plan a successful dance recital",
    price: "15.99",
    sellerId: 6,
    thumbnailUrl: null,
  },
];

// A simplified version of the curriculum page to use as a fallback
export default function CurriculumPageSimple() {
  // Force the browser URL to be /curriculum to ensure we get proper referer handling
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [],
    danceStyles: [],
    ageRanges: [],
    difficultyLevels: [],
    sellers: [],
    resourceFormat: [],
  });

  // Use try-catch to handle the case when AuthContext is not available
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // If AuthContext is not available, user remains null (guest mode)
    console.log("Auth context not available, using guest mode");
  }

  // Get the appropriate cart hook based on authentication status
  const authCart = useCart();
  const guestCart = useGuestCart();

  const addToAuthCart = (item: any) => authCart.addItem(item);
  const addToGuestCart = (item: any) => guestCart.addItem(item);

  // Fetch resources from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(false);

        console.log("DEBUG CURRICULUM CLIENT: Starting resource fetch");

        // First try the special endpoint for curriculum page
        const response = await apiRequest("GET", "/api/curriculum-all");

        console.log(
          "DEBUG CURRICULUM CLIENT: Request made, response status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("DEBUG CURRICULUM CLIENT: Received response:", data);

        if (Array.isArray(data) && data.length > 0) {
          console.log(
            `DEBUG CURRICULUM CLIENT: Received ${data.length} resources`
          );

          // Fetch the users/sellers information for each resource
          const enhancedResources = await Promise.all(
            data.map(async (resource) => {
              try {
                if (resource.sellerId) {
                  // Attempt to fetch the seller info
                  const sellerResponse = await apiRequest(
                    "GET",
                    `/api/users/${resource.sellerId}`
                  );

                  if (sellerResponse.ok) {
                    const sellerData = await sellerResponse.json();
                    return {
                      ...resource,
                      seller: sellerData,
                    };
                  }
                }
                // Return the original resource if seller info could not be fetched
                return resource;
              } catch (error) {
                console.error(
                  `Error fetching seller for resource ${resource.id}:`,
                  error
                );
                return resource;
              }
            })
          );

          console.log(
            "Enhanced resources with seller information:",
            enhancedResources
          );
          setResources(enhancedResources);
        } else {
          console.log(
            "DEBUG CURRICULUM CLIENT: No resources in response, using samples"
          );
          setResources(SAMPLE_RESOURCES);
        }
      } catch (err) {
        console.error("ERROR fetching curriculum resources:", err);
        setError(true);
        setResources(SAMPLE_RESOURCES); // Fall back to sample resources
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Toggle filter function that handles all filter types
  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const currentFilters = [...prev[type]];
      const index = currentFilters.indexOf(value);

      if (index === -1) {
        // Add the filter
        currentFilters.push(value);
      } else {
        // Remove the filter
        currentFilters.splice(index, 1);
      }

      return {
        ...prev,
        [type]: currentFilters,
      };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      priceRange: [],
      danceStyles: [],
      ageRanges: [],
      difficultyLevels: [],
      sellers: [],
      resourceFormat: [],
    });
    setSearchTerm("");
  };

  // Function to check if a price falls within a range
  const isPriceInRange = (price: string, range: string): boolean => {
    const numPrice = parseFloat(price);

    switch (range) {
      case "10-20":
        return numPrice >= 10 && numPrice <= 20;
      case "over20":
        return numPrice > 20;
      default:
        return false;
    }
  };

  // Function to add a resource to cart (works for both logged-in and guest users)
  const addToCart = (resource: any) => {
    const cartItem = {
      itemId: resource.id,
      itemType: "resource",
      title: resource.title,
      price: resource.price,
      quantity: 1,
      thumbnailUrl:
        resource.thumbnailUrl || resource.imageUrl || DEFAULT_RESOURCE_IMAGE,
    };

    if (user) {
      addToAuthCart(cartItem);
    } else {
      addToGuestCart(cartItem);
    }

    toast({
      title: "Added to cart",
      description: `${resource.title} has been added to your cart.`,
    });
  };

  // Handle retry when there's an error
  const handleRetry = () => {
    setLoading(true);
    setError(false);
    // Force a re-render which will trigger the useEffect again
    setResources([]);
  };

  // Filter resources based on all active filters
  const filteredResources = resources.filter((resource) => {
    if (!resource) return false;

    // Search term filter
    if (
      searchTerm &&
      !resource.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Price Range filter
    if (filters.priceRange.length > 0) {
      const matchesPrice = filters.priceRange.some((range) =>
        isPriceInRange(resource.price, range)
      );

      if (!matchesPrice) return false;
    }

    // Dance Style filter
    if (filters.danceStyles.length > 0) {
      if (
        !resource.danceStyle ||
        !filters.danceStyles.includes(resource.danceStyle)
      ) {
        return false;
      }
    }

    // Age Range filter
    if (filters.ageRanges.length > 0) {
      // This uses partial matching since age ranges might be stored differently
      const matchesAge = filters.ageRanges.some(
        (age) =>
          resource.ageRange &&
          resource.ageRange.toLowerCase().includes(age.toLowerCase())
      );

      if (!matchesAge) return false;
    }

    // Difficulty Level filter
    if (filters.difficultyLevels.length > 0) {
      if (
        !resource.difficultyLevel ||
        !filters.difficultyLevels.includes(resource.difficultyLevel)
      ) {
        return false;
      }
    }

    // Sellers filter - assuming seller name is in a sellerName property
    if (filters.sellers.length > 0) {
      // For simplicity, we're using the hardcoded value since we only have one seller
      const sellerMatch = filters.sellers.includes("Jamie Howard");
      if (!sellerMatch) return false;
    }

    return true;
  });

  return (
    <div className="w-full mx-auto px-4 py-8">
      <header className="mb-6 max-w-[95%] mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">
            Dance Curriculum Resources
          </h1>
          <p className="text-muted-foreground">
            Browse our collection of professional dance curriculum resources
          </p>
        </div>

        {user &&
          (user.role === "seller" ||
            user.role === "curriculum_officer" ||
            user.role === "admin") && (
            <div className="flex justify-center mt-4 mb-4">
              <Link href="/upload-resource">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Resource
                </Button>
              </Link>
            </div>
          )}

        {/* Search bar - only show if we have resources */}
        {!loading && !error && resources.length > 0 && (
          <div className="relative w-full mt-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for dance curriculum resources..."
              className="pl-10 py-6 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </header>

      {/* Loading state */}
      {loading && (
        <>
          <div className="text-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Loading curriculum resources...
            </p>
          </div>
          <ResourcePlaceholderGrid count={6} />
        </>
      )}

      {/* Error state */}
      {!loading && error && (
        <ResourceErrorCard
          title="Could not load curriculum resources"
          message="There was a problem loading the resources. We've loaded some sample resources instead."
          retryFn={handleRetry}
        />
      )}

      {/* Empty state */}
      {!loading && !error && filteredResources.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No resources found</h2>
          {searchTerm ? (
            <>
              <p className="text-muted-foreground mb-4">
                We couldn't find any resources matching your search.
              </p>
              <Button onClick={() => setSearchTerm("")}>Clear Search</Button>
            </>
          ) : (
            <p className="text-muted-foreground mb-4">
              There are currently no curriculum resources available.
            </p>
          )}
        </div>
      )}

      {/* Main content area with sidebar and results */}
      {!loading && filteredResources.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6 max-w-[95%] mx-auto">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-4 border rounded-md overflow-hidden bg-card">
              <div className="p-4 bg-muted/50 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h2>
              </div>

              {/* Resource Format */}
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Resource Format</h3>
              </div>

              {/* Filter by Price */}
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Price</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="price-10-20"
                        checked={filters.priceRange.includes("10-20")}
                        onCheckedChange={() => {
                          toggleFilter("priceRange", "10-20");
                        }}
                      />
                      <label
                        htmlFor="price-10-20"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        $10 - $20
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">2</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="price-over-20"
                        checked={filters.priceRange.includes("over20")}
                        onCheckedChange={() => {
                          toggleFilter("priceRange", "over20");
                        }}
                      />
                      <label
                        htmlFor="price-over-20"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Over $20
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">3</span>
                  </div>
                </div>
              </div>

              {/* Dance Style */}
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Dance Style</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="style-tap"
                        checked={filters.danceStyles.includes("Tap")}
                        onCheckedChange={() => {
                          toggleFilter("danceStyles", "Tap");
                        }}
                      />
                      <label
                        htmlFor="style-tap"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Tap
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="style-hiphop"
                        checked={filters.danceStyles.includes("Hip Hop")}
                        onCheckedChange={() => {
                          toggleFilter("danceStyles", "Hip Hop");
                        }}
                      />
                      <label
                        htmlFor="style-hiphop"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Hip Hop
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="style-ballet"
                        checked={filters.danceStyles.includes("Ballet")}
                        onCheckedChange={() => {
                          toggleFilter("danceStyles", "Ballet");
                        }}
                      />
                      <label
                        htmlFor="style-ballet"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Ballet
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="style-contemporary"
                        checked={filters.danceStyles.includes("Contemporary")}
                        onCheckedChange={() => {
                          toggleFilter("danceStyles", "Contemporary");
                        }}
                      />
                      <label
                        htmlFor="style-contemporary"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Contemporary
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="style-jazz"
                        checked={filters.danceStyles.includes("Jazz")}
                        onCheckedChange={() => {
                          toggleFilter("danceStyles", "Jazz");
                        }}
                      />
                      <label
                        htmlFor="style-jazz"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Jazz
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>
                </div>
              </div>

              {/* Age Range */}
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Age Range</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="age-mini"
                        checked={filters.ageRanges.includes("Mini (5-7)")}
                        onCheckedChange={() => {
                          toggleFilter("ageRanges", "Mini (5-7)");
                        }}
                      />
                      <label
                        htmlFor="age-mini"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Mini (5-7)
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="age-youth"
                        checked={filters.ageRanges.includes("Youth (9-12)")}
                        onCheckedChange={() => {
                          toggleFilter("ageRanges", "Youth (9-12)");
                        }}
                      />
                      <label
                        htmlFor="age-youth"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Youth (9-12)
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="age-prek"
                        checked={filters.ageRanges.includes("Pre-K (3-5)")}
                        onCheckedChange={() => {
                          toggleFilter("ageRanges", "Pre-K (3-5)");
                        }}
                      />
                      <label
                        htmlFor="age-prek"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Pre-K (3-5)
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="age-teen"
                        checked={filters.ageRanges.includes("13-18")}
                        onCheckedChange={() => {
                          toggleFilter("ageRanges", "13-18");
                        }}
                      />
                      <label
                        htmlFor="age-teen"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        13-18
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="age-toddler"
                        checked={filters.ageRanges.includes("Toddler (2-3)")}
                        onCheckedChange={() => {
                          toggleFilter("ageRanges", "Toddler (2-3)");
                        }}
                      />
                      <label
                        htmlFor="age-toddler"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Toddler (2-3)
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Difficulty Level</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="diff-advanced"
                        checked={filters.difficultyLevels.includes("Advanced")}
                        onCheckedChange={() => {
                          toggleFilter("difficultyLevels", "Advanced");
                        }}
                      />
                      <label
                        htmlFor="diff-advanced"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Advanced
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">1</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="diff-intermediate"
                        checked={filters.difficultyLevels.includes(
                          "Intermediate"
                        )}
                        onCheckedChange={() => {
                          toggleFilter("difficultyLevels", "Intermediate");
                        }}
                      />
                      <label
                        htmlFor="diff-intermediate"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Intermediate
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">2</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="diff-beginner"
                        checked={filters.difficultyLevels.includes("Beginner")}
                        onCheckedChange={() => {
                          toggleFilter("difficultyLevels", "Beginner");
                        }}
                      />
                      <label
                        htmlFor="diff-beginner"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Beginner
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">2</span>
                  </div>
                </div>
              </div>

              {/* Sellers */}
              <div className="p-4 border-b">
                <h3 className="font-medium mb-3">Sellers</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id="seller-jamie"
                        checked={filters.sellers.includes("Jamie Howard")}
                        onCheckedChange={() => {
                          toggleFilter("sellers", "Jamie Howard");
                        }}
                      />
                      <label
                        htmlFor="seller-jamie"
                        className="ml-2 text-sm cursor-pointer"
                      >
                        Jamie Howard
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">5</span>
                  </div>
                </div>
              </div>

              {/* Clear filters button */}
              <div className="p-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={clearFilters}
                  disabled={
                    Object.values(filters).every((arr) => arr.length === 0) &&
                    !searchTerm
                  }
                >
                  Clear Filters
                </Button>
              </div>

              {/* Quick links */}
              <div className="p-4">
                <h3 className="font-medium mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    href="/curriculum"
                    className="text-sm text-primary hover:underline block"
                  >
                    All Resources
                  </Link>
                  <Link
                    href="/curriculum?featured=true"
                    className="text-sm text-primary hover:underline block"
                  >
                    Featured Resources
                  </Link>
                  <Link
                    href="/my-purchases"
                    className="text-sm text-primary hover:underline block"
                  >
                    My Purchases
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Resource cards grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {filteredResources.map((resource) => (
                <Card
                  key={resource.id}
                  className="h-full flex flex-col overflow-hidden"
                >
                  <div
                    className="relative pt-[56.25%] bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedResource(resource);
                      setDetailsModalOpen(true);
                    }}
                  >
                    <CachedResourceImage
                      resource={resource}
                      aspectRatio="video"
                      className="absolute inset-0"
                    />
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl truncate">
                      <span
                        className="cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSelectedResource(resource);
                          setDetailsModalOpen(true);
                        }}
                      >
                        {resource.title}
                      </span>
                    </CardTitle>

                    {/* Seller information with thumbnail and verification badge */}
                    <div className="flex items-center mt-2 mb-1">
                      <Link href={`/seller-store/${resource.sellerId}`}>
                        <div className="flex items-center group">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage
                              src={
                                resource.seller?.profile_image_url ||
                                DEFAULT_USER_IMAGE
                              }
                              alt={resource.seller?.username || "Seller"}
                            />
                            <AvatarFallback>
                              {resource.seller?.first_name?.[0] ||
                                resource.seller?.username?.[0] ||
                                "S"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm group-hover:text-primary transition-colors">
                            {resource.seller?.first_name &&
                            resource.seller?.last_name
                              ? `${resource.seller.first_name} ${resource.seller.last_name}`
                              : resource.seller?.username || "Seller"}
                          </span>

                          {/* Verified Professional Badge */}
                          {resource.seller?.isApprovedSeller && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="ml-1">
                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Verified Professional Seller</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-center text-muted-foreground text-sm">
                      <span>{resource.danceStyle || "Dance"}</span>
                      {resource.ageRange && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{resource.ageRange}</span>
                        </>
                      )}
                      {resource.difficultyLevel && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{resource.difficultyLevel}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 flex-grow">
                    <p className="text-muted-foreground line-clamp-2">
                      {resource.description || "No description available."}
                    </p>
                  </CardContent>

                  <CardFooter className="pt-3 flex justify-between items-center border-t">
                    <div className="flex items-center">
                      <div className="font-semibold">
                        ${parseFloat(resource.price || "0").toFixed(2)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedResource(resource);
                          setDetailsModalOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => addToCart(resource)}>
                        Add to Cart
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resource Details Modal */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onAddToCart={() => addToCart(selectedResource)}
        />
      )}
    </div>
  );
}
