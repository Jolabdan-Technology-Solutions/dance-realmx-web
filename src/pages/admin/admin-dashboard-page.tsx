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
  Loader2
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState("7days");
  
  // Fetch dashboard stats
  const { data: stats, isLoading, isError, error, refetch } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats", timeRange],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/stats?range=${timeRange}`);
      return await res.json();
    },
  });
  
  // Fetch recent activity
  const { data: recentActivity = [], isLoading: isLoadingActivity, isError: isErrorActivity, error: activityError } = useQuery<RecentActivity[]>({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/activity?limit=8");
      return await res.json();
    },
  });
  
  // Fetch popular courses
  const { data: popularCourses = [], isLoading: isLoadingCourses, isError: isErrorCourses, error: coursesError } = useQuery<PopularCourse[]>({
    queryKey: ["/api/admin/courses/popular"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/courses/popular?limit=5");
      return await res.json();
    },
  });
  
  // Fetch top instructors
  const { data: topInstructors = [], isLoading: isLoadingInstructors, isError: isErrorInstructors, error: instructorsError } = useQuery<TopInstructor[]>({
    queryKey: ["/api/admin/instructors/top"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/instructors/top?limit=4");
      return await res.json();
    },
  });
  
  // Format currency
  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
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
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if the date is yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();
    
    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise return the full date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  // Activity icon mapping
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'purchase':
        return <ShoppingBag className="w-4 h-4 text-green-500" />;
      case 'booking':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'subscription':
        return <CreditCard className="w-4 h-4 text-indigo-500" />;
      case 'registration':
        return <UserPlus className="w-4 h-4 text-teal-500" />;
      case 'login':
        return <CircleUser className="w-4 h-4 text-gray-500" />;
      case 'admin':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Format percentage change with color
  const formatPercentChange = (percentChange: number | null | undefined) => {
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
    const nameParts = name.split(' ');
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
  
  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400">Welcome to the admin dashboard and analytics overview</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
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
            <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {stats.users.newThisMonth} new this month
              </p>
              {formatPercentChange(stats.users.percentChange)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Course Enrollments</CardTitle>
            <BookCheck className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courses.enrollments.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {stats.courses.published} active courses
              </p>
              {formatPercentChange(stats.courses.percentChange)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {formatCurrency(stats.revenue.thisMonth)} this month
              </p>
              {formatPercentChange(stats.revenue.percentChange)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Sparkles className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions.active.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {stats.subscriptions.upgrades} upgrades
              </p>
              {formatPercentChange(stats.subscriptions.percentChange)}
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
                <CardDescription>Latest actions and events on the platform</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="space-y-2">
                  {isLoadingActivity ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isErrorActivity ? (
                    <div className="p-4 rounded-md bg-red-900/20 text-center">
                      <p className="text-sm text-red-400">Error loading activity data</p>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="p-4 rounded-md bg-gray-800/50 text-center">
                      <p className="text-sm text-gray-400">No recent activity available</p>
                    </div>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div key={`activity-${activity.id || index}`} className="flex items-start p-2 rounded-lg hover:bg-gray-800/50">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 mr-3">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1">
                            {activity.user?.name ? (
                              <span className="font-medium">{activity.user.name}</span>
                            ) : (
                              <span className="font-medium">User</span>
                            )}
                            <span className="text-gray-400">
                              {typeof activity.details === 'object' 
                                ? JSON.stringify(activity.details) 
                                : activity.details}
                            </span>
                            {activity.target?.name && (
                              <span className="font-medium">{activity.target.name}</span>
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
                <Link href="/admin/activity" className="text-sm text-blue-500 hover:underline flex items-center">
                  View all activity
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Instructors</CardTitle>
                <CardDescription>Instructors with the most students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingInstructors ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isErrorInstructors ? (
                    <div className="p-4 rounded-md bg-red-900/20 text-center">
                      <p className="text-sm text-red-400">Error loading instructor data</p>
                    </div>
                  ) : topInstructors.length === 0 ? (
                    <div className="p-4 rounded-md bg-gray-800/50 text-center">
                      <p className="text-sm text-gray-400">No instructor data available</p>
                    </div>
                  ) : (
                    topInstructors.map((instructor, index) => (
                      <div key={`instructor1-${instructor.id || index}`} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-9 w-9 mr-3">
                            <AvatarImage src={instructor.avatar || undefined} alt={instructor.name} />
                            <AvatarFallback>{getAvatarFallback(instructor.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{instructor.name}</div>
                            <div className="text-xs text-gray-400">{instructor.courses} courses</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>{instructor.students} students</div>
                          <div className="text-xs text-gray-400">{formatVerification(instructor.verified)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 p-4">
                <Link href="/admin/instructors" className="text-sm text-blue-500 hover:underline flex items-center">
                  View all instructors
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Popular Courses</CardTitle>
              <CardDescription>Courses with the highest enrollment and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isErrorCourses ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      Unable to load course data. The API may be experiencing issues.
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
                    <p className="text-sm text-gray-400">No course data available</p>
                  </div>
                ) : (
                  popularCourses.map((course, index) => (
                    <div key={`course1-${course.id || index}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 mr-3 flex-shrink-0">
                            {course.imageUrl ? (
                              <img 
                                src={course.imageUrl} 
                                alt={course.title || 'Course'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{course.title || 'Untitled Course'}</div>
                            <div className="text-xs text-gray-400">by {course.instructorName || 'Unknown Instructor'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>{(course.enrollments || 0)} students</div>
                          <div className="text-xs text-gray-400">{"Course completion: " + (course.completionRate || 0) + "%"}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Completion Rate</span>
                          <span>{(course.completionRate || 0)}%</span>
                        </div>
                        <Progress value={course.completionRate || 0} className="h-1" />
                      </div>
                      <Separator className="bg-gray-800" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-700 p-4">
              <Link href="/admin/courses" className="text-sm text-blue-500 hover:underline flex items-center">
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
                <CardDescription>Overview of all courses on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Courses</p>
                    <p className="text-2xl font-bold">{stats.courses.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Published Courses</p>
                    <p className="text-2xl font-bold">{stats.courses.published}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Enrollments</p>
                    <p className="text-2xl font-bold">{stats.courses.enrollments.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats.courses.percentChange)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Published vs Draft</span>
                    <span>{Math.round((stats.courses.published / stats.courses.total) * 100)}%</span>
                  </div>
                  <Progress value={(stats.courses.published / stats.courses.total) * 100} className="h-2" />
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
                <CardDescription>Overview of certificates issued to students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Certificates</p>
                    <p className="text-2xl font-bold">{stats.certificates.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Issued This Month</p>
                    <p className="text-2xl font-bold">{stats.certificates.issuedThisMonth}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats.certificates.percentChange)}
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
              <CardDescription>Courses with the highest enrollment and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isErrorCourses ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      Unable to load course data. The API may be experiencing issues.
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
                    <p className="text-sm text-gray-400">No course data available</p>
                  </div>
                ) : (
                  popularCourses.map((course, index) => (
                    <div key={`course2-${course.id || index}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 mr-3 flex-shrink-0">
                            {course.imageUrl ? (
                              <img 
                                src={course.imageUrl} 
                                alt={course.title || 'Course'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{course.title || 'Untitled Course'}</div>
                            <div className="text-xs text-gray-400">by {course.instructorName || 'Unknown Instructor'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>{(course.enrollments || 0)} students</div>
                          <div className="text-xs text-gray-400">Completion: {(course.completionRate || 0)}%</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Completion Rate</span>
                          <span>{(course.completionRate || 0)}%</span>
                        </div>
                        <Progress value={course.completionRate || 0} className="h-1" />
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
                <CardDescription>Overview of all users on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold">{stats.users.total.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold">{stats.users.active.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">New This Month</p>
                    <p className="text-2xl font-bold">{stats.users.newThisMonth}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats.users.percentChange)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Active vs Total</span>
                    <span>{Math.round((stats.users.active / stats.users.total) * 100)}%</span>
                  </div>
                  <Progress value={(stats.users.active / stats.users.total) * 100} className="h-2" />
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
                <CardDescription>Overview of user subscriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Active Subscriptions</p>
                    <p className="text-2xl font-bold">{stats.subscriptions.active}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Expired Subscriptions</p>
                    <p className="text-2xl font-bold">{stats.subscriptions.expired}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Recent Upgrades</p>
                    <p className="text-2xl font-bold">{stats.subscriptions.upgrades}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats.subscriptions.percentChange)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Active vs Expired</span>
                    <span>{Math.round((stats.subscriptions.active / (stats.subscriptions.active + stats.subscriptions.expired)) * 100)}%</span>
                  </div>
                  <Progress value={(stats.subscriptions.active / (stats.subscriptions.active + stats.subscriptions.expired)) * 100} className="h-2" />
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
              <CardDescription>Instructors with the most students and highest ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isErrorInstructors ? (
                  <div className="p-4 rounded-md bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-400">
                      Unable to load instructor data. The API may be experiencing issues.
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
                    <p className="text-sm text-gray-400">No instructor data available</p>
                  </div>
                ) : (
                  topInstructors.map((instructor, index) => (
                    <div key={`instructor2-${instructor.id || index}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage src={instructor.avatar || undefined} alt={instructor.name || 'Instructor'} />
                            <AvatarFallback>{getAvatarFallback(instructor.name || 'Instructor')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-lg">{instructor.name || 'Unnamed Instructor'}</div>
                            <div className="text-sm text-gray-400">{instructor.courses || 0} courses</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="mb-1">{instructor.students || 0} students</Badge>
                          <div className="text-sm">{formatVerification(instructor.verified || false)}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Earnings</span>
                          <span>{formatCurrency(instructor.earnings || 0)}</span>
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
                    <p className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">This Month</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.revenue.thisMonth)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats.revenue.percentChange)}
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
                <CardDescription>Overview of resource sales and downloads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Resources</p>
                    <p className="text-2xl font-bold">{stats.resources.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Published Resources</p>
                    <p className="text-2xl font-bold">{stats.resources.published}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Downloads</p>
                    <p className="text-2xl font-bold">{stats.resources.downloads}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Growth</p>
                    <div className="text-2xl font-bold flex items-center">
                      {formatPercentChange(stats.resources.percentChange)}
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
                  <p className="text-2xl font-bold">{stats.bookings.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Pending Bookings</p>
                  <p className="text-2xl font-bold">{stats.bookings.pending}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Completed Bookings</p>
                  <p className="text-2xl font-bold">{stats.bookings.completed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Growth</p>
                  <div className="text-2xl font-bold flex items-center">
                    {formatPercentChange(stats.bookings.percentChange)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Completed vs Total</span>
                  <span>{Math.round((stats.bookings.completed / stats.bookings.total) * 100)}%</span>
                </div>
                <Progress value={(stats.bookings.completed / stats.bookings.total) * 100} className="h-2" />
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