import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Loader2,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  PieChart,
  Calendar,
  Brain,
  BarChart,
  ArrowUpRight,
  Trophy,
  AlarmClock,
  Book,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React, { useState } from "react";

// Define the types for our analytics data
interface CourseProgressAnalytics {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  passedQuizzes: number;
  certificates: number;
  recentlyViewed: RecentCourse[];
  overallProgress: number;
}

interface RecentCourse {
  id: number;
  title: string;
  thumbnail: string;
  overallProgress: number;
  lastViewed: string;
}

export default function CourseAnalytics() {
  const { user } = useAuth();
  
  // Fetch the user's course progress analytics
  const { 
    data: analytics,
    isLoading,
    error
  } = useQuery<CourseProgressAnalytics>({
    queryKey: ["/api/user/course-progress"],
    enabled: !!user,
  });
  
  // Calculate percentage values for different analytics 
  const modulesCompletionRate = analytics?.totalModules 
    ? Math.round((analytics.completedModules / analytics.totalModules) * 100) 
    : 0;
    
  const lessonsCompletionRate = analytics?.totalLessons 
    ? Math.round((analytics.completedLessons / analytics.totalLessons) * 100) 
    : 0;
    
  const quizzesCompletionRate = analytics?.totalQuizzes 
    ? Math.round((analytics.passedQuizzes / analytics.totalQuizzes) * 100) 
    : 0;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-red-500 mb-2">Unable to load analytics data</p>
        <p className="text-sm text-muted-foreground">Please try again later</p>
      </div>
    );
  }
  
  if (!analytics || analytics.enrolledCourses === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-medium mb-2">No course data available</h3>
        <p className="text-muted-foreground mb-6">
          Enroll in courses to see your learning analytics here
        </p>
        <Button asChild>
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }
  
  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  return (
    <div className="space-y-8">
      {/* Top level metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-primary" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{analytics.overallProgress}%</div>
            <Progress value={analytics.overallProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
              <div>
                <p className="text-muted-foreground">Enrolled</p>
                <p className="font-medium">{analytics.enrolledCourses}</p>
              </div>
              <div>
                <p className="text-muted-foreground">In Progress</p>
                <p className="font-medium">{analytics.inProgressCourses}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p className="font-medium">{analytics.completedCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Book className="mr-2 h-4 w-4 text-indigo-500" />
              Lesson Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{lessonsCompletionRate}%</div>
            <Progress value={lessonsCompletionRate} className="h-2" />
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Lessons</p>
                <p className="font-medium">{analytics.totalLessons}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p className="font-medium">{analytics.completedLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Brain className="mr-2 h-4 w-4 text-purple-500" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{quizzesCompletionRate}%</div>
            <Progress value={quizzesCompletionRate} className="h-2" />
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Quizzes</p>
                <p className="font-medium">{analytics.totalQuizzes}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passed</p>
                <p className="font-medium">{analytics.passedQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Achievement metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-primary" />
              Module Completion
            </CardTitle>
            <CardDescription>Track your progress through course modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Modules Completed</p>
                  <p className="text-3xl font-bold">{analytics.completedModules} <span className="text-sm text-muted-foreground">/ {analytics.totalModules}</span></p>
                </div>
                <div className="h-16 w-16 rounded-full border-8 flex items-center justify-center" style={{ borderColor: modulesCompletionRate >= 100 ? '#10b981' : '#3b82f6' }}>
                  <span className="text-lg font-bold">{modulesCompletionRate}%</span>
                </div>
              </div>
              <Progress value={modulesCompletionRate} className="h-2" />
            </div>
          </CardContent>
          <CardFooter>
            {analytics.enrolledCourses > 0 ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/my-courses">
                  View Course Modules
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button disabled variant="outline" size="sm" className="w-full">
                No Active Modules
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <CardDescription>Your earned certificates and accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm font-medium">Certificates</p>
                <p className="text-2xl font-bold">{analytics.certificates}</p>
                <p className="text-xs text-muted-foreground">earned</p>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Courses</p>
                <p className="text-2xl font-bold">{analytics.completedCourses}</p>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {analytics.certificates > 0 ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/my-certifications">
                  View My Certificates
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button disabled variant="outline" size="sm" className="w-full">
                Complete Courses for Certificates
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Recently viewed courses */}
      {analytics.recentlyViewed && analytics.recentlyViewed.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Recently Viewed Courses
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {analytics.recentlyViewed.map(course => (
              <Card key={course.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={course.thumbnail || "/assets/images/placeholder-course.jpg"} 
                    alt={course.title}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/images/placeholder-course.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                    <div className="text-white">
                      <p className="text-xs opacity-80">
                        Last viewed: {formatDate(course.lastViewed)}
                      </p>
                      <p className="font-medium truncate">{course.title}</p>
                    </div>
                  </div>
                </div>
                <CardFooter className="flex justify-between items-center px-4 py-2">
                  <div className="flex items-center">
                    <Progress 
                      value={course.overallProgress} 
                      className="h-2 w-16 mr-2" 
                    />
                    <span className="text-xs">{course.overallProgress}%</span>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/courses/${course.id}`}>
                      Continue
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}