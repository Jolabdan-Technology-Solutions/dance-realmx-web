import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Redirect, Link } from "wouter";
import { PlusCircle, BookOpen, UserCheck, Award, FileBox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Course } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function InstructorDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  
  // Only instructors and admins can access this page
  useEffect(() => {
    document.title = "Instructor Dashboard | DanceRealmX";
  }, []);
  
  // Redirect if not authenticated or not instructor/admin
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (user.role !== "instructor" && user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
      
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        {/* Courses Tab */}
        <TabsContent value="courses">
          <InstructorCourses />
        </TabsContent>
        
        {/* Students Tab */}
        <TabsContent value="students">
          <h2 className="text-2xl font-semibold mb-4">My Students</h2>
          <StudentsList />
        </TabsContent>
        
        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <h2 className="text-2xl font-semibold mb-4">Certificates Issued</h2>
          <CertificatesList />
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources">
          <h2 className="text-2xl font-semibold mb-4">My Teaching Resources</h2>
          <ResourcesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for managing instructor courses
function InstructorCourses() {
  const { user } = useAuth();
  
  // Get courses created by the instructor
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses", { instructorId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/courses?instructorId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
    enabled: !!user?.id
  });
  
  if (coursesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Courses</h2>
        <Link to="/instructor/courses/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Button>
        </Link>
      </div>
      
      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="bg-muted p-8 rounded-lg text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Courses Created Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start creating your first course to share your expertise with students.
          </p>
          <Link to="/instructor/courses/create">
            <Button>Create Your First Course</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Course card component
function CourseCard({ course }: { course: Course }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{course.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${course.visible ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          {course.visible ? 'Published' : 'Draft'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {course.imageUrl && (
          <div className="w-full h-40 overflow-hidden rounded-md mb-4">
            <img 
              src={course.imageUrl.includes('?') ? course.imageUrl : `${course.imageUrl}?t=${Date.now()}`} 
              alt={course.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Error loading course image in instructor dashboard:", course.title, course.imageUrl);
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span class="text-primary text-5xl">
                        ${course.title?.[0] || "D"}
                      </span>
                    </div>
                  `;
                }
              }}
            />
          </div>
        )}
        <p className="text-sm line-clamp-3">{course.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link to={`/instructor/courses/${course.id}`}>
          <Button variant="outline">Manage</Button>
        </Link>
        <Link to={`/courses/${course.id}`}>
          <Button variant="ghost">View</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Placeholder components to be implemented later
function StudentsList() {
  return (
    <div className="bg-muted p-8 rounded-lg text-center">
      <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">Student Management Coming Soon</h3>
      <p className="text-muted-foreground">
        This feature will allow you to view all students enrolled in your courses.
      </p>
    </div>
  );
}

function CertificatesList() {
  return (
    <div className="bg-muted p-8 rounded-lg text-center">
      <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">Certificate Management Coming Soon</h3>
      <p className="text-muted-foreground">
        This feature will allow you to issue and track certificates for your courses.
      </p>
    </div>
  );
}

function ResourcesList() {
  return (
    <div className="bg-muted p-8 rounded-lg text-center">
      <FileBox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">Resource Management Coming Soon</h3>
      <p className="text-muted-foreground">
        This feature will allow you to upload and sell teaching resources.
      </p>
    </div>
  );
}