// // // import { useState, useEffect } from "react";
// // // import { useAuth } from "../../hooks/use-auth";
// // // import { useQuery, useMutation } from "@tanstack/react-query";
// // // import { Link, useLocation } from "wouter";
// // // import { Loader2, ArrowLeft, Save, RefreshCw } from "lucide-react";
// // // import { useForm } from "react-hook-form";
// // // import { zodResolver } from "@hookform/resolvers/zod";
// // // import { z } from "zod";
// // // import { apiRequest, queryClient } from "../../lib/queryClient";
// // // import { convertToYouTubeEmbedUrl } from "../../lib/utils";
// // // import { Button } from "../../components/ui/button";
// // // import {
// // //   Form,
// // //   FormControl,
// // //   FormDescription,
// // //   FormField,
// // //   FormItem,
// // //   FormLabel,
// // //   FormMessage,
// // // } from "../../components/ui/form";
// // // import { Input } from "../../components/ui/input";
// // // import { Textarea } from "../../components/ui/textarea";
// // // import {
// // //   Select,
// // //   SelectContent,
// // //   SelectItem,
// // //   SelectTrigger,
// // //   SelectValue,
// // // } from "../../components/ui/select";
// // // import { Switch } from "../../components/ui/switch";
// // // import { FileUpload } from "../../components/ui/file-upload";
// // // import { Category, courses, insertCourseSchema } from "@/shared/schema";
// // // import { useToast } from "../../hooks/use-toast";

// // // // Define the expected response type for course creation
// // // type CourseCreateResponse = {
// // //   id: number;
// // //   title: string;
// // //   message?: string;
// // // };

// // // // Create a proper form schema that matches your form fields
// // // const createCourseFormSchema = z.object({
// // //   title: z.string().min(5, "Title must be at least 5 characters"),
// // //   shortName: z.string().min(2, "Short name must be at least 2 characters"),
// // //   description: z.string().min(20, "Description must be at least 20 characters"),
// // //   detailedDescription: z.string().optional(),
// // //   imageUrl: z.string().optional(),
// // //   price: z.string().optional(),
// // //   categoryId: z.number().optional(),
// // //   instructorId: z.number().nullable(),
// // //   difficultyLevel: z.string(),
// // //   estimatedDuration: z.string().optional(),
// // //   visible: z.boolean(),
// // //   previewVideoUrl: z.string().optional(),
// // //   fullVideoUrl: z.string().optional(),
// // // });

// // // // Define the form field types to match the schema
// // // type CourseFormFields = z.infer<typeof createCourseFormSchema>;

// // // // Type for the API request (snake_case)
// // // type CreateCourseApiRequest = {
// // //   title: string;
// // //   short_name: string;
// // //   description?: string;
// // //   detailed_description?: string;
// // //   image_url?: string;
// // //   price?: string;
// // //   category_id?: number | null;
// // //   instructor_id?: number | null;
// // //   level?: string;
// // //   duration?: string;
// // //   visible?: boolean;
// // //   preview_video_url?: string;
// // //   full_video_url?: string;
// // // };

// // // export default function CourseCreatePage() {
// // //   const { user, isLoading: authLoading } = useAuth();
// // //   const [_, navigate] = useLocation();
// // //   const { toast } = useToast();

// // //   // Fetch categories with improved error handling and retry logic
// // //   const {
// // //     data: categories,
// // //     isLoading: categoriesLoading,
// // //     error: categoriesError,
// // //     refetch: refetchCategories,
// // //     isError: isCategoriesError,
// // //   } = useQuery<Category[]>({
// // //     queryKey: ["categories"],
// // //     queryFn: async () => {
// // //       console.log("Fetching categories...");

// // //       try {
// // //         const response = await apiRequest("/api/categories", {
// // //           method: "GET",
// // //         });

// // //         console.log("API Response status:", response.status);

// // //         const responseData = await response.data;
// // //         console.log("Categories API response:", response.data);
// // //         console.log("Categories API response 2:", response);

// // //         // Handle different response formats
// // //         let categoriesArray;
// // //         if (responseData.data && Array.isArray(responseData.data)) {
// // //           categoriesArray = responseData.data;
// // //         } else if (Array.isArray(responseData)) {
// // //           categoriesArray = responseData;
// // //         } else {
// // //           throw new Error(
// // //             "Invalid response format - expected array or object with data property"
// // //           );
// // //         }

// // //         console.log("Extracted categories:", categoriesArray.length, "items");
// // //         return categoriesArray;
// // //       } catch (error) {
// // //         console.error("Error fetching categories:", error);

// // //         throw error;
// // //       }
// // //     },
// // //     retry: (failureCount, error) => {
// // //       console.log(`Retry attempt ${failureCount} for categories`);
// // //       return failureCount < 3;
// // //     },
// // //     retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
// // //     staleTime: 5 * 60 * 1000, // 5 minutes
// // //     gcTime: 10 * 60 * 1000, // 10 minutes
// // //   });

// // //   // Enhanced debug logging
// // //   useEffect(() => {
// // //     console.log("Categories Debug State:", {
// // //       categories: categories,
// // //       categoriesLength: categories?.length,
// // //       categoriesLoading,
// // //       isCategoriesError,
// // //       errorMessage: categoriesError?.message,
// // //       errorDetails: categoriesError,
// // //     });

// // //     if (categories && Array.isArray(categories)) {
// // //       console.log("Categories preview:", categories.slice(0, 3));
// // //     }
// // //   }, [categories, categoriesLoading, categoriesError, isCategoriesError]);

// // //   // Form with validation
// // //   const form = useForm<CourseFormFields>({
// // //     resolver: zodResolver(createCourseFormSchema),
// // //     defaultValues: {
// // //       title: "",
// // //       shortName: "",
// // //       description: "",
// // //       detailedDescription: "",
// // //       imageUrl: "",
// // //       price: "",
// // //       categoryId: undefined,
// // //       instructorId: user?.id || null,
// // //       difficultyLevel: "beginner",
// // //       estimatedDuration: "",
// // //       visible: false,
// // //       previewVideoUrl: "",
// // //       fullVideoUrl: "",
// // //     },
// // //   });

// // //   // Update the form when user info is loaded
// // //   useEffect(() => {
// // //     if (user?.id) {
// // //       form.setValue("instructorId", user.id);
// // //     }
// // //   }, [user, form]);

// // //   // Create new course mutation
// // //   const createCourseMutation = useMutation({
// // //     mutationFn: async (values: CreateCourseApiRequest) => {
// // //       const response = await apiRequest("/api/courses", {
// // //         method: "POST",
// // //         data: values,
// // //       });
// // //       return response.data as Promise<CourseCreateResponse>;
// // //     },
// // //     onSuccess: (data: CourseCreateResponse) => {
// // //       // Invalidate courses cache
// // //       queryClient.invalidateQueries({ queryKey: ["courses"] });
// // //       queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

// // //       toast({
// // //         title: "Course Created Successfully",
// // //         description: `"${data.title || form.getValues("title")}" has been created.`,
// // //       });

// // //       // Navigate to the course edit page or dashboard
// // //       if (data.id) {
// // //         navigate(`/instructor/courses/${data.id}`);
// // //       } else {
// // //         navigate("/instructor/dashboard");
// // //       }
// // //     },
// // //     onError: (error: Error) => {
// // //       console.error("Course creation failed:", error);
// // //       toast({
// // //         title: "Failed to Create Course",
// // //         description:
// // //           error.message || "An unexpected error occurred. Please try again.",
// // //         variant: "destructive",
// // //       });
// // //     },
// // //   });

// // //   // Form submission handler
// // //   const onSubmit = async (values: CourseFormFields) => {
// // //     console.log("Form submitted with values:", values);

// // //     // Validate that category exists if categoryId is provided
// // //     if (values.categoryId && categories && Array.isArray(categories)) {
// // //       const categoryExists = categories.some(
// // //         (cat) => cat.id === values.categoryId
// // //       );
// // //       if (!categoryExists) {
// // //         toast({
// // //           title: "Invalid Category",
// // //           description: "Please select a valid category.",
// // //           variant: "destructive",
// // //         });
// // //         return;
// // //       }
// // //     }

// // //     // Transform camelCase to snake_case for API
// // //     const transformedValues: CreateCourseApiRequest = {
// // //       title: values.title,
// // //       short_name: values.shortName,
// // //       description: values.description || undefined,
// // //       detailed_description: values.detailedDescription || undefined,
// // //       image_url: values.imageUrl || undefined,
// // //       price: values.price || undefined,
// // //       category_id: values.categoryId || null,
// // //       instructor_id: values.instructorId,
// // //       difficulty_level: values.difficultyLevel,
// // //       duration: values.estimatedDuration || undefined,
// // //       visible: values.visible,
// // //       preview_video_url: values.previewVideoUrl || undefined,
// // //       video_url: values.fullVideoUrl || undefined,
// // //     };

// // //     createCourseMutation.mutate(transformedValues);
// // //   };

// // //   // Handle loading states
// // //   if (authLoading) {
// // //     return (
// // //       <div className="flex items-center justify-center min-h-screen">
// // //         <Loader2 className="h-8 w-8 animate-spin text-primary" />
// // //         <span className="ml-2">Loading...</span>
// // //       </div>
// // //     );
// // //   }

// // //   // Handle auth errors
// // //   if (!user) {
// // //     return (
// // //       <div className="flex items-center justify-center min-h-screen">
// // //         <div className="text-center">
// // //           <h2 className="text-xl font-semibold mb-2">
// // //             Authentication Required
// // //           </h2>
// // //           <p className="text-muted-foreground mb-4">
// // //             Please log in to create a course.
// // //           </p>
// // //           <Link to="/login">
// // //             <Button>Go to Login</Button>
// // //           </Link>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // Helper function to render category select content
// // //   const renderCategorySelectContent = () => {
// // //     if (categoriesLoading) {
// // //       return (
// // //         <div className="flex items-center justify-center p-4">
// // //           <Loader2 className="h-4 w-4 animate-spin mr-2" />
// // //           <span className="text-sm">Loading categories...</span>
// // //         </div>
// // //       );
// // //     }

// // //     if (isCategoriesError || categoriesError) {
// // //       return (
// // //         <div className="p-4 text-center">
// // //           <div className="text-sm text-red-500 mb-2">
// // //             Failed to load categories
// // //           </div>
// // //           <div className="text-xs text-gray-500 mb-2">
// // //             {categoriesError?.message || "Unknown error"}
// // //           </div>
// // //           <Button
// // //             variant="outline"
// // //             size="sm"
// // //             onClick={() => {
// // //               console.log("Manual retry triggered");
// // //               refetchCategories();
// // //             }}
// // //           >
// // //             <RefreshCw className="h-3 w-3 mr-1" />
// // //             Retry
// // //           </Button>
// // //         </div>
// // //       );
// // //     }

// // //     if (!categories) {
// // //       return (
// // //         <div className="p-4 text-center">
// // //           <div className="text-sm text-muted-foreground mb-2">
// // //             No categories data
// // //           </div>
// // //           <Button
// // //             variant="outline"
// // //             size="sm"
// // //             onClick={() => refetchCategories()}
// // //           >
// // //             <RefreshCw className="h-3 w-3 mr-1" />
// // //             Load Categories
// // //           </Button>
// // //         </div>
// // //       );
// // //     }

// // //     if (!Array.isArray(categories)) {
// // //       return (
// // //         <div className="p-4 text-center">
// // //           <div className="text-sm text-red-500 mb-2">
// // //             Invalid categories format
// // //           </div>
// // //           <div className="text-xs text-gray-500 mb-2">
// // //             Expected array, got: {typeof categories}
// // //           </div>
// // //           <Button
// // //             variant="outline"
// // //             size="sm"
// // //             onClick={() => refetchCategories()}
// // //           >
// // //             <RefreshCw className="h-3 w-3 mr-1" />
// // //             Retry
// // //           </Button>
// // //         </div>
// // //       );
// // //     }

// // //     if (categories.length === 0) {
// // //       return (
// // //         <div className="p-4 text-center">
// // //           <div className="text-sm text-muted-foreground mb-2">
// // //             No categories available
// // //           </div>
// // //           <Button
// // //             variant="outline"
// // //             size="sm"
// // //             onClick={() => refetchCategories()}
// // //           >
// // //             <RefreshCw className="h-3 w-3 mr-1" />
// // //             Refresh
// // //           </Button>
// // //         </div>
// // //       );
// // //     }

// // //     // Success case: render categories
// // //     return (
// // //       <>
// // //         <SelectItem value="none">No category</SelectItem>
// // //         {categories.map((category) => {
// // //           // Ensure category has required properties
// // //           if (
// // //             !category ||
// // //             typeof category.id === "undefined" ||
// // //             !category.name
// // //           ) {
// // //             console.warn("Invalid category object:", category);
// // //             return null;
// // //           }

// // //           return (
// // //             <SelectItem key={category.id} value={category.id.toString()}>
// // //               {category.name || " "}
// // //             </SelectItem>
// // //           );
// // //         })}
// // //       </>
// // //     );
// // //   };

// // //   return (
// // //     <div className="container mx-auto py-8 px-4">
// // //       <div className="flex items-center mb-6">
// // //         <Link to="/instructor/dashboard">
// // //           <Button variant="ghost" size="sm" className="mr-2">
// // //             <ArrowLeft className="h-4 w-4 mr-1" />
// // //             Back to Dashboard
// // //           </Button>
// // //         </Link>
// // //         <h1 className="text-3xl font-bold">Create New Course</h1>
// // //       </div>

// // //       <div className="bg-card p-6 rounded-lg shadow-sm border">
// // //         <Form {...form}>
// // //           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
// // //             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// // //               {/* Course Title */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="title"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Course Title *</FormLabel>
// // //                     <FormControl>
// // //                       <Input placeholder="Introduction to Ballet" {...field} />
// // //                     </FormControl>
// // //                     <FormDescription>
// // //                       The full title of your course, displayed prominently.
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />

// // //               {/* Course Short Name */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="shortName"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Short Name *</FormLabel>
// // //                     <FormControl>
// // //                       <Input placeholder="Ballet101" {...field} />
// // //                     </FormControl>
// // //                     <FormDescription>
// // //                       A short name or code for your course.
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />
// // //             </div>

// // //             {/* Course Description */}
// // //             <FormField
// // //               control={form.control}
// // //               name="description"
// // //               render={({ field }) => (
// // //                 <FormItem>
// // //                   <FormLabel>Description *</FormLabel>
// // //                   <FormControl>
// // //                     <Textarea
// // //                       placeholder="A brief overview of your course..."
// // //                       className="min-h-24"
// // //                       {...field}
// // //                     />
// // //                   </FormControl>
// // //                   <FormDescription>
// // //                     A short description that will appear in course listings
// // //                     (minimum 20 characters).
// // //                   </FormDescription>
// // //                   <FormMessage />
// // //                 </FormItem>
// // //               )}
// // //             />

// // //             {/* Detailed Description */}
// // //             <FormField
// // //               control={form.control}
// // //               name="detailedDescription"
// // //               render={({ field }) => (
// // //                 <FormItem>
// // //                   <FormLabel>Detailed Description</FormLabel>
// // //                   <FormControl>
// // //                     <Textarea
// // //                       placeholder="Provide a comprehensive description of your course content, goals, and what students will learn..."
// // //                       className="min-h-32"
// // //                       {...field}
// // //                     />
// // //                   </FormControl>
// // //                   <FormDescription>
// // //                     A detailed description of your course syllabus, goals, and
// // //                     learning outcomes.
// // //                   </FormDescription>
// // //                   <FormMessage />
// // //                 </FormItem>
// // //               )}
// // //             />

// // //             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// // //               {/* Course Image Upload */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="imageUrl"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Course Image</FormLabel>
// // //                     <FormControl>
// // //                       <FileUpload
// // //                         onUploadComplete={(url) => field.onChange(url)}
// // //                         defaultValue={field.value || ""}
// // //                         uploadEndpoint="https://api.livetestdomain.com/api/upload/course"
// // //                         acceptedTypes="image/*"
// // //                         label="Course Image"
// // //                         buttonText="Choose course image"
// // //                         maxSizeMB={5}
// // //                       />
// // //                     </FormControl>
// // //                     <FormDescription>
// // //                       Select an image that represents your course (max 5MB).
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />

// // //               {/* Course Price */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="price"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Price (USD)</FormLabel>
// // //                     <FormControl>
// // //                       <Input
// // //                         type="number"
// // //                         step="0.01"
// // //                         min="0"
// // //                         placeholder="99.99"
// // //                         {...field}
// // //                       />
// // //                     </FormControl>
// // //                     <FormDescription>
// // //                       Course price in USD (leave empty if free).
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />
// // //             </div>

// // //             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// // //               {/* Category - Enhanced with better error handling */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="categoryId"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Category</FormLabel>
// // //                     <div className="flex gap-2">
// // //                       <Select
// // //                         onValueChange={(value) => {
// // //                           console.log("Category selected:", value);
// // //                           field.onChange(value ? parseInt(value) : undefined);
// // //                         }}
// // //                         value={field.value?.toString() || ""}
// // //                       >
// // //                         <FormControl>
// // //                           <SelectTrigger>
// // //                             <SelectValue placeholder="Select a category" />
// // //                           </SelectTrigger>
// // //                         </FormControl>
// // //                         <SelectContent>
// // //                           {renderCategorySelectContent()}
// // //                         </SelectContent>
// // //                       </Select>

// // //                       {/* Additional retry button outside select */}
// // //                       {(isCategoriesError || !categories) && (
// // //                         <Button
// // //                           type="button"
// // //                           variant="outline"
// // //                           size="sm"
// // //                           onClick={() => {
// // //                             console.log("External retry button clicked");
// // //                             refetchCategories();
// // //                           }}
// // //                           disabled={categoriesLoading}
// // //                         >
// // //                           {categoriesLoading ? (
// // //                             <Loader2 className="h-3 w-3 animate-spin" />
// // //                           ) : (
// // //                             <RefreshCw className="h-3 w-3" />
// // //                           )}
// // //                         </Button>
// // //                       )}
// // //                     </div>
// // //                     <FormDescription>
// // //                       The category this course belongs to.
// // //                       {categories && ` (${categories.length} available)`}
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />

// // //               {/* Difficulty Level */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="difficultyLevel"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Difficulty Level *</FormLabel>
// // //                     <Select onValueChange={field.onChange} value={field.value}>
// // //                       <FormControl>
// // //                         <SelectTrigger>
// // //                           <SelectValue placeholder="Select difficulty" />
// // //                         </SelectTrigger>
// // //                       </FormControl>
// // //                       <SelectContent>
// // //                         <SelectItem value="beginner">Beginner</SelectItem>
// // //                         <SelectItem value="intermediate">
// // //                           Intermediate
// // //                         </SelectItem>
// // //                         <SelectItem value="advanced">Advanced</SelectItem>
// // //                         <SelectItem value="all-levels">All Levels</SelectItem>
// // //                       </SelectContent>
// // //                     </Select>
// // //                     <FormDescription>
// // //                       The difficulty level of your course.
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />

// // //               {/* Estimated Duration */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="estimatedDuration"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Estimated Duration</FormLabel>
// // //                     <FormControl>
// // //                       <Input placeholder="e.g., 8 weeks" {...field} />
// // //                     </FormControl>
// // //                     <FormDescription>
// // //                       How long the course typically takes to complete.
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />
// // //             </div>

// // //             {/* Video URLs */}
// // //             <div className="space-y-6 border-t pt-6">
// // //               <h3 className="text-lg font-medium">Course Videos</h3>

// // //               {/* Full Video URL */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="fullVideoUrl"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Full Video URL</FormLabel>
// // //                     <FormControl>
// // //                       <Input
// // //                         placeholder="https://www.youtube.com/watch?v=..."
// // //                         {...field}
// // //                         onChange={(e) => {
// // //                           field.onChange(e.target.value);
// // //                           // Auto-populate preview if empty
// // //                           if (
// // //                             e.target.value &&
// // //                             !form.getValues("previewVideoUrl")
// // //                           ) {
// // //                             form.setValue("previewVideoUrl", e.target.value);
// // //                           }
// // //                         }}
// // //                       />
// // //                     </FormControl>
// // //                     <FormDescription>
// // //                       Full course video URL (only visible to enrolled students)
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />

// // //               {/* Preview Video URL */}
// // //               <FormField
// // //                 control={form.control}
// // //                 name="previewVideoUrl"
// // //                 render={({ field }) => (
// // //                   <FormItem>
// // //                     <FormLabel>Preview Video URL</FormLabel>
// // //                     <FormControl>
// // //                       <Input
// // //                         placeholder="https://www.youtube.com/watch?v=..."
// // //                         {...field}
// // //                       />
// // //                     </FormControl>
// // //                     <FormDescription>
// // //                       Preview video URL (visible to all users, including guests)
// // //                     </FormDescription>
// // //                     <FormMessage />
// // //                   </FormItem>
// // //                 )}
// // //               />

// // //               <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
// // //                 <p className="text-sm text-blue-700 dark:text-blue-300">
// // //                   <strong>Tip:</strong> The preview video URL is auto-populated
// // //                   from the full video URL. A 15-second preview will be shown
// // //                   when users click the preview button.
// // //                 </p>
// // //               </div>
// // //             </div>

// // //             {/* Visibility Toggle */}
// // //             <FormField
// // //               control={form.control}
// // //               name="visible"
// // //               render={({ field }) => (
// // //                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
// // //                   <div className="space-y-0.5">
// // //                     <FormLabel className="text-base">Publish Course</FormLabel>
// // //                     <FormDescription>
// // //                       Make this course visible to students immediately upon
// // //                       creation.
// // //                     </FormDescription>
// // //                   </div>
// // //                   <FormControl>
// // //                     <Switch
// // //                       checked={field.value}
// // //                       onCheckedChange={field.onChange}
// // //                     />
// // //                   </FormControl>
// // //                 </FormItem>
// // //               )}
// // //             />

// // //             {/* Action Buttons */}
// // //             <div className="flex justify-between items-center pt-6 border-t">
// // //               <div className="text-sm text-muted-foreground">
// // //                 * Required fields
// // //               </div>
// // //               <div className="flex gap-3">
// // //                 <Link to="/instructor/dashboard">
// // //                   <Button type="button" variant="outline">
// // //                     Cancel
// // //                   </Button>
// // //                 </Link>
// // //                 <Button
// // //                   type="submit"
// // //                   disabled={createCourseMutation.isPending}
// // //                   className="min-w-32"
// // //                 >
// // //                   {createCourseMutation.isPending ? (
// // //                     <>
// // //                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// // //                       Creating...
// // //                     </>
// // //                   ) : (
// // //                     <>
// // //                       <Save className="mr-2 h-4 w-4" />
// // //                       Create Course
// // //                     </>
// // //                   )}
// // //                 </Button>
// // //               </div>
// // //             </div>
// // //           </form>
// // //         </Form>
// // //       </div>

// // //       {/* Enhanced Debug Panel */}
// // //       {process.env.NODE_ENV === "development" && (
// // //         <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
// // //           <h3 className="font-semibold mb-2">Debug Info:</h3>
// // //           <div className="space-y-2 text-xs">
// // //             <div>
// // //               <strong>Categories Status:</strong>
// // //               <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
// // //                 {JSON.stringify(
// // //                   {
// // //                     loading: categoriesLoading,
// // //                     error: categoriesError?.message,
// // //                     hasData: !!categories,
// // //                     isArray: Array.isArray(categories),
// // //                     count: categories?.length,
// // //                     firstCategory: categories?.[0],
// // //                   },
// // //                   null,
// // //                   2
// // //                 )}
// // //               </pre>
// // //             </div>
// // //             <div>
// // //               <strong>Form Values:</strong>
// // //               <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
// // //                 {JSON.stringify(
// // //                   {
// // //                     userId: user?.id,
// // //                     selectedCategory: form.watch("categoryId"),
// // //                     formValues: form.watch(),
// // //                   },
// // //                   null,
// // //                   2
// // //                 )}
// // //               </pre>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }


// import { useState, useEffect } from "react";
// import { useAuth } from "../../hooks/use-auth";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { Link, useLocation } from "wouter";
// import { Loader2, ArrowLeft, Save, RefreshCw } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { apiRequest, queryClient } from "../../lib/queryClient";
// import { convertToYouTubeEmbedUrl } from "../../lib/utils";
// import { Button } from "../../components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "../../components/ui/form";
// import { Input } from "../../components/ui/input";
// import { Textarea } from "../../components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../components/ui/select";
// import { Switch } from "../../components/ui/switch";
// import { FileUpload } from "../../components/ui/file-upload";
// import { Category, courses, insertCourseSchema } from "@/shared/schema";
// import { useToast } from "../../hooks/use-toast";

// // Define the expected response type for course creation - made more flexible
// type CourseCreateResponse = {
//   id?: number;
//   course_id?: number;
//   courseId?: number;
//   title?: string;
//   course_title?: string;
//   name?: string;
//   message?: string;
//   success?: boolean;
//   data?: any;
// };

// // Create a proper form schema that matches your form fields
// const createCourseFormSchema = z.object({
//   title: z.string().min(5, "Title must be at least 5 characters"),
//   shortName: z.string().min(2, "Short name must be at least 2 characters"),
//   description: z.string().min(20, "Description must be at least 20 characters"),
//   detailedDescription: z.string().optional(),
//   imageUrl: z.string().optional(),
//   price: z.string().optional(),
//   categoryId: z.number().optional(),
//   instructorId: z.number().nullable(),
//   difficultyLevel: z.string(),
//   estimatedDuration: z.string().optional(),
//   visible: z.boolean(),
//   previewVideoUrl: z.string().optional(),
//   fullVideoUrl: z.string().optional(),
// });

// // Define the form field types to match the schema
// type CourseFormFields = z.infer<typeof createCourseFormSchema>;

// // Type for the API request (snake_case)
// type CreateCourseApiRequest = {
//   title: string;
//   short_name: string;
//   description?: string;
//   detailed_description?: string;
//   image_url?: string;
//   price?: string;
//   category_id?: number | null;
//   instructor_id?: number | null;
//   difficulty_level?: string;
//   duration?: string;
//   visible?: boolean;
//   preview_video_url?: string;
//   full_video_url?: string;
// };

// export default function CourseCreatePage() {
//   const { user, isLoading: authLoading } = useAuth();
//   const [_, navigate] = useLocation();
//   const { toast } = useToast();

//   // Fetch categories with improved error handling and retry logic
//   const {
//     data: categories,
//     isLoading: categoriesLoading,
//     error: categoriesError,
//     refetch: refetchCategories,
//     isError: isCategoriesError,
//   } = useQuery<Category[]>({
//     queryKey: ["categories"],
//     queryFn: async () => {
//       console.log("Fetching categories...");

//       try {
//         const response = await apiRequest("/api/categories", {
//           method: "GET",
//         });

//         console.log("API Response status:", response.status);

//         const responseData = await response.data;
//         console.log("Categories API response:", response.data);
//         console.log("Categories API response 2:", response);

//         // Handle different response formats
//         let categoriesArray;
//         if (responseData.data && Array.isArray(responseData.data)) {
//           categoriesArray = responseData.data;
//         } else if (Array.isArray(responseData)) {
//           categoriesArray = responseData;
//         } else {
//           throw new Error(
//             "Invalid response format - expected array or object with data property"
//           );
//         }

//         console.log("Extracted categories:", categoriesArray.length, "items");
//         return categoriesArray;
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//         throw error;
//       }
//     },
//     retry: (failureCount, error) => {
//       console.log(`Retry attempt ${failureCount} for categories`);
//       return failureCount < 3;
//     },
//     retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 10 * 60 * 1000, // 10 minutes
//   });

//   // Enhanced debug logging
//   useEffect(() => {
//     console.log("Categories Debug State:", {
//       categories: categories,
//       categoriesLength: categories?.length,
//       categoriesLoading,
//       isCategoriesError,
//       errorMessage: categoriesError?.message,
//       errorDetails: categoriesError,
//     });

//     if (categories && Array.isArray(categories)) {
//       console.log("Categories preview:", categories.slice(0, 3));
//     }
//   }, [categories, categoriesLoading, categoriesError, isCategoriesError]);

//   // Form with validation
//   const form = useForm<CourseFormFields>({
//     resolver: zodResolver(createCourseFormSchema),
//     defaultValues: {
//       title: "",
//       shortName: "",
//       description: "",
//       detailedDescription: "",
//       imageUrl: "",
//       price: "",
//       categoryId: undefined,
//       instructorId: user?.id || null,
//       difficultyLevel: "beginner",
//       estimatedDuration: "",
//       visible: false,
//       previewVideoUrl: "",
//       fullVideoUrl: "",
//     },
//   });

//   // Update the form when user info is loaded
//   useEffect(() => {
//     if (user?.id) {
//       form.setValue("instructorId", user.id);
//     }
//   }, [user, form]);

//   // Create new course mutation - FIXED VERSION
//   const createCourseMutation = useMutation({
//     mutationFn: async (values: CreateCourseApiRequest) => {
//       const response = await apiRequest("/api/courses", {
//         method: "POST",
//         data: values,
//       });
//       return response.data;
//     },
//     onSuccess: (data: any) => {
//       console.log("Course creation response data:", data);
//       console.log("Data type:", typeof data);
//       console.log("Data keys:", data ? Object.keys(data) : "No data");
      
//       // Invalidate courses cache
//       queryClient.invalidateQueries({ queryKey: ["courses"] });
//       queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

//       // Handle different possible response structures safely
//       let courseTitle: string = form.getValues("title") || "New Course";
//       let courseId: number | undefined;

//       if (data && typeof data === 'object') {
//         // Check for various title formats
//         courseTitle = data.title || 
//                      data.name || 
//                      data.course_title || 
//                      data.course_name ||
//                      (data.data && data.data.title) ||
//                      courseTitle;

//         // Check for various ID formats
//         courseId = data.id || 
//                    data.course_id || 
//                    data.courseId ||
//                    (data.data && (data.data.id || data.data.course_id));
//       }

//       toast({
//         title: "Course Created Successfully",
//         description: `"${courseTitle}" has been created.`,
//       });

//       // Navigate based on available data
//       if (courseId) {
//         navigate(`/instructor/courses/${courseId}`);
//       } else {
//         navigate("/instructor/dashboard");
//       }
//     },
//     onError: (error: Error) => {
//       console.error("Course creation failed:", error);
//       console.error("Error details:", {
//         message: error.message,
//         stack: error.stack,
//         name: error.name
//       });
      
//       toast({
//         title: "Failed to Create Course",
//         description:
//           error.message || "An unexpected error occurred. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   // Form submission handler
//   const onSubmit = async (values: CourseFormFields) => {
//     console.log("Form submitted with values:", values);

//     // Validate that category exists if categoryId is provided
//     if (values.categoryId && categories && Array.isArray(categories)) {
//       const categoryExists = categories.some(
//         (cat) => cat.id === values.categoryId
//       );
//       if (!categoryExists) {
//         toast({
//           title: "Invalid Category",
//           description: "Please select a valid category.",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     // Transform camelCase to snake_case for API
//     const transformedValues: CreateCourseApiRequest = {
//       title: values.title,
//       short_name: values.shortName,
//       description: values.description || undefined,
//       detailed_description: values.detailedDescription || undefined,
//       image_url: values.imageUrl || undefined,
//       price: values.price || undefined,
//       category_id: values.categoryId || null,
//       instructor_id: values.instructorId,
//       difficulty_level: values.difficultyLevel,
//       duration: values.estimatedDuration || undefined,
//       visible: values.visible,
//       preview_video_url: values.previewVideoUrl || undefined,
//       full_video_url: values.fullVideoUrl || undefined,
//     };

//     console.log("Sending API request with:", transformedValues);
//     createCourseMutation.mutate(transformedValues);
//   };

//   // Handle loading states
//   if (authLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         <span className="ml-2">Loading...</span>
//       </div>
//     );
//   }

//   // Handle auth errors
//   if (!user) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <h2 className="text-xl font-semibold mb-2">
//             Authentication Required
//           </h2>
//           <p className="text-muted-foreground mb-4">
//             Please log in to create a course.
//           </p>
//           <Link to="/login">
//             <Button>Go to Login</Button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // Helper function to render category select content
//   const renderCategorySelectContent = () => {
//     if (categoriesLoading) {
//       return (
//         <div className="flex items-center justify-center p-4">
//           <Loader2 className="h-4 w-4 animate-spin mr-2" />
//           <span className="text-sm">Loading categories...</span>
//         </div>
//       );
//     }

//     if (isCategoriesError || categoriesError) {
//       return (
//         <div className="p-4 text-center">
//           <div className="text-sm text-red-500 mb-2">
//             Failed to load categories
//           </div>
//           <div className="text-xs text-gray-500 mb-2">
//             {categoriesError?.message || "Unknown error"}
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => {
//               console.log("Manual retry triggered");
//               refetchCategories();
//             }}
//           >
//             <RefreshCw className="h-3 w-3 mr-1" />
//             Retry
//           </Button>
//         </div>
//       );
//     }

//     if (!categories) {
//       return (
//         <div className="p-4 text-center">
//           <div className="text-sm text-muted-foreground mb-2">
//             No categories data
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => refetchCategories()}
//           >
//             <RefreshCw className="h-3 w-3 mr-1" />
//             Load Categories
//           </Button>
//         </div>
//       );
//     }

//     if (!Array.isArray(categories)) {
//       return (
//         <div className="p-4 text-center">
//           <div className="text-sm text-red-500 mb-2">
//             Invalid categories format
//           </div>
//           <div className="text-xs text-gray-500 mb-2">
//             Expected array, got: {typeof categories}
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => refetchCategories()}
//           >
//             <RefreshCw className="h-3 w-3 mr-1" />
//             Retry
//           </Button>
//         </div>
//       );
//     }

//     if (categories.length === 0) {
//       return (
//         <div className="p-4 text-center">
//           <div className="text-sm text-muted-foreground mb-2">
//             No categories available
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => refetchCategories()}
//           >
//             <RefreshCw className="h-3 w-3 mr-1" />
//             Refresh
//           </Button>
//         </div>
//       );
//     }

//     // Success case: render categories
//     return (
//       <>
//         <SelectItem value="none">No category</SelectItem>
//         {categories.map((category) => {
//           // Ensure category has required properties
//           if (
//             !category ||
//             typeof category.id === "undefined" ||
//             !category.name
//           ) {
//             console.warn("Invalid category object:", category);
//             return null;
//           }

//           return (
//             <SelectItem key={category.id} value={category.id.toString()}>
//               {category.name || " "}
//             </SelectItem>
//           );
//         })}
//       </>
//     );
//   };

//   return (
//     <div className="container mx-auto py-8 px-4">
//       <div className="flex items-center mb-6">
//         <Link to="/instructor/dashboard">
//           <Button variant="ghost" size="sm" className="mr-2">
//             <ArrowLeft className="h-4 w-4 mr-1" />
//             Back to Dashboard
//           </Button>
//         </Link>
//         <h1 className="text-3xl font-bold">Create New Course</h1>
//       </div>

//       <div className="bg-card p-6 rounded-lg shadow-sm border">
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Course Title */}
//               <FormField
//                 control={form.control}
//                 name="title"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Course Title *</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Introduction to Ballet" {...field} />
//                     </FormControl>
//                     <FormDescription>
//                       The full title of your course, displayed prominently.
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Course Short Name */}
//               <FormField
//                 control={form.control}
//                 name="shortName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Short Name *</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Ballet101" {...field} />
//                     </FormControl>
//                     <FormDescription>
//                       A short name or code for your course.
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             {/* Course Description */}
//             <FormField
//               control={form.control}
//               name="description"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Description *</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder="A brief overview of your course..."
//                       className="min-h-24"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormDescription>
//                     A short description that will appear in course listings
//                     (minimum 20 characters).
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Detailed Description */}
//             <FormField
//               control={form.control}
//               name="detailedDescription"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Detailed Description</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder="Provide a comprehensive description of your course content, goals, and what students will learn..."
//                       className="min-h-32"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormDescription>
//                     A detailed description of your course syllabus, goals, and
//                     learning outcomes.
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Course Image Upload */}
//               <FormField
//                 control={form.control}
//                 name="imageUrl"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Course Image</FormLabel>
//                     <FormControl>
//                       <FileUpload
//                         onUploadComplete={(url) => field.onChange(url)}
//                         defaultValue={field.value || ""}
//                         uploadEndpoint="https://api.livetestdomain.com/api/upload/course"
//                         acceptedTypes="image/*"
//                         label="Course Image"
//                         buttonText="Choose course image"
//                         maxSizeMB={5}
//                       />
//                     </FormControl>
//                     <FormDescription>
//                       Select an image that represents your course (max 5MB).
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Course Price */}
//               <FormField
//                 control={form.control}
//                 name="price"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Price (USD)</FormLabel>
//                     <FormControl>
//                       <Input
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         placeholder="99.99"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormDescription>
//                       Course price in USD (leave empty if free).
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               {/* Category - Enhanced with better error handling */}
//               <FormField
//                 control={form.control}
//                 name="categoryId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Category</FormLabel>
//                     <div className="flex gap-2">
//                       <Select
//                         onValueChange={(value) => {
//                           console.log("Category selected:", value);
//                           field.onChange(value ? parseInt(value) : undefined);
//                         }}
//                         value={field.value?.toString() || ""}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select a category" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           {renderCategorySelectContent()}
//                         </SelectContent>
//                       </Select>

//                       {/* Additional retry button outside select */}
//                       {(isCategoriesError || !categories) && (
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           onClick={() => {
//                             console.log("External retry button clicked");
//                             refetchCategories();
//                           }}
//                           disabled={categoriesLoading}
//                         >
//                           {categoriesLoading ? (
//                             <Loader2 className="h-3 w-3 animate-spin" />
//                           ) : (
//                             <RefreshCw className="h-3 w-3" />
//                           )}
//                         </Button>
//                       )}
//                     </div>
//                     <FormDescription>
//                       The category this course belongs to.
//                       {categories && ` (${categories.length} available)`}
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Difficulty Level */}
//               <FormField
//                 control={form.control}
//                 name="difficultyLevel"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Difficulty Level *</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select difficulty" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         <SelectItem value="beginner">Beginner</SelectItem>
//                         <SelectItem value="intermediate">
//                           Intermediate
//                         </SelectItem>
//                         <SelectItem value="advanced">Advanced</SelectItem>
//                         <SelectItem value="all-levels">All Levels</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <FormDescription>
//                       The difficulty level of your course.
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Estimated Duration */}
//               <FormField
//                 control={form.control}
//                 name="estimatedDuration"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Estimated Duration</FormLabel>
//                     <FormControl>
//                       <Input placeholder="e.g., 8 weeks" {...field} />
//                     </FormControl>
//                     <FormDescription>
//                       How long the course typically takes to complete.
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             {/* Video URLs */}
//             <div className="space-y-6 border-t pt-6">
//               <h3 className="text-lg font-medium">Course Videos</h3>

//               {/* Full Video URL */}
//               <FormField
//                 control={form.control}
//                 name="fullVideoUrl"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Full Video URL</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="https://www.youtube.com/watch?v=..."
//                         {...field}
//                         onChange={(e) => {
//                           field.onChange(e.target.value);
//                           // Auto-populate preview if empty
//                           if (
//                             e.target.value &&
//                             !form.getValues("previewVideoUrl")
//                           ) {
//                             form.setValue("previewVideoUrl", e.target.value);
//                           }
//                         }}
//                       />
//                     </FormControl>
//                     <FormDescription>
//                       Full course video URL (only visible to enrolled students)
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Preview Video URL */}
//               <FormField
//                 control={form.control}
//                 name="previewVideoUrl"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Preview Video URL</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="https://www.youtube.com/watch?v=..."
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormDescription>
//                       Preview video URL (visible to all users, including guests)
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
//                 <p className="text-sm text-blue-700 dark:text-blue-300">
//                   <strong>Tip:</strong> The preview video URL is auto-populated
//                   from the full video URL. A 15-second preview will be shown
//                   when users click the preview button.
//                 </p>
//               </div>
//             </div>

//             {/* Visibility Toggle */}
//             <FormField
//               control={form.control}
//               name="visible"
//               render={({ field }) => (
//                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                   <div className="space-y-0.5">
//                     <FormLabel className="text-base">Publish Course</FormLabel>
//                     <FormDescription>
//                       Make this course visible to students immediately upon
//                       creation.
//                     </FormDescription>
//                   </div>
//                   <FormControl>
//                     <Switch
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />

//             {/* Action Buttons */}
//             <div className="flex justify-between items-center pt-6 border-t">
//               <div className="text-sm text-muted-foreground">
//                 * Required fields
//               </div>
//               <div className="flex gap-3">
//                 <Link to="/instructor/dashboard">
//                   <Button type="button" variant="outline">
//                     Cancel
//                   </Button>
//                 </Link>
//                 <Button
//                   type="submit"
//                   disabled={createCourseMutation.isPending}
//                   className="min-w-32"
//                 >
//                   {createCourseMutation.isPending ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Creating...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="mr-2 h-4 w-4" />
//                       Create Course
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </form>
//         </Form>
//       </div>

//       {/* Enhanced Debug Panel */}
//       {process.env.NODE_ENV === "development" && (
//         <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
//           <h3 className="font-semibold mb-2">Debug Info:</h3>
//           <div className="space-y-2 text-xs">
//             <div>
//               <strong>Categories Status:</strong>
//               <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
//                 {JSON.stringify(
//                   {
//                     loading: categoriesLoading,
//                     error: categoriesError?.message,
//                     hasData: !!categories,
//                     isArray: Array.isArray(categories),
//                     count: categories?.length,
//                     firstCategory: categories?.[0],
//                   },
//                   null,
//                   2
//                 )}
//               </pre>
//             </div>
//             <div>
//               <strong>Form Values:</strong>
//               <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
//                 {JSON.stringify(
//                   {
//                     userId: user?.id,
//                     selectedCategory: form.watch("categoryId"),
//                     formValues: form.watch(),
//                   },
//                   null,
//                   2
//                 )}
//               </pre>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, Save, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { Button } from "../../components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Category } from "@/shared/schema";
import { useToast } from "../../hooks/use-toast";

// Define the expected response type for course creation
type CourseCreateResponse = {
  id?: number;
  course_id?: number;
  courseId?: number;
  title?: string;
  course_title?: string;
  name?: string;
  message?: string;
  success?: boolean;
  data?: any;
};

// Create a proper form schema that matches your form fields
const createCourseFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  shortName: z.string().min(2, "Short name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  detailedDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.string().optional(),
  categoryId: z.number().optional(),
  instructorId: z.number().nullable(),
  difficultyLevel: z.string(),
  estimatedDuration: z.string().optional(),
  visible: z.boolean(),
  previewVideoUrl: z.string().optional(),
  fullVideoUrl: z.string().optional(),
});

// Define the form field types to match the schema
type CourseFormFields = z.infer<typeof createCourseFormSchema>;

// Type for the API request (snake_case)
type CreateCourseApiRequest = {
  title: string;
  short_name: string;
  description?: string;
  detailed_description?: string;
  image_url?: string;
  price?: string;
  category_id?: number | null;
  instructor_id?: number | null;
  difficulty_level?: string;
  duration?: string;
  visible?: boolean;
  preview_video_url?: string;
  video_url?: string;
};

// Custom FileUpload component
interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  defaultValue?: string;
  acceptedTypes?: string;
  label?: string;
  buttonText?: string;
  maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  defaultValue = "",
  acceptedTypes = "image/*",
  label = "Upload File",
  buttonText = "Choose file",
  maxSizeMB = 25,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(defaultValue);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      toast({
        title: "File Too Large",
        description: `File size exceeds ${maxSizeMB}MB limit.`,
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("resource_type", "image")
      formData.append("folder", "images")

      const response = await apiRequest("/api/upload", {
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      if (data.url) {
        setUploadStatus("Upload successful!");
        setPreviewUrl(data.url);
        onUploadComplete(data.url);
        toast({
          title: "Image Uploaded",
          description: "The course image has been successfully uploaded.",
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error: any) {
      setUploadStatus("Upload failed");
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90"
        />
        <Button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !file}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </div>
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="mt-2 max-w-xs rounded-md"
        />
      )}
      {uploadStatus && (
        <p
          className={`text-sm ${
            uploadStatus.includes("success") ? "text-green-600" : "text-red-600"
          }`}
        >
          {uploadStatus}
        </p>
      )}
    </div>
  );
};

export default function CourseCreatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch categories with improved error handling and retry logic
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
    isError: isCategoriesError,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("Fetching categories...");
      try {
        const response = await apiRequest("/api/categories", {
          method: "GET",
        });
        console.log("API Response status:", response.status);
        const responseData = await response.data;
        console.log("Categories API response:", response.data);
        console.log("Categories API response 2:", response);

        // Handle different response formats
        let categoriesArray;
        if (responseData.data && Array.isArray(responseData.data)) {
          categoriesArray = responseData.data;
        } else if (Array.isArray(responseData)) {
          categoriesArray = responseData;
        } else {
          throw new Error(
            "Invalid response format - expected array or object with data property"
          );
        }
        console.log("Extracted categories:", categoriesArray.length, "items");
        return categoriesArray;
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      console.log(`Retry attempt ${failureCount} for categories`);
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Enhanced debug logging
  useEffect(() => {
    console.log("Categories Debug State:", {
      categories: categories,
      categoriesLength: categories?.length,
      categoriesLoading,
      isCategoriesError,
      errorMessage: categoriesError?.message,
      errorDetails: categoriesError,
    });
    if (categories && Array.isArray(categories)) {
      console.log("Categories preview:", categories.slice(0, 3));
    }
  }, [categories, categoriesLoading, categoriesError, isCategoriesError]);

  // Form with validation
  const form = useForm<CourseFormFields>({
    resolver: zodResolver(createCourseFormSchema),
    defaultValues: {
      title: "",
      shortName: "",
      description: "",
      detailedDescription: "",
      imageUrl: "",
      price: "",
      categoryId: undefined,
      instructorId: user?.id || null,
      difficultyLevel: "beginner",
      estimatedDuration: "",
      visible: false,
      previewVideoUrl: "",
      fullVideoUrl: "",
    },
  });

  // Update the form when user info is loaded
  useEffect(() => {
    if (user?.id) {
      form.setValue("instructorId", user.id);
    }
  }, [user, form]);

  // Create new course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (values: CreateCourseApiRequest) => {
      const response = await apiRequest("/api/courses", {
        method: "POST",
        data: values,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      console.log("Course creation response data:", data);
      console.log("Data type:", typeof data);
      console.log("Data keys:", data ? Object.keys(data) : "No data");

      // Invalidate courses cache
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

      // Handle different possible response structures safely
      let courseTitle: string = form.getValues("title") || "New Course";
      let courseId: number | undefined;

      if (data && typeof data === "object") {
        // Check for various title formats
        courseTitle =
          data.title ||
          data.name ||
          data.course_title ||
          data.course_name ||
          (data.data && data.data.title) ||
          courseTitle;

        // Check for various ID formats
        courseId =
          data.id ||
          data.course_id ||
          data.courseId ||
          (data.data && (data.data.id || data.data.course_id));
      }

      toast({
        title: "Course Created Successfully",
        description: `"${courseTitle}" has been created.`,
      });

      // Navigate based on available data
      if (courseId) {
        navigate(`/instructor/courses/${courseId}`);
      } else {
        navigate("/instructor/dashboard");
      }
    },
    onError: (error: Error) => {
      console.error("Course creation failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      toast({
        title: "Failed to Create Course",
        description:
          error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (values: CourseFormFields) => {
    console.log("Form submitted with values:", values);

    // Validate that category exists if categoryId is provided
    if (values.categoryId && categories && Array.isArray(categories)) {
      const categoryExists = categories.some(
        (cat) => cat.id === values.categoryId
      );
      if (!categoryExists) {
        toast({
          title: "Invalid Category",
          description: "Please select a valid category.",
          variant: "destructive",
        });
        return;
      }
    }

    // Transform camelCase to snake_case for API
    const transformedValues: CreateCourseApiRequest = {
      title: values.title,
      short_name: values.shortName,
      description: values.description || undefined,
      detailed_description: values.detailedDescription || undefined,
      image_url: values.imageUrl || undefined,
      price: values.price || undefined,
      category_id: values.categoryId || null,
      instructor_id: values.instructorId,
      difficulty_level: values.difficultyLevel,
      duration: values.estimatedDuration || undefined,
      visible: values.visible,
      preview_video_url: values.previewVideoUrl || undefined,
      video_url: values.fullVideoUrl || undefined,
    };

    console.log("Sending API request with:", transformedValues);
    createCourseMutation.mutate(transformedValues);
  };

  // Helper function to render category select content
  const renderCategorySelectContent = () => {
    if (categoriesLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Loading categories...</span>
        </div>
      );
    }

    if (isCategoriesError || categoriesError) {
      return (
        <div className="p-4 text-center">
          <div className="text-sm text-red-500 mb-2">
            Failed to load categories
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {categoriesError?.message || "Unknown error"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Manual retry triggered");
              refetchCategories();
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    if (!categories) {
      return (
        <div className="p-4 text-center">
          <div className="text-sm text-muted-foreground mb-2">
            No categories data
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchCategories()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Load Categories
          </Button>
        </div>
      );
    }

    if (!Array.isArray(categories)) {
      return (
        <div className="p-4 text-center">
          <div className="text-sm text-red-500 mb-2">
            Invalid categories format
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Expected array, got: {typeof categories}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchCategories()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="p-4 text-center">
          <Button className="text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      );
    }

    // Success case: render categories
    return (
      <>
        <SelectItem value="none">No category</SelectItem>
        {categories.map((category) => {
          if (
            !category ||
            typeof category.id === "undefined" ||
            !category.name
          ) {
            console.warn("Invalid category object:", category);
            return null;
          }
          return (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name || " "}
            </SelectItem>
          );
        })}
      </>
    );
  };

  // Render the form
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link to="/instructor/dashboard">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Course</h1>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Ballet" {...field} />
                    </FormControl>
                    <FormDescription>
                      The full title of your course, displayed prominently.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Short Name */}
              <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ballet101" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short name or code for your course.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Course Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief overview of your course..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short description that will appear in course listings
                    (minimum 20 characters).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Detailed Description */}
            <FormField
              control={form.control}
              name="detailedDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a comprehensive description of your course content, goals, and what students will learn..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A detailed description of your course syllabus, goals, and
                    learning outcomes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Image Upload */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Image</FormLabel>
                    <FormControl>
                      <FileUpload
                        onUploadComplete={(url) => {field.onChange(url); form.setValue("imageUrl", url)}}
                        defaultValue={field.value || ""}
                        // uploadEndpoint="/api/upload"
                        acceptedTypes="image/*"
                        label="Course Image"
                        buttonText="Upload Image"
                        maxSizeMB={25}
                      />
                    </FormControl>
                    <FormDescription>
                      Select an image that represents your course (max 5MB).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="99.99"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Course price in USD (leave empty if free).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(value) => {
                          console.log("Category selected:", value);
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {renderCategorySelectContent()}
                        </SelectContent>
                      </Select>
                      {(isCategoriesError || !categories) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("External retry button clicked");
                            refetchCategories();
                          }}
                          disabled={categoriesLoading}
                        >
                          {categoriesLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      The category this course belongs to.
                      {categories && ` (${categories.length} available)`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Difficulty Level */}
              <FormField
                control={form.control}
                name="difficultyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="all-levels">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The difficulty level of your course.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Duration */}
              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8 weeks" {...field} />
                    </FormControl>
                    <FormDescription>
                      How long the course typically takes to complete.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Video URLs */}
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-medium">Course Videos</h3>

              {/* Full Video URL */}
              <FormField
                control={form.control}
                name="fullVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Video URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          if (
                            e.target.value &&
                            !form.getValues("previewVideoUrl")
                          ) {
                            form.setValue("previewVideoUrl", e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Full course video URL (only visible to enrolled students)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preview Video URL */}
              <FormField
                control={form.control}
                name="previewVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview Video URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Preview video URL (visible to all users, including guests)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> The preview video URL is auto-populated
                  from the full video URL. A 15-second preview will be shown
                  when users click the preview button.
                </p>
              </div>
            </div>

            {/* Visibility Toggle */}
            <FormField
              control={form.control}
              name="visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish Course</FormLabel>
                    <FormDescription>
                      Make this course visible to students immediately upon
                      creation.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                * Required fields
              </div>
              <div className="flex gap-3">
                <Link to="/instructor/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="min-w-32"
                >
                  {createCourseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Course
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Enhanced Debug Panel */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="space-y-2 text-xs">
            <div>
              <strong>Categories Status:</strong>
              <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
                {JSON.stringify(
                  {
                    loading: categoriesLoading,
                    error: categoriesError?.message,
                    hasData: !!categories,
                    isArray: Array.isArray(categories),
                    count: categories?.length,
                    firstCategory: categories?.[0],
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <div>
              <strong>Form Values:</strong>
              <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
                {JSON.stringify(
                  {
                    userId: user?.id,
                    selectedCategory: form.watch("categoryId"),
                    formValues: form.watch(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


