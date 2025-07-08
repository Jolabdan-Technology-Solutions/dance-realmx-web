import React, { useEffect, useState } from "react";
import {
  Lock,
  Loader2,
  Star,
  Users,
  Clock,
  BarChart3,
  Play,
  CheckCircle,
  BookOpen,
  Video,
  ChevronDown,
  ChevronRight,
  Calendar,
  Hash,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useSearchParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "wouter/use-browser-location";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: number;
  title: string;
  content?: string;
  description?: string;
  video_url?: string;
  order_index: number;
  order?: number;
  duration?: string;
  created_at?: string;
  updated_at?: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  lessons?: Lesson[];
  order_index: number;
}

interface VideoPreviewModalProps {
  videoUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  previewDuration: number;
}

// Helper function to extract YouTube video ID from various YouTube URL formats
const extractYouTubeId = (url: string): string => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
};

const VideoPreviewModal = ({
  videoUrl,
  isOpen,
  onClose,
  previewDuration,
}: VideoPreviewModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Course Preview ({previewDuration}s)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="aspect-video bg-gray-200 rounded overflow-hidden">
          {videoUrl &&
          (videoUrl.includes("youtube.com") ||
            videoUrl.includes("youtu.be")) ? (
            <iframe
              src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}?autoplay=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl || undefined}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface Course {
  id: number;
  title: string;
  description?: string;
  detailed_description?: string;
  price: string;
  duration?: string;
  difficulty_level?: string;
  image_url?: string;
  preview_video_url?: string;
  video_url?: string;
  enrollment_count: number;
  average_rating: number;
  modules: Module[];
  categories: Array<{ id: number; name: string }>;
  tags: any[];
  reviews: any[];
  instructor?: {
    first_name?: string;
    last_name?: string;
  };
}

export default function CourseDetailsPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(
    new Set()
  );
  const queryClient = useQueryClient();

  const { id } = useParams();

  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const sessionId = searchParams.get("session_id");
  const { toast } = useToast();
  const { user } = useAuth();

  const validId = courseId ? courseId : id;

  const [isEnrolled, setIsEnrolled] = useState(false);

  // Add debugging
  console.log(
    "Component render - validId:",
    validId,
    "loading:",
    loading,
    "course:",
    course
  );

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleLesson = (lessonId: number) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const isModuleExpanded = (moduleId: number) => expandedModules.has(moduleId);
  const isLessonExpanded = (lessonId: number) => expandedLessons.has(lessonId);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user?.id || !validId) return;
      try {
        const response = await apiRequest(`/api/courses/enrollment/me`, {
          method: "GET",
        });
        const enrolled = response?.courses?.some(
          (course: any) =>
            course.course.id === Number(validId) &&
            course.enrollment.status === "ACTIVE"
        );
        setIsEnrolled(enrolled);
      } catch (error) {
        console.error("Error checking enrollment:", error);
      }
    };
    checkEnrollment();
  }, [user?.id, validId]);

  const fetchCourse = async () => {
    setLoading(true);
    setError(null);
    const currentValidId = courseId || id;

    console.log("fetchCourse called with validId:", currentValidId);

    if (!currentValidId) {
      console.log("No valid ID found");
      setLoading(false);
      setError("No course ID provided");
      return;
    }

    try {
      console.log("Making API request to:", `/api/courses/${currentValidId}`);
      const response = await apiRequest(`/api/courses/${currentValidId}`, {
        method: "GET",
      });

      console.log("API response received:", response);

      if (response) {
        setCourse(response);
      } else {
        console.error("No response data received");
        setError("No course data received");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      setError("Failed to fetch course data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id, courseId]);

  // Verify payment if session_id is present
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !courseId) return;

      try {
        const response = await apiRequest(`/api/courses/verify-payment`, {
          method: "POST",
          data: {
            sessionId,
            courseId,
          },
        });

        if (response) {
          toast({
            title: "Payment Successful",
            description: "You have successfully enrolled in this course.",
          });

          fetchCourse();

          navigate(`/courses/${validId}`);
          // Invalidate course query to refresh enrollment status
          queryClient.invalidateQueries({
            queryKey: [`/api/courses/${courseId}`],
          });

          window.location.reload();
        } else {
          const error = await response;
          throw new Error(error.message || "Payment verification failed");
        }
      } catch (error: any) {
        toast({
          title: "Payment Verification Failed",
          description:
            error.message || "There was an error verifying your payment.",
          variant: "destructive",
        });
      }
    };

    verifyPayment();
  }, [sessionId, courseId]);

  // Safe array access - moved inside component body with better error handling
  const modules = React.useMemo(() => {
    return Array.isArray(course?.modules) ? course.modules : [];
  }, [course?.modules]);

  const categories = React.useMemo(() => {
    return Array.isArray(course?.categories) ? course.categories : [];
  }, [course?.categories]);

  const tags = React.useMemo(() => {
    return Array.isArray(course?.tags) ? course.tags : [];
  }, [course?.tags]);

  const reviews = React.useMemo(() => {
    return Array.isArray(course?.reviews) ? course.reviews : [];
  }, [course?.reviews]);

  const category = categories[0];
  const imageUrl = course?.image_url || "/api/placeholder/800/400";

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        `/api/courses/enroll-course/${courseId}`,
        {
          method: "POST",
          data: {
            userId: user?.id,
          },
        }
      );

      if (!response) {
        throw new Error("Failed to create checkout session");
      }

      console.log("response from course enroll", response);

      const { url } = response;
      window.location.href = url;
      return response;
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

  const handleAddToCart = async () => {
    if (isInCart) return;

    try {
      setAddingToCart(true);
      // Simulate adding to cart
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsInCart(true);
      alert("Course added to cart!");
    } finally {
      setAddingToCart(false);
    }
  };

  const convertToYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    );
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-cyan-500" />
          <p className="text-gray-600 text-lg">Loading course details...</p>
          <p className="text-gray-400 text-sm mt-2">Course ID: {validId}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg">{error}</p>
          <p className="text-gray-600 mb-4">Course ID: {validId}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show error state if course is null after loading
  if (!loading && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">Course not found</p>
          <p className="text-gray-400 mb-4">Course ID: {validId}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Don't render anything if we don't have course data yet
  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Image Banner */}
      <div
        className="h-[40vh] bg-center bg-cover flex items-end relative"
        style={{
          backgroundImage: `url('${imageUrl}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="relative z-10 w-full p-6">
          <div className="container mx-auto text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {course?.title}
            </h1>
            {category && (
              <span className="bg-cyan-400 text-black px-3 py-1 rounded-full text-sm font-bold inline-block">
                {category.name}
              </span>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {course?.enrollment_count} students
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {course?.duration}
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                {course?.difficulty_level}
              </span>

              {course?.average_rating && course?.average_rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {course?.average_rating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Course Information */}
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              About This Course
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {course?.detailed_description ||
                course?.description ||
                "No description available for this course."}
            </p>

            {/* Course Video Section */}
            {(course?.preview_video_url || course?.video_url) && (
              <div className="mt-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  Course Video
                </h2>

                <div>
                  {/* Show the appropriate video based on enrollment status */}
                  {isEnrolled && course?.video_url ? (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-300 shadow-lg">
                      <iframe
                        src={convertToYouTubeEmbedUrl(course?.video_url)}
                        title="Full Course Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : course?.preview_video_url ? (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-300 shadow-lg relative group">
                      <iframe
                        src={convertToYouTubeEmbedUrl(
                          course?.preview_video_url
                        )}
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
                          className="bg-white/20 text-black backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                          onClick={() => setIsPreviewModalOpen(true)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Watch 15s Preview
                        </Button>
                      </div>
                    </div>
                  ) : course?.video_url && !isEnrolled ? (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center p-6 text-center border border-gray-300 shadow-lg">
                      <div>
                        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2 text-gray-900">
                          Course Video Locked
                        </h3>
                        <p className="mb-4 text-gray-600">
                          Enroll in this course to access the full instructional
                          video.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            className="bg-cyan-400 text-black hover:bg-cyan-500"
                            onClick={handleEnroll}
                          >
                            Enroll Now
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsPreviewModalOpen(true)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Watch 15s Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Preview option below the video - only show if not enrolled */}
                  {!isEnrolled && course?.preview_video_url && (
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-gray-600">
                        Preview available for all users
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Watch 15s Preview
                      </Button>
                    </div>
                  )}
                </div>

                {/* Preview Modal */}
                <VideoPreviewModal
                  videoUrl={
                    previewVideoUrl ||
                    course?.preview_video_url ||
                    course?.video_url ||
                    null
                  }
                  isOpen={isPreviewModalOpen}
                  onClose={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewVideoUrl(null);
                  }}
                  previewDuration={15}
                />
              </div>
            )}

            <Separator className="my-8" />

            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              What You'll Learn
            </h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Vocal texture development and improvement techniques
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Professional vocal quality enhancement methods
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Intelligent discoveries in vocal improvement
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Foundational vocal techniques for beginners
                </span>
              </li>
            </ul>

            {/* Course Modules */}
            <Separator className="my-8" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Course Content
            </h2>

            {modules.length === 0 ? (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  No modules have been added to this course yet. Course content
                  will be available after enrollment.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {modules.map((module: Module, index: number) => (
                  <div
                    key={module.id || index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isModuleExpanded(module.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <h3 className="font-medium text-gray-900">
                            <span className="text-cyan-600 mr-2">
                              {index + 1}.
                            </span>
                            {module.title || "Untitled Module"}
                          </h3>
                        </div>
                        {module.lessons && module.lessons.length > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-cyan-50 text-cyan-700 border-cyan-200"
                          >
                            {module.lessons.length}{" "}
                            {module.lessons.length === 1 ? "Lesson" : "Lessons"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Module {index + 1}
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-gray-700 text-sm mb-3">
                        {module.description ||
                          "No description available for this module."}
                      </p>

                      {/* Lessons within the module - only show if expanded */}
                      {isModuleExpanded(module.id) &&
                        module.lessons &&
                        module.lessons.length > 0 && (
                          <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Lessons in this module:
                            </h4>
                            <div className="space-y-2">
                              {module.lessons
                                .sort(
                                  (a, b) =>
                                    (a.order_index || a.order || 0) -
                                    (b.order_index || b.order || 0)
                                )
                                .map((lesson: Lesson, lessonIndex: number) => (
                                  <div
                                    key={lesson.id}
                                    className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                                  >
                                    {/* Lesson Header - Clickable */}
                                    <div
                                      className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                      onClick={() => toggleLesson(lesson.id)}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            {isLessonExpanded(lesson.id) ? (
                                              <ChevronDown className="w-4 h-4 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-gray-500" />
                                            )}
                                            <div className="flex items-center justify-center w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium flex-shrink-0">
                                              {lessonIndex + 1}
                                            </div>
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="text-sm font-semibold text-gray-900 mb-1">
                                              {lesson.title}
                                            </h5>
                                            {(lesson.description ||
                                              lesson.content) && (
                                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                                {lesson.description ||
                                                  lesson.content}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {lesson.video_url && (
                                            <Badge
                                              variant="outline"
                                              className="bg-green-50 text-green-700 border-green-200 text-xs"
                                            >
                                              <Video className="w-3 h-3 mr-1" />
                                              Video
                                            </Badge>
                                          )}
                                          {lesson.duration && (
                                            <Badge
                                              variant="outline"
                                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                            >
                                              <Clock className="w-3 h-3 mr-1" />
                                              {lesson.duration}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Additional lesson details */}
                                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                                        <div className="flex items-center gap-4">
                                          <span className="flex items-center gap-1">
                                            <Hash className="w-3 h-3" />
                                            ID: {lesson.id}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <BarChart3 className="w-3 h-3" />
                                            Order:{" "}
                                            {lesson.order_index ||
                                              lesson.order ||
                                              lessonIndex + 1}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {lesson.created_at && (
                                            <span className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              Created:{" "}
                                              {new Date(
                                                lesson.created_at
                                              ).toLocaleDateString()}
                                            </span>
                                          )}
                                          {lesson.updated_at &&
                                            lesson.updated_at !==
                                              lesson.created_at && (
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Updated:{" "}
                                                {new Date(
                                                  lesson.updated_at
                                                ).toLocaleDateString()}
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Lesson Content - Only show if expanded */}
                                    {isLessonExpanded(lesson.id) && (
                                      <div className="p-4 bg-white border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                                        {/* Lesson Video */}
                                        {lesson.video_url && (
                                          <div className="mb-4">
                                            <h6 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                              <Video className="w-4 h-4 text-green-600" />
                                              Lesson Video
                                            </h6>
                                            <div className="aspect-video rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                                              <iframe
                                                src={convertToYouTubeEmbedUrl(
                                                  lesson.video_url
                                                )}
                                                title={`${lesson.title} - Video`}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {/* Lesson Content */}
                                        {(lesson.content ||
                                          lesson.description) && (
                                          <div className="mb-4">
                                            <h6 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                              <BookOpen className="w-4 h-4 text-blue-600" />
                                              Lesson Content
                                            </h6>
                                            <div className="prose prose-sm max-w-none">
                                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {lesson.content ||
                                                  lesson.description}
                                              </p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Lesson Actions */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="text-xs"
                                              onClick={() => {
                                                // Navigate to lesson page or open in new tab
                                                window.open(
                                                  `/lesson/${course?.id}`,
                                                  "_blank"
                                                );
                                              }}
                                            >
                                              <Play className="w-3 h-3 mr-1" />
                                              Start Lesson
                                            </Button>
                                            {lesson.video_url && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                  // Open video in modal
                                                  setPreviewVideoUrl(
                                                    lesson?.video_url || null
                                                  );
                                                  setIsPreviewModalOpen(true);
                                                }}
                                              >
                                                <Video className="w-3 h-3 mr-1" />
                                                Watch Video
                                              </Button>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Lesson {lessonIndex + 1} of{" "}
                                            {module.lessons?.length || 0}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Instructor Info */}
            <Separator className="my-8" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Instructor
            </h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-gray-600">
                  {course?.instructor?.first_name?.[0]}
                  {course?.instructor?.last_name?.[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {course?.instructor?.first_name}{" "}
                  {course?.instructor?.last_name}
                </h3>
                <p className="text-gray-600 text-sm">Course Instructor</p>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="lg:w-1/3">
            <Card className="bg-white border-gray-200 sticky top-6">
              <CardContent>
                <h3 className="text-xl font-bold mb-6 text-gray-900">
                  Course Details
                </h3>

                <div className="mb-6">
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold text-2xl text-gray-900">
                      ${Number(course?.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-900">{course?.duration}</span>
                  </div>

                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Level:</span>
                    <span className="text-gray-900 capitalize">
                      {course?.difficulty_level}
                    </span>
                  </div>

                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Category:</span>
                    <span className="text-gray-900">
                      {category?.name || "Uncategorized"}
                    </span>
                  </div>

                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Students:</span>
                    <span className="text-gray-900">
                      {course?.enrollment_count}
                    </span>
                  </div>

                  <div className="flex justify-between py-3">
                    <span className="text-gray-600">Course ID:</span>
                    <span className="text-gray-900">{course?.id}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-cyan-400 text-black hover:bg-cyan-500 font-semibold py-3 mb-3"
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
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3"
                    onClick={() => navigate("/my-courses")}
                  >
                    Go to Your Dashboard
                  </Button>
                )}

                {course?.average_rating && course?.average_rating > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {course?.average_rating}
                        </span>
                      </div>
                    </div>
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
