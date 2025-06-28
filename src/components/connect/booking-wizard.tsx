"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarIcon,
  ArrowRight,
  ArrowLeft,
  UserIcon,
  CheckIcon,
  Loader2,
  AlertCircle,
  Star,
  Users,
  Clock,
  Heart,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

// Define service categories
const serviceCategories = [
  { id: "instructor", name: "Dance Instructor", icon: "👨‍🏫" },
  { id: "judge", name: "Dance Judge/Adjudicator", icon: "🏆" },
  { id: "studio", name: "Dance Studio", icon: "🏢" },
  { id: "choreographer", name: "Choreographer", icon: "💃" },
  { id: "other", name: "Other Professional", icon: "👔" },
];

// Define dance styles
const dance_styles = [
  { id: 1, name: "Ballet" },
  { id: 2, name: "Contemporary" },
  { id: 3, name: "Jazz" },
  { id: 4, name: "Hip Hop" },
  { id: 5, name: "Tap" },
  { id: 6, name: "Ballroom" },
  { id: 7, name: "Latin" },
  { id: 8, name: "Swing" },
  { id: 9, name: "Folk" },
  { id: 10, name: "Other" },
];

interface BookingWizardProps {
  mode: "book" | "get-booked";
  onComplete: (data: any) => void;
  user: any | null;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  mode,
  onComplete,
  user,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    service_category: [] as string[],
    dance_style: [] as string[],
    location: "",
    zip_code: "",
    city: "",
    state: "",
    travel_distance: 20,
    date: new Date(),
    session_duration: 60,
    // Professional specific fields
    years_experience: 0,
    services: [] as string[],
    availability: [] as Date[],
    bio: "",
    portfolio: "",
    pricing: 50,
    phone_number: "",
  });

  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Mock toast function - replace with your actual toast implementation
  const toast = (options: {
    title: string;
    description: string;
    variant?: string;
  }) => {
    console.log("Toast:", options);
    // Replace this with your actual toast implementation
  };

  // Mock navigate function - replace with your actual navigation
  const navigate = (path: string) => {
    console.log("Navigate to:", path);
    // Replace this with your actual navigation implementation
  };

  // Function to fetch city and state based on zipcode
  const lookupZipcode = async (zipcode: string) => {
    if (zipcode.length === 5 && /^\d{5}$/.test(zipcode)) {
      console.log(`Looking up zipcode: ${zipcode}`);
      setIsZipLookupLoading(true);
      try {
        // Special case for 30078 that's causing issues
        if (zipcode === "30078") {
          console.log(
            "Using hardcoded data for zipcode 30078 (Snellville, GA)"
          );
          updateFormData("city", "Snellville");
          updateFormData("state", "GA");
          updateFormData("location", "Snellville, GA");
          setIsZipLookupLoading(false);
          return;
        }

        // Use Zippopotam.us API for zipcode lookup
        const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
        console.log(`Zipcode lookup response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`Zipcode lookup response data:`, data);
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            updateFormData("city", place["place name"]);
            updateFormData("state", place["state abbreviation"]);
            updateFormData(
              "location",
              `${place["place name"]}, ${place["state abbreviation"]}`
            );
            console.log(
              `Updated location to: ${place["place name"]}, ${place["state abbreviation"]}`
            );
          } else {
            // No places found for this zipcode
            updateFormData("city", "");
            updateFormData("state", "");
            updateFormData("location", "");
            toast({
              title: "Invalid Zipcode",
              description:
                "No city/state found for this zipcode. Please check and try again.",
              variant: "destructive",
            });
            console.error("No places found for this zipcode");
          }
        } else {
          // API call failed (e.g., 404 for unsupported zipcode)
          updateFormData("city", "");
          updateFormData("state", "");
          updateFormData("location", "");
          toast({
            title: "Zipcode Not Supported",
            description:
              "This zipcode could not be found. Please check and try another.",
            variant: "destructive",
          });
          console.error("Failed to lookup zipcode");
        }
      } catch (error) {
        console.error("Error looking up zipcode:", error);
      } finally {
        setIsZipLookupLoading(false);
      }
    }
  };

  // Transform form data to API format
  const transformFormDataToAPI = (formData: any, mode: string, user: any) => {
    if (mode === "get-booked") {
      // Professional profile payload matching UpdateProfileDto
      return {
        bio: formData.bio,
        phone_number: formData.phone_number,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zip_code: formData.zip_code,
        service_category: formData.service_category,
        dance_style: formData.dance_style,
        location: formData.location,
        zipcode: formData.zipcode,
        travel_distance: formData.travel_distance,
        price_min: formData.price_min,
        price_max: formData.price_max,
        session_duration: formData.session_duration,
        years_experience: formData.years_experience,
        services: formData.services,
        availability: formData.availability,
        portfolio: formData.portfolio,
        pricing: formData.pricing,
        profile_image_url: formData.profile_image_url,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      };
    }
    const basePayload = {
      mode,
      userId: user?.id || user?.user_id || "demo_user",
      serviceCategory: formData.service_category,
      danceStyle: formData.dance_style,
      location: {
        zipcode: formData.zipcode,
        city: formData.city,
        state: formData.state,
        locationString: formData.location,
        travelDistance: formData.travel_distance,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "booking-wizard",
      },
    };
    return {
      ...basePayload,
      timing: {
        preferredDate: formData.date.toISOString(),
      },
      pricing: {
        budgetMin: formData.priceMin,
        budgetMax: formData.priceMax,
        sessionDuration: formData.session_duration,
      },
    };
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && formData.service_category.length === 0) {
      toast({
        title: "Please select a category",
        description:
          "You need to select at least one professional category to proceed.",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2 && !formData.zip_code) {
      toast({
        title: "Location required",
        description: "Please enter a zipcode or location to continue.",
        variant: "destructive",
      });
      return;
    }
    // If we're at step 0 (user creation/authentication) and user is not logged in
    if (currentStep === 0 && !user) {
      navigate("/auth?returnTo=/connect&mode=" + mode);
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = transformFormDataToAPI(formData, mode, user);
      console.log("Submitting payload:", payload);

      let result;
      if (mode === "get-booked") {
        // POST to become professional
        result = await apiRequest(
          "https://api.livetestdomain.com/api/profiles/become-professional",
          {
            method: "POST",
            data: payload,
            requireAuth: true,
          }
        );
      } else {
        // GET professionals search
        const params = new URLSearchParams();
        if (formData.service_category?.length > 0) {
          formData.service_category.forEach((cat: string) => {
            params.append("service_category", cat);
          });
        }
        if (formData.dance_style?.length > 0) {
          formData.dance_style.forEach((style: string) => {
            params.append("dance_style", style);
          });
        }
        if (formData.zip_code) params.append("zip_code", formData.zip_code);
        if (formData.city) params.append("city", formData.city);
        if (formData.state) params.append("state", formData.state);
        if (formData.location) params.append("location", formData.location);
        if (formData.travel_distance)
          params.append("travel_distance", formData.travel_distance.toString());
        if (formData.pricing)
          params.append("pricing", formData.pricing.toString());
        if (formData.session_duration)
          params.append(
            "session_duration",
            formData.session_duration.toString()
          );
        if (formData.availability && formData.availability.length > 0) {
          params.append(
            "availability",
            formData.availability[0] instanceof Date
              ? formData.availability[0].toISOString()
              : formData.availability[0]
          );
        }
        result = await apiRequest(
          `https://api.livetestdomain.com/api/profiles/professionals/search?${params.toString()}`,
          {
            method: "GET",
            requireAuth: true,
          }
        );
      }
      setData(result.results);
      console.log("data:", data);
      setSubmitSuccess(true);

      toast({
        title:
          mode === "book" ? "Booking request submitted!" : "Profile created!",
        description:
          mode === "book"
            ? "We'll connect you with matching professionals soon."
            : "Your professional profile is now live.",
      });

      // Call the original onComplete callback
      onComplete(result);
    } catch (error: any) {
      console.log(error);
      console.error("Error submitting booking:", error);
      setSubmitError(error?.response?.data?.message);

      toast({
        title: "Error",
        description: error?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Format date helper
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Add a function to handle favorite API call
  const handleFavorite = async (profileId: number, isFav: boolean) => {
    try {
      await apiRequest(
        `https://api.livetestdomain.com/api/profiles/${profileId}/book`,
        { method: "POST", requireAuth: true }
      );
      setFavorites((prev) =>
        isFav ? prev.filter((id) => id !== profileId) : [...prev, profileId]
      );
      toast({
        title: isFav ? "Removed from favorites" : "Added to favorites",
        description: isFav
          ? "Profile removed from your favorites."
          : "Profile added to your favorites.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render steps based on current step and mode
  const renderStep = () => {
    // Step 0: Account
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {user ? "Account Connected" : "Create an Account"}
          </h3>

          {user ? (
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-gray-300">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center text-green-400 gap-2">
                <CheckIcon className="h-5 w-5" />
                <span>Your account is connected and ready</span>
              </div>
            </div>
          ) : (
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <p className="mb-4 text-white">
                Please create an account or log in to continue.
              </p>
              <Button
                onClick={() => navigate("/auth?returnTo=/connect&mode=" + mode)}
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
              >
                Create Account / Login
              </Button>
            </div>
          )}

          {mode === "get-booked" && user && (
            <div className="space-y-4 mt-4 pt-4 border-t border-white/20">
              <h4 className="font-medium text-white">Professional Details</h4>

              <div>
                <Label htmlFor="years_experience" className="text-white">
                  Years of Experience
                </Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) =>
                    updateFormData(
                      "years_experience",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="bg-black/40 border-white/20 text-white backdrop-blur-sm"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-white">
                  Professional Bio
                </Label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Tell potential clients about your experience and qualifications..."
                  value={formData.bio}
                  onChange={(e) => updateFormData("bio", e.target.value)}
                  className="w-full rounded-md p-3 bg-black/40 border border-white/20 mt-1 text-white placeholder:text-gray-400 backdrop-blur-sm"
                />
              </div>

              <div>
                <Label htmlFor="portfolio" className="text-white">
                  Portfolio/Website URL (Optional)
                </Label>
                <Input
                  id="portfolio"
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={formData.portfolio}
                  onChange={(e) => updateFormData("portfolio", e.target.value)}
                  className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
                />
              </div>

              <div>
                <Label className="mb-2 block text-white">
                  Services Offered
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Private Lessons",
                    "Group Classes",
                    "Choreography",
                    "Performances",
                    "Workshops",
                    "Online Classes",
                    "Competition Coaching",
                    "Judging Services",
                  ].map((service) => (
                    <div key={service} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`service-${service}`}
                        checked={formData.services.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData("services", [
                              ...formData.services,
                              service,
                            ]);
                          } else {
                            updateFormData(
                              "services",
                              formData.services.filter((s) => s !== service)
                            );
                          }
                        }}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`service-${service}`}
                        className="cursor-pointer text-sm text-white"
                      >
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="phone_number" className="text-white">
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone_number || ""}
                  onChange={(e) =>
                    updateFormData("phone_number", e.target.value)
                  }
                  className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
                />
              </div>
            </div>
          )}
        </div>
      );
    }
    // Step 1: Category
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {mode === "book"
              ? "What type of dance professional are you looking for?"
              : "What type of dance professional are you?"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {serviceCategories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md backdrop-blur-sm ${
                  formData.service_category.includes(category.id)
                    ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25"
                    : "bg-black/40 border-white/20 hover:bg-black/60"
                }`}
                onClick={() => {
                  const updatedCategories = formData.service_category.includes(
                    category.id
                  )
                    ? formData.service_category.filter(
                        (id) => id !== category.id
                      )
                    : [...formData.service_category, category.id];
                  updateFormData("service_category", updatedCategories);
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="text-2xl">{category.icon}</div>
                  <div>
                    <div className="font-medium text-white">
                      {category.name}
                    </div>
                    {formData.service_category.includes(category.id) && (
                      <CheckIcon className="h-4 w-4 text-blue-400 mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4 mt-6">
            <h4 className="font-medium text-white">Select Dance Style(s)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {dance_styles.map((style) => (
                <div
                  key={style.id}
                  className={`px-3 py-2 rounded-md cursor-pointer border text-sm flex items-center justify-between backdrop-blur-sm transition-all ${
                    formData.dance_style.includes(style.id.toString())
                      ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
                      : "border-white/20 bg-black/40 text-white hover:bg-black/60"
                  }`}
                  onClick={() => {
                    const updatedStyles = formData.dance_style.includes(
                      style.id.toString()
                    )
                      ? formData.dance_style.filter(
                          (id) => id !== style.id.toString()
                        )
                      : [...formData.dance_style, style.id.toString()];
                    updateFormData("dance_style", updatedStyles);
                  }}
                >
                  {style.name}
                  {formData.dance_style.includes(style.id.toString()) && (
                    <CheckIcon className="h-3 w-3 text-blue-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Location
    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {mode === "book"
              ? "Where are you looking for dance professionals?"
              : "Where are you located?"}
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="zipcode" className="text-white">
                Zipcode
              </Label>
              <div className="relative">
                <Input
                  id="zipcode"
                  type="text"
                  placeholder="Enter your zipcode"
                  value={formData.zip_code}
                  onChange={(e) => {
                    const zipcode = e.target.value;
                    updateFormData("zip_code", zipcode);

                    if (zipcode.length === 5) {
                      lookupZipcode(zipcode);
                    }
                  }}
                  className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
                  maxLength={5}
                />
                {isZipLookupLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-white">
                City, State (Optional)
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g. Los Angeles, CA"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Date
    if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {mode === "book"
              ? "When would you like to begin?"
              : "Set your availability"}
          </h3>

          <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <Calendar
              mode="single"
              selected={formData.date}
              onSelect={(date) => {
                // Only allow selecting dates up to the originally selected date
                if (!formData.date || !date) {
                  updateFormData("date", date);
                  return;
                }
                // If the new date is after the original selection, do not update
                if (date <= formData.date) {
                  updateFormData("date", date);
                }
              }}
              className="w-full mx-auto text-white"
              // Disable days after the originally selected date
              disabled={formData.date ? [{ after: formData.date }] : []}
              classNames={{
                root: "w-full", // ensure the calendar root takes full width
                months: "flex flex-col sm:flex-row w-full", // months row full width
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-100 text-white", // make arrow white
              }}
            />
            <Input
              type="date"
              className="mx-auto text-white bg-black/40 border-white/20 placeholder:text-gray-400 backdrop-blur-sm"
              value={
                formData.date
                  ? new Date(formData.date).toISOString().split("T")[0]
                  : ""
              }
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                if (date) updateFormData("date", date);
              }}
            />

            {mode === "get-booked" && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <Label className="mb-2 block text-white">
                  Select multiple dates you're available
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.availability.map((date, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 backdrop-blur-sm rounded-full text-sm flex items-center gap-1 text-white border border-blue-400/30"
                    >
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      <button
                        className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                        onClick={() =>
                          updateFormData(
                            "availability",
                            formData.availability.filter((_, i) => i !== index)
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-black/40 border-white/20 text-white hover:bg-black/60"
                  onClick={() => {
                    if (
                      !formData.availability.some(
                        (d) => d.toDateString() === formData.date.toDateString()
                      )
                    ) {
                      updateFormData("availability", [
                        ...formData.availability,
                        formData.date,
                      ]);
                    }
                  }}
                >
                  Add Selected Date to Availability
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center text-center text-sm pt-2 text-gray-300">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {formatDate(formData.date)}
          </div>
        </div>
      );
    }

    // Step 4: Pricing
    if (currentStep === 4) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {mode === "book" ? "What's your budget?" : "Set your pricing"}
          </h3>
          <div className="space-y-4">
            <div className="pt-4">
              <div className="flex justify-between mb-2">
                <Label className="text-white">
                  {mode === "book"
                    ? "Your budget (hourly rate)"
                    : "Your hourly rate"}
                </Label>
                <span className="text-sm text-white">${formData.pricing}</span>
              </div>
              <div className="h-12 pt-4">
                {mode === "get-booked" ? (
                  <Slider
                    min={10}
                    max={300}
                    step={5}
                    value={[formData.pricing]}
                    onValueChange={([value]) =>
                      updateFormData("pricing", value)
                    }
                    className="w-full"
                  />
                ) : (
                  <input
                    type="number"
                    min={10}
                    max={100000}
                    step={5}
                    value={formData.pricing}
                    onChange={(e) => {
                      const value = Math.max(
                        10,
                        Math.min(300, Number(e.target.value))
                      );
                      updateFormData("pricing", value);
                    }}
                    className="w-full py-2 px-3 rounded bg-black/60 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>$10</span>
                <span>$100</span>
                <span>$200</span>
                <span>$300</span>
              </div>
            </div>

            {mode === "book" && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="font-medium mb-3 text-white">
                  Preferred session duration
                </h4>
                <RadioGroup
                  value={formData.session_duration.toString()}
                  onValueChange={(value) =>
                    updateFormData("session_duration", Number.parseInt(value))
                  }
                  className="text-white"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30" id="r1" />
                    <Label htmlFor="r1" className="text-white">
                      30 minutes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="60" id="r2" />
                    <Label htmlFor="r2" className="text-white">
                      1 hour
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="90" id="r3" />
                    <Label htmlFor="r3" className="text-white">
                      1.5 hours
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="120" id="r4" />
                    <Label htmlFor="r4" className="text-white">
                      2 hours
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Step 5: Submit
    if (currentStep === 5) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {submitSuccess ? "Success!" : "Review and Submit"}
          </h3>

          {submitError && (
            <Alert className="border-red-500 bg-red-500/10 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-white">
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          {submitSuccess ? (
            mode === "book" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                {data.map((d: any, idx: number) => {
                  const isFav = favorites.includes(d.id);
                  return (
                    <div
                      key={idx}
                      className="relative bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-white/10 rounded-2xl shadow-xl p-6 flex flex-col items-center group hover:scale-105 transition-transform duration-300"
                    >
                      {/* Favorite Button */}
                      <button
                        className="absolute top-4 right-4 z-10 text-white hover:text-pink-400 transition-colors"
                        onClick={() => {
                          handleFavorite(d?.user?.id, isFav);
                          setFavorites((prev) =>
                            isFav
                              ? prev.filter((id) => id !== d.id)
                              : [...prev, d.id]
                          );
                        }}
                        aria-label={
                          isFav ? "Remove from favorites" : "Add to favorites"
                        }
                      >
                        <Heart
                          className={`h-7 w-7 drop-shadow-lg ${isFav ? "fill-pink-500 text-pink-500" : "fill-none text-white"}`}
                          strokeWidth={2}
                        />
                      </button>
                      {/* Profile Image */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center mb-4 overflow-hidden border-4 border-white/20 shadow-lg">
                        {d.user?.profile_image_url ? (
                          <img
                            src={d.user.profile_image_url}
                            alt={d.user.first_name + " " + d.user.last_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {d.user?.first_name?.[0] || "?"}
                          </span>
                        )}
                      </div>
                      {/* Name & Bio */}
                      <h3 className="text-xl font-semibold text-white text-center mb-1">
                        {d.user?.first_name} {d.user?.last_name}
                      </h3>
                      <p className="text-gray-200 text-center mb-2 line-clamp-3 min-h-[48px] line-clamp-2">
                        {d.bio}
                      </p>
                      {/* Location & Experience */}
                      <div className="flex flex-col items-center mb-2">
                        <span className="text-sm text-blue-200 font-medium">
                          {d.location || `${d.city}, ${d.state}`}
                        </span>
                        <span className="text-xs text-gray-300">
                          {d.years_experience} yrs experience
                        </span>
                      </div>
                      {/* Dance Styles & Categories */}
                      <div className="flex flex-wrap justify-center gap-2 mb-2">
                        {d.dance_style?.map((style: string, i: number) => (
                          <span
                            key={i}
                            className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {style}
                          </span>
                        ))}
                        {d.service_category?.map((cat: string, i: number) => (
                          <span
                            key={"cat-" + i}
                            className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      {/* Pricing */}
                      <div className="flex items-center gap-2 mt-2 mb-1">
                        <span className="text-lg font-bold text-green-400">
                          {d.pricing
                            ? `₦${d.pricing.toLocaleString()}`
                            : "Contact for pricing"}
                        </span>
                        <span className="text-xs text-gray-300">/session</span>
                      </div>
                      {/* Portfolio Link */}
                      {d.portfolio && (
                        <a
                          href={d.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 underline text-xs mt-1 hover:text-blue-400"
                        >
                          View Portfolio
                        </a>
                      )}
                      {/* Services */}
                      {d.services && d.services.length > 0 && (
                        <div className="mt-2 w-full">
                          <div className="text-xs text-gray-400 mb-1">
                            Services:
                          </div>
                          <ul className="flex flex-wrap gap-1 justify-center">
                            {d.services.map((srv: string, i: number) => (
                              <li
                                key={i}
                                className="bg-white/10 text-white px-2 py-0.5 rounded text-xs"
                              >
                                {srv}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-medium text-white">
                  Booking Request Submitted!
                </h4>
                <p className="text-gray-300">
                  We'll connect you with matching professionals soon. You'll
                  receive notifications when professionals respond to your
                  request.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <h4 className="font-medium text-white">
                Review Your Information
              </h4>

              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20 space-y-3">
                <div>
                  <span className="font-medium text-white">Categories: </span>
                  <span className="text-gray-300">
                    {formData.service_category
                      .map(
                        (cat) =>
                          serviceCategories.find((c) => c.id === cat)?.name
                      )
                      .join(", ")}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-white">Dance Styles: </span>
                  <span className="text-gray-300">
                    {formData.dance_style
                      .map(
                        (style) =>
                          dance_styles.find((s) => s.id.toString() === style)
                            ?.name
                      )
                      .join(", ")}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-white">Location: </span>
                  <span className="text-gray-300">
                    {formData.location || `${formData.city}, ${formData.state}`}{" "}
                    ({formData.travel_distance} miles)
                  </span>
                </div>

                <div>
                  <span className="font-medium text-white">Date: </span>
                  <span className="text-gray-300">
                    {formatDate(formData.date)}
                  </span>
                </div>

                {mode === "book" ? (
                  <>
                    <div>
                      <span className="font-medium text-white">Budget: </span>
                      <span className="text-gray-300">
                        ${formData.pricing} per hour
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Session Duration:{" "}
                      </span>
                      <span className="text-gray-300">
                        {formData.session_duration} minutes
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium text-white">
                        Hourly Rate:{" "}
                      </span>
                      <span className="text-gray-300">${formData.pricing}</span>
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Experience:{" "}
                      </span>
                      <span className="text-gray-300">
                        {formData.years_experience} years
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-white">Services: </span>
                      <span className="text-gray-300">
                        {formData.services.join(", ")}
                      </span>
                    </div>
                    {formData.availability.length > 0 && (
                      <div>
                        <span className="font-medium text-white">
                          Availability:{" "}
                        </span>
                        <span className="text-gray-300">
                          {formData.availability[0] instanceof Date
                            ? formData.availability[0].toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : formData.availability[0]}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <p className="text-sm text-gray-300">
                {mode === "book"
                  ? "Your booking request will be sent to matching professionals in your area."
                  : "Your professional profile will be visible to clients looking for your services."}
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-12">
          {/* <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Book Professional
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Get Booked Session
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with top dance professionals or showcase your expertise to
              find new clients
            </p>

            {/* Stats */}
            {/* <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium">1000+ Professionals</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium">4.9 Average Rating</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">24/7 Support</span>
              </div>
            </div> */}
          </div>

          {/* Booking Wizard Container */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8">
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  {[
                    "Account",
                    "Category",
                    "Location",
                    "Date",
                    "Pricing",
                    "Submit",
                  ].map((step, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center ${index > currentStep ? "text-gray-500" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-sm font-medium transition-all ${
                          index < currentStep
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                            : index === currentStep
                              ? "border-2 border-blue-400 text-white bg-blue-400/20 backdrop-blur-sm"
                              : "bg-white/10 text-gray-400 backdrop-blur-sm"
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="text-xs hidden sm:block text-white font-medium">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Step content */}
              <div className="min-h-[500px] mb-8">{renderStep()}</div>

              {/* Navigation buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isSubmitting}
                  className="bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                    disabled={isSubmitting}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  // !submitSuccess && (
                  <Button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === "book"
                          ? "Submitting..."
                          : "Creating Profile..."}
                      </>
                    ) : mode === "book" ? (
                      "Submit Booking Request"
                    ) : (
                      "Create Professional Profile"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
