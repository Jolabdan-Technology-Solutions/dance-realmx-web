"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { CachedAvatar } from "@/components/ui/cached-avatar";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  phone_number?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  location?: string;
  service_category?: string[];
  dance_style?: string[];
  years_experience?: number;
  services?: string[];
  availability?: Array<{
    start_date: string;
    end_date: string;
    time_slots: string[];
  }>;
  portfolio?: string;
  pricing?: number;
  is_professional?: boolean;
  is_verified?: boolean;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await apiRequest(
          `https://api.livetestdomain.com/api/profiles/${user.id}`,
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
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            bio: user.bio || "",
            phone_number: user.phone_number || "",
            city: user.city || "",
            state: user.state || "",
            zip_code: user.zip_code || "",
            location: user.location || "",
            profile_image_url: user.profile_image_url || "",
            is_professional: user.is_professional || false,
            is_verified: user.is_verified || false,
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
              {profile?.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <Award className="h-4 w-4 text-white" />
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
                        {profile?.is_professional ? "Professional" : "User"}
                      </span>
                    </div>
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile?.years_experience && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{profile.years_experience} years experience</span>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/settings")}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
                  {profile?.bio || "No bio available. Add one to your profile!"}
                </p>
              </CardContent>
            </Card>

            {/* Professional Information - Only show if user is a professional */}
            {profile?.is_professional && (
              <>
                {/* Services & Specialties */}
                <Card>
                  <CardHeader>
                    <CardTitle>Services & Specialties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.service_category &&
                      profile.service_category.length > 0 && (
                        <>
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">
                              Professional Categories
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {profile.service_category.map(
                                (category, index) => (
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

                    {profile.dance_style && profile.dance_style.length > 0 && (
                      <>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            Dance Styles
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.dance_style.map((style, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-purple-200 text-purple-700"
                              >
                                {style}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {profile.services && profile.services.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Services Offered
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {profile.services.map((service, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {service}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Availability */}
                {profile.availability && profile.availability.length > 0 && (
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
                            {getAvailabilityPatternName(profile.availability)}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {profile.availability.map((range, index) => (
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
                                {range.time_slots.map((slot, slotIndex) => (
                                  <Badge
                                    key={slotIndex}
                                    variant="outline"
                                    className="text-sm"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
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
            {profile?.is_professional && profile?.pricing && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${profile.pricing.toLocaleString()}
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
                {profile?.phone_number && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{profile?.email}</span>
                </div>
                {profile?.portfolio && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a
                      href={profile.portfolio}
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
      </div>
    </div>
  );
}
