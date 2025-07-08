import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Filter } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { DEFAULT_RESOURCE_IMAGE } from "../../lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  // Fetch resources from API (with pagination)
  const fetchResources = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setError(false);
          setPage(1);
          setHasMore(true);
        } else {
          setLoadingMore(true);
        }
        const currentPage = reset ? 1 : page;
        const response = await api.get(`/api/resources?page=${currentPage}`);
        const data = response.data || [];
        if (reset) {
          setResources(data);
        } else {
          setResources((prev) => [...prev, ...data]);
        }
        // If less than expected page size, no more data
        setHasMore(data.length > 0);
      } catch (error) {
        setError(true);
        toast({
          title: "Error",
          description: "Failed to load resources. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, toast]
  );

  // Reset and fetch on search/filter change
  useEffect(() => {
    setPage(1);
    fetchResources(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters, toast, user]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    });
    if (bottomRef.current) observer.current.observe(bottomRef.current);
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, loadingMore, hasMore]);

  // Fetch more when page increases
  useEffect(() => {
    if (page === 1) return;
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  // Function to handle opening resource details
  const handleViewDetails = (resource: any) => {
    setSelectedResource(resource);
    setDetailsModalOpen(true);
  };

  // Function to handle closing modal
  const handleCloseModal = (open: boolean) => {
    setDetailsModalOpen(open);
    if (!open) {
      setSelectedResource(null);
    }
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
       <div className="relative rounded-xl overflow-hidden mb-8 sm:mb-12 max-w-7xl mx-auto">
        <img
          src= "/images/flow.png"
          alt="Dance Education Courses"
          className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-white leading-tight">
            Explore Our Curriculum
          </h1>
          <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl leading-relaxed">
            Search through our vast curriculum resources, find and explore different dance courses that fit your desire to dance, have fun and grow
          </p>
        </div>
      </div>
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
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        {/* Filter Options */}
        {filters.showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
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
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No resources found matching your criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col"
                style={{ height: "100%" }}
              >
                <CardHeader
                  className="p-0 cursor-pointer"
                  onClick={() => handleViewDetails(resource)}
                >
                  <div className="relative">
                    <img
                      src={resource.thumbnailUrl || DEFAULT_RESOURCE_IMAGE}
                      className="w-full aspect-square object-cover"
                      alt={`thumbnail ${resource?.title}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_RESOURCE_IMAGE;
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex flex-col flex-1">
                  <CardTitle className="text-lg font-semibold mb-2">
                    {resource.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {resource.description}
                  </p>

                  {/* Price and buttons section */}
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${resource.price}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewDetails(resource)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => addToCart(resource)}
                        className="flex-1"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div ref={bottomRef} />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
            </div>
          )}
          {!hasMore && (
            <div className="text-center text-gray-400 py-4 text-sm">
              No more resources to load.
            </div>
          )}
        </>
      )}

      {/* Resource Details Modal */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          open={detailsModalOpen}
          onOpenChange={handleCloseModal}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}
