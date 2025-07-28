"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProfessionalProfile {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_image_url?: string;
  };
  bio: string;
  phone_number: string;
  city: string;
  state: string;
  zip_code: string;
  location: string;
  service_category: string[];
  dance_style: string[];
  years_experience: number;
  services: string[];
  availability: Array<{
    start_date: string;
    end_date: string;
    time_slots: string[];
  }>;
  portfolio: string;
  pricing: number;
  is_verified: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export default function ProfessionalProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const result = await apiRequest(
          `/api/profiles/${params.id}`,
          {
            method: "GET",
            requireAuth: true,
          }
        );
        setProfile(result);
      } catch (err: any) {
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  const handleFavorite = async () => {
    try {
      await apiRequest(
        `/api/profiles/${params.id}/book`,
        { method: "POST", requireAuth: true }
      );
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Failed to update favorite:", error);
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "This professional profile could not be loaded."}
          </p>
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
                {profile.user.profile_image_url ? (
                  <img
                    src={profile.user.profile_image_url}
                    alt={`${profile.user.first_name} ${profile.user.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {profile.user.first_name[0]}
                    {profile.user.last_name[0]}
                  </span>
                )}
              </div>
              {profile.is_verified && (
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
                    {profile.user.first_name} {profile.user.last_name}
                  </h1>
                  <div className="flex items-center gap-4 text-blue-100">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {profile.location ||
                          `${profile.city}, ${profile.state}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{profile.years_experience} years experience</span>
                    </div>
                    {profile.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {profile.rating.toFixed(1)} ({profile.review_count}{" "}
                          reviews)
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
                    onClick={handleFavorite}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {isFavorite ? "Favorited" : "Favorite"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Share2 className="h-4 w-4" />
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
                  {profile.bio || "No bio available."}
                </p>
              </CardContent>
            </Card>

            {/* Services & Specialties */}
            <Card>
              <CardHeader>
                <CardTitle>Services & Specialties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Professional Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.service_category.map((category, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

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
              </CardContent>
            </Card>

            {/* Availability */}
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

                  {profile.availability && profile.availability.length > 0 && (
                    <div className="space-y-3">
                      {profile.availability.map((range, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="font-medium text-gray-800 mb-2">
                            {formatDateRange(range.start_date, range.end_date)}
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
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
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

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.phone_number && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{profile.user.email}</span>
                </div>
                {profile.portfolio && (
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
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <div>
                      {profile.location || `${profile.city}, ${profile.state}`}
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

            {/* Profile Details */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since:</span>
                  <span className="font-medium">
                    {formatDate(profile.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last updated:</span>
                  <span className="font-medium">
                    {formatDate(profile.updated_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">
                    {profile.years_experience} years
                  </span>
                </div>
                {profile.is_verified && (
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
