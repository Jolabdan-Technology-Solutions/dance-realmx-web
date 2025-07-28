import { useEffect, useState } from "react";
import { 
  BookOpen, 
  ShoppingBag, 
  Calendar, 
  Award, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Users,
  BookCheck,
  Loader2,
  RefreshCw,
  ChevronRight,
  Clock,
  Activity,
  UserPlus,
  CircleUser,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart3,
  CalendarDays
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface DashboardStats {
  users: {
    total: number;
    newThisMonth: number;
    byAccountType: {
      FREE: number;
      PREMIUM: number;
      NONE: number;
    };
    subscriptions: Array<{
      id: number;
      user_id: number;
      plan_id: number;
      status: string;
      plan: {
        id: number;
        name: string;
        priceMonthly: string;
        priceYearly: string;
      };
    }>;
  };
  growth: {
    monthly: Array<{
      month: string;
      newUsers: number;
    }>;
  };
  subscriptions?: {
    total: number;
    active: number;
    inactive: number;
    expired: number;
    upgrades: number;
    percentChange: number;
  };
  revenue?: {
    total: number;
    thisMonth: number;
    percentChange: number;
  };
  courses?: {
    total: number;
    published: number;
    enrollments: number;
    percentChange: number;
  };
  certificates?: {
    total: number;
    issuedThisMonth: number;
    percentChange: number;
  };
  resources?: {
    total: number;
    published: number;
    downloads: number;
    percentChange: number;
  };
  bookings?: {
    total: number;
    pending: number;
    completed: number;
    percentChange: number;
  };
}

interface TopInstructor {
  id: number;
  name: string;
  email: string;
  totalEnrollments: number;
  totalCourses: number;
  verified: boolean;
}

interface CourseStatsResponse {
  instructor_courses: any[];
  course_enrollments: Array<{
    course_id: number;
    course_title: string;
    instructor_id: number;
    instructor_name: string;
    total_enrollments: number;
  }>;
  instructor_enrollments: any[];
}

interface RecentActivity {
  id: string;
  type: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  target?: {
    id: number;
    name: string;
    type: string;
  };
  details: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  // State declarations
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [timeRange, setTimeRange] = useState("30days");

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalyticsData, setIsLoadingAnalyticsData] = useState(true);
  const [isErrorAnalyticsData, setIsErrorAnalyticsData] = useState(false);

  // Course stats state
  const [courseStatsData, setCourseStatsData] = useState<CourseStatsResponse | null>(null);
  const [isLoadingCourseStats, setIsLoadingCourseStats] = useState(true);
  const [isErrorCourseStats, setIsErrorCourseStats] = useState(false);

  // Top instructors state
  const [topInstructors, setTopInstructors] = useState<TopInstructor[]>([]);
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);
  const [isErrorInstructors, setIsErrorInstructors] = useState(false);
  const [instructorsError, setInstructorsError] = useState<any>(null);

  // Analytics revenue state
  const [analyticsRevenue, setAnalyticsRevenue] = useState<any>(null);
  const [isLoadingAnalyticsRevenue, setIsLoadingAnalyticsRevenue] = useState(true);
  const [isErrorAnalyticsRevenue, setIsErrorAnalyticsRevenue] = useState(false);
  const [analyticsRevenueError, setAnalyticsRevenueError] = useState<any>(null);

  // Analytics subscriptions state
  const [analyticsSubscriptions, setAnalyticsSubscriptions] = useState<any>(null);
  const [isLoadingAnalyticsSubscriptions, setIsLoadingAnalyticsSubscriptions] = useState(true);

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isErrorActivity, setIsErrorActivity] = useState(false);

  // Fetch functions
  const fetchStats = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await apiRequest<any>(
        "/api/analytics/users",
        { method: "GET", requireAuth: true }
      );
      setStats(res);
    } catch (err) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setIsLoadingAnalyticsData(true);
    setIsErrorAnalyticsData(false);
    try {
      const res = await apiRequest<any>("/api/analytics/users", {
        method: "GET",
        requireAuth: true,
      });
      setAnalyticsData(res);
    } catch (err) {
      setIsErrorAnalyticsData(true);
    } finally {
      setIsLoadingAnalyticsData(false);
    }
  };

  const fetchCourseStats = async () => {
    // Removed: /api/analytics/courses call, endpoint not available

  const fetchTopInstructors = async () => {
    setIsLoadingInstructors(true);
    setIsErrorInstructors(false);
    try {
      const res = await apiRequest<TopInstructor[]>(
        "/api/instructors?limit=4",
        { method: "GET", requireAuth: true }
      );
      setTopInstructors(res);
    } catch (err) {
      setIsErrorInstructors(true);
      setInstructorsError(err);
    } finally {
      setIsLoadingInstructors(false);
    }
  };

  const fetchAnalyticsRevenue = async () => {
    setIsLoadingAnalyticsRevenue(true);
    setIsErrorAnalyticsRevenue(false);
    try {
      const res = await apiRequest<any>("/api/payments/revenue", {
        method: "GET",
        requireAuth: true,
      });
      setAnalyticsRevenue(res);
    } catch (err) {
      setIsErrorAnalyticsRevenue(true);
      setAnalyticsRevenueError(err);
    } finally {
      setIsLoadingAnalyticsRevenue(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAnalyticsData();
    fetchCourseStats();
    fetchTopInstructors();
    fetchAnalyticsRevenue();
  }, []);

  // Helper functions
  const formatCurrency = (amount: number | bigint) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentChange = (change: number | undefined) => {
    if (!change && change !== 0) return null;

    const isPositive = change > 0;
    const isNeutral = change === 0;

    return (
      <span
        className={`text-xs flex items-center ${
          isPositive
            ? "text-green-600"
            : isNeutral
              ? "text-gray-500"
              : "text-red-600"
        }`}
      >
        {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
        {change < 0 && <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const calculateCourseStatsFromEndpoint = () => {
    if (!courseStatsData?.course_enrollments) return null;

    const totalEnrollments = courseStatsData.course_enrollments.reduce(
      (sum, course) => sum + course.total_enrollments, 0
    );
    const totalCourses = courseStatsData.course_enrollments.length;

    // Group by instructor
    const instructorStats = courseStatsData.course_enrollments.reduce((acc, course) => {
      if (!acc[course.instructor_id]) {
        acc[course.instructor_id] = {
          instructor_id: course.instructor_id,
          instructor_name: course.instructor_name,
          total_courses: 0,
          total_enrollments: 0,
        };
      }
      acc[course.instructor_id].total_courses += 1;
      acc[course.instructor_id].total_enrollments += course.total_enrollments;
      return acc;
    }, {} as Record<number, any>);

    const sortedInstructors = Object.values(instructorStats)
      .sort((a: any, b: any) => b.total_enrollments - a.total_enrollments)
      .slice(0, 5);

    const topCourses = courseStatsData.course_enrollments
      .sort((a, b) => b.total_enrollments - a.total_enrollments)
      .slice(0, 10);

    return {
      totalEnrollments,
      totalCourses,
      instructorStats: sortedInstructors,
      topCourses,
    };
  };

  const calculateGrowthPercentage = () => {
    if (
      !analyticsData?.growth?.monthly ||
      analyticsData.growth.monthly.length < 2
    ) {
      return 0;
    }

    const monthlyData = analyticsData.growth.monthly;
    const thisMonth = monthlyData[monthlyData.length - 1]?.newUsers ?? 0;
    const lastMonth = monthlyData[monthlyData.length - 2]?.newUsers ?? 0;

    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return ((thisMonth - lastMonth) / lastMonth) * 100;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "certificate":
        return <Award className="w-4 h-4 text-yellow-500" />;
      case "purchase":
        return <ShoppingBag className="w-4 h-4 text-green-500" />;
      case "booking":
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case "subscription":
        return <CreditCard className="w-4 h-4 text-indigo-500" />;
      case "registration":
        return <UserPlus className="w-4 h-4 text-teal-500" />;
      case "login":
        return <CircleUser className="w-4 h-4 text-gray-500" />;
      case "admin":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAvatarFallback = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };

  const generateRecentActivityFromCourseStats = () => {
    if (!courseStatsData?.course_enrollments) return [];

    const activities: any[] = [];
    const now = new Date();

    courseStatsData.course_enrollments.forEach((course, index) => {
      if (course.total_enrollments > 0) {
        activities.push({
          id: `enrollment-${course.course_id}`,
          type: "enrollment",
          user: {
            id: course.instructor_id,
            name: course.instructor_name,
            avatar: null,
          },
          target: {
            id: course.course_id,
            name: course.course_title,
            type: "course",
          },
          timestamp: new Date(
            now.getTime() - index * 2 * 60 * 60 * 1000
          ).toISOString(),
          details: `received ${course.total_enrollments} enrollment${course.total_enrollments > 1 ? "s" : ""} for`,
        });

        if (course.total_enrollments >= 2) {
          activities.push({
            id: `course-creation-${course.course_id}`,
            type: "admin",
            user: {
              id: course.instructor_id,
              name: course.instructor_name,
              avatar: null,
            },
            target: {
              id: course.course_id,
              name: course.course_title,
              type: "course",
            },
            timestamp: new Date(
              now.getTime() - (index + 5) * 3 * 60 * 60 * 1000
            ).toISOString(),
            details: "published course",
          });
        }
      }
    });

    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 8);
  };

  // Calculate derived values
  const totalUsers = analyticsData?.users?.total || 0;
  const newUsersThisMonth = analyticsData?.users?.newThisMonth || 0;
  const userGrowthPercentage = calculateGrowthPercentage();
  const courseStatsCalculated = calculateCourseStatsFromEndpoint();
  const courseStatsRecentActivity = generateRecentActivityFromCourseStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400">
            Welcome to the admin dashboard and analytics overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchStats()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAnalyticsData ? (
                <Loader2 className="inline h-5 w-5 animate-spin" />
              ) : isErrorAnalyticsData ? (
                <span className="text-red-400">Error</span>
              ) : (
                totalUsers.toLocaleString()
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {isLoadingAnalyticsData
                  ? "Loading..."
                  : `${newUsersThisMonth.toLocaleString()} new this month`}
              </p>
              <div className="text-xs text-muted-foreground">
                {isLoadingAnalyticsData ? (
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                ) : (
                  formatPercentChange(userGrowthPercentage)
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Course Enrollments
            </CardTitle>
            <BookCheck className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingCourseStats ? (
                <Loader2 className="inline h-5 w-5 animate-spin" />
              ) : isErrorCourseStats ? (
                <span className="text-red-500">Error</span>
              ) : (
                courseStatsCalculated?.totalEnrollments?.toLocaleString() || "0"
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {isLoadingCourseStats
                  ? "Loading..."
                  : `${courseStatsCalculated?.totalCourses || 0} total courses`}
              </p>
              {!isLoadingCourseStats &&
                !isErrorCourseStats &&
                formatPercentChange(0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAnalyticsRevenue ? (
                <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
              ) : isErrorAnalyticsRevenue ? (
                <span className="text-red-500">Error</span>
              ) : (
                formatCurrency(analyticsRevenue?.total || 0)
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {isLoadingAnalyticsRevenue ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-20 rounded"></div>
                ) : isErrorAnalyticsRevenue ? (
                  "-- this month"
                ) : (
                  `${formatCurrency(analyticsRevenue?.thisMonth || 0)} this month`
                )}
              </p>
              {!isLoadingAnalyticsRevenue &&
                !isErrorAnalyticsRevenue &&
                formatPercentChange(analyticsRevenue?.percentChange || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subscriptions
            </CardTitle>
            <CreditCard className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAnalyticsSubscriptions ? (
                <Loader2 className="inline h-5 w-5 animate-spin" />
              ) : analyticsSubscriptions?.total !== undefined ? (
                analyticsSubscriptions.total.toLocaleString()
              ) : (
                "0"
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {analyticsSubscriptions && (
                <>
                  {analyticsSubscriptions.active} active,{" "}
                  {analyticsSubscriptions.inactive} inactive
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest course enrollments and instructor activities
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="space-y-2">
                  {isLoadingCourseStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isErrorCourseStats ? (
                    <div className="p-4 rounded-md bg-red-900/20 text-center">
                      <p className="text-sm text-red-400">
                        Error loading activity data
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.reload()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : courseStatsRecentActivity.length === 0 ? (
                    <div className="p-4 rounded-md bg-gray-800/50 text-center">
                      <p className="text-sm text-gray-400">
                        No recent course activity available
                      </p>
                    </div>
                  ) : (
                    courseStatsRecentActivity.map((activity, index) => (
                      <div
                        key={`course-activity-${activity.id || index}`}
                        className="flex items-start p-2 rounded-lg hover:bg-gray-800/50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 mr-3">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-medium">
                              {activity.user?.name || "User"}
                            </span>
                            <span className="text-gray-400">
                              {activity.details}
                            </span>
                            {activity.target?.name && (
                              <span className="font-medium text-blue-400">
                                {activity.target.name}
                              </span>
                            )}
                            {activity.target?.type === "course" && (
                              <Badge variant="outline" className="text-xs">
                                Course
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 p-4">
                <Link
                  href="/admin/activity"
                  className="text-sm text-blue-500 hover:underline flex items-center"
                >
                  View all activity
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Instructors by Enrollments</CardTitle>
                <CardDescription>
                  Instructors with the most course enrollments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingCourseStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isErrorCourseStats ? (
                    <div className="p-4 rounded-md bg-red-900/20 text-center">
                      <p className="text-sm text-red-400">
                        Error loading instructor data
                      </p>
                    </div>
                  ) : !courseStatsCalculated?.instructorStats?.length ? (
                    <div className="p-4 rounded-md bg-gray-800/50 text-center">
                      <p className="text-sm text-gray-400">
                        No instructor data available
                      </p>
                    </div>
                  ) : (
                    courseStatsCalculated.instructorStats.map(
                      (instructor, index) => (
                        <div
                          key={`instructor-stats-${instructor.instructor_id}`}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-9 w-9 mr-3">
                              <AvatarFallback>
                                {getAvatarFallback(instructor.instructor_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {instructor.instructor_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {instructor.total_courses} courses
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {instructor.total_enrollments} enrollments
                            </div>
                            <div className="text-xs text-gray-400">
                              Avg:{" "}
                              {Math.round(
                                instructor.total_enrollments /
                                  instructor.total_courses
                              )}{" "}
                              per course
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 p-4">
                <Link
                  href="/admin/instructors"
                  className="text-sm text-blue-500 hover:underline flex items-center"
                >
                  View all instructors
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Courses by Enrollment</CardTitle>
              <CardDescription>
                Courses with the highest enrollment numbers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingCourseStats ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : isErrorCourseStats ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      Unable to load course enrollment data
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : !courseStatsCalculated?.topCourses?.length ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      No course enrollment data available
                    </p>
                  </div>
                ) : (
                  courseStatsCalculated.topCourses.map((course, index) => (
                    <div
                      key={`course-stats-${course.course_id}`}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 mr-3 flex-shrink-0">
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {course.course_title}
                            </div>
                            <div className="text-xs text-gray-400">
                              by {course.instructor_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {course.total_enrollments} enrollments
                          </div>
                          <div className="text-xs text-gray-400">
                            Course ID: {course.course_id}
                          </div>
                        </div>
                      </div>
                      {index < courseStatsCalculated.topCourses.length - 1 && (
                        <Separator className="bg-gray-800" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-700 p-4">
              <Link
                href="/admin/courses"
                className="text-sm text-blue-500 hover:underline flex items-center"
              >
                View all courses
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>
                  Overview of all courses on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Courses</p>
                    <div className="text-2xl font-bold">
                      {isLoadingCourseStats ? (
                        <Loader2 className="inline h-5 w-5 animate-spin" />
                      ) : isErrorCourseStats ? (
                        <span className="text-red-500">Error</span>
                      ) : (
                        courseStatsCalculated?.totalCourses?.toLocaleString() || "0"
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Enrollments</p>
                    <div className="text-2xl font-bold">
                      {isLoadingCourseStats ? (
                        <Loader2 className="inline h-5 w-5 animate-spin" />
                      ) : isErrorCourseStats ? (
                        <span className="text-red-500">Error</span>
                      ) : (
                        courseStatsCalculated?.totalEnrollments?.toLocaleString() || "0"
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">
                      Avg Enrollments per Course
                    </p>
                    <div className="text-2xl font-bold">
                      {isLoadingCourseStats ? (
                        <Loader2 className="inline h-5 w-5 animate-spin" />
                      ) : isErrorCourseStats ? (
                        <span className="text-red-500">Error</span>
                      ) : courseStatsCalculated?.totalCourses &&
                        courseStatsCalculated?.totalEnrollments ? (
                        Math.round(
                          courseStatsCalculated.totalEnrollments /
                            courseStatsCalculated.totalCourses
                        )
                      ) : (
                        "0"
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">
                      Courses with Enrollments
                    </p>
                    <div className="text-2xl font-bold">
                      {isLoadingCourseStats ? (
                        <Loader2 className="inline h-5 w-5 animate-spin" />
                      ) : isErrorCourseStats ? (
                        <span className="text-red-500">Error</span>
                      ) : (
                        courseStatsData?.course_enrollments?.filter(
                          (course) => course.total_enrollments > 0
                        ).length || 0
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Courses with Enrollments</span>
                    <span>
                      {isLoadingCourseStats ? (
                        <Loader2 className="inline h-3 w-3 animate-spin" />
                      ) : isErrorCourseStats ? (
                        "--"
                      ) : courseStatsCalculated?.totalCourses &&
                        courseStatsCalculated?.totalCourses > 0 ? (
                        `${Math.round(((courseStatsData?.course_enrollments?.filter((course) => course.total_enrollments > 0).length || 0) / courseStatsCalculated.totalCourses) * 100)}%`
                      ) : (
                        "0%"
                      )}
                    </span>
                  </div>
                  <Progress
                    value={
                      isLoadingCourseStats ||
                      isErrorCourseStats ||
                      !courseStatsCalculated?.totalCourses
                        ? 0
                        : ((courseStatsData?.course_enrollments?.filter(
                            (course) => course.total_enrollments > 0
                          ).length || 0) /
                            courseStatsCalculated.totalCourses) *
                          100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/courses">
                  <Button variant="outline" className="w-full">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Manage Courses
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificate Overview</CardTitle>
                <CardDescription>
                  Overview of certificates issued to students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Certificates</p>
                    <p className="text-2xl font-bold">
                      {stats?.certificates?.total || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Issued This Month</p>
                    <p className="text-2xl font-bold">
                      {stats?.certificates?.issuedThisMonth || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats?.certificates?.percentChange)}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/certificates">
                  <Button variant="outline" className="w-full">
                    <Award className="w-4 h-4 mr-2" />
                    Manage Certificates
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Overview</CardTitle>
                <CardDescription>
                  Overview of all users on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingAnalyticsData ? (
                    <Loader2 className="inline h-5 w-5 animate-spin" />
                  ) : isErrorAnalyticsData ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    totalUsers.toLocaleString()
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    {isLoadingAnalyticsData
                      ? "Loading..."
                      : `${newUsersThisMonth.toLocaleString()} new this month`}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {isLoadingAnalyticsData ? (
                      <Loader2 className="inline h-3 w-3 animate-spin" />
                    ) : (
                      formatPercentChange(userGrowthPercentage)
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
                <CardDescription>
                  Overview of user subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">
                      Active Subscriptions
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.subscriptions?.active || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">
                      Expired Subscriptions
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.subscriptions?.expired || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Recent Upgrades</p>
                    <p className="text-2xl font-bold">
                      {stats?.subscriptions?.upgrades || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats?.subscriptions?.percentChange)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Active vs Expired</span>
                    <span>
                      {Math.round(
                        ((stats?.subscriptions?.active || 0) /
                          ((stats?.subscriptions?.active || 0) +
                            (stats?.subscriptions?.expired || 0))) *
                          100
                      ) || 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      ((stats?.subscriptions?.active || 0) /
                        ((stats?.subscriptions?.active || 0) +
                          (stats?.subscriptions?.expired || 0))) *
                        100 || 0
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/subscription-plans">
                  <Button variant="outline" className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscriptions
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Overview of platform revenue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats?.revenue?.total || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">This Month</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats?.revenue?.thisMonth || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats?.revenue?.percentChange || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Sales</CardTitle>
                <CardDescription>
                  Overview of resource sales and downloads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Resources</p>
                    <p className="text-2xl font-bold">
                      {stats?.resources?.total || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Published Resources</p>
                    <p className="text-2xl font-bold">
                      {stats?.resources?.published || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Downloads</p>
                    <p className="text-2xl font-bold">
                      {stats?.resources?.downloads || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(
                        stats?.resources?.percentChange || 0
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/resources">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Resources
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Overview</CardTitle>
              <CardDescription>Overview of lesson bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold">
                    {stats?.bookings?.total || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Pending Bookings</p>
                  <p className="text-2xl font-bold">
                    {stats?.bookings?.pending || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Completed Bookings</p>
                  <p className="text-2xl font-bold">
                    {stats?.bookings?.completed || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Growth</p>
                  <div className="text-2xl font-bold flex items-center">
                    {formatPercentChange(stats?.bookings?.percentChange || 0)}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Completed vs Total</span>
                  <span>
                    {Math.round(
                      ((stats?.bookings?.completed || 0) /
                        (stats?.bookings?.total || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    ((stats?.bookings?.completed || 0) /
                      (stats?.bookings?.total || 1)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/admin/bookings">
                <Button variant="outline" className="w-full">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Manage Bookings
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}