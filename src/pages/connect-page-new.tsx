
"use client"

import { useState } from "react"
import { useLocation } from "wouter"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import {
  CalendarCheck,
  UserPlus,
  ArrowRight,
  Star,
  Users,
  Award,
  CheckCircle,
  TrendingUp,
  Clock,
  DollarSign,
  Globe,
  Shield,
} from "lucide-react"

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState("book")
  const [, navigate] = useLocation()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage:
              "url('/images/styles.png')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-6 sm:pt-8 pb-6 max-w-6xl">
          <div className="text-center mb-6 sm:mb-8">
            <Badge
              variant="secondary"
              className="mb-4 sm:mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs sm:text-sm"
            >
              Professional Dance Platform
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-white leading-tight px-2">
              Connect with Dance
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Professionals
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light px-4">
              The premier platform connecting passionate dancers with world-class instructors
            </p>
          </div>

          {/* Enhanced Tabs - Mobile Responsive */}
          <div className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-6 sm:mb-8 px-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-1 sm:p-2 rounded-xl sm:rounded-2xl w-full max-w-md sm:max-w-lg">
                <div className="flex w-full">
                  <button
                    onClick={() => setActiveTab("book")}
                    className={`flex-1 flex items-center justify-center px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-medium rounded-lg sm:rounded-xl transition-all duration-300 ${
                      activeTab === "book"
                        ? "bg-[#00d4ff] text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Book Professionals</span>
                    <span className="sm:hidden">Book</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("get-booked")}
                    className={`flex-1 flex items-center justify-center px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-medium rounded-lg sm:rounded-xl transition-all duration-300 ${
                      activeTab === "get-booked"
                        ? "bg-[#00d4ff] text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Get Booked</span>
                    <span className="sm:hidden">Get Booked</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Book Professionals Tab */}
            {activeTab === "book" && (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8 lg:p-12">
                  <div className="text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mb-6 sm:mb-8">
                      <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white leading-tight">
                      Find Your Perfect
                      <span className="block text-blue-400">Dance Instructor</span>
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light px-2">
                      Connect with verified dance professionals worldwide. Filter by style, experience, and availability
                      to find the perfect instructor for your journey.
                    </p>
                  </div>

                  {/* Features Grid - Mobile Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-blue-500/10 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Verified Professionals</h3>
                      <p className="text-sm sm:text-base text-gray-300">
                        All instructors are background-checked and certified
                      </p>
                    </div>
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-blue-500/10 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Flexible Scheduling</h3>
                      <p className="text-sm sm:text-base text-gray-300">Book lessons that fit your busy lifestyle</p>
                    </div>
                    <div className="text-center group sm:col-span-2 lg:col-span-1">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-blue-500/10 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Star className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Top Rated</h3>
                      <p className="text-sm sm:text-base text-gray-300">
                        4.9+ average rating from thousands of students
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => navigate("/connect/book")}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl font-semibold rounded-xl sm:rounded-2xl group shadow-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                      size="lg"
                    >
                      <span className="sm:hidden">Start Journey</span>
                      <span className="hidden sm:inline">Start Your Dance Journey</span>
                      <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Get Booked Tab */}
            {activeTab === "get-booked" && (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8 lg:p-12">
                  <div className="text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mb-6 sm:mb-8">
                      <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white leading-tight">
                      Share Your Dance
                      <span className="block text-blue-400">Expertise</span>
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light px-2">
                      Transform your passion into a thriving business. Join our community of elite dance professionals
                      and connect with students worldwide.
                    </p>
                  </div>

                  {/* Benefits Grid - Mobile Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-blue-500/10 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Premium Earnings</h3>
                      <p className="text-sm sm:text-base text-gray-300">
                        Earn $50-200+ per hour teaching what you love
                      </p>
                    </div>
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-blue-500/10 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Global Reach</h3>
                      <p className="text-sm sm:text-base text-gray-300">
                        Teach students from around the world online or in-person
                      </p>
                    </div>
                    <div className="text-center group sm:col-span-2 lg:col-span-1">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-blue-500/10 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Grow Your Brand</h3>
                      <p className="text-sm sm:text-base text-gray-300">
                        Build your reputation and expand your dance business
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => navigate("/connect/get-booked")}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl font-semibold rounded-xl sm:rounded-2xl group shadow-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                      size="lg"
                    >
                      <span className="sm:hidden">Become Pro</span>
                      <span className="hidden sm:inline">Become a Professional</span>
                      <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Enhanced Stats Section - Mobile Responsive */}
        <div className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-sm py-12 sm:py-16 lg:py-20 border-t border-white/10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                Trusted by Thousands
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300">
                Join our growing community of dance enthusiasts
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 text-center">
              <div className="group">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-cyan-500/10 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-2">1,000+</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Active Professionals</h3>
                <p className="text-sm sm:text-base text-gray-300">Verified dance instructors and experts worldwide</p>
              </div>
              <div className="group">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-cyan-500/10 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-2">4.9★</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Average Rating</h3>
                <p className="text-sm sm:text-base text-gray-300">Based on thousands of verified reviews</p>
              </div>
              <div className="group sm:col-span-2 lg:col-span-1">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-cyan-500/10 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-2">50K+</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Successful Bookings</h3>
                <p className="text-sm sm:text-base text-gray-300">Dance lessons completed successfully</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Section - Mobile Responsive */}
        <div className="bg-gradient-to-br from-black/95 to-gray-900/95 py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-white leading-tight">
              Ready to Transform Your
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Dance Journey?
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto px-2">
              Join thousands of dancers and professionals who trust our platform for exceptional dance experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-6 sm:mb-8 px-4">
              <Button
                onClick={() => navigate("/subscription")}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                size="lg"
              >
                Upgrade to Premium
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/connect/book")}
                className="px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white/20 text-white hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                size="lg"
              >
                Start Booking Now
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span>Unlimited booking requests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span>Advanced features</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
