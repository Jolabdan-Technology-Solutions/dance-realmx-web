

"use client"
import { useState, useEffect } from "react"
import { Filter, ChevronDown, Search, X } from "lucide-react"
import { useLocation } from "wouter"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useGuestCart } from "@/hooks/use-guest-cart"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ResourceErrorCard, ResourcePlaceholderGrid } from "@/components/ui/resource-placeholder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResourceDetailsModal } from "@/components/curriculum/resource-details-modal"
import router from "@/routes/api"
import { navigate } from "wouter/use-browser-location"

// Unified filter state
type FilterState = {
  searchTerm: string
  category: string
  age: string
  priceRange: string
  format: string
  difficulty: string[]
  showAdvancedFilters: boolean
}

// Custom Dropdown Component
const CustomDropdown = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  placeholder?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [, navigate] = useLocation()


  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
        >
          <span className="block truncate">
            {value ? options.find((opt) => opt.value === value)?.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </span>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-900 transition-colors ${value === option.value ? "bg-blue-100 text-blue-900 font-medium" : "text-gray-900"
                    }`}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Define categories and options
const DANCE_CATEGORIES = [
  { id: "all", name: "All Categories", endpoint: "/api/resources" },
  { id: "ballet", name: "Ballet", endpoint: "/api/resources/ballet" },
  { id: "hiphop", name: "Hip Hop", endpoint: "/api/resources/hiphop" },
  { id: "inspirational", name: "Inspirational Dance", endpoint: "/api/resources/inspirational" },
  { id: "jazz", name: "Jazz", endpoint: "/api/resources/jazz" },
  { id: "lyrical", name: "Lyrical", endpoint: "/api/resources/lyrical" },
  { id: "preschool", name: "Preschool", endpoint: "/api/resources/preschool" },
  { id: "tap", name: "Tap", endpoint: "/api/resources/tap" },
  { id: "adaptive", name: "Adaptive Dance", endpoint: "/api/resources/adaptive" },
  { id: "ballroom", name: "Ballroom", endpoint: "/api/resources/ballroom" },
  { id: "contemporary", name: "Contemporary", endpoint: "/api/resources/contemporary" },
]

const AGE_CATEGORIES = [
  { id: "all", name: "All Ages", endpoint: "/api/resources/ages/all" },
  { id: "preschool", name: "Preschool (3-5)", endpoint: "/api/resources/ages/preschool" },
  { id: "elementary", name: "Elementary (6-10)", endpoint: "/api/resources/ages/elementary" },
  { id: "middle", name: "Middle School (11-13)", endpoint: "/api/resources/ages/middle" },
  { id: "high", name: "High School (14-18)", endpoint: "/api/resources/ages/high" },
  { id: "adult", name: "Adult (18+)", endpoint: "/api/resources/ages/adult" },
]

const PRICE_OPTIONS = [
  { value: "all", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "0-10", label: "$0 - $10" },
  { value: "10-20", label: "$10 - $20" },
  { value: "20-30", label: "$20 - $30" },
  { value: "30+", label: "$30+" },
]

const FORMAT_OPTIONS = [
  { value: "all", label: "All Formats" },
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDF" },
  { value: "audio", label: "Audio" },
  { value: "interactive", label: "Interactive" },
  { value: "lesson-plan", label: "Lesson Plan" },
  { value: "choreography", label: "Choreography" },
]

const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced"]

export default function CurriculumPageImproved() {
  const { toast } = useToast()
  const auth = useAuth()
  const user = auth.user

  // Unified filter state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    category: "all",
    age: "all",
    priceRange: "all",
    format: "all",
    difficulty: [],
    showAdvancedFilters: false,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [resources, setResources] = useState<any[]>([])
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // Get cart hooks
  const authCart = useCart()
  const guestCart = useGuestCart()

  // Update filter function
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle category tab selection - updates both tab and dropdown
  const handleCategoryTabChange = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      category: categoryId,
      // Reset age when selecting category to avoid conflicts
      age: "all",
    }))
  }

  // Handle dropdown changes
  const handleDropdownChange = (key: keyof FilterState, value: string) => {
    updateFilter(key, value)
  }

  // Toggle difficulty filter
  const toggleDifficulty = (level: string) => {
    setFilters((prev) => ({
      ...prev,
      difficulty: prev.difficulty.includes(level)
        ? prev.difficulty.filter((d) => d !== level)
        : [...prev.difficulty, level],
    }))
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      searchTerm: "",
      category: "all",
      age: "all",
      priceRange: "all",
      format: "all",
      difficulty: [],
      showAdvancedFilters: false,
    })
  }

  // Get endpoint based on primary filter (category takes precedence)
  const getEndpoint = () => {
    if (filters.category !== "all") {
      const category = DANCE_CATEGORIES.find((c) => c.id === filters.category)
      return category?.endpoint || "/api/resources"
    } else if (filters.age !== "all") {
      const age = AGE_CATEGORIES.find((a) => a.id === filters.age)
      return age?.endpoint || "/api/resources"
    }
    return "/api/resources"
  }

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams()

    if (filters.searchTerm.trim()) {
      params.append("search", filters.searchTerm.trim())
    }
    if (filters.priceRange !== "all") {
      params.append("priceRange", filters.priceRange)
    }
    if (filters.format !== "all") {
      params.append("format", filters.format)
    }
    if (filters.age !== "all" && filters.category === "all") {
      params.append("age", filters.age)
    }
    if (filters.category !== "all" && filters.age === "all") {
      params.append("style", filters.category)
    }
    if (filters.difficulty.length > 0) {
      params.append("difficulty", filters.difficulty.join(","))
    }

    return params.toString()
  }

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true)
        setError(false)

        const endpoint = getEndpoint()
        const queryString = buildQueryParams()
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint

        console.log("Fetching from:", fullEndpoint)

        const response = await api.get(fullEndpoint)

        if (response.data) {
          setResources(Array.isArray(response.data) ? response.data : [])
        } else {
          setError(true)
          toast({
            title: "Error",
            description: "Failed to load resources. Please try again later.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching resources:", error)
        setError(true)
        toast({
          title: "Error",
          description: "Failed to load resources. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [filters, toast])

  // Add to cart function
  const addToCart = (resource: any) => {
    if (user) {
      authCart.addItem(resource)
    } else {
      guestCart.addItem(resource)
    }
    toast({
      title: "Added to cart",
      description: `${resource.title} has been added to your cart.`,
    })
  }

  // Get active filters for display
  const getActiveFilters = () => {
    const active = []
    if (filters.category !== "all") {
      const category = DANCE_CATEGORIES.find((c) => c.id === filters.category)
      active.push({ key: "category", label: category?.name || filters.category })
    }
    if (filters.age !== "all") {
      const age = AGE_CATEGORIES.find((a) => a.id === filters.age)
      active.push({ key: "age", label: age?.name || filters.age })
    }
    if (filters.priceRange !== "all") {
      const price = PRICE_OPTIONS.find((p) => p.value === filters.priceRange)
      active.push({ key: "priceRange", label: price?.label || filters.priceRange })
    }
    if (filters.format !== "all") {
      const format = FORMAT_OPTIONS.find((f) => f.value === filters.format)
      active.push({ key: "format", label: format?.label || filters.format })
    }
    filters.difficulty.forEach((diff) => {
      active.push({ key: "difficulty", label: diff })
    })
    return active
  }

  const activeFilters = getActiveFilters()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative rounded-xl overflow-hidden mb-12 w-full mx-auto">
        <img
          src={"/images/moments.png"}
          alt="Dance Education Courses"
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Explore Our Curriculum
          </h1>
          <p className="text-white text-xl max-w-3xl">
            Discover our comprehensive dance curriculum designed to elevate your skills, connect you with professional instructors, and provide enriching content to support your growth.          </p>
        </div>
      </div>
      {/* Search Bar */}
      <div className="mb-6 flex w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-5 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
            className="pl-10"
          />
        </div>
        {activeFilters.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {activeFilters.map((filter, index) => (
                <Badge key={`${filter.key}-${index}`} variant="secondary" className="flex items-center gap-1">
                  {filter.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      if (filter.key === "difficulty") {
                        toggleDifficulty(filter.label)
                      } else {
                        updateFilter(filter.key as keyof FilterState, "all")
                      }
                    }}
                  />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </div>
        )}
        <div className="flex justify-center mb-4">
          <Button variant="outline" onClick={() => updateFilter("showAdvancedFilters", !filters.showAdvancedFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>
      </div>


      {/* Active Filters Display */}


      {/* Advanced Filters */}
      <div className="mb-8">

        {filters.showAdvancedFilters && (
          <div className="max-w-md mx-auto p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold mb-2 text-black">Difficulty Level</h3>
              {DIFFICULTY_OPTIONS.map((level) => (
                <div key={level} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={filters.difficulty.includes(level)}
                    onCheckedChange={() => toggleDifficulty(level)}
                  />
                  <label htmlFor={`level-${level}`} className="text-black text-sm">
                    {level}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2 text-primary">
          {filters.category !== "all"
            ? DANCE_CATEGORIES.find((c) => c.id === filters.category)?.name
            : filters.age !== "all"
              ? AGE_CATEGORIES.find((a) => a.id === filters.age)?.name
              : "All Resources"}
        </h2>
        <p className="text-gray-600">{loading ? "Loading..." : `${resources.length} resources found`}</p>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <ResourcePlaceholderGrid />
      ) : error ? (
        <ResourceErrorCard
          message="Failed to load resources. Please try again later."
          retryFn={() => {
            setError(false)
            setLoading(true)
          }}
        />
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No resources found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
          <Button onClick={clearAllFilters}>Clear All Filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-gray-200 hover:border-gray-300"
            >
              <CardHeader className="p-0 relative">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={resource.thumbnailUrl || resource.imageUrl || "/placeholder.svg?height=300&width=400"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={`${resource?.title} thumbnail`}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=300&width=400"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
                </div>
              </CardHeader>

              <CardContent className="p-5 flex flex-col flex-grow">
                <CardTitle className="text-xl font-semibold mb-2 line-clamp-2 leading-tight">
                  {resource.title}
                </CardTitle>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed flex-grow">
                  {resource.description}
                </p>

                <div className="grid grid-cols-1 gap-2 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="font-medium">Style:</span>
                    <span>{resource.danceStyle || resource.category || "Dance"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Age:</span>
                    <span>{resource.ageRange || "All Ages"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Level:</span>
                    <span>{resource.difficultyLevel || resource.difficulty || "Any Level"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-primary">
                      {resource.price === "0" || resource.price === 0 ? "Free" : `$${resource.price}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedResource(resource)
                        setDetailsModalOpen(true)
                      }}
                      //   onClick={() => router.push(`/curriculum/${resource.id}`)}
                      // className="hover:bg-gray-50"
                    >
                      Details
                    </Button> */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/curriculum/${resource.id}`)}
                    >
                      Details
                    </Button>

                    <Button onClick={() => addToCart(resource)} size="sm" className="bg-primary hover:bg-primary/90">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resource Details Modal */}
      {selectedResource && (
        <ResourceDetailsModal resource={selectedResource} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
      )}
    </div>
  )
}

