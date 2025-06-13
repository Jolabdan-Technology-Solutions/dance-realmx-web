
// import { useState, useEffect } from "react";
// import { useAuth } from "../../hooks/use-auth";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { Link, useLocation } from "wouter";
// import { Loader2, ArrowLeft, Save, RefreshCw } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Category } from "@/shared/schema";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";

// // Define the course data structure
// type Course = {
//   id: number;
//   title: string;
//   short_name: string;
//   description?: string;
//   detailed_description?: string;
//   image_url?: string;
//   price?: string;
//   category_id?: number;
//   instructor_id?: number;
//   difficulty_level?: string;
//   duration?: string;
//   visible?: boolean;
//   preview_video_url?: string;
//   video_url?: string;
//   created_at?: string;
//   updated_at?: string;
// };

// // Create form schema for validation
// const courseFormSchema = z.object({
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

// type CourseFormFields = z.infer<typeof courseFormSchema>;

// // Type for the API request (snake_case)
// type UpdateCourseApiRequest = {
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
//   video_url?: string;
// };

// // Custom FileUpload component
// interface FileUploadProps {
//   onUploadComplete: (url: string) => void;
//   defaultValue?: string;
//   acceptedTypes?: string;
//   label?: string;
//   buttonText?: string;
//   maxSizeMB?: number;
// }

// const FileUpload: React.FC<FileUploadProps> = ({
//   onUploadComplete,
//   defaultValue = "",
//   acceptedTypes = "image/*",
//   label = "Upload File",
//   buttonText = "Choose file",
//   maxSizeMB = 25,
// }) => {
//   const [file, setFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string>(defaultValue);
//   const [uploadStatus, setUploadStatus] = useState<string>("");
//   const [isUploading, setIsUploading] = useState<boolean>(false);
//   const { toast } = useToast();

//   // Update preview URL when defaultValue changes
//   useEffect(() => {
//     setPreviewUrl(defaultValue);
//   }, [defaultValue]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (!selectedFile) return;

//     // Validate file size
//     const maxSizeBytes = maxSizeMB * 1024 * 1024;
//     if (selectedFile.size > maxSizeBytes) {
//       toast({
//         title: "File Too Large",
//         description: `File size exceeds ${maxSizeMB}MB limit.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     setFile(selectedFile);
//     setPreviewUrl(URL.createObjectURL(selectedFile));
//     setUploadStatus("");
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       toast({
//         title: "No File Selected",
//         description: "Please select a file to upload.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsUploading(true);
//     setUploadStatus("Uploading...");

//     try {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("resource_type", "image");
//       formData.append("folder", "images");

//       const response = await apiRequest("/api/upload", {
//         method: "POST",
//         data: formData,
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       const data = response.data;
//       if (data.url) {
//         setUploadStatus("Upload successful!");
//         setPreviewUrl(data.url);
//         onUploadComplete(data.url);
//         toast({
//           title: "Image Uploaded",
//           description: "The course image has been successfully uploaded.",
//         });
//       } else {
//         throw new Error(data.error || "Upload failed");
//       }
//     } catch (error: any) {
//       setUploadStatus("Upload failed");
//       toast({
//         title: "Upload Failed",
//         description: error.message || "An error occurred during upload.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="space-y-2">
//       <label className="text-sm font-medium">{label}</label>
//       <div className="flex items-center gap-2">
//         <input
//           type="file"
//           accept={acceptedTypes}
//           onChange={handleFileChange}
//           className="block w-full text-sm text-gray-500
//             file:mr-4 file:py-2 file:px-4
//             file:rounded-md file:border-0
//             file:text-sm file:font-semibold
//             file:bg-primary file:text-primary-foreground
//             hover:file:bg-primary/90"
//         />
//         <Button
//           type="button"
//           onClick={handleUpload}
//           disabled={isUploading || !file}
//         >
//           {isUploading ? (
//             <>
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               Uploading...
//             </>
//           ) : (
//             buttonText
//           )}
//         </Button>
//       </div>
//       {previewUrl && (
//         <img
//           src={previewUrl}
//           alt="Preview"
//           className="mt-2 max-w-xs rounded-md"
//         />
//       )}
//       {uploadStatus && (
//         <p
//           className={`text-sm ${
//             uploadStatus.includes("success") ? "text-green-600" : "text-red-600"
//           }`}
//         >
//           {uploadStatus}
//         </p>
//       )}
//     </div>
//   );
// };

// export default function CourseEditPage({ id }: { id?: number }) {
//   const { user, isLoading: authLoading } = useAuth();
//   const [location, navigate] = useLocation();
//   const { toast } = useToast();

//   // If no ID provided, try to extract from URL
//   let courseId = id;
//   if (!courseId) {
//     const pathParts = location.split('/');
//     const idFromUrl = pathParts[pathParts.length - 2]; // Get ID from /courses/:id/edit
//     courseId = parseInt(idFromUrl);
//   }

//   // Validate ID
//   if (!courseId || typeof courseId !== 'number' || isNaN(courseId)) {
//     console.error('Invalid course ID provided:', courseId, typeof courseId);
//     console.error('Current location:', location);
//     return (
//       <div className="container mx-auto py-8 px-4">
//         <div className="flex items-center mb-6">
//           <Link to="/instructor/dashboard">
//             <Button variant="ghost" size="sm" className="mr-2">
//               <ArrowLeft className="h-4 w-4 mr-1" />
//               Back to Dashboard
//             </Button>
//           </Link>
//           <h1 className="text-3xl font-bold">Invalid Course ID</h1>
//         </div>
//         <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
//           <p className="text-red-700 dark:text-red-300 mb-4">
//             Invalid course ID provided. Expected a number, got: {typeof courseId}
//           </p>
//           <p className="text-sm text-gray-600 mb-4">
//             Current URL: {location}
//           </p>
//           <Link to="/instructor/dashboard">
//             <Button variant="secondary">Go to Dashboard</Button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // Use the validated courseId for the rest of the component
//   const validatedId = courseId;

//   // Fetch existing course data
//   const {
//     data: course,
//     isLoading: courseLoading,
//     error: courseError,
//     refetch: refetchCourse,
//   } = useQuery<Course>({
//     queryKey: ["course", validatedId],
//     queryFn: async () => {
//       console.log('Fetching course with ID:', validatedId);
//       const response = await apiRequest(`/api/courses/${validatedId}`, {
//         method: "GET",
//       });

//       console.log('Course API response:', response);
      
//       // Handle different response formats
//       let courseData;
//       if (response.data && typeof response.data === 'object') {
//         courseData = response.data.data || response.data;
//       } else if (response && typeof response === 'object') {
//         courseData = response.data || response;
//       } else {
//         throw new Error('Invalid response format');
//       }

//       if (!courseData) {
//         throw new Error('Course not found');
//       }

//       return courseData as Course;
//     },
//     enabled: !!validatedId,
//     retry: 2,
//     staleTime: 30000, // 30 seconds
//   });

//   // Fetch categories
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
        
//         const responseData = response.data;
//         console.log("Categories API response:", responseData);

//         // Handle different response formats
//         let categoriesArray;
//         if (responseData?.data && Array.isArray(responseData.data)) {
//           categoriesArray = responseData.data;
//         } else if (Array.isArray(responseData)) {
//           categoriesArray = responseData;
//         } else {
//           throw new Error("Invalid response format - expected array or object with data property");
//         }
        
//         console.log("Extracted categories:", categoriesArray.length, "items");
//         return categoriesArray;
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//         throw error;
//       }
//     },
//     retry: 3,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });

//   // Form with validation
//   const form = useForm<CourseFormFields>({
//     resolver: zodResolver(courseFormSchema),
//     defaultValues: {
//       title: "",
//       shortName: "",
//       description: "",
//       detailedDescription: "",
//       imageUrl: "",
//       price: "",
//       categoryId: undefined,
//       instructorId: null,
//       difficultyLevel: "beginner",
//       estimatedDuration: "",
//       visible: false,
//       previewVideoUrl: "",
//       fullVideoUrl: "",
//     },
//   });

//   // Populate form with course data when it loads
//   useEffect(() => {
//     if (course) {
//       console.log('Populating form with course data:', course);
      
//       form.reset({
//         title: course.title || "",
//         shortName: course.short_name || "",
//         description: course.description || "",
//         detailedDescription: course.detailed_description || "",
//         imageUrl: course.image_url || "",
//         price: course.price || "",
//         categoryId: course.category_id || undefined,
//         instructorId: course.instructor_id || null,
//         difficultyLevel: course.difficulty_level || "beginner",
//         estimatedDuration: course.duration || "",
//         visible: course.visible || false,
//         previewVideoUrl: course.preview_video_url || "",
//         fullVideoUrl: course.video_url || "",
//       });
//     }
//   }, [course, form]);

//   // Update course mutation
//   const updateCourseMutation = useMutation({
//     mutationFn: async (values: UpdateCourseApiRequest) => {
//       console.log(`Updating course ${validatedId} with values:`, values);
      
//       const response = await apiRequest(`/api/courses/${validatedId}`, {
//         method: "PUT", // or "PATCH" depending on your API
//         data: values,
//       });
//       return response.data;
//     },
//     onSuccess: (data: any) => {
//       console.log("Course update response data:", data);

//       // Invalidate related caches
//       queryClient.invalidateQueries({ queryKey: ["courses"] });
//       queryClient.invalidateQueries({ queryKey: ["course", validatedId] });
//       queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

//       const courseTitle = form.getValues("title") || "Course";

//       toast({
//         title: "Course Updated Successfully",
//         description: `"${courseTitle}" has been updated.`,
//       });

//       // Navigate back to course detail or dashboard
//       navigate(`/instructor/courses/${validatedId}`);
//     },
//     onError: (error: Error) => {
//       console.error("Course update failed:", error);
//       toast({
//         title: "Failed to Update Course",
//         description: error.message || "An unexpected error occurred. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   // Form submission handler
//   const onSubmit = async (values: CourseFormFields) => {
//     console.log("Form submitted with values:", values);

//     // Validate that category exists if categoryId is provided
//     if (values.categoryId && categories && Array.isArray(categories)) {
//       const categoryExists = categories.some((cat) => cat.id === values.categoryId);
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
//     const transformedValues: UpdateCourseApiRequest = {
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
//       video_url: values.fullVideoUrl || undefined,
//     };

//     console.log("Sending update request with:", transformedValues);
//     updateCourseMutation.mutate(transformedValues);
//   };

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
//           <div className="text-sm text-red-500 mb-2">Failed to load categories</div>
//           <div className="text-xs text-gray-500 mb-2">
//             {categoriesError?.message || "Unknown error"}
//           </div>
//           <Button variant="outline" size="sm" onClick={() => refetchCategories()}>
//             <RefreshCw className="h-3 w-3 mr-1" />
//             Retry
//           </Button>
//         </div>
//       );
//     }

//     if (!categories || !Array.isArray(categories) || categories.length === 0) {
//       return (
//         <div className="p-4 text-center">
//           <div className="text-sm text-muted-foreground mb-2">
//             No categories available
//           </div>
//           <Button variant="outline" size="sm" onClick={() => refetchCategories()}>
//             <RefreshCw className="h-3 w-3 mr-1" />
//             Load Categories
//           </Button>
//         </div>
//       );
//     }

//     // Success case: render categories
//     return (
//       <>
//         <SelectItem value="none">No category</SelectItem>
//         {categories.map((category) => {
//           if (!category || typeof category.id === "undefined" || !category.name) {
//             console.warn("Invalid category object:", category);
//             return null;
//           }
//           return (
//             <SelectItem key={category.id} value={category.id.toString()}>
//               {category.name}
//             </SelectItem>
//           );
//         })}
//       </>
//     );
//   };

//   // Show loading state while fetching course data
//   if (courseLoading) {
//     return (
//       <div className="container mx-auto py-8 px-4">
//         <div className="flex items-center justify-center min-h-64">
//           <div className="text-center">
//             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
//             <p className="text-muted-foreground">Loading course data...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Show error state if course fetch failed
//   if (courseError || !course) {
//     return (
//       <div className="container mx-auto py-8 px-4">
//         <div className="flex items-center mb-6">
//           <Link to="/instructor/dashboard">
//             <Button variant="ghost" size="sm" className="mr-2">
//               <ArrowLeft className="h-4 w-4 mr-1" />
//               Back to Dashboard
//             </Button>
//           </Link>
//           <h1 className="text-3xl font-bold">Course Not Found</h1>
//         </div>
//         <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
//           <p className="text-red-700 dark:text-red-300 mb-4">
//             {courseError?.message || "Failed to load course data"}
//           </p>
//           <div className="flex gap-2">
//             <Button onClick={() => refetchCourse()} variant="outline">
//               <RefreshCw className="h-4 w-4 mr-2" />
//               Try Again
//             </Button>
//             <Link to="/instructor/dashboard">
//               <Button variant="secondary">Go to Dashboard</Button>
//             </Link>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto py-8 px-4">
//       <div className="flex items-center mb-6">
//         <Link to="/instructor/dashboard">
//           <Button variant="ghost" size="sm" className="mr-2">
//             <ArrowLeft className="h-4 w-4 mr-1" />
//             Back to Dashboard
//           </Button>
//         </Link>
//         <h1 className="text-3xl font-bold">
//           Edit Course: {course.title}
//         </h1>
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
//                     A short description that will appear in course listings (minimum 20 characters).
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
//                     A detailed description of your course syllabus, goals, and learning outcomes.
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
//                         onUploadComplete={(url) => {
//                           field.onChange(url);
//                           form.setValue("imageUrl", url);
//                         }}
//                         defaultValue={field.value || ""}
//                         acceptedTypes="image/*"
//                         label="Course Image"
//                         buttonText="Upload Image"
//                         maxSizeMB={25}
//                       />
//                     </FormControl>
//                     <FormDescription>
//                       Select an image that represents your course (max 25MB).
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
//               {/* Category */}
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
//                           field.onChange(value === "none" ? undefined : parseInt(value));
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
//                       {(isCategoriesError || !categories) && (
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           onClick={() => refetchCategories()}
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
//                         <SelectItem value="intermediate">Intermediate</SelectItem>
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
//                           if (e.target.value && !form.getValues("previewVideoUrl")) {
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
//                     <FormLabel className="text-base">Course Visibility</FormLabel>
//                     <FormDescription>
//                       Toggle course visibility for students.
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
//                 <Link to={`/instructor/courses/${validatedId}`}>
//                   <Button type="button" variant="outline">
//                     Cancel
//                   </Button>
//                 </Link>
//                 <Button
//                   type="submit"
//                   disabled={updateCourseMutation.isPending}
//                   className="min-w-32"
//                 >
//                   {updateCourseMutation.isPending ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Updating...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="mr-2 h-4 w-4" />
//                       Update Course
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </form>
//         </Form>
//       </div>

//       {/* Debug Panel (development only) */}
//       {process.env.NODE_ENV === "development" && (
//         <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
//           <h3 className="font-semibold mb-2">Debug Info:</h3>
//           <div className="space-y-2 text-xs">
//             <div>
//               <strong>Course ID:</strong> {id}
//             </div>
//             <div>
//               <strong>Course Data:</strong>
//               <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
//                 {JSON.stringify(
//                   {
//                     loading: courseLoading,
//                     error: courseError?.message,
//                     hasData: !!course,
//                     courseTitle: course?.title,
//                     courseId: course?.id,
//                   },
//                   null,
//                   2
//                 )}
//               </pre>
//             </div>
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
//                     isDirty: form.formState.isDirty,
//                     isValid: form.formState.isValid,
//                     errors: form.formState.errors,
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Category } from "@/shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Define the course data structure
type Course = {
  id: number;
  title: string;
  short_name: string;
  description?: string;
  detailed_description?: string;
  image_url?: string;
  price?: string;
  category_id?: number;
  instructor_id?: number;
  difficulty_level?: string;
  duration?: string;
  visible?: boolean;
  preview_video_url?: string;
  video_url?: string;
  created_at?: string;
  updated_at?: string;
};

// Create form schema for validation
const courseFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  shortName: z.string().min(2, "Short name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  detailedDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Empty is valid
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Price must be a valid number greater than or equal to 0"),
  categoryId: z.number().optional(),
  instructorId: z.number().nullable(),
  difficultyLevel: z.string(),
  estimatedDuration: z.string().optional(),
  visible: z.boolean(),
  previewVideoUrl: z.string().optional(),
  fullVideoUrl: z.string().optional(),
});

type CourseFormFields = z.infer<typeof courseFormSchema>;

type UpdateCourseApiRequest = {
  title: string;
  short_name: string;
  description?: string;
  detailed_description?: string;
  image_url?: string;
  price?: number;
  category_id?: number;
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

  // Update preview URL when defaultValue changes
  useEffect(() => {
    setPreviewUrl(defaultValue);
  }, [defaultValue]);

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
      formData.append("resource_type", "image");
      formData.append("folder", "images");

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

export default function CourseEditPage({ id }: { id?: number }) {
  const { user, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // If no ID provided, try to extract from URL
  let courseId = id;
  if (!courseId) {
    const pathParts = location.split('/');
    const idFromUrl = pathParts[pathParts.length - 2]; // Get ID from /courses/:id/edit
    courseId = parseInt(idFromUrl);
  }

  // Validate ID
  if (!courseId || typeof courseId !== 'number' || isNaN(courseId)) {
    console.error('Invalid course ID provided:', courseId, typeof courseId);
    console.error('Current location:', location);
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link to="/instructor/dashboard">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Invalid Course ID</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 mb-4">
            Invalid course ID provided. Expected a number, got: {typeof courseId}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Current URL: {location}
          </p>
          <Link to="/instructor/dashboard">
            <Button variant="secondary">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Use the validated courseId for the rest of the component
  const validatedId = courseId;

  // Fetch existing course data
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
    refetch: refetchCourse,
  } = useQuery<Course>({
    queryKey: ["course", validatedId],
    queryFn: async () => {
      console.log('Fetching course with ID:', validatedId);
      const response = await apiRequest(`/api/courses/${validatedId}`, {
        method: "GET",
      });

      console.log('Course API response:', response);
      
      // Handle different response formats
      let courseData;
      if (response.data && typeof response.data === 'object') {
        courseData = response.data.data || response.data;
      } else if (response && typeof response === 'object') {
        courseData = response.data || response;
      } else {
        throw new Error('Invalid response format');
      }

      if (!courseData) {
        throw new Error('Course not found');
      }

      return courseData as Course;
    },
    enabled: !!validatedId,
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Fetch categories
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
        
        const responseData = response.data;
        console.log("Categories API response:", responseData);

        // Handle different response formats
        let categoriesArray;
        if (responseData?.data && Array.isArray(responseData.data)) {
          categoriesArray = responseData.data;
        } else if (Array.isArray(responseData)) {
          categoriesArray = responseData;
        } else {
          throw new Error("Invalid response format - expected array or object with data property");
        }
        
        console.log("Extracted categories:", categoriesArray.length, "items");
        return categoriesArray;
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Form with validation
  const form = useForm<CourseFormFields>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      shortName: "",
      description: "",
      detailedDescription: "",
      imageUrl: "",
      price: "",
      categoryId: undefined,
      instructorId: null,
      difficultyLevel: "beginner",
      estimatedDuration: "",
      visible: false,
      previewVideoUrl: "",
      fullVideoUrl: "",
    },
  });

  // Populate form with course data when it loads
  useEffect(() => {
    if (course) {
      console.log('Populating form with course data:', course);
      
      form.reset({
        title: course.title || "",
        shortName: course.short_name || "",
        description: course.description || "",
        detailedDescription: course.detailed_description || "",
        imageUrl: course.image_url || "",
        price: course.price || "",
        categoryId: course.category_id || undefined,
        instructorId: course.instructor_id || null,
        difficultyLevel: course.difficulty_level || "beginner",
        estimatedDuration: course.duration || "",
        visible: course.visible || false,
        previewVideoUrl: course.preview_video_url || "",
        fullVideoUrl: course.video_url || "",
      });
    }
  }, [course, form, courseId]);

  // Update course mutation - THIS IS THE MAIN UPDATE FUNCTION
  const updateCourseMutation = useMutation({
    mutationFn: async (values: UpdateCourseApiRequest) => {
      console.log(`Updating course ${validatedId} with values:`, values);
      console.log('Stringified payload:', JSON.stringify(values, null, 2));
      
      // Clean the payload - remove undefined values
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => value !== undefined)
      ) as UpdateCourseApiRequest;
      
      console.log('Cleaned payload:', cleanedValues);
      console.log('Cleaned stringified payload:', JSON.stringify(cleanedValues, null, 2));
      
      // Make the API call to update the course
      const response = await apiRequest(`/api/courses/${validatedId}`, {
        method: "PUT", // Using PUT method for full update
        data: cleanedValues,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Update response:', response);
      return response.data;
    },
    onSuccess: (data: any) => {
      console.log("Course update successful:", data);

      // Invalidate and refresh related caches
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", validatedId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });

      const courseTitle = form.getValues("title") || "Course";

      toast({
        title: "Course Updated Successfully",
        description: `"${courseTitle}" has been updated successfully.`,
      });

      // Navigate back to course detail page
      navigate(`/instructor/courses/${validatedId}`);
    },
    onError: (error: any) => {
      console.error("Course update failed:", error);
      
      // Extract error message from different possible error formats
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Failed to Update Course",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (values: CourseFormFields) => {
    console.log("Form submitted with values:", values);

    // Validate that category exists if categoryId is provided
    if (values.categoryId && categories && Array.isArray(categories)) {
      const categoryExists = categories.some((cat) => cat.id === values.categoryId);
      if (!categoryExists) {
        toast({
          title: "Invalid Category",
          description: "Please select a valid category.",
          variant: "destructive",
        });
        return;
      }
    }

    // Convert price to number if provided
    let priceValue: number | undefined = undefined;
    if (values.price && values.price.trim()) {
      const parsedPrice = parseFloat(values.price.trim());
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        toast({
          title: "Invalid Price",
          description: "Price must be a valid number greater than or equal to 0.",
          variant: "destructive",
        });
        return;
      }
      priceValue = parsedPrice;
    }

    // Transform form data to match API expectations (snake_case)
    const transformedValues: UpdateCourseApiRequest = {
      title: values.title.trim(),
      short_name: values.shortName.trim(),
      description: values.description ? values.description.trim() : undefined,
      detailed_description: values.detailedDescription ? values.detailedDescription.trim() : undefined,
      image_url: values.imageUrl ? values.imageUrl.trim() : undefined,
      price: priceValue,
      category_id: values.categoryId || null,
      instructor_id: values.instructorId || user?.id || null,
      difficulty_level: values.difficultyLevel,
      duration: values.estimatedDuration ? values.estimatedDuration.trim() : undefined,
      visible: values.visible,
      preview_video_url: values.previewVideoUrl ? values.previewVideoUrl.trim() : undefined,
      video_url: values.fullVideoUrl ? values.fullVideoUrl.trim() : undefined,
    };

    console.log("Sending update request to /api/courses/" + validatedId + " with:", transformedValues);
    
    // Execute the mutation
    updateCourseMutation.mutate(transformedValues);
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
          <div className="text-sm text-red-500 mb-2">Failed to load categories</div>
          <div className="text-xs text-gray-500 mb-2">
            {categoriesError?.message || "Unknown error"}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchCategories()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="text-sm text-muted-foreground mb-2">
            No categories available
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchCategories()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Load Categories
          </Button>
        </div>
      );
    }

    // Success case: render categories
    return (
      <>
        <SelectItem value="none">No category</SelectItem>
        {categories.map((category) => {
          if (!category || typeof category.id === "undefined" || !category.name) {
            console.warn("Invalid category object:", category);
            return null;
          }
          return (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          );
        })}
      </>
    );
  };

  // Show loading state while fetching course data
  if (courseLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if course fetch failed
  if (courseError || !course) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link to="/instructor/dashboard">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Course Not Found</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 mb-4">
            {courseError?.message || "Failed to load course data"}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => refetchCourse()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Link to="/instructor/dashboard">
              <Button variant="secondary">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link to="/instructor/dashboard">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          Edit Course: {course.title}
        </h1>
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
                    A short description that will appear in course listings (minimum 20 characters).
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
                    A detailed description of your course syllabus, goals, and learning outcomes.
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
                        onUploadComplete={(url) => {
                          field.onChange(url);
                          form.setValue("imageUrl", url);
                        }}
                        defaultValue={field.value || ""}
                        acceptedTypes="image/*"
                        label=""
                        buttonText="Upload Image"
                        maxSizeMB={25}
                      />
                    </FormControl>
                    <FormDescription>
                      Select an image that represents your course (640×360 px).
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
                          field.onChange(value === "none" ? undefined : parseInt(value));
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
                          onClick={() => refetchCategories()}
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
                          if (e.target.value && !form.getValues("previewVideoUrl")) {
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
                    <FormLabel className="text-base">Course Visibility</FormLabel>
                    <FormDescription>
                      Toggle course visibility for students.
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
                <Link to={`/instructor/courses/${validatedId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={updateCourseMutation.isPending}
                  className="min-w-32"
                >
                  {updateCourseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Course
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Debug Panel (development only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="space-y-2 text-xs">
            <div>
              <strong>Course ID:</strong> {validatedId}
            </div>
            <div>
              <strong>API Endpoint:</strong> /api/courses/{validatedId}
            </div>
            <div>
              <strong>Update Status:</strong> {updateCourseMutation.isPending ? 'Updating...' : 'Ready'}
            </div>
            <div>
              <strong>Course Data:</strong>
              <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1">
                {JSON.stringify(
                  {
                    loading: courseLoading,
                    error: courseError?.message,
                    hasData: !!course,
                    courseTitle: course?.title,
                    courseId: course?.id,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
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
                    isDirty: form.formState.isDirty,
                    isValid: form.formState.isValid,
                    errors: form.formState.errors,
                    currentValues: form.getValues(),
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