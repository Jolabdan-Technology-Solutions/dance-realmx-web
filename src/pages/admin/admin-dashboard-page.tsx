import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BarChart3,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Activity,
  BookCheck,
  ShoppingBag,
  Calendar,
  Clock,
  Sparkles,
  UserPlus,
  Award,
  CircleUser,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    percentChange: number;
  };
  courses: {
    total: number;
    published: number;
    enrollments: number;
    percentChange: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    percentChange: number;
    currency: string;
  };
  resources: {
    total: number;
    published: number;
    downloads: number;
    percentChange: number;
  };
  subscriptions: {
    active: number;
    expired: number;
    upgrades: number;
    percentChange: number;
  };
  bookings: {
    total: number;
    pending: number;
    completed: number;
    percentChange: number;
  };
  certificates: {
    total: number;
    issuedThisMonth: number;
    percentChange: number;
  };
}

interface RecentActivity {
  id: number;
  type: string;
  user: {
    id: number;
    name: string;
    avatar: string | null;
  };
  target?: {
    id: number;
    name: string;
    type: string;
  };
  timestamp: string;
  details?: string;
}

interface PopularCourse {
  id: number;
  title: string;
  enrollments: number;
  completionRate: number;
  instructorName: string;
  imageUrl: string | null;
}

interface TopInstructor {
  id: number;
  name: string;
  avatar: string | null;
  students: number;
  courses: number;
  verified: boolean;
  earnings: number;
}




interface SubscriptionType {
  id: number;
  user_id: number;
  plan_id: number;
  stripe_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  frequency: string;
  stripe_session_id: string;
  status: string;
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string[];
    // ... other user properties
  };
}

interface AnalyticsResponse {
  userStats: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      ADMIN: number;
      STUDENT: number;
      INSTRUCTOR_ADMIN: number;
      CURRICULUM_SELLER: number;
      GUEST_USER: number;
    };
    byTier: {
      FREE: number;
    };
    byAccountType: {
      NONE: number;
    };
  };
  revenue: {
    subscriptions: number;
    subscriptionAnalytics: Array<{
      _count: number;
      _sum: {
        plan_id: number;
      };
      plan_id: number;
      status: string;
      plan: {
        id: number;
        name: string;
        priceMonthly: string;
        priceYearly: string;
      };
    }>;
    courses: number;
    resources: number;
    total: number;
  };
  growth: {
    monthly: Array<{
      month: string;
      newUsers: number;
    }>;
  };
}

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState("7days");


   // Fetch analytics users
  const {
  data: analyticsData,
  isLoading: isLoadingAnalyticsData,
  isError: isErrorAnalyticsData,
  error: analyticsDataError,
} = useQuery({
  queryKey: ["/analytics/users"],
  queryFn: () =>
    apiRequest<AnalyticsResponse>("/api/analytics/users", {
      method: "GET",
      requireAuth: true,
    }),
  retry: 3,
  staleTime: 5 * 60 * 1000,
});


// Fetch subscriptions
const {
  data: subscriptionsData,
  isLoading: isLoadingAnalyticsSubscriptions,
  isError: isErrorAnalyticsSubscriptions,
  error: analyticsSubscriptionsError,
} = useQuery({
  queryKey: ["/subscriptions"],
  queryFn: () =>
    apiRequest<Array<{
      id: number;
      user_id: number;
      plan_id: number;
      status: string;
      frequency: string;
      // ... other subscription properties
    }>>("/api/subscriptions", {
      method: "GET",
      requireAuth: true,
    }),
});


//Get all courses
const {
  data: analyticsCourses,
  isLoading: isLoadingAnalyticsCourses,
  isError: isErrorAnalyticsCourses,
  error: analyticsCoursesError,
} = useQuery({
  queryKey: ["/analytics/courses"],
  queryFn: () =>
    apiRequest<{
      data: Array<{
        id: number;
        title: string;
        short_name: string;
        duration: string;
        difficulty_level: string;
        price: number;
        visible: boolean;
        instructor_id: number;
        enrollment_count: number;
        average_rating: number;
        _count: {
          enrollments: number;
        };
      }>;
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/api/courses", {
      method: "GET",
      requireAuth: true,
    }),
});



  // Fetch dashboard stats
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats", timeRange],
    queryFn: async () => {
      const res = await apiRequest(`/api/admin/stats?range=${timeRange}`, {
        method: "GET",
        requireAuth: true,
      });
      return res;
    },
  });

  // Fetch recent activity
  const {
    data: recentActivity = [],
    isLoading: isLoadingActivity,
    isError: isErrorActivity,
    error: activityError,
  } = useQuery<RecentActivity[]>({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/activity?limit=8", {
        method: "GET",
        requireAuth: true,
      });
      return res;
    },
  });

  // Fetch popular courses
  const {
    data: popularCourses = [],
    isLoading: isLoadingCourses,
    isError: isErrorCourses,
    error: coursesError,
  } = useQuery<PopularCourse[]>({
    queryKey: ["/api/admin/courses/popular"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/courses/popular?limit=5", {
        method: "GET",
        requireAuth: true,
      });
      return res;
    },
  });

  // Fetch top instructors
  const {
    data: topInstructors = [],
    isLoading: isLoadingInstructors,
    isError: isErrorInstructors,
    error: instructorsError,
  } = useQuery<TopInstructor[]>({
    queryKey: ["/api/admin/instructors/top"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/instructors/top?limit=4", {
        method: "GET",
        requireAuth: true,
      });
      return res;
    },
  });

  const {
  data: analyticsRevenue,
  isLoading: isLoadingAnalyticsRevenue,
  isError: isErrorAnalyticsRevenue,
  error: analyticsRevenueError,
} = useQuery({
  queryKey: ["/analytics/revenue"],
  queryFn: () =>
    apiRequest<{
      total: number;
      thisMonth?: number;
      percentChange?: number;
    }>("/api/payments/revenue", {
      method: "GET",
      requireAuth: true,
    }),
});

// Helper function to format currency (if you don't have one already)
const formatCurrency = (amount: number | bigint) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Change to your currency
    minimumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format percentage change (if you don't have one already)
const formatPercentChange = (change: number | undefined) => {
  if (!change && change !== 0) return null;
  
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <span className={`text-xs flex items-center ${
      isPositive ? 'text-green-600' : 
      isNeutral ? 'text-gray-500' : 'text-red-600'
    }`}>
      {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
      {change < 0 && <TrendingDown className="w-3 h-3 mr-1" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
};

  const analyticsSubscriptions = subscriptionsData ? {
  total: subscriptionsData.length,
  active: subscriptionsData.filter(sub => sub.status === 'ACTIVE').length,
  inactive: subscriptionsData.filter(sub => sub.status !== 'ACTIVE').length,
} : null;

const totalUsers = analyticsData?.userStats?.total ?? 0;
const activeUsers = analyticsData?.userStats?.active ?? 0;
const inactiveUsers = analyticsData?.userStats?.inactive ?? 0;
const totalRevenue = analyticsData?.revenue?.total ?? 0;
const subscriptionRevenue = analyticsData?.revenue?.subscriptions ?? 0;



const newUsersThisMonth = analyticsData?.growth?.monthly?.reduce((sum, entry) => {
  const entryDate = new Date(entry.month);
  const now = new Date();
  const isThisMonth = entryDate.getMonth() === now.getMonth() && 
                     entryDate.getFullYear() === now.getFullYear();
  return isThisMonth ? sum + entry.newUsers : sum;
}, 0) ?? 0;


// Calculate analytics from the response
const calculateCourseStats = (coursesData: { data: any; }) => {
  if (!coursesData?.data) return null;
  
  const courses = coursesData.data;


   // Total enrollments across all courses
  const totalEnrollments = courses.reduce((sum: any, course: { _count: { enrollments: any; }; enrollment_count: any; }) => 
    sum + (course._count?.enrollments || course.enrollment_count || 0), 0
  );


  // Number of published/visible courses
  const publishedCourses = courses.filter((course: { visible: any; }) => course.visible).length;



    //Total courses


  const totalCourses = courses.length;
  
  return {
    enrollments: totalEnrollments,
    published: publishedCourses,
    total: totalCourses,
    // You can add percent change calculation here if you have historical data
    percentChange: 0 // Placeholder - calculate based on your needs
  };
};


const calculateGrowthPercentage = () => {
  if (!analyticsData?.growth?.monthly || analyticsData.growth.monthly.length < 2) {
    return 0;
  }
  
  const monthlyData = analyticsData.growth.monthly;
  const thisMonth = monthlyData[monthlyData.length - 1]?.newUsers ?? 0;
  const lastMonth = monthlyData[monthlyData.length - 2]?.newUsers ?? 0;
  
  if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
  return ((thisMonth - lastMonth) / lastMonth) * 100;
};

const userGrowthPercentage = calculateGrowthPercentage();



  // Format currency
  const formatCurrencyInDollars = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Simple format verification status
  const formatVerificationText = (verified: boolean) => {
    if (!verified) return "—";
    return "✓ Verified";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Check if the date is today
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Check if the date is yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Otherwise return the full date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Activity icon mapping
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

  // Format percentage change with color
  const formatPercentChangeWithColor = (percentChange: number | null | undefined) => {
    if (percentChange === null || percentChange === undefined) {
      return <div className="flex items-center text-gray-400">0.0%</div>;
    }

    const isPositive = percentChange >= 0;
    const color = isPositive ? "text-green-500" : "text-red-500";
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="w-4 h-4 mr-1" />
        <span>{Math.abs(percentChange).toFixed(1)}%</span>
      </div>
    );
  };

  // Create avatar fallback
  const getAvatarFallback = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };

  // Format verification status
  const formatVerification = (verified: boolean | null | undefined) => {
    if (!verified) {
      return (
        <div className="flex items-center">
          <span className="text-gray-400">Not Verified</span>
        </div>
      );
    }



  

    return (
      <div className="flex items-center">
        <Award className="h-3.5 w-3.5 text-blue-400 mr-1" />
        <span className="text-blue-400">Verified</span>
      </div>
    );
  };

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
          <Button variant="outline" onClick={() => refetch()}>
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
        {isLoadingAnalyticsData ? (
          "Loading..."
        ) : (
          `${newUsersThisMonth.toLocaleString()} new this month`
        )}
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
      {isLoadingAnalyticsCourses ? (
        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
      ) : isErrorAnalyticsCourses ? (
        <span className="text-red-500">Error</span>
      ) : (
        calculateCourseStats(analyticsCourses)?.enrollments?.toLocaleString() || "0"
      )}
    </div>
    <div className="flex items-center justify-between mt-1">
      <p className="text-xs text-gray-400">
        {isLoadingAnalyticsCourses ? (
          <div className="animate-pulse bg-gray-200 h-3 w-20 rounded"></div>
        ) : (
          `${calculateCourseStats(analyticsCourses)?.published || 0} active courses`
        )}
      </p>
      {!isLoadingAnalyticsCourses && !isErrorAnalyticsCourses && (
        formatPercentChange(calculateCourseStats(analyticsCourses)?.percentChange)
      )}
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
      {!isLoadingAnalyticsRevenue && !isErrorAnalyticsRevenue && (
        formatPercentChange(analyticsRevenue?.percentChange || 0)
      )}
    </div>
  </CardContent>
</Card>

        <Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
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
          {analyticsSubscriptions.active} active, {analyticsSubscriptions.inactive} inactive
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
                  Latest actions and events on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="space-y-2">
                  {isLoadingActivity ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isErrorActivity ? (
                    <div className="p-4 rounded-md bg-red-900/20 text-center">
                      <p className="text-sm text-red-400">
                        Error loading activity data
                      </p>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="p-4 rounded-md bg-gray-800/50 text-center">
                      <p className="text-sm text-gray-400">
                        No recent activity available
                      </p>
                    </div>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div
                        key={`activity-${activity.id || index}`}
                        className="flex items-start p-2 rounded-lg hover:bg-gray-800/50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 mr-3">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1">
                            {activity.user?.name ? (
                              <span className="font-medium">
                                {activity.user.name}
                              </span>
                            ) : (
                              <span className="font-medium">User</span>
                            )}
                            <span className="text-gray-400">
                              {typeof activity.details === "object"
                                ? JSON.stringify(activity.details)
                                : activity.details}
                            </span>
                            {activity.target?.name && (
                              <span className="font-medium">
                                {activity.target.name}
                              </span>
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
                <CardTitle>Top Instructors</CardTitle>
                <CardDescription>
                  Instructors with the most students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingInstructors ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isErrorInstructors ? (
                    <div className="p-4 rounded-md bg-red-900/20 text-center">
                      <p className="text-sm text-red-400">
                        Error loading instructor data
                      </p>
                    </div>
                  ) : topInstructors.length === 0 ? (
                    <div className="p-4 rounded-md bg-gray-800/50 text-center">
                      <p className="text-sm text-gray-400">
                        No instructor data available
                      </p>
                    </div>
                  ) : (
                    topInstructors.map((instructor, index) => (
                      <div
                        key={`instructor1-${instructor.id || index}`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Avatar className="h-9 w-9 mr-3">
                            <AvatarImage
                              src={instructor.avatar || undefined}
                              alt={instructor.name}
                            />
                            <AvatarFallback>
                              {getAvatarFallback(instructor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{instructor.name}</div>
                            <div className="text-xs text-gray-400">
                              {instructor.courses} courses
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>{instructor.students} students</div>
                          <div className="text-xs text-gray-400">
                            {formatVerification(instructor.verified)}
                          </div>
                        </div>
                      </div>
                    ))
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
              <CardTitle>Popular Courses</CardTitle>
              <CardDescription>
                Course with the highest enrollment and completion rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isErrorCourses ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      Unable to load course data. The API may be experiencing
                      issues.
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
                ) : isLoadingCourses ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : popularCourses.length === 0 ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      No course data available
                    </p>
                  </div>
                ) : (
                  popularCourses.map((course, index) => (
                    <div
                      key={`course1-${course.id || index}`}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 mr-3 flex-shrink-0">
                            {course.imageUrl ? (
                              <img
                                src={course.imageUrl}
                                alt={course.title || "Course"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {course.title || "Untitled Course"}
                            </div>
                            <div className="text-xs text-gray-400">
                              by {course.instructorName || "Unknown Instructor"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>{course.enrollments || 0} students</div>
                          <div className="text-xs text-gray-400">
                            {"Course completion: " +
                              (course.completionRate || 0) +
                              "%"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Completion Rate</span>
                          <span>{course.completionRate || 0}%</span>
                        </div>
                        <Progress
                          value={course.completionRate || 0}
                          className="h-1"
                        />
                      </div>
                      <Separator className="bg-gray-800" />
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
          {isLoadingAnalyticsCourses ? (
            <Loader2 className="inline h-5 w-5 animate-spin" />
          ) : isErrorAnalyticsCourses ? (
            <span className="text-red-500">Error</span>
          ) : analyticsCourses?.meta?.total !== undefined ? (
            analyticsCourses.meta.total.toLocaleString()
          ) : (
            "0"
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs text-gray-400">Published Courses</p>
        <div className="text-2xl font-bold">
          {isLoadingAnalyticsCourses ? (
            <Loader2 className="inline h-5 w-5 animate-spin" />
          ) : isErrorAnalyticsCourses ? (
            <span className="text-red-500">Error</span>
          ) : (
            calculateCourseStats(analyticsCourses)?.published?.toLocaleString() || "0"
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs text-gray-400">Total Enrollments</p>
        <div className="text-2xl font-bold">
          {isLoadingAnalyticsCourses ? (
            <Loader2 className="inline h-5 w-5 animate-spin" />
          ) : isErrorAnalyticsCourses ? (
            <span className="text-red-500">Error</span>
          ) : (
            calculateCourseStats(analyticsCourses)?.enrollments?.toLocaleString() || "0"
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs text-gray-400">Growth</p>
        <div className="text-2xl font-bold flex items-center">
          {isLoadingAnalyticsCourses ? (
            <Loader2 className="inline h-5 w-5 animate-spin" />
          ) : isErrorAnalyticsCourses ? (
            <span className="text-red-500">--</span>
          ) : (
            formatPercentChange(calculateCourseStats(analyticsCourses)?.percentChange || 0)
          )}
        </div>
      </div>
    </div>
    
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Published vs Draft</span>
        <span>
          {isLoadingAnalyticsCourses ? (
            <Loader2 className="inline h-3 w-3 animate-spin" />
          ) : isErrorAnalyticsCourses ? (
            "--"
          ) : (
            (() => {
              const stats = calculateCourseStats(analyticsCourses);
              const percentage = stats?.total > 0 
                ? Math.round((stats.published / stats.total) * 100)
                : 0;
              return `${percentage}%`;
            })()
          )}
        </span>
      </div>
      <Progress
        value={
          isLoadingAnalyticsCourses || isErrorAnalyticsCourses ? 0 : (() => {
            const stats = calculateCourseStats(analyticsCourses);
            return stats?.total > 0 
              ? (stats.published / stats.total) * 100
              : 0;
          })()
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
                      {stats?.certificates?.total}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Issued This Month</p>
                    <p className="text-2xl font-bold">
                      {stats?.certificates?.issuedThisMonth}
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

          <Card>
            <CardHeader>
              <CardTitle>Popular Courses</CardTitle>
              <CardDescription>
                Courses with the highest enrollment and completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isErrorCourses ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      Unable to load course data. The API may be experiencing
                      issues.
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
                ) : isLoadingCourses ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : popularCourses.length === 0 ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      No course data available
                    </p>
                  </div>
                ) : (
                  popularCourses.map((course, index) => (
                    <div
                      key={`course2-${course.id || index}`}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 mr-3 flex-shrink-0">
                            {course.imageUrl ? (
                              <img
                                src={course.imageUrl}
                                alt={course.title || "Course"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {course.title || "Untitled Course"}
                            </div>
                            <div className="text-xs text-gray-400">
                              by {course.instructorName || "Unknown Instructor"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>{course.enrollments || 0} students</div>
                          <div className="text-xs text-gray-400">
                            Completion: {course.completionRate || 0}%
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Completion Rate</span>
                          <span>{course.completionRate || 0}%</span>
                        </div>
                        <Progress
                          value={course.completionRate || 0}
                          className="h-1"
                        />
                      </div>
                      <Separator className="bg-gray-800" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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
        {isLoadingAnalyticsData ? (
          "Loading..."
        ) : (
          `${newUsersThisMonth.toLocaleString()} new this month`
        )}
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
                      {stats?.subscriptions?.active}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">
                      Expired Subscriptions
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.subscriptions?.expired}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Recent Upgrades</p>
                    <p className="text-2xl font-bold">
                      {stats?.subscriptions?.upgrades}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats?.subscriptions.percentChange)}
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
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      ((stats?.subscriptions?.active || 0) /
                        ((stats?.subscriptions?.active || 0) +
                          (stats?.subscriptions?.expired || 0))) *
                      100
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

          <Card>
            <CardHeader>
              <CardTitle>Top Instructors</CardTitle>
              <CardDescription>
                Instructors with the most students and highest ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isErrorInstructors ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      Unable to load instructor data. The API may be
                      experiencing issues.
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
                ) : isLoadingInstructors ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : topInstructors.length === 0 ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      No instructor data available
                    </p>
                  </div>
                ) : (
                  topInstructors.map((instructor, index) => (
                    <div
                      key={`instructor2-${instructor?.id || index}`}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage
                              src={instructor.avatar || undefined}
                              alt={instructor.name || "Instructor"}
                            />
                            <AvatarFallback>
                              {getAvatarFallback(
                                instructor?.name || "Instructor"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-lg">
                              {instructor?.name || "Unnamed Instructor"}
                            </div>
                            <div className="text-sm text-gray-400">
                              {instructor?.courses || 0} courses
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="mb-1">
                            {instructor?.students || 0} students
                          </Badge>
                          <div className="text-sm">
                            {formatVerification(instructor?.verified || false)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Earnings</span>
                          <span>
                            {formatCurrency(instructor?.earnings || 0)}
                          </span>
                        </div>
                      </div>
                      <Separator className="bg-gray-800 mt-4" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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
                    {formatPercentChange(
                      stats?.bookings?.percentChange ||
                        0 ||
                        null ||
                        undefined ||
                        0
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Completed vs Total</span>
                  <span>
                    {Math.round(
                      ((stats?.bookings?.completed || 0) /
                        (stats?.bookings?.total || 0)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    ((stats?.bookings?.completed || 0) /
                      (stats?.bookings?.total || 0)) *
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
