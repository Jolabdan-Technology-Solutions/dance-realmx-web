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
import { apiRequest } from "@/lib/queryClient";

interface Course {
  id: number;
  title: string;
  short_name: string;
  duration: string;
  difficulty_level: string;
  description: string;
  detailed_description: string;
  price: number;
  image_url: string;
  visible: boolean;
  instructor_id: number;
  preview_video_url: string;
  video_url: string;
  created_at: string;
  updated_at: string;
  instructor: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image_url: string;
  };
  categories: {
    id: number;
    name: string;
  }[];
}

interface Enrollment {
  id: number;
  status: string;
  enrolled_at: string;
  progress: number;
}

interface EnrolledCourse {
  enrollment: Enrollment;
  course: Course;
}

interface EnrollmentsResponse {
  courses: EnrolledCourse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  summary: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
}

export default function EnrolledCourses() {
  const { user } = useAuth();

  // Fetch enrollments
  const { data: enrollmentsData, isLoading: enrollmentsLoading } =
    useQuery<EnrollmentsResponse>({
      queryKey: ["/api/courses/enrollment/me"],
      queryFn: async () => {
        const response = await apiRequest("/api/courses/enrollment/me", {
          method: "GET",
          requireAuth: true,
        });
        return response;
      },
      enabled: !!user,
    });

  const enrollments = enrollmentsData?.courses || [];

  // Set up state for which enrollment details to show
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
    number | null
  >(null);

  // Toggle enrollment details
  const toggleEnrollmentDetails = (enrollmentId: number) => {
    setExpandedEnrollmentId(
      expandedEnrollmentId === enrollmentId ? null : enrollmentId
    );
  };

  // Get status badge for enrollment
  const getStatusBadge = (enrollment: Enrollment) => {
    switch (enrollment.status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            {enrollment.status}
          </Badge>
        );
    }
  };

  // Format a date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (enrollmentsLoading) {
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
          enrollments.map(({ enrollment, course }) => (
            <div
              key={enrollment.id}
              className="bg-card text-card-foreground rounded-lg shadow-md overflow-hidden border"
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Course Image */}
                <div className="md:col-span-1 h-full">
                  <div className="relative h-full min-h-[200px]">
                    <img
                      src={
                        course.image_url ||
                        "/assets/images/placeholder-course.jpg"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        e.currentTarget.src =
                          "/assets/images/placeholder-course.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <Badge className="self-start mb-2">
                        {course.difficulty_level}
                      </Badge>
                      <h3 className="text-xl font-bold text-white">
                        {course.title}
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

                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        className="flex-1 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-md"
                        asChild
                      >
                        <Link href={`/courses/${course.id}`}>
                          Continue Learning
                        </Link>
                      </Button>

                      {enrollment.status === "COMPLETED" && (
                        <Button variant="outline" className="flex-1" asChild>
                          <Link href={`/certificates/${course.id}`}>
                            <Award className="h-4 w-4 mr-2" />
                            View Certificate
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
