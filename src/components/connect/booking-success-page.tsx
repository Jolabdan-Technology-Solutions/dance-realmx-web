import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Heart,
} from "lucide-react";
import { ProfessionalRecommendations } from "./professional-recommendations";
import { ProfessionalSearchParams } from "@/lib/professional-service";

interface BookingSuccessPageProps {
  bookingData?: any;
  searchFilters?: ProfessionalSearchParams;
  onViewBookings?: () => void;
  onBookAnother?: () => void;
}

export const BookingSuccessPage: React.FC<BookingSuccessPageProps> = ({
  bookingData,
  searchFilters = {},
  onViewBookings,
  onBookAnother,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Booking Request Submitted!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your booking request has been sent to matching professionals. You'll
            receive notifications when they respond to your request.
          </p>
        </div>

        {/* Booking Summary */}
        {bookingData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookingData.service_category && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Service Category
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {bookingData.service_category.map(
                        (cat: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {cat}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {bookingData.dance_style && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Dance Styles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {bookingData.dance_style.map(
                        (style: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {style}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {bookingData.location && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Location</h4>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {bookingData.location}
                    </div>
                  </div>
                )}

                {bookingData.date && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Preferred Date
                    </h4>
                    <p className="text-gray-600">
                      {new Date(bookingData.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {bookingData.session_duration && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Session Duration
                    </h4>
                    <p className="text-gray-600">
                      {bookingData.session_duration} minutes
                    </p>
                  </div>
                )}

                {bookingData.pricing && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Budget</h4>
                    <p className="text-gray-600">${bookingData.pricing}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          {onViewBookings && (
            <Button
              onClick={onViewBookings}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              View My Bookings
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {onBookAnother && (
            <Button
              onClick={onBookAnother}
              size="lg"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Book Another Professional
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* What Happens Next */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Professionals Notified
                </h4>
                <p className="text-gray-600 text-sm">
                  Matching professionals in your area will be notified of your
                  booking request.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-yellow-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Responses Received
                </h4>
                <p className="text-gray-600 text-sm">
                  You'll receive notifications when professionals respond with
                  availability and pricing.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Confirm Booking
                </h4>
                <p className="text-gray-600 text-sm">
                  Choose your preferred professional and confirm the booking
                  details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Recommendations */}
        <div className="mb-8">
          <ProfessionalRecommendations
            initialFilters={searchFilters}
            title="Recommended Professionals"
            showFilters={true}
            maxResults={6}
          />
        </div>

        {/* Additional Services */}
        <Card>
          <CardHeader>
            <CardTitle>Explore More Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
              >
                <Star className="w-6 h-6 mb-2" />
                <span className="text-sm">Browse All Professionals</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
              >
                <Heart className="w-6 h-6 mb-2" />
                <span className="text-sm">View Favorites</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
              >
                <MapPin className="w-6 h-6 mb-2" />
                <span className="text-sm">Find by Location</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
              >
                <Clock className="w-6 h-6 mb-2" />
                <span className="text-sm">Check Availability</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
