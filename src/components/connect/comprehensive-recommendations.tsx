import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Heart,
  Clock,
  DollarSign,
  Phone,
  Globe,
  Award,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  professionalService,
  ProfessionalProfile,
} from "@/lib/professional-service";
import { useToast } from "@/hooks/use-toast";

interface ComprehensiveRecommendationsProps {
  bookingData: any;
  // Add props for the professional data that's already being returned
  categoryProfessionals?: ProfessionalProfile[];
  cityProfessionals?: ProfessionalProfile[];
  danceStyleProfessionals?: ProfessionalProfile[];
  dateProfessionals?: ProfessionalProfile[];
  locationProfessionals?: ProfessionalProfile[];
  pricingProfessionals?: ProfessionalProfile[];
  stateProfessionals?: ProfessionalProfile[];
}

export const ComprehensiveRecommendations: React.FC<
  ComprehensiveRecommendationsProps
> = ({
  bookingData,
  categoryProfessionals = [],
  cityProfessionals = [],
  danceStyleProfessionals = [],
  dateProfessionals = [],
  locationProfessionals = [],
  pricingProfessionals = [],
  stateProfessionals = [],
}) => {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<number[]>([]);

  const handleFavorite = async (profileId: number) => {
    try {
      await professionalService.toggleFavorite(profileId);
      setFavorites((prev) =>
        prev.includes(profileId)
          ? prev.filter((id) => id !== profileId)
          : [...prev, profileId]
      );
      toast({
        title: "Favorite Added",
        description: "Professional has been added to your favorites",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
      console.error("Failed to toggle favorite:", error);
    }
  };

  const getAvatarFallback = (professional: ProfessionalProfile) => {
    if (professional.user?.first_name && professional.user?.last_name) {
      return `${professional.user.first_name[0]}${professional.user.last_name[0]}`.toUpperCase();
    }
    return professional.user?.username?.slice(0, 2).toUpperCase() || "PR";
  };

  const renderProfessionalModal = (professional: ProfessionalProfile) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="mt-auto w-full">
          View Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-16 h-16">
              <AvatarImage
                src={professional.user?.profile_image_url || ""}
                alt={professional.user?.username || ""}
              />
              <AvatarFallback>{getAvatarFallback(professional)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">
                {professional.user?.first_name && professional.user?.last_name
                  ? `${professional.user.first_name} ${professional.user.last_name}`
                  : professional.user?.username || "Professional"}
              </h2>
              <p className="text-gray-600">
                {professional.is_professional
                  ? "Professional Dancer"
                  : "Dance Professional"}
                {professional.is_verified && (
                  <Badge variant="secondary" className="ml-2">
                    <Award className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{professional.phone_number || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span>{professional.user?.email || "Not provided"}</span>
                </div>
                {professional.portfolio && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <a
                      href={professional.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Location</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{professional.location || "Not specified"}</span>
                </div>
                <div className="text-gray-600">
                  {professional.city && professional.state && (
                    <span>
                      {professional.city}, {professional.state}
                    </span>
                  )}
                </div>
                {professional.travel_distance && (
                  <div className="text-gray-600">
                    Travels up to {professional.travel_distance} miles
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {professional.bio && (
            <div>
              <h3 className="font-semibold text-lg mb-2">About</h3>
              <p className="text-gray-700">{professional.bio}</p>
            </div>
          )}

          {/* Experience & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Experience</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-500" />
                  <span>
                    {professional.years_experience} years of experience
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Pricing</h3>
              <div className="space-y-1 text-sm">
                {professional.pricing && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>${professional.pricing}/hour</span>
                  </div>
                )}
                {professional.session_duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{professional.session_duration} minute sessions</span>
                  </div>
                )}
                {professional.price_min && professional.price_max && (
                  <div className="text-gray-600">
                    Range: ${professional.price_min} - ${professional.price_max}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dance Styles */}
          {professional.dance_style && professional.dance_style.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Dance Styles</h3>
              <div className="flex flex-wrap gap-2">
                {professional.dance_style.map((style, i) => (
                  <Badge key={i} variant="secondary">
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {professional.services && professional.services.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Services Offered</h3>
              <div className="flex flex-wrap gap-2">
                {professional.services.map((service, i) => (
                  <Badge key={i} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Service Categories */}
          {professional.service_category &&
            professional.service_category.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Service Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {professional.service_category.map((category, i) => (
                    <Badge key={i} variant="default">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Availability */}
          {professional.availability &&
            Array.isArray(professional.availability) &&
            professional.availability.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Availability</h3>
                <ul className="space-y-2">
                  {professional.availability.map((slot: any, idx: number) => (
                    <li key={idx} className="border rounded p-2">
                      <div className="font-medium">
                        {slot.start_date === slot.end_date
                          ? slot.start_date
                          : `${slot.start_date} to ${slot.end_date}`}
                      </div>
                      {slot.time_slots && slot.time_slots.length > 0 ? (
                        <ul className="ml-4 list-disc">
                          {slot.time_slots.map((time: string, tIdx: number) => (
                            <li key={tIdx}>{time}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="ml-4 text-sm text-muted-foreground">
                          No available slots
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleFavorite(professional.id)}
            >
              <Heart
                className={`w-4 h-4 mr-2 ${favorites.includes(professional.id) ? "fill-current text-red-500" : ""}`}
              />
              {favorites.includes(professional.id)
                ? "Remove from Favorites"
                : "Add to Favorites"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderProfessionalCard = (professional: ProfessionalProfile) => (
    <Card key={professional.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={professional.user?.profile_image_url || ""}
                alt={professional.user?.username || ""}
              />
              <AvatarFallback>{getAvatarFallback(professional)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-white">
                {professional.user?.first_name && professional.user?.last_name
                  ? `${professional.user.first_name} ${professional.user.last_name}`
                  : professional.user?.username || "Professional"}
              </h4>
              <p className="text-xs text-white">
                {professional.is_professional
                  ? "Professional"
                  : "Dance Professional"}
                {professional.is_verified && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFavorite(professional.id)}
            className={`${favorites.includes(professional.id) ? "text-red-500" : "text-white"}`}
          >
            <Heart
              className={`w-4 h-4 ${favorites.includes(professional.id) ? "fill-current" : ""}`}
            />
          </Button>
        </div>

        {/* Dance Styles */}
        {professional.dance_style && professional.dance_style.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {professional.dance_style.slice(0, 3).map((style, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {style}
              </Badge>
            ))}
            {professional.dance_style.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{professional.dance_style.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Location */}
        {professional.location && (
          <div className="flex items-center text-xs text-white mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {professional.location}
          </div>
        )}

        {/* Experience */}
        {professional.years_experience && (
          <div className="flex items-center text-xs text-white mb-2">
            <Award className="w-4 h-4 mr-1" />
            {professional.years_experience} years experience
          </div>
        )}

        {/* Pricing */}
        {professional.pricing && (
          <div className="flex items-center text-xs text-white mb-2">
            <DollarSign className="w-4 h-4 mr-1" />${professional.pricing}/hour
          </div>
        )}

        {/* Services */}
        {professional.services && professional.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {professional.services.slice(0, 2).map((service, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
            {professional.services.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{professional.services.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Bio Preview */}
        {professional.bio && (
          <div className="text-xs text-gray-300 mb-2 line-clamp-2">
            {professional.bio.length > 80
              ? `${professional.bio.substring(0, 80)}...`
              : professional.bio}
          </div>
        )}

        {renderProfessionalModal(professional)}
      </CardContent>
    </Card>
  );

  const renderSection = (
    title: string,
    professionals?: ProfessionalProfile[]
  ) => {
    console.log(`renderSection - ${title}:`, professionals);

    if (!professionals || professionals.length === 0) {
      console.log(`renderSection - ${title}: No professionals to render`);
      return null;
    }

    console.log(
      `renderSection - ${title}: Rendering ${professionals.length} professionals`
    );

    return (
      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professionals.slice(0, 6).map(renderProfessionalCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">
        Professional Recommendations
      </h2>

      {renderSection(
        "Professionals based on your category",
        categoryProfessionals
      )}
      {renderSection("Professionals in your city", cityProfessionals)}
      {renderSection(
        "Professionals based on your dance style",
        danceStyleProfessionals
      )}
      {renderSection("Professionals available on your date", dateProfessionals)}
      {/* {renderSection("Professionals near your location", locationProfessionals)} */}
      {renderSection(
        "Professionals in your budget range",
        pricingProfessionals
      )}
      {renderSection("Professionals in your state", stateProfessionals)}
    </div>
  );
};
