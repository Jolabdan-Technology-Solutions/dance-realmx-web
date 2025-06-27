"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
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
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define service categories
const serviceCategories = [
  { id: "instructor", name: "Dance Instructor", icon: "👨‍🏫" },
  { id: "judge", name: "Dance Judge/Adjudicator", icon: "🏆" },
  { id: "studio", name: "Dance Studio", icon: "🏢" },
  { id: "choreographer", name: "Choreographer", icon: "💃" },
  { id: "other", name: "Other Professional", icon: "👔" },
]

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
]

interface BookingWizardProps {
  mode: "book" | "get-booked"
  onComplete: (data: any) => void
  user: any | null
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ mode, onComplete, user }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    serviceCategory: [] as string[],
    danceStyle: [] as string[],
    location: "",
    zipcode: "",
    city: "",
    state: "",
    travelDistance: 20,
    date: new Date(),
    priceMin: 20,
    priceMax: 150,
    sessionDuration: 60,
    // Professional specific fields
    yearsExperience: 0,
    services: [] as string[],
    availability: [] as Date[],
    bio: "",
    portfolio: "",
    pricing: 50,
    // Calendar navigation
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    calendarDisplayDate: new Date(),
  })

  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Mock toast function - replace with your actual toast implementation
  const toast = (options: { title: string; description: string; variant?: string }) => {
    console.log("Toast:", options)
    // Replace this with your actual toast implementation
  }

  // Mock navigate function - replace with your actual navigation
  const navigate = (path: string) => {
    console.log("Navigate to:", path)
    // Replace this with your actual navigation implementation
  }

  // Function to fetch city and state based on zipcode
  const lookupZipcode = async (zipcode: string) => {
    if (zipcode.length === 5 && /^\d{5}$/.test(zipcode)) {
      console.log(`Looking up zipcode: ${zipcode}`)
      setIsZipLookupLoading(true)
      try {
        // Special case for 30078 that's causing issues
        if (zipcode === "30078") {
          console.log("Using hardcoded data for zipcode 30078 (Snellville, GA)")
          updateFormData("city", "Snellville")
          updateFormData("state", "GA")
          updateFormData("location", "Snellville, GA")
          setIsZipLookupLoading(false)
          return
        }

        const response = await fetch(`/api/zipcode-lookup/${zipcode}`)
        console.log(`Zipcode lookup response status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log(`Zipcode lookup response data:`, data)

          updateFormData("city", data.city)
          updateFormData("state", data.state)
          updateFormData("location", `${data.city}, ${data.state}`)

          console.log(`Updated location to: ${data.city}, ${data.state}`)
        } else {
          console.error("Failed to lookup zipcode")
        }
      } catch (error) {
        console.error("Error looking up zipcode:", error)
      } finally {
        setIsZipLookupLoading(false)
      }
    }
  }

  // Transform form data to API format
  const transformFormDataToAPI = (formData: any, mode: string, user: any) => {
    const basePayload = {
      mode,
      userId: user?.id || user?.user_id || "demo_user",
      serviceCategory: formData.serviceCategory,
      danceStyle: formData.danceStyle,
      location: {
        zipcode: formData.zipcode,
        city: formData.city,
        state: formData.state,
        locationString: formData.location,
        travelDistance: formData.travelDistance,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "booking-wizard",
      },
    }

    if (mode === "book") {
      return {
        ...basePayload,
        timing: {
          preferredDate: formData.date.toISOString(),
        },
        pricing: {
          budgetMin: formData.priceMin,
          budgetMax: formData.priceMax,
          sessionDuration: formData.sessionDuration,
        },
      }
    } else {
      return {
        ...basePayload,
        timing: {
          availability: formData.availability.map((date: Date) => date.toISOString()),
        },
        pricing: {
          hourlyRate: formData.pricing,
        },
        professionalProfile: {
          yearsExperience: formData.yearsExperience,
          bio: formData.bio,
          services: formData.services,
          portfolio: formData.portfolio,
        },
      }
    }
  }

  const handleNext = () => {
    // Validate current step
    if (currentStep === 0 && formData.serviceCategory.length === 0) {
      toast({
        title: "Please select a category",
        description: "You need to select at least one professional category to proceed.",
        variant: "destructive",
      })
      return
    }

    if (currentStep === 1 && !formData.zipcode) {
      toast({
        title: "Location required",
        description: "Please enter a zipcode or location to continue.",
        variant: "destructive",
      })
      return
    }

    // If we're at step 2 (user creation/authentication) and user is not logged in
    if (currentStep === 2 && !user) {
      navigate("/auth?returnTo=/connect&mode=" + mode)
      return
    }

    setCurrentStep((prev) => prev + 1)
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = transformFormDataToAPI(formData, mode, user)

      console.log("Submitting payload:", payload)

      const response = await fetch("https://api.livetestdomain.com/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || "demo_token"}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      setSubmitSuccess(true)

      toast({
        title: mode === "book" ? "Booking request submitted!" : "Profile created!",
        description:
          mode === "book"
            ? "We'll connect you with matching professionals soon."
            : "Your professional profile is now live.",
      })

      // Call the original onComplete callback
      onComplete(result)
    } catch (error) {
      console.error("Error submitting booking:", error)
      setSubmitError(error instanceof Error ? error.message : "Failed to submit request. Please try again.")

      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // Format date helper
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Render steps based on current step and mode
  const renderStep = () => {
    // Common steps for both modes
    if (currentStep === 0) {
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
                  formData.serviceCategory.includes(category.id)
                    ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25"
                    : "bg-black/40 border-white/20 hover:bg-black/60"
                }`}
                onClick={() => {
                  const updatedCategories = formData.serviceCategory.includes(category.id)
                    ? formData.serviceCategory.filter((id) => id !== category.id)
                    : [...formData.serviceCategory, category.id]
                  updateFormData("serviceCategory", updatedCategories)
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="text-2xl">{category.icon}</div>
                  <div>
                    <div className="font-medium text-white">{category.name}</div>
                    {formData.serviceCategory.includes(category.id) && (
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
                    formData.danceStyle.includes(style.id.toString())
                      ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
                      : "border-white/20 bg-black/40 text-white hover:bg-black/60"
                  }`}
                  onClick={() => {
                    const updatedStyles = formData.danceStyle.includes(style.id.toString())
                      ? formData.danceStyle.filter((id) => id !== style.id.toString())
                      : [...formData.danceStyle, style.id.toString()]
                    updateFormData("danceStyle", updatedStyles)
                  }}
                >
                  {style.name}
                  {formData.danceStyle.includes(style.id.toString()) && <CheckIcon className="h-3 w-3 text-blue-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {mode === "book" ? "Where are you looking for dance professionals?" : "Where are you located?"}
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
                  value={formData.zipcode}
                  onChange={(e) => {
                    const zipcode = e.target.value
                    updateFormData("zipcode", zipcode)

                    if (zipcode.length === 5) {
                      lookupZipcode(zipcode)
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

          <div className="pt-4">
            <div className="flex justify-between mb-2">
              <Label className="text-white">How far are you willing to travel?</Label>
              <span className="text-sm text-white">{formData.travelDistance} miles</span>
            </div>
            <Slider
              value={[formData.travelDistance]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => updateFormData("travelDistance", value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-gray-300">
              <span>1 mile</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100 miles</span>
            </div>
          </div>
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">{user ? "Account Connected" : "Create an Account"}</h3>

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
              <p className="mb-4 text-white">Please create an account or log in to continue.</p>
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
                <Label htmlFor="yearsExperience" className="text-white">
                  Years of Experience
                </Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  value={formData.yearsExperience}
                  onChange={(e) => updateFormData("yearsExperience", Number.parseInt(e.target.value) || 0)}
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
                <Label className="mb-2 block text-white">Services Offered</Label>
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
                            updateFormData("services", [...formData.services, service])
                          } else {
                            updateFormData(
                              "services",
                              formData.services.filter((s) => s !== service),
                            )
                          }
                        }}
                        className="mt-1"
                      />
                      <Label htmlFor={`service-${service}`} className="cursor-pointer text-sm text-white">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    // Enhanced and centered calendar section for step 3
    if (currentStep === 3) {
      return (
        <div className="space-y-8">
          {/* Header Section - Centered */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-medium text-white">
              {mode === "book" ? "When would you like to begin?" : "Set your availability"}
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              {mode === "book" 
                ? "Select your preferred date to get started with your dance journey"
                : "Choose the dates when you're available to teach and inspire others"
              }
            </p>
          </div>

          {/* Main Calendar Container - Centered */}
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                
                {/* Month/Year Navigation - Centered */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10 p-4">
                  <div className="flex items-center justify-center gap-3">
                    <select
                      value={formData.calendarMonth}
                      onChange={(e) => {
                        const month = parseInt(e.target.value)
                        updateFormData("calendarMonth", month)
                        const newDate = new Date(formData.calendarYear, month, 1)
                        updateFormData("calendarDisplayDate", newDate)
                      }}
                      className="bg-black/60 border border-white/30 text-white rounded-lg px-3 py-2 text-sm backdrop-blur-sm hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer font-medium"
                    >
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map((month, index) => (
                        <option key={index} value={index} className="bg-black text-white">
                          {month}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={formData.calendarYear}
                      onChange={(e) => {
                        const year = parseInt(e.target.value)
                        updateFormData("calendarYear", year)
                        const newDate = new Date(year, formData.calendarMonth, 1)
                        updateFormData("calendarDisplayDate", newDate)
                      }}
                      className="bg-black/60 border border-white/30 text-white rounded-lg px-3 py-2 text-sm backdrop-blur-sm hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer font-medium"
                    >
                      {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year} className="bg-black text-white">
                          {year}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/40 hover:text-white text-xs px-3 py-2 font-medium"
                      onClick={() => {
                        const today = new Date()
                        updateFormData("calendarMonth", today.getMonth())
                        updateFormData("calendarYear", today.getFullYear())
                        updateFormData("calendarDisplayDate", today)
                      }}
                    >
                      Today
                    </Button>
                  </div>
                </div>

                {/* Calendar Section - Perfectly Centered */}
                <div className="p-6">
                  <div className="flex justify-center">
                    <Calendar
                      mode={mode === "get-booked" ? "multiple" : "single"}
                      selected={mode === "get-booked" ? formData.availability : formData.date}
                      month={formData.calendarDisplayDate}
                      onMonthChange={(date) => {
                        updateFormData("calendarDisplayDate", date)
                        updateFormData("calendarMonth", date.getMonth())
                        updateFormData("calendarYear", date.getFullYear())
                      }}
                      onSelect={(date) => {
                        if (mode === "get-booked") {
                          if (Array.isArray(date)) {
                            updateFormData("availability", date)
                          } else if (date) {
                            const currentAvailability = formData.availability || []
                            const dateExists = currentAvailability.some(d => 
                              d.toDateString() === date.toDateString()
                            )
                            if (!dateExists) {
                              updateFormData("availability", [...currentAvailability, date])
                            }
                          }
                        } else {
                          if (date) {
                            updateFormData("date", date)
                          }
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="mx-auto"
                      classNames={{
                        months: "flex justify-center",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center mb-4",
                        caption_label: "text-lg font-bold text-white",
                        nav: "flex items-center justify-between absolute inset-x-0",
                        nav_button: `
                          inline-flex items-center justify-center rounded-full 
                          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
                          focus-visible:ring-blue-400 disabled:pointer-events-none 
                          disabled:opacity-30 border border-white/40 bg-white/10 hover:bg-white/25 
                          hover:border-white/60 h-8 w-8 text-white hover:scale-110
                          shadow-md backdrop-blur-sm
                        `,
                        nav_button_previous: "left-0",
                        nav_button_next: "right-0",
                        table: "w-full border-collapse mt-2",
                        head_row: "flex justify-between mb-2",
                        head_cell: `
                          text-gray-300 w-11 h-8 font-semibold text-xs 
                          flex items-center justify-center uppercase tracking-wider
                        `,
                        row: "flex justify-between mt-1",
                        cell: `
                          relative h-11 w-11 text-center text-sm p-0 
                          focus-within:relative focus-within:z-20
                        `,
                        day: `
                          inline-flex items-center justify-center rounded-lg text-sm font-medium 
                          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
                          focus-visible:ring-blue-400 focus-visible:ring-offset-2 
                          h-11 w-11 p-0 cursor-pointer
                          bg-white/5 border border-white/10 text-white
                          hover:bg-white/15 hover:border-white/30 hover:scale-105
                          disabled:cursor-not-allowed disabled:opacity-30 
                          disabled:hover:scale-100 disabled:hover:bg-white/5
                        `,
                        day_selected: `
                          bg-blue-500 text-white font-bold border-blue-400
                          hover:bg-blue-600 focus:bg-blue-500 
                          shadow-lg shadow-blue-500/50 scale-105 ring-2 ring-blue-400/50
                        `,
                        day_today: `
                          bg-white/20 text-white font-bold border-white/50 
                          shadow-md ring-1 ring-white/40
                        `,
                        day_outside: `
                          text-gray-500 opacity-50 bg-transparent border-transparent
                          hover:text-gray-400 hover:bg-white/5 hover:border-white/10
                        `,
                        day_disabled: `
                          text-gray-600 opacity-20 cursor-not-allowed 
                          bg-transparent border-transparent
                          hover:bg-transparent hover:border-transparent
                        `,
                        day_range_middle: "bg-blue-500/30 text-white",
                        day_hidden: "invisible",
                      }}
                      components={{
                        IconLeft: ({ ...props }) => (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
                            <polyline points="15,18 9,12 15,6"></polyline>
                          </svg>
                        ),
                        IconRight: ({ ...props }) => (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
                            <polyline points="9,18 15,12 9,6"></polyline>
                          </svg>
                        ),
                      }}
                    />
                  </div>
                </div>

                {/* Selected Date Display - Below Calendar for Both Modes */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-t border-white/20 p-6">
                  <div className="text-center">
                    {mode === "book" ? (
                      <div className="inline-flex items-center gap-3 bg-black/40 rounded-xl p-4 border border-white/20">
                        <CalendarIcon className="h-6 w-6 text-blue-400" />
                        <div>
                          <p className="text-sm text-gray-300 font-medium">Selected Date</p>
                          <p className="text-lg font-bold text-white">{formatDate(formData.date)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-3 bg-black/40 rounded-xl p-4 border border-white/20">
                        <CalendarIcon className="h-6 w-6 text-purple-400" />
                        <div>
                          <p className="text-sm text-gray-300 font-medium">Available Dates</p>
                          <p className="text-lg font-bold text-white">
                            {formData.availability?.length || 0} date(s) selected
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Section for Professionals - Centered */}
          {mode === "get-booked" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-white mb-2">Your Available Dates</h4>
                    <p className="text-sm text-gray-300">
                      {formData.availability?.length || 0} date(s) selected
                    </p>
                  </div>

                  <div className="min-h-[8rem] p-6 border-2 border-dashed border-white/20 rounded-xl bg-black/10">
                    {!formData.availability || formData.availability.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-6">
                        <CalendarIcon className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-400 text-base font-medium mb-1">
                          No dates selected yet
                        </p>
                        <p className="text-gray-500 text-sm">
                          Click on dates in the calendar above to add them to your availability
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3 justify-center">
                          {formData.availability
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map((date, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full text-sm text-white border border-blue-400/50 backdrop-blur-sm shadow-lg"
                              >
                                <CalendarIcon className="h-4 w-4" />
                                <span className="font-medium">
                                  {date.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                                  })}
                                </span>
                                <button
                                  className="ml-2 h-5 w-5 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110"
                                  onClick={() => {
                                    const newAvailability = formData.availability.filter((_, i) => i !== index)
                                    updateFormData("availability", newAvailability)
                                  }}
                                  title="Remove this date"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>
                        
                        <div className="flex items-center justify-center pt-4 border-t border-white/10">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-500/20 border-red-400/50 text-red-300 hover:bg-red-500/30 hover:text-white"
                            onClick={() => updateFormData("availability", [])}
                          >
                            Clear All Dates
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions - Centered */}
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30 hover:text-white"
                      onClick={() => {
                        const today = new Date()
                        const nextWeek = []
                        for (let i = 1; i <= 7; i++) {
                          const date = new Date(today)
                          date.setDate(today.getDate() + i)
                          nextWeek.push(date)
                        }
                        const currentAvailability = formData.availability || []
                        const newDates = nextWeek.filter(date => 
                          !currentAvailability.some(existing => 
                            existing.toDateString() === date.toDateString()
                          )
                        )
                        updateFormData("availability", [...currentAvailability, ...newDates])
                      }}
                    >
                      + Next 7 Days
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-purple-500/20 border-purple-400/50 text-red-700 hover:bg-purple-500/30 hover:text-white"
                      onClick={() => {
                        const today = new Date()
                        const weekends = []
                        for (let i = 0; i < 30; i++) {
                          const date = new Date(today)
                          date.setDate(today.getDate() + i)
                          if (date.getDay() === 0 || date.getDay() === 6) {
                            weekends.push(date)
                          }
                        }
                        const currentAvailability = formData.availability || []
                        const newDates = weekends.filter(date => 
                          !currentAvailability.some(existing => 
                            existing.toDateString() === date.toDateString()
                          )
                        )
                        updateFormData("availability", [...currentAvailability, ...newDates])
                      }}
                    >
                      + All Weekends
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips Section - Centered */}
          <div className="max-w-xl mx-auto">
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="h-3 w-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-center flex-1">
                  <h4 className="text-sm font-medium text-blue-300 mb-1">
                    {mode === "book" ? "Booking Tips" : "Availability Tips"}
                  </h4>
                  <p className="text-xs text-blue-200">
                    {mode === "book" 
                      ? "You can change your preferred date later. Professionals in your area will see your request and can suggest alternative dates if needed."
                      : "The more dates you add, the more likely you are to get bookings. You can always update your availability later in your dashboard."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">
            {mode === "book" ? "What's your budget?" : "Set your pricing"}
          </h3>

          {mode === "book" ? (
            <div className="space-y-4">
              <div className="pt-4">
                <div className="flex justify-between mb-2">
                  <Label className="text-white">Hourly rate range</Label>
                  <span className="text-sm text-white">
                    ${formData.priceMin} - ${formData.priceMax}
                  </span>
                </div>
                <div className="h-12 pt-4">
                  <Slider
                    value={[formData.priceMin, formData.priceMax]}
                    min={10}
                    max={300}
                    step={5}
                    onValueChange={(value) => {
                      updateFormData("priceMin", value[0])
                      updateFormData("priceMax", value[1])
                    }}
                    className="py-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-300">
                  <span>$10</span>
                  <span>$100</span>
                  <span>$200</span>
                  <span>$300</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="font-medium mb-3 text-white">Preferred session duration</h4>
                <RadioGroup
                  value={formData.sessionDuration.toString()}
                  onValueChange={(value) => updateFormData("sessionDuration", Number.parseInt(value))}
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
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-white">Your hourly rate</Label>
                  <span className="text-sm text-white">${formData.pricing}</span>
                </div>
                <Slider
                  value={[formData.pricing]}
                  min={10}
                  max={300}
                  step={5}
                  onValueChange={(value) => updateFormData("pricing", value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-300">
                  <span>$10</span>
                  <span>$100</span>
                  <span>$200</span>
                  <span>$300</span>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <h4 className="font-medium mb-3 text-white">Price suggestions based on experience</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Beginner (0-2 years)</span>
                    <span className="text-white">$20-$40</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Intermediate (3-5 years)</span>
                    <span className="text-white">$40-$75</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Advanced (5-10 years)</span>
                    <span className="text-white">$75-$150</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Expert (10+ years)</span>
                    <span className="text-white">$150-$300+</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (currentStep === 5) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-white">{submitSuccess ? "Success!" : "Review and Submit"}</h3>

          {submitError && (
            <Alert className="border-red-500 bg-red-500/10 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-white">{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckIcon className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-medium text-white">
                {mode === "book" ? "Booking Request Submitted!" : "Professional Profile Created!"}
              </h4>
              <p className="text-gray-300">
                {mode === "book"
                  ? "We'll connect you with matching professionals soon. You'll receive notifications when professionals respond to your request."
                  : "Your professional profile is now live! Clients can now find and book your services."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h4 className="font-medium text-white">Review Your Information</h4>

              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20 space-y-3">
                <div>
                  <span className="font-medium text-white">Categories: </span>
                  <span className="text-gray-300">
                    {formData.serviceCategory
                      .map((cat) => serviceCategories.find((c) => c.id === cat)?.name)
                      .join(", ")}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-white">Dance Styles: </span>
                  <span className="text-gray-300">
                    {formData.danceStyle
                      .map((style) => dance_styles.find((s) => s.id.toString() === style)?.name)
                      .join(", ")}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-white">Location: </span>
                  <span className="text-gray-300">
                    {formData.location || `${formData.city}, ${formData.state}`} ({formData.travelDistance} miles)
                  </span>
                </div>

                <div>
                  <span className="font-medium text-white">Date: </span>
                  <span className="text-gray-300">{formatDate(formData.date)}</span>
                </div>

                {mode === "book" ? (
                  <>
                    <div>
                      <span className="font-medium text-white">Budget: </span>
                      <span className="text-gray-300">
                        ${formData.priceMin} - ${formData.priceMax} per hour
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-white">Session Duration: </span>
                      <span className="text-gray-300">{formData.sessionDuration} minutes</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium text-white">Hourly Rate: </span>
                      <span className="text-gray-300">${formData.pricing}</span>
                    </div>
                    <div>
                      <span className="font-medium text-white">Experience: </span>
                      <span className="text-gray-300">{formData.yearsExperience} years</span>
                    </div>
                    <div>
                      <span className="font-medium text-white">Services: </span>
                      <span className="text-gray-300">{formData.services.join(", ")}</span>
                    </div>
                    {formData.availability.length > 0 && (
                      <div>
                        <span className="font-medium text-white">Availability: </span>
                        <span className="text-gray-300">
                          {formData.availability
                            .map((date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
                            .join(", ")}
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
      )
    }

    return null
  }

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
              Connect with top dance professionals or showcase your expertise to find new clients
            </p>
          </div> */}

          {/* Booking Wizard Container */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8">
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  {["Category", "Location", "Account", "Date", "Pricing", "Submit"].map((step, index) => (
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
                        {index < currentStep ? <CheckIcon className="h-4 w-4" /> : index + 1}
                      </div>
                      <span className="text-xs hidden sm:block text-white font-medium">{step}</span>
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
                  !submitSuccess && (
                    <Button
                      onClick={handleComplete}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {mode === "book" ? "Submitting..." : "Creating Profile..."}
                        </>
                      ) : mode === "book" ? (
                        "Submit Booking Request"
                      ) : (
                        "Create Professional Profile"
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingWizard


// "use client"

// import type React from "react"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Slider } from "@/components/ui/slider"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Calendar } from "@/components/ui/calendar"
// import { Card, CardContent } from "@/components/ui/card"
// import { CalendarIcon, ArrowRight, ArrowLeft, UserIcon, CheckIcon, Loader2, AlertCircle } from "lucide-react"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// // Define service categories
// const serviceCategories = [
//   { id: "instructor", name: "Dance Instructor", icon: "👨‍🏫" },
//   { id: "judge", name: "Dance Judge/Adjudicator", icon: "🏆" },
//   { id: "studio", name: "Dance Studio", icon: "🏢" },
//   { id: "choreographer", name: "Choreographer", icon: "💃" },
//   { id: "other", name: "Other Professional", icon: "👔" },
// ]

// // Define dance styles
// const dance_styles = [
//   { id: 1, name: "Ballet" },
//   { id: 2, name: "Contemporary" },
//   { id: 3, name: "Jazz" },
//   { id: 4, name: "Hip Hop" },
//   { id: 5, name: "Tap" },
//   { id: 6, name: "Ballroom" },
//   { id: 7, name: "Latin" },
//   { id: 8, name: "Swing" },
//   { id: 9, name: "Folk" },
//   { id: 10, name: "Other" },
// ]

// interface BookingWizardProps {
//   mode: "book" | "get-booked"
//   onComplete: (data: any) => void
//   user: any | null
// }

// export const BookingWizard: React.FC<BookingWizardProps> = ({ mode, onComplete, user }) => {
//   const [currentStep, setCurrentStep] = useState(0)
//   const [formData, setFormData] = useState({
//     serviceCategory: [] as string[],
//     danceStyle: [] as string[],
//     location: "",
//     zipcode: "",
//     city: "",
//     state: "",
//     travelDistance: 20,
//     date: new Date(),
//     priceMin: 20,
//     priceMax: 150,
//     sessionDuration: 60,
//     // Professional specific fields
//     yearsExperience: 0,
//     services: [] as string[],
//     availability: [] as Date[],
//     bio: "",
//     portfolio: "",
//     pricing: 50,
//   })

//   const [isZipLookupLoading, setIsZipLookupLoading] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [submitError, setSubmitError] = useState<string | null>(null)
//   const [submitSuccess, setSubmitSuccess] = useState(false)

//   // Mock toast function - replace with your actual toast implementation
//   const toast = (options: { title: string; description: string; variant?: string }) => {
//     console.log("Toast:", options)
//     // Replace this with your actual toast implementation
//   }

//   // Mock navigate function - replace with your actual navigation
//   const navigate = (path: string) => {
//     console.log("Navigate to:", path)
//     // Replace this with your actual navigation implementation
//   }

//   // Function to fetch city and state based on zipcode
//   const lookupZipcode = async (zipcode: string) => {
//     if (zipcode.length === 5 && /^\d{5}$/.test(zipcode)) {
//       console.log(`Looking up zipcode: ${zipcode}`)
//       setIsZipLookupLoading(true)
//       try {
//         // Special case for 30078 that's causing issues
//         if (zipcode === "30078") {
//           console.log("Using hardcoded data for zipcode 30078 (Snellville, GA)")
//           updateFormData("city", "Snellville")
//           updateFormData("state", "GA")
//           updateFormData("location", "Snellville, GA")
//           setIsZipLookupLoading(false)
//           return
//         }

//         const response = await fetch(`/api/zipcode-lookup/${zipcode}`)
//         console.log(`Zipcode lookup response status: ${response.status}`)

//         if (response.ok) {
//           const data = await response.json()
//           console.log(`Zipcode lookup response data:`, data)

//           updateFormData("city", data.city)
//           updateFormData("state", data.state)
//           updateFormData("location", `${data.city}, ${data.state}`)

//           console.log(`Updated location to: ${data.city}, ${data.state}`)
//         } else {
//           console.error("Failed to lookup zipcode")
//         }
//       } catch (error) {
//         console.error("Error looking up zipcode:", error)
//       } finally {
//         setIsZipLookupLoading(false)
//       }
//     }
//   }

//   // Transform form data to API format
//   const transformFormDataToAPI = (formData: any, mode: string, user: any) => {
//     const basePayload = {
//       mode,
//       userId: user?.id || user?.user_id || "demo_user",
//       serviceCategory: formData.serviceCategory,
//       danceStyle: formData.danceStyle,
//       location: {
//         zipcode: formData.zipcode,
//         city: formData.city,
//         state: formData.state,
//         locationString: formData.location,
//         travelDistance: formData.travelDistance,
//       },
//       metadata: {
//         timestamp: new Date().toISOString(),
//         source: "booking-wizard",
//       },
//     }

//     if (mode === "book") {
//       return {
//         ...basePayload,
//         timing: {
//           preferredDate: formData.date.toISOString(),
//         },
//         pricing: {
//           budgetMin: formData.priceMin,
//           budgetMax: formData.priceMax,
//           sessionDuration: formData.sessionDuration,
//         },
//       }
//     } else {
//       return {
//         ...basePayload,
//         timing: {
//           availability: formData.availability.map((date: Date) => date.toISOString()),
//         },
//         pricing: {
//           hourlyRate: formData.pricing,
//         },
//         professionalProfile: {
//           yearsExperience: formData.yearsExperience,
//           bio: formData.bio,
//           services: formData.services,
//           portfolio: formData.portfolio,
//         },
//       }
//     }
//   }

//   const handleNext = () => {
//     // Validate current step
//     if (currentStep === 0 && formData.serviceCategory.length === 0) {
//       toast({
//         title: "Please select a category",
//         description: "You need to select at least one professional category to proceed.",
//         variant: "destructive",
//       })
//       return
//     }

//     if (currentStep === 1 && !formData.zipcode) {
//       toast({
//         title: "Location required",
//         description: "Please enter a zipcode or location to continue.",
//         variant: "destructive",
//       })
//       return
//     }

//     // If we're at step 2 (user creation/authentication) and user is not logged in
//     if (currentStep === 2 && !user) {
//       navigate("/auth?returnTo=/connect&mode=" + mode)
//       return
//     }

//     setCurrentStep((prev) => prev + 1)
//   }

//   const handlePrevious = () => {
//     setCurrentStep((prev) => Math.max(0, prev - 1))
//   }

//   const handleComplete = async () => {
//     setIsSubmitting(true)
//     setSubmitError(null)

//     try {
//       const payload = transformFormDataToAPI(formData, mode, user)

//       console.log("Submitting payload:", payload)

//       const response = await fetch("https://api.livetestdomain.com/api/bookings", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${user?.token || "demo_token"}`,
//         },
//         body: JSON.stringify(payload),
//       })

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
//       }

//       const result = await response.json()

//       setSubmitSuccess(true)

//       toast({
//         title: mode === "book" ? "Booking request submitted!" : "Profile created!",
//         description:
//           mode === "book"
//             ? "We'll connect you with matching professionals soon."
//             : "Your professional profile is now live.",
//       })

//       // Call the original onComplete callback
//       onComplete(result)
//     } catch (error) {
//       console.error("Error submitting booking:", error)
//       setSubmitError(error instanceof Error ? error.message : "Failed to submit request. Please try again.")

//       toast({
//         title: "Error",
//         description: "Failed to submit request. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const updateFormData = (key: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [key]: value }))
//   }

//   // Format date helper
//   const formatDate = (date: Date) => {
//     return date.toLocaleDateString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     })
//   }

//   // Render steps based on current step and mode
//   const renderStep = () => {
//     // Common steps for both modes
//     if (currentStep === 0) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book"
//               ? "What type of dance professional are you looking for?"
//               : "What type of dance professional are you?"}
//           </h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {serviceCategories.map((category) => (
//               <Card
//                 key={category.id}
//                 className={`cursor-pointer transition-all hover:shadow-md backdrop-blur-sm ${
//                   formData.serviceCategory.includes(category.id)
//                     ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25"
//                     : "bg-black/40 border-white/20 hover:bg-black/60"
//                 }`}
//                 onClick={() => {
//                   const updatedCategories = formData.serviceCategory.includes(category.id)
//                     ? formData.serviceCategory.filter((id) => id !== category.id)
//                     : [...formData.serviceCategory, category.id]
//                   updateFormData("serviceCategory", updatedCategories)
//                 }}
//               >
//                 <CardContent className="p-4 flex items-center gap-3">
//                   <div className="text-2xl">{category.icon}</div>
//                   <div>
//                     <div className="font-medium text-white">{category.name}</div>
//                     {formData.serviceCategory.includes(category.id) && (
//                       <CheckIcon className="h-4 w-4 text-blue-400 mt-1" />
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           <div className="space-y-4 mt-6">
//             <h4 className="font-medium text-white">Select Dance Style(s)</h4>
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
//               {dance_styles.map((style) => (
//                 <div
//                   key={style.id}
//                   className={`px-3 py-2 rounded-md cursor-pointer border text-sm flex items-center justify-between backdrop-blur-sm transition-all ${
//                     formData.danceStyle.includes(style.id.toString())
//                       ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
//                       : "border-white/20 bg-black/40 text-white hover:bg-black/60"
//                   }`}
//                   onClick={() => {
//                     const updatedStyles = formData.danceStyle.includes(style.id.toString())
//                       ? formData.danceStyle.filter((id) => id !== style.id.toString())
//                       : [...formData.danceStyle, style.id.toString()]
//                     updateFormData("danceStyle", updatedStyles)
//                   }}
//                 >
//                   {style.name}
//                   {formData.danceStyle.includes(style.id.toString()) && <CheckIcon className="h-3 w-3 text-blue-400" />}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )
//     }

//     if (currentStep === 1) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book" ? "Where are you looking for dance professionals?" : "Where are you located?"}
//           </h3>

//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="zipcode" className="text-white">
//                 Zipcode
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="zipcode"
//                   type="text"
//                   placeholder="Enter your zipcode"
//                   value={formData.zipcode}
//                   onChange={(e) => {
//                     const zipcode = e.target.value
//                     updateFormData("zipcode", zipcode)

//                     if (zipcode.length === 5) {
//                       lookupZipcode(zipcode)
//                     }
//                   }}
//                   className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
//                   maxLength={5}
//                 />
//                 {isZipLookupLoading && (
//                   <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                     <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div>
//               <Label htmlFor="location" className="text-white">
//                 City, State (Optional)
//               </Label>
//               <Input
//                 id="location"
//                 type="text"
//                 placeholder="e.g. Los Angeles, CA"
//                 value={formData.location}
//                 onChange={(e) => updateFormData("location", e.target.value)}
//                 className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
//               />
//             </div>
//           </div>

//           <div className="pt-4">
//             <div className="flex justify-between mb-2">
//               <Label className="text-white">How far are you willing to travel?</Label>
//               <span className="text-sm text-white">{formData.travelDistance} miles</span>
//             </div>
//             <Slider
//               value={[formData.travelDistance]}
//               min={1}
//               max={100}
//               step={1}
//               onValueChange={(value) => updateFormData("travelDistance", value[0])}
//               className="py-4"
//             />
//             <div className="flex justify-between text-xs text-gray-300">
//               <span>1 mile</span>
//               <span>25</span>
//               <span>50</span>
//               <span>75</span>
//               <span>100 miles</span>
//             </div>
//           </div>
//         </div>
//       )
//     }

//     if (currentStep === 2) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">{user ? "Account Connected" : "Create an Account"}</h3>

//           {user ? (
//             <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-white/20">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
//                   <UserIcon className="h-6 w-6" />
//                 </div>
//                 <div>
//                   <p className="font-medium text-white">
//                     {user.first_name} {user.last_name}
//                   </p>
//                   <p className="text-sm text-gray-300">{user.email}</p>
//                 </div>
//               </div>
//               <div className="flex items-center text-green-400 gap-2">
//                 <CheckIcon className="h-5 w-5" />
//                 <span>Your account is connected and ready</span>
//               </div>
//             </div>
//           ) : (
//             <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-white/20">
//               <p className="mb-4 text-white">Please create an account or log in to continue.</p>
//               <Button
//                 onClick={() => navigate("/auth?returnTo=/connect&mode=" + mode)}
//                 className="w-full bg-blue-500 text-white hover:bg-blue-600"
//               >
//                 Create Account / Login
//               </Button>
//             </div>
//           )}

//           {mode === "get-booked" && user && (
//             <div className="space-y-4 mt-4 pt-4 border-t border-white/20">
//               <h4 className="font-medium text-white">Professional Details</h4>

//               <div>
//                 <Label htmlFor="yearsExperience" className="text-white">
//                   Years of Experience
//                 </Label>
//                 <Input
//                   id="yearsExperience"
//                   type="number"
//                   min="0"
//                   value={formData.yearsExperience}
//                   onChange={(e) => updateFormData("yearsExperience", Number.parseInt(e.target.value) || 0)}
//                   className="bg-black/40 border-white/20 text-white backdrop-blur-sm"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="bio" className="text-white">
//                   Professional Bio
//                 </Label>
//                 <textarea
//                   id="bio"
//                   rows={4}
//                   placeholder="Tell potential clients about your experience and qualifications..."
//                   value={formData.bio}
//                   onChange={(e) => updateFormData("bio", e.target.value)}
//                   className="w-full rounded-md p-3 bg-black/40 border border-white/20 mt-1 text-white placeholder:text-gray-400 backdrop-blur-sm"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="portfolio" className="text-white">
//                   Portfolio/Website URL (Optional)
//                 </Label>
//                 <Input
//                   id="portfolio"
//                   type="url"
//                   placeholder="https://your-portfolio.com"
//                   value={formData.portfolio}
//                   onChange={(e) => updateFormData("portfolio", e.target.value)}
//                   className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
//                 />
//               </div>

//               <div>
//                 <Label className="mb-2 block text-white">Services Offered</Label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {[
//                     "Private Lessons",
//                     "Group Classes",
//                     "Choreography",
//                     "Performances",
//                     "Workshops",
//                     "Online Classes",
//                     "Competition Coaching",
//                     "Judging Services",
//                   ].map((service) => (
//                     <div key={service} className="flex items-start gap-2">
//                       <input
//                         type="checkbox"
//                         id={`service-${service}`}
//                         checked={formData.services.includes(service)}
//                         onChange={(e) => {
//                           if (e.target.checked) {
//                             updateFormData("services", [...formData.services, service])
//                           } else {
//                             updateFormData(
//                               "services",
//                               formData.services.filter((s) => s !== service),
//                             )
//                           }
//                         }}
//                         className="mt-1"
//                       />
//                       <Label htmlFor={`service-${service}`} className="cursor-pointer text-sm text-white">
//                         {service}
//                       </Label>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )
//     }

//     if (currentStep === 3) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book" ? "When would you like to begin?" : "Set your availability"}
//           </h3>

//           <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
//             {/* Calendar Section */}
//             <div className="p-8">
//               <Calendar
//                 mode="single"
//                 selected={formData.date}
//                 onSelect={(date) => date && updateFormData("date", date)}
//                 disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
//                 fromYear={2024}
//                 toYear={2030}
//                 captionLayout="dropdown-buttons"
//                 className="mx-auto"
//                 classNames={{
//                   months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
//                   month: "space-y-4",
//                   caption: "flex justify-center pt-1 relative items-center mb-6",
//                   caption_label: "text-lg font-medium text-white hidden",
//                   caption_dropdowns: "flex justify-center gap-4",
//                   dropdown_month:
//                     "bg-black/60 border border-white/30 text-white rounded-lg px-4 py-2 text-sm font-medium min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm",
//                   dropdown_year:
//                     "bg-black/60 border border-white/30 text-white rounded-lg px-4 py-2 text-sm font-medium min-w-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm",
//                   nav: "space-x-1 flex items-center",
//                   nav_button:
//                     "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/30 bg-white/10 hover:bg-white/20 hover:text-white h-7 w-7 bg-transparent p-0 text-white hover:opacity-100",
//                   nav_button_previous: "absolute left-1",
//                   nav_button_next: "absolute right-1",
//                   table: "w-full border-collapse space-y-1 mt-4",
//                   head_row: "flex",
//                   head_cell:
//                     "text-gray-300 rounded-md w-10 font-normal text-[0.8rem] text-center uppercase tracking-wide",
//                   row: "flex w-full mt-2",
//                   cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
//                   day: "inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-white/20 hover:text-white h-10 w-10 p-0 font-normal text-white aria-selected:opacity-100",
//                   day_range_end: "day-range-end",
//                   day_selected:
//                     "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white font-semibold shadow-lg shadow-blue-500/30",
//                   day_today: "bg-white/20 text-white font-semibold border border-white/40",
//                   day_outside:
//                     "day-outside text-gray-500 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
//                   day_disabled: "text-gray-500 opacity-50",
//                   day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
//                   day_hidden: "invisible",
//                 }}
//               />
//             </div>

//             {/* Selected Date Display */}
//             <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-t border-white/20 p-6">
//               <div className="text-center">
//                 <div className="inline-flex items-center gap-3 bg-black/40 rounded-lg p-4 border border-white/20">
//                   <CalendarIcon className="h-6 w-6 text-blue-400" />
//                   <div>
//                     <p className="text-sm text-gray-300 font-medium">Selected Date</p>
//                     <p className="text-lg font-bold text-white">{formatDate(formData.date)}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Availability Section for Professionals */}
//             {mode === "get-booked" && (
//               <div className="border-t border-white/20 p-6 bg-black/20">
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <Label className="text-white font-medium text-lg">Available Dates</Label>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30 hover:text-white"
//                       onClick={() => {
//                         if (!formData.availability.some((d) => d.toDateString() === formData.date.toDateString())) {
//                           updateFormData("availability", [...formData.availability, formData.date])
//                         }
//                       }}
//                       disabled={formData.availability.some((d) => d.toDateString() === formData.date.toDateString())}
//                     >
//                       {formData.availability.some((d) => d.toDateString() === formData.date.toDateString())
//                         ? "✓ Added"
//                         : "+ Add Date"}
//                     </Button>
//                   </div>

//                   <div className="min-h-[4rem] p-4 border-2 border-dashed border-white/20 rounded-lg">
//                     {formData.availability.length === 0 ? (
//                       <div className="flex items-center justify-center h-full">
//                         <p className="text-gray-400 text-sm">
//                           No dates selected yet. Choose dates from the calendar above.
//                         </p>
//                       </div>
//                     ) : (
//                       <div className="flex flex-wrap gap-2">
//                         {formData.availability.map((date, index) => (
//                           <div
//                             key={index}
//                             className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/30 rounded-full text-sm text-white border border-blue-400/50"
//                           >
//                             <span className="font-medium">
//                               {date.toLocaleDateString("en-US", {
//                                 month: "short",
//                                 day: "numeric",
//                                 year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
//                               })}
//                             </span>
//                             <button
//                               className="ml-1 h-4 w-4 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center text-xs font-bold transition-colors"
//                               onClick={() =>
//                                 updateFormData(
//                                   "availability",
//                                   formData.availability.filter((_, i) => i !== index),
//                                 )
//                               }
//                             >
//                               ×
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )
//     }

//     if (currentStep === 4) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book" ? "What's your budget?" : "Set your pricing"}
//           </h3>

//           {mode === "book" ? (
//             <div className="space-y-6">
//               {/* Budget Input Fields */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                 <div>
//                   <Label htmlFor="priceMin" className="text-white mb-3 block text-lg font-medium">
//                     Minimum Budget (per hour)
//                   </Label>
//                   <div className="relative">
//                     <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">$</span>
//                     <Input
//                       id="priceMin"
//                       type="number"
//                       min="10"
//                       max="500"
//                       step="5"
//                       value={formData.priceMin}
//                       onChange={(e) => {
//                         const value = Number(e.target.value) || 10
//                         updateFormData("priceMin", value)
//                         // Ensure max is always >= min
//                         if (value > formData.priceMax) {
//                           updateFormData("priceMax", value)
//                         }
//                       }}
//                       className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm pl-10 text-lg h-14 font-medium"
//                       placeholder="20"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <Label htmlFor="priceMax" className="text-white mb-3 block text-lg font-medium">
//                     Maximum Budget (per hour)
//                   </Label>
//                   <div className="relative">
//                     <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">$</span>
//                     <Input
//                       id="priceMax"
//                       type="number"
//                       min={formData.priceMin}
//                       max="500"
//                       step="5"
//                       value={formData.priceMax}
//                       onChange={(e) => {
//                         const value = Number(e.target.value) || 150
//                         // Ensure max is always >= min
//                         updateFormData("priceMax", Math.max(value, formData.priceMin))
//                       }}
//                       className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm pl-10 text-lg h-14 font-medium"
//                       placeholder="150"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Budget Range Display */}
//               <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-white/20">
//                 <div className="text-center">
//                   <p className="text-white font-medium mb-3 text-lg">Your Budget Range</p>
//                   <p className="text-3xl font-bold text-blue-400 mb-2">
//                     ${formData.priceMin} - ${formData.priceMax} per hour
//                   </p>
//                   <p className="text-sm text-gray-300">
//                     Total session cost: ${Math.round(formData.priceMin * (formData.sessionDuration / 60))} - $
//                     {Math.round(formData.priceMax * (formData.sessionDuration / 60))}
//                   </p>
//                 </div>
//               </div>

//               <div className="mt-6 pt-6 border-t border-white/20">
//                 <h4 className="font-medium mb-4 text-white text-lg">Preferred session duration</h4>
//                 <RadioGroup
//                   value={formData.sessionDuration.toString()}
//                   onValueChange={(value) => updateFormData("sessionDuration", Number.parseInt(value))}
//                   className="text-white space-y-3"
//                 >
//                   <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
//                     <RadioGroupItem value="30" id="r1" />
//                     <Label htmlFor="r1" className="text-white text-base">
//                       30 minutes
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
//                     <RadioGroupItem value="60" id="r2" />
//                     <Label htmlFor="r2" className="text-white text-base">
//                       1 hour
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
//                     <RadioGroupItem value="90" id="r3" />
//                     <Label htmlFor="r3" className="text-white text-base">
//                       1.5 hours
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
//                     <RadioGroupItem value="120" id="r4" />
//                     <Label htmlFor="r4" className="text-white text-base">
//                       2 hours
//                     </Label>
//                   </div>
//                 </RadioGroup>
//               </div>
//             </div>
//           ) : (
//             // Professional pricing section remains the same
//             <div className="space-y-6">
//               <div>
//                 <div className="flex justify-between mb-2">
//                   <Label className="text-white">Your hourly rate</Label>
//                   <span className="text-sm text-white">${formData.pricing}</span>
//                 </div>
//                 <Slider
//                   value={[formData.pricing]}
//                   min={10}
//                   max={300}
//                   step={5}
//                   onValueChange={(value) => updateFormData("pricing", value[0])}
//                   className="py-4"
//                 />
//                 <div className="flex justify-between text-xs text-gray-300">
//                   <span>$10</span>
//                   <span>$100</span>
//                   <span>$200</span>
//                   <span>$300</span>
//                 </div>
//               </div>

//               <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20">
//                 <h4 className="font-medium mb-3 text-white">Price suggestions based on experience</h4>
//                 <div className="space-y-3">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Beginner (0-2 years)</span>
//                     <span className="text-white">$20-$40</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Intermediate (3-5 years)</span>
//                     <span className="text-white">$40-$75</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Advanced (5-10 years)</span>
//                     <span className="text-white">$75-$150</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Expert (10+ years)</span>
//                     <span className="text-white">$150-$300+</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )
//     }

//     if (currentStep === 5) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">{submitSuccess ? "Success!" : "Review and Submit"}</h3>

//           {submitError && (
//             <Alert className="border-red-500 bg-red-500/10 backdrop-blur-sm">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription className="text-white">{submitError}</AlertDescription>
//             </Alert>
//           )}

//           {submitSuccess ? (
//             <div className="text-center space-y-4">
//               <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
//                 <CheckIcon className="h-8 w-8 text-white" />
//               </div>
//               <h4 className="text-lg font-medium text-white">
//                 {mode === "book" ? "Booking Request Submitted!" : "Professional Profile Created!"}
//               </h4>
//               <p className="text-gray-300">
//                 {mode === "book"
//                   ? "We'll connect you with matching professionals soon. You'll receive notifications when professionals respond to your request."
//                   : "Your professional profile is now live! Clients can now find and book your services."}
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               <h4 className="font-medium text-white">Review Your Information</h4>

//               <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20 space-y-3">
//                 <div>
//                   <span className="font-medium text-white">Categories: </span>
//                   <span className="text-gray-300">
//                     {formData.serviceCategory
//                       .map((cat) => serviceCategories.find((c) => c.id === cat)?.name)
//                       .join(", ")}
//                   </span>
//                 </div>

//                 <div>
//                   <span className="font-medium text-white">Dance Styles: </span>
//                   <span className="text-gray-300">
//                     {formData.danceStyle
//                       .map((style) => dance_styles.find((s) => s.id.toString() === style)?.name)
//                       .join(", ")}
//                   </span>
//                 </div>

//                 <div>
//                   <span className="font-medium text-white">Location: </span>
//                   <span className="text-gray-300">
//                     {formData.location || `${formData.city}, ${formData.state}`} ({formData.travelDistance} miles)
//                   </span>
//                 </div>

//                 <div>
//                   <span className="font-medium text-white">Date: </span>
//                   <span className="text-gray-300">{formatDate(formData.date)}</span>
//                 </div>

//                 {mode === "book" ? (
//                   <>
//                     <div>
//                       <span className="font-medium text-white">Budget: </span>
//                       <span className="text-gray-300">
//                         ${formData.priceMin} - ${formData.priceMax} per hour
//                       </span>
//                     </div>
//                     <div>
//                       <span className="font-medium text-white">Session Duration: </span>
//                       <span className="text-gray-300">{formData.sessionDuration} minutes</span>
//                     </div>
//                   </>
//                 ) : (
//                   <>
//                     <div>
//                       <span className="font-medium text-white">Hourly Rate: </span>
//                       <span className="text-gray-300">${formData.pricing}</span>
//                     </div>
//                     <div>
//                       <span className="font-medium text-white">Experience: </span>
//                       <span className="text-gray-300">{formData.yearsExperience} years</span>
//                     </div>
//                     <div>
//                       <span className="font-medium text-white">Services: </span>
//                       <span className="text-gray-300">{formData.services.join(", ")}</span>
//                     </div>
//                     {formData.availability.length > 0 && (
//                       <div>
//                         <span className="font-medium text-white">Availability: </span>
//                         <span className="text-gray-300">
//                           {formData.availability
//                             .map((date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
//                             .join(", ")}
//                         </span>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>

//               <p className="text-sm text-gray-300">
//                 {mode === "book"
//                   ? "Your booking request will be sent to matching professionals in your area."
//                   : "Your professional profile will be visible to clients looking for your services."}
//               </p>
//             </div>
//           )}
//         </div>
//       )
//     }

//     return null
//   }

//   return (
//     <div className="min-h-screen relative">
//       {/* Hero Background */}
//       <div
//         className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//         style={{
//           backgroundImage: `url('https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
//         }}
//       >
//         <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80"></div>
//       </div>

//       {/* Hero Section */}
//       <div className="relative z-10">
//         <div className="container mx-auto px-4 py-12">
//           <div className="text-center mb-12">
//             <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
//               Book Professional
//               <br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
//                 Get Booked Session
//               </span>
//             </h1>
//             <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
//               Connect with top dance professionals or showcase your expertise to find new clients
//             </p>

//             {/* Stats */}
//             {/* <div className="flex flex-wrap justify-center gap-8 mb-12">
//               <div className="flex items-center gap-2 text-white">
//                 <Users className="h-5 w-5 text-blue-400" />
//                 <span className="text-sm font-medium">1000+ Professionals</span>
//               </div>
//               <div className="flex items-center gap-2 text-white">
//                 <Star className="h-5 w-5 text-yellow-400" />
//                 <span className="text-sm font-medium">4.9 Average Rating</span>
//               </div>
//               <div className="flex items-center gap-2 text-white">
//                 <Clock className="h-5 w-5 text-green-400" />
//                 <span className="text-sm font-medium">24/7 Support</span>
//               </div>
//             </div> */}
//           </div>

//           {/* Booking Wizard Container */}
//           <div className="max-w-4xl mx-auto">
//             <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8">
//               {/* Progress indicator */}
//               <div className="mb-8">
//                 <div className="flex justify-between items-center">
//                   {["Category", "Location", "Account", "Date", "Pricing", "Submit"].map((step, index) => (
//                     <div
//                       key={index}
//                       className={`flex flex-col items-center ${index > currentStep ? "text-gray-500" : ""}`}
//                     >
//                       <div
//                         className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-sm font-medium transition-all ${
//                           index < currentStep
//                             ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
//                             : index === currentStep
//                               ? "border-2 border-blue-400 text-white bg-blue-400/20 backdrop-blur-sm"
//                               : "bg-white/10 text-gray-400 backdrop-blur-sm"
//                         }`}
//                       >
//                         {index < currentStep ? <CheckIcon className="h-4 w-4" /> : index + 1}
//                       </div>
//                       <span className="text-xs hidden sm:block text-white font-medium">{step}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
//                   <div
//                     className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out shadow-lg"
//                     style={{ width: `${(currentStep / 5) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>

//               {/* Step content */}
//               <div className="min-h-[500px] mb-8">{renderStep()}</div>

//               {/* Navigation buttons */}
//               <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-white/10">
//                 <Button
//                   variant="outline"
//                   onClick={handlePrevious}
//                   disabled={currentStep === 0 || isSubmitting}
//                   className="bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm"
//                 >
//                   <ArrowLeft className="mr-2 h-4 w-4" />
//                   Previous
//                 </Button>

//                 {currentStep < 5 ? (
//                   <Button
//                     onClick={handleNext}
//                     className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
//                     disabled={isSubmitting}
//                   >
//                     Next
//                     <ArrowRight className="ml-2 h-4 w-4" />
//                   </Button>
//                 ) : (
//                   !submitSuccess && (
//                     <Button
//                       onClick={handleComplete}
//                       disabled={isSubmitting}
//                       className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
//                     >
//                       {isSubmitting ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           {mode === "book" ? "Submitting..." : "Creating Profile..."}
//                         </>
//                       ) : mode === "book" ? (
//                         "Submit Booking Request"
//                       ) : (
//                         "Create Professional Profile"
//                       )}
//                     </Button>
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default BookingWizard



// "use client"

// import type React from "react"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Slider } from "@/components/ui/slider"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Calendar } from "@/components/ui/calendar"
// import { Card, CardContent } from "@/components/ui/card"
// import { CalendarIcon, ArrowRight, ArrowLeft, UserIcon, CheckIcon, Loader2, AlertCircle } from "lucide-react"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// // Define service categories
// const serviceCategories = [
//   { id: "instructor", name: "Dance Instructor", icon: "👨‍🏫" },
//   { id: "judge", name: "Dance Judge/Adjudicator", icon: "🏆" },
//   { id: "studio", name: "Dance Studio", icon: "🏢" },
//   { id: "choreographer", name: "Choreographer", icon: "💃" },
//   { id: "other", name: "Other Professional", icon: "👔" },
// ]

// // Define dance styles
// const dance_styles = [
//   { id: 1, name: "Ballet" },
//   { id: 2, name: "Contemporary" },
//   { id: 3, name: "Jazz" },
//   { id: 4, name: "Hip Hop" },
//   { id: 5, name: "Tap" },
//   { id: 6, name: "Ballroom" },
//   { id: 7, name: "Latin" },
//   { id: 8, name: "Swing" },
//   { id: 9, name: "Folk" },
//   { id: 10, name: "Other" },
// ]

// interface BookingWizardProps {
//   mode: "book" | "get-booked"
//   onComplete: (data: any) => void
//   user: any | null
// }

// export const BookingWizard: React.FC<BookingWizardProps> = ({ mode, onComplete, user }) => {
//   const [currentStep, setCurrentStep] = useState(0)
//   const [formData, setFormData] = useState({
//     serviceCategory: [] as string[],
//     danceStyle: [] as string[],
//     location: "",
//     zipcode: "",
//     city: "",
//     state: "",
//     travelDistance: 20,
//     date: new Date(),
//     priceMin: 20,
//     priceMax: 150,
//     sessionDuration: 60,
//     // Professional specific fields
//     yearsExperience: 0,
//     services: [] as string[],
//     availability: [] as Date[],
//     bio: "",
//     portfolio: "",
//     pricing: 50,
//   })

//   const [isZipLookupLoading, setIsZipLookupLoading] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [submitError, setSubmitError] = useState<string | null>(null)
//   const [submitSuccess, setSubmitSuccess] = useState(false)

//   // Mock toast function - replace with your actual toast implementation
//   const toast = (options: { title: string; description: string; variant?: string }) => {
//     console.log("Toast:", options)
//     // Replace this with your actual toast implementation
//   }

//   // Mock navigate function - replace with your actual navigation
//   const navigate = (path: string) => {
//     console.log("Navigate to:", path)
//     // Replace this with your actual navigation implementation
//   }

//   // Function to fetch city and state based on zipcode
//   const lookupZipcode = async (zipcode: string) => {
//     if (zipcode.length === 5 && /^\d{5}$/.test(zipcode)) {
//       console.log(`Looking up zipcode: ${zipcode}`)
//       setIsZipLookupLoading(true)
//       try {
//         // Special case for 30078 that's causing issues
//         if (zipcode === "30078") {
//           console.log("Using hardcoded data for zipcode 30078 (Snellville, GA)")
//           updateFormData("city", "Snellville")
//           updateFormData("state", "GA")
//           updateFormData("location", "Snellville, GA")
//           setIsZipLookupLoading(false)
//           return
//         }

//         const response = await fetch(`/api/zipcode-lookup/${zipcode}`)
//         console.log(`Zipcode lookup response status: ${response.status}`)

//         if (response.ok) {
//           const data = await response.json()
//           console.log(`Zipcode lookup response data:`, data)

//           updateFormData("city", data.city)
//           updateFormData("state", data.state)
//           updateFormData("location", `${data.city}, ${data.state}`)

//           console.log(`Updated location to: ${data.city}, ${data.state}`)
//         } else {
//           console.error("Failed to lookup zipcode")
//         }
//       } catch (error) {
//         console.error("Error looking up zipcode:", error)
//       } finally {
//         setIsZipLookupLoading(false)
//       }
//     }
//   }

//   // Transform form data to API format
//   const transformFormDataToAPI = (formData: any, mode: string, user: any) => {
//     const basePayload = {
//       mode,
//       userId: user?.id || user?.user_id || "demo_user",
//       serviceCategory: formData.serviceCategory,
//       danceStyle: formData.danceStyle,
//       location: {
//         zipcode: formData.zipcode,
//         city: formData.city,
//         state: formData.state,
//         locationString: formData.location,
//         travelDistance: formData.travelDistance,
//       },
//       metadata: {
//         timestamp: new Date().toISOString(),
//         source: "booking-wizard",
//       },
//     }

//     if (mode === "book") {
//       return {
//         ...basePayload,
//         timing: {
//           preferredDate: formData.date.toISOString(),
//         },
//         pricing: {
//           budgetMin: formData.priceMin,
//           budgetMax: formData.priceMax,
//           sessionDuration: formData.sessionDuration,
//         },
//       }
//     } else {
//       return {
//         ...basePayload,
//         timing: {
//           availability: formData.availability.map((date: Date) => date.toISOString()),
//         },
//         pricing: {
//           hourlyRate: formData.pricing,
//         },
//         professionalProfile: {
//           yearsExperience: formData.yearsExperience,
//           bio: formData.bio,
//           services: formData.services,
//           portfolio: formData.portfolio,
//         },
//       }
//     }
//   }

//   const handleNext = () => {
//     // Validate current step
//     if (currentStep === 0 && formData.serviceCategory.length === 0) {
//       toast({
//         title: "Please select a category",
//         description: "You need to select at least one professional category to proceed.",
//         variant: "destructive",
//       })
//       return
//     }

//     if (currentStep === 1 && !formData.zipcode) {
//       toast({
//         title: "Location required",
//         description: "Please enter a zipcode or location to continue.",
//         variant: "destructive",
//       })
//       return
//     }

//     // If we're at step 2 (user creation/authentication) and user is not logged in
//     if (currentStep === 2 && !user) {
//       navigate("/auth?returnTo=/connect&mode=" + mode)
//       return
//     }

//     setCurrentStep((prev) => prev + 1)
//   }

//   const handlePrevious = () => {
//     setCurrentStep((prev) => Math.max(0, prev - 1))
//   }

//   const handleComplete = async () => {
//     setIsSubmitting(true)
//     setSubmitError(null)

//     try {
//       const payload = transformFormDataToAPI(formData, mode, user)

//       console.log("Submitting payload:", payload)

//       const response = await fetch("https://api.livetestdomain.com/api/bookings", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${user?.token || "demo_token"}`,
//         },
//         body: JSON.stringify(payload),
//       })

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
//       }

//       const result = await response.json()

//       setSubmitSuccess(true)

//       toast({
//         title: mode === "book" ? "Booking request submitted!" : "Profile created!",
//         description:
//           mode === "book"
//             ? "We'll connect you with matching professionals soon."
//             : "Your professional profile is now live.",
//       })

//       // Call the original onComplete callback
//       onComplete(result)
//     } catch (error) {
//       console.error("Error submitting booking:", error)
//       setSubmitError(error instanceof Error ? error.message : "Failed to submit request. Please try again.")

//       toast({
//         title: "Error",
//         description: "Failed to submit request. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const updateFormData = (key: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [key]: value }))
//   }

//   // Format date helper
//   const formatDate = (date: Date) => {
//     return date.toLocaleDateString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     })
//   }

//   // Render steps based on current step and mode
//   const renderStep = () => {
//     // Common steps for both modes
//     if (currentStep === 0) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book"
//               ? "What type of dance professional are you looking for?"
//               : "What type of dance professional are you?"}
//           </h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {serviceCategories.map((category) => (
//               <Card
//                 key={category.id}
//                 className={`cursor-pointer transition-all hover:shadow-md backdrop-blur-sm ${
//                   formData.serviceCategory.includes(category.id)
//                     ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25"
//                     : "bg-black/40 border-white/20 hover:bg-black/60"
//                 }`}
//                 onClick={() => {
//                   const updatedCategories = formData.serviceCategory.includes(category.id)
//                     ? formData.serviceCategory.filter((id) => id !== category.id)
//                     : [...formData.serviceCategory, category.id]
//                   updateFormData("serviceCategory", updatedCategories)
//                 }}
//               >
//                 <CardContent className="p-4 flex items-center gap-3">
//                   <div className="text-2xl">{category.icon}</div>
//                   <div>
//                     <div className="font-medium text-white">{category.name}</div>
//                     {formData.serviceCategory.includes(category.id) && (
//                       <CheckIcon className="h-4 w-4 text-blue-400 mt-1" />
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           <div className="space-y-4 mt-6">
//             <h4 className="font-medium text-white">Select Dance Style(s)</h4>
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
//               {dance_styles.map((style) => (
//                 <div
//                   key={style.id}
//                   className={`px-3 py-2 rounded-md cursor-pointer border text-sm flex items-center justify-between backdrop-blur-sm transition-all ${
//                     formData.danceStyle.includes(style.id.toString())
//                       ? "border-blue-400 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25"
//                       : "border-white/20 bg-black/40 text-white hover:bg-black/60"
//                   }`}
//                   onClick={() => {
//                     const updatedStyles = formData.danceStyle.includes(style.id.toString())
//                       ? formData.danceStyle.filter((id) => id !== style.id.toString())
//                       : [...formData.danceStyle, style.id.toString()]
//                     updateFormData("danceStyle", updatedStyles)
//                   }}
//                 >
//                   {style.name}
//                   {formData.danceStyle.includes(style.id.toString()) && <CheckIcon className="h-3 w-3 text-blue-400" />}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )
//     }

//     if (currentStep === 1) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book" ? "Where are you looking for dance professionals?" : "Where are you located?"}
//           </h3>

//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="zipcode" className="text-white">
//                 Zipcode
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="zipcode"
//                   type="text"
//                   placeholder="Enter your zipcode"
//                   value={formData.zipcode}
//                   onChange={(e) => {
//                     const zipcode = e.target.value
//                     updateFormData("zipcode", zipcode)

//                     if (zipcode.length === 5) {
//                       lookupZipcode(zipcode)
//                     }
//                   }}
//                   className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
//                   maxLength={5}
//                 />
//                 {isZipLookupLoading && (
//                   <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                     <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div>
//               <Label htmlFor="location" className="text-white">
//                 City, State (Optional)
//               </Label>
//               <Input
//                 id="location"
//                 type="text"
//                 placeholder="e.g. Los Angeles, CA"
//                 value={formData.location}
//                 onChange={(e) => updateFormData("location", e.target.value)}
//                 className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
//               />
//             </div>
//           </div>

//           <div className="pt-4">
//             <div className="flex justify-between mb-2">
//               <Label className="text-white">How far are you willing to travel?</Label>
//               <span className="text-sm text-white">{formData.travelDistance} miles</span>
//             </div>
//             <Slider
//               value={[formData.travelDistance]}
//               min={1}
//               max={100}
//               step={1}
//               onValueChange={(value) => updateFormData("travelDistance", value[0])}
//               className="py-4"
//             />
//             <div className="flex justify-between text-xs text-gray-300">
//               <span>1 mile</span>
//               <span>25</span>
//               <span>50</span>
//               <span>75</span>
//               <span>100 miles</span>
//             </div>
//           </div>
//         </div>
//       )
//     }

//     if (currentStep === 2) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">{user ? "Account Connected" : "Create an Account"}</h3>

//           {user ? (
//             <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-white/20">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
//                   <UserIcon className="h-6 w-6" />
//                 </div>
//                 <div>
//                   <p className="font-medium text-white">
//                     {user.first_name} {user.last_name}
//                   </p>
//                   <p className="text-sm text-gray-300">{user.email}</p>
//                 </div>
//               </div>
//               <div className="flex items-center text-green-400 gap-2">
//                 <CheckIcon className="h-5 w-5" />
//                 <span>Your account is connected and ready</span>
//               </div>
//             </div>
//           ) : (
//             <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-white/20">
//               <p className="mb-4 text-white">Please create an account or log in to continue.</p>
//               <Button
//                 onClick={() => navigate("/auth?returnTo=/connect&mode=" + mode)}
//                 className="w-full bg-blue-500 text-white hover:bg-blue-600"
//               >
//                 Create Account / Login
//               </Button>
//             </div>
//           )}

//           {mode === "get-booked" && user && (
//             <div className="space-y-4 mt-4 pt-4 border-t border-white/20">
//               <h4 className="font-medium text-white">Professional Details</h4>

//               <div>
//                 <Label htmlFor="yearsExperience" className="text-white">
//                   Years of Experience
//                 </Label>
//                 <Input
//                   id="yearsExperience"
//                   type="number"
//                   min="0"
//                   value={formData.yearsExperience}
//                   onChange={(e) => updateFormData("yearsExperience", Number.parseInt(e.target.value) || 0)}
//                   className="bg-black/40 border-white/20 text-white backdrop-blur-sm"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="bio" className="text-white">
//                   Professional Bio
//                 </Label>
//                 <textarea
//                   id="bio"
//                   rows={4}
//                   placeholder="Tell potential clients about your experience and qualifications..."
//                   value={formData.bio}
//                   onChange={(e) => updateFormData("bio", e.target.value)}
//                   className="w-full rounded-md p-3 bg-black/40 border border-white/20 mt-1 text-white placeholder:text-gray-400 backdrop-blur-sm"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="portfolio" className="text-white">
//                   Portfolio/Website URL (Optional)
//                 </Label>
//                 <Input
//                   id="portfolio"
//                   type="url"
//                   placeholder="https://your-portfolio.com"
//                   value={formData.portfolio}
//                   onChange={(e) => updateFormData("portfolio", e.target.value)}
//                   className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
//                 />
//               </div>

//               <div>
//                 <Label className="mb-2 block text-white">Services Offered</Label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {[
//                     "Private Lessons",
//                     "Group Classes",
//                     "Choreography",
//                     "Performances",
//                     "Workshops",
//                     "Online Classes",
//                     "Competition Coaching",
//                     "Judging Services",
//                   ].map((service) => (
//                     <div key={service} className="flex items-start gap-2">
//                       <input
//                         type="checkbox"
//                         id={`service-${service}`}
//                         checked={formData.services.includes(service)}
//                         onChange={(e) => {
//                           if (e.target.checked) {
//                             updateFormData("services", [...formData.services, service])
//                           } else {
//                             updateFormData(
//                               "services",
//                               formData.services.filter((s) => s !== service),
//                             )
//                           }
//                         }}
//                         className="mt-1"
//                       />
//                       <Label htmlFor={`service-${service}`} className="cursor-pointer text-sm text-white">
//                         {service}
//                       </Label>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )
//     }

//     if (currentStep === 3) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book" ? "When would you like to begin?" : "Set your availability"}
//           </h3>

//           <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
//             <div className="p-6">
//               <div className="flex justify-center">
//                 <Calendar
//                   mode="single"
//                   selected={formData.date}
//                   onSelect={(date) => date && updateFormData("date", date)}
//                   fromYear={2024}
//                   toYear={2026}
//                   captionLayout="dropdown-buttons"
//                   showOutsideDays={false}
//                   className="rounded-md"
//                   classNames={{
//                     months: "flex justify-center",
//                     month: "space-y-4 w-full max-w-sm",
//                     caption: "flex justify-center pt-1 relative items-center mb-6",
//                     caption_label: "text-lg font-semibold text-white hidden",
//                     caption_dropdowns: "flex justify-center gap-3",
//                     dropdown_month:
//                       "bg-black/80 border border-white/30 text-white rounded-lg px-4 py-2 text-sm font-medium min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
//                     dropdown_year:
//                       "bg-black/80 border border-white/30 text-white rounded-lg px-4 py-2 text-sm font-medium min-w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
//                     nav: "space-x-1 flex items-center",
//                     nav_button:
//                       "h-9 w-9 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-colors border border-white/20 hover:border-white/40",
//                     nav_button_previous: "absolute left-1",
//                     nav_button_next: "absolute right-1",
//                     table: "w-full border-collapse mt-4",
//                     head_row: "flex justify-center mb-3",
//                     head_cell:
//                       "text-gray-300 rounded-md w-12 h-10 font-semibold text-sm flex items-center justify-center uppercase tracking-wide",
//                     row: "flex w-full mt-1 justify-center",
//                     cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
//                     day: "h-12 w-12 p-0 font-medium text-white hover:bg-white/20 rounded-lg transition-all duration-200 flex items-center justify-center aria-selected:opacity-100 hover:scale-105",
//                     day_selected:
//                       "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-500 shadow-lg shadow-blue-500/30 scale-105 font-bold",
//                     day_today: "bg-white/20 text-white font-bold border-2 border-white/40 shadow-md",
//                     day_outside: "text-gray-600 opacity-40 hover:opacity-60",
//                     day_disabled: "text-gray-600 opacity-20 cursor-not-allowed hover:bg-transparent hover:scale-100",
//                     day_range_middle: "aria-selected:bg-blue-500/20 aria-selected:text-white",
//                     day_hidden: "invisible",
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Selected Date Display */}
//             <div className="bg-black/60 border-t border-white/20 p-6">
//               <div className="flex items-center justify-center gap-3">
//                 <div className="p-2 bg-blue-500/20 rounded-lg">
//                   <CalendarIcon className="h-5 w-5 text-blue-400" />
//                 </div>
//                 <div className="text-center">
//                   <p className="text-sm text-gray-400 mb-1 font-medium">Selected Date</p>
//                   <p className="text-xl font-bold text-white">{formatDate(formData.date)}</p>
//                 </div>
//               </div>
//             </div>

//             {mode === "get-booked" && (
//               <div className="bg-black/60 border-t border-white/20 p-6">
//                 <Label className="mb-4 block text-white font-semibold text-lg">Available Dates</Label>
//                 <div className="flex flex-wrap gap-3 mb-6 min-h-[3rem]">
//                   {formData.availability.map((date, index) => (
//                     <div
//                       key={index}
//                       className="px-4 py-2 bg-blue-500/30 backdrop-blur-sm rounded-lg text-sm flex items-center gap-3 text-white border border-blue-400/50 shadow-sm hover:bg-blue-500/40 transition-colors"
//                     >
//                       <span className="font-semibold">
//                         {date.toLocaleDateString("en-US", {
//                           month: "short",
//                           day: "numeric",
//                           year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
//                         })}
//                       </span>
//                       <button
//                         className="h-6 w-6 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110"
//                         onClick={() =>
//                           updateFormData(
//                             "availability",
//                             formData.availability.filter((_, i) => i !== index),
//                           )
//                         }
//                       >
//                         ×
//                       </button>
//                     </div>
//                   ))}
//                   {formData.availability.length === 0 && (
//                     <div className="flex items-center justify-center w-full py-6 border-2 border-dashed border-white/20 rounded-lg">
//                       <p className="text-gray-400 text-sm italic">No dates selected yet</p>
//                     </div>
//                   )}
//                 </div>
//                 <Button
//                   variant="outline"
//                   className="bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30 hover:text-white transition-all duration-200 font-semibold"
//                   onClick={() => {
//                     if (!formData.availability.some((d) => d.toDateString() === formData.date.toDateString())) {
//                       updateFormData("availability", [...formData.availability, formData.date])
//                     }
//                   }}
//                   disabled={formData.availability.some((d) => d.toDateString() === formData.date.toDateString())}
//                 >
//                   {formData.availability.some((d) => d.toDateString() === formData.date.toDateString())
//                     ? "✓ Date Already Added"
//                     : "+ Add Selected Date"}
//                 </Button>
//               </div>
//             )}
//           </div>
//         </div>
//       )
//     }

//     if (currentStep === 4) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">
//             {mode === "book" ? "What's your budget?" : "Set your pricing"}
//           </h3>

//           {mode === "book" ? (
//             <div className="space-y-4">
//               {/* Budget Input Fields */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="priceMin" className="text-white mb-2 block">
//                     Minimum Budget (per hour)
//                   </Label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
//                     <Input
//                       id="priceMin"
//                       type="number"
//                       min="10"
//                       max="500"
//                       step="5"
//                       value={formData.priceMin}
//                       onChange={(e) => updateFormData("priceMin", Number(e.target.value) || 10)}
//                       className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm pl-8"
//                       placeholder="20"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <Label htmlFor="priceMax" className="text-white mb-2 block">
//                     Maximum Budget (per hour)
//                   </Label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
//                     <Input
//                       id="priceMax"
//                       type="number"
//                       min="10"
//                       max="500"
//                       step="5"
//                       value={formData.priceMax}
//                       onChange={(e) => updateFormData("priceMax", Number(e.target.value) || 150)}
//                       className="bg-black/40 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm pl-8"
//                       placeholder="150"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Budget Range Display */}
//               <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20">
//                 <div className="text-center">
//                   <p className="text-white font-medium mb-2">Your Budget Range</p>
//                   <p className="text-2xl font-bold text-blue-400">
//                     ${formData.priceMin} - ${formData.priceMax} per hour
//                   </p>
//                   <p className="text-sm text-gray-300 mt-2">
//                     Total session cost: ${formData.priceMin * (formData.sessionDuration / 60)} - $
//                     {formData.priceMax * (formData.sessionDuration / 60)}
//                   </p>
//                 </div>
//               </div>

//               <div className="mt-4 pt-4 border-t border-white/20">
//                 <h4 className="font-medium mb-3 text-white">Preferred session duration</h4>
//                 <RadioGroup
//                   value={formData.sessionDuration.toString()}
//                   onValueChange={(value) => updateFormData("sessionDuration", Number.parseInt(value))}
//                   className="text-white"
//                 >
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="30" id="r1" />
//                     <Label htmlFor="r1" className="text-white">
//                       30 minutes
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="60" id="r2" />
//                     <Label htmlFor="r2" className="text-white">
//                       1 hour
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="90" id="r3" />
//                     <Label htmlFor="r3" className="text-white">
//                       1.5 hours
//                     </Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="120" id="r4" />
//                     <Label htmlFor="r4" className="text-white">
//                       2 hours
//                     </Label>
//                   </div>
//                 </RadioGroup>
//               </div>
//             </div>
//           ) : (
//             // Professional pricing section remains the same
//             <div className="space-y-6">
//               <div>
//                 <div className="flex justify-between mb-2">
//                   <Label className="text-white">Your hourly rate</Label>
//                   <span className="text-sm text-white">${formData.pricing}</span>
//                 </div>
//                 <Slider
//                   value={[formData.pricing]}
//                   min={10}
//                   max={300}
//                   step={5}
//                   onValueChange={(value) => updateFormData("pricing", value[0])}
//                   className="py-4"
//                 />
//                 <div className="flex justify-between text-xs text-gray-300">
//                   <span>$10</span>
//                   <span>$100</span>
//                   <span>$200</span>
//                   <span>$300</span>
//                 </div>
//               </div>

//               <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20">
//                 <h4 className="font-medium mb-3 text-white">Price suggestions based on experience</h4>
//                 <div className="space-y-3">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Beginner (0-2 years)</span>
//                     <span className="text-white">$20-$40</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Intermediate (3-5 years)</span>
//                     <span className="text-white">$40-$75</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Advanced (5-10 years)</span>
//                     <span className="text-white">$75-$150</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Expert (10+ years)</span>
//                     <span className="text-white">$150-$300+</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )
//     }

//     if (currentStep === 5) {
//       return (
//         <div className="space-y-6">
//           <h3 className="text-xl font-medium text-white">{submitSuccess ? "Success!" : "Review and Submit"}</h3>

//           {submitError && (
//             <Alert className="border-red-500 bg-red-500/10 backdrop-blur-sm">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription className="text-white">{submitError}</AlertDescription>
//             </Alert>
//           )}

//           {submitSuccess ? (
//             <div className="text-center space-y-4">
//               <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
//                 <CheckIcon className="h-8 w-8 text-white" />
//               </div>
//               <h4 className="text-lg font-medium text-white">
//                 {mode === "book" ? "Booking Request Submitted!" : "Professional Profile Created!"}
//               </h4>
//               <p className="text-gray-300">
//                 {mode === "book"
//                   ? "We'll connect you with matching professionals soon. You'll receive notifications when professionals respond to your request."
//                   : "Your professional profile is now live! Clients can now find and book your services."}
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               <h4 className="font-medium text-white">Review Your Information</h4>

//               <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20 space-y-3">
//                 <div>
//                   <span className="font-medium text-white">Categories: </span>
//                   <span className="text-gray-300">
//                     {formData.serviceCategory
//                       .map((cat) => serviceCategories.find((c) => c.id === cat)?.name)
//                       .join(", ")}
//                   </span>
//                 </div>

//                 <div>
//                   <span className="font-medium text-white">Dance Styles: </span>
//                   <span className="text-gray-300">
//                     {formData.danceStyle
//                       .map((style) => dance_styles.find((s) => s.id.toString() === style)?.name)
//                       .join(", ")}
//                   </span>
//                 </div>

//                 <div>
//                   <span className="font-medium text-white">Location: </span>
//                   <span className="text-gray-300">
//                     {formData.location || `${formData.city}, ${formData.state}`} ({formData.travelDistance} miles)
//                   </span>
//                 </div>

//                 <div>
//                   <span className="font-medium text-white">Date: </span>
//                   <span className="text-gray-300">{formatDate(formData.date)}</span>
//                 </div>

//                 {mode === "book" ? (
//                   <>
//                     <div>
//                       <span className="font-medium text-white">Budget: </span>
//                       <span className="text-gray-300">
//                         ${formData.priceMin} - ${formData.priceMax} per hour
//                       </span>
//                     </div>
//                     <div>
//                       <span className="font-medium text-white">Session Duration: </span>
//                       <span className="text-gray-300">{formData.sessionDuration} minutes</span>
//                     </div>
//                   </>
//                 ) : (
//                   <>
//                     <div>
//                       <span className="font-medium text-white">Hourly Rate: </span>
//                       <span className="text-gray-300">${formData.pricing}</span>
//                     </div>
//                     <div>
//                       <span className="font-medium text-white">Experience: </span>
//                       <span className="text-gray-300">{formData.yearsExperience} years</span>
//                     </div>
//                     <div>
//                       <span className="font-medium text-white">Services: </span>
//                       <span className="text-gray-300">{formData.services.join(", ")}</span>
//                     </div>
//                     {formData.availability.length > 0 && (
//                       <div>
//                         <span className="font-medium text-white">Availability: </span>
//                         <span className="text-gray-300">
//                           {formData.availability
//                             .map((date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
//                             .join(", ")}
//                         </span>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>

//               <p className="text-sm text-gray-300">
//                 {mode === "book"
//                   ? "Your booking request will be sent to matching professionals in your area."
//                   : "Your professional profile will be visible to clients looking for your services."}
//               </p>
//             </div>
//           )}
//         </div>
//       )
//     }

//     return null
//   }

//   return (
//     <div className="min-h-screen relative">
//       {/* Hero Background */}
//       <div
//         className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//         style={{
//           backgroundImage: `url('https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
//         }}
//       >
//         <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80"></div>
//       </div>

//       {/* Hero Section */}
//       <div className="relative z-10">
//         <div className="container mx-auto px-4 py-12">
//           <div className="text-center mb-12">
//             <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
//               {mode === "book" ? "Book Professional" : "Get Booked"}
//               <br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
//                 {mode === "book" ? "Dance Session" : "Professional Profile"}
//               </span>
//             </h1>
//             <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
//               {mode === "book"
//                 ? "Connect with top dance professionals in your area"
//                 : "Showcase your expertise and find new clients"}
//             </p>
//           </div>

//           {/* Booking Wizard Container */}
//           <div className="max-w-4xl mx-auto">
//             <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8">
//               {/* Progress indicator */}
//               <div className="mb-8">
//                 <div className="flex justify-between items-center">
//                   {["Category", "Location", "Account", "Date", "Pricing", "Submit"].map((step, index) => (
//                     <div
//                       key={index}
//                       className={`flex flex-col items-center ${index > currentStep ? "text-gray-500" : ""}`}
//                     >
//                       <div
//                         className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-sm font-medium transition-all ${
//                           index < currentStep
//                             ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
//                             : index === currentStep
//                               ? "border-2 border-blue-400 text-white bg-blue-400/20 backdrop-blur-sm"
//                               : "bg-white/10 text-gray-400 backdrop-blur-sm"
//                         }`}
//                       >
//                         {index < currentStep ? <CheckIcon className="h-4 w-4" /> : index + 1}
//                       </div>
//                       <span className="text-xs hidden sm:block text-white font-medium">{step}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
//                   <div
//                     className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out shadow-lg"
//                     style={{ width: `${(currentStep / 5) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>

//               {/* Step content */}
//               <div className="min-h-[500px] mb-8">{renderStep()}</div>

//               {/* Navigation buttons */}
//               <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-white/10">
//                 <Button
//                   variant="outline"
//                   onClick={handlePrevious}
//                   disabled={currentStep === 0 || isSubmitting}
//                   className="bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm"
//                 >
//                   <ArrowLeft className="mr-2 h-4 w-4" />
//                   Previous
//                 </Button>

//                 {currentStep < 5 ? (
//                   <Button
//                     onClick={handleNext}
//                     className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
//                     disabled={isSubmitting}
//                   >
//                     Next
//                     <ArrowRight className="ml-2 h-4 w-4" />
//                   </Button>
//                 ) : (
//                   !submitSuccess && (
//                     <Button
//                       onClick={handleComplete}
//                       disabled={isSubmitting}
//                       className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
//                     >
//                       {isSubmitting ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           {mode === "book" ? "Submitting..." : "Creating Profile..."}
//                         </>
//                       ) : mode === "book" ? (
//                         "Submit Booking Request"
//                       ) : (
//                         "Create Professional Profile"
//                       )}
//                     </Button>
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

