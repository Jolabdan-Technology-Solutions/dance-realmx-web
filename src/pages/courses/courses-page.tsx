import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Course, Category } from "../../../shared/schema";
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  Check,
  ChevronRight,
  Award,
  ThumbsUp,
  Loader2,
  DollarSign,
  Badge as BadgeIcon,
} from "lucide-react";

// Import the banner image directly from the public folder
const bannerImage = "/assets/images/6.png";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { CourseDetailsModal } from "../../components/courses/course-details-modal";
import { toast } from "@/components/ui/use-toast";
import { navigate } from "wouter/use-browser-location";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface ApiResponse<T> {
  data: T;
}

// API functions
const fetchCourses = async (): Promise<ApiResponse<Course[]>> => {
  const response = await fetch("https://api.livetestdomain.com/api/courses");
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
};

const fetchCategories = async (): Promise<ApiResponse<Category[]>> => {
  const response = await fetch("https://api.livetestdomain.com/api/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
};

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "price-low" | "price-high"
  >("popular");

  const { user } = useAuth();

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Get URL search parameters
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const categoryParam = searchParams.get("category");
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Initialize category filter from URL parameter if available
  useEffect(() => {
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user?.id || !selectedCourseId) return;
      try {
        const response = await apiRequest(`/api/courses/enrollment/me`, {
          method: "GET",
        });
        const enrolled = response?.courses?.some(
          (course: any) =>
            course.course.id === selectedCourseId &&
            course.enrollment.status === "ACTIVE"
        );
        setIsEnrolled(enrolled);
      } catch (error) {
        console.error("Error checking enrollment:", error);
      }
    };
    checkEnrollment();
  }, [user?.id, selectedCourseId]);

  // Fetch courses with proper error handling
  const {
    data: courses = [] as Course[],
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const response = await fetchCourses();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories with proper error handling
  const {
    data: categories = [] as Category[],
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetchCategories();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  console.log("Courses:", courses);
  console.log("Categories:", categories);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/courses/enroll-course/${courseId}`, {
        method: "POST",
        data: {
          userId: user?.id,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Failed to create checkout session"
        );
      }
      console.log(res);
      const { url } = await res;

      // Redirect to Stripe Checkout
      window.location.href = url;
      return {};
    },
    onSuccess: () => {
      toast({
        title: "Redirecting to Checkout",
        description: "Please complete your payment to enroll in this course.",
      });
      setEnrolling(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
      setEnrolling(false);
    },
  });

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in this course.",
        variant: "destructive",
      });
      const currentPath = window.location.pathname;
      window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    setEnrolling(true);
    enrollMutation.mutate();
  };

  // Find category name by ID
  const getCategoryName = (categoryId: number | undefined | null) => {
    if (!categoryId || !categories.length) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Filter and sort courses
  const filteredCourses = Array.isArray(courses)
    ? courses
        .filter((course: Course) => {
          // Only show visible courses
          if (!course.visible) return false;

          // Filter by search query
          if (
            searchQuery &&
            !course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !(course.description || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          ) {
            return false;
          }

          // Filter by category
          if (
            categoryFilter &&
            categoryFilter !== "all" &&
            categoryFilter !== "" &&
            course.categoryId !== undefined &&
            course.categoryId !== parseInt(categoryFilter)
          ) {
            return false;
          }

          // Filter by level
          if (
            levelFilter &&
            levelFilter !== "all" &&
            levelFilter !== "" &&
            course.level !== levelFilter
          ) {
            return false;
          }

          return true;
        })
        .sort((a: Course, b: Course) => {
          switch (sortBy) {
            case "newest":
              return (
                new Date(b.createdAt || new Date()).getTime() -
                new Date(a.createdAt || new Date()).getTime()
              );
            case "price-low":
              return Number(a.price || 0) - Number(b.price || 0);
            case "price-high":
              return Number(b.price || 0) - Number(a.price || 0);
            case "popular":
            default:
              // Sort by enrollment count or other popularity metric
              // For now, just use the created date as a fallback
              return (
                new Date(b.createdAt || new Date()).getTime() -
                new Date(a.createdAt || new Date()).getTime()
              );
          }
        })
    : [];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value === "all" ? "" : value);
  };

  // Handle level filter change
  const handleLevelChange = (value: string) => {
    setLevelFilter(value === "all" ? "" : value);
  };

  // Handle sort by change
  const handleSortByChange = (
    value: "popular" | "newest" | "price-low" | "price-high"
  ) => {
    setSortBy(value);
  };

  // Handle image error
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    course: Course
  ) => {
    try {
      const target = e.currentTarget;
      console.error(
        "Error loading course image in courses page:",
        course.title,
        course.imageUrl
      );

      // Try to use a fallback based on category
      const fallbackImg = `/images/thumbnails/${getCategoryName(course.categoryId).toLowerCase()}-techniques.jpg`;
      target.src = fallbackImg;

      // Set up secondary error handler for fallback
      target.onerror = () => {
        try {
          // Hide image and show placeholder
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            const initials = course.title?.[0] || "D";
            const placeholder = document.createElement("div");
            placeholder.className =
              "w-full h-48 bg-primary/10 flex items-center justify-center";
            placeholder.innerHTML = `<span class="text-primary text-5xl">${initials}</span>`;
            parent.appendChild(placeholder);
          }
        } catch (error) {
          console.error("Error creating placeholder:", error);
        }
      };
    } catch (error) {
      console.error("Error handling image error:", error);
    }
  };

  const isLoading = isLoadingCourses || isLoadingCategories;
  const hasError = coursesError || categoriesError;

  // Show error state
  if (hasError) {
    return (
      <div className="w-full px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Data
          </h2>
          <p className="text-red-600">
            {coursesError?.message ||
              categoriesError?.message ||
              "An error occurred"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-12">
      {/* Hero Banner with Image */}
      <div className="relative rounded-xl overflow-hidden mb-12 max-w-[95%] mx-auto">
        <img
          src={bannerImage}
          alt="Dance Education Courses"
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Education Courses
          </h1>
          <p className="text-white text-xl max-w-3xl">
            Enhance your dance knowledge and skills with our comprehensive
            courses. Earn professional certifications recognized throughout the
            industry.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-transparent p-6 rounded-lg shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search courses..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              value={categoryFilter || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
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

            <Select
              value={levelFilter || "all"}
              onValueChange={handleLevelChange}
            >
              <SelectTrigger>
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
              onValueChange={(value) =>
                handleSortByChange(
                  value as "popular" | "newest" | "price-low" | "price-high"
                )
              }
            >
              <SelectTrigger>
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
      <div className="mb-6">
        <Tabs value={categoryFilter || "all"} className="w-full">
          <TabsList className="grid grid-cols-2 md:flex md:flex-wrap gap-1 md:gap-2">
            <TabsTrigger
              value="all"
              onClick={() => setCategoryFilter("")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All Categories
            </TabsTrigger>
            {categories.map((category: Category) => (
              <TabsTrigger
                key={category.id}
                value={category.id.toString()}
                onClick={() => setCategoryFilter(category.id.toString())}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Course Listings */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-gray-600">Loading courses...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg shadow-sm p-6 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            No Courses Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any courses matching your criteria. Try adjusting
            your filters or search terms.
          </p>
          <Button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("");
              setLevelFilter("");
              setSortBy("popular");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        // Display all courses in a single unified grid with exactly 3 cards per row
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-[95%] mx-auto">
          {filteredCourses.map((course: Course) => {
            return (
              <Card key={course.id} className="bg-white overflow-hidden">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={
                      course.image_url ||
                      `/images/thumbnails/${getCategoryName(course.category_id).toLowerCase()}-techniques.jpg`
                    }
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    // onError={(e) => handleImageError(e, course)}
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
                <CardHeader className="bg-gray-900">
                  .
                  <CardTitle
                    className="line-clamp-1 text-white cursor-pointer"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-white">
                    <p className="text-white">
                      {course?.categories[0]?.name} • {course?.difficulty_level}
                    </p>
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-gray-900">
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {course.description || "No description available."}
                  </p>
                  <div className="flex items-center mt-2 gap-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {course.duration || "Self-paced"}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <ThumbsUp className="h-3 w-3 mr-1 text-white" />
                      <p className="text-white">{course.difficulty_level}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-gray-900">
                  <div className="font-bold text-xl">
                    {Number(course.price) === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <span>${Number(course.price).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex space-x-2 bg-gray-900">
                    <Button
                      className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>

                    {isEnrolled ? (
                      <Button
                        onClick={() => navigate("/my-courses")}
                        variant="outline"
                      >
                        Go to course
                      </Button>
                    ) : (
                      ""
                      // <Button onClick={handleEnroll} variant="outline">
                      //   Enroll
                      // </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Featured Categories Section */}
      {categories.length > 0 && (
        <div className="mt-16 max-w-[95%] mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category: Category) => {
              // Get appropriate image for each category
              const getImagePath = (categoryName: string) => {
                switch (categoryName.toLowerCase()) {
                  case "ballet":
                    return "/assets/images/categories/ballet.jpg";
                  case "contemporary":
                    return "/assets/images/categories/contemporary.jpg";
                  case "jazz":
                    return "/assets/images/categories/jazz.jpg";
                  case "hip hop":
                    return "/assets/images/categories/hiphop.jpg";
                  default:
                    return "/assets/images/categories/contemporary.jpg";
                }
              };

              return (
                <Card
                  key={category.id}
                  className="group hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => {
                    setCategoryFilter(category.id.toString());
                    // Scroll to the courses section
                    const element = document.querySelector(".mb-6");
                    if (element) {
                      window.scrollTo({
                        top:
                          element.getBoundingClientRect().top +
                          window.scrollY -
                          100,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={getImagePath(category.name)}
                        alt={`${category.name} Dance`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                        <CardTitle className="text-white p-4 w-full text-center">
                          {category.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex justify-center pt-4">
                    <Button
                      variant="ghost"
                      className="group-hover:translate-x-1 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryFilter(category.id.toString());
                        // Scroll to the courses section
                        const element = document.querySelector(".mb-6");
                        if (element) {
                          window.scrollTo({
                            top:
                              element.getBoundingClientRect().top +
                              window.scrollY -
                              100,
                            behavior: "smooth",
                          });
                        }
                      }}
                    >
                      Explore Courses <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-8 max-w-[95%] mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">
          Benefits of Our Certification Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="h-48 overflow-hidden">
              <img
                src="/assets/images/benefits/recognition.jpg"
                alt="Industry Recognition"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-gray-800 flex items-center">
                <BadgeIcon className="h-5 w-5 text-[#00d4ff] mr-2" />
                Industry Recognition
              </h3>
              <p className="text-gray-600">
                Our certifications are recognized by leading dance organizations
                and studios worldwide.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="h-48 overflow-hidden">
              <img
                src="/assets/images/benefits/instructor.jpg"
                alt="Expert Instructors"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-gray-800 flex items-center">
                <Award className="h-5 w-5 text-blue-400 mr-2" />
                Expert Instructors
              </h3>
              <p className="text-gray-600">
                Learn from acclaimed dance educators with decades of
                professional experience.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="h-48 overflow-hidden">
              <img
                src="/assets/images/benefits/career.jpg"
                alt="Career Advancement"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-gray-800 flex items-center">
                <DollarSign className="h-5 w-5 text-[#00d4ff] mr-2" />
                Career Advancement
              </h3>
              <p className="text-gray-600">
                Enhance your teaching credentials and increase your earning
                potential.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center bg-gradient-to-r from-blue-900 to-blue-700 py-12 px-6 rounded-xl shadow-lg max-w-[95%] mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Ready to Advance Your Dance Education?
        </h2>
        <p className="text-gray-200 max-w-3xl mx-auto mb-6">
          Explore our comprehensive course catalog and start your journey
          towards professional certification today.
        </p>
        <Button
          className="bg-[#00d4ff] text-white hover:bg-[#00a0c0] text-lg px-8 py-6 h-auto font-semibold shadow-md"
          onClick={() => {
            // Clear all filters
            setSearchQuery("");
            setCategoryFilter("");
            setLevelFilter("");
            setSortBy("popular");

            // Scroll to courses section
            const coursesSection = document.querySelector(
              ".grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3"
            );
            if (coursesSection) {
              window.scrollTo({
                top:
                  coursesSection.getBoundingClientRect().top +
                  window.scrollY -
                  120,
                behavior: "smooth",
              });
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
            setIsDetailsModalOpen(false);
            // Allow for transition animation
            setTimeout(() => setSelectedCourseId(null), 300);
          }}
        />
      )}
    </div>
  );
}
