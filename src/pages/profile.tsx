"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  Award,
  Edit,
  Settings,
  User,
  Camera,
  Upload,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  role: string[];
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: number;
    user_id: number;
    bio?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    is_professional?: boolean;
    is_verified?: boolean;
    service_category?: string[];
    dance_style?: string[];
    location?: string;
    travel_distance?: number;
    price_min?: number;
    price_max?: number;
    session_duration?: number;
    years_experience?: number;
    services?: string[];
    availability?: Array<{
      start_date: string;
      end_date: string;
      time_slots: string[];
    }>;
    portfolio?: string;
    pricing?: number;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await apiRequest(
          `https://api.livetestdomain.com/api/me`,
          {
            method: "GET",
            requireAuth: true,
          }
        );
        setProfile(result);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        // If profile not found, use basic user data
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || "",
            username: user.username || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            profile_image_url: user.profile_image_url || "",
            role: user.role || [],
            is_active: user.is_active || false,
            subscription_tier: user.subscription_tier || "FREE",
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString(),
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch bookings when 'my-bookings' tab is active
  useEffect(() => {
    if (activeTab === "my-bookings" && user?.id) {
      setBookingsLoading(true);
      setBookingsError(null);
      apiRequest(
        `https://api.livetestdomain.com/api/bookings?userId=${user.id}`,
        {
          method: "GET",
          requireAuth: true,
        }
      )
        .then((data) => setBookings(data))
        .catch((err) =>
          setBookingsError(err.message || "Failed to fetch bookings")
        )
        .finally(() => setBookingsLoading(false));
    }
  }, [activeTab, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setUploadError(null);

      // Get auth token for the request
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `https://api.livetestdomain.com/api/profiles/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - browser will set it with boundary for multipart/form-data
          },
          body: formData,
          // requireAuth: true,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Upload response:", result);

      // Handle the response structure - check for image URL in the result
      const imageUrl =
        result?.image?.url || result?.profile_image_url || result?.image_url;

      if (imageUrl) {
        setProfile((prev) =>
          prev ? { ...prev, profile_image_url: imageUrl } : null
        );
        toast({
          title: "Profile image updated",
          description: "Your profile image has been updated.",
        });
      } else {
        toast({
          title: "Upload successful",
          description: "Image uploaded but URL not found in response.",
        });
      }
    } catch (err: any) {
      setUploadError("Failed to upload image. Please try again.");
      console.error("Error uploading image:", err);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  const getAvailabilityPatternName = (availability: any[]) => {
    if (!availability || availability.length === 0) return "Not specified";

    // Check if it matches weekend pattern
    const hasWeekend = availability.some((range) => {
      const start = new Date(range.start_date);
      const end = new Date(range.end_date);
      return start.getDay() === 6 || end.getDay() === 0;
    });

    if (hasWeekend) return "Weekend Availability";

    // Check if it matches evening pattern
    const hasEvening = availability.some((range) =>
      range.time_slots?.some(
        (slot: string) =>
          slot.startsWith("18:") ||
          slot.startsWith("19:") ||
          slot.startsWith("20:")
      )
    );

    if (hasEvening) return "Evening Availability";

    // Check if it's weekly pattern
    if (availability.length === 1 && availability[0].time_slots?.length >= 4) {
      return "Weekly Availability";
    }

    return "Custom Availability";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please sign in to view your profile.
          </p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                {profile?.profile_image_url ? (
                  <CachedAvatar
                    src={profile.profile_image_url}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {profile?.first_name?.[0]}
                    {profile?.last_name?.[0]}
                  </span>
                )}
              </div>

              {/* Upload Button */}
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 bg-white text-gray-700 hover:bg-gray-100 rounded-full p-2 h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {profile?.profile?.is_verified && (
                <div className="absolute -bottom-2 -left-2 bg-green-500 rounded-full p-2">
                  <Award className="h-4 w-4 text-white" />
                </div>
              )}

              {uploadError && (
                <div className="absolute -top-12 left-0 right-0 bg-red-500 text-white text-xs p-2 rounded text-center">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <div className="flex items-center gap-4 text-blue-100">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {profile?.profile?.is_professional
                          ? "Professional"
                          : "User"}
                      </span>
                    </div>
                    {profile?.profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.profile.location}</span>
                      </div>
                    )}
                    {profile?.profile?.years_experience && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>
                          {profile.profile.years_experience} years experience
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/profile/edit")}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {profile?.profile?.bio ||
                        "No bio available. Add one to your profile!"}
                    </p>
                  </CardContent>
                </Card>

                {/* Professional Information - Only show if user is a professional */}
                {profile?.profile?.is_professional && (
                  <>
                    {/* Services & Specialties */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Services & Specialties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {profile.profile.service_category &&
                          profile.profile.service_category.length > 0 && (
                            <>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Professional Categories
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {profile.profile.service_category.map(
                                    (category: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-blue-100 text-blue-800"
                                      >
                                        {category}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                              <Separator />
                            </>
                          )}

                        {profile.profile.dance_style &&
                          profile.profile.dance_style.length > 0 && (
                            <>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Dance Styles
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {profile.profile.dance_style.map(
                                    (style: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="border-purple-200 text-purple-700"
                                      >
                                        {style}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                              <Separator />
                            </>
                          )}

                        {profile.profile.services &&
                          profile.profile.services.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">
                                Services Offered
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {profile.profile.services.map(
                                  (service: string, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2 text-sm text-gray-600"
                                    >
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      {service}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>

                    {/* Availability */}
                    {profile.profile.availability &&
                      profile.profile.availability.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Availability
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-green-200 text-green-700"
                                >
                                  {getAvailabilityPatternName(
                                    profile.profile.availability
                                  )}
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                {profile.profile.availability.map(
                                  (range: any, index: number) => (
                                    <div
                                      key={index}
                                      className="bg-gray-50 rounded-lg p-4"
                                    >
                                      <div className="font-medium text-gray-800 mb-2">
                                        {formatDateRange(
                                          range.start_date,
                                          range.end_date
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {range.time_slots.map(
                                          (slot: string, slotIndex: number) => (
                                            <Badge
                                              key={slotIndex}
                                              variant="outline"
                                              className="text-sm"
                                            >
                                              <Clock className="h-3 w-3 mr-1" />
                                              {slot}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Pricing - Only show if user is a professional */}
                {profile?.profile?.is_professional &&
                  profile?.profile?.pricing && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Pricing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            ${profile.profile.pricing.toLocaleString()}
                          </div>
                          <p className="text-gray-600">per session</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile?.profile?.phone_number && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{profile.profile.phone_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{profile?.email}</span>
                    </div>
                    {profile?.profile?.portfolio && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a
                          href={profile.profile.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Portfolio
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Location */}
                {(profile?.location || profile?.city || profile?.state) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <div>
                            {profile.location ||
                              `${profile.city}, ${profile.state}`}
                          </div>
                          {profile.zip_code && (
                            <div className="text-sm text-gray-500">
                              {profile.zip_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Profile Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member since:</span>
                      <span className="font-medium">
                        {formatDate(
                          profile?.created_at || new Date().toISOString()
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last updated:</span>
                      <span className="font-medium">
                        {formatDate(
                          profile?.updated_at || new Date().toISOString()
                        )}
                      </span>
                    </div>
                    {profile?.years_experience && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">
                          {profile.years_experience} years
                        </span>
                      </div>
                    )}
                    {profile?.is_verified && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge
                          variant="outline"
                          className="border-green-200 text-green-700"
                        >
                          Verified Professional
                        </Badge>
                      </div>
                    )}
                    {profile?.is_professional && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Type:</span>
                        <Badge
                          variant="outline"
                          className="border-blue-200 text-blue-700"
                        >
                          Professional
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Bookings Tab Content */}
          <TabsContent value="my-bookings">
            <div className="">
              <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
              {bookingsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">
                    Loading bookings...
                  </span>
                </div>
              ) : bookingsError ? (
                <div className="text-red-500 text-center py-8">
                  {bookingsError}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No bookings found.
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Booking #{booking.id}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex flex-wrap gap-4 items-center">
                          <div>
                            <span className="font-semibold">Session:</span>{" "}
                            {new Date(booking.session_start).toLocaleString()} -{" "}
                            {new Date(booking.session_end).toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span>{" "}
                            <Badge
                              variant={
                                booking.status === "PENDING"
                                  ? "outline"
                                  : "default"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold">
                            Professional/Instructor ID:
                          </span>{" "}
                          {booking.instructor_id}
                        </div>
                        <div>
                          <span className="font-semibold">Booked by:</span>{" "}
                          {booking.user?.first_name} {booking.user?.last_name} (
                          {booking.user?.email})
                        </div>
                        <div className="text-xs text-gray-400">
                          Created:{" "}
                          {new Date(booking.created_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
