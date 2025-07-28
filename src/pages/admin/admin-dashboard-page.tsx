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
  users?: {
    total: number;
    newThisMonth: number;
    byAccountType: {
      FREE: number;
      PREMIUM: number;
      NONE: number;
    };
  };
  courses?: {
    total: number;
    published: number;
    enrollments: number;
    percentChange: number;
  };
  resources?: {
    total: number;
    published: number;
    downloads: number;
    percentChange: number;
  };
  revenue?: {
    total: number;
    thisMonth: number;
    percentChange: number;
  };
  subscriptions?: {
    total: number;
    active: number;
    inactive: number;
    percentChange: number;
  };
  bookings?: {
    total: number;
    pending: number;
    completed: number;
    percentChange: number;
  };
  certificates?: {
    total: number;
    issuedThisMonth: number;
    percentChange: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");

  // Fetch data from multiple endpoints
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [courseStatsData, setCourseStatsData] = useState<any>(null);
  const [coursesData, setCoursesData] = useState<any>(null);
  const [subscriptionsData, setSubscriptionsData] = useState<any>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    let analyticsRes = null;
    let courseStatsRes = null; 
    let coursesRes = null;
    let subscriptionsRes = null;

    try {
      // Fetch courses data (this endpoint works)
      try {
        coursesRes = await apiRequest<any>("/api/courses", {
          method: "GET",
          requireAuth: false,
        });
        setCoursesData(coursesRes);
      } catch (err) {
        console.warn("Failed to fetch courses:", err);
      }

      // Try to fetch analytics data (may require auth)
      try {
        analyticsRes = await apiRequest<any>("/api/analytics/users", {
          method: "GET",
          requireAuth: true,
        });
        setAnalyticsData(analyticsRes);
      } catch (err) {
        console.warn("Failed to fetch analytics:", err);
      }

      // Try to fetch course statistics
      try {
        courseStatsRes = await apiRequest<any>("/api/subscriptions/course-stats", {
          method: "GET",
          requireAuth: true,
        });
        setCourseStatsData(courseStatsRes);
      } catch (err) {
        console.warn("Failed to fetch course stats:", err);
      }

      // Try to fetch subscriptions data
      try {
        subscriptionsRes = await apiRequest<any>("/api/subscriptions", {
          method: "GET",
          requireAuth: true,
        });
        setSubscriptionsData(subscriptionsRes);
      } catch (err) {
        console.warn("Failed to fetch subscriptions:", err);
      }

      // Calculate comprehensive stats from available data sources
      const calculatedStats = calculateDashboardStats(analyticsRes, courseStatsRes, coursesRes, subscriptionsRes);
      setStats(calculatedStats);

    } catch (err) {
      console.error("Failed to fetch stats:", err);
      // Even if everything fails, show some basic stats
      setStats(calculateDashboardStats(null, null, coursesRes, null));
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate dashboard statistics from multiple data sources
  const calculateDashboardStats = (analytics: any, courseStats: any, courses: any, subscriptions: any): DashboardStats => {
    // Extract data from courses endpoint (this definitely works)
    const coursesArray = Array.isArray(courses) ? courses : (courses?.data || []);
    const totalCourses = coursesArray.length;
    const publishedCourses = coursesArray.filter((course: any) => course.visible).length;
    const totalEnrollments = coursesArray.reduce((sum: number, course: any) => 
      sum + (course.enrollment_count || course._count?.enrollments || 0), 0);

    // Calculate user statistics from analytics if available
    const totalUsers = analytics?.userStats?.total ?? analytics?.total ?? 0;
    const newUsersThisMonth = analytics?.growth?.monthly?.reduce((sum: number, entry: any) => {
      const entryDate = new Date(entry.month);
      const now = new Date();
      const isThisMonth = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
      return isThisMonth ? sum + entry.newUsers : sum;
    }, 0) ?? 0;

    // Calculate revenue from analytics if available
    const totalRevenue = analytics?.revenue?.total ?? 0;
    const subscriptionRevenue = analytics?.revenue?.subscriptions ?? 0;

    // Calculate subscription statistics
    const subscriptionsArray = Array.isArray(subscriptions) ? subscriptions : (subscriptions?.data || []);
    const totalSubscriptions = subscriptionsArray.length;
    const activeSubscriptions = subscriptionsArray.filter((sub: any) => sub.status === "ACTIVE").length;

    // Calculate course enrollment statistics from courseStats if available
    const courseStatsEnrollments = courseStats?.course_enrollments?.reduce((sum: number, course: any) => 
      sum + course.total_enrollments, 0) ?? 0;

    // Use the higher enrollment count between direct courses data and course stats
    const finalEnrollments = Math.max(totalEnrollments, courseStatsEnrollments);

    return {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        byAccountType: analytics?.userStats?.byAccountType ?? { FREE: 0, PREMIUM: 0, NONE: 0 }
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        enrollments: finalEnrollments,
        percentChange: 0
      },
      revenue: {
        total: totalRevenue,
        thisMonth: subscriptionRevenue,
        percentChange: 0
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        inactive: totalSubscriptions - activeSubscriptions,
        percentChange: 0
      },
      resources: {
        total: 0,
        published: 0,
        downloads: 0,
        percentChange: 0
      },
      bookings: {
        total: 0,
        pending: 0,
        completed: 0,
        percentChange: 0
      },
      certificates: {
        total: 0,
        issuedThisMonth: 0,
        percentChange: 0
      }
    };
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    return num.toLocaleString();
  };

  const formatPercentChange = (change: number | undefined) => {
    if (!change) return <span className="text-gray-400">0%</span>;
    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
      <span className={isPositive ? "text-green-500" : "text-red-500"}>
        <Icon className="w-4 h-4 inline mr-1" />
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your platform overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.users?.total)}
                </div>
                <p className="text-xs text-gray-600">
                  +{formatNumber(stats?.users?.newThisMonth)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.courses?.total)}
                </div>
                <p className="text-xs text-gray-600">
                  {formatPercentChange(stats?.courses?.percentChange)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${formatNumber(stats?.revenue?.total)}
                </div>
                <p className="text-xs text-gray-600">
                  {formatPercentChange(stats?.revenue?.percentChange)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Activity className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.subscriptions?.active)}
                </div>
                <p className="text-xs text-gray-600">
                  {formatPercentChange(stats?.subscriptions?.percentChange)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Overview</CardTitle>
                <CardDescription>Total registered users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Users</span>
                    <span className="font-medium">{formatNumber(stats?.users?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">New This Month</span>
                    <span className="font-medium">{formatNumber(stats?.users?.newThisMonth)}</span>
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
                <CardDescription>Active subscriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Subscriptions</span>
                    <span className="font-medium">{formatNumber(stats?.subscriptions?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <span className="font-medium">{formatNumber(stats?.subscriptions?.active)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/subscriptions">
                  <Button variant="outline" className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscriptions
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>Total courses and enrollments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Courses</span>
                    <span className="font-medium">{formatNumber(stats?.courses?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Published</span>
                    <span className="font-medium">{formatNumber(stats?.courses?.published)}</span>
                  </div>
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
                <CardTitle>Resource Overview</CardTitle>
                <CardDescription>Resources and downloads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Resources</span>
                    <span className="font-medium">{formatNumber(stats?.resources?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Downloads</span>
                    <span className="font-medium">{formatNumber(stats?.resources?.downloads)}</span>
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
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Total platform revenue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-medium">${formatNumber(stats?.revenue?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-medium">${formatNumber(stats?.revenue?.thisMonth)}</span>
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
                <CardTitle>Booking Overview</CardTitle>
                <CardDescription>Lesson bookings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Bookings</span>
                    <span className="font-medium">{formatNumber(stats?.bookings?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium">{formatNumber(stats?.bookings?.completed)}</span>
                  </div>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
