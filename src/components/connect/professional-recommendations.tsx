import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, MapPin, Clock, Users, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProfessionalRecommendation {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_image_url?: string;
  };
  bio: string;
  location: string;
  city: string;
  state: string;
  service_category: string[];
  dance_style: string[];
  years_experience: number;
  services: string[];
  pricing: number;
  portfolio?: string;
  rating?: number;
  review_count?: number;
  is_verified: boolean;
}

interface ProfessionalRecommendationsProps {
  originalSearchCriteria: any;
  onProfessionalSelect: (professional: ProfessionalRecommendation) => void;
}

export const ProfessionalRecommendations: React.FC<
  ProfessionalRecommendationsProps
> = ({ originalSearchCriteria, onProfessionalSelect }) => {
  const [recommendations, setRecommendations] = useState<
    ProfessionalRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"location" | "style" | "category">(
    "location"
  );

  console.log(
    "ProfessionalRecommendations component rendered with criteria:",
    originalSearchCriteria
  );

  useEffect(() => {
    console.log("ProfessionalRecommendations useEffect triggered");
    fetchRecommendations();
  }, [originalSearchCriteria, activeTab]);

  const fetchRecommendations = async () => {
    setLoading(true);
    console.log("fetchRecommendations called with activeTab:", activeTab);
    try {
      let endpoint = "";
      const params = new URLSearchParams();

      // Create different recommendation strategies based on the tab
      switch (activeTab) {
        case "location":
          // Recommend professionals in the same area but with relaxed criteria
          if (originalSearchCriteria.zip_code) {
            params.append("zip_code", originalSearchCriteria.zip_code);
            params.append("travel_distance", "50"); // Increase travel distance
          }
          if (originalSearchCriteria.city) {
            params.append("city", originalSearchCriteria.city);
          }
          if (originalSearchCriteria.state) {
            params.append("state", originalSearchCriteria.state);
          }
          endpoint = `https://api.livetestdomain.com/api/profiles/professionals/search?${params.toString()}`;
          break;

        case "style":
          // Recommend professionals with similar dance styles
          if (originalSearchCriteria.dance_style?.length > 0) {
            originalSearchCriteria.dance_style.forEach((style: string) => {
              params.append("dance_style", style);
            });
          }
          endpoint = `https://api.livetestdomain.com/api/profiles/professionals/search?${params.toString()}`;
          break;

        case "category":
          // Recommend professionals in the same service category
          if (originalSearchCriteria.service_category?.length > 0) {
            originalSearchCriteria.service_category.forEach((cat: string) => {
              params.append("service_category", cat);
            });
          }
          endpoint = `https://api.livetestdomain.com/api/profiles/professionals/search?${params.toString()}`;
          break;
      }

      console.log("Making API request to:", endpoint);

      const result = await apiRequest(endpoint, {
        method: "GET",
        requireAuth: true,
      });

      console.log("API response:", result);

      // Filter out any professionals that might have been in the original search
      // and limit to top 6 recommendations
      const filteredRecommendations = result.results?.slice(0, 6) || [];
      console.log("Filtered recommendations:", filteredRecommendations);
      setRecommendations(filteredRecommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (professionalId: number, isFav: boolean) => {
    try {
      await apiRequest(
        `https://api.livetestdomain.com/api/profiles/${professionalId}/book`,
        { method: "POST", requireAuth: true }
      );
      setFavorites((prev) =>
        isFav
          ? prev.filter((id) => id !== professionalId)
          : [...prev, professionalId]
      );
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "location":
        return "Nearby Professionals";
      case "style":
        return "Similar Dance Styles";
      case "category":
        return "Same Service Category";
      default:
        return tab;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white">Finding recommendations...</span>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <Users className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          No Recommendations Available
        </h3>
        <p className="text-gray-300">
          Try expanding your search criteria or check back later for new
          professionals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Here are some alternatives you might like:
        </h3>
        <p className="text-gray-300 mb-6">
          We couldn't find exact matches, but here are professionals that might
          meet your needs.
        </p>
      </div>

      {/* Recommendation Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-1 inline-flex">
          {(["location", "style", "category"] as const).map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {getTabLabel(tab)}
            </Button>
          ))}
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((professional) => {
          const isFav = favorites.includes(professional.id);
          return (
            <Card
              key={professional.id}
              className="bg-black/40 backdrop-blur-sm border border-white/20 hover:border-blue-400/50 transition-all hover:scale-105 cursor-pointer"
              onClick={() => onProfessionalSelect(professional)}
            >
              <CardContent className="p-6">
                {/* Header with image and favorite button */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center overflow-hidden border-2 border-white/20">
                      {professional.user.profile_image_url ? (
                        <img
                          src={professional.user.profile_image_url}
                          alt={`${professional.user.first_name} ${professional.user.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {professional.user.first_name?.[0] || "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {professional.user.first_name}{" "}
                        {professional.user.last_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {professional.location ||
                            `${professional.city}, ${professional.state}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(professional.id, isFav);
                    }}
                    className="text-white hover:text-pink-400 transition-colors"
                  >
                    <Heart
                      className={`h-5 w-5 ${isFav ? "fill-pink-500 text-pink-500" : "fill-none"}`}
                    />
                  </button>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {professional.bio ||
                    "Professional dance instructor with years of experience."}
                </p>

                {/* Categories and Styles */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {professional.service_category
                    ?.slice(0, 2)
                    .map((category, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-300 text-xs"
                      >
                        {category}
                      </Badge>
                    ))}
                  {professional.dance_style?.slice(0, 2).map((style, index) => (
                    <Badge
                      key={`style-${index}`}
                      variant="outline"
                      className="border-purple-400/30 text-purple-300 text-xs"
                    >
                      {style}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    <span>{professional.years_experience} yrs</span>
                  </div>
                  {professional.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{professional.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="text-green-400 font-semibold">
                    ${professional.pricing}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProfessionalSelect(professional);
                  }}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alternative Actions */}
      <div className="text-center pt-6 border-t border-white/20">
        <p className="text-gray-300 mb-4">
          Don't see what you're looking for? Try these options:
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => (window.location.href = "/connect/book")}
          >
            Modify Search
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => (window.location.href = "/connect/get-booked")}
          >
            Become a Professional
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => (window.location.href = "/courses")}
          >
            Browse Courses Instead
          </Button>
        </div>
      </div>
    </div>
  );
};
