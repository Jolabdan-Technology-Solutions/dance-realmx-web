import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../../lib/queryClient";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Loader2,
  CheckCircle,
  Award,
  BookOpen,
  Clock,
  User,
  Star,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { AdminEditableContent } from "../../components/admin/admin-editable-content";
import { VideoPreviewModal } from "../../components/curriculum/video-preview-modal";
import { navigate } from "wouter/use-browser-location";

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  content?: string;
  orderIndex: number;
  videoUrl?: string;
}

interface CourseModules {
  id: number;
  courseId: number;
  title: string;
  orderIndex: number;
  lessons?: Lesson[];
}

interface CourseWithModules {
  id: number;
  title: string;
  description?: string;
  price: string;
  instructorId?: number;
  categoryId?: number;
  difficulty_level?: string;
  duration?: string;
  image_url?: string;
  createdAt?: string;
  updatedAt?: string;
  instructor?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
  modules?: CourseModules[];
  preview_video_url?: string;
  Video_url?: string;
}

interface CourseDetailsModalProps {
  courseId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseDetailsModal({
  courseId,
  isOpen,
  onClose,
}: CourseDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrolling, setEnrolling] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFullPreviewModalOpen, setIsFullPreviewModalOpen] = useState(false);

  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user?.id) return;
      try {
        const response = await apiRequest(`/api/courses/enrollment/me`, {
          method: "GET",
        });
        const enrolled = response?.courses?.some(
          (course: any) =>
            course.course.id === Number(courseId) &&
            course.enrollment.status === "ACTIVE"
        );
        setIsEnrolled(enrolled);
      } catch (error) {
        console.error("Error checking enrollment:", error);
      }
    };
    checkEnrollment();
  }, [user?.id, courseId]);

  // Fetch course details
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery<CourseWithModules>({
    queryKey: [`/api/courses/${courseId}`],
    queryFn: async () => {
      const response = await apiRequest(`/api/courses/${courseId}`, {
        method: "GET",
      });
      return response;
    },
    enabled: isOpen,
    retry: 2,
    staleTime: 60000,
  });

  // Fetch category if the course has one
  interface Category {
    id: number;
    name: string;
  }

  const { data: category } = useQuery<Category>({
    queryKey: [`/api/categories/${course?.categoryId}`],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/categories/${course?.categoryId}`,
        {
          method: "GET",
        }
      );
      return response.data;
    },
    enabled: isOpen && !!course?.categoryId,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!course) throw new Error("Course information not available");

      const response = await apiRequest("/api/cart", {
        method: "POST",
        data: {
          itemType: "course",
          itemId: courseId,
          title: course.title,
          price: course.price,
          quantity: 1,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "This course has been added to your cart.",
      });
      setAddingToCart(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding to cart",
        description: error.message,
        variant: "destructive",
      });
      setAddingToCart(false);
    },
  });

  // Enroll via Stripe payment mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        `/api/courses/enroll-course/${courseId}`,
        {
          method: "POST",
          data: {
            user_id: user?.id,
          },
        }
      );

      if (!response) {
        throw new Error("Failed to create checkout session");
      }

      console.log(response);

      const { url } = response;
      window.location.href = url;
      return response.data;
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

  const handleAddToCart = () => {
    setAddingToCart(true);
    addToCartMutation.mutate();
  };

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in this course.",
        variant: "destructive",
      });
      return;
    }

    setEnrolling(true);
    enrollMutation.mutate();
  };

  const handleOpenPreviewVideo = () => {
    if (course?.preview_video_url) {
      setIsPreviewModalOpen(true);
    } else {
      toast({
        title: "Preview Not Available",
        description: "This course does not have a preview video.",
        variant: "destructive",
      });
    }
  };

  // Use a proper image path with fallback
  const imageUrl = course?.image_url
    ? course.image_url
    : "/assets/images/5.png";

  // Return dialog content
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {course?.title || "Loading..."}
          </DialogTitle>
          <DialogDescription>
            {category ? `Category: ${category.name}` : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoadingCourse ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courseError ? (
          <div className="py-8 text-center">
            <p className="text-destructive">
              Error loading course details. Please try again.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Course Header/Banner */}
            <div className="relative rounded-lg overflow-hidden h-60 bg-gray-800">
              <img
                src={imageUrl}
                alt={course?.title}
                className="w-full h-full object-cover opacity-80"
                onError={(e) => {
                  console.error(
                    "Error loading course image in modal:",
                    course?.title,
                    imageUrl
                  );
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.classList.add(
                    "flex",
                    "items-center",
                    "justify-center",
                    "bg-primary-100"
                  );
                  e.currentTarget.parentElement!.innerHTML += `
                    <span class="text-primary text-6xl font-bold">
                      ${course?.title?.[0] || "D"}
                    </span>
                  `;
                }}
              />
              <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                {course?.difficulty_level && (
                  <Badge
                    variant="outline"
                    className="bg-primary text-black absolute top-4 right-4"
                  >
                    {course.difficulty_level}
                  </Badge>
                )}
              </div>
            </div>

            {/* Course Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  About This Course
                </h3>
                <p className="text-gray-400 mb-4">
                  {course?.description ||
                    "No description available for this course."}
                </p>

                {/* Course Features */}
                <div className="space-y-3">
                  {course?.instructor && (
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      <span>
                        Instructor: {course.instructor.first_name}{" "}
                        {course.instructor.last_name}
                      </span>
                    </div>
                  )}

                  {course?.duration && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span>Duration: {course.duration}</span>
                    </div>
                  )}

                  {course?.modules && (
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-4 w-4 mr-2 text-primary" />
                      <span>Modules: {course.modules.length}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm">
                    <Award className="h-4 w-4 mr-2 text-primary" />
                    <span>Certificate Upon Completion</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">Course Details</h3>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-bold text-xl text-primary">
                      ${parseFloat(course?.price || "0").toFixed(2)}
                    </span>
                  </div>

                  {course?.preview_video_url && (
                    <Button
                      onClick={handleOpenPreviewVideo}
                      variant="outline"
                      className="w-full mb-3"
                    >
                      Watch Preview
                    </Button>
                  )}

                  {user ? (
                    <div className="space-y-3">
                      {/* <Button
                        onClick={handleAddToCart}
                        className="w-full bg-primary text-black hover:bg-primary/90"
                        disabled={addingToCart}
                      >
                        {addingToCart ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding to Cart...
                          </>
                        ) : (
                          "Add to Cart"
                        )}
                      </Button> */}
                      {isEnrolled ? (
                        <Button
                          onClick={() => navigate(`/courses/${courseId}`)}
                          className="w-full"
                        >
                          Go to course
                        </Button>
                      ) : (
                        <Button
                          onClick={handleEnroll}
                          className="w-full"
                          disabled={enrolling}
                        >
                          {enrolling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            "Enroll Now"
                          )}
                        </Button>
                      )}{" "}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* <Button
                        onClick={handleAddToCart}
                        className="w-full bg-primary text-black hover:bg-primary/90"
                        disabled={addingToCart}
                      >
                        {addingToCart ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding to Cart...
                          </>
                        ) : (
                          "Add to Cart"
                        )}
                      </Button> */}

                      <Button asChild variant="outline" className="w-full">
                        <Link href="/auth">Sign In to Enroll</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Course Modules */}
            {course?.modules && course.modules.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Course Curriculum
                </h3>
                <div className="space-y-3">
                  {course.modules.map(
                    (module: CourseModules, index: number) => (
                      <div
                        key={module.id}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3 bg-gray-900">
                          <h4 className="font-medium">
                            Module {index + 1}: {module.title}
                          </h4>
                          {module.lessons && (
                            <Badge variant="outline">
                              {module.lessons.length}{" "}
                              {module.lessons.length === 1
                                ? "Lesson"
                                : "Lessons"}
                            </Badge>
                          )}
                        </div>

                        {module.lessons && module.lessons.length > 0 && (
                          <div className="divide-y divide-border">
                            {module.lessons.map(
                              (lesson: Lesson, lessonIndex: number) => (
                                <div
                                  key={lesson.id}
                                  className="p-3 flex items-center justify-between"
                                >
                                  <div className="flex items-center">
                                    <span className="text-gray-500 mr-2">
                                      {lessonIndex + 1}.
                                    </span>
                                    <span>{lesson.title}</span>
                                  </div>
                                  {lesson.videoUrl && (
                                    <Badge
                                      variant="outline"
                                      className="bg-primary/10"
                                    >
                                      Video
                                    </Badge>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isLoadingCourse && course && (
            <>
              {/* <Button
                onClick={handleAddToCart}
                className="bg-primary text-black hover:bg-primary/90"
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding to Cart...
                  </>
                ) : (
                  "Add to Cart"
                )}
              </Button> */}
              {isEnrolled ? (
                <Button
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className=""
                >
                  Go to course
                </Button>
              ) : (
                <Button
                  onClick={handleEnroll}
                  className=""
                  disabled={enrolling || !user}
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    "Enroll Now"
                  )}
                </Button>
              )}{" "}
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Preview Video Modal */}
      {course?.preview_video_url && (
        <VideoPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          videoUrl={course.preview_video_url}
        />
      )}
    </Dialog>
  );
}
