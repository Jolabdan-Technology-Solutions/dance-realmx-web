import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import {
  Loader2,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Eye,
  FileDown,
  FileUp,
  BookOpen,
  CheckCircle,
  User,
  UserPlus,
  Award,
  Search,
  UserMinus,
  FileText,
  Edit,
  Download,
  Gift,
  Mail,
  PenTool,
  Server,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { RequireSubscription } from "../../components/subscription/require-subscription";
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
import { FileUpload } from "../../components/ui/file-upload";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Label } from "../../components/ui/label";
import {
  Course,
  Module,
  Lesson,
  Category,
  User as UserType,
  Enrollment,
  Certificate,
  Quiz,
  QuizQuestion,
} from "../../../shared/schema";
import { useToast } from "../../hooks/use-toast";

// Type definitions based on your API response
interface ApiModule {
  id: number;
  title: string;
  description: string;
  course_id: number;
  order: number;
  created_at: string;
  updated_at: string;
  course?: {
    id: number;
    title: string;
    short_name: string;
    duration: string;
    difficulty_level: string;
    detailed_description: string;
    description: string;
    price: number;
    image_url: string;
    visible: boolean;
    instructor_id: number;
    preview_video_url: string;
    video_url: string;
    created_at: string;
    updated_at: string;
  };
}

// Type for course update form
type CourseFormValues = {
  title: string;
  shortName: string;
  description: string;
  detailedDescription: string | null;
  imageUrl: string | null;
  price: string | null;
  categoryId: number | null;
  difficultyLevel: string | null;
  estimatedDuration: string | null;
  visible: boolean | null;
  fullVideoUrl: string | null;
  previewVideoUrl: string | null;
};

// Type for module form - matching your API structure
type ModuleFormValues = {
  title: string;
  description: string;
  order: number;
};

// Type for lesson form
type LessonFormValues = {
  title: string;
  content: string | null;
  videoUrl: string | null;
  orderIndex: number;
};

export function CourseDetailPage() {
  return (
    <RequireSubscription 
      level={10} 
      feature="Course Detail Management"
      description="Access detailed course management, student tracking, and advanced course administration tools"
    >
      <CourseDetailPageContent />
    </RequireSubscription>
  );
}

function CourseDetailPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  // Validate course ID
  const courseId = parseInt(params.id || "");
  if (!courseId || isNaN(courseId)) {
    setLocation("/instructor/dashboard");
    return null;
  }

  // Fetch course data
  const { 
    data: course, 
    isLoading: courseLoading, 
    error: courseError 
  } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
  });

  // Handle error state
  if (courseError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Error Loading Course</h1>
        <p className="mb-6">{courseError.message}</p>
        <Link to="/instructor/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Fetch modules for this course using the correct endpoint
  const { data: modules = [], isLoading: modulesLoading } = useQuery<ApiModule[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/modules`);
      if (!res.ok) throw new Error("Failed to fetch modules");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch categories for the dropdown
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Create form for course editing
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        shortName: z
          .string()
          .min(2, "Short name must be at least 2 characters"),
        description: z
          .string()
          .min(20, "Description must be at least 20 characters"),
        detailedDescription: z.string().nullable(),
        imageUrl: z.string().nullable(),
        price: z.string().nullable(),
        categoryId: z.number().nullable(),
        difficultyLevel: z.string().nullable(),
        estimatedDuration: z.string().nullable(),
        visible: z.boolean().nullable(),
        fullVideoUrl: z.string().nullable(),
        previewVideoUrl: z.string().nullable(),
      })
    ),
    defaultValues: {
      title: "",
      shortName: "",
      description: "",
      detailedDescription: "",
      imageUrl: "",
      price: "",
      categoryId: null,
      difficultyLevel: "beginner",
      estimatedDuration: "",
      visible: false,
      fullVideoUrl: "",
      previewVideoUrl: "",
    },
  });

  // Update form with course data when loaded
  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        shortName: course.shortName,
        description: course.description || "",
        detailedDescription: course.detailedDescription,
        imageUrl: course.imageUrl,
        price: course.price,
        categoryId: course.categoryId,
        difficultyLevel: course.difficultyLevel,
        estimatedDuration: course.estimatedDuration,
        visible: course.visible,
        fullVideoUrl: course.fullVideoUrl || "",
        previewVideoUrl: course.previewVideoUrl || "",
      });
    }
  }, [course, form]);

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const res = await apiRequest("PUT", `/api/courses/${courseId}`, values);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate course data
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

      toast({
        title: "Course Updated",
        description: "Your course changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/courses/${courseId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

      toast({
        title: "Course Deleted",
        description: "Your course has been permanently deleted.",
      });

      // Navigate back to dashboard
      window.location.href = "/instructor/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: CourseFormValues) => {
    updateCourseMutation.mutate(values);
  };

  // Handle loading states
  if (authLoading || courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Unauthorized check
  if (
    course &&
    user &&
    course.instructorId !== user.id &&
    user.role !== "ADMIN"
  ) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Unauthorized</h1>
        <p className="mb-6">
          You do not have permission to manage this course.
        </p>
        <Link to="/instructor/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Link to="/instructor/dashboard">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold truncate">
            {course?.title || "Loading Course..."}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/courses/${courseId}`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Course</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this course? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => deleteCourseMutation.mutate()}
                  disabled={deleteCourseMutation.isPending}
                >
                  {deleteCourseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        {/* Course Details Tab */}
        <TabsContent value="details">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                        <FormLabel>Short Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
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
                          className="min-h-32"
                          {...field}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
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
                            onUploadComplete={(url) => field.onChange(url)}
                            defaultValue={field.value || ""}
                            uploadEndpoint="/api/upload/course"
                            acceptedTypes="image/*"
                            label="Course Image"
                            buttonText="Choose course image"
                            maxSizeMB={5}
                          />
                        </FormControl>
                        {field.value && !field.value.startsWith("data:") && (
                          <div className="text-sm text-muted-foreground">
                            Current URL: {field.value}
                          </div>
                        )}
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
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty if included with subscription
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Video URLs section */}
                <div className="space-y-6 border-t pt-6 mt-4">
                  <h3 className="text-lg font-medium mb-4">Course Videos</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              value={field.value || ""}
                              onChange={(e) => {
                                // Update fullVideoUrl
                                field.onChange(e.target.value);

                                // Auto-populate previewVideoUrl with the same value
                                if (
                                  e.target.value &&
                                  !form.getValues("previewVideoUrl")
                                ) {
                                  form.setValue(
                                    "previewVideoUrl",
                                    e.target.value
                                  );
                                }
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormDescription>
                            Full course video URL (only visible to enrolled
                            students)
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
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormDescription>
                            Preview video URL (visible to all users, including
                            guests)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    Note: The preview video URL is auto-populated from the full
                    video URL. A preview will be shown when users click the
                    preview button.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "default" || value === "no-categories" ? null : parseInt(value))
                          }
                          value={field.value?.toString() || "default"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">Select a category</SelectItem>
                            {categoriesLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading categories...
                              </SelectItem>
                            ) : (
                              Array.isArray(categories) && categories.length > 0 ? categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              )) : (
                                <SelectItem value="no-categories" disabled>
                                  No categories available
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
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
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "default"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">
                              Intermediate
                            </SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="all-levels">
                              All Levels
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Input
                            {...field}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Visibility Toggle */}
                <FormField
                  control={form.control}
                  name="visible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published</FormLabel>
                        <FormDescription>
                          Make this course visible to students.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateCourseMutation.isPending}
                    className="min-w-32"
                  >
                    {updateCourseMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Curriculum Tab */}
        <TabsContent value="curriculum">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Course Curriculum</h2>
              <ModuleDialog courseId={courseId} />
            </div>

            {modulesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : modules && modules.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {Array.isArray(modules) ? modules.map((module) => (
                  <ModuleAccordionItem
                    key={module.id}
                    module={module}
                    courseId={courseId}
                  />
                )) : null}
              </Accordion>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Modules Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your course curriculum by adding modules.
                </p>
                <ModuleDialog courseId={courseId}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Module
                  </Button>
                </ModuleDialog>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Student Management</h2>
              <EnrollStudentDialog courseId={courseId} />
            </div>
            <StudentsList courseId={courseId} />
          </div>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Quiz Management</h2>
              <QuizDialog courseId={courseId} modules={modules || []} />
            </div>
            <QuizList courseId={courseId} />
          </div>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Certificate Management</h2>
              <IssueCertificateDialog courseId={courseId} />
            </div>
            <CertificatesList courseId={courseId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModuleDialog({
  courseId,
  moduleId,
  existingModule,
  children,
}: {
  courseId: number;
  moduleId?: number;
  existingModule?: ApiModule;
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const isEditing = !!moduleId;
  const [open, setOpen] = useState(false);

  // Form for module creation/editing
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        description: z.string().min(1, "Description is required"),
        order: z.number().int().min(1, "Order must be at least 1"),
      })
    ),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
    },
  });

  // Populate form when editing and dialog opens
  useEffect(() => {
    if (existingModule && open) {
      form.reset({
        title: existingModule.title,
        description: existingModule.description,
        order: existingModule.order,
      });
    } else if (!isEditing && open) {
      // Reset for new module
      form.reset({
        title: "",
        description: "",
        order: 1,
      });
    }
  }, [existingModule, form, open, isEditing]);

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (values: ModuleFormValues) => {
      const res = await fetch(`/api/courses/${courseId}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create module");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${courseId}/modules`],
      });
      toast({
        title: "Module Created",
        description: "Your new module has been added to the course.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async (values: ModuleFormValues) => {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update module");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${courseId}/modules`],
      });
      toast({
        title: "Module Updated",
        description: "Your module has been updated successfully.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ModuleFormValues) => {
    if (isEditing) {
      updateModuleMutation.mutate(values);
    } else {
      createModuleMutation.mutate(values);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Module" : "Add New Module"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this module."
              : "Add a new module to organize your course content."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Introduction to Basics"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this module"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what students will learn in this module
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    The order in which this module appears (1 = first)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  createModuleMutation.isPending ||
                  updateModuleMutation.isPending
                }
              >
                {createModuleMutation.isPending ||
                updateModuleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Module"
                ) : (
                  "Add Module"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Fixed Accordion Item for a Module
function ModuleAccordionItem({
  module,
  courseId,
}: {
  module: ApiModule;
  courseId: number;
}) {
  const { toast } = useToast();

  // Fetch lessons for this module
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons", { moduleId: module.id }],
    queryFn: async () => {
      const res = await fetch(`/api/lessons?moduleId=${module.id}`);
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/modules/${module.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete module");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${courseId}/modules`],
      });
      toast({
        title: "Module Deleted",
        description: "The module and all its content has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AccordionItem
      value={`module-${module.id}`}
      className="border px-4 rounded-md mb-4"
    >
      <div className="flex items-center justify-between pr-4">
        <AccordionTrigger className="flex-grow hover:no-underline py-4">
          <div className="flex items-center">
            <span className="font-medium">{module.title}</span>
            {module.description && (
              <span className="ml-2 text-sm text-muted-foreground hidden md:inline-block">
                — {module.description}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <ModuleDialog
            courseId={courseId}
            moduleId={module.id}
            existingModule={module}
          >
            <Button 
              size="sm" 
              variant="ghost" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Edit
            </Button>
          </ModuleDialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Module</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this module? This will also
                  delete all lessons within the module.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => deleteModuleMutation.mutate()}
                  disabled={deleteModuleMutation.isPending}
                >
                  {deleteModuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AccordionContent>
        <div className="pt-2 pb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Lessons</h3>
            <LessonDialog moduleId={module.id} />
          </div>

          {lessonsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="space-y-2">
              {Array.isArray(lessons) ? lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  moduleId={module.id}
                />
              )) : null}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed rounded-md">
              <p className="text-sm text-muted-foreground mb-2">
                No lessons added yet
              </p>
              <LessonDialog moduleId={module.id}>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Lesson
                </Button>
              </LessonDialog>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// Lesson Dialog for Creating/Editing
function LessonDialog({
  moduleId,
  lessonId,
  existingLesson,
  children,
}: {
  moduleId: number;
  lessonId?: number;
  existingLesson?: Lesson;
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const isEditing = !!lessonId;
  const [open, setOpen] = useState(false);

  // Form for lesson creation/editing
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        content: z.string().nullable(),
        videoUrl: z.string().nullable(),
        orderIndex: z.number().int().min(0),
      })
    ),
    defaultValues: {
      title: "",
      content: "",
      videoUrl: "",
      orderIndex: 0,
    },
  });

  // Populate form when editing and dialog opens
  useEffect(() => {
    if (existingLesson && open) {
      form.reset({
        title: existingLesson.title,
        content: existingLesson.content || "",
        videoUrl: existingLesson.videoUrl || "",
        orderIndex: existingLesson.orderIndex || 0,
      });
    } else if (!isEditing && open) {
      form.reset({
        title: "",
        content: "",
        videoUrl: "",
        orderIndex: 0,
      });
    }
  }, [existingLesson, form, open, isEditing]);

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (values: LessonFormValues) => {
      const data = { ...values, moduleId };
      const res = await apiRequest("POST", "/api/lessons", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/lessons", { moduleId }],
      });
      toast({
        title: "Lesson Created",
        description: "Your new lesson has been added to the module.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async (values: LessonFormValues) => {
      const res = await apiRequest("PATCH", `/api/lessons/${lessonId}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/lessons", { moduleId }],
      });
      toast({
        title: "Lesson Updated",
        description: "Your lesson has been updated successfully.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LessonFormValues) => {
    if (isEditing) {
      updateLessonMutation.mutate(values);
    } else {
      createLessonMutation.mutate(values);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Lesson" : "Add New Lesson"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this lesson."
              : "Add a new lesson to this module."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basic Steps" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lesson content or notes"
                      className="min-h-24"
                      {...field}
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Upload (Optional)</FormLabel>
                  <FormControl>
                    <FileUpload
                      onUploadComplete={(url) => field.onChange(url)}
                      defaultValue={field.value || ""}
                      uploadEndpoint="/api/upload/lesson-video"
                      acceptedTypes="video/*"
                      label="Lesson Video"
                      buttonText="Choose video file"
                      maxSizeMB={50}
                    />
                  </FormControl>
                  {field.value && !field.value.startsWith("data:") && (
                    <div className="text-sm text-muted-foreground">
                      Current URL: {field.value}
                    </div>
                  )}
                  <FormDescription>
                    Upload a video for this lesson (max 50MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    The order in which this lesson appears (0 = first)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  createLessonMutation.isPending ||
                  updateLessonMutation.isPending
                }
              >
                {createLessonMutation.isPending ||
                updateLessonMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Lesson"
                ) : (
                  "Add Lesson"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Card for a Lesson
function LessonCard({
  lesson,
  moduleId,
}: {
  lesson: Lesson;
  moduleId: number;
}) {
  const { toast } = useToast();

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/lessons/${lesson.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/lessons", { moduleId }],
      });
      toast({
        title: "Lesson Deleted",
        description: "The lesson has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <div className="flex items-center p-4">
        <div className="flex-grow">
          <h4 className="font-medium">{lesson.title}</h4>
          {lesson.videoUrl && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <FileDown className="h-3 w-3 mr-1" />
              Has video
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <LessonDialog
            moduleId={moduleId}
            lessonId={lesson.id}
            existingLesson={lesson}
          >
            <Button size="sm" variant="ghost" type="button">
              Edit
            </Button>
          </LessonDialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Lesson</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this lesson?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => deleteLessonMutation.mutate()}
                  disabled={deleteLessonMutation.isPending}
                >
                  {deleteLessonMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}

// Placeholder components for other tabs
function StudentsList({ courseId }: { courseId: number }) {
  return (
    <div className="text-center py-8">
      <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">Students Management</h3>
      <p className="text-muted-foreground">
        Student management functionality will be implemented here.
      </p>
    </div>
  );
}

function EnrollStudentDialog({ courseId }: { courseId: number }) {
  return (
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Enroll Student
    </Button>
  );
}

function QuizList({ courseId }: { courseId: number }) {
  return (
    <div className="text-center py-8">
      <PenTool className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">Quiz Management</h3>
      <p className="text-muted-foreground">
        Quiz management functionality will be implemented here.
      </p>
    </div>
  );
}

function QuizDialog({ courseId, modules = [] }: { courseId: number; modules: any[] }) {
  return (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Quiz
    </Button>
  );
}

function CertificatesList({ courseId }: { courseId: number }) {
  return (
    <div className="text-center py-8">
      <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">Certificate Management</h3>
      <p className="text-muted-foreground">
        Certificate management functionality will be implemented here.
      </p>
    </div>
  );
}

function IssueCertificateDialog({ courseId }: { courseId: number }) {
  return (
    <Button>
      <Award className="mr-2 h-4 w-4" />
      Issue Certificate
    </Button>
  );
}

export default CourseDetailPage;