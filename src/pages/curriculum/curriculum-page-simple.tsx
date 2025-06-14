import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { Loader2, Plus, Search, ThumbsUp, Filter, User } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { CachedImage } from "../../components/ui/cached-image";
import { CachedResourceImage } from "../../components/ui/cached-resource-image";
import {
  DEFAULT_RESOURCE_IMAGE,
  DEFAULT_USER_IMAGE,
} from "../../lib/constants";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import {
  ResourcePlaceholderGrid,
  ResourceErrorCard,
} from "../../components/ui/resource-placeholder";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";
import { useCart } from "../../hooks/use-cart";
import { useGuestCart } from "../../hooks/use-guest-cart";
import { api } from "../../lib/api";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { ResourceDetailsModal } from "../../components/curriculum/resource-details-modal";

// Define filter types
type FilterState = {
  priceRange: string[];
  danceStyles: string[];
  ageRanges: string[];
  difficultyLevels: string[];
  sellers: string[];
  resourceFormat: string[];
  showFilters: boolean;
};

// A simplified version of the curriculum page to use as a fallback
export default function CurriculumPageSimple() {
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
    showFilters: false,
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

        // Fetch resources from the API with auth headers
        const response = await api.get("/api/resources");

        console.log(
          "DEBUG CURRICULUM CLIENT: Resources fetched successfully:",
          response.data
        );

        if (response.data) {
          setResources(response.data);
        } else {
          setError(true);
          toast({
            title: "Error",
            description: "Failed to load resources. Please try again later.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(
          "DEBUG CURRICULUM CLIENT: Error fetching resources:",
          error
        );
        setError(true);
        toast({
          title: "Error",
          description: "Failed to load resources. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [searchTerm, filters, toast, user]);

  const toggleFilter = (
    type: keyof Omit<FilterState, "showFilters">,
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[type];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [type]: newValues,
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [],
      danceStyles: [],
      ageRanges: [],
      difficultyLevels: [],
      sellers: [],
      resourceFormat: [],
      showFilters: false,
    });
  };

  const isPriceInRange = (price: string, range: string): boolean => {
    const [min, max] = range.split("-").map(Number);
    const priceNum = parseFloat(price);
    return priceNum >= min && priceNum <= max;
  };

  const addToCart = (resource: any) => {
    if (user) {
      addToAuthCart(resource);
    } else {
      addToGuestCart(resource);
    }

    toast({
      title: "Added to cart",
      description: `${resource.title} has been added to your cart.`,
    });
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    // The useEffect will trigger a new fetch
  };

  // Filter resources based on search term and filters
  const filteredResources = resources.filter((resource) => {
    // Search term filter
    const matchesSearch =
      searchTerm === "" ||
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Price range filter
    const matchesPrice =
      filters.priceRange.length === 0 ||
      filters.priceRange.some((range) => isPriceInRange(resource.price, range));

    // Dance style filter
    const matchesDanceStyle =
      filters.danceStyles.length === 0 ||
      filters.danceStyles.includes(resource.danceStyle);

    // Age range filter
    const matchesAgeRange =
      filters.ageRanges.length === 0 ||
      filters.ageRanges.includes(resource.ageRange);

    // Difficulty level filter
    const matchesDifficulty =
      filters.difficultyLevels.length === 0 ||
      filters.difficultyLevels.includes(resource.difficultyLevel);

    // Seller filter
    const matchesSeller =
      filters.sellers.length === 0 ||
      filters.sellers.includes(resource.sellerId.toString());

    return (
      matchesSearch &&
      matchesPrice &&
      matchesDanceStyle &&
      matchesAgeRange &&
      matchesDifficulty &&
      matchesSeller
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search curriculum resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                showFilters: !prev.showFilters,
              }))
            }
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filter Options */}
        {filters.showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Price Range */}
            <div>
              <h3 className="font-semibold mb-2">Price Range</h3>
              {["0-10", "10-20", "20-30", "30+"].map((range) => (
                <div key={range} className="flex items-center space-x-2">
                  <Checkbox
                    id={`price-${range}`}
                    checked={filters.priceRange.includes(range)}
                    onCheckedChange={() => toggleFilter("priceRange", range)}
                  />
                  <label htmlFor={`price-${range}`}>${range}</label>
                </div>
              ))}
            </div>

            {/* Dance Styles */}
            <div>
              <h3 className="font-semibold mb-2">Dance Style</h3>
              {["Ballet", "Hip Hop", "Contemporary", "Jazz", "Tap"].map(
                (style) => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox
                      id={`style-${style}`}
                      checked={filters.danceStyles.includes(style)}
                      onCheckedChange={() => toggleFilter("danceStyles", style)}
                    />
                    <label htmlFor={`style-${style}`}>{style}</label>
                  </div>
                )
              )}
            </div>

            {/* Age Ranges */}
            <div>
              <h3 className="font-semibold mb-2">Age Range</h3>
              {["5-7", "8-12", "13-18", "18+"].map((range) => (
                <div key={range} className="flex items-center space-x-2">
                  <Checkbox
                    id={`age-${range}`}
                    checked={filters.ageRanges.includes(range)}
                    onCheckedChange={() => toggleFilter("ageRanges", range)}
                  />
                  <label htmlFor={`age-${range}`}>{range}</label>
                </div>
              ))}
            </div>

            {/* Difficulty Levels */}
            <div>
              <h3 className="font-semibold mb-2">Difficulty Level</h3>
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={filters.difficultyLevels.includes(level)}
                    onCheckedChange={() =>
                      toggleFilter("difficultyLevels", level)
                    }
                  />
                  <label htmlFor={`level-${level}`}>{level}</label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resources Grid */}
      {loading ? (
        <ResourcePlaceholderGrid />
      ) : error ? (
        <ResourceErrorCard
          message="Failed to load resources. Please try again later."
          retryFn={handleRetry}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  {/* <CachedResourceImage
                    resource={resource}
                    alt={resource.title}
                    className="object-cover w-full h-full"
                  /> */}

                  <div className="relative aspect-video">
                    <img
                      src={resource.thumbnailUrl}
                      className="w-full h-auto"
                      alt={`thumbnail ${resource?.title}`}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold mb-2">
                  {resource.title}
                </CardTitle>
                <p className="text-sm text-gray-600 mb-4">
                  {resource.description}
                </p>
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => navigate(`/curriculum/${resource?.id}`)}
                    className="ml-2"
                  >
                    View Details
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">${resource.price}</span>
                  <Button onClick={() => addToCart(resource)} className="ml-2">
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resource Details Modal */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}
