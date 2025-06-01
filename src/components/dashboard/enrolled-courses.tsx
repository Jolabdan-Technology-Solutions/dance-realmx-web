import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";
import {
  Loader2,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  AlertCircle,
  Eye,
  BookOpen,
  BarChart,
  Brain,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { useAuth } from "../../hooks/use-auth";

// Define the types for enrollments and related entities
interface Module {
  id: number;
  title: string;
  position: number;
  lesson_count: number;
  completed_lessons: number;
}

interface CourseProgress {
  total_modules: number;
  completed_modules: number;
  total_lessons: number;
  completed_lessons: number;
  total_quizzes: number;
  completed_quizzes: number;
  overall_progress: number;
  last_accessed_at?: string;
}

interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  status: string;
  progress: number;
  enrolled_at: string;
  last_accessed_at?: string;
  completed_at?: string;
  course?: {
    id: number;
    title: string;
    description?: string;
    image_url?: string;
    level?: string;
    duration?: string;
    instructor_id?: number;
    instructor?: {
      name: string;
      profile_image_url?: string;
    };
  };
  modules?: Module[];
  course_progress?: CourseProgress;
}

interface Instructor {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

export default function EnrolledCourses() {
  const { user } = useAuth();

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<
    Enrollment[]
  >({
    queryKey: ["/api/enrollments"],
    enabled: !!user,
  });

  // Fetch course progress analytics
  const { data: courseProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/user/course-progress"],
    enabled: !!user,
  });

  // Set up state for which enrollment details to show
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
    number | null
  >(null);

  // Toggle enrollment details
  const toggleEnrollmentDetails = (enrollmentId: number) => {
    if (expandedEnrollmentId === enrollmentId) {
      setExpandedEnrollmentId(null);
    } else {
      setExpandedEnrollmentId(enrollmentId);
    }
  };

  // Get status badge for enrollment
  const getStatusBadge = (enrollment: Enrollment) => {
    if (enrollment.completed_at) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    } else if (enrollment.progress > 0) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Started
        </Badge>
      );
    }
  };

  // Format a date to be more readable
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate days since last accessed
  const getDaysSinceLastAccess = (dateString?: string) => {
    if (!dateString) return "Never";

    const lastAccess = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastAccess.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return `${diffDays} days ago`;
    }
  };

  const isLoading = enrollmentsLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          My Learning Dashboard
        </h2>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-center">
        My Learning Dashboard
      </h2>

      <div className="space-y-6">
        {enrollments.length > 0 ? (
          enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-card text-card-foreground rounded-lg shadow-md overflow-hidden border"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 ">
                {/* Course Image */}
                <div className="md:col-span-1 h-full">
                  <div className="relative h-full min-h-[200px]">
                    <img
                      src={
                        enrollment.course?.image_url ||
                        "/assets/images/placeholder-course.jpg"
                      }
                      alt={enrollment.course?.title || "Course Image"}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        e.currentTarget.src =
                          "/assets/images/placeholder-course.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <Badge className="self-start mb-2">
                        {enrollment.course?.level || "All Levels"}
                      </Badge>
                      <h3 className="text-xl font-bold text-white">
                        {enrollment.course?.title || "Course Title"}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Course Details and Progress */}
                <div className="md:col-span-2 p-6">
                  <div className="flex flex-col h-full">
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(enrollment)}
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Enrolled: {formatDate(enrollment.enrolled_at)}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => toggleEnrollmentDetails(enrollment.id)}
                        variant="outline"
                        size="sm"
                      >
                        {expandedEnrollmentId === enrollment.id
                          ? "Hide Details"
                          : "Show Details"}
                      </Button>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          Course Progress
                        </span>
                        <span className="text-sm">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <BookOpen className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total Modules</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground">Modules</p>
                        <p className="font-bold">
                          {enrollment.course_progress?.total_modules || 0}
                        </p>
                      </div>

                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Completed Modules</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground">
                          Completed
                        </p>
                        <p className="font-bold">
                          {enrollment.course_progress?.completed_modules || 0}
                        </p>
                      </div>

                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Brain className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Quiz Completion</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground">Quizzes</p>
                        <p className="font-bold">
                          {enrollment.course_progress?.completed_quizzes || 0}
                          {enrollment.course_progress?.total_quizzes ? (
                            <span className="text-xs text-muted-foreground">
                              /{enrollment.course_progress.total_quizzes}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Award className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Certificate Status</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground">
                          Certificate
                        </p>
                        <p className="font-bold">
                          {enrollment.completed_at ? "Available" : "Incomplete"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        className="flex-1 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-md"
                        asChild
                      >
                        <Link href={`/courses/${enrollment.course_id}`}>
                          Continue Learning
                        </Link>
                      </Button>

                      {enrollment.completed_at && (
                        <Button variant="outline" className="flex-1" asChild>
                          <Link href={`/certificates/${enrollment.course_id}`}>
                            <Award className="h-4 w-4 mr-2" />
                            View Certificate
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Module Details */}
              {expandedEnrollmentId === enrollment.id && (
                <div className="border-t p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Module Progress
                  </h4>

                  {enrollment.modules && enrollment.modules.length > 0 ? (
                    <div className="space-y-4">
                      {enrollment.modules.map((module) => {
                        const moduleProgress =
                          module.lesson_count > 0
                            ? (module.completed_lessons / module.lesson_count) *
                              100
                            : 0;

                        return (
                          <div
                            key={module.id}
                            className="border p-4 rounded-md"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium">
                                Module {module.position}: {module.title}
                              </h5>
                              <Badge
                                variant={
                                  moduleProgress === 100 ? "default" : "outline"
                                }
                              >
                                {moduleProgress === 100 ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                                    Complete
                                  </>
                                ) : moduleProgress > 0 ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    In Progress
                                  </>
                                ) : (
                                  <div className="border border-gray-100 rounded-full p-3">
                                    <X className="h-3 w-3 mr-1" />
                                    Not Started
                                  </div>
                                )}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm mb-2">
                              <span>
                                {module.completed_lessons} of{" "}
                                {module.lesson_count} lessons completed
                              </span>
                              <Progress
                                value={moduleProgress}
                                className="h-2 flex-1"
                              />
                              <span>{Math.round(moduleProgress)}%</span>
                            </div>

                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/courses/${enrollment.course_id}/modules/${module.id}`}
                              >
                                {moduleProgress === 100
                                  ? "Review Module"
                                  : "Continue Module"}
                              </Link>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8 border rounded-md">
                      <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                      <p>No module information available for this course.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-card text-card-foreground p-12 text-center rounded-lg border">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">
              You're not enrolled in any courses yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Explore our catalog and enroll in courses to start your dance
              education journey. Your enrolled courses will appear here.
            </p>
            <Button
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-md"
              asChild
            >
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
