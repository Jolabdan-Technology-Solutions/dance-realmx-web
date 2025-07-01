"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useSearch } from "wouter"
import type { Course, Category } from "../../../shared/schema"
import { Search, BookOpen, Clock, ChevronRight, Award, ThumbsUp, Loader2, DollarSign, Badge } from "lucide-react"

const bannerImage = "/assets/images/6.png"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { CourseDetailsModal } from "../../components/courses/course-details-modal"
import { toast } from "@/components/ui/use-toast"
import { navigate } from "wouter/use-browser-location"
import { apiRequest } from "@/lib/queryClient"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"

interface ApiResponse<T> {
  data: T
}

// API functions
const fetchCourses = async (): Promise<ApiResponse<Course[]>> => {
  const response = await api.get("/api/courses")
  return response.data
}

const fetchCategories = async (): Promise<ApiResponse<Category[]>> => {
  const response = await api.get("/api/categories")
  return response.data
}

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [levelFilter, setLevelFilter] = useState<string>("")
  const [enrolling, setEnrolling] = useState(false)
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "price-low" | "price-high">("popular")
  const { user } = useAuth()
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [courseId, setCourseId] = useState<number | null>(null)

  // Get URL search parameters
  const search = useSearch()
  const searchParams = new URLSearchParams(search)
  const categoryParam = searchParams.get("category")
  const [isEnrolled, setIsEnrolled] = useState(false)

  // Initialize category filter from URL parameter if available
  useEffect(() => {
    if (categoryParam) {
      setCategoryFilter(categoryParam)
    }
  }, [categoryParam])

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user?.id || !selectedCourseId) return
      try {
        const response = await apiRequest(`/api/courses/enrollment/me`, {
          method: "GET",
        })
        const enrolled = response?.courses?.some(
          (course: any) => course.course.id === selectedCourseId && course.enrollment.status === "ACTIVE",
        )
        setIsEnrolled(enrolled)
      } catch (error) {
        console.error("Error checking enrollment:", error)
      }
    }
    checkEnrollment()
  }, [user?.id, selectedCourseId])

  // Fetch courses with proper error handling
  const {
    data: courses = [] as Course[],
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const response = await fetchCourses()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch categories with proper error handling
  const {
    data: categories = [] as Category[],
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetchCategories()
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/courses/enroll-course/${courseId}`, {
        method: "POST",
        data: {
          userId: user?.id,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to create checkout session")
      }
      console.log(res)
      const { url } = await res
      // Redirect to Stripe Checkout
      window.location.href = url
      return {}
    },
    onSuccess: () => {
      toast({
        title: "Redirecting to Checkout",
        description: "Please complete your payment to enroll in this course.",
      })
      setEnrolling(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      })
      setEnrolling(false)
    },
  })

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in this course.",
        variant: "destructive",
      })
      const currentPath = window.location.pathname
      window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`
      return
    }
    setEnrolling(true)
    enrollMutation.mutate()
  }

  // Find category name by ID
  const getCategoryName = (categoryId: number | undefined | null) => {
    if (!categoryId || !categories.length) return "Uncategorized"
    const category = categories.find((c) => c.id === categoryId || c.id === Number(categoryId))
    return category ? category.name : "Uncategorized"
  }

  // Filter and sort courses with improved logic
  const filteredCourses = Array.isArray(courses)
    ? courses
        .filter((course: Course) => {
          // Only show visible courses
          if (course.visible === false) return false

          // Filter by search query
          if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim()
            const titleMatch = course.title?.toLowerCase().includes(query)
            const descriptionMatch = (course.description || "").toLowerCase().includes(query)
            if (!titleMatch && !descriptionMatch) {
              return false
            }
          }

          // Filter by category - improved logic
          if (categoryFilter && categoryFilter !== "all" && categoryFilter !== "") {
            const courseCategoryId = course.category_id || course.categoryId
            const courseCategoryName = course.category?.name || course.categories?.[0]?.name

            const filterCategoryId = Number.parseInt(categoryFilter)
            if (!isNaN(filterCategoryId)) {
              if (courseCategoryId && Number.parseInt(courseCategoryId.toString()) === filterCategoryId) {
                // Match found by ID
              } else if (courseCategoryName) {
                const categoryFromFilter = categories.find((cat) => cat.id === filterCategoryId)
                if (categoryFromFilter && courseCategoryName.toLowerCase() !== categoryFromFilter.name.toLowerCase()) {
                  return false
                }
              } else {
                return false
              }
            }
          }

          // Filter by level - improved logic
          if (levelFilter && levelFilter !== "all" && levelFilter !== "") {
            const courseLevel = (course.difficulty_level || course.level || "").toLowerCase()
            const filterLevel = levelFilter.toLowerCase()
            if (courseLevel !== filterLevel) {
              return false
            }
          }

          return true
        })
        .sort((a: Course, b: Course) => {
          switch (sortBy) {
            case "newest":
              return (
                new Date(b.createdAt || b.created_at || new Date()).getTime() -
                new Date(a.createdAt || a.created_at || new Date()).getTime()
              )
            case "price-low":
              return Number(a.price || 0) - Number(b.price || 0)
            case "price-high":
              return Number(b.price || 0) - Number(a.price || 0)
            case "popular":
            default:
              return (
                new Date(b.createdAt || b.created_at || new Date()).getTime() -
                new Date(a.createdAt || a.created_at || new Date()).getTime()
              )
          }
        })
    : []

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    console.log("Category filter changed to:", value)
    setCategoryFilter(value === "all" ? "" : value)
  }

  // Handle level filter change
  const handleLevelChange = (value: string) => {
    setLevelFilter(value === "all" ? "" : value)
  }

  // Handle sort by change
  const handleSortByChange = (value: "popular" | "newest" | "price-low" | "price-high") => {
    setSortBy(value)
  }

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, course: Course) => {
    try {
      const target = e.currentTarget
      console.error("Error loading course image in courses page:", course.title, course.imageUrl)
      const fallbackImg = `/images/thumbnails/${getCategoryName(course.categoryId).toLowerCase()}-techniques.jpg`
      target.src = fallbackImg

      target.onerror = () => {
        try {
          target.style.display = "none"
          const parent = target.parentElement
          if (parent) {
            const initials = course.title?.[0] || "D"
            const placeholder = document.createElement("div")
            placeholder.className = "w-full h-48 bg-primary/10 flex items-center justify-center"
            placeholder.innerHTML = `<span class="text-primary text-5xl">${initials}</span>`
            parent.appendChild(placeholder)
          }
        } catch (error) {
          console.error("Error creating placeholder:", error)
        }
      }
    } catch (error) {
      console.error("Error handling image error:", error)
    }
  }

  const isLoading = isLoadingCourses || isLoadingCategories
  const hasError = coursesError || categoriesError

  // Show error state
  if (hasError) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center max-w-md mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-sm sm:text-base text-red-600">
            {coursesError?.message || categoriesError?.message || "An error occurred"}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* Hero Banner with Image */}
      <div className="relative rounded-xl overflow-hidden mb-8 sm:mb-12 max-w-7xl mx-auto">
        <img
          src={bannerImage || "/placeholder.svg"}
          alt="Dance Education Courses"
          className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-white leading-tight">
            Education Courses
          </h1>
          <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl leading-relaxed">
            Enhance your dance knowledge and skills with our comprehensive courses. Earn professional certifications
            recognized throughout the industry.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm mb-6 sm:mb-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <Input
              placeholder="Search courses..."
              className="pl-9 sm:pl-10 text-sm sm:text-base"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Select value={categoryFilter || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter || "all"} onValueChange={handleLevelChange}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) => handleSortByChange(value as "popular" | "newest" | "price-low" | "price-high")}
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Category Tabs Navigation */}
      <div className="mb-6 sm:mb-8 max-w-7xl mx-auto">
        <Tabs value={categoryFilter || "all"} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-1 sm:gap-2 h-auto p-1">
            <TabsTrigger
              value="all"
              onClick={() => setCategoryFilter("")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-4 py-2"
            >
              All Categories
            </TabsTrigger>
            {categories.map((category: Category) => (
              <TabsTrigger
                key={category.id}
                value={category.id.toString()}
                onClick={() => setCategoryFilter(category.id.toString())}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Course Listings */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48 sm:h-64">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
          <span className="ml-2 text-sm sm:text-base text-gray-600">Loading courses...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg shadow-sm p-6 sm:p-8 text-center max-w-2xl mx-auto">
          <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800">No Courses Found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
            We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.
          </p>
          <Button
            onClick={() => {
              setSearchQuery("")
              setCategoryFilter("")
              setLevelFilter("")
              setSortBy("popular")
            }}
            className="text-sm sm:text-base"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        // Display all courses in a responsive grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {filteredCourses.map((course: Course) => {
            return (
              <Card
                key={course.id}
                className="bg-gray-900 overflow-hidden border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={
                      course.image_url ||
                      `/images/thumbnails/${getCategoryName(course.category_id || course.categoryId).toLowerCase()}-techniques.jpg`
                    }
                    alt={course.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=192&width=384"
                    }}
                  />
                  {(course as any).featured && (
                    <div className="absolute top-2 left-2 rounded-full bg-yellow-600 text-white px-2 py-1 text-xs font-bold">
                      Featured
                    </div>
                  )}
                  {Number(course.price) === 0 && (
                    <div className="absolute top-2 right-2 rounded-full bg-green-600 text-white px-2 py-1 text-xs font-bold">
                      Free
                    </div>
                  )}
                </div>

                <CardHeader className="bg-gray-900 pb-2 p-3 sm:p-4">
                  <CardTitle
                    className="line-clamp-2 text-white cursor-pointer hover:text-[#00d4ff] transition-colors text-sm sm:text-base lg:text-lg leading-tight"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs sm:text-sm">
                    {course?.categories?.[0]?.name || getCategoryName(course.category_id || course.categoryId)} •{" "}
                    {course?.difficulty_level || course?.level}
                  </CardDescription>
                </CardHeader>

                <CardContent className="bg-gray-900 text-white p-3 sm:p-4 pt-0">
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 mb-3 leading-relaxed">
                    {course.description || "No description available."}
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {course.duration || "Self-paced"}
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {course.difficulty_level || course.level}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row justify-between bg-gray-900 p-3 sm:p-4 pt-0 gap-2 sm:gap-0">
                  <div className="font-bold text-lg sm:text-xl text-white">
                    {Number(course.price) === 0 ? (
                      <span className="text-green-400">Free</span>
                    ) : (
                      <span>${Number(course.price).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Button
                      className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto"
                      onClick={() => {
                        setSelectedCourseId(course.id)
                        setIsDetailsModalOpen(true)
                        setCourseId(course.id)
                      }}
                    >
                      View Details
                    </Button>
                    {isEnrolled && (
                      <Button
                        onClick={() => navigate("/my-courses")}
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-800 text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto"
                      >
                        Go to course
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Featured Categories Section */}
      {categories.length > 0 && (
        <div className="mt-12 sm:mt-16 max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.slice(0, 4).map((category: Category) => {
              const getImagePath = (categoryName: string) => {
                switch (categoryName.toLowerCase()) {
                  case "ballet":
                    return "/assets/images/categories/ballet.jpg"
                  case "contemporary":
                    return "/assets/images/categories/contemporary.jpg"
                  case "jazz":
                    return "/assets/images/categories/jazz.jpg"
                  case "hip hop":
                    return "/assets/images/categories/hiphop.jpg"
                  default:
                    return "/assets/images/categories/contemporary.jpg"
                }
              }

              return (
                <Card
                  key={category.id}
                  className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setCategoryFilter(category.id.toString())
                    const element = document.querySelector(".mb-6")
                    if (element) {
                      window.scrollTo({
                        top: element.getBoundingClientRect().top + window.scrollY - 100,
                        behavior: "smooth",
                      })
                    }
                  }}
                >
                  <CardHeader className="p-0">
                    <div className="relative h-32 sm:h-40 lg:h-48 w-full overflow-hidden">
                      <img
                        src={getImagePath(category.name) || "/placeholder.svg"}
                        alt={`${category.name} Dance`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                        <CardTitle className="text-white p-3 sm:p-4 w-full text-center text-sm sm:text-base lg:text-lg">
                          {category.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex justify-center pt-3 sm:pt-4 pb-3 sm:pb-4">
                    <Button
                      variant="ghost"
                      className="group-hover:translate-x-1 transition-transform text-xs sm:text-sm px-3 sm:px-4 py-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCategoryFilter(category.id.toString())
                        const element = document.querySelector(".mb-6")
                        if (element) {
                          window.scrollTo({
                            top: element.getBoundingClientRect().top + window.scrollY - 100,
                            behavior: "smooth",
                          })
                        }
                      }}
                    >
                      Explore Courses <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-12 sm:mt-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/images/danceKids.png')",
          }}
        />
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-white/30" />

        {/* Content */}
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center text-gray-800">
            Benefits of Our Certification Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                image: "/images/stretch.png",
                icon: Badge,
                title: "Industry Recognition",
                description: "Our certifications are recognized by leading dance organizations and studios worldwide.",
                color: "text-[#00d4ff]",
              },
              {
                image: "/images/line.png",
                icon: Award,
                title: "Expert Instructors",
                description: "Learn from acclaimed dance educators with decades of professional experience.",
                color: "text-blue-400",
              },
              {
                image: "/images/air.png",
                icon: DollarSign,
                title: "Career Advancement",
                description: "Enhance your teaching credentials and increase your earning potential.",
                color: "text-[#00d4ff]",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300"
              >
                <div className="h-32 sm:h-40 lg:h-48 overflow-hidden">
                  <img
                    src={benefit.image || "/placeholder.svg"}
                    alt={benefit.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800 flex items-center">
                    <benefit.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${benefit.color} mr-2`} />
                    {benefit.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 sm:mt-16 text-center bg-gradient-to-r from-blue-900 to-blue-700 py-8 sm:py-12 px-4 sm:px-6 rounded-xl shadow-lg max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">
          Ready to Advance Your Dance Education?
        </h2>
        <p className="text-sm sm:text-base text-gray-200 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed">
          Explore our comprehensive course catalog and start your journey towards professional certification today.
        </p>
        <Button
          className="bg-[#00d4ff] text-black hover:bg-[#00a0c0] text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 lg:py-6 h-auto font-semibold shadow-md"
          onClick={() => {
            setSearchQuery("")
            setCategoryFilter("")
            setLevelFilter("")
            setSortBy("popular")
            const coursesSection = document.querySelector(".grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3")
            if (coursesSection) {
              window.scrollTo({
                top: coursesSection.getBoundingClientRect().top + window.scrollY - 120,
                behavior: "smooth",
              })
            }
          }}
        >
          Browse All Courses
        </Button>
      </div>

      {/* Course Details Modal */}
      {selectedCourseId && (
        <CourseDetailsModal
          courseId={selectedCourseId}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setTimeout(() => setSelectedCourseId(null), 300)
          }}
        />
      )}
    </div>
  )
}
