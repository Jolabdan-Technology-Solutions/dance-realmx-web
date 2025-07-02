import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Star, Heart } from "lucide-react";
import {
  professionalService,
  ProfessionalProfile,
} from "@/lib/professional-service";

interface ComprehensiveRecommendationsProps {
  bookingData: any;
}

export const ComprehensiveRecommendations: React.FC<
  ComprehensiveRecommendationsProps
> = ({ bookingData }) => {
  const [recommendations, setRecommendations] = useState<{
    [key: string]: {
      professionals: ProfessionalProfile[];
      loading: boolean;
      error: string | null;
    };
  }>({});
  const [favorites, setFavorites] = useState<number[]>([]);

  // Fetch recommendations based on booking data
  useEffect(() => {
    const fetchRecommendations = async () => {
      const newRecommendations: any = {};

      // 1. By Category
      if (bookingData.service_category?.length > 0) {
        newRecommendations.category = {
          professionals: [],
          loading: true,
          error: null,
        };
        try {
          const allResults: ProfessionalProfile[] = [];
          for (const category of bookingData.service_category) {
            const res = await professionalService.getByCategory(category);
            if (res?.results) {
              allResults.push(...res.results);
            }
          }
          const unique = Array.from(
            new Map(allResults.map((p) => [p.id, p])).values()
          );
          newRecommendations.category = {
            professionals: unique,
            loading: false,
            error: null,
          };
        } catch (error) {
          newRecommendations.category = {
            professionals: [],
            loading: false,
            error: "Failed to load",
          };
        }
      }

      // 2. By City
      if (bookingData.city) {
        newRecommendations.city = {
          professionals: [],
          loading: true,
          error: null,
        };
        try {
          const res = await professionalService.getByCity(bookingData.city);
          newRecommendations.city = {
            professionals: res?.results || [],
            loading: false,
            error: null,
          };
        } catch (error) {
          newRecommendations.city = {
            professionals: [],
            loading: false,
            error: "Failed to load",
          };
        }
      }

      // 3. By Dance Style
      if (bookingData.dance_style?.length > 0) {
        newRecommendations.danceStyle = {
          professionals: [],
          loading: true,
          error: null,
        };
        try {
          const allResults: ProfessionalProfile[] = [];
          for (const style of bookingData.dance_style) {
            const res = await professionalService.getByDanceStyle(style);
            if (res?.results) {
              allResults.push(...res.results);
            }
          }
          const unique = Array.from(
            new Map(allResults.map((p) => [p.id, p])).values()
          );
          newRecommendations.danceStyle = {
            professionals: unique,
            loading: false,
            error: null,
          };
        } catch (error) {
          newRecommendations.danceStyle = {
            professionals: [],
            loading: false,
            error: "Failed to load",
          };
        }
      }

      // 4. By Date
      if (bookingData.date) {
        newRecommendations.date = {
          professionals: [],
          loading: true,
          error: null,
        };
        try {
          const res = await professionalService.getByDate(
            bookingData.date.toISOString()
          );
          newRecommendations.date = {
            professionals: res?.results || [],
            loading: false,
            error: null,
          };
        } catch (error) {
          newRecommendations.date = {
            professionals: [],
            loading: false,
            error: "Failed to load",
          };
        }
      }

      // 5. By Location
      if (bookingData.location) {
        newRecommendations.location = {
          professionals: [],
          loading: true,
          error: null,
        };
        try {
          const res = await professionalService.getByLocation(
            bookingData.location
          );
          newRecommendations.location = {
            professionals: res?.results || [],
            loading: false,
            error: null,
          };
        } catch (error) {
          newRecommendations.location = {
            professionals: [],
            loading: false,
            error: "Failed to load",
          };
        }
      }

      // 6. By Pricing
      if (bookingData.pricing) {
        newRecommendations.pricing = {
          professionals: [],
          loading: true,
          error: null,
        };
        try {
          const res = await professionalService.getByPricing(
            undefined,
            bookingData.pricing
          );
          newRecommendations.pricing = {
            professionals: res?.results || [],
            loading: false,
            error: null,
          };
        } catch (error) {
          newRecommendations.pricing = {
            professionals: [],
            loading: false,
            error: "Failed to load",
          };
        }
      }

      // 7. By State
      if (bookingData.state) {
        newRecommendations.state = {
          professionals: [],
          loading: true,
          error: null,
        };
        try {
          const res = await professionalService.getByState(bookingData.state);
          newRecommendations.state = {
            professionals: res?.results || [],
            loading: false,
            error: null,
          };
        } catch (error) {
          newRecommendations.state = {
            professionals: [],
            loading: false,
            error: "Failed to load",
          };
        }
      }

      setRecommendations(newRecommendations);
    };

    fetchRecommendations();
  }, [bookingData]);

  const handleFavorite = async (profileId: number) => {
    try {
      await professionalService.toggleFavorite(profileId);
      setFavorites((prev) =>
        prev.includes(profileId)
          ? prev.filter((id) => id !== profileId)
          : [...prev, profileId]
      );
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const getAvatarFallback = (professional: ProfessionalProfile) => {
    if (professional.firstName && professional.lastName) {
      return `${professional.firstName[0]}${professional.lastName[0]}`.toUpperCase();
    }
    return professional.username.slice(0, 2).toUpperCase();
  };

  const renderProfessionalCard = (professional: ProfessionalProfile) => (
    <Card key={professional.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={professional.profileImageUrl || ""}
                alt={professional.username}
              />
              <AvatarFallback>{getAvatarFallback(professional)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-gray-900">
                {professional.firstName && professional.lastName
                  ? `${professional.firstName} ${professional.lastName}`
                  : professional.username}
              </h4>
              <p className="text-xs text-gray-500">
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

        {professional.danceStyles && (
          <div className="flex flex-wrap gap-1 mb-2">
            {professional.danceStyles.slice(0, 3).map((style, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
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

        {professional.location && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {professional.location}
          </div>
        )}

        {professional.rating && (
          <div className="flex items-center text-xs text-yellow-600 mb-2">
            <Star className="w-4 h-4 mr-1" />
            {professional.rating}
          </div>
        )}

        <Button size="sm" className="mt-2 w-full">
          View Profile
        </Button>
      </CardContent>
    </Card>
  );

  const renderSection = (key: string, title: string, data: any) => {
    if (!data) return null;

    return (
      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        {data.loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
          </div>
        ) : data.error ? (
          <div className="text-red-500 text-center py-4">{data.error}</div>
        ) : data.professionals.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No professionals found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {data.professionals.slice(0, 6).map(renderProfessionalCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">
        Professional Recommendations
      </h2>

      {renderSection(
        "category",
        "Professionals based on your category",
        recommendations.category
      )}
      {renderSection(
        "city",
        "Professionals in your city",
        recommendations.city
      )}
      {renderSection(
        "danceStyle",
        "Professionals based on your dance style",
        recommendations.danceStyle
      )}
      {renderSection(
        "date",
        "Professionals available on your date",
        recommendations.date
      )}
      {renderSection(
        "location",
        "Professionals near your location",
        recommendations.location
      )}
      {renderSection(
        "pricing",
        "Professionals in your budget range",
        recommendations.pricing
      )}
      {renderSection(
        "state",
        "Professionals in your state",
        recommendations.state
      )}
    </div>
  );
};
