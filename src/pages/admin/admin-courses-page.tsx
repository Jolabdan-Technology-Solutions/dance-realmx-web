// // import { useState } from "react";
// // import { useQuery, useMutation } from "@tanstack/react-query";
// // import { Link } from "wouter";
// // import {
// //   BookOpen,
// //   Filter,
// //   Plus,
// //   RefreshCw,
// //   Edit,
// //   Trash2,
// //   Eye,
// //   EyeOff,
// // } from "lucide-react";
// // import { useToast } from "@/hooks/use-toast";
// // import { apiRequest, queryClient } from "@/lib/queryClient";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import {
// //   Table,
// //   TableBody,
// //   TableCaption,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import {
// //   Card,
// //   CardContent,
// //   CardDescription,
// //   CardHeader,
// //   CardTitle,
// // } from "@/components/ui/card";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogDescription,
// //   DialogFooter,
// //   DialogHeader,
// //   DialogTitle,
// // } from "@/components/ui/dialog";
// // import {
// //   Pagination,
// //   PaginationContent,
// //   PaginationItem,
// //   PaginationNext,
// //   PaginationPrevious,
// // } from "@/components/ui/pagination";
// // import { Badge } from "@/components/ui/badge";
// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// // interface Course {
// //   id: number;
// //   title: string;
// //   short_name: string;
// //   description: string | null;
// //   detailed_description?: string | null;
// //   instructor_id: number | null;
// //   price: number | null;
// //   difficulty_level: string | null;
// //   duration?: string | null;
// //   image_url: string | null;
// //   created_at: string | null;
// //   updated_at: string | null;
// //   visible: boolean | null;
// //   enrollment_count?: number;
// //   instructor?: Instructor;
// //   categories?: Category[];
// //   _count?: {
// //     enrollments: number;
// //   };
// //   average_rating?: number;
// // }

// // interface Instructor {
// //   id: number;
// //   username: string;
// //   first_name: string | null;
// //   last_name: string | null;
// //   profile_image_url: string | null;
// //   email?: string;
// // }

// // interface Category {
// //   id: number;
// //   name: string;
// //   description?: string | null;
// //   image_url?: string | null;
// // }

// // interface ApiResponse<T> {
// //   data: T;
// //   meta?: {
// //     total: number;
// //     page: number;
// //     limit: number;
// //     totalPages: number;
// //   };
// // }

// // export default function AdminCoursesPage() {
// //   const { toast } = useToast();
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
// //   const [instructorFilter, setInstructorFilter] = useState<string | null>(null);
// //   const [visibilityFilter, setVisibilityFilter] = useState<string | null>(null);
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [itemsPerPage] = useState(10);
// //   const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
// //   const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

// //   // Fetch courses
// //   const {
// //     data: coursesResponse,
// //     isLoading,
// //     refetch,
// //   } = useQuery<ApiResponse<Course[]>>({
// //     queryKey: ["/api/courses"],
// //     queryFn: async () => {
// //       const res = await apiRequest("/api/courses", {
// //         method: "GET",
// //         requireAuth: true,
// //       });

// //       console.log(res);
// //       return res;
// //     },
// //     onError: (error: any) => {
// //       const errorMessage = error.response?.data?.message || error.message;
// //       toast({
// //         title: "Error fetching courses",
// //         description: `Failed to load courses: ${errorMessage}`,
// //         variant: "destructive",
// //       });
// //     },
// //   });

// //   const courses: Course[] = coursesResponse?.data || [];

// //   // Fetch categories
// //   const { data: categoriesResponse } = useQuery<ApiResponse<Category[]>>({
// //     queryKey: ["/api/categories"],
// //     queryFn: async () => {
// //       try {
// //         const res = await apiRequest("/api/categories", {
// //           method: "GET",
// //           requireAuth: true,
// //         });
// //         return res;
// //       } catch (error: any) {
// //         const errorMessage = error.response?.data?.message || error.message;
// //         toast({
// //           title: "Error fetching categories",
// //           description: `Failed to load categories: ${errorMessage}`,
// //           variant: "destructive",
// //         });
// //         throw error;
// //       }
// //     },
// //   });
// //   const categories: Category[] = categoriesResponse?.data || [];



// //    // Handle course editing
// //   const handleEditClick = (course: Course) => {
// //     setCourseToEdit(course);
// //     setEditForm({
// //       title: course.title || "",
// //       short_name: course.short_name || "",
// //       description: course.description || "",
// //       detailed_description: course.detailed_description || "",
// //       price: course.price?.toString() || "",
// //       difficulty_level: course.difficulty_level || "",
// //       duration: course.duration || "",
// //       image_url: course.image_url || "",
// //       instructor_id: course.instructor_id?.toString() || "",
// //     });
// //     setIsEditDialogOpen(true);
// //   };

// //   // Fetch instructors
// //   const { data: instructorsResponse } = useQuery<ApiResponse<Instructor[]>>({
// //     queryKey: ["/api/instructors"],
// //     queryFn: async () => {
// //       try {
// //         const res = await apiRequest("/api/instructors", {
// //           method: "GET",
// //           requireAuth: true,
// //         });
// //         return res;
// //       } catch (error: any) {
// //         const errorMessage = error.response?.data?.message || error.message;
// //         toast({
// //           title: "Error fetching instructors",
// //           description: `Failed to load instructors: ${errorMessage}`,
// //           variant: "destructive",
// //         });
// //         throw error;
// //       }
// //     },
// //   });
// //   const instructors: Instructor[] = instructorsResponse?.data || [];

// //   // Toggle course visibility
// //   const toggleVisibilityMutation = useMutation({
// //     mutationFn: async ({
// //       courseId,
// //       visible,
// //     }: {
// //       courseId: number;
// //       visible: boolean;
// //     }) => {
// //       const res = await apiRequest(
// //         `/api/admin/courses/${courseId}/visibility`,
// //         {
// //           method: "PATCH",
// //           data: { visible },
// //           requireAuth: true,
// //         }
// //       );
// //       return res;
// //     },
// //     onSuccess: () => {
// //       toast({
// //         title: "Success",
// //         description: "Course visibility updated successfully",
// //       });
// //       queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
// //     },
// //     onError: (error: any) => {
// //       const errorMessage = error.response?.data?.message || error.message;
// //       toast({
// //         title: "Error",
// //         description: `Failed to update course visibility: ${errorMessage}`,
// //         variant: "destructive",
// //       });
// //     },
// //   });

// //   // Delete course
// //   const deleteCourseMutation = useMutation({
// //     mutationFn: async (courseId: number) => {
// //       await apiRequest(`/api/courses/${courseId}`, {
// //         method: "DELETE",
// //         requireAuth: true,
// //       });
// //     },
// //     onSuccess: () => {
// //       toast({
// //         title: "Success",
// //         description: "Course deleted successfully",
// //       });
// //       setIsConfirmDialogOpen(false);
// //       setCourseToDelete(null);
// //       queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
// //     },
// //     onError: (error: any) => {
// //       const errorMessage = error.response?.data?.message || error.message;
// //       toast({
// //         title: "Error",
// //         description: `Failed to delete course: ${errorMessage}`,
// //         variant: "destructive",
// //       });
// //     },
// //   });

// //   // Filter courses based on search query and filters
// //   const filteredCourses = courses?.filter((course) => {
// //     const matchesSearch =
// //       searchQuery === "" ||
// //       course?.title?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
// //       (course?.short_name &&
// //         course?.short_name
// //           ?.toLowerCase()
// //           .includes(searchQuery?.toLowerCase())) ||
// //       (course?.description &&
// //         course?.description
// //           ?.toLowerCase()
// //           .includes(searchQuery?.toLowerCase()));

// //     // Check if course has categories and get the first category ID
// //     const courseCategory = course?.categories?.[0];
// //     const matchesCategory =
// //       categoryFilter === null ||
// //       courseCategory?.id?.toString() === categoryFilter;

// //     const matchesInstructor =
// //       instructorFilter === null ||
// //       course?.instructor_id?.toString() === instructorFilter;

// //     const matchesVisibility =
// //       visibilityFilter === null ||
// //       (visibilityFilter === "visible" && course?.visible === true) ||
// //       (visibilityFilter === "hidden" &&
// //         (course?.visible === false || course?.visible === null));

// //     return (
// //       matchesSearch && matchesCategory && matchesInstructor && matchesVisibility
// //     );
// //   });

// //   // Pagination
// //   const indexOfLastItem = currentPage * itemsPerPage;
// //   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
// //   const currentCourses =
// //     filteredCourses?.slice(indexOfFirstItem, indexOfLastItem) || [];
// //   const totalPages = Math.ceil((filteredCourses?.length || 0) / itemsPerPage);

// //   // Handle visibility toggle
// //   const handleToggleVisibility = (
// //     courseId: number,
// //     currentVisibility: boolean | null
// //   ) => {
// //     toggleVisibilityMutation?.mutate({
// //       courseId,
// //       visible: !(currentVisibility === true),
// //     });
// //   };

// //   // Handle course deletion
// //   const handleDeleteClick = (courseId: number) => {
// //     setCourseToDelete(courseId);
// //     setIsConfirmDialogOpen(true);
// //   };

// //   const confirmDelete = () => {
// //     if (courseToDelete !== null) {
// //       deleteCourseMutation?.mutate(courseToDelete);
// //     }
// //   };

// //   // Format date
// //   const formatDate = (date: string | null) => {
// //     if (!date) return "—";
// //     return new Date(date)?.toLocaleDateString();
// //   };

// //   // Get instructor name
// //   const getInstructorName = (course: Course) => {
// //     // First try to get from the embedded instructor object
// //     if (course?.instructor) {
// //       const instructor = course.instructor;
// //       return instructor?.first_name && instructor?.last_name
// //         ? `${instructor.first_name} ${instructor.last_name}`
// //         : instructor?.username || "—";
// //     }

// //     // Fallback to finding by instructor_id
// //     if (!course?.instructor_id) return "—";
// //     const instructor = instructors?.find((i) => i?.id === course.instructor_id);
// //     if (!instructor) return `ID: ${course.instructor_id}`;
// //     return instructor?.first_name && instructor?.last_name
// //       ? `${instructor?.first_name} ${instructor?.last_name}`
// //       : instructor?.username;
// //   };

// //   // Get category name
// //   const getCategoryName = (course: Course) => {
// //     // Get from embedded categories array
// //     if (course?.categories && course.categories.length > 0) {
// //       return course.categories[0].name;
// //     }
// //     return "—";
// //   };

// //   // Get instructor profile image
// //   const getInstructorImage = (course: Course) => {
// //     if (course?.instructor?.profile_image_url) {
// //       return course.instructor.profile_image_url;
// //     }
// //     return undefined;
// //   };

// //   return (
// //     <>
// //       <div className="space-y-6">
// //         <div className="flex items-center justify-between">
// //           <div>
// //             <h1 className="text-3xl font-bold tracking-tight">
// //               Course Management
// //             </h1>
// //             <p className="text-gray-400">Manage all courses in the system</p>
// //           </div>
// //           <div className="flex items-center space-x-2">
// //             <Button variant="outline" onClick={() => refetch()}>
// //               <RefreshCw className="w-4 h-4 mr-2" />
// //               Refresh
// //             </Button>
// //             <Link href="/instructor/courses/create">
// //               <Button className="bg-green-600 hover:bg-green-700">
// //                 <Plus className="w-4 h-4 mr-2" />
// //                 Create Course
// //               </Button>
// //             </Link>
// //           </div>
// //         </div>

// //         <Card>
// //           <CardHeader>
// //             <CardTitle>Courses</CardTitle>
// //             <CardDescription>View and manage all courses</CardDescription>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
// //               <div className="relative w-full md:w-64">
// //                 <Input
// //                   placeholder="Search courses..."
// //                   value={searchQuery}
// //                   onChange={(e) => setSearchQuery(e.target.value)}
// //                   className="pl-10"
// //                 />
// //                 <div className="absolute left-3 top-3 text-gray-400">
// //                   <Filter className="h-4 w-4" />
// //                 </div>
// //               </div>

// //               <Select
// //                 value={categoryFilter || "all"}
// //                 onValueChange={(value) =>
// //                   setCategoryFilter(value === "all" ? null : value)
// //                 }
// //               >
// //                 <SelectTrigger className="w-full md:w-48">
// //                   <SelectValue placeholder="Filter by category" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="all">All Categories</SelectItem>
// //                   {categories?.map((category) => (
// //                     <SelectItem
// //                       key={category.id}
// //                       value={category.id.toString()}
// //                     >
// //                       {category.name}
// //                     </SelectItem>
// //                   ))}
// //                 </SelectContent>
// //               </Select>

// //               <Select
// //                 value={instructorFilter || "all"}
// //                 onValueChange={(value) =>
// //                   setInstructorFilter(value === "all" ? null : value)
// //                 }
// //               >
// //                 <SelectTrigger className="w-full md:w-48">
// //                   <SelectValue placeholder="Filter by instructor" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="all">All Instructors</SelectItem>
// //                   {instructors?.map((instructor) => (
// //                     <SelectItem
// //                       key={instructor.id}
// //                       value={instructor.id.toString()}
// //                     >
// //                       {instructor.first_name && instructor.last_name
// //                         ? `${instructor.first_name} ${instructor.last_name}`
// //                         : instructor.username}
// //                     </SelectItem>
// //                   ))}
// //                 </SelectContent>
// //               </Select>

// //               <Select
// //                 value={visibilityFilter || "all"}
// //                 onValueChange={(value) =>
// //                   setVisibilityFilter(value === "all" ? null : value)
// //                 }
// //               >
// //                 <SelectTrigger className="w-full md:w-48">
// //                   <SelectValue placeholder="Filter by visibility" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="all">All Visibility</SelectItem>
// //                   <SelectItem value="visible">Visible</SelectItem>
// //                   <SelectItem value="hidden">Hidden</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             {isLoading ? (
// //               <div className="py-24 flex items-center justify-center">
// //                 <div
// //                   className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
// //                   aria-label="Loading"
// //                 />
// //               </div>
// //             ) : (
// //               <>
// //                 <div className="rounded-md border">
// //                   <Table>
// //                     <TableCaption>A list of all courses</TableCaption>
// //                     <TableHeader>
// //                       <TableRow>
// //                         <TableHead>Course</TableHead>
// //                         <TableHead>Instructor</TableHead>
// //                         <TableHead>Category</TableHead>
// //                         <TableHead>Created</TableHead>
// //                         <TableHead>Price</TableHead>
// //                         <TableHead>Visibility</TableHead>
// //                         <TableHead className="text-right">Actions</TableHead>
// //                       </TableRow>
// //                     </TableHeader>
// //                     <TableBody>
// //                       {currentCourses?.length === 0 ? (
// //                         <TableRow>
// //                           <TableCell colSpan={7} className="text-center py-10">
// //                             No courses found matching your criteria
// //                           </TableCell>
// //                         </TableRow>
// //                       ) : (
// //                         currentCourses?.map((course) => (
// //                           <TableRow key={course?.id}>
// //                             <TableCell>
// //                               <div className="flex items-center space-x-3">
// //                                 <div className="w-10 h-10 rounded overflow-hidden bg-gray-700 flex-shrink-0">
// //                                   {course?.image_url ? (
// //                                     <img
// //                                       src={course?.image_url}
// //                                       alt={course?.title}
// //                                       className="w-full h-full object-cover"
// //                                     />
// //                                   ) : (
// //                                     <div className="w-full h-full flex items-center justify-center">
// //                                       <BookOpen className="w-5 h-5 text-gray-400" />
// //                                     </div>
// //                                   )}
// //                                 </div>
// //                                 <div>
// //                                   <div className="font-medium">
// //                                     {course?.title}
// //                                   </div>
// //                                   <div className="text-sm text-gray-500">
// //                                     ID: {course?.id}
// //                                   </div>
// //                                 </div>
// //                               </div>
// //                             </TableCell>
// //                             <TableCell>
// //                               {course?.instructor || course?.instructor_id ? (
// //                                 <div className="flex items-center space-x-2">
// //                                   <Avatar className="h-6 w-6">
// //                                     <AvatarImage
// //                                       src={getInstructorImage(course)}
// //                                       alt={getInstructorName(course)}
// //                                     />
// //                                     <AvatarFallback className="text-xs">
// //                                       {getInstructorName(course).substring(
// //                                         0,
// //                                         2
// //                                       )}
// //                                     </AvatarFallback>
// //                                   </Avatar>
// //                                   <span>{getInstructorName(course)}</span>
// //                                 </div>
// //                               ) : (
// //                                 "—"
// //                               )}
// //                             </TableCell>
// //                             <TableCell>{getCategoryName(course)}</TableCell>
// //                             <TableCell>
// //                               {formatDate(course?.created_at)}
// //                             </TableCell>
// //                             <TableCell>
// //                               {course?.price ? `$${course?.price}` : "—"}
// //                             </TableCell>
// //                             <TableCell>
// //                               {course?.visible === true ? (
// //                                 <Badge variant="default">Visible</Badge>
// //                               ) : (
// //                                 <Badge variant="secondary">Hidden</Badge>
// //                               )}
// //                             </TableCell>
// //                             <TableCell className="text-right">
// //                               <div className="flex justify-end space-x-2">
// //                                 <Button
// //                                   variant="outline"
// //                                   size="icon"
// //                                   onClick={() =>
// //                                     handleToggleVisibility(
// //                                       course?.id,
// //                                       course?.visible
// //                                     )
// //                                   }
// //                                   disabled={toggleVisibilityMutation?.isPending}
// //                                 >
// //                                   {course?.visible ? (
// //                                     <EyeOff className="h-4 w-4" />
// //                                   ) : (
// //                                     <Eye className="h-4 w-4" />
// //                                   )}
// //                                 </Button>
// //                                 <Link
// //                                   href={`/instructor/courses/${course}`}
// //                                 >
// //                                   <Button variant="outline" size="icon" onClick={() => handleEditClick(courses)}>
// //                                     <Edit className="h-4 w-4" />
// //                                   </Button>
// //                                 </Link>
// //                                 <Button
// //                                   variant="destructive"
// //                                   size="icon"
// //                                   onClick={() => handleDeleteClick(course?.id)}
// //                                   disabled={deleteCourseMutation?.isPending}
// //                                 >
// //                                   <Trash2 className="h-4 w-4" />
// //                                 </Button>
// //                               </div>
// //                             </TableCell>
// //                           </TableRow>
// //                         ))
// //                       )}
// //                     </TableBody>
// //                   </Table>
// //                 </div>

// //                 {totalPages > 1 && (
// //                   <Pagination className="mt-4">
// //                     <PaginationContent>
// //                       <PaginationItem>
// //                         <PaginationPrevious
// //                           onClick={() =>
// //                             setCurrentPage((prev) => Math.max(prev - 1, 1))
// //                           }
// //                           className={
// //                             currentPage === 1
// //                               ? "pointer-events-none opacity-50"
// //                               : ""
// //                           }
// //                         />
// //                       </PaginationItem>
// //                       <PaginationItem>
// //                         <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
// //                       </PaginationItem>
// //                       <PaginationItem>
// //                         <PaginationNext
// //                           onClick={() =>
// //                             setCurrentPage((prev) =>
// //                               Math.min(prev + 1, totalPages)
// //                             )
// //                           }
// //                           className={
// //                             currentPage === totalPages
// //                               ? "pointer-events-none opacity-50"
// //                               : ""
// //                           }
// //                         />
// //                       </PaginationItem>
// //                     </PaginationContent>
// //                   </Pagination>
// //                 )}
// //               </>
// //             )}
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Confirmation Dialog */}
// //       <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
// //         <DialogContent>
// //           <DialogHeader>
// //             <DialogTitle>Confirm Course Deletion</DialogTitle>
// //             <DialogDescription>
// //               Are you sure you want to delete this course? This action cannot be
// //               undone, and all associated modules, lessons, and enrollments will
// //               also be deleted.
// //             </DialogDescription>
// //           </DialogHeader>
// //           <DialogFooter>
// //             <Button
// //               variant="outline"
// //               onClick={() => setIsConfirmDialogOpen(false)}
// //             >
// //               Cancel
// //             </Button>
// //             <Button
// //               variant="destructive"
// //               onClick={confirmDelete}
// //               disabled={deleteCourseMutation?.isPending}
// //             >
// //               {deleteCourseMutation?.isPending
// //                 ? "Deleting..."
// //                 : "Delete Course"}
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>
// //     </>
// //   );
// // }


// import { useState, useMemo } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { Link } from "wouter";
// import {
//   BookOpen,
//   Filter,
//   Plus,
//   RefreshCw,
//   Edit,
//   Trash2,
//   Eye,
//   EyeOff,
// } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import CourseEditPage from "@/components/form/Edit-course";

// interface Course {
//   id: number;
//   title: string;
//   short_name: string;
//   description: string | null;
//   detailed_description?: string | null;
//   instructor_id: number | null;
//   price: number | null;
//   difficulty_level: string | null;
//   duration?: string | null;
//   image_url: string | null;
//   created_at: string | null;
//   updated_at: string | null;
//   visible: boolean | null;
//   enrollment_count?: number;
//   instructor?: Instructor;
//   categories?: Category[];
//   _count?: {
//     enrollments: number;
//   };
//   average_rating?: number;
// }

// interface Instructor {
//   id: number;
//   username: string;
//   first_name: string | null;
//   last_name: string | null;
//   profile_image_url: string | null;
//   email?: string;
// }

// interface Category {
//   id: number;
//   name: string;
//   description?: string | null;
//   image_url?: string | null;
// }

// interface ApiResponse<T> {
//   data: T;
//   meta?: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

// export default function AdminCoursesPage() {
//   const { toast } = useToast();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
//   const [instructorFilter, setInstructorFilter] = useState<string | null>(null);
//   const [visibilityFilter, setVisibilityFilter] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);
//   const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
//   const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

//   // Fetch courses
//   const {
//     data: coursesResponse,
//     isLoading: isLoadingCourses,
//     refetch,
//   } = useQuery<ApiResponse<Course[]>>({
//     queryKey: ["/api/courses"],
//     queryFn: async () => {
//       try {
//         const res = await apiRequest("/api/courses", {
//           method: "GET",
//           requireAuth: true,
//         });
//         return res;
//       } catch (error: any) {
//         const errorMessage = error.response?.data?.message || error.message;
//         toast({
//           title: "Error fetching courses",
//           description: `Failed to load courses: ${errorMessage}`,
//           variant: "destructive",
//         });
//         throw error;
//       }
//     },
//   });

//   const courses: Course[] = coursesResponse?.data || [];

//   // Fetch categories
//   const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery<
//     ApiResponse<Category[]>
//   >({
//     queryKey: ["/api/categories"],
//     queryFn: async () => {
//       try {
//         const res = await apiRequest("/api/categories", {
//           method: "GET",
//           requireAuth: true,
//         });
//         return res;
//       } catch (error: any) {
//         const errorMessage = error.response?.data?.message || error.message;
//         toast({
//           title: "Error fetching categories",
//           description: `Failed to load categories: ${errorMessage}`,
//           variant: "destructive",
//         });
//         throw error;
//       }
//     },
//   });
//   const categories: Category[] = categoriesResponse?.data || [];

//   // Fetch instructors
//   const { data: instructorsResponse, isLoading: isLoadingInstructors } = useQuery<
//     ApiResponse<Instructor[]>
//   >({
//     queryKey: ["/api/instructors"],
//     queryFn: async () => {
//       try {
//         const res = await apiRequest("/api/instructors", {
//           method: "GET",
//           requireAuth: true,
//         });
//         return res;
//       } catch (error: any) {
//         const errorMessage = error.response?.data?.message || error.message;
//         toast({
//           title: "Error fetching instructors",
//           description: `Failed to load instructors: ${errorMessage}`,
//           variant: "destructive",
//         });
//         throw error;
//       }
//     },
//   });
//   const instructors: Instructor[] = instructorsResponse?.data || [];

//   // Toggle course visibility
//   const toggleVisibilityMutation = useMutation({
//     mutationFn: async ({
//       courseId,
//       visible,
//     }: {
//       courseId: number;
//       visible: boolean;
//     }) => {
//       const res = await apiRequest(
//         `/api/courses/${courseId}/visibility`,
//         {
//           method: "PUT",
//           data: { visible },
//           requireAuth: true,
//         }
//       );
//       return res;
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "Course visibility updated successfully",
//       });
//       queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
//     },
//     onError: (error: any) => {
//       const errorMessage = error.response?.data?.message || error.message;
//       toast({
//         title: "Error",
//         description: `Failed to update course visibility: ${errorMessage}`,
//         variant: "destructive",
//       });
//     },
//   });

//   // Delete course
//   const deleteCourseMutation = useMutation({
//     mutationFn: async (courseId: number) => {
//       await apiRequest(`/api/courses/${courseId}`, {
//         method: "DELETE",
//         requireAuth: true,
//       });
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "Course deleted successfully",
//       });
//       setIsConfirmDialogOpen(false);
//       setCourseToDelete(null);
//       queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
//     },
//     onError: (error: any) => {
//       const errorMessage = error.response?.data?.message || error.message;
//       toast({
//         title: "Error",
//         description: `Failed to delete course: ${errorMessage}`,
//         variant: "destructive",
//       });
//     },
//   });

//   // Filter courses based on search query and filters
//   const filteredCourses = useMemo(() => {
//     return courses.filter((course) => {
//       const matchesSearch =
//         searchQuery === "" ||
//         course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         (course.short_name &&
//           course.short_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
//         (course.description &&
//           course.description.toLowerCase().includes(searchQuery.toLowerCase()));

//       const courseCategory = course.categories?.[0];
//       const matchesCategory =
//         categoryFilter === null ||
//         courseCategory?.id?.toString() === categoryFilter;

//       const matchesInstructor =
//         instructorFilter === null ||
//         course.instructor_id?.toString() === instructorFilter;

//       const matchesVisibility =
//         visibilityFilter === null ||
//         (visibilityFilter === "visible" && course.visible === true) ||
//         (visibilityFilter === "hidden" &&
//           (course.visible === false || course.visible === null));

//       return (
//         matchesSearch && matchesCategory && matchesInstructor && matchesVisibility
//       );
//     });
//   }, [courses, searchQuery, categoryFilter, instructorFilter, visibilityFilter]);

//   // Pagination
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

//   // Handle visibility toggle
//   const handleToggleVisibility = (
//     courseId: number,
//     currentVisibility: boolean | null
//   ) => {
//     toggleVisibilityMutation.mutate({
//       courseId,
//       visible: !(currentVisibility === true),
//     });
//   };

//   // Handle course deletion
//   const handleDeleteClick = (courseId: number) => {
//     setCourseToDelete(courseId);
//     setIsConfirmDialogOpen(true);
//   };

//   const confirmDelete = () => {
//     if (courseToDelete !== null) {
//       deleteCourseMutation.mutate(courseToDelete);
//     }
//   };

//   // Handle course editing
//   // Handle course editing
//   const handleEditClick = (course: Course) => {
//     setIsEditDialogOpen(true);
//   };
//   // Format date
//   const formatDate = (date: string | null) => {
//     if (!date) return "—";
//     return new Date(date).toLocaleDateString();
//   };

//   // Get instructor name
//   const getInstructorName = (course: Course) => {
//     if (course.instructor) {
//       const instructor = course.instructor;
//       return instructor.first_name && instructor.last_name
//         ? `${instructor.first_name} ${instructor.last_name}`
//         : instructor.username || "—";
//     }

//     if (!course.instructor_id) return "—";
//     const instructor = instructors.find((i) => i.id === course.instructor_id);
//     if (!instructor) return `ID: ${course.instructor_id}`;
//     return instructor.first_name && instructor.last_name
//       ? `${instructor.first_name} ${instructor.last_name}`
//       : instructor.username;
//   };

//   // Get category name
//   const getCategoryName = (course: Course) => {
//     if (course.categories && course.categories.length > 0) {
//       return course.categories[0].name;
//     }
//     return "—";
//   };

//   // Get instructor profile image
//   const getInstructorImage = (course: Course) => {
//     if (course.instructor?.profile_image_url) {
//       return course.instructor.profile_image_url;
//     }
//     return undefined;
//   };

//   const isLoading = isLoadingCourses || isLoadingCategories || isLoadingInstructors;

//   return (
//     <>
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">
//               Course Management
//             </h1>
//             <p className="text-gray-400">Manage all courses in the system</p>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button variant="outline" onClick={() => refetch()}>
//               <RefreshCw className="w-4 h-4 mr-2" />
//               Refresh
//             </Button>
//             <Link href="/instructor/courses/create">
//               <Button className="bg-green-600 hover:bg-green-700">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create Course
//               </Button>
//             </Link>
//           </div>
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle>Courses</CardTitle>
//             <CardDescription>View and manage all courses</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
//               <div className="relative w-full md:w-64">
//                 <Input
//                   placeholder="Search courses..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10"
//                 />
//                 <div className="absolute left-3 top-3 text-gray-400">
//                   <Filter className="h-4 w-4" />
//                 </div>
//               </div>

//               <Select
//                 value={categoryFilter || "all"}
//                 onValueChange={(value) =>
//                   setCategoryFilter(value === "all" ? null : value)
//                 }
//               >
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Filter by category" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Categories</SelectItem>
//                   {categories.map((category) => (
//                     <SelectItem
//                       key={category.id}
//                       value={category.id.toString()}
//                     >
//                       {category.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>

//               <Select
//                 value={instructorFilter || "all"}
//                 onValueChange={(value) =>
//                   setInstructorFilter(value === "all" ? null : value)
//                 }
//               >
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Filter by instructor" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Instructors</SelectItem>
//                   {instructors.map((instructor) => (
//                     <SelectItem
//                       key={instructor.id}
//                       value={instructor.id.toString()}
//                     >
//                       {instructor.first_name && instructor.last_name
//                         ? `${instructor.first_name} ${instructor.last_name}`
//                         : instructor.username}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>

//               <Select
//                 value={visibilityFilter || "all"}
//                 onValueChange={(value) =>
//                   setVisibilityFilter(value === "all" ? null : value)
//                 }
//               >
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Filter by visibility" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Visibility</SelectItem>
//                   <SelectItem value="visible">Visible</SelectItem>
//                   <SelectItem value="hidden">Hidden</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {isLoading ? (
//               <div className="py-24 flex items-center justify-center">
//                 <div
//                   className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
//                   aria-label="Loading"
//                 />
//               </div>
//             ) : (
//               <>
//                 <div className="rounded-md border">
//                   <Table>
//                     <TableCaption>A list of all courses</TableCaption>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Course</TableHead>
//                         <TableHead>Instructor</TableHead>
//                         <TableHead>Category</TableHead>
//                         <TableHead>Created</TableHead>
//                         <TableHead>Price</TableHead>
//                         <TableHead>Visibility</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {currentCourses.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={7} className="text-center py-10">
//                             No courses found matching your criteria
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         currentCourses.map((course) => (
//                           <TableRow key={course.id}>
//                             <TableCell>
//                               <div className="flex items-center space-x-3">
//                                 <div className="w-10 h-10 rounded overflow-hidden bg-gray-700 flex-shrink-0">
//                                   {course.image_url ? (
//                                     <img
//                                       src={course.image_url}
//                                       alt={course.title}
//                                       className="w-full h-full object-cover"
//                                     />
//                                   ) : (
//                                     <div className="w-full h-full flex items-center justify-center">
//                                       <BookOpen className="w-5 h-5 text-gray-400" />
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div>
//                                   <div className="font-medium">
//                                     {course.title}
//                                   </div>
//                                   <div className="text-sm text-gray-500">
//                                     ID: {course.id}
//                                   </div>
//                                 </div>
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               {course.instructor || course.instructor_id ? (
//                                 <div className="flex items-center space-x-2">
//                                   <Avatar className="h-6 w-6">
//                                     <AvatarImage
//                                       src={getInstructorImage(course)}
//                                       alt={getInstructorName(course)}
//                                     />
//                                     <AvatarFallback className="text-xs">
//                                       {getInstructorName(course).substring(0, 2)}
//                                     </AvatarFallback>
//                                   </Avatar>
//                                   <span>{getInstructorName(course)}</span>
//                                 </div>
//                               ) : (
//                                 "—"
//                               )}
//                             </TableCell>
//                             <TableCell>{getCategoryName(course)}</TableCell>
//                             <TableCell>
//                               {formatDate(course.created_at)}
//                             </TableCell>
//                             <TableCell>
//                               {course.price ? `$${course.price}` : "—"}
//                             </TableCell>
//                             <TableCell>
//                               {course.visible === true ? (
//                                 <Badge variant="default">Visible</Badge>
//                               ) : (
//                                 <Badge variant="secondary">Hidden</Badge>
//                               )}
//                             </TableCell>
//                             <TableCell className="text-right">
//                               <div className="flex justify-end space-x-2">
//                                 <Button
//                                   variant="outline"
//                                   size="icon"
//                                   onClick={() =>
//                                     handleToggleVisibility(
//                                       course.id,
//                                       course.visible
//                                     )
//                                   }
//                                   disabled={toggleVisibilityMutation.isPending}
//                                   aria-label={
//                                     course.visible
//                                       ? "Hide course"
//                                       : "Show course"
//                                   }
//                                 >
//                                   {course.visible ? (
//                                     <EyeOff className="h-4 w-4" />
//                                   ) : (
//                                     <Eye className="h-4 w-4" />
//                                   )}
//                                 </Button>
//                                 <Button
//                                   variant="outline"
//                                   size="icon"
//                                   onClick={() => handleEditClick(course)}
//                                   aria-label="Edit course"
//                                 >
//                                   <Edit className="h-4 w-4" />
//                                 </Button>
//                                 <Button
//                                   variant="destructive"
//                                   size="icon"
//                                   onClick={() => handleDeleteClick(course.id)}
//                                   disabled={deleteCourseMutation.isPending}
//                                   aria-label="Delete course"
//                                 >
//                                   <Trash2 className="h-4 w-4" />
//                                 </Button>
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>

//                 {totalPages > 1 && (
//                   <Pagination className="mt-4">
//                     <PaginationContent>
//                       <PaginationItem>
//                         <PaginationPrevious
//                           onClick={() =>
//                             setCurrentPage((prev) => Math.max(prev - 1, 1))
//                           }
//                           className={
//                             currentPage === 1
//                               ? "pointer-events-none opacity-50"
//                               : ""
//                           }
//                         />
//                       </PaginationItem>
//                       <PaginationItem>
//                         <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
//                       </PaginationItem>
//                       <PaginationItem>
//                         <PaginationNext
//                           onClick={() =>
//                             setCurrentPage((prev) =>
//                               Math.min(prev + 1, totalPages)
//                             )
//                           }
//                           className={
//                             currentPage === totalPages
//                               ? "pointer-events-none opacity-50"
//                               : ""
//                           }
//                         />
//                       </PaginationItem>
//                     </PaginationContent>
//                   </Pagination>
//                 )}
//               </>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Confirmation Dialog */}
//       <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Confirm Course Deletion</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete this course? This action cannot be
//               undone, and all associated modules, lessons, and enrollments will
//               also be deleted.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsConfirmDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={confirmDelete}
//               disabled={deleteCourseMutation.isPending}
//             >
//               {deleteCourseMutation.isPending
//                 ? "Deleting..."
//                 : "Delete Course"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Edit Dialog - Placeholder for future implementation */}
//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Edit Course</DialogTitle>
//             <DialogDescription>
//               Make changes to the course details below.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             {/* Add your edit form fields here */}
//             {/* <p className="text-center py-8">Edit form will be implemented here</p> */}
//             <CourseEditPage id={courses}/>
//           </div>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsEditDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button type="submit">Save Changes</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }


import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BookOpen,
  Filter,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Course {
  id: number;
  title: string;
  short_name: string;
  description: string | null;
  detailed_description?: string | null;
  instructor_id: number | null;
  price: number | null;
  difficulty_level: string | null;
  duration?: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  visible: boolean | null;
  enrollment_count?: number;
  instructor?: Instructor;
  categories?: Category[];
  _count?: {
    enrollments: number;
  };
  average_rating?: number;
}

interface Instructor {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  email?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
}

interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminCoursesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [instructorFilter, setInstructorFilter] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

  // Fetch courses
  const {
    data: coursesResponse,
    isLoading: isLoadingCourses,
    refetch,
  } = useQuery<ApiResponse<Course[]>>({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/courses", {
          method: "GET",
          requireAuth: true,
        });
        return res;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        toast({
          title: "Error fetching courses",
          description: `Failed to load courses: ${errorMessage}`,
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const courses: Course[] = coursesResponse?.data || [];

  // Fetch categories
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery<
    ApiResponse<Category[]>
  >({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/categories", {
          method: "GET",
          requireAuth: true,
        });
        return res;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        toast({
          title: "Error fetching categories",
          description: `Failed to load categories: ${errorMessage}`,
          variant: "destructive",
        });
        throw error;
      }
    },
  });
  const categories: Category[] = categoriesResponse?.data || [];

  // Fetch instructors
  const { data: instructorsResponse, isLoading: isLoadingInstructors } = useQuery<
    ApiResponse<Instructor[]>
  >({
    queryKey: ["/api/instructors"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/instructors", {
          method: "GET",
          requireAuth: true,
        });
        return res;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        toast({
          title: "Error fetching instructors",
          description: `Failed to load instructors: ${errorMessage}`,
          variant: "destructive",
        });
        throw error;
      }
    },
  });
  const instructors: Instructor[] = instructorsResponse?.data || [];

  // Toggle course visibility
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({
      courseId,
      visible,
    }: {
      courseId: number;
      visible: boolean;
    }) => {
      const res = await apiRequest(
        `/api/courses/${courseId}/visibility`,
        {
          method: "PUT",
          data: { visible },
          requireAuth: true,
        }
      );
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course visibility updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error",
        description: `Failed to update course visibility: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  // Delete course
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest(`/api/courses/${courseId}`, {
        method: "DELETE",
        requireAuth: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      setIsConfirmDialogOpen(false);
      setCourseToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error",
        description: `Failed to delete course: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  // Filter courses based on search query and filters
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === "" ||
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.short_name &&
          course.short_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.description &&
          course.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const courseCategory = course.categories?.[0];
      const matchesCategory =
        categoryFilter === null ||
        courseCategory?.id?.toString() === categoryFilter;

      const matchesInstructor =
        instructorFilter === null ||
        course.instructor_id?.toString() === instructorFilter;

      const matchesVisibility =
        visibilityFilter === null ||
        (visibilityFilter === "visible" && course.visible === true) ||
        (visibilityFilter === "hidden" &&
          (course.visible === false || course.visible === null));

      return (
        matchesSearch && matchesCategory && matchesInstructor && matchesVisibility
      );
    });
  }, [courses, searchQuery, categoryFilter, instructorFilter, visibilityFilter]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  // Handle visibility toggle
  const handleToggleVisibility = (
    courseId: number,
    currentVisibility: boolean | null
  ) => {
    toggleVisibilityMutation.mutate({
      courseId,
      visible: !(currentVisibility === true),
    });
  };

  // Handle course deletion
  const handleDeleteClick = (courseId: number) => {
    setCourseToDelete(courseId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    if (courseToDelete !== null) {
      deleteCourseMutation.mutate(courseToDelete);
    }
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  // Get instructor name
  const getInstructorName = (course: Course) => {
    if (course.instructor) {
      const instructor = course.instructor;
      return instructor.first_name && instructor.last_name
        ? `${instructor.first_name} ${instructor.last_name}`
        : instructor.username || "—";
    }

    if (!course.instructor_id) return "—";
    const instructor = instructors.find((i) => i.id === course.instructor_id);
    if (!instructor) return `ID: ${course.instructor_id}`;
    return instructor.first_name && instructor.last_name
      ? `${instructor.first_name} ${instructor.last_name}`
      : instructor.username;
  };

  // Get category name
  const getCategoryName = (course: Course) => {
    if (course.categories && course.categories.length > 0) {
      return course.categories[0].name;
    }
    return "—";
  };

  // Get instructor profile image
  const getInstructorImage = (course: Course) => {
    if (course.instructor?.profile_image_url) {
      return course.instructor.profile_image_url;
    }
    return undefined;
  };

  const isLoading = isLoadingCourses || isLoadingCategories || isLoadingInstructors;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Course Management
            </h1>
            <p className="text-gray-400">Manage all courses in the system</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/instructor/courses/create">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>View and manage all courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full md:w-64">
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Filter className="h-4 w-4" />
                </div>
              </div>

              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) =>
                  setCategoryFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={instructorFilter || "all"}
                onValueChange={(value) =>
                  setInstructorFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem
                      key={instructor.id}
                      value={instructor.id.toString()}
                    >
                      {instructor.first_name && instructor.last_name
                        ? `${instructor.first_name} ${instructor.last_name}`
                        : instructor.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={visibilityFilter || "all"}
                onValueChange={(value) =>
                  setVisibilityFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="py-24 flex items-center justify-center">
                <div
                  className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                  aria-label="Loading"
                />
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableCaption>A list of all courses</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentCourses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10">
                            No courses found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentCourses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                                  {course.image_url ? (
                                    <img
                                      src={course.image_url}
                                      alt={course.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <BookOpen className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {course.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {course.id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {course.instructor || course.instructor_id ? (
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={getInstructorImage(course)}
                                      alt={getInstructorName(course)}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {getInstructorName(course).substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{getInstructorName(course)}</span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>{getCategoryName(course)}</TableCell>
                            <TableCell>
                              {formatDate(course.created_at)}
                            </TableCell>
                            <TableCell>
                              {course.price ? `$${course.price}` : "—"}
                            </TableCell>
                            <TableCell>
                              {course.visible === true ? (
                                <Badge variant="default">Visible</Badge>
                              ) : (
                                <Badge variant="secondary">Hidden</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleToggleVisibility(
                                      course.id,
                                      course.visible
                                    )
                                  }
                                  disabled={toggleVisibilityMutation.isPending}
                                  aria-label={
                                    course.visible
                                      ? "Hide course"
                                      : "Show course"
                                  }
                                >
                                  {course.visible ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                {/* Fixed: Navigate to edit page with course ID */}
                                <Link href={`/instructor/courses/${course.id}/edit`}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Edit course"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteClick(course.id)}
                                  disabled={deleteCourseMutation.isPending}
                                  aria-label="Delete course"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Course Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be
              undone, and all associated modules, lessons, and enrollments will
              also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending
                ? "Deleting..."
                : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

