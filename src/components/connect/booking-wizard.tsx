"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import { CachedAvatar } from "@/components/ui/cached-avatar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { apiRequest } from "@/lib/queryClient";
import { ProfessionalRecommendations } from "./professional-recommendations";
import {
  ProfessionalSearchParams,
  professionalService,
  ProfessionalSearchResponse,
  ProfessionalProfile,
} from "@/lib/professional-service";
import { ComprehensiveRecommendations } from "./comprehensive-recommendations";

// Custom styles for full-width date picker
const datePickerStyles = `
  .react-datepicker-wrapper {
    width: 100% !important;
  }
  .react-datepicker {
    width: 100% !important;
    font-size: 1rem;
  }
  .react-datepicker__month-container {
    width: 100% !important;
  }
  .react-datepicker__month {
    width: 100% !important;
  }
  .react-datepicker__month .react-datepicker__month-text {
    width: 100% !important;
    text-align: center;
  }
  .react-datepicker__day-names {
    width: 100% !important;
  }
  .react-datepicker__week {
    width: 100% !important;
  }
  .react-datepicker__day {
    width: calc(100% / 7) !important;
    height: 2.5rem !important;
    line-height: 2.5rem !important;
    margin: 0 !important;
  }
  .react-datepicker__header {
    width: 100% !important;
  }
  .react-datepicker__current-month {
    width: 100% !important;
    text-align: center;
  }
  .react-datepicker__navigation {
    top: 1rem;
  }
`;

// Import availability examples - using relative path from web project
const availabilityExamples = {
  // Example 1: Weekly availability for a month
  weeklyAvailability: [
    {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      time_slots: ["09:00-10:00", "10:00-11:00", "14:00-15:00", "15:00-16:00"],
    },
  ],

  // Example 2: Specific date ranges with different time slots
  specificRanges: [
    {
      start_date: "2024-01-15",
      end_date: "2024-01-20",
      time_slots: ["09:00-10:00", "14:00-15:00"],
    },
    {
      start_date: "2024-01-25",
      end_date: "2024-01-30",
      time_slots: ["10:00-11:00", "15:00-16:00", "16:00-17:00"],
    },
  ],

  // Example 3: Weekend availability
  weekendAvailability: [
    {
      start_date: "2024-01-06",
      end_date: "2024-01-07",
      time_slots: ["10:00-11:00", "11:00-12:00", "14:00-15:00"],
    },
    {
      start_date: "2024-01-13",
      end_date: "2024-01-14",
      time_slots: ["10:00-11:00", "11:00-12:00", "14:00-15:00"],
    },
  ],

  // Example 4: Evening availability
  eveningAvailability: [
    {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      time_slots: ["18:00-19:00", "19:00-20:00", "20:00-21:00"],
    },
  ],
};

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

// Helper to get step from URL
const getStepFromUrl = () => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const step = parseInt(params.get("step") || "0", 10);
    return isNaN(step) ? 0 : step;
  }
  return 0;
};

export const BookingWizard: React.FC<BookingWizardProps> = ({
  mode,
  onComplete,
  user,
}) => {
  const [currentStep, setCurrentStep] = useState(getStepFromUrl());
  const [formData, setFormData] = useState({
    service_category: [] as string[],
    dance_style: [] as string[],
    location: "",
    zip_code: "",
    city: "",
    state: "",
    travel_distance: 20,
    // date: new Date(),
    session_duration: 60,
    // Professional specific fields
    years_experience: 0,
    services: [] as string[],
    availability: [] as Date[],
    // Availability with dates and time slots (used for both modes)
    availabilityDates: [] as Array<{ date: Date; timeSlots: string[] }>,
    bio: "",
    portfolio: "",
    pricing: 25,
    phone_number: "",
  });

  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);

  // State for professional recommendations data
  const [professionalData, setProfessionalData] = useState<{
    categoryProfessionals?: ProfessionalProfile[];
    cityProfessionals?: ProfessionalProfile[];
    danceStyleProfessionals?: ProfessionalProfile[];
    dateProfessionals?: ProfessionalProfile[];
    locationProfessionals?: ProfessionalProfile[];
    pricingProfessionals?: ProfessionalProfile[];
    stateProfessionals?: ProfessionalProfile[];
  }>({});

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
    // Map service_category IDs to names
    const serviceCategoryNames = formData.service_category.map(
      (catId: string) => {
        const found = serviceCategories.find((c) => c.id === catId);
        return found ? found.name : catId;
      }
    );
    // Map dance_style IDs to names
    const danceStyleNames = formData.dance_style.map((styleId: string) => {
      const found = dance_styles.find((s) => s.id.toString() === styleId);
      return found ? found.name : styleId;
    });
    // Services are already text values
    const servicesNames = formData.services;

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
        service_category: serviceCategoryNames,
        dance_style: danceStyleNames,
        location: formData.location,
        zipcode: formData.zipcode,
        travel_distance: formData.travel_distance,
        price_min: formData.price_min,
        price_max: formData.price_max,
        session_duration: formData.session_duration,
        years_experience: formData.years_experience,
        services: formData.services,
        availability:
          formData.availabilityDates.length > 0
            ? formData.availabilityDates.map((avail: any) => ({
                start_date: avail.date.toISOString().split("T")[0],
                end_date: avail.date.toISOString().split("T")[0],
                time_slots: avail.timeSlots,
              }))
            : availabilityExamples.weekendAvailability,
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
      serviceCategory: serviceCategoryNames,
      danceStyle: danceStyleNames,
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
      // timing: {
      //   preferredDate: formData.date.toISOString(),
      // },
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
    // Availability step (step 3) is now optional - removed validation
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
          "/api/profiles/become-professional",
          {
            method: "POST",
            data: payload,
            requireAuth: true,
          }
        );
      } else {
        // Use the new professional service for searching
        const searchPayload: ProfessionalSearchParams = {};

        // Map service_category IDs to names (for backend)
        if (formData.service_category?.length > 0) {
          const mappedServiceCategories = formData.service_category.map(
            (catId: string) => {
              const found = serviceCategories.find((c) => c.id === catId);
              return found ? found.name : catId;
            }
          );
          searchPayload.service_category = mappedServiceCategories;
        }
        // Map dance_style IDs to names (for backend)
        if (formData.dance_style?.length > 0) {
          const mappedDanceStyles = formData.dance_style.map(
            (styleId: string) => {
              const found = dance_styles.find(
                (s) => s.id.toString() === styleId.toString()
              );
              return found ? found.name : styleId;
            }
          );
          searchPayload.dance_style = mappedDanceStyles;
        }
        if (formData.zip_code) {
          searchPayload.zip_code = formData.zip_code;
        }
        if (formData.city) {
          searchPayload.city = formData.city;
        }
        if (formData.state) {
          searchPayload.state = formData.state;
        }
        if (formData.location) {
          searchPayload.location = formData.location;
        }
        if (formData.travel_distance) {
          searchPayload.travel_distance = formData.travel_distance;
        }
        if (formData.pricing) {
          searchPayload.pricing = formData.pricing;
        }
        if (formData.session_duration) {
          searchPayload.session_duration = formData.session_duration;
        }

        // Add availability data if dates are selected
        if (
          formData.availabilityDates &&
          formData.availabilityDates.length > 0
        ) {
          // Send availability as a proper array of objects
          searchPayload.availability_data = formData.availabilityDates.map(
            (avail: any) => ({
              date: avail.date.toISOString().split("T")[0],
              time_slots: avail.timeSlots,
            })
          );
        }

        // Log the complete submission data
        console.log("Complete submission data (POST):", searchPayload);

        result = await apiRequest(
          `/api/profiles/professionals/search`,
          {
            method: "POST",
            data: searchPayload,
            requireAuth: true,
          }
        );
      }
      setData(result);
      console.log("data:", data);
      console.log("result.results.length:", result.length);
      console.log("showRecommendations before:", showRecommendations);

      // If no results found, show recommendations
      if (result.length === 0) {
        setShowRecommendations(true);
        setSubmitSuccess(true); // Set success to true even with no results so we can show recommendations
        console.log("No results found, setting showRecommendations to true");
      } else {
        setSubmitSuccess(true);
        console.log("Results found, setting submitSuccess to true");
      }

      // Fetch professional recommendations data
      if (mode === "book") {
        console.log("handleComplete - About to call fetchProfessionalData");
        await fetchProfessionalData();
        console.log("handleComplete - fetchProfessionalData completed");
      }

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
      setSubmitError(error?.message);

      toast({
        title: "Error",
        description: error?.message,
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
      await professionalService.toggleFavorite(profileId);
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

  // Handle professional selection from recommendations
  const handleProfessionalSelect = (professional: any) => {
    setSelectedProfessional(professional);
    // Navigate to professional profile
    navigate(`/professional/${professional.id}`);
  };

  // Function to fetch professional recommendations data
  const fetchProfessionalData = async () => {
    console.log("fetchProfessionalData - Starting to fetch professional data");
    console.log("fetchProfessionalData - formData:", formData);

    try {
      const newProfessionalData: any = {};

      // 1. By Category
      if (formData.service_category?.length > 0) {
        const allResults: any[] = [];
        for (const categoryId of formData.service_category) {
          const found = serviceCategories.find((c) => c.id === categoryId);
          if (found) {
            console.log(
              `fetchProfessionalData - Fetching category: ${found.name}`
            );
            const res = await professionalService.getByCategory(found.name);
            console.log(`fetchProfessionalData - Category response:`, res);
            if (res?.results && Array.isArray(res.results)) {
              allResults.push(...res.results);
            }
          }
        }
        const unique = Array.from(
          new Map(allResults.map((p) => [p.id, p])).values()
        );
        newProfessionalData.categoryProfessionals = unique;
      }

      // 2. By City
      if (formData.city) {
        console.log(`fetchProfessionalData - Fetching city: ${formData.city}`);
        const res = await professionalService.getByCity(formData.city);
        console.log(`fetchProfessionalData - City response:`, res);
        newProfessionalData.cityProfessionals = res?.results || res;
      }

      // 3. By Dance Style
      if (formData.dance_style?.length > 0) {
        const allResults: any[] = [];
        for (const styleId of formData.dance_style) {
          const found = dance_styles.find((s) => s.id.toString() === styleId);
          if (found) {
            console.log(
              `fetchProfessionalData - Fetching dance style: ${found.name}`
            );
            const res = await professionalService.getByDanceStyle(found.name);
            console.log(`fetchProfessionalData - Dance style response:`, res);
            if (res?.results && Array.isArray(res.results)) {
              allResults.push(...res.results);
            }
          }
        }
        const unique = Array.from(
          new Map(allResults.map((p) => [p.id, p])).values()
        );
        newProfessionalData.danceStyleProfessionals = unique;
      }

      // 4. By Date
      if (formData.availabilityDates?.length > 0) {
        const dateStr = formData.availabilityDates[0].date.toISOString();
        console.log(`fetchProfessionalData - Fetching date: ${dateStr}`);
        const res = await professionalService.getByDate(dateStr);
        console.log(`fetchProfessionalData - Date response:`, res);
        newProfessionalData.dateProfessionals = res?.results || res;
      }

      // 5. By Location
      if (formData.location) {
        console.log(
          `fetchProfessionalData - Fetching location: ${formData.location}`
        );
        const res = await professionalService.getByLocation(formData.location);
        console.log(`fetchProfessionalData - Location response:`, res);
        newProfessionalData.locationProfessionals = res?.results || res;
      }

      // 6. By Pricing
      if (formData.pricing) {
        console.log(
          `fetchProfessionalData - Fetching pricing: max ${formData.pricing}`
        );
        const res = await professionalService.getByPricing(
          undefined,
          formData.pricing
        );
        console.log(`fetchProfessionalData - Pricing response:`, res);
        newProfessionalData.pricingProfessionals = res?.results || res;
      }

      // 7. By State
      if (formData.state) {
        console.log(
          `fetchProfessionalData - Fetching state: ${formData.state}`
        );
        const res = await professionalService.getByState(formData.state);
        console.log(`fetchProfessionalData - State response:`, res);
        newProfessionalData.stateProfessionals = res?.results || res;
      }

      console.log("fetchProfessionalData - Final data:", newProfessionalData);
      setProfessionalData(newProfessionalData);
    } catch (error) {
      console.error("Error fetching professional data:", error);
    }
  };

  // Sync currentStep to URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("step", currentStep.toString());
      const newUrl = window.location.pathname + "?" + params.toString();
      window.history.replaceState({}, "", newUrl);
    }
  }, [currentStep]);

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
      const timeSlots = [
        "All Day",
        "9:00 AM - 10:00 AM",
        "10:00 AM - 11:00 AM", 
        "11:00 AM - 12:00 PM",
        "12:00 PM - 1:00 PM",
        "1:00 PM - 2:00 PM",
        "2:00 PM - 3:00 PM",
        "3:00 PM - 4:00 PM",
        "4:00 PM - 5:00 PM",
        "5:00 PM - 6:00 PM",
        "6:00 PM - 7:00 PM",
        "7:00 PM - 8:00 PM",
      ];

      const addAvailabilityDate = (date: Date | null) => {
        if (date) {
          const dateStr = date.toISOString().split("T")[0];
          const exists = formData.availabilityDates.some(
            (avail) => avail.date.toISOString().split("T")[0] === dateStr
          );
          if (!exists) {
            updateFormData("availabilityDates", [
              ...formData.availabilityDates,
              { date, timeSlots: [] },
            ]);
          }
        }
      };

      const removeAvailabilityDate = (dateToRemove: Date) => {
        updateFormData(
          "availabilityDates",
          formData.availabilityDates.filter(
            (avail) =>
              avail.date.toISOString().split("T")[0] !==
              dateToRemove.toISOString().split("T")[0]
          )
        );
      };

      const toggleTimeSlot = (date: Date, slot: string) => {
        updateFormData(
          "availabilityDates",
          formData.availabilityDates.map((avail) => {
            if (
              avail.date.toISOString().split("T")[0] ===
              date.toISOString().split("T")[0]
            ) {
              const newTimeSlots = avail.timeSlots.includes(slot)
                ? avail.timeSlots.filter((s) => s !== slot)
                : [...avail.timeSlots, slot];
              return { ...avail, timeSlots: newTimeSlots };
            }
            return avail;
          })
        );
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-white">
              {mode === "book"
                ? "When would you like to begin?"
                : "Set your availability"}
            </h3>
            <span className="text-sm text-gray-300 bg-gray-500/20 px-2 py-1 rounded">
              Optional
            </span>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              {mode === "book"
                ? "Select your preferred dates and times to help professionals match your schedule. You can skip this step and discuss timing later."
                : "Set your availability to help clients know when you're available. You can skip this step and update it later."}
            </p>
          </div>

          {mode === "get-booked" && (
            <div className="space-y-4">
              <Label className="mb-2 block text-white">
                Select dates you're available
              </Label>

              <div className="w-full mb-4">
                <DatePicker
                  selected={null}
                  onChange={(date: Date | null) => addAvailabilityDate(date)}
                  minDate={new Date()}
                  inline
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  highlightDates={formData.availabilityDates.map(
                    (avail) => avail.date
                  )}
                  className="w-full"
                  calendarClassName="w-full"
                  wrapperClassName="w-full"
                />
              </div>

              {/* Display selected availability dates */}
              {formData.availabilityDates.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Selected Dates:</h4>
                  {formData.availabilityDates.map((avail, index) => (
                    <div
                      key={index}
                      className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-white">
                          {avail.date.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAvailabilityDate(avail.date)}
                          className="bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-gray-300">
                          Select time slots:
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((slot) => (
                            <div
                              key={slot}
                              className={`px-3 py-2 rounded-md cursor-pointer border text-sm flex items-center justify-between backdrop-blur-sm transition-all ${
                                avail.timeSlots.includes(slot)
                                  ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
                                  : "border-white/20 bg-black/40 text-white hover:bg-black/60"
                              }`}
                              onClick={() => toggleTimeSlot(avail.date, slot)}
                            >
                              {slot}
                              {avail.timeSlots.includes(slot) && (
                                <CheckIcon className="h-3 w-3 text-blue-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "book" && (
            <div className="space-y-4">
              <Label className="mb-2 block text-white">
                Select your preferred dates and times
              </Label>

              <div className="w-full mb-4">
                <DatePicker
                  selected={null}
                  onChange={(date: Date | null) => addAvailabilityDate(date)}
                  minDate={new Date()}
                  inline
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  highlightDates={formData.availabilityDates.map(
                    (avail) => avail.date
                  )}
                  className="w-full"
                  calendarClassName="w-full"
                  wrapperClassName="w-full"
                />
              </div>

              {/* Display selected availability dates for booking mode */}
              {formData.availabilityDates.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Selected Dates:</h4>
                  {formData.availabilityDates.map((avail, index) => (
                    <div
                      key={index}
                      className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-white">
                          {avail.date.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAvailabilityDate(avail.date)}
                          className="bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-gray-300">
                          Select time slots:
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((slot) => (
                            <div
                              key={slot}
                              className={`px-3 py-2 rounded-md cursor-pointer border text-sm flex items-center justify-between backdrop-blur-sm transition-all ${
                                avail.timeSlots.includes(slot)
                                  ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
                                  : "border-white/20 bg-black/40 text-white hover:bg-black/60"
                              }`}
                              onClick={() => toggleTimeSlot(avail.date, slot)}
                            >
                              {slot}
                              {avail.timeSlots.includes(slot) && (
                                <CheckIcon className="h-3 w-3 text-blue-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                    max={200}
                    step={5}
                    value={[Number(formData.pricing) || 25]}
                    onValueChange={([value]) =>
                      updateFormData("pricing", value)
                    }
                    className="w-full"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Enter your budget"
                    value={formData.pricing}
                    onChange={(e) => {
                      updateFormData("pricing", e.target.value);
                    }}
                    className="w-full py-2 px-3 rounded bg-black/60 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                  />
                )}
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
      console.log(
        "Step 5 render - submitSuccess:",
        submitSuccess,
        "data.length:",
        data?.length,
        "showRecommendations:",
        showRecommendations
      );
      return (
        <div className="space-y-6 w-full">
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
              data.length > 0 ? (
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
                          <CachedAvatar
                            src={d.user?.profile_image_url}
                            alt={`${d.user?.first_name || ''} ${d.user?.last_name || ''}`.trim()}
                            fallbackText={d.user?.first_name?.[0] || d.user?.last_name?.[0] || "?"}
                            className="w-full h-full object-cover"
                            first_name={d.user?.first_name}
                            last_name={d.user?.last_name}
                            username={d.user?.username}
                          />
                        </div>
                        {/* Name & Bio */}
                        <h3 className="text-xl font-semibold text-white text-center mb-1">
                          {d.user?.first_name} {d.user?.last_name}
                        </h3>
                        <p className="text-gray-200 text-center mb-2 min-h-[48px] line-clamp-2">
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
                              ? `$${d.pricing.toLocaleString()}`
                              : "Contact for pricing"}
                          </span>
                          <span className="text-xs text-gray-300">
                            /session
                          </span>
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
                <>
                  {(() => {
                    console.log(
                      "Rendering ProfessionalRecommendations component"
                    );
                    return null;
                  })()}
                  <ProfessionalRecommendations
                    initialFilters={{
                      // Map service_category IDs to names
                      service_category: formData.service_category.map(
                        (catId: string) => {
                          const found = serviceCategories.find(
                            (c) => c.id === catId
                          );
                          return found ? found.name : catId;
                        }
                      ),
                      // Map dance_style IDs to names
                      dance_style: formData.dance_style.map(
                        (styleId: string) => {
                          const found = dance_styles.find(
                            (s) => s.id.toString() === styleId
                          );
                          return found ? found.name : styleId;
                        }
                      ),
                      // Services are already text value
                      // Location data
                      location: formData.location,
                      city: formData.city,
                      state: formData.state,
                      zip_code: formData.zip_code,
                      travel_distance: formData.travel_distance,
                      // Pricing
                      pricing: formData.pricing,
                      session_duration: formData.session_duration,
                      // Availability data
                      availability_data: formData.availabilityDates.map(
                        (avail: any) => ({
                          date: avail.date.toISOString().split("T")[0],
                          time_slots: avail.timeSlots,
                        })
                      ),
                    }}
                    // onProfessionalSelect={handleProfessionalSelect}
                  />
                </>
              )
            ) : (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-medium text-white">
                  Profile Created!
                </h4>
                <p className="text-gray-300">
                  Your professional profile is now live.
                </p>
                {data && data?.id && (
                  <Button
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                    onClick={() => navigate(`/professional/${data.id}`)}
                  >
                    Go to Profile
                  </Button>
                )}
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
                  <span className="font-medium text-white">Availability: </span>
                  <span className="text-gray-300">
                    {formData.availabilityDates.length > 0
                      ? `${formData.availabilityDates.length} date(s) selected`
                      : "No dates selected"}
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
                    {formData.availabilityDates.length > 0 && (
                      <div>
                        <span className="font-medium text-white">
                          Availability:{" "}
                        </span>
                        <span className="text-gray-300">
                          {formData.availabilityDates.length} date(s) selected
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <p className="text-sm text-gray-300">
                {mode === "book"
                  ? "Your booking request will be sent to matching professionals in your area."
                  : mode === "get-booked"
                    ? "Your professional profile will be visible to clients looking for your services."
                    : "Your request will be processed."}
              </p>
            </div>
          )}

          {submitSuccess && mode === "book" && (
            <>
              <ComprehensiveRecommendations
                bookingData={formData}
                categoryProfessionals={professionalData.categoryProfessionals}
                cityProfessionals={professionalData.cityProfessionals}
                danceStyleProfessionals={
                  professionalData.danceStyleProfessionals
                }
                dateProfessionals={professionalData.dateProfessionals}
                locationProfessionals={professionalData.locationProfessionals}
                pricingProfessionals={professionalData.pricingProfessionals}
                stateProfessionals={professionalData.stateProfessionals}
              />
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen relative">
      {/* Custom DatePicker Styles */}
      <style dangerouslySetInnerHTML={{ __html: datePickerStyles }} />

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
            <div className="min-h-[500px] mb-8 w-full">{renderStep()}</div>

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

              <div className="flex gap-2">
                {/* Skip button for availability step */}
                {currentStep === 3 && (
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-gray-500/20 border-gray-400/30 text-gray-300 hover:bg-gray-500/30 backdrop-blur-sm"
                  >
                    Skip Availability
                  </Button>
                )}

                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                    disabled={isSubmitting}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : !submitSuccess ? (
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
                ) : mode === "book" ? (
                  <Button
                    onClick={() =>
                      navigate(`/connect/book?step=${currentStep}`)
                    }
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                  >
                    Start New Search
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate(`/profile?step=${currentStep}`)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                  >
                    Go to profile
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
