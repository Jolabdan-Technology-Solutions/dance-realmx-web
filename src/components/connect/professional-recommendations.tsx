import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Star,
  Heart,
  Clock,
  Filter,
  X,
  Loader2,
} from "lucide-react";
import {
  professionalService,
  ProfessionalSearchParams,
  ProfessionalProfile,
} from "@/lib/professional-service";
import { useToast } from "@/hooks/use-toast";

interface ProfessionalRecommendationsProps {
  initialFilters?: ProfessionalSearchParams;
  title?: string;
  showFilters?: boolean;
  maxResults?: number;
}

export const ProfessionalRecommendations: React.FC<
  ProfessionalRecommendationsProps
> = ({
  initialFilters = {},
  title = "Recommended Professionals",
  showFilters = true,
  maxResults: initialMaxResults = 6,
}) => {
  console.log(
    "ProfessionalRecommendations - Component rendered with initialFilters:",
    initialFilters
  );

  const { toast } = useToast();
  const [filters, setFilters] =
    useState<ProfessionalSearchParams>(initialFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [displayCount, setDisplayCount] = useState(initialMaxResults);

  // Fetch professionals based on filters
  const {
    data: professionalsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["professionals", filters],
    queryFn: async () => {
      console.log(
        "ProfessionalRecommendations - Calling search with filters:",
        filters
      );
      // If no filters, get some default recommendations
      if (Object.keys(filters).length === 0) {
        console.log(
          "ProfessionalRecommendations - No filters, getting default recommendations"
        );
        // You could call a different endpoint for default recommendations
        // For now, let's try with empty filters to get all professionals
        const result = await professionalService.search({});
        console.log(
          "ProfessionalRecommendations - Default search result:",
          result
        );
        return result;
      }
      const result = await professionalService.search(filters);
      console.log("ProfessionalRecommendations - Search result:", result);
      return result;
    },
    enabled: true, // Always enable the query to fetch data
  });

  // Handle different possible data structures and ensure it's always an array
  const professionals: ProfessionalProfile[] = Array.isArray(professionalsData)
    ? professionalsData
    : professionalsData?.results || [];

  // Debug logging
  console.log(
    "ProfessionalRecommendations - professionalsData:",
    professionalsData
  );
  console.log("ProfessionalRecommendations - professionals:", professionals);
  console.log("ProfessionalRecommendations - isLoading:", isLoading);
  console.log("ProfessionalRecommendations - error:", error);

  // Handle filter changes
  const updateFilter = (key: keyof ProfessionalSearchParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      updateFilter("location", searchQuery.trim());
    }
  };

  // Handle favorite toggle
  const handleFavorite = async (profileId: number) => {
    try {
      await professionalService.toggleFavorite(profileId);
      setFavorites((prev) =>
        prev.includes(profileId)
          ? prev.filter((id) => id !== profileId)
          : [...prev, profileId]
      );
      toast({
        title: favorites.includes(profileId)
          ? "Removed from favorites"
          : "Added to favorites",
        description: favorites.includes(profileId)
          ? "Professional removed from your favorites."
          : "Professional added to your favorites.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle booking
  const handleBook = async (professional: ProfessionalProfile) => {
    try {
      await professionalService.bookProfessional(professional.id, {
        professionalId: professional.id,
        bookingDate: new Date().toISOString(),
        // Add more booking details as needed
      });
      toast({
        title: "Booking Request Sent",
        description: `Your booking request has been sent to ${professional.firstName} ${professional.lastName}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  // Get avatar fallback
  const getAvatarFallback = (professional: ProfessionalProfile) => {
    if (professional.firstName && professional.lastName) {
      return `${professional.firstName[0]}${professional.lastName[0]}`.toUpperCase();
    }
    return professional.username.slice(0, 2).toUpperCase();
  };

  // Format price range
  const formatPriceRange = (professional: ProfessionalProfile) => {
    if (professional.priceMin && professional.priceMax) {
      return `$${professional.priceMin}-$${professional.priceMax}`;
    } else if (professional.priceMin) {
      return `From $${professional.priceMin}`;
    } else if (professional.rate) {
      return professional.rate;
    }
    return "Contact for pricing";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {showFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showAdvancedFilters ? "Hide" : "Show"} Filters
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Basic Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by location, city, or state..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>Search</Button>
                {(Object.keys(filters).length > 0 || searchQuery) && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Service Category
                    </label>
                    <Select
                      value={filters.service_category?.[0] || ""}
                      onValueChange={(value) =>
                        updateFilter(
                          "service_category",
                          value ? [value] : undefined
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instructor">
                          Dance Instructor
                        </SelectItem>
                        <SelectItem value="choreographer">
                          Choreographer
                        </SelectItem>
                        <SelectItem value="judge">Dance Judge</SelectItem>
                        <SelectItem value="studio">Dance Studio</SelectItem>
                        <SelectItem value="other">
                          Other Professional
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Dance Style
                    </label>
                    <Select
                      value={filters.dance_style?.[0] || ""}
                      onValueChange={(value) =>
                        updateFilter("dance_style", value ? [value] : undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ballet">Ballet</SelectItem>
                        <SelectItem value="contemporary">
                          Contemporary
                        </SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="hip-hop">Hip Hop</SelectItem>
                        <SelectItem value="tap">Tap</SelectItem>
                        <SelectItem value="ballroom">Ballroom</SelectItem>
                        <SelectItem value="latin">Latin</SelectItem>
                        <SelectItem value="swing">Swing</SelectItem>
                        <SelectItem value="folk">Folk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Max Price (per session)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter max price"
                      value={filters.price_max || ""}
                      onChange={(e) =>
                        updateFilter(
                          "price_max",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: displayCount }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-8">
            <p className="text-red-500">
              Failed to load professionals. Please try again.
            </p>
            <Button onClick={() => refetch()} className="mt-2">
              Retry
            </Button>
          </div>
        ) : professionals.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">
              No professionals found matching your criteria.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-400">
                Try adjusting your search criteria or check back later for new
                professionals.
              </p>
              <Button onClick={clearFilters} className="mt-2">
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          professionals.slice(0, displayCount).map((professional) => (
            <Card
              key={professional.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={professional.profileImageUrl || ""}
                        alt={professional.username}
                      />
                      <AvatarFallback>
                        {getAvatarFallback(professional)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {professional.firstName && professional.lastName
                          ? `${professional.firstName} ${professional.lastName}`
                          : professional.username}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {professional.providerType || "Dance Professional"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFavorite(professional.id)}
                    className={`${favorites.includes(professional.id) ? "text-red-500" : "text-gray-400"}`}
                  >
                    <Heart
                      className={`w-4 h-4 ${favorites.includes(professional.id) ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>

                {/* Rating */}
                {professional.rating && (
                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">
                      {professional.rating}
                    </span>
                    {professional.reviewCount && (
                      <span className="text-sm text-gray-500">
                        ({professional.reviewCount} reviews)
                      </span>
                    )}
                  </div>
                )}

                {/* Bio */}
                {professional.bio && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {professional.bio}
                  </p>
                )}

                {/* Dance Styles */}
                {professional.danceStyles &&
                  professional.danceStyles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {professional.danceStyles
                        .slice(0, 3)
                        .map((style, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {style}
                          </Badge>
                        ))}
                      {professional.danceStyles.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{professional.danceStyles.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                {/* Location */}
                {professional.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {professional.location}
                  </div>
                )}

                {/* Experience */}
                {professional.yearsExperience && (
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Clock className="w-4 h-4 mr-1" />
                    {professional.yearsExperience} years experience
                  </div>
                )}

                {/* Pricing */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPriceRange(professional)}
                  </span>
                  {professional.sessionDuration && (
                    <span className="text-sm text-gray-500">
                      {professional.sessionDuration} min session
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBook(professional)}
                    className="flex-1"
                  >
                    Book Now
                  </Button>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {professionals.length > displayCount && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setDisplayCount((prev) => prev + 6)}
          >
            Load More Professionals
          </Button>
        </div>
      )}
    </div>
  );
};

interface DanceStyleRecommendationsProps {
  danceStyles: string[];
  title?: string;
}

export const DanceStyleRecommendations: React.FC<
  DanceStyleRecommendationsProps
> = ({ danceStyles, title = "Professionals based on your dance style" }) => {
  console.log(
    "DanceStyleRecommendations - Component rendered with danceStyles:",
    danceStyles
  );

  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(
          "DanceStyleRecommendations - Fetching for dance styles:",
          danceStyles
        );

        // Use the main search method with dance_style filter
        const searchParams: ProfessionalSearchParams = {
          dance_style: danceStyles,
        };

        const res = await professionalService.search(searchParams);
        console.log("DanceStyleRecommendations - Search result:", res);

        if (isMounted) {
          // Handle both possible data structures: res.results or res directly
          const rawResults = Array.isArray(res) ? res : res?.results || [];

          // Map API response to expected UI structure
          const mappedResults = rawResults.map(
            (item: any) =>
              ({
                id: item.id,
                userId: item.user_id,
                firstName: item.user?.first_name,
                lastName: item.user?.last_name,
                username: item.user?.username,
                email: item.user?.email,
                profileImageUrl: item.user?.profile_image_url,
                bio: item.bio,
                location: item.location,
                danceStyles: item.dance_style || [],
                serviceCategory: item.service_category || [],
                pricing: item.pricing,
                rate: item.pricing?.toString() || "",
                yearsExperience: item.years_experience,
                services: item.services || [],
                portfolio: item.portfolio,
                rating: item.rating,
                reviewCount: item.review_count,
                sessionDuration: item.session_duration,
                priceMin: item.price_min,
                priceMax: item.price_max,
                providerType:
                  item.service_category?.[0] || "Dance Professional",
                availability: item.availability || [],
                isVerified: item.is_verified || false,
                isProfessional: item.is_professional || false,
                phoneNumber: item.phone_number,
                address: item.address,
                city: item.city,
                state: item.state,
                country: item.country,
                zipCode: item.zip_code,
                travelDistance: item.travel_distance,
              }) as ProfessionalProfile
          );

          setProfessionals(mappedResults);
          console.log(
            "DanceStyleRecommendations - Set professionals:",
            mappedResults
          );
        }
      } catch (e) {
        console.error("DanceStyleRecommendations - Error:", e);
        if (isMounted) setError("Failed to load professionals.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (danceStyles && danceStyles.length > 0) {
      console.log(
        "DanceStyleRecommendations - Starting fetch for dance styles:",
        danceStyles
      );
      fetchProfessionals();
    } else {
      console.log(
        "DanceStyleRecommendations - No dance styles provided, setting empty array"
      );
      setProfessionals([]);
    }
    return () => {
      isMounted = false;
    };
  }, [danceStyles]);

  if (!danceStyles || danceStyles.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : professionals.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No professionals found for your selected dance style.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map((pro) => (
            <Card key={pro.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={pro.profileImageUrl || ""}
                      alt={pro.username}
                    />
                    <AvatarFallback>
                      {pro.firstName?.[0]}
                      {pro.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {pro.firstName && pro.lastName
                        ? `${pro.firstName} ${pro.lastName}`
                        : pro.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {pro.providerType || "Dance Professional"}
                    </p>
                  </div>
                </div>
                {pro.danceStyles && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pro.danceStyles.map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pro.location}
                  </div>
                )}
                {pro.rating && (
                  <div className="flex items-center text-xs text-yellow-600 mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    {pro.rating}
                  </div>
                )}
                <Button size="sm" className="mt-2 w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Category-based recommendations
interface CategoryRecommendationsProps {
  categories: string[];
  title?: string;
}

export const CategoryRecommendations: React.FC<
  CategoryRecommendationsProps
> = ({ categories, title = "Professionals based on your category" }) => {
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        const allResults: ProfessionalProfile[] = [];
        for (const category of categories) {
          const res = await professionalService.getByCategory(category);
          console.log("CategoryRecommendations - res:", res);

          // Handle both possible data structures: res.results or res directly
          const rawResults = Array.isArray(res) ? res : res?.results || [];

          // Map API response to expected UI structure
          const mappedResults = rawResults.map(
            (item: any) =>
              ({
                id: item.id,
                userId: item.user_id,
                firstName: item.user?.first_name,
                lastName: item.user?.last_name,
                username: item.user?.username,
                email: item.user?.email,
                profileImageUrl: item.user?.profile_image_url,
                bio: item.bio,
                location: item.location,
                danceStyles: item.dance_style || [],
                serviceCategory: item.service_category || [],
                pricing: item.pricing,
                rate: item.pricing?.toString() || "",
                yearsExperience: item.years_experience,
                services: item.services || [],
                portfolio: item.portfolio,
                rating: item.rating,
                reviewCount: item.review_count,
                sessionDuration: item.session_duration,
                priceMin: item.price_min,
                priceMax: item.price_max,
                providerType:
                  item.service_category?.[0] || "Dance Professional",
                availability: item.availability || [],
                isVerified: item.is_verified || false,
                isProfessional: item.is_professional || false,
                phoneNumber: item.phone_number,
                address: item.address,
                city: item.city,
                state: item.state,
                country: item.country,
                zipCode: item.zip_code,
                travelDistance: item.travel_distance,
              }) as ProfessionalProfile
          );

          allResults.push(...mappedResults);
        }
        const unique = Array.from(
          new Map(allResults.map((p) => [p.id, p])).values()
        );
        if (isMounted) setProfessionals(unique);
      } catch (e) {
        console.error("CategoryRecommendations - Error:", e);
        setError("Failed to load professionals.");
      } finally {
        setLoading(false);
      }
    };
    if (categories && categories.length > 0) {
      fetchProfessionals();
    } else {
      setProfessionals([]);
    }
    return () => {
      isMounted = false;
    };
  }, [categories]);

  if (!categories || categories.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : professionals.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No professionals found for your selected category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map((pro) => (
            <Card key={pro.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={pro.profileImageUrl || ""}
                      alt={pro.username}
                    />
                    <AvatarFallback>
                      {pro.firstName?.[0]}
                      {pro.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {pro.firstName && pro.lastName
                        ? `${pro.firstName} ${pro.lastName}`
                        : pro.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {pro.providerType || "Dance Professional"}
                    </p>
                  </div>
                </div>
                {pro.danceStyles && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pro.danceStyles.map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pro.location}
                  </div>
                )}
                {pro.rating && (
                  <div className="flex items-center text-xs text-yellow-600 mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    {pro.rating}
                  </div>
                )}
                <Button size="sm" className="mt-2 w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// City-based recommendations
interface CityRecommendationsProps {
  city: string;
  title?: string;
}

export const CityRecommendations: React.FC<CityRecommendationsProps> = ({
  city,
  title = "Professionals in your city",
}) => {
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await professionalService.getByCity(city);
        console.log("CityRecommendations - res:", res);

        if (isMounted) {
          // Handle both possible data structures: res.results or res directly
          const rawResults = Array.isArray(res) ? res : res?.results || [];

          // Map API response to expected UI structure
          const mappedResults = rawResults.map(
            (item: any) =>
              ({
                id: item.id,
                userId: item.user_id,
                firstName: item.user?.first_name,
                lastName: item.user?.last_name,
                username: item.user?.username,
                email: item.user?.email,
                profileImageUrl: item.user?.profile_image_url,
                bio: item.bio,
                location: item.location,
                danceStyles: item.dance_style || [],
                serviceCategory: item.service_category || [],
                pricing: item.pricing,
                rate: item.pricing?.toString() || "",
                yearsExperience: item.years_experience,
                services: item.services || [],
                portfolio: item.portfolio,
                rating: item.rating,
                reviewCount: item.review_count,
                sessionDuration: item.session_duration,
                priceMin: item.price_min,
                priceMax: item.price_max,
                providerType:
                  item.service_category?.[0] || "Dance Professional",
                availability: item.availability || [],
                isVerified: item.is_verified || false,
                isProfessional: item.is_professional || false,
                phoneNumber: item.phone_number,
                address: item.address,
                city: item.city,
                state: item.state,
                country: item.country,
                zipCode: item.zip_code,
                travelDistance: item.travel_distance,
              }) as ProfessionalProfile
          );

          setProfessionals(mappedResults);
        }
      } catch (e) {
        console.error("CityRecommendations - Error:", e);
        setError("Failed to load professionals.");
      } finally {
        setLoading(false);
      }
    };
    if (city) {
      fetchProfessionals();
    } else {
      setProfessionals([]);
    }
    return () => {
      isMounted = false;
    };
  }, [city]);

  if (!city) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : professionals.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No professionals found in {city}.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map((pro) => (
            <Card key={pro.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={pro.profileImageUrl || ""}
                      alt={pro.username}
                    />
                    <AvatarFallback>
                      {pro.firstName?.[0]}
                      {pro.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {pro.firstName && pro.lastName
                        ? `${pro.firstName} ${pro.lastName}`
                        : pro.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {pro.providerType || "Dance Professional"}
                    </p>
                  </div>
                </div>
                {pro.danceStyles && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pro.danceStyles.map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pro.location}
                  </div>
                )}
                {pro.rating && (
                  <div className="flex items-center text-xs text-yellow-600 mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    {pro.rating}
                  </div>
                )}
                <Button size="sm" className="mt-2 w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// State-based recommendations
interface StateRecommendationsProps {
  state: string;
  title?: string;
}

export const StateRecommendations: React.FC<StateRecommendationsProps> = ({
  state,
  title = "Professionals in your state",
}) => {
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await professionalService.getByState(state);
        console.log("StateRecommendations - res:", res);

        if (isMounted) {
          // Handle both possible data structures: res.results or res directly
          const rawResults = Array.isArray(res) ? res : res?.results || [];

          // Map API response to expected UI structure
          const mappedResults = rawResults.map(
            (item: any) =>
              ({
                id: item.id,
                userId: item.user_id,
                firstName: item.user?.first_name,
                lastName: item.user?.last_name,
                username: item.user?.username,
                email: item.user?.email,
                profileImageUrl: item.user?.profile_image_url,
                bio: item.bio,
                location: item.location,
                danceStyles: item.dance_style || [],
                serviceCategory: item.service_category || [],
                pricing: item.pricing,
                rate: item.pricing?.toString() || "",
                yearsExperience: item.years_experience,
                services: item.services || [],
                portfolio: item.portfolio,
                rating: item.rating,
                reviewCount: item.review_count,
                sessionDuration: item.session_duration,
                priceMin: item.price_min,
                priceMax: item.price_max,
                providerType:
                  item.service_category?.[0] || "Dance Professional",
                availability: item.availability || [],
                isVerified: item.is_verified || false,
                isProfessional: item.is_professional || false,
                phoneNumber: item.phone_number,
                address: item.address,
                city: item.city,
                state: item.state,
                country: item.country,
                zipCode: item.zip_code,
                travelDistance: item.travel_distance,
              }) as ProfessionalProfile
          );

          setProfessionals(mappedResults);
        }
      } catch (e) {
        console.error("StateRecommendations - Error:", e);
        setError("Failed to load professionals.");
      } finally {
        setLoading(false);
      }
    };
    if (state) {
      fetchProfessionals();
    } else {
      setProfessionals([]);
    }
    return () => {
      isMounted = false;
    };
  }, [state]);

  if (!state) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : professionals.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No professionals found in {state}.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map((pro) => (
            <Card key={pro.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={pro.profileImageUrl || ""}
                      alt={pro.username}
                    />
                    <AvatarFallback>
                      {pro.firstName?.[0]}
                      {pro.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {pro.firstName && pro.lastName
                        ? `${pro.firstName} ${pro.lastName}`
                        : pro.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {pro.providerType || "Dance Professional"}
                    </p>
                  </div>
                </div>
                {pro.danceStyles && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pro.danceStyles.map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pro.location}
                  </div>
                )}
                {pro.rating && (
                  <div className="flex items-center text-xs text-yellow-600 mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    {pro.rating}
                  </div>
                )}
                <Button size="sm" className="mt-2 w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Pricing-based recommendations
interface PricingRecommendationsProps {
  minPrice?: number;
  maxPrice?: number;
  title?: string;
}

export const PricingRecommendations: React.FC<PricingRecommendationsProps> = ({
  minPrice,
  maxPrice,
  title = "Professionals in your budget range",
}) => {
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await professionalService.getByPricing(minPrice, maxPrice);
        console.log("PricingRecommendations - res:", res);

        if (isMounted) {
          // Handle both possible data structures: res.results or res directly
          const rawResults = Array.isArray(res) ? res : res?.results || [];

          // Map API response to expected UI structure
          const mappedResults = rawResults.map(
            (item: any) =>
              ({
                id: item.id,
                userId: item.user_id,
                firstName: item.user?.first_name,
                lastName: item.user?.last_name,
                username: item.user?.username,
                email: item.user?.email,
                profileImageUrl: item.user?.profile_image_url,
                bio: item.bio,
                location: item.location,
                danceStyles: item.dance_style || [],
                serviceCategory: item.service_category || [],
                pricing: item.pricing,
                rate: item.pricing?.toString() || "",
                yearsExperience: item.years_experience,
                services: item.services || [],
                portfolio: item.portfolio,
                rating: item.rating,
                reviewCount: item.review_count,
                sessionDuration: item.session_duration,
                priceMin: item.price_min,
                priceMax: item.price_max,
                providerType:
                  item.service_category?.[0] || "Dance Professional",
                availability: item.availability || [],
                isVerified: item.is_verified || false,
                isProfessional: item.is_professional || false,
                phoneNumber: item.phone_number,
                address: item.address,
                city: item.city,
                state: item.state,
                country: item.country,
                zipCode: item.zip_code,
                travelDistance: item.travel_distance,
              }) as ProfessionalProfile
          );

          setProfessionals(mappedResults);
        }
      } catch (e) {
        console.error("PricingRecommendations - Error:", e);
        setError("Failed to load professionals.");
      } finally {
        setLoading(false);
      }
    };
    if (minPrice !== undefined || maxPrice !== undefined) {
      fetchProfessionals();
    } else {
      setProfessionals([]);
    }
    return () => {
      isMounted = false;
    };
  }, [minPrice, maxPrice]);

  if (minPrice === undefined && maxPrice === undefined) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : professionals.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No professionals found in your budget range.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map((pro) => (
            <Card key={pro.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={pro.profileImageUrl || ""}
                      alt={pro.username}
                    />
                    <AvatarFallback>
                      {pro.firstName?.[0]}
                      {pro.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {pro.firstName && pro.lastName
                        ? `${pro.firstName} ${pro.lastName}`
                        : pro.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {pro.providerType || "Dance Professional"}
                    </p>
                  </div>
                </div>
                {pro.danceStyles && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pro.danceStyles.map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pro.location}
                  </div>
                )}
                {pro.rating && (
                  <div className="flex items-center text-xs text-yellow-600 mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    {pro.rating}
                  </div>
                )}
                <Button size="sm" className="mt-2 w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Date-based recommendations
interface DateRecommendationsProps {
  date: string;
  title?: string;
}

export const DateRecommendations: React.FC<DateRecommendationsProps> = ({
  date,
  title = "Professionals available on your date",
}) => {
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await professionalService.getByDate(date);
        console.log("DateRecommendations - res:", res);

        if (isMounted) {
          // Handle both possible data structures: res.results or res directly
          const rawResults = Array.isArray(res) ? res : res?.results || [];

          // Map API response to expected UI structure
          const mappedResults = rawResults.map(
            (item: any) =>
              ({
                id: item.id,
                userId: item.user_id,
                firstName: item.user?.first_name,
                lastName: item.user?.last_name,
                username: item.user?.username,
                email: item.user?.email,
                profileImageUrl: item.user?.profile_image_url,
                bio: item.bio,
                location: item.location,
                danceStyles: item.dance_style || [],
                serviceCategory: item.service_category || [],
                pricing: item.pricing,
                rate: item.pricing?.toString() || "",
                yearsExperience: item.years_experience,
                services: item.services || [],
                portfolio: item.portfolio,
                rating: item.rating,
                reviewCount: item.review_count,
                sessionDuration: item.session_duration,
                priceMin: item.price_min,
                priceMax: item.price_max,
                providerType:
                  item.service_category?.[0] || "Dance Professional",
                availability: item.availability || [],
                isVerified: item.is_verified || false,
                isProfessional: item.is_professional || false,
                phoneNumber: item.phone_number,
                address: item.address,
                city: item.city,
                state: item.state,
                country: item.country,
                zipCode: item.zip_code,
                travelDistance: item.travel_distance,
              }) as ProfessionalProfile
          );

          setProfessionals(mappedResults);
        }
      } catch (e) {
        console.error("DateRecommendations - Error:", e);
        setError("Failed to load professionals.");
      } finally {
        setLoading(false);
      }
    };
    if (date) {
      fetchProfessionals();
    } else {
      setProfessionals([]);
    }
    return () => {
      isMounted = false;
    };
  }, [date]);

  if (!date) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : professionals.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No professionals available on your selected date.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map((pro) => (
            <Card key={pro.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={pro.profileImageUrl || ""}
                      alt={pro.username}
                    />
                    <AvatarFallback>
                      {pro.firstName?.[0]}
                      {pro.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {pro.firstName && pro.lastName
                        ? `${pro.firstName} ${pro.lastName}`
                        : pro.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {pro.providerType || "Dance Professional"}
                    </p>
                  </div>
                </div>
                {pro.danceStyles && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pro.danceStyles.map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pro.location}
                  </div>
                )}
                {pro.rating && (
                  <div className="flex items-center text-xs text-yellow-600 mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    {pro.rating}
                  </div>
                )}
                <Button size="sm" className="mt-2 w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Location-based recommendations
interface LocationRecommendationsProps {
  location: string;
  title?: string;
}

export const LocationRecommendations: React.FC<
  LocationRecommendationsProps
> = ({ location, title = "Professionals near your location" }) => {
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await professionalService.getByLocation(location);
        console.log("LocationRecommendations - res:", res);

        if (isMounted) {
          // Handle both possible data structures: res.results or res directly
          const rawResults = Array.isArray(res) ? res : res?.results || [];

          // Map API response to expected UI structure
          const mappedResults = rawResults.map(
            (item: any) =>
              ({
                id: item.id,
                userId: item.user_id,
                firstName: item.user?.first_name,
                lastName: item.user?.last_name,
                username: item.user?.username,
                email: item.user?.email,
                profileImageUrl: item.user?.profile_image_url,
                bio: item.bio,
                location: item.location,
                danceStyles: item.dance_style || [],
                serviceCategory: item.service_category || [],
                pricing: item.pricing,
                rate: item.pricing?.toString() || "",
                yearsExperience: item.years_experience,
                services: item.services || [],
                portfolio: item.portfolio,
                rating: item.rating,
                reviewCount: item.review_count,
                sessionDuration: item.session_duration,
                priceMin: item.price_min,
                priceMax: item.price_max,
                providerType:
                  item.service_category?.[0] || "Dance Professional",
                availability: item.availability || [],
                isVerified: item.is_verified || false,
                isProfessional: item.is_professional || false,
                phoneNumber: item.phone_number,
                address: item.address,
                city: item.city,
                state: item.state,
                country: item.country,
                zipCode: item.zip_code,
                travelDistance: item.travel_distance,
              }) as ProfessionalProfile
          );

          setProfessionals(mappedResults);
        }
      } catch (e) {
        console.error("LocationRecommendations - Error:", e);
        setError("Failed to load professionals.");
      } finally {
        setLoading(false);
      }
    };
    if (location) {
      fetchProfessionals();
    } else {
      setProfessionals([]);
    }
    return () => {
      isMounted = false;
    };
  }, [location]);

  if (!location) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : professionals.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No professionals found near your location.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map((pro) => (
            <Card key={pro.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={pro.profileImageUrl || ""}
                      alt={pro.username}
                    />
                    <AvatarFallback>
                      {pro.firstName?.[0]}
                      {pro.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {pro.firstName && pro.lastName
                        ? `${pro.firstName} ${pro.lastName}`
                        : pro.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {pro.providerType || "Dance Professional"}
                    </p>
                  </div>
                </div>
                {pro.danceStyles && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pro.danceStyles.map((style, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pro.location}
                  </div>
                )}
                {pro.rating && (
                  <div className="flex items-center text-xs text-yellow-600 mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    {pro.rating}
                  </div>
                )}
                <Button size="sm" className="mt-2 w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
