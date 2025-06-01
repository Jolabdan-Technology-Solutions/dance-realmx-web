import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Card, CardContent } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Course, Category, Module } from "../../../shared/schema";
import { VideoPreviewModal } from "../components/curriculum/video-preview-modal";

// Extended Course type that includes modules
interface CourseWithModules extends Course {
  modules?: Module[];
  instructor?: any;
  preview_video_url?: string;
  full_video_url?: string;
  price_royalty?: string;
  price_premium?: string;
}
import { apiRequest, queryClient } from "../lib/queryClient";
import { Loader2, ShoppingCart, Lock as LockClosedIcon } from "lucide-react";
import { AuthWrapper } from "../lib/auth-wrapper";
import { AdminEditableContent } from "../components/admin/admin-editable-content";
import { convertToYouTubeEmbedUrl } from "../lib/utils";

function CourseDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrolling, setEnrolling] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShortPreviewModalOpen, setIsShortPreviewModalOpen] = useState(false);

  // Fetch course details
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery<CourseWithModules>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !isNaN(courseId),
    retry: 2,
    staleTime: 60000,
    onSuccess: (data: CourseWithModules) => {
      console.log(`Course data received:`, data);
      console.log(`Course modules:`, data?.modules);
    },
    onError: (error: Error) => {
      console.error("Error fetching course details:", error);
      toast({
        title: "Error loading course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch category if the course has one
  const { data: category } = useQuery<Category>({
    queryKey: [`/api/categories/${course?.category_id}`],
    enabled: !!course?.category_id,
  });

  // Fetch user enrollments if logged in
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
    enabled: !!user,
  });

  // Fetch cart items to check if this course is already in the cart
  const { data: userCartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Get guest cart from localStorage if not logged in
  const [guestCart, setGuestCart] = useState<any[]>(() => {
    if (!user) {
      try {
        const storedCart = localStorage.getItem("guestCart");
        return storedCart ? JSON.parse(storedCart) : [];
      } catch (e) {
        console.error("Error parsing guest cart from localStorage:", e);
        return [];
      }
    }
    return [];
  });

  // Determine cart based on user status
  const cartItems = user ? userCartItems : guestCart;

  // Check if already enrolled
  const isEnrolled = user
    ? enrollments.some((enrollment) => enrollment.course_id === courseId)
    : false;

  // Check if already in cart
  const isInCart = cartItems.some(
    (item) => item.itemType === "course" && item.itemId === courseId
  );

  // Get the appropriate price based on user's subscription tier
  const getPrice = (): number => {
    if (!course) return 0;
    if (!user) return parseFloat(course.price || "0");

    switch (user.subscription_plan) {
      case "royalty":
        return course.price_royalty
          ? parseFloat(course.price_royalty)
          : parseFloat(course.price || "0");
      case "premium":
        return course.price_premium
          ? parseFloat(course.price_premium)
          : parseFloat(course.price || "0");
      default:
        return parseFloat(course.price || "0");
    }
  };

  // Enroll in the course
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to enroll");

      // Use the Stripe checkout flow for enrollment
      const response = await apiRequest(
        "POST",
        `/api/enroll-course/${courseId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create enrollment checkout: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout page
      if (data.url) {
        window.location.href = data.url;
      } else {
        // For free courses which don't need payment
        queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
        toast({
          title: "Enrollment successful",
          description: data.message || "You have been enrolled in this course.",
        });

        // Redirect to the course if specified
        if (data.redirectUrl) {
          navigate(data.redirectUrl);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add course to cart
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user)
        throw new Error("You must be logged in to add items to your cart");
      if (!course) throw new Error("Course information not available");

      // Get the appropriate price based on subscription tier
      const price = getPrice().toString();

      return await apiRequest("POST", "/api/cart", {
        itemType: "course",
        itemId: courseId,
        title: course.title,
        price,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "This course has been added to your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding to cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEnroll = async () => {
    if (isEnrolled) {
      toast({
        title: "Already enrolled",
        description: "You are already enrolled in this course.",
      });
      return;
    }

    // For guest users, save the course ID and redirect to auth
    if (!user) {
      // Store the intent to enroll after login
      localStorage.setItem("pendingEnrollment", courseId.toString());
      toast({
        title: "Login required",
        description:
          "Please log in or create an account to enroll in this course.",
      });
      navigate("/auth");
      return;
    }

    try {
      setEnrolling(true);
      await enrollMutation.mutateAsync();
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddToCart = async () => {
    if (isInCart) {
      toast({
        title: "Already in cart",
        description: "This course is already in your cart.",
      });
      navigate("/cart");
      return;
    }

    try {
      setAddingToCart(true);

      if (!user) {
        // For guest users, add to localStorage
        if (!course) {
          throw new Error("Course information not available");
        }

        const price = parseFloat(course.price || "0");
        const newItem = {
          id: Date.now(), // Temporary ID for guest cart
          itemType: "course",
          itemId: courseId,
          title: course.title,
          price: price.toString(),
          quantity: 1,
          imageUrl: course.imageUrl,
        };

        const updatedCart = [...guestCart, newItem];
        localStorage.setItem("guestCart", JSON.stringify(updatedCart));
        setGuestCart(updatedCart);

        toast({
          title: "Added to cart",
          description: "This course has been added to your cart.",
        });

        setTimeout(() => {
          navigate("/cart");
        }, 1000);
      } else {
        // For logged-in users, use the API
        await addToCartMutation.mutateAsync();
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold">Course Not Found</h1>
            <p className="mt-4">
              The course you're looking for does not exist or has been removed.
            </p>
            <Button
              className="mt-6 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full"
              onClick={() => navigate("/courses")}
            >
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use a proper image path with fallback
  const imageUrl = course.imageUrl ? course.imageUrl : "/assets/images/5.png";

  return (
    <>
      {/* Course Image Banner */}
      <AdminEditableContent
        type="image"
        id={course.id}
        field="imageUrl"
        endpoint="/api/courses"
        initialValue={imageUrl}
        queryKey={[`/api/courses/${courseId}`]}
      >
        <div
          className="h-[40vh] bg-center bg-cover flex items-end"
          style={{
            backgroundImage: `url('${imageUrl}')`,
          }}
        >
          <div className="bg-gradient-to-t from-black to-transparent w-full p-6">
            <div className="container mx-auto">
              <AdminEditableContent
                type="text"
                id={course.id}
                field="title"
                endpoint="/api/courses"
                initialValue={course.title}
                queryKey={[`/api/courses/${courseId}`]}
              >
                <h1 className="text-3xl md:text-4xl font-bold">
                  {course.title}
                </h1>
              </AdminEditableContent>
              {category && (
                <span className="bg-[#00d4ff] text-black px-3 py-1 rounded-full text-sm font-bold inline-block mt-2">
                  {category.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </AdminEditableContent>

      {/* Course Details */}
      <div className="w-full px-4 md:px-8 lg:px-16 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Course Information */}
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-4">About This Course</h2>
            <AdminEditableContent
              type="longText"
              id={course.id}
              field="description"
              endpoint="/api/courses"
              initialValue={course.description || ""}
              queryKey={[`/api/courses/${courseId}`]}
            >
              <p className="text-gray-300 whitespace-pre-line mb-8">
                {course.description ||
                  "No description available for this course."}
              </p>
            </AdminEditableContent>

            {/* Course Video Section */}
            {(course.preview_video_url || course.full_video_url) && (
              <div className="mt-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">Course Video</h2>

                <div>
                  {/* Show the appropriate video based on enrollment status */}
                  {isEnrolled && course.full_video_url ? (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-md">
                      <iframe
                        src={convertToYouTubeEmbedUrl(course.full_video_url)}
                        title="Full Course Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : course.preview_video_url ? (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-md relative group">
                      <iframe
                        src={convertToYouTubeEmbedUrl(course.preview_video_url)}
                        title="Course Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>

                      {/* Preview Button (Overlay) */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                          onClick={() => setIsPreviewModalOpen(true)}
                        >
                          Watch 15s Preview
                        </Button>
                      </div>
                    </div>
                  ) : course.full_video_url && !isEnrolled ? (
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center p-6 text-center border border-gray-700 shadow-md">
                      <div>
                        <LockClosedIcon className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">
                          Course Video Locked
                        </h3>
                        <p className="mb-4 text-muted-foreground">
                          Enroll in this course to access the full instructional
                          video.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full"
                            onClick={handleEnroll}
                          >
                            Enroll Now
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsShortPreviewModalOpen(true)}
                          >
                            Watch 15s Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Preview option below the video - only show if not enrolled */}
                  {!isEnrolled && (
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-muted-foreground">
                        {course.preview_video_url
                          ? "Preview available for all users"
                          : "Course preview available"}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="text-primary hover:text-primary/80"
                      >
                        Watch 15s Preview
                      </Button>
                    </div>
                  )}
                </div>

                {/* Preview Modals - single implementation */}
                <VideoPreviewModal
                  videoUrl={course.preview_video_url || course.full_video_url}
                  isOpen={isPreviewModalOpen}
                  onClose={() => setIsPreviewModalOpen(false)}
                  previewDuration={15}
                />

                <VideoPreviewModal
                  videoUrl={course.full_video_url}
                  isOpen={isShortPreviewModalOpen}
                  onClose={() => setIsShortPreviewModalOpen(false)}
                  previewDuration={15}
                />
              </div>
            )}

            <Separator className="my-6" />

            <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
            <ul className="space-y-2 mb-8">
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#00d4ff] mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Comprehensive dance techniques and theory</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#00d4ff] mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Professional teaching methods and approaches</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#00d4ff] mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Practical application of choreography principles</span>
              </li>
            </ul>

            {/* Course Modules */}
            <Separator className="my-6" />
            <h2 className="text-2xl font-bold mb-4">Course Content</h2>

            {/* Show something if course is missing modules array completely */}
            {!course.modules ? (
              <div className="p-4 bg-gray-900 rounded-md">
                <p className="text-gray-400">Loading modules...</p>
                <AdminEditableContent
                  type="text"
                  id={course.id}
                  field="modules"
                  endpoint="/api/courses"
                  initialValue=""
                  queryKey={[`/api/courses/${courseId}`]}
                >
                  <Button
                    onClick={() => {
                      queryClient.invalidateQueries({
                        queryKey: [`/api/courses/${courseId}`],
                      });
                      console.log("Refreshing course data to load modules");
                    }}
                    className="mt-2"
                  >
                    Refresh Modules
                  </Button>
                </AdminEditableContent>
              </div>
            ) : course.modules.length === 0 ? (
              <div className="p-4 bg-gray-900 rounded-md">
                <p className="text-gray-400">
                  No modules have been added to this course yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {course.modules.map((module: any, index: number) => (
                  <div
                    key={module.id || index}
                    className="border border-gray-800 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-900 p-4 flex justify-between items-center">
                      <h3 className="font-medium">
                        <span className="text-[#00d4ff] mr-2">
                          {index + 1}.
                        </span>
                        {module.title || "Untitled Module"}
                      </h3>
                      <div className="text-sm text-gray-400">
                        {module.orderIndex !== null &&
                        module.orderIndex !== undefined
                          ? `Module ${module.orderIndex + 1}`
                          : `Module ${index + 1}`}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-950">
                      <p className="text-gray-300 text-sm">
                        {module.description ||
                          "No description available for this module."}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      queryClient.invalidateQueries({
                        queryKey: [`/api/courses/${courseId}`],
                      });
                      console.log("Refreshing course data to update modules");
                    }}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    Refresh Modules
                  </Button>
                </div>
              </div>
            )}

            {/* Add debug output for development 
            <div className="mt-8 p-4 bg-black/50 rounded border border-gray-800">
              <h3 className="font-bold mb-2">Course Data Debug</h3>
              <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                {JSON.stringify({
                  id: course.id,
                  moduleCount: course.modules?.length || 0,
                  hasModules: !!course.modules,
                  modules: course.modules?.map(m => ({id: m.id, title: m.title})) || []
                }, null, 2)}
              </pre>
            </div>
            */}
          </div>

          {/* Enrollment Card */}
          <div className="lg:w-1/3">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Course Details</h3>

                <div className="mb-6">
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-bold text-xl">
                      ${getPrice().toFixed(2)}
                      {user?.subscription_plan &&
                        (user.subscription_plan === "premium" ||
                          user.subscription_plan === "royalty") && (
                          <span className="ml-2 text-sm bg-green-900 text-green-300 px-2 py-1 rounded-full">
                            {user.subscription_plan === "royalty"
                              ? "Royalty Discount"
                              : "Premium Discount"}
                          </span>
                        )}
                    </span>
                  </div>

                  {/* Only show admin sections if user is logged in and is admin */}
                  {user?.role === "admin" && (
                    <>
                      <div className="flex justify-between py-2 border-b border-gray-800">
                        <span className="text-gray-400">Standard Price:</span>
                        <AdminEditableContent
                          type="text"
                          id={course.id}
                          field="price"
                          endpoint="/api/courses"
                          initialValue={course.price?.toString() || "0"}
                          queryKey={[`/api/courses/${courseId}`]}
                        >
                          <span className="text-gray-400">
                            ${Number(course.price).toFixed(2)}
                          </span>
                        </AdminEditableContent>
                      </div>

                      <div className="flex justify-between py-2 border-b border-gray-800">
                        <span className="text-gray-400">Premium Price:</span>
                        <AdminEditableContent
                          type="text"
                          id={course.id}
                          field="price_premium"
                          endpoint="/api/courses"
                          initialValue={
                            course.price_premium?.toString() ||
                            course.price?.toString() ||
                            "0"
                          }
                          queryKey={[`/api/courses/${courseId}`]}
                        >
                          <span
                            className={
                              user.subscription_plan === "premium"
                                ? "text-green-400"
                                : "text-gray-400"
                            }
                          >
                            $
                            {Number(
                              course.price_premium || course.price
                            ).toFixed(2)}
                          </span>
                        </AdminEditableContent>
                      </div>

                      <div className="flex justify-between py-2 border-b border-gray-800">
                        <span className="text-gray-400">Royalty Price:</span>
                        <AdminEditableContent
                          type="text"
                          id={course.id}
                          field="price_royalty"
                          endpoint="/api/courses"
                          initialValue={
                            course.price_royalty?.toString() ||
                            course.price_premium?.toString() ||
                            course.price?.toString() ||
                            "0"
                          }
                          queryKey={[`/api/courses/${courseId}`]}
                        >
                          <span
                            className={
                              user.subscription_plan === "royalty"
                                ? "text-green-400"
                                : "text-gray-400"
                            }
                          >
                            $
                            {Number(
                              course.price_royalty ||
                                course.price_premium ||
                                course.price
                            ).toFixed(2)}
                          </span>
                        </AdminEditableContent>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Category:</span>
                    <span>{category?.name || "Uncategorized"}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Course ID:</span>
                    <span>{course.id}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full"
                  onClick={handleEnroll}
                  disabled={enrolling || isEnrolled}
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : isEnrolled ? (
                    "Already Enrolled"
                  ) : (
                    "Enroll Now"
                  )}
                </Button>

                {isEnrolled && (
                  <Button
                    className="w-full mt-4 bg-secondary hover:bg-secondary/90 rounded-full"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Your Dashboard
                  </Button>
                )}

                {!isEnrolled && (
                  <Button
                    className="w-full mt-4 bg-secondary hover:bg-secondary/90 rounded-full flex justify-center items-center"
                    onClick={handleAddToCart}
                    disabled={addingToCart || isInCart}
                  >
                    {addingToCart ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding to Cart...
                      </>
                    ) : isInCart ? (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        View Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// Export the unwrapped component to allow guest access
export default function CourseDetailsPage() {
  return <CourseDetailsContent />;
}
