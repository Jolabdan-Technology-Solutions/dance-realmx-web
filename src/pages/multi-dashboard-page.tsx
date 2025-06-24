// import { useAuth } from "@/hooks/use-auth";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Link } from "wouter";
// import { useEffect, useState } from "react";
// import { UserRole } from "@/constants/roles";
// import { useQuery } from "@tanstack/react-query";
// import { 
//   Loader2, ShoppingBag, BookOpen, UserCog, Users, BarChart3, Book, 
//   Award, Plus, FileIcon, File, AlertTriangle
// } from "lucide-react";
// import { 
//   Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { CourseDetailsModal } from "@/components/courses/course-details-modal";

// /**
//  * Multi-role dashboard for users with multiple roles
//  * This component shows different tabs and features based on the roles assigned to the user
//  */
// export default function MultiDashboardPage() {
//   const { user, isLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState<string>("");
//   const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

//   {/* Course Details Modal */}
//         {selectedCourseId && (
//           <CourseDetailsModal
//             courseId={selectedCourseId}
//             isOpen={isDetailsModalOpen}
//             onClose={() => {
//               setIsDetailsModalOpen(false);
//               // Allow for transition animation
//               setTimeout(() => setSelectedCourseId(null), 300);
//             }}
//           />
//         )}
  
//   // Fetch instructor courses from the API
//   const instructorCourses = useQuery({
//     queryKey: ['instructor-courses'],
//     queryFn: async () => {
//       const response = await fetch('https://api.livetestdomain.com/api/courses', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`, // Adjust based on your auth setup
//           'Content-Type': 'application/json',
//         },
//       });
//       if (!response.ok) {
//         throw new Error('Failed to fetch courses');
//       }
//       const data = await response.json();
//       return data.data; // Return the courses array from the API response
//     },
//     // Only enabled when user is logged in and has instructor role
//     enabled: !isLoading && !!user && Array.isArray(user.role) && user.role.includes(UserRole.INSTRUCTOR_ADMIN),
//     staleTime: 1000 * 60 * 5, // 5 minutes
//   });
  
//   useEffect(() => {
//     // Set default active tab based on user roles
//     if (user && Array.isArray(user.role) && user.role.length > 0) {
//       // Prioritized role order for default tab selection
//       const priorityOrder = [
//         UserRole.ADMIN,
//         UserRole.INSTRUCTOR_ADMIN,
//         UserRole.CURRICULUM_SELLER,
//         UserRole.CURRICULUM_ADMIN,
//         UserRole.MODERATOR,
//         UserRole.USER
//       ];
      
//       // Find the highest priority role the user has
//       for (const role of priorityOrder) {
//           if (user.role.includes(role)) {
//           setActiveTab(role);
//           break;
//         }
//       }
//     }
//   }, [user]);
  
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin text-border" />
//       </div>
//     );
//   }
  
//   if (!user || !Array.isArray(user.role) || user.role.length === 0) {
//     return (
//       <div className="container mx-auto p-6">
//         <h1 className="text-2xl font-bold mb-4">No Roles Assigned</h1>
//         <p className="mb-4">You don't have any roles assigned. Please contact an administrator.</p>
//         <Button asChild>
//           <Link href="/">Go to Home</Link>
//         </Button>
//       </div>
//     );
//   }
  
//   // Determine which role tabs to show
//   const hasSellerRole = user.role.includes(UserRole.CURRICULUM_SELLER);
//   const hasInstructorRole = user.role.includes(UserRole.INSTRUCTOR_ADMIN);
//   const hasAdminRole = user.role.includes(UserRole.ADMIN);
//   const hasCurriculumOfficerRole = user.role.includes(UserRole.CURRICULUM_ADMIN);
  
//   return (
//     <div className="container mx-auto p-6">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
//           <p className="text-muted-foreground">
//             Manage all your roles and access features from one place
//           </p>
//         </div>
//       </div>
      
//       <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//         <TabsList className="flex flex-wrap">
//           {hasSellerRole && (
//             <TabsTrigger value={UserRole.CURRICULUM_SELLER}>
//               <ShoppingBag className="h-4 w-4 mr-2" />
//               Seller Dashboard
//             </TabsTrigger>
//           )}
          
//           {hasInstructorRole && (
//             <TabsTrigger value={UserRole.INSTRUCTOR_ADMIN}>
//               <BookOpen className="h-4 w-4 mr-2" />
//               Instructor Dashboard
//             </TabsTrigger>
//           )}
          
//           {hasAdminRole && (
//             <TabsTrigger value={UserRole.ADMIN}>
//               <UserCog className="h-4 w-4 mr-2" />
//               Admin Dashboard
//             </TabsTrigger>
//           )}
          
//           {hasCurriculumOfficerRole && (
//             <TabsTrigger value={UserRole.CURRICULUM_ADMIN}>
//               <Book className="h-4 w-4 mr-2" />
//               Curriculum Officer
//             </TabsTrigger>
//           )}
//         </TabsList>
        
//         {/* Seller Dashboard Tab */}
//         {hasSellerRole && (
//           <TabsContent value={UserRole.CURRICULUM_SELLER} className="space-y-4">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-2xl font-bold">Seller Dashboard</h2>
//               <div className="flex items-center space-x-2">
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/seller/resources">Manage Resources</Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/seller/resources/create">Upload New</Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href={`/seller-store/${user?.id}`}>Full Seller Portal</Link>
//                 </Button>
//               </div>
//             </div>
            
//             {/* Seller analytics summary */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Total Resources</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <ShoppingBag className="inline mr-2 h-5 w-5" />
//                     12
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Total Sales</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <BarChart3 className="inline mr-2 h-5 w-5" />
//                     36
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Revenue</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <svg
//                       className="inline mr-2 h-5 w-5"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <circle cx="12" cy="12" r="10" />
//                       <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
//                       <path d="M12 18V6" />
//                     </svg>
//                     $2,580
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
            
//             {/* Recent Resources */}
//             <h3 className="text-xl font-semibold mb-3">Recent Resources</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               {[1, 2, 3].map((i) => (
//                 <Card key={i}>
//                   <CardHeader className="pb-2">
//                     <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
//                       <File className="h-12 w-12 text-muted-foreground opacity-50" />
//                     </div>
//                     <CardTitle className="text-lg">Ballet Terminology Guide</CardTitle>
//                   </CardHeader>
//                   <CardContent className="pb-2">
//                     <p className="text-sm text-muted-foreground line-clamp-2">
//                       Comprehensive guide to ballet terminology for all levels of dancers.
//                     </p>
//                   </CardContent>
//                   <CardFooter className="flex justify-between">
//                     <Badge>$24.99</Badge>
//                     <div className="text-sm text-muted-foreground">Sales: 8</div>
//                   </CardFooter>
//                 </Card>
//               ))}
//             </div>
            
//             <div className="mt-2">
//               <Button asChild>
//                 <Link href={`/seller-store/${user?.id}`}>Go to Full Seller Dashboard</Link>
//               </Button>
//             </div>
//           </TabsContent>
//         )}
        
//         {/* Instructor Dashboard Tab */}
//         {hasInstructorRole && (
//           <TabsContent value={UserRole.INSTRUCTOR_ADMIN} className="space-y-4">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-2xl font-bold">Instructor Dashboard</h2>
//               <div className="flex items-center flex-wrap gap-2">
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/instructor/courses/create">
//                     <Plus className="h-4 w-4 mr-2" />
//                     Create Course
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/instructor/certificates">
//                     <Award className="h-4 w-4 mr-2" />
//                     Certificates
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/instructor/quizzes">
//                     <svg 
//                       className="h-4 w-4 mr-2"
//                       viewBox="0 0 24 24" 
//                       fill="none" 
//                       stroke="currentColor" 
//                       strokeWidth="2" 
//                       strokeLinecap="round" 
//                       strokeLinejoin="round"
//                     >
//                       <circle cx="12" cy="12" r="10" />
//                       <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
//                       <path d="M12 17h.01" />
//                     </svg>
//                     Quizzes
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/instructor/students">
//                     <Users className="h-4 w-4 mr-2" />
//                     Students
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/instructor-module-page">
//                     <Users className="h-4 w-4 mr-2" />
//                     Modules
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/instructor/dashboard">Full Instructor Portal</Link>
//                 </Button>
//               </div>
//             </div>
            
//             {/* Instructor analytics summary */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Your Courses</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <BookOpen className="inline mr-2 h-5 w-5" />
//                     {instructorCourses.isLoading ? (
//                       <Loader2 className="inline h-6 w-6 animate-spin ml-2" />
//                     ) : instructorCourses.error ? (
//                       <span className="text-red-500">-</span>
//                     ) : (
//                       instructorCourses.data?.length || 0
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Students</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <Users className="inline mr-2 h-5 w-5" />
//                     {instructorCourses.isLoading ? (
//                       <Loader2 className="inline h-6 w-6 animate-spin ml-2" />
//                     ) : instructorCourses.error ? (
//                       <span className="text-red-500">-</span>
//                     ) : (
//                       instructorCourses.data?.reduce((total, course) => total + (course.enrollment_count || 0), 0) || 0
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Certificates Issued</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <Award className="inline mr-2 h-5 w-5" />
//                     16
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Main instructor functionality section */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//               {/* Course Management */}
//               <Card>
//                 <CardHeader>
//                   <div className="flex items-center">
//                     <BookOpen className="h-5 w-5 mr-2" />
//                     <CardTitle>Course Management</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Manage existing courses</span>
//                       <Link href="/instructor/courses" className="text-primary hover:underline">
//                         View All
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Create new course</span>
//                       <Link href="/instructor/courses/create" className="text-primary hover:underline">
//                         Create
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Edit course content</span>
//                       <Link href="/instructor/courses" className="text-primary hover:underline">
//                         Edit
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Course analytics</span>
//                       <Link href="/instructor/analytics" className="text-primary hover:underline">
//                         View
//                       </Link>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Student Management */}
//               <Card>
//                 <CardHeader>
//                   <div className="flex items-center">
//                     <Users className="h-5 w-5 mr-2" />
//                     <CardTitle>Student Management</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">View all students</span>
//                       <Link href="/instructor/students" className="text-primary hover:underline">
//                         View
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Manage enrollments</span>
//                       <Link href="/instructor/enrollments" className="text-primary hover:underline">
//                         Manage
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Student progress</span>
//                       <Link href="/instructor/student-progress" className="text-primary hover:underline">
//                         View
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Export student data</span>
//                       <Link href="/instructor/export" className="text-primary hover:underline">
//                         Export
//                       </Link>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Quiz & Assessment */}
//               <Card>
//                 <CardHeader>
//                   <div className="flex items-center">
//                     <svg 
//                       className="h-5 w-5 mr-2"
//                       viewBox="0 0 24 24" 
//                       fill="none" 
//                       stroke="currentColor" 
//                       strokeWidth="2" 
//                       strokeLinecap="round" 
//                       strokeLinejoin="round"
//                     >
//                       <circle cx="12" cy="12" r="10" />
//                       <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
//                       <path d="M12 17h.01" />
//                     </svg>
//                     <CardTitle>Quiz & Assessment</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Create new quiz</span>
//                       <Link href="/instructor/quizzes/create" className="text-primary hover:underline">
//                         Create
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Manage existing quizzes</span>
//                       <Link href="/instructor/quizzes" className="text-primary hover:underline">
//                         Manage
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Review quiz results</span>
//                       <Link href="/instructor/quiz-results" className="text-primary hover:underline">
//                         Review
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Quiz settings</span>
//                       <Link href="/instructor/quizzes/settings" className="text-primary hover:underline">
//                         Configure
//                       </Link>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Certificate Management */}
//               <Card>
//                 <CardHeader>
//                   <div className="flex items-center">
//                     <Award className="h-5 w-5 mr-2" />
//                     <CardTitle>Certificate Management</CardTitle>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Issue new certificate</span>
//                       <Link href="/instructor/certificates/issue" className="text-primary hover:underline">
//                         Issue
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Certificate templates</span>
//                       <Link href="/instructor/certificate-templates" className="text-primary hover:underline">
//                         Templates
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Create template</span>
//                       <Link href="/instructor/certificate-templates/create" className="text-primary hover:underline">
//                         Create
//                       </Link>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium">Issued certificates</span>
//                       <Link href="/instructor/certificates" className="text-primary hover:underline">
//                         View All
//                       </Link>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
            
//             {/* Instructor Courses */}
//             <h3 className="text-xl font-semibold mb-3">Your Courses</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               {instructorCourses.isLoading ? (
//                 <div className="col-span-3 flex justify-center py-6">
//                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                 </div>
//               ) : instructorCourses.error ? (
//                 <div className="col-span-3 bg-muted p-6 rounded-lg text-center">
//                   <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
//                   <h3 className="text-lg font-medium mb-2">Error Loading Courses</h3>
//                   <p className="text-sm text-muted-foreground">
//                     {instructorCourses.error instanceof Error 
//                       ? instructorCourses.error.message 
//                       : 'Failed to fetch your courses. Please try again.'}
//                   </p>
//                 </div>
//               ) : instructorCourses.data && instructorCourses.data.length > 0 ? (
//                 instructorCourses.data.map((course) => (
//                   <Card key={course.id}>
//                     <CardHeader className="pb-2">
//                       <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
//                         {course.image_url ? (
//                           <img 
//                             src={course.image_url} 
//                             alt={course.title} 
//                             className="h-full w-full object-cover rounded-md"
//                           />
//                         ) : (
//                           <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
//                         )}
//                       </div>
//                       <CardTitle className="text-lg">{course.title}</CardTitle>
//                     </CardHeader>
//                     <CardContent className="pb-2">
//                       <div className="flex justify-between text-sm text-muted-foreground mb-2">
//                         <span>Duration</span>
//                         <span>{course.duration}</span>
//                       </div>
//                       <div className="flex justify-between text-sm text-muted-foreground mb-2">
//                         <span>Level</span>
//                         <span className="capitalize">{course.difficulty_level}</span>
//                       </div>
//                       <div className="flex justify-between text-sm text-muted-foreground mb-2">
//                         <span>Price</span>
//                         <span>${course.price}</span>
//                       </div>
//                     </CardContent>
//                     <CardFooter className="flex justify-between">
//                       <Badge variant="outline">
//                         <Users className="h-3 w-3 mr-1" />
//                         {course.enrollment_count || 0} Students
//                       </Badge>
//                       <div className="flex space-x-2">
//                         <Button variant="ghost" size="sm" asChild>
//                           <Link href={`/instructor/courses/${course.id}/edit`}>Edit</Link>
//                         </Button>
//                         <Button variant="ghost" size="sm" asChild>
//                           <Link  onClick={() => {
//                         setSelectedCourseId(course.id);
//                         setIsDetailsModalOpen(true);
//                       }}>View</Link>
//                         </Button>
//                       </div>
//                     </CardFooter>
//                   </Card>
//                 ))
//               ) : (
//                 <div className="col-span-3 bg-muted p-6 rounded-lg text-center">
//                   <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
//                   <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
//                   <p className="text-sm text-muted-foreground mb-4">
//                     You haven't created any courses yet. Click the button below to get started.
//                   </p>
//                   <Button asChild>
//                     <Link href="/instructor/courses/create">
//                       <Plus className="h-4 w-4 mr-2" />
//                       Create Your First Course
//                     </Link>
//                   </Button>
//                 </div>
//               )}
//             </div>
            
//             <div className="mt-2">
//               <Button asChild>
//                 <Link href="/instructor/dashboard">Go to Full Instructor Dashboard</Link>
//               </Button>
//             </div>
//           </TabsContent>
//         )}
        
//         {/* Admin Dashboard Tab */}
//         {hasAdminRole && (
//             <TabsContent value={UserRole.ADMIN} className="space-y-4">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-2xl font-bold">Admin Dashboard</h2>
//               <div className="flex items-center space-x-2">
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/admin/users">
//                     <Users className="h-4 w-4 mr-2" />
//                     Users
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/admin/courses">
//                     <BookOpen className="h-4 w-4 mr-2" />
//                     Courses
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/admin/analytics">
//                     <BarChart3 className="h-4 w-4 mr-2" />
//                     Analytics
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/admin/dashboard">Full Admin Portal</Link>
//                 </Button>
//               </div>
//             </div>
            
//             {/* Admin stats summary */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Total Users</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <Users className="inline mr-2 h-5 w-5" />
//                     137
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Active Courses</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <BookOpen className="inline mr-2 h-5 w-5" />
//                     24
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Approved Sellers</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <ShoppingBag className="inline mr-2 h-5 w-5" />
//                     18
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Total Revenue</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <svg
//                       className="inline mr-2 h-5 w-5"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <circle cx="12" cy="12" r="10" />
//                       <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
//                       <path d="M12 18V6" />
//                     </svg>
//                     $12,480
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
            
//             {/* Recent User Activity */}
//             <h3 className="text-xl font-semibold mb-3">Recent User Activity</h3>
//             <Card>
//               <CardContent className="p-0">
//                 <div className="divide-y divide-border">
//                   {[
//                     {
//                       user: "John Rodriguez",
//                       action: "Enrolled in 'Ballet Certification Program'",
//                       time: "2 hours ago"
//                     },
//                     {
//                       user: "Sarah Thomas",
//                       action: "Uploaded new resource 'Contemporary Dance Syllabus'",
//                       time: "4 hours ago"
//                     },
//                     {
//                       user: "Michael Chen",
//                       action: "Purchased 'Hip Hop Curriculum Bundle'",
//                       time: "Yesterday"
//                     },
//                     {
//                       user: "Emma Jackson",
//                       action: "Completed 'Jazz Dance Fundamentals' course",
//                       time: "2 days ago"
//                     },
//                     {
//                       user: "Robert Kim",
//                       action: "Registered as a new instructor",
//                       time: "3 days ago"
//                     }
//                   ].map((activity, i) => (
//                     <div key={i} className="flex items-center justify-between p-4">
//                       <div className="flex items-center">
//                         <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
//                           <Users className="h-5 w-5 text-muted-foreground" />
//                         </div>
//                         <div>
//                           <div className="font-medium">{activity.user}</div>
//                           <div className="text-sm text-muted-foreground">{activity.action}</div>
//                         </div>
//                       </div>
//                       <div className="text-sm text-muted-foreground">{activity.time}</div>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
            
//             <div className="mt-4">
//               <Button asChild>
//                 <Link href="/admin/dashboard">Go to Full Admin Dashboard</Link>
//               </Button>
//             </div>
//           </TabsContent>
//         )}
        
//         {/* Curriculum Officer Tab */}
//         {hasCurriculumOfficerRole && (
//             <TabsContent value={UserRole.CURRICULUM_ADMIN} className="space-y-4">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-2xl font-bold">Curriculum Officer Dashboard</h2>
//               <div className="flex items-center space-x-2">
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/admin/curriculum-officer">
//                     <BookOpen className="h-4 w-4 mr-2" />
//                     Review Resources
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/admin/curriculum-officer/sellers">
//                     <Users className="h-4 w-4 mr-2" />
//                     Manage Sellers
//                   </Link>
//                 </Button>
//                 <Button asChild variant="outline" size="sm">
//                   <Link href="/admin/curriculum-officer">Full Curriculum Portal</Link>
//                 </Button>
//               </div>
//             </div>
            
//             {/* Curriculum Officer summary */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Pending Reviews</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <BookOpen className="inline mr-2 h-5 w-5" />
//                     7
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Approved Resources</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <File className="inline mr-2 h-5 w-5" />
//                     52
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Active Sellers</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-3xl font-bold text-primary">
//                     <Users className="inline mr-2 h-5 w-5" />
//                     18
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
            
//             {/* Pending Resources */}
//             <h3 className="text-xl font-semibold mb-3">Pending Resource Reviews</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               {[
//                 {
//                   title: "Contemporary Dance Warm-ups",
//                   seller: "Emma Watson",
//                   submitted: "Yesterday"
//                 },
//                 {
//                   title: "Ballet Syllabus Grade 3",
//                   seller: "Michael Johnson",
//                   submitted: "2 days ago"
//                 },
//                 {
//                   title: "Hip Hop Teaching Guide",
//                   seller: "Sophia Martinez",
//                   submitted: "3 days ago"
//                 }
//               ].map((resource, i) => (
//                 <Card key={i}>
//                   <CardHeader className="pb-2">
//                     <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
//                       <File className="h-12 w-12 text-muted-foreground opacity-50" />
//                     </div>
//                     <CardTitle className="text-lg">{resource.title}</CardTitle>
//                   </CardHeader>
//                   <CardContent className="pb-2">
//                     <div className="text-sm text-muted-foreground mb-2">
//                       Submitted by <span className="font-medium">{resource.seller}</span>
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                       Submitted {resource.submitted}
//                     </div>
//                   </CardContent>
//                   <CardFooter className="flex justify-between">
//                     <Button variant="outline" size="sm">
//                       Review
//                     </Button>
//                     <div className="flex space-x-2">
//                       <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500">
//                         <svg 
//                           xmlns="http://www.w3.org/2000/svg" 
//                           viewBox="0 0 24 24" 
//                           fill="none" 
//                           stroke="currentColor" 
//                           strokeWidth="2" 
//                           strokeLinecap="round" 
//                           strokeLinejoin="round" 
//                           className="h-4 w-4"
//                         >
//                           <path d="M20 6 9 17l-5-5" />
//                         </svg>
//                       </Button>
//                       <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
//                         <svg 
//                           xmlns="http://www.w3.org/2000/svg" 
//                           viewBox="0 0 24 24" 
//                           fill="none" 
//                           stroke="currentColor" 
//                           strokeWidth="2" 
//                           strokeLinecap="round" 
//                           strokeLinejoin="round" 
//                           className="h-4 w-4"
//                         >
//                           <path d="M18 6 6 18"/>
//                           <path d="m6 6 12 12"/>
//                         </svg>
//                       </Button>
//                     </div>
//                   </CardFooter>
//                 </Card>
//               ))}
//             </div>
            
//             <div className="mt-2">
//               <Button asChild>
//                 <Link href="/admin/curriculum-officer">Go to Full Curriculum Dashboard</Link>
//               </Button>
//             </div>
//           </TabsContent>
//         )}
//       </Tabs>
//     </div>
//   );
// }


import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { UserRole } from "@/constants/roles";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, ShoppingBag, BookOpen, UserCog, Users, BarChart3, Book, 
  Award, Plus, FileIcon, File, AlertTriangle
} from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseDetailsModal } from "@/components/courses/course-details-modal";

/**
 * Multi-role dashboard for users with multiple roles
 * This component shows different tabs and features based on the roles assigned to the user
 */
export default function MultiDashboardPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  {/* Course Details Modal */}
        {selectedCourseId && (
          <CourseDetailsModal
            courseId={selectedCourseId}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              // Allow for transition animation
              setTimeout(() => setSelectedCourseId(null), 300);
            }}
          />
        )}
  
  // Fetch instructor courses from the API
  const instructorCourses = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const response = await fetch('https://api.livetestdomain.com/api/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Adjust based on your auth setup
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      return data.data; // Return the courses array from the API response
    },
    // Only enabled when user is logged in and has instructor role
    enabled: !isLoading && !!user && Array.isArray(user.role) && user.role.includes(UserRole.INSTRUCTOR_ADMIN),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  useEffect(() => {
    // Set default active tab based on user roles
    if (user && Array.isArray(user.role) && user.role.length > 0) {
      // Prioritized role order for default tab selection
      const priorityOrder = [
        UserRole.ADMIN,
        UserRole.INSTRUCTOR_ADMIN,
        UserRole.CURRICULUM_SELLER,
        UserRole.CURRICULUM_ADMIN,
        UserRole.MODERATOR,
        UserRole.USER
      ];
      
      // Find the highest priority role the user has
      for (const role of priorityOrder) {
          if (user.role.includes(role)) {
          setActiveTab(role);
          break;
        }
      }
    }
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!user || !Array.isArray(user.role) || user.role.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">No Roles Assigned</h1>
        <p className="mb-4">You don't have any roles assigned. Please contact an administrator.</p>
        <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }
  
  // Determine which role tabs to show
  const hasSellerRole = user.role.includes(UserRole.CURRICULUM_SELLER);
  const hasInstructorRole = user.role.includes(UserRole.INSTRUCTOR_ADMIN);
  const hasAdminRole = user.role.includes(UserRole.ADMIN);
  const hasCurriculumOfficerRole = user.role.includes(UserRole.CURRICULUM_ADMIN);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Manage all your roles and access features from one place
          </p>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap">
          {hasSellerRole && (
            <TabsTrigger value={UserRole.CURRICULUM_SELLER}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Seller Dashboard
            </TabsTrigger>
          )}
          
          {hasInstructorRole && (
            <TabsTrigger value={UserRole.INSTRUCTOR_ADMIN}>
              <BookOpen className="h-4 w-4 mr-2" />
              Instructor Dashboard
            </TabsTrigger>
          )}
          
          {hasAdminRole && (
            <TabsTrigger value={UserRole.ADMIN}>
              <UserCog className="h-4 w-4 mr-2" />
              Admin Dashboard
            </TabsTrigger>
          )}
          
          {hasCurriculumOfficerRole && (
            <TabsTrigger value={UserRole.CURRICULUM_ADMIN}>
              <Book className="h-4 w-4 mr-2" />
              Curriculum Officer
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Seller Dashboard Tab */}
        {hasSellerRole && (
          <TabsContent value={UserRole.CURRICULUM_SELLER} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Seller Dashboard</h2>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/seller/resources">Manage Resources</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/seller/resources/create">Upload New</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/seller-store/${user?.id}`}>Full Seller Portal</Link>
                </Button>
              </div>
            </div>
            
            {/* Seller analytics summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <ShoppingBag className="inline mr-2 h-5 w-5" />
                    12
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BarChart3 className="inline mr-2 h-5 w-5" />
                    36
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <svg
                      className="inline mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
                      <path d="M12 18V6" />
                    </svg>
                    $2,580
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Resources */}
            <h3 className="text-xl font-semibold mb-3">Recent Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
                      <File className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                    <CardTitle className="text-lg">Ballet Terminology Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      Comprehensive guide to ballet terminology for all levels of dancers.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Badge>$24.99</Badge>
                    <div className="text-sm text-muted-foreground">Sales: 8</div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-2">
              <Button asChild>
                <Link href={`/seller-store/${user?.id}`}>Go to Full Seller Dashboard</Link>
              </Button>
            </div>
          </TabsContent>
        )}
        
        {/* Instructor Dashboard Tab */}
        {hasInstructorRole && (
          <TabsContent value={UserRole.INSTRUCTOR_ADMIN} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Instructor Dashboard</h2>
              <div className="flex items-center flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/certificates">
                    <Award className="h-4 w-4 mr-2" />
                    Certificates
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/quizzes">
                    <svg 
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    Quizzes
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/students">
                    <Users className="h-4 w-4 mr-2" />
                    Students
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor-module-page">
                    <Users className="h-4 w-4 mr-2" />
                    Modules
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/dashboard">Full Instructor Portal</Link>
                </Button>
              </div>
            </div>
            
            {/* Instructor analytics summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BookOpen className="inline mr-2 h-5 w-5" />
                    {instructorCourses.isLoading ? (
                      <Loader2 className="inline h-6 w-6 animate-spin ml-2" />
                    ) : instructorCourses.error ? (
                      <span className="text-red-500">-</span>
                    ) : (
                      instructorCourses.data?.length || 0
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Users className="inline mr-2 h-5 w-5" />
                    {instructorCourses.isLoading ? (
                      <Loader2 className="inline h-6 w-6 animate-spin ml-2" />
                    ) : instructorCourses.error ? (
                      <span className="text-red-500">-</span>
                    ) : (
                      instructorCourses.data?.reduce((total, course) => total + (course.enrollment_count || 0), 0) || 0
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Certificates Issued</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Award className="inline mr-2 h-5 w-5" />
                    16
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main instructor functionality section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Course Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    <CardTitle>Course Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Manage existing courses</span>
                      <Link href="/instructor/courses" className="text-primary hover:underline">
                        View All
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Create new course</span>
                      <Link href="/instructor/courses/create" className="text-primary hover:underline">
                        Create
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Edit course content</span>
                      <Link href="/instructor/courses" className="text-primary hover:underline">
                        Edit
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Course analytics</span>
                      <Link href="/instructor/analytics" className="text-primary hover:underline">
                        View
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <CardTitle>Student Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">View all students</span>
                      <Link href="/instructor/students" className="text-primary hover:underline">
                        View
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Manage enrollments</span>
                      <Link href="/instructor/enrollments" className="text-primary hover:underline">
                        Manage
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Student progress</span>
                      <Link href="/instructor/student-progress" className="text-primary hover:underline">
                        View
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Export student data</span>
                      <Link href="/instructor/export" className="text-primary hover:underline">
                        Export
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quiz & Assessment */}
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <svg 
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    <CardTitle>Quiz & Assessment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Create new quiz</span>
                      <Link href="/instructor/quizzes/create" className="text-primary hover:underline">
                        Create
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Manage existing quizzes</span>
                      <Link href="/instructor/quizzes" className="text-primary hover:underline">
                        Manage
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Review quiz results</span>
                      <Link href="/instructor/quiz-results" className="text-primary hover:underline">
                        Review
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Quiz settings</span>
                      <Link href="/instructor/quizzes/settings" className="text-primary hover:underline">
                        Configure
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certificate Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    <CardTitle>Certificate Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Issue new certificate</span>
                      <Link href="/instructor/certificates/issue" className="text-primary hover:underline">
                        Issue
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Certificate templates</span>
                      <Link href="/instructor/certificate-templates" className="text-primary hover:underline">
                        Templates
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Create template</span>
                      <Link href="/instructor/certificate-templates/create" className="text-primary hover:underline">
                        Create
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Issued certificates</span>
                      <Link href="/instructor/certificates" className="text-primary hover:underline">
                        View All
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Instructor Courses */}
            <h3 className="text-xl font-semibold mb-3">Your Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {instructorCourses.isLoading ? (
                <div className="col-span-3 flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : instructorCourses.error ? (
                <div className="col-span-3 bg-muted p-6 rounded-lg text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-2">Error Loading Courses</h3>
                  <p className="text-sm text-muted-foreground">
                    {instructorCourses.error instanceof Error 
                      ? instructorCourses.error.message 
                      : 'Failed to fetch your courses. Please try again.'}
                  </p>
                </div>
              ) : instructorCourses.data && instructorCourses.data.length > 0 ? (
                instructorCourses.data.map((course) => (
                  <Card key={course.id}>
                    <CardHeader className="pb-2">
                      <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
                        {course.image_url ? (
                          <img 
                            src={course.image_url} 
                            alt={course.title} 
                            className="h-full w-full object-cover rounded-md"
                          />
                        ) : (
                          <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
                        )}
                      </div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Duration</span>
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Level</span>
                        <span className="capitalize">{course.difficulty_level}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Price</span>
                        <span>${course.price}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {course.enrollment_count || 0} Students
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/instructor/courses/${course.id}/edit`}>Edit</Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 bg-muted p-6 rounded-lg text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't created any courses yet. Click the button below to get started.
                  </p>
                  <Button asChild>
                    <Link href="/instructor/courses/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <Button asChild>
                <Link href="/instructor/dashboard">Go to Full Instructor Dashboard</Link>
              </Button>
            </div>
          </TabsContent>
        )}
        
        {/* Admin Dashboard Tab */}
        {hasAdminRole && (
            <TabsContent value={UserRole.ADMIN} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Courses
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/dashboard">Full Admin Portal</Link>
                </Button>
              </div>
            </div>
            
            {/* Admin stats summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Users className="inline mr-2 h-5 w-5" />
                    137
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BookOpen className="inline mr-2 h-5 w-5" />
                    24
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Approved Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <ShoppingBag className="inline mr-2 h-5 w-5" />
                    18
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <svg
                      className="inline mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
                      <path d="M12 18V6" />
                    </svg>
                    $12,480
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent User Activity */}
            <h3 className="text-xl font-semibold mb-3">Recent User Activity</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {[
                    {
                      user: "John Rodriguez",
                      action: "Enrolled in 'Ballet Certification Program'",
                      time: "2 hours ago"
                    },
                    {
                      user: "Sarah Thomas",
                      action: "Uploaded new resource 'Contemporary Dance Syllabus'",
                      time: "4 hours ago"
                    },
                    {
                      user: "Michael Chen",
                      action: "Purchased 'Hip Hop Curriculum Bundle'",
                      time: "Yesterday"
                    },
                    {
                      user: "Emma Jackson",
                      action: "Completed 'Jazz Dance Fundamentals' course",
                      time: "2 days ago"
                    },
                    {
                      user: "Robert Kim",
                      action: "Registered as a new instructor",
                      time: "3 days ago"
                    }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{activity.user}</div>
                          <div className="text-sm text-muted-foreground">{activity.action}</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4">
              <Button asChild>
                <Link href="/admin/dashboard">Go to Full Admin Dashboard</Link>
              </Button>
            </div>
          </TabsContent>
        )}
        
        {/* Curriculum Officer Tab */}
        {hasCurriculumOfficerRole && (
            <TabsContent value={UserRole.CURRICULUM_ADMIN} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Curriculum Officer Dashboard</h2>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Review Resources
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer/sellers">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Sellers
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer">Full Curriculum Portal</Link>
                </Button>
              </div>
            </div>
            
            {/* Curriculum Officer summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pending Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BookOpen className="inline mr-2 h-5 w-5" />
                    7
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Approved Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <File className="inline mr-2 h-5 w-5" />
                    52
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Users className="inline mr-2 h-5 w-5" />
                    18
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Pending Resources */}
            <h3 className="text-xl font-semibold mb-3">Pending Resource Reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  title: "Contemporary Dance Warm-ups",
                  seller: "Emma Watson",
                  submitted: "Yesterday"
                },
                {
                  title: "Ballet Syllabus Grade 3",
                  seller: "Michael Johnson",
                  submitted: "2 days ago"
                },
                {
                  title: "Hip Hop Teaching Guide",
                  seller: "Sophia Martinez",
                  submitted: "3 days ago"
                }
              ].map((resource, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
                      <File className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      Submitted by <span className="font-medium">{resource.seller}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted {resource.submitted}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-4 w-4"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-4 w-4"
                        >
                          <path d="M18 6 6 18"/>
                          <path d="m6 6 12 12"/>
                        </svg>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-2">
              <Button asChild>
                <Link href="/admin/curriculum-officer">Go to Full Curriculum Dashboard</Link>
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Course Details Modal */}
      {selectedCourseId && (
        <CourseDetailsModal
          courseId={selectedCourseId}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            // Allow for transition animation
            setTimeout(() => setSelectedCourseId(null), 300);
          }}
        />
      )}
    </div>
  );
}