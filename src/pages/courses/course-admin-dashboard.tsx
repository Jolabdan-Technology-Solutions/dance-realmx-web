// import { useState, useEffect } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { useAuth } from "@/hooks/use-auth";
// import { useToast } from "@/hooks/use-toast";
// import { queryClient, apiRequest } from "@/lib/queryClient";
// import { Link } from "wouter";
// import { 
//   Tabs, 
//   TabsContent, 
//   TabsList, 
//   TabsTrigger 
// } from "@/components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
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
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { CachedImage } from "@/components/ui/cached-image";
// import { FileUpload } from "@/components/ui/file-upload";
// import { 
//   Loader2, 
//   Eye, 
//   Check, 
//   X, 
//   Edit, 
//   Trash, 
//   Plus,
//   LayoutGrid,
//   FileText,
//   ListChecks,
//   FileQuestion
// } from "lucide-react";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// // Define types
// interface Course {
//   id: number;
//   title: string;
//   description: string;
//   instructorId: number;
//   status: string;
//   price: string;
//   imageUrl: string;
//   fullVideoUrl?: string | null;
//   previewVideoUrl?: string | null;
//   createdAt?: Date;
//   updatedAt?: Date;
//   instructorName?: string;
//   moduleCount?: number;
//   enrollmentCount?: number;
// }

// interface Module {
//   id: number;
//   courseId: number;
//   title: string;
//   description: string;
//   position: number;
//   lessonCount?: number;
//   lessons?: Lesson[];
// }

// interface Lesson {
//   id: number;
//   moduleId: number;
//   title: string;
//   description: string;
//   content: string;
//   position: number;
//   type: string;
//   quizzes?: Quiz[];
// }

// interface Quiz {
//   id: number;
//   lessonId: number;
//   title: string;
//   description: string;
//   passScore: number;
// }

// interface QuizQuestion {
//   id: number;
//   quizId: number;
//   question: string;
//   options: string[];
//   correctOption: number;
// }

// interface Instructor {
//   id: number;
//   username: string;
//   firstName: string | null;
//   lastName: string | null;
//   email: string | null;
//   bio: string | null;
//   profileImageUrl: string | null;
// }

// // Course form schema
// const courseSchema = z.object({
//   title: z.string().min(3, "Title must be at least 3 characters"),
//   description: z.string().min(10, "Description must be at least 10 characters"),
//   price: z.string().refine(
//     (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
//     { message: "Price must be a non-negative number" }
//   ),
//   instructorId: z.number().optional(),
//   status: z.enum(["draft", "published", "archived"]).default("draft"),
//   imageUrl: z.string().optional(),
//   fullVideoUrl: z.string().optional().nullable(),
//   previewVideoUrl: z.string().optional().nullable(),
// });

// // Module form schema
// const moduleSchema = z.object({
//   title: z.string().min(3, "Title must be at least 3 characters"),
//   description: z.string().min(10, "Description must be at least 10 characters"),
//   position: z.number().int().min(1),
//   courseId: z.number(),
// });

// // Lesson form schema
// const lessonSchema = z.object({
//   title: z.string().min(3, "Title must be at least 3 characters"),
//   description: z.string().min(10, "Description must be at least 10 characters"),
//   content: z.string().min(1, "Content is required"),
//   position: z.number().int().min(1),
//   moduleId: z.number(),
//   type: z.enum(["text", "video", "quiz"]).default("text"),
// });

// // Quiz form schema
// const quizSchema = z.object({
//   title: z.string().min(3, "Title must be at least 3 characters"),
//   description: z.string().min(10, "Description must be at least 10 characters"),
//   passScore: z.number().int().min(1).max(100),
//   lessonId: z.number(),
// });

// // Quiz question form schema
// const quizQuestionSchema = z.object({
//   question: z.string().min(3, "Question must be at least 3 characters"),
//   options: z.array(z.string()).min(2, "At least 2 options are required"),
//   correctOption: z.number().int().min(0),
//   quizId: z.number(),
// });

// export default function CourseAdminDashboard() {
//   const { user, isLoading: authLoading } = useAuth();
//   const { toast } = useToast();
//   const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
//   const [selectedModule, setSelectedModule] = useState<Module | null>(null);
//   const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
//   const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
//   const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
//   const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
//   const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
//   const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
//   const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  
//   const [isEditing, setIsEditing] = useState(false);
//   const [courseImage, setCourseImage] = useState<File | null>(null);
//   const [questionOptions, setQuestionOptions] = useState<string[]>(['', '']);
//   const [selectedCorrectOption, setSelectedCorrectOption] = useState(0);

//   // Forms
//   const courseForm = useForm<z.infer<typeof courseSchema>>({
//     resolver: zodResolver(courseSchema),
//     defaultValues: {
//       title: "",
//       description: "",
//       price: "0",
//       status: "draft",
//       fullVideoUrl: "",
//       previewVideoUrl: "",
//     },
//   });

//   const moduleForm = useForm<z.infer<typeof moduleSchema>>({
//     resolver: zodResolver(moduleSchema),
//     defaultValues: {
//       title: "",
//       description: "",
//       position: 1,
//       courseId: 0,
//     },
//   });

//   const lessonForm = useForm<z.infer<typeof lessonSchema>>({
//     resolver: zodResolver(lessonSchema),
//     defaultValues: {
//       title: "",
//       description: "",
//       content: "",
//       position: 1,
//       moduleId: 0,
//       type: "text",
//     },
//   });

//   const quizForm = useForm<z.infer<typeof quizSchema>>({
//     resolver: zodResolver(quizSchema),
//     defaultValues: {
//       title: "",
//       description: "",
//       passScore: 70,
//       lessonId: 0,
//     },
//   });

//   const questionForm = useForm<z.infer<typeof quizQuestionSchema>>({
//     resolver: zodResolver(quizQuestionSchema),
//     defaultValues: {
//       question: "",
//       options: [],
//       correctOption: 0,
//       quizId: 0,
//     },
//   });

//   // Queries
//   const {
//     data: courses,
//     isLoading: isCoursesLoading,
//     error: coursesError
//   } = useQuery({
//     queryKey: ['/api/courses'],
//     queryFn: () => apiRequest("/api/courses", { method: "GET" }).then(res => res.json()),
//     enabled: !!user && (user.role === "ADMIN" || user.role === "INSTRUCTOR_ADMIN"),
//   });

//   const {
//     data: courseDetails,
//     isLoading: isCourseDetailsLoading,
//     error: courseDetailsError
//   } = useQuery({
//     queryKey: ['/api/courses', selectedCourse?.id],
//     queryFn: () => apiRequest(`/api/courses/${selectedCourse?.id}`, { method: "GET" }).then(res => res.json()),
//     enabled: !!selectedCourse?.id,
//   });

//   const {
//     data: instructors,
//     isLoading: isInstructorsLoading,
//     error: instructorsError
//   } = useQuery({
//     queryKey: ['/api/instructors'],
//     queryFn: () => apiRequest("/api/instructors", { method: "GET" }).then(res => res.json()),
//     enabled: !!user && user.role === "ADMIN",
//   });

//   // Mutations
//   const createCourseMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof courseSchema>) => {
//       const response = await apiRequest("/api/courses", {
//         method: "POST",
//         data
//       });
//       const courseData = await response.json();
      
//       if (courseImage) {
//         const formData = new FormData();
//         formData.append('file', courseImage);
//         formData.append('entityType', 'course');
//         formData.append('entityId', courseData.id.toString());
        
//         const uploadResponse = await fetch('/api/upload/course', {
//           method: 'POST',
//           body: formData,
//         });
        
//         if (!uploadResponse.ok) {
//           throw new Error("Failed to upload course image");
//         }
        
//         const uploadData = await uploadResponse.json();
        
//         await apiRequest(`/api/courses/${courseData.id}`, {
//           method: "PATCH",
//           data: { imageUrl: uploadData.url }
//         });
//       }
      
//       return courseData;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
//       setIsCourseDialogOpen(false);
//       courseForm.reset();
//       setCourseImage(null);
//       toast({
//         title: "Success",
//         description: "Course created successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to create course: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const updateCourseMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof courseSchema> & { id: number }) => {
//       const { id, ...courseData } = data;
      
//       const response = await apiRequest(`/api/courses/${id}`, {
//         method: "PATCH",
//         data: courseData
//       });
//       const updatedCourse = await response.json();
      
//       if (courseImage) {
//         const formData = new FormData();
//         formData.append('file', courseImage);
//         formData.append('entityType', 'course');
//         formData.append('entityId', id.toString());
        
//         const uploadResponse = await fetch('/api/upload/course', {
//           method: 'POST',
//           body: formData,
//         });
        
//         if (!uploadResponse.ok) {
//           throw new Error("Failed to upload course image");
//         }
        
//         const uploadData = await uploadResponse.json();
        
//         await apiRequest(`/api/courses/${id}`, {
//           method: "PATCH",
//           data: { imageUrl: uploadData.url }
//         });
//       }
      
//       return updatedCourse;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', data.id] });
//       setIsCourseDialogOpen(false);
//       courseForm.reset();
//       setCourseImage(null);
//       setIsEditing(false);
//       toast({
//         title: "Success",
//         description: "Course updated successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to update course: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const deleteCourseMutation = useMutation({
//     mutationFn: async (courseId: number) => {
//       return apiRequest(`/api/courses/${courseId}`, { method: "DELETE" });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
//       toast({
//         title: "Success",
//         description: "Course deleted successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to delete course: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const createModuleMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof moduleSchema>) => {
//       return apiRequest("/api/modules", {
//         method: "POST",
//         data
//       }).then(res => res.json());
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', data.courseId] });
//       setIsModuleDialogOpen(false);
//       moduleForm.reset();
//       toast({
//         title: "Success",
//         description: "Module created successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to create module: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const updateModuleMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof moduleSchema> & { id: number }) => {
//       const { id, ...moduleData } = data;
//       return apiRequest(`/api/modules/${id}`, {
//         method: "PATCH",
//         data: moduleData
//       }).then(res => res.json());
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', data.courseId] });
//       setIsModuleDialogOpen(false);
//       moduleForm.reset();
//       setIsEditing(false);
//       toast({
//         title: "Success",
//         description: "Module updated successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to update module: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const deleteModuleMutation = useMutation({
//     mutationFn: async (moduleId: number) => {
//       return apiRequest(`/api/modules/${moduleId}`, { method: "DELETE" });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
//       toast({
//         title: "Success",
//         description: "Module deleted successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to delete module: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const createLessonMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof lessonSchema>) => {
//       return apiRequest("/api/lessons", {
//         method: "POST",
//         data
//       }).then(res => res.json());
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
//       setIsLessonDialogOpen(false);
//       lessonForm.reset();
//       toast({
//         title: "Success",
//         description: "Lesson created successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to create lesson: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const updateLessonMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof lessonSchema> & { id: number }) => {
//       const { id, ...lessonData } = data;
//       return apiRequest(`/api/lessons/${id}`, {
//         method: "PATCH",
//         data: lessonData
//       }).then(res => res.json());
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
//       setIsLessonDialogOpen(false);
//       lessonForm.reset();
//       setIsEditing(false);
//       toast({
//         title: "Success",
//         description: "Lesson updated successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to update lesson: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const deleteLessonMutation = useMutation({
//     mutationFn: async (lessonId: number) => {
//       return apiRequest(`/api/lessons/${lessonId}`, { method: "DELETE" });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
//       toast({
//         title: "Success",
//         description: "Lesson deleted successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to delete lesson: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const createQuizMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof quizSchema>) => {
//       return apiRequest("/api/quizzes", {
//         method: "POST",
//         data
//       }).then(res => res.json());
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
//       setIsQuizDialogOpen(false);
//       quizForm.reset();
//       toast({
//         title: "Success",
//         description: "Quiz created successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to create quiz: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   const createQuestionMutation = useMutation({
//     mutationFn: async (data: z.infer<typeof quizQuestionSchema>) => {
//       return apiRequest("/api/quiz-questions", {
//         method: "POST",
//         data
//       }).then(res => res.json());
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
//       setIsQuestionDialogOpen(false);
//       questionForm.reset();
//       setQuestionOptions(['', '']);
//       setSelectedCorrectOption(0);
//       toast({
//         title: "Success",
//         description: "Question added successfully",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: `Failed to add question: ${error.message}`,
//         variant: "destructive",
//       });
//     }
//   });

//   // Handlers
//   const handleCreateCourse = () => {
//     setIsEditing(false);
//     courseForm.reset({
//       title: "",
//       description: "",
//       price: "0",
//       status: "draft",
//       fullVideoUrl: "",
//       previewVideoUrl: "",
//     });
//     setCourseImage(null);
//     setIsCourseDialogOpen(true);
//   };

//   const handleEditCourse = (course: Course) => {
//     setIsEditing(true);
//     setSelectedCourse(course);
//     courseForm.reset({
//       title: course.title,
//       description: course.description,
//       price: course.price,
//       status: course.status as "draft" | "published" | "archived",
//       instructorId: course.instructorId,
//       fullVideoUrl: course.fullVideoUrl || "",
//       previewVideoUrl: course.previewVideoUrl || "",
//     });
//     setCourseImage(null);
//     setIsCourseDialogOpen(true);
//   };

//   const handleCreateModule = (courseId: number) => {
//     setIsEditing(false);
//     moduleForm.reset({
//       title: "",
//       description: "",
//       position: courseDetails?.modules?.length ? courseDetails.modules.length + 1 : 1,
//       courseId,
//     });
//     setIsModuleDialogOpen(true);
//   };

//   const handleEditModule = (module: Module) => {
//     setIsEditing(true);
//     setSelectedModule(module);
//     moduleForm.reset({
//       title: module.title,
//       description: module.description,
//       position: module.position,
//       courseId: module.courseId,
//     });
//     setIsModuleDialogOpen(true);
//   };

//   const handleCreateLesson = (moduleId: number) => {
//     setIsEditing(false);
//     const module = courseDetails?.modules?.find((m: Module) => m.id === moduleId);
//     if (!module) return;
    
//     lessonForm.reset({
//       title: "",
//       description: "",
//       content: "",
//       position: module.lessons?.length ? module.lessons.length + 1 : 1,
//       moduleId,
//       type: "text",
//     });
//     setIsLessonDialogOpen(true);
//   };

//   const handleEditLesson = (lesson: Lesson) => {
//     setIsEditing(true);
//     setSelectedLesson(lesson);
//     lessonForm.reset({
//       title: lesson.title,
//       description: lesson.description,
//       content: lesson.content,
//       position: lesson.position,
//       moduleId: lesson.moduleId,
//       type: lesson.type as "text" | "video" | "quiz",
//     });
//     setIsLessonDialogOpen(true);
//   };

//   const handleCreateQuiz = (lessonId: number) => {
//     const lesson = courseDetails?.modules?.flatMap((m: Module) => m.lessons || []).find((l: Lesson) => l.id === lessonId);
//     if (!lesson) return;
    
//     quizForm.reset({
//       title: `Quiz for ${lesson.title}`,
//       description: "Test your knowledge of this lesson",
//       passScore: 70,
//       lessonId,
//     });
//     setIsQuizDialogOpen(true);
//   };

//   const handleAddQuestion = (quizId: number) => {
//     const quiz = courseDetails?.modules?.flatMap((m: Module) => m.lessons?.flatMap((l: Lesson) => l.quizzes || []) || []).find((q: Quiz) => q.id === quizId);
//     if (!quiz) return;
    
//     setSelectedQuiz(quiz);
//     setQuestionOptions(['', '']);
//     setSelectedCorrectOption(0);
//     questionForm.reset({
//       question: "",
//       options: [],
//       correctOption: 0,
//       quizId,
//     });
//     setIsQuestionDialogOpen(true);
//   };

//   const handleAddOption = () => {
//     setQuestionOptions([...questionOptions, '']);
//   };

//   const handleRemoveOption = (index: number) => {
//     if (questionOptions.length <= 2) {
//       toast({
//         title: "Error",
//         description: "A question must have at least 2 options",
//         variant: "destructive",
//       });
//       return;
//     }
    
//     const newOptions = [...questionOptions];
//     newOptions.splice(index, 1);
//     setQuestionOptions(newOptions);
    
//     // Adjust selected correct option if needed
//     if (selectedCorrectOption === index) {
//       setSelectedCorrectOption(0);
//     } else if (selectedCorrectOption > index) {
//       setSelectedCorrectOption(selectedCorrectOption - 1);
//     }
//   };

//   const handleOptionChange = (index: number, value: string) => {
//     const newOptions = [...questionOptions];
//     newOptions[index] = value;
//     setQuestionOptions(newOptions);
//   };

//   // Form submissions
//   const onCourseSubmit = (data: z.infer<typeof courseSchema>) => {
//     if (isEditing && selectedCourse) {
//       updateCourseMutation.mutate({ ...data, id: selectedCourse.id });
//     } else {
//       createCourseMutation.mutate(data);
//     }
//     // Close the dialog after submitting to prevent it from staying open
//     setIsCourseDialogOpen(false);
//   };

//   const onModuleSubmit = (data: z.infer<typeof moduleSchema>) => {
//     if (isEditing && selectedModule) {
//       updateModuleMutation.mutate({ ...data, id: selectedModule.id });
//     } else {
//       createModuleMutation.mutate(data);
//     }
//     // Close the dialog after submitting to prevent it from staying open
//     setIsModuleDialogOpen(false);
//   };

//   const onLessonSubmit = (data: z.infer<typeof lessonSchema>) => {
//     if (isEditing && selectedLesson) {
//       updateLessonMutation.mutate({ ...data, id: selectedLesson.id });
//     } else {
//       createLessonMutation.mutate(data);
//     }
//     // Close the dialog after submitting to prevent it from staying open
//     setIsLessonDialogOpen(false);
//   };

//   const onQuizSubmit = (data: z.infer<typeof quizSchema>) => {
//     createQuizMutation.mutate(data);
//     // Close the dialog after submitting to prevent it from staying open
//     setIsQuizDialogOpen(false);
//   };

//   const onQuestionSubmit = () => {
//     // Validate options
//     if (questionOptions.some(opt => !opt.trim())) {
//       toast({
//         title: "Error",
//         description: "All options must have content",
//         variant: "destructive",
//       });
//       return;
//     }
    
//     const data = {
//       question: questionForm.getValues().question,
//       options: questionOptions,
//       correctOption: selectedCorrectOption,
//       quizId: selectedQuiz?.id || 0,
//     };
    
//     createQuestionMutation.mutate(data);
//     // Close the dialog after submitting to prevent it from staying open
//     setIsQuestionDialogOpen(false);
//   };

//   // Helper function to render module content
//   const renderModuleContent = (module: Module) => (
//     <div key={module.id} className="space-y-4">
//       <h4 className="font-medium">{module.title}</h4>
//       {module.lessons?.map((lesson: Lesson) => (
//         <div key={lesson.id} className="ml-4">
//           <p>{lesson.title}</p>
//           {lesson.quizzes?.map((quiz: Quiz) => (
//             <div key={quiz.id} className="ml-4">
//               <p>{quiz.title}</p>
//             </div>
//           ))}
//         </div>
//       ))}
//     </div>
//   );

//   // Loading state
//   if (authLoading || isCoursesLoading || (selectedCourse && isCourseDetailsLoading)) {
//     return (
//       <div className="container mx-auto py-10 flex items-center justify-center min-h-[60vh]">
//         <div className="flex flex-col items-center space-y-4">
//           <Loader2 className="h-12 w-12 animate-spin text-primary" />
//           <p className="text-lg">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   // Access check
//   if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR_ADMIN")) {
//     return (
//       <div className="container mx-auto py-10">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-red-500">Access Denied</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p>You do not have permission to access this page. This page is only for instructors and admins.</p>
//           </CardContent>
//           <CardFooter>
//             <Button variant="outline" asChild>
//               <Link href="/">Return to Home</Link>
//             </Button>
//           </CardFooter>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold">Course Administration</h1>
//           <p className="text-muted-foreground">
//             Manage courses, modules, lessons, and quizzes
//           </p>
//         </div>
//         <Button onClick={handleCreateCourse}>
//           <Plus className="h-4 w-4 mr-2" />
//           Create New Course
//         </Button>
//       </div>

//       <Tabs defaultValue={selectedCourse ? "details" : "courses"} className="w-full">
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="courses">All Courses</TabsTrigger>
//           <TabsTrigger value="details" disabled={!selectedCourse}>
//             {selectedCourse ? `${selectedCourse.title} Details` : 'Course Details'}
//           </TabsTrigger>
//         </TabsList>

//         {/* All Courses Tab */}
//         <TabsContent value="courses">
//           <Card>
//             <CardHeader>
//               <CardTitle>Course Catalog</CardTitle>
//               <CardDescription>
//                 Manage the course catalog for your curriculum
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               {courses?.length === 0 ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No courses available. Create your first course to get started.
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {courses?.map((course: Course) => (
//                     <Card key={course.id} className="overflow-hidden flex flex-col">
//                       <div className="aspect-video relative overflow-hidden">
//                         {course.imageUrl ? (
//                           <CachedImage
//                             src={course.imageUrl}
//                             alt={course.title}
//                             className="h-full w-full object-cover transition-transform hover:scale-105"
//                           />
//                         ) : (
//                           <div className="h-full w-full flex items-center justify-center bg-primary/10">
//                             <FileText className="h-16 w-16 text-primary/40" />
//                           </div>
//                         )}
//                         <Badge 
//                           className="absolute top-2 right-2"
//                           variant={
//                             course.status === "published" ? "default" :
//                             course.status === "draft" ? "outline" :
//                             "secondary"
//                           }
//                         >
//                           {course.status === "published" ? "Published" : 
//                            course.status === "draft" ? "Draft" : 
//                            course.status === "archived" ? "Archived" : 
//                            course.status}
//                         </Badge>
//                       </div>
//                       <CardHeader className="pb-2">
//                         <CardTitle className="text-xl">{course.title}</CardTitle>
//                         <CardDescription>
//                           ${course.price} • {course.moduleCount || 0} Modules
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="pb-2 flex-grow">
//                         <p className="text-sm line-clamp-3">{course.description}</p>
//                       </CardContent>
//                       <CardFooter className="pt-2 flex justify-between">
//                         <Button 
//                           variant="outline" 
//                           size="sm"
//                           onClick={() => setSelectedCourse(course)}
//                         >
//                           <LayoutGrid className="h-4 w-4 mr-1" />
//                           Manage
//                         </Button>
//                         <div className="flex gap-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => handleEditCourse(course)}
//                           >
//                             <Edit className="h-4 w-4" />
//                             <span className="sr-only">Edit</span>
//                           </Button>
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             className="text-red-500 hover:text-red-700"
//                             onClick={() => {
//                               if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
//                                 deleteCourseMutation.mutate(course.id);
//                               }
//                             }}
//                           >
//                             <Trash className="h-4 w-4" />
//                             <span className="sr-only">Delete</span>
//                           </Button>
//                         </div>
//                       </CardFooter>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Course Details Tab */}
//         <TabsContent value="details">
//           {selectedCourse && (
//             <div className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <CardTitle>{selectedCourse.title}</CardTitle>
//                       <CardDescription>${selectedCourse.price} - {selectedCourse.status}</CardDescription>
//                     </div>
//                     <div className="flex gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleEditCourse(selectedCourse)}
//                       >
//                         <Edit className="h-4 w-4 mr-1" />
//                         Edit Course
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleCreateModule(selectedCourse.id)}
//                       >
//                         <Plus className="h-4 w-4 mr-1" />
//                         Add Module
//                       </Button>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                     <div className="aspect-video relative rounded-md overflow-hidden">
//                       {selectedCourse.imageUrl ? (
//                         <CachedImage
//                           src={selectedCourse.imageUrl}
//                           alt={selectedCourse.title}
//                           className="h-full w-full object-cover"
//                         />
//                       ) : (
//                         <div className="h-full w-full flex items-center justify-center bg-primary/10">
//                           <FileText className="h-16 w-16 text-primary/40" />
//                         </div>
//                       )}
//                     </div>
//                     <div className="md:col-span-2">
//                       <h3 className="text-lg font-medium mb-2">Description</h3>
//                       <p className="text-muted-foreground mb-4">{selectedCourse.description}</p>
                      
//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <h4 className="text-sm font-medium text-muted-foreground">Instructor</h4>
//                           <p>{selectedCourse.instructorName || `Instructor #${selectedCourse.instructorId}`}</p>
//                         </div>
//                         <div>
//                           <h4 className="text-sm font-medium text-muted-foreground">Enrollments</h4>
//                           <p>{selectedCourse.enrollmentCount || 0}</p>
//                         </div>
//                         <div>
//                           <h4 className="text-sm font-medium text-muted-foreground">Modules</h4>
//                           <p>{courseDetails?.modules?.length || 0}</p>
//                         </div>
//                         <div>
//                           <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
//                           <p>{selectedCourse.createdAt ? new Date(selectedCourse.createdAt).toLocaleDateString() : 'N/A'}</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <h3 className="text-lg font-medium mb-4">Course Modules</h3>
                  
//                   {courseDetails?.modules?.length === 0 ? (
//                     <div className="text-center py-8 text-muted-foreground border rounded-md">
//                       No modules available. Add your first module to get started.
//                     </div>
//                   ) : (
//                     <div className="space-y-6">
//                       {courseDetails?.modules?.map((module: Module) => (
//                         <Card key={module.id}>
//                           <CardHeader className="pb-2">
//                             <div className="flex justify-between items-start">
//                               <div>
//                                 <CardTitle className="text-lg">
//                                   Module {module.position}: {module.title}
//                                 </CardTitle>
//                                 <CardDescription>
//                                   {module.lessonCount || 0} Lessons
//                                 </CardDescription>
//                               </div>
//                               <div className="flex gap-2">
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => handleEditModule(module)}
//                                 >
//                                   <Edit className="h-4 w-4" />
//                                 </Button>
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => handleCreateLesson(module.id)}
//                                 >
//                                   <Plus className="h-4 w-4" />
//                                 </Button>
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="text-red-500 hover:text-red-700"
//                                   onClick={() => {
//                                     if (confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
//                                       deleteModuleMutation.mutate(module.id);
//                                     }
//                                   }}
//                                 >
//                                   <Trash className="h-4 w-4" />
//                                 </Button>
//                               </div>
//                             </div>
//                           </CardHeader>
//                           <CardContent>
//                             <p className="text-sm mb-4">{module.description}</p>
                            
//                             {/* Lessons */}
//                             {module.lessons?.length === 0 ? (
//                               <div className="text-center py-4 text-muted-foreground border rounded-md">
//                                 No lessons in this module.
//                               </div>
//                             ) : (
//                               <div className="space-y-2">
//                                 {module.lessons?.map((lesson: any) => (
//                                   <div 
//                                     key={lesson.id}
//                                     className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50"
//                                   >
//                                     <div className="flex items-center">
//                                       <div className="mr-3">
//                                         {lesson.type === 'text' && <FileText className="h-5 w-5 text-blue-500" />}
//                                         {lesson.type === 'video' && <FileText className="h-5 w-5 text-red-500" />}
//                                         {lesson.type === 'quiz' && <FileQuestion className="h-5 w-5 text-green-500" />}
//                                       </div>
//                                       <div>
//                                         <h4 className="text-sm font-medium">
//                                           {lesson.position}. {lesson.title}
//                                         </h4>
//                                         <p className="text-xs text-muted-foreground">
//                                           {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} Lesson
//                                         </p>
//                                       </div>
//                                     </div>
                                    
//                                     <div className="flex gap-2">
//                                       {lesson.type === 'quiz' ? (
//                                         <Button
//                                           variant="outline"
//                                           size="sm"
//                                           onClick={() => handleAddQuestion(lesson.quiz?.id)}
//                                           disabled={!lesson.quiz}
//                                         >
//                                           <ListChecks className="h-4 w-4" />
//                                         </Button>
//                                       ) : (
//                                         <Button
//                                           variant="outline"
//                                           size="sm"
//                                           onClick={() => handleCreateQuiz(lesson.id)}
//                                           disabled={lesson.quiz}
//                                         >
//                                           <FileQuestion className="h-4 w-4" />
//                                         </Button>
//                                       )}
//                                       <Button
//                                         variant="outline"
//                                         size="sm"
//                                         onClick={() => handleEditLesson(lesson)}
//                                       >
//                                         <Edit className="h-4 w-4" />
//                                       </Button>
//                                       <Button
//                                         variant="outline"
//                                         size="sm"
//                                         className="text-red-500 hover:text-red-700"
//                                         onClick={() => {
//                                           if (confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
//                                             deleteLessonMutation.mutate(lesson.id);
//                                           }
//                                         }}
//                                       >
//                                         <Trash className="h-4 w-4" />
//                                       </Button>
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             )}
//                           </CardContent>
//                         </Card>
//                       ))}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>

//       {/* Course Dialog */}
//       <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{isEditing ? "Edit Course" : "Create New Course"}</DialogTitle>
//             <DialogDescription>
//               {isEditing 
//                 ? "Update course details" 
//                 : "Add a new course to your curriculum"}
//             </DialogDescription>
//           </DialogHeader>
//           <Form {...courseForm}>
//             <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <FormField
//                     control={courseForm.control}
//                     name="title"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Course Title</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Introduction to Ballet" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={courseForm.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Price (USD)</FormLabel>
//                         <FormControl>
//                           <div className="relative">
//                             <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
//                             <Input className="pl-8" placeholder="19.99" {...field} />
//                           </div>
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={courseForm.control}
//                     name="status"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Status</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select status" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="draft">Draft</SelectItem>
//                             <SelectItem value="published">Published</SelectItem>
//                             <SelectItem value="archived">Archived</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {user.role === "ADMIN" && (
//                     <FormField
//                       control={courseForm.control}
//                       name="instructorId"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Instructor</FormLabel>
//                           <Select
//                             onValueChange={(value) => field.onChange(parseInt(value))}
//                             defaultValue={field.value?.toString()}
//                           >
//                             <FormControl>
//                               <SelectTrigger>
//                                 <SelectValue placeholder="Select instructor" />
//                               </SelectTrigger>
//                             </FormControl>
//                             <SelectContent>
//                               {instructors?.map((instructor: Instructor) => (
//                                 <SelectItem key={instructor.id} value={instructor.id.toString()}>
//                                   {instructor.firstName 
//                                     ? `${instructor.firstName} ${instructor.lastName || ''}`
//                                     : instructor.username}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   )}
//                 </div>

//                 <div className="space-y-4">
//                   <FormField
//                     control={courseForm.control}
//                     name="description"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Description</FormLabel>
//                         <FormControl>
//                           <Textarea
//                             placeholder="A comprehensive course that teaches..."
//                             className="min-h-[120px]"
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <div>
//                     <Label>Course Image</Label>
//                     <div className="mt-2">
//                       <FileUpload 
//                         onUploadComplete={(url, metadata) => {
//                           console.log("File selected, metadata:", metadata);
//                           if (Array.isArray(metadata) && metadata[0]?.file) {
//                             setCourseImage(metadata[0].file);
//                           } else if (!Array.isArray(metadata) && metadata?.file) {
//                             setCourseImage(metadata.file);
//                           }
//                         }}
//                         acceptedTypes="image/*"
//                         maxSizeMB={5} // 5MB
//                       />
//                     </div>
//                     {isEditing && selectedCourse?.imageUrl && !courseImage && (
//                       <div className="mt-2">
//                         <div className="text-sm text-muted-foreground mb-2">Current image:</div>
//                         <div className="h-24 w-24 relative rounded-md overflow-hidden border">
//                           <CachedImage
//                             src={selectedCourse.imageUrl}
//                             alt={selectedCourse.title}
//                             className="h-full w-full object-cover"
//                           />
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Video URLs Section */}
//               <div className="space-y-6 border-t pt-6 mt-4">
//                 <h3 className="text-lg font-medium mb-4">Course Videos</h3>
                
//                 {/* Full Video URL */}
//                 <FormField
//                   control={courseForm.control}
//                   name="fullVideoUrl"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Full Video URL</FormLabel>
//                       <FormControl>
//                         <Input 
//                           placeholder="https://www.youtube.com/watch?v=..." 
//                           value={field.value || ""}
//                           onChange={(e) => {
//                             // Update fullVideoUrl
//                             field.onChange(e.target.value);
                            
//                             // Auto-populate previewVideoUrl with the same value
//                             if (e.target.value && !courseForm.getValues("previewVideoUrl")) {
//                               courseForm.setValue("previewVideoUrl", e.target.value);
//                             }
//                           }}
//                           onBlur={field.onBlur}
//                           name={field.name}
//                           ref={field.ref}
//                         />
//                       </FormControl>
//                       <FormDescription>
//                         Full course video URL (only visible to enrolled students)
//                       </FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 {/* Preview Video URL */}
//                 <FormField
//                   control={courseForm.control}
//                   name="previewVideoUrl"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Preview Video URL</FormLabel>
//                       <FormControl>
//                         <Input 
//                           placeholder="https://www.youtube.com/watch?v=..." 
//                           value={field.value || ""}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           name={field.name}
//                           ref={field.ref}
//                         />
//                       </FormControl>
//                       <FormDescription>
//                         Preview video URL (visible to all users, including guests)
//                       </FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <p className="text-sm text-muted-foreground italic">
//                   Note: The preview video URL is auto-populated from the full video URL. 
//                   A preview will be shown when users click the preview button.
//                 </p>
//               </div>

//               <DialogFooter>
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => {
//                     setIsCourseDialogOpen(false);
//                     courseForm.reset();
//                     setCourseImage(null);
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
//                 >
//                   {(createCourseMutation.isPending || updateCourseMutation.isPending) && (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   )}
//                   {isEditing ? "Update Course" : "Create Course"}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {/* Module Dialog */}
//       <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{isEditing ? "Edit Module" : "Create New Module"}</DialogTitle>
//             <DialogDescription>
//               {isEditing
//                 ? "Update module details"
//                 : "Add a new module to your course"}
//             </DialogDescription>
//           </DialogHeader>
//           <Form {...moduleForm}>
//             <form onSubmit={moduleForm.handleSubmit(onModuleSubmit)} className="space-y-4">
//               <FormField
//                 control={moduleForm.control}
//                 name="title"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Module Title</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Getting Started" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={moduleForm.control}
//                 name="description"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Description</FormLabel>
//                     <FormControl>
//                       <Textarea
//                         placeholder="Introduction to the key concepts..."
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={moduleForm.control}
//                 name="position"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Position</FormLabel>
//                     <FormControl>
//                       <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
//                     </FormControl>
//                     <FormDescription>
//                       The order in which this module appears in the course
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <DialogFooter>
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => {
//                     setIsModuleDialogOpen(false);
//                     moduleForm.reset();
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
//                 >
//                   {(createModuleMutation.isPending || updateModuleMutation.isPending) && (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   )}
//                   {isEditing ? "Update Module" : "Create Module"}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {/* Lesson Dialog */}
//       <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{isEditing ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
//             <DialogDescription>
//               {isEditing
//                 ? "Update lesson details"
//                 : "Add a new lesson to your module"}
//             </DialogDescription>
//           </DialogHeader>
//           <Form {...lessonForm}>
//             <form onSubmit={lessonForm.handleSubmit(onLessonSubmit)} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={lessonForm.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Lesson Title</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Basic Positions" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={lessonForm.control}
//                   name="type"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Lesson Type</FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         defaultValue={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select type" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="text">Text</SelectItem>
//                           <SelectItem value="video">Video</SelectItem>
//                           <SelectItem value="quiz">Quiz</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={lessonForm.control}
//                 name="description"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Description</FormLabel>
//                     <FormControl>
//                       <Textarea
//                         placeholder="Brief overview of the lesson..."
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={lessonForm.control}
//                 name="content"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Content</FormLabel>
//                     <FormControl>
//                       <Textarea
//                         placeholder="Detailed lesson content..."
//                         className="min-h-[200px]"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormDescription>
//                       {lessonForm.getValues().type === "video" 
//                         ? "Enter the video URL or embed code"
//                         : lessonForm.getValues().type === "quiz" 
//                         ? "Provide instructions for the quiz"
//                         : "Full lesson content in markdown format"}
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={lessonForm.control}
//                 name="position"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Position</FormLabel>
//                     <FormControl>
//                       <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
//                     </FormControl>
//                     <FormDescription>
//                       The order in which this lesson appears in the module
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <DialogFooter>
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => {
//                     setIsLessonDialogOpen(false);
//                     lessonForm.reset();
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
//                 >
//                   {(createLessonMutation.isPending || updateLessonMutation.isPending) && (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   )}
//                   {isEditing ? "Update Lesson" : "Create Lesson"}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {/* Quiz Dialog */}
//       <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Create Quiz</DialogTitle>
//             <DialogDescription>
//               Add a quiz to test student knowledge
//             </DialogDescription>
//           </DialogHeader>
//           <Form {...quizForm}>
//             <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-4">
//               <FormField
//                 control={quizForm.control}
//                 name="title"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Quiz Title</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Module 1 Assessment" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={quizForm.control}
//                 name="description"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Description</FormLabel>
//                     <FormControl>
//                       <Textarea
//                         placeholder="Test your knowledge of the key concepts..."
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={quizForm.control}
//                 name="passScore"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Passing Score (%)</FormLabel>
//                     <FormControl>
//                       <Input type="number" min="1" max="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
//                     </FormControl>
//                     <FormDescription>
//                       Percentage of correct answers needed to pass the quiz
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <DialogFooter>
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => {
//                     setIsQuizDialogOpen(false);
//                     quizForm.reset();
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   disabled={createQuizMutation.isPending}
//                 >
//                   {createQuizMutation.isPending && (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   )}
//                   Create Quiz
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {/* Question Dialog */}
//       <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Add Question</DialogTitle>
//             <DialogDescription>
//               Add a question to the quiz
//             </DialogDescription>
//           </DialogHeader>
//           <Form {...questionForm}>
//             <form onSubmit={(e) => { e.preventDefault(); onQuestionSubmit(); }} className="space-y-4">
//               <FormField
//                 control={questionForm.control}
//                 name="question"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Question</FormLabel>
//                     <FormControl>
//                       <Input placeholder="What is the first position in ballet?" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="space-y-2">
//                 <Label>Options</Label>
//                 <p className="text-sm text-muted-foreground mb-2">
//                   Add at least 2 options and select the correct one
//                 </p>
                
//                 {questionOptions.map((option, index) => (
//                   <div key={index} className="flex items-center space-x-2">
//                     <input
//                       type="radio"
//                       id={`option-${index}`}
//                       name="correctOption"
//                       checked={selectedCorrectOption === index}
//                       onChange={() => setSelectedCorrectOption(index)}
//                       className="h-4 w-4 text-primary"
//                     />
//                     <Input
//                       value={option}
//                       onChange={(e) => handleOptionChange(index, e.target.value)}
//                       placeholder={`Option ${index + 1}`}
//                       className="flex-1"
//                     />
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="icon"
//                       onClick={() => handleRemoveOption(index)}
//                       disabled={questionOptions.length <= 2}
//                     >
//                       <Trash className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 ))}
                
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={handleAddOption}
//                   className="mt-2"
//                 >
//                   <Plus className="h-4 w-4 mr-1" />
//                   Add Option
//                 </Button>
//               </div>

//               <DialogFooter>
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => {
//                     setIsQuestionDialogOpen(false);
//                     questionForm.reset();
//                     setQuestionOptions(['', '']);
//                     setSelectedCorrectOption(0);
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   disabled={
//                     createQuestionMutation.isPending || 
//                     !questionForm.getValues().question || 
//                     questionOptions.some(opt => !opt.trim()) ||
//                     questionOptions.length < 2
//                   }
//                 >
//                   {createQuestionMutation.isPending && (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   )}
//                   Add Question
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }



import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CachedImage } from "@/components/ui/cached-image";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  Loader2, 
  Eye, 
  Check, 
  X, 
  Edit, 
  Trash, 
  Plus,
  LayoutGrid,
  FileText,
  ListChecks,
  FileQuestion
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define types
interface Course {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  status: string;
  price: string;
  imageUrl: string;
  fullVideoUrl?: string | null;
  previewVideoUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  instructorName?: string;
  moduleCount?: number;
  enrollmentCount?: number;
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string;
  position: number;
  lessonCount?: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  position: number;
  type: string;
  quizzes?: Quiz[];
}

interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  passScore: number;
}

interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  options: string[];
  correctOption: number;
}

interface Instructor {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  bio: string | null;
  profileImageUrl: string | null;
}

// Course form schema
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Price must be a non-negative number" }
  ),
  instructorId: z.number().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  imageUrl: z.string().optional(),
  fullVideoUrl: z.string().optional().nullable(),
  previewVideoUrl: z.string().optional().nullable(),
});

// Module form schema
const moduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  position: z.number().int().min(1),
  courseId: z.number(),
});

// Lesson form schema
const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  content: z.string().min(1, "Content is required"),
  position: z.number().int().min(1),
  moduleId: z.number(),
  type: z.enum(["text", "video", "quiz"]).default("text"),
});

// Quiz form schema
const quizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  passScore: z.number().int().min(1).max(100),
  lessonId: z.number(),
});

// Quiz question form schema
const quizQuestionSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters"),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  correctOption: z.number().int().min(0),
  quizId: z.number(),
});

export default function CourseAdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [courseImage, setCourseImage] = useState<File | null>(null);
  const [questionOptions, setQuestionOptions] = useState<string[]>(['', '']);
  const [selectedCorrectOption, setSelectedCorrectOption] = useState(0);

  // Forms
  const courseForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "0",
      status: "draft",
      fullVideoUrl: "",
      previewVideoUrl: "",
    },
  });

  const moduleForm = useForm<z.infer<typeof moduleSchema>>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      position: 1,
      courseId: 0,
    },
  });

  const lessonForm = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      position: 1,
      moduleId: 0,
      type: "text",
    },
  });

  const quizForm = useForm<z.infer<typeof quizSchema>>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      passScore: 70,
      lessonId: 0,
    },
  });

  const questionForm = useForm<z.infer<typeof quizQuestionSchema>>({
    resolver: zodResolver(quizQuestionSchema),
    defaultValues: {
      question: "",
      options: [],
      correctOption: 0,
      quizId: 0,
    },
  });

  // FIXED QUERIES - Extract data property and normalize field names
  const {
    data: courses,
    isLoading: isCoursesLoading,
    error: coursesError
  } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: () => apiRequest("/api/courses", { method: "GET" })
      .then(res => res.json())
      .then(response => {
        // Extract the data array and normalize field names
        const coursesData = response.data || response || [];
        return coursesData.map((course: { id: any; title: any; description: any; instructor_id: any; visible: any; price: { toString: () => any; }; image_url: any; video_url: any; preview_video_url: any; created_at: string | number | Date; updated_at: string | number | Date; instructor: { first_name: any; last_name: any; }; modules: string | any[]; enrollment_count: any; }) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          instructorId: course.instructor_id,
          status: course.visible ? 'published' : 'draft', // Map visibility to status
          price: course.price.toString(),
          imageUrl: course.image_url,
          fullVideoUrl: course.video_url,
          previewVideoUrl: course.preview_video_url,
          createdAt: new Date(course.created_at),
          updatedAt: new Date(course.updated_at),
          instructorName: course.instructor ? 
            `${course.instructor.first_name} ${course.instructor.last_name}`.trim() : 
            null,
          moduleCount: course.modules?.length || 0,
          enrollmentCount: course.enrollment_count || 0,
        }));
      }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "INSTRUCTOR_ADMIN"),
  });

  const {
    data: courseDetails,
    isLoading: isCourseDetailsLoading,
    error: courseDetailsError
  } = useQuery({
    queryKey: ['/api/courses', selectedCourse?.id],
    queryFn: () => apiRequest(`/api/courses/${selectedCourse?.id}`, { method: "GET" })
      .then(res => res.json())
      .then(response => {
        // Handle both single course response and array response
        const courseData = response.data || response;
        
        // If it's an array, take the first item, otherwise use as is
        const course = Array.isArray(courseData) ? courseData[0] : courseData;
        
        if (!course) return null;
        
        // Normalize the course data with modules
        return {
          ...course,
          imageUrl: course.image_url,
          instructorId: course.instructor_id,
          fullVideoUrl: course.video_url,
          previewVideoUrl: course.preview_video_url,
          createdAt: new Date(course.created_at),
          updatedAt: new Date(course.updated_at),
          instructorName: course.instructor ? 
            `${course.instructor.first_name} ${course.instructor.last_name}`.trim() : 
            null,
          modules: course.modules?.map((module: { id: any; course_id: any; title: any; description: any; order: any; lessons: any[]; }) => ({
            id: module.id,
            courseId: module.course_id,
            title: module.title,
            description: module.description,
            position: module.order, // API uses 'order', component expects 'position'
            lessonCount: module.lessons?.length || 0,
            lessons: module.lessons?.map(lesson => ({
              id: lesson.id,
              moduleId: lesson.module_id,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              position: lesson.order, // API uses 'order', component expects 'position'
              type: lesson.type,
              quizzes: lesson.quizzes || []
            })) || []
          })) || []
        };
      }),
    enabled: !!selectedCourse?.id,
  });

  const {
    data: instructors,
    isLoading: isInstructorsLoading,
    error: instructorsError
  } = useQuery({
    queryKey: ['/api/instructors'],
    queryFn: () => apiRequest("/api/instructors", { method: "GET" })
      .then(res => res.json())
      .then(response => {
        // Extract the data array and normalize field names
        const instructorsData = response.data || response || [];
        return instructorsData.map((instructor: { id: any; username: any; first_name: any; last_name: any; email: any; bio: any; profile_image_url: any; }) => ({
          id: instructor.id,
          username: instructor.username,
          firstName: instructor.first_name,
          lastName: instructor.last_name,
          email: instructor.email,
          bio: instructor.bio || null,
          profileImageUrl: instructor.profile_image_url,
        }));
      }),
    enabled: !!user && user.role === "ADMIN",
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseSchema>) => {
      const response = await apiRequest("/api/courses", {
        method: "POST",
        data
      });
      const courseData = await response.json();
      
      if (courseImage) {
        const formData = new FormData();
        formData.append('file', courseImage);
        formData.append('entityType', 'course');
        formData.append('entityId', courseData.id.toString());
        
        const uploadResponse = await fetch('/api/upload/course', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload course image");
        }
        
        const uploadData = await uploadResponse.json();
        
        await apiRequest(`/api/courses/${courseData.id}`, {
          method: "PATCH",
          data: { imageUrl: uploadData.url }
        });
      }
      
      return courseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsCourseDialogOpen(false);
      courseForm.reset();
      setCourseImage(null);
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create course: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseSchema> & { id: number }) => {
      const { id, ...courseData } = data;
      
      const response = await apiRequest(`/api/courses/${id}`, {
        method: "PATCH",
        data: courseData
      });
      const updatedCourse = await response.json();
      
      if (courseImage) {
        const formData = new FormData();
        formData.append('file', courseImage);
        formData.append('entityType', 'course');
        formData.append('entityId', id.toString());
        
        const uploadResponse = await fetch('/api/upload/course', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload course image");
        }
        
        const uploadData = await uploadResponse.json();
        
        await apiRequest(`/api/courses/${id}`, {
          method: "PATCH",
          data: { imageUrl: uploadData.url }
        });
      }
      
      return updatedCourse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', data.id] });
      setIsCourseDialogOpen(false);
      courseForm.reset();
      setCourseImage(null);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update course: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return apiRequest(`/api/courses/${courseId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete course: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof moduleSchema>) => {
      return apiRequest("/api/modules", {
        method: "POST",
        data
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', data.courseId] });
      setIsModuleDialogOpen(false);
      moduleForm.reset();
      toast({
        title: "Success",
        description: "Module created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create module: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof moduleSchema> & { id: number }) => {
      const { id, ...moduleData } = data;
      return apiRequest(`/api/modules/${id}`, {
        method: "PATCH",
        data: moduleData
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', data.courseId] });
      setIsModuleDialogOpen(false);
      moduleForm.reset();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Module updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update module: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      return apiRequest(`/api/modules/${moduleId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete module: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof lessonSchema>) => {
      return apiRequest("/api/lessons", {
        method: "POST",
        data
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
      setIsLessonDialogOpen(false);
      lessonForm.reset();
      toast({
        title: "Success",
        description: "Lesson created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create lesson: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof lessonSchema> & { id: number }) => {
      const { id, ...lessonData } = data;
      return apiRequest(`/api/lessons/${id}`, {
        method: "PATCH",
        data: lessonData
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
      setIsLessonDialogOpen(false);
      lessonForm.reset();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update lesson: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest(`/api/lessons/${lessonId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete lesson: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quizSchema>) => {
      return apiRequest("/api/quizzes", {
        method: "POST",
        data
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
      setIsQuizDialogOpen(false);
      quizForm.reset();
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create quiz: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quizQuestionSchema>) => {
      return apiRequest("/api/quiz-questions", {
        method: "POST",
        data
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse?.id] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setQuestionOptions(['', '']);
      setSelectedCorrectOption(0);
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add question: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleCreateCourse = () => {
    setIsEditing(false);
    courseForm.reset({
      title: "",
      description: "",
      price: "0",
      status: "draft",
      fullVideoUrl: "",
      previewVideoUrl: "",
    });
    setCourseImage(null);
    setIsCourseDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setIsEditing(true);
    setSelectedCourse(course);
    courseForm.reset({
      title: course.title,
      description: course.description,
      price: course.price,
      status: course.status as "draft" | "published" | "archived",
      instructorId: course.instructorId,
      fullVideoUrl: course.fullVideoUrl || "",
      previewVideoUrl: course.previewVideoUrl || "",
    });
    setCourseImage(null);
    setIsCourseDialogOpen(true);
  };

  const handleCreateModule = (courseId: number) => {
    setIsEditing(false);
    moduleForm.reset({
      title: "",
      description: "",
      position: courseDetails?.modules?.length ? courseDetails.modules.length + 1 : 1,
      courseId,
    });
    setIsModuleDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setIsEditing(true);
    setSelectedModule(module);
    moduleForm.reset({
      title: module.title,
      description: module.description,
      position: module.position,
      courseId: module.courseId,
    });
    setIsModuleDialogOpen(true);
  };

  const handleCreateLesson = (moduleId: number) => {
    setIsEditing(false);
    const module = courseDetails?.modules?.find((m: Module) => m.id === moduleId);
    if (!module) return;
    
    lessonForm.reset({
      title: "",
      description: "",
      content: "",
      position: module.lessons?.length ? module.lessons.length + 1 : 1,
      moduleId,
      type: "text",
    });
    setIsLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setIsEditing(true);
    setSelectedLesson(lesson);
    lessonForm.reset({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      position: lesson.position,
      moduleId: lesson.moduleId,
      type: lesson.type as "text" | "video" | "quiz",
    });
    setIsLessonDialogOpen(true);
  };

  const handleCreateQuiz = (lessonId: number) => {
    const lesson = courseDetails?.modules?.flatMap((m: Module) => m.lessons || []).find((l: Lesson) => l.id === lessonId);
    if (!lesson) return;
    
    quizForm.reset({
      title: `Quiz for ${lesson.title}`,
      description: "Test your knowledge of this lesson",
      passScore: 70,
      lessonId,
    });
    setIsQuizDialogOpen(true);
  };

  const handleAddQuestion = (quizId: number) => {
    const quiz = courseDetails?.modules?.flatMap((m: Module) => m.lessons?.flatMap((l: Lesson) => l.quizzes || []) || []).find((q: Quiz) => q.id === quizId);
    if (!quiz) return;
    
    setSelectedQuiz(quiz);
    setQuestionOptions(['', '']);
    setSelectedCorrectOption(0);
    questionForm.reset({
      question: "",
      options: [],
      correctOption: 0,
      quizId,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleAddOption = () => {
    setQuestionOptions([...questionOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (questionOptions.length <= 2) {
      toast({
        title: "Error",
        description: "A question must have at least 2 options",
        variant: "destructive",
      });
      return;
    }
    
    const newOptions = [...questionOptions];
    newOptions.splice(index, 1);
    setQuestionOptions(newOptions);
    
    // Adjust selected correct option if needed
    if (selectedCorrectOption === index) {
      setSelectedCorrectOption(0);
    } else if (selectedCorrectOption > index) {
      setSelectedCorrectOption(selectedCorrectOption - 1);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionOptions];
    newOptions[index] = value;
    setQuestionOptions(newOptions);
  };

  // Form submissions
  const onCourseSubmit = (data: z.infer<typeof courseSchema>) => {
    if (isEditing && selectedCourse) {
      updateCourseMutation.mutate({ ...data, id: selectedCourse.id });
    } else {
      createCourseMutation.mutate(data);
    }
    // Close the dialog after submitting to prevent it from staying open
    setIsCourseDialogOpen(false);
  };

  const onModuleSubmit = (data: z.infer<typeof moduleSchema>) => {
    if (isEditing && selectedModule) {
      updateModuleMutation.mutate({ ...data, id: selectedModule.id });
    } else {
      createModuleMutation.mutate(data);
    }
    // Close the dialog after submitting to prevent it from staying open
    setIsModuleDialogOpen(false);
  };

  const onLessonSubmit = (data: z.infer<typeof lessonSchema>) => {
    if (isEditing && selectedLesson) {
      updateLessonMutation.mutate({ ...data, id: selectedLesson.id });
    } else {
      createLessonMutation.mutate(data);
    }
    // Close the dialog after submitting to prevent it from staying open
    setIsLessonDialogOpen(false);
  };

  const onQuizSubmit = (data: z.infer<typeof quizSchema>) => {
    createQuizMutation.mutate(data);
    // Close the dialog after submitting to prevent it from staying open
    setIsQuizDialogOpen(false);
  };

  const onQuestionSubmit = () => {
    // Validate options
    if (questionOptions.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "All options must have content",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      question: questionForm.getValues().question,
      options: questionOptions,
      correctOption: selectedCorrectOption,
      quizId: selectedQuiz?.id || 0,
    };
    
    createQuestionMutation.mutate(data);
    // Close the dialog after submitting to prevent it from staying open
    setIsQuestionDialogOpen(false);
  };

  // Helper function to render module content
  const renderModuleContent = (module: Module) => (
    <div key={module.id} className="space-y-4">
      <h4 className="font-medium">{module.title}</h4>
      {Array.isArray(module.lessons) && module.lessons.map((lesson: Lesson) => (
        <div key={lesson.id} className="ml-4">
          <p>{lesson.title}</p>
          {Array.isArray(lesson.quizzes) && lesson.quizzes.map((quiz: Quiz) => (
            <div key={quiz.id} className="ml-4">
              <p>{quiz.title}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  // Loading state
  if (authLoading || isCoursesLoading || (selectedCourse && isCourseDetailsLoading)) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Access check
  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR_ADMIN")) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access this page. This page is only for instructors and admins.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Administration</h1>
          <p className="text-muted-foreground">
            Manage courses, modules, lessons, and quizzes
          </p>
        </div>
        <Button onClick={handleCreateCourse}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Course
        </Button>
      </div>

      <Tabs defaultValue={selectedCourse ? "details" : "courses"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">All Courses</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedCourse}>
            {selectedCourse ? `${selectedCourse.title} Details` : 'Course Details'}
          </TabsTrigger>
        </TabsList>

        {/* All Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Catalog</CardTitle>
              <CardDescription>
                Manage the course catalog for your curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!Array.isArray(courses) || courses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {courses === undefined ? "Loading courses..." : "No courses available. Create your first course to get started."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course: Course) => (
                    <Card key={course.id} className="overflow-hidden flex flex-col">
                      <div className="aspect-video relative overflow-hidden">
                        {course.imageUrl ? (
                          <CachedImage
                            src={course.imageUrl}
                            alt={course.title}
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <FileText className="h-16 w-16 text-primary/40" />
                          </div>
                        )}
                        <Badge 
                          className="absolute top-2 right-2"
                          variant={
                            course.status === "published" ? "default" :
                            course.status === "draft" ? "outline" :
                            "secondary"
                          }
                        >
                          {course.status === "published" ? "Published" : 
                           course.status === "draft" ? "Draft" : 
                           course.status === "archived" ? "Archived" : 
                           course.status}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        <CardDescription>
                          ${course.price} • {course.moduleCount || 0} Modules
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 flex-grow">
                        <p className="text-sm line-clamp-3">{course.description}</p>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCourse(course)}
                        >
                          <LayoutGrid className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
                                deleteCourseMutation.mutate(course.id);
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Details Tab */}
        <TabsContent value="details">
          {selectedCourse && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedCourse.title}</CardTitle>
                      <CardDescription>${selectedCourse.price} - {selectedCourse.status}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCourse(selectedCourse)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Course
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateModule(selectedCourse.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Module
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="aspect-video relative rounded-md overflow-hidden">
                      {selectedCourse.imageUrl ? (
                        <CachedImage
                          src={selectedCourse.imageUrl}
                          alt={selectedCourse.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10">
                          <FileText className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <p className="text-muted-foreground mb-4">{selectedCourse.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Instructor</h4>
                          <p>{selectedCourse.instructorName || `Instructor #${selectedCourse.instructorId}`}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Enrollments</h4>
                          <p>{selectedCourse.enrollmentCount || 0}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Modules</h4>
                          <p>{courseDetails?.modules?.length || 0}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                          <p>{selectedCourse.createdAt ? new Date(selectedCourse.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-4">Course Modules</h3>
                  
                  {!Array.isArray(courseDetails?.modules) || courseDetails.modules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md">
                      No modules available. Add your first module to get started.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {courseDetails.modules.map((module: Module) => (
                        <Card key={module.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  Module {module.position}: {module.title}
                                </CardTitle>
                                <CardDescription>
                                  {module.lessonCount || 0} Lessons
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditModule(module)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateLesson(module.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
                                      deleteModuleMutation.mutate(module.id);
                                    }
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-4">{module.description}</p>
                            
                            {/* Lessons */}
                            {!Array.isArray(module.lessons) || module.lessons.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground border rounded-md">
                                No lessons in this module.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {module.lessons.map((lesson: any) => (
                                  <div 
                                    key={lesson.id}
                                    className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50"
                                  >
                                    <div className="flex items-center">
                                      <div className="mr-3">
                                        {lesson.type === 'text' && <FileText className="h-5 w-5 text-blue-500" />}
                                        {lesson.type === 'video' && <FileText className="h-5 w-5 text-red-500" />}
                                        {lesson.type === 'quiz' && <FileQuestion className="h-5 w-5 text-green-500" />}
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium">
                                          {lesson.position}. {lesson.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                          {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} Lesson
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      {lesson.type === 'quiz' ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleAddQuestion(lesson.quiz?.id)}
                                          disabled={!lesson.quiz}
                                        >
                                          <ListChecks className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleCreateQuiz(lesson.id)}
                                          disabled={lesson.quiz}
                                        >
                                          <FileQuestion className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditLesson(lesson)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => {
                                          if (confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
                                            deleteLessonMutation.mutate(lesson.id);
                                          }
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Course" : "Create New Course"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update course details" 
                : "Add a new course to your curriculum"}
            </DialogDescription>
          </DialogHeader>
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={courseForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Introduction to Ballet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courseForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                            <Input className="pl-8" placeholder="19.99" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courseForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {user.role === "ADMIN" && Array.isArray(instructors) && (
                    <FormField
                      control={courseForm.control}
                      name="instructorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructor</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select instructor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {instructors.map((instructor: Instructor) => (
                                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                  {instructor.firstName 
                                    ? `${instructor.firstName} ${instructor.lastName || ''}`
                                    : instructor.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <FormField
                    control={courseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A comprehensive course that teaches..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label>Course Image</Label>
                    <div className="mt-2">
                      <FileUpload 
                        onUploadComplete={(url, metadata) => {
                          console.log("File selected, metadata:", metadata);
                          if (Array.isArray(metadata) && metadata[0]?.file) {
                            setCourseImage(metadata[0].file);
                          } else if (!Array.isArray(metadata) && metadata?.file) {
                            setCourseImage(metadata.file);
                          }
                        }}
                        acceptedTypes="image/*"
                        maxSizeMB={5} // 5MB
                      />
                    </div>
                    {isEditing && selectedCourse?.imageUrl && !courseImage && (
                      <div className="mt-2">
                        <div className="text-sm text-muted-foreground mb-2">Current image:</div>
                        <div className="h-24 w-24 relative rounded-md overflow-hidden border">
                          <CachedImage
                            src={selectedCourse.imageUrl}
                            alt={selectedCourse.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Video URLs Section */}
              <div className="space-y-6 border-t pt-6 mt-4">
                <h3 className="text-lg font-medium mb-4">Course Videos</h3>
                
                {/* Full Video URL */}
                <FormField
                  control={courseForm.control}
                  name="fullVideoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Video URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          value={field.value || ""}
                          onChange={(e) => {
                            // Update fullVideoUrl
                            field.onChange(e.target.value);
                            
                            // Auto-populate previewVideoUrl with the same value
                            if (e.target.value && !courseForm.getValues("previewVideoUrl")) {
                              courseForm.setValue("previewVideoUrl", e.target.value);
                            }
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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
                  control={courseForm.control}
                  name="previewVideoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview Video URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Preview video URL (visible to all users, including guests)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-sm text-muted-foreground italic">
                  Note: The preview video URL is auto-populated from the full video URL. 
                  A preview will be shown when users click the preview button.
                </p>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCourseDialogOpen(false);
                    courseForm.reset();
                    setCourseImage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                >
                  {(createCourseMutation.isPending || updateCourseMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update Course" : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Module" : "Create New Module"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update module details"
                : "Add a new module to your course"}
            </DialogDescription>
          </DialogHeader>
          <Form {...moduleForm}>
            <form onSubmit={moduleForm.handleSubmit(onModuleSubmit)} className="space-y-4">
              <FormField
                control={moduleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Getting Started" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={moduleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Introduction to the key concepts..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={moduleForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormDescription>
                      The order in which this module appears in the course
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsModuleDialogOpen(false);
                    moduleForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                >
                  {(createModuleMutation.isPending || updateModuleMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update Module" : "Create Module"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update lesson details"
                : "Add a new lesson to your module"}
            </DialogDescription>
          </DialogHeader>
          <Form {...lessonForm}>
            <form onSubmit={lessonForm.handleSubmit(onLessonSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={lessonForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Basic Positions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lessonForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={lessonForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief overview of the lesson..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed lesson content..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {lessonForm.getValues().type === "video" 
                        ? "Enter the video URL or embed code"
                        : lessonForm.getValues().type === "quiz" 
                        ? "Provide instructions for the quiz"
                        : "Full lesson content in markdown format"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormDescription>
                      The order in which this lesson appears in the module
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsLessonDialogOpen(false);
                    lessonForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                >
                  {(createLessonMutation.isPending || updateLessonMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update Lesson" : "Create Lesson"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quiz</DialogTitle>
            <DialogDescription>
              Add a quiz to test student knowledge
            </DialogDescription>
          </DialogHeader>
          <Form {...quizForm}>
            <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-4">
              <FormField
                control={quizForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Module 1 Assessment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={quizForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Test your knowledge of the key concepts..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={quizForm.control}
                name="passScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormDescription>
                      Percentage of correct answers needed to pass the quiz
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsQuizDialogOpen(false);
                    quizForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createQuizMutation.isPending}
                >
                  {createQuizMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Quiz
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>
              Add a question to the quiz
            </DialogDescription>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={(e) => { e.preventDefault(); onQuestionSubmit(); }} className="space-y-4">
              <FormField
                control={questionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input placeholder="What is the first position in ballet?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Options</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add at least 2 options and select the correct one
                </p>
                
                {questionOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="correctOption"
                      checked={selectedCorrectOption === index}
                      onChange={() => setSelectedCorrectOption(index)}
                      className="h-4 w-4 text-primary"
                    />
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      disabled={questionOptions.length <= 2}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsQuestionDialogOpen(false);
                    questionForm.reset();
                    setQuestionOptions(['', '']);
                    setSelectedCorrectOption(0);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    createQuestionMutation.isPending || 
                    !questionForm.getValues().question || 
                    questionOptions.some(opt => !opt.trim()) ||
                    questionOptions.length < 2
                  }
                >
                  {createQuestionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Question
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}