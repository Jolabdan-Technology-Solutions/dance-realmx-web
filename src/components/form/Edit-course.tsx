import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Course, Category, User as UserType } from "@shared/schema";

// Define missing types based on the schema
interface Module {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  order: number;
  lessons?: Lesson[];
  created_at?: string;
  updated_at?: string;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  video_url?: string;
  module_id: number;
  order: number;
  created_at?: string;
  updated_at?: string;
}

interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  issueDate: string;
  status: string;
  verificationCode: string;
  recipient: string;
}

interface Quiz {
  id: number;
  title: string;
  description?: string;
  courseId: number;
  moduleId?: number;
  lessonId?: number;
  passingScore: number;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  options: string[];
  correctAnswer: string;
  order: number;
}

// Define missing types
interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: string;
  progress: number;
  certificateId?: number;
}
import { useToast } from "@/hooks/use-toast";

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

// Type for module form - updated to match DTO
type ModuleFormValues = {
  title: string;
  description: string;
  course_id: number;
  order: number;
};

// Type for lesson form - updated to match DTO
type LessonFormValues = {
  title: string;
  content: string;
  video_url?: string;
  module_id: number;
  order: number;
};

export default function CourseDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const courseId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    queryFn: () =>
      apiRequest<Course>(`/api/courses/${courseId}`, { method: "GET" }),
  });

  // Fetch modules for this course
  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/modules", { courseId }],
    queryFn: () =>
      apiRequest<Module[]>(`/api/courses/${courseId}/modules`, {
        method: "GET",
      }),
  });

  // Fetch categories for the dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery<{
    data: Category[];
  }>({
    queryKey: ["/api/categories"],
    queryFn: () =>
      apiRequest<{ data: Category[] }>("/api/categories", { method: "GET" }),
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
    },
  });

  // Update form with course data when loaded
  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        shortName: course.shortName || "",
        description: course.description || "",
        detailedDescription: "",
        imageUrl: course.imageUrl || "",
        price: course.price?.toString() || "",
        categoryId: course.categoryId,
        difficultyLevel: course.level || "beginner",
        estimatedDuration: course.duration || "",
        visible: course.visible,
        fullVideoUrl: "",
        previewVideoUrl: "",
      });
    }
  }, [course, form]);

  // Update course mutation - fixed to use PUT instead of PATCH
  const updateCourseMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const res = await apiRequest(`/api/courses/${courseId}`, {
        method: "PUT",
        data: values,
      });
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
      const res = await apiRequest(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      return res;
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
    !user?.role.includes("ADMIN")
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
          <TabsTrigger value="curriculum">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="students">Student Management</TabsTrigger>
          <TabsTrigger value="exams">Quiz Management</TabsTrigger>
          <TabsTrigger value="certificates">Certificate Management</TabsTrigger>
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
                            uploadEndpoint="/api/upload"
                            acceptedTypes="image/*"
                            label="Course Image"
                            buttonText="Choose course image"
                            maxSizeMB={5}
                          />
                        </FormControl>
                        {field.value && !field.value.startsWith("data:") && (
                          // <div className="text-sm text-muted-foreground">
                          //   Current URL: {field.value}
                          // </div>

                          <img src={`${field.value}`} />
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
                            field.onChange(parseInt(value) || null)
                          }
                          value={field.value?.toString() || "default"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              categories?.data?.map((category: Category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))
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
                {modules.map((module) => (
                  <ModuleAccordionItem
                    key={module.id}
                    module={module}
                    courseId={courseId}
                  />
                ))}
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
              <IssueCertificateDialog
                courseId={courseId}
                studentId={0}
                studentName=""
              />
            </div>
            <CertificatesList courseId={courseId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Student management components
function StudentsList({ courseId }: { courseId: number }) {
  const { toast } = useToast();

  // Fetch enrollments for this course
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments", { courseId }],
    queryFn: () =>
      apiRequest<Enrollment[]>(`/api/courses/${courseId}/enrollments`, {
        method: "GET",
      }),
  });

  // Fetch user details for each enrolled student
  const { data: students, isLoading: studentsLoading } = useQuery<UserType[]>({
    queryKey: ["/api/students", { courseId }],
    queryFn: () =>
      apiRequest<UserType[]>(`/api/courses/${courseId}/students`, {
        method: "GET",
      }),
    enabled: !!enrollments,
  });

  // Unenroll student mutation
  const unenrollStudentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      const res = await apiRequest(
        `/api/courses/${courseId}/enrollments/${enrollmentId}`,
        { method: "DELETE" }
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", { courseId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/students", { courseId }],
      });
      toast({
        title: "Student Unenrolled",
        description: "The student has been removed from this course.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Unenrolling Student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create avatar fallback from name
  const getAvatarFallback = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };

  if (isLoading || studentsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Students Enrolled</h3>
        <p className="text-muted-foreground mb-4">
          Start enrolling students in your course.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Enrolled On</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Certificate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students?.map((student, index) => {
              const enrollment = enrollments.find(
                (e) => e.userId === student.id
              );
              if (!enrollment) return null;

              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.profileImageUrl || ""} />
                        <AvatarFallback>
                          {getAvatarFallback(
                            student.firstName + " " + student.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolledAt || "").toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-24">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-xs">
                        {enrollment.progress || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {enrollment.certificateId ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Certified
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200"
                      >
                        Not Issued
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Contact Student</DialogTitle>
                            <DialogDescription>
                              Send a message to {student.firstName}{" "}
                              {student.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <form className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Subject
                                </label>
                                <Input placeholder="Course update notification" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Message
                                </label>
                                <Textarea
                                  placeholder="Write your message here..."
                                  className="min-h-32"
                                />
                              </div>
                            </form>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button>Send Message</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {!enrollment.certificateId &&
                        enrollment.progress &&
                        enrollment.progress >= 90 && (
                          <IssueCertificateDialog
                            courseId={courseId}
                            studentId={student.id}
                            studentName={`${student.firstName} ${student.lastName}`}
                          >
                            <Button variant="outline" size="sm">
                              <Award className="h-4 w-4 mr-1" />
                              Issue Certificate
                            </Button>
                          </IssueCertificateDialog>
                        )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <UserMinus className="h-4 w-4 mr-1" />
                            Unenroll
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Unenroll Student</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to unenroll{" "}
                              {student.firstName} {student.lastName} from this
                              course? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                unenrollStudentMutation.mutate(enrollment.id)
                              }
                              disabled={unenrollStudentMutation.isPending}
                            >
                              {unenrollStudentMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Unenrolling...
                                </>
                              ) : (
                                "Unenroll Student"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Component for enrolling new students
function EnrollStudentDialog({ courseId }: { courseId: number }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  // Search students
  const { data: searchResults, isLoading: searchLoading } = useQuery<
    UserType[]
  >({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}&role=student`
      );
      if (!res.ok) throw new Error("Failed to search users");
      return res.json();
    },
    enabled: searchQuery.length >= 3,
  });

  // Enroll student mutation
  const enrollStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const data = { userId: studentId, courseId };
      const res = await apiRequest("POST", "/api/enrollments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", { courseId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/students", { courseId }],
      });
      toast({
        title: "Student Enrolled",
        description:
          "The student has been successfully enrolled in this course.",
      });
      setSearchQuery("");
      setSelectedStudentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Enrolling Student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get avatar fallback
  const getAvatarFallback = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };

  const handleEnroll = () => {
    if (selectedStudentId) {
      enrollStudentMutation.mutate(selectedStudentId);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Enroll Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll New Student</DialogTitle>
          <DialogDescription>
            Search for a student by name or email to enroll in this course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {searchQuery.length < 3 && (
            <p className="text-sm text-muted-foreground">
              Type at least 3 characters to search
            </p>
          )}

          {searchLoading && searchQuery.length >= 3 && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {searchResults &&
            searchResults.length === 0 &&
            searchQuery.length >= 3 &&
            !searchLoading && (
              <p className="text-sm text-muted-foreground py-2">
                No students found matching "{searchQuery}"
              </p>
            )}

          {searchResults && searchResults.length > 0 && (
            <div className="border rounded-md max-h-60 overflow-auto">
              <ScrollArea className="h-full">
                <div className="p-1">
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${
                        selectedStudentId === student.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.profileImageUrl || ""} />
                        <AvatarFallback>
                          {getAvatarFallback(
                            student.firstName + " " + student.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                      {selectedStudentId === student.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleEnroll}
            disabled={!selectedStudentId || enrollStudentMutation.isPending}
          >
            {enrollStudentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              "Enroll Student"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Certificate management components
function CertificatesList({ courseId }: { courseId: number }) {
  const { toast } = useToast();

  // Fetch certificates for this course using the fixed direct endpoint
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/direct/certificates/course", courseId],
    queryFn: () =>
      apiRequest<Certificate[]>(`/api/courses/${courseId}/certificates`, {
        method: "GET",
      }),
  });

  // Fetch enrolled students for this course who don't have certificates yet
  const { data: eligibleStudents, isLoading: studentsLoading } = useQuery<
    {
      id: number;
      name: string;
      email: string;
      enrollmentId: number;
      progress: number;
    }[]
  >({
    queryKey: ["/api/students/eligible-for-certificates", { courseId }],
    queryFn: () =>
      apiRequest(
        `/api/courses/${courseId}/students/eligible-for-certificates`,
        {
          method: "GET",
        }
      ),
  });

  // Revoke certificate mutation
  const revokeCertificateMutation = useMutation({
    mutationFn: async (certificateId: number) => {
      const res = await apiRequest(`/api/certificates/${certificateId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/direct/certificates/course", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/students/eligible-for-certificates", { courseId }],
      });
      toast({
        title: "Certificate Revoked",
        description: "The certificate has been revoked successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Revoking Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Certificates Issued</h3>
        <p className="text-muted-foreground mb-4">
          Issue certificates to students who have completed the course.
        </p>
        {eligibleStudents && eligibleStudents.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium mb-3">
              Students Eligible for Certification:
            </h4>
            <div className="flex flex-col gap-2 max-w-md mx-auto">
              {eligibleStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between bg-muted p-3 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {student.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.progress}% completed
                      </p>
                    </div>
                  </div>
                  <IssueCertificateDialog
                    courseId={courseId}
                    studentId={student.id}
                    studentName={student.name}
                  >
                    <Button size="sm" variant="outline">
                      <Award className="h-4 w-4 mr-1" />
                      Issue
                    </Button>
                  </IssueCertificateDialog>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Certificate ID</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((certificate, index) => (
              <TableRow key={certificate.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>ST</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">Student #{certificate.userId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {certificate.id}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(certificate.issueDate || "").toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`/api/certificates/${certificate.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>

                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`/api/certificates/${certificate.id}/verify`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Verify
                      </a>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Revoke Certificate</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to revoke this certificate?
                            This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              revokeCertificateMutation.mutate(certificate.id)
                            }
                            disabled={revokeCertificateMutation.isPending}
                          >
                            {revokeCertificateMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Revoking...
                              </>
                            ) : (
                              "Revoke Certificate"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {eligibleStudents && eligibleStudents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">
            Students Eligible for Certification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibleStudents.map((student) => (
              <Card key={student.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {student.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-base">
                        {student.name}
                      </CardTitle>
                    </div>
                    <Badge className="ml-2">{student.progress}%</Badge>
                  </div>
                  <CardDescription className="text-xs truncate">
                    {student.email}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <IssueCertificateDialog
                    courseId={courseId}
                    studentId={student.id}
                    studentName={student.name}
                  >
                    <Button size="sm" className="w-full">
                      <Award className="h-4 w-4 mr-1" />
                      Issue Certificate
                    </Button>
                  </IssueCertificateDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Dialog for issuing certificates
function IssueCertificateDialog({
  courseId,
  studentId,
  studentName,
  children,
}: {
  courseId: number;
  studentId: number;
  studentName: string;
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );

  // Fetch course data to display course name
  const { data: course } = useQuery({
    queryKey: ["/api/courses", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`);
      return res.json();
    },
  });

  // Fetch certificate templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/certificate-templates"],
    queryFn: async () => {
      const res = await fetch("/api/certificate-templates");
      return res.json();
    },
  });

  // Fetch default template
  const { data: defaultTemplate } = useQuery({
    queryKey: ["/api/certificate-templates/default"],
    queryFn: async () => {
      const res = await fetch("/api/certificate-templates/default");
      if (res.status === 404) {
        return null;
      }
      return res.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 404
      if (error.status === 404) return false;
      return failureCount < 3;
    },
  });

  // Set the default template when data is loaded
  useEffect(() => {
    if (defaultTemplate && !selectedTemplateId) {
      setSelectedTemplateId(defaultTemplate.id);
    } else if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [defaultTemplate, templates, selectedTemplateId]);

  // Issue certificate mutation
  const issueCertificateMutation = useMutation({
    mutationFn: async () => {
      const data = {
        courseId,
        userId: studentId,
        certificateId: `CERT-${courseId}-${studentId}-${Date.now().toString(36).toUpperCase()}`,
        templateId: selectedTemplateId,
      };
      const res = await apiRequest("POST", "/api/certificates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/certificates", { courseId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/students/eligible-for-certificates", { courseId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", { courseId }],
      });
      toast({
        title: "Certificate Issued",
        description: "The certificate has been issued successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Issuing Certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Find the selected template
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Prepare preview HTML if a template is selected
  const previewHtml = selectedTemplate
    ? selectedTemplate.htmlContent
        .replace(/{{student_name}}/g, studentName)
        .replace(/{{course_name}}/g, course?.title || `Course #${courseId}`)
        .replace(/{{completion_date}}/g, new Date().toLocaleDateString())
        .replace(/{{instructor_name}}/g, "Instructor") // Could fetch instructor name if needed
    : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Award className="mr-2 h-4 w-4" />
            Issue Certificate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Issue Certificate</DialogTitle>
          <DialogDescription>
            Issue a certificate of completion to {studentName} for this course.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="mb-4">
            <Label htmlFor="certificate-template">Certificate Template</Label>
            <Select
              value={selectedTemplateId?.toString() || ""}
              onValueChange={(value) => setSelectedTemplateId(parseInt(value))}
              disabled={templatesLoading || templates.length === 0}
            >
              <SelectTrigger id="certificate-template" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : templates.length > 0 ? (
                  templates.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id.toString()}
                    >
                      {template.name} {template.isDefault && "(Default)"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No templates available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {templates.length === 0 && !templatesLoading && (
              <p className="text-sm text-muted-foreground mt-2">
                No certificate templates found.{" "}
                <a
                  href="/certificate-templates"
                  className="text-primary underline"
                >
                  Create one
                </a>{" "}
                before issuing certificates.
              </p>
            )}
          </div>

          {previewHtml && (
            <div>
              <Label>Certificate Preview</Label>
              <div className="border rounded-md mt-2 overflow-hidden bg-white">
                <iframe
                  srcDoc={previewHtml}
                  style={{ width: "100%", height: "400px", border: "none" }}
                  title="Certificate Preview"
                />
              </div>
            </div>
          )}

          {!previewHtml && !templatesLoading && templates.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50 text-center space-y-2">
              <Award className="h-10 w-10 mx-auto text-primary mb-2" />
              <h3 className="font-bold text-lg">Certificate of Completion</h3>
              <p className="text-sm font-medium">This certifies that</p>
              <p className="text-lg font-semibold">{studentName}</p>
              <p className="text-sm">has successfully completed the course</p>
              <p className="text-base italic font-medium">
                "{course?.title || `Course #${courseId}`}"
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Issued on {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="w-full flex justify-between items-center">
            <Link
              href="/certificate-templates"
              className="text-sm text-primary hover:underline flex items-center"
              target="_blank"
            >
              <FileText className="h-4 w-4 mr-1" />
              Manage Templates
            </Link>
            <div className="space-x-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => issueCertificateMutation.mutate()}
                disabled={
                  issueCertificateMutation.isPending ||
                  !selectedTemplateId ||
                  templates.length === 0
                }
              >
                {issueCertificateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    Issue Certificate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quiz management components
function QuizList({ courseId }: { courseId: number }) {
  const { toast } = useToast();

  // Fetch quizzes for this course
  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes", { courseId }],
    queryFn: () =>
      apiRequest<Quiz[]>(`/api/courses/${courseId}/quizzes`, {
        method: "GET",
      }),
  });

  // Fetch modules for lesson association
  const { data: modules } = useQuery<Module[]>({
    queryKey: ["/api/modules", { courseId }],
    queryFn: () =>
      apiRequest<Module[]>(`/api/courses/${courseId}/modules`, {
        method: "GET",
      }),
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: number) => {
      const res = await apiRequest(
        `/api/courses/${courseId}/quizzes/${quizId}`,
        { method: "DELETE" }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/quizzes", { courseId }],
      });
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get module name by ID
  const getModuleName = (moduleId: number | null) => {
    if (!moduleId || !modules) return "None";
    const module = modules.find((m) => m.id === moduleId);
    return module ? module.title : "Unknown Module";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <PenTool className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Quizzes Created</h3>
        <p className="text-muted-foreground mb-4">
          Create quizzes to assess student knowledge and provide interactive
          learning.
        </p>
        <QuizDialog courseId={courseId} modules={modules || []}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create First Quiz
          </Button>
        </QuizDialog>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <Badge
                  variant={quiz.passingScore >= 80 ? "destructive" : "default"}
                >
                  {quiz.passingScore || 70}% to pass
                </Badge>
              </div>
              <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Associated Module:
                  </span>
                  <span className="font-medium">
                    {getModuleName(quiz.moduleId)}
                  </span>
                </div>
                {quiz.lessonId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Associated Lesson:
                    </span>
                    <span className="font-medium">Lesson #{quiz.lessonId}</span>
                  </div>
                )}
                <QuizQuestionsList quizId={quiz.id} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/quizzes/${quiz.id}/results`}>
                  <Server className="h-4 w-4 mr-1" />
                  View Results
                </Link>
              </Button>
              <div className="flex gap-2">
                <QuizDialog
                  courseId={courseId}
                  modules={modules || []}
                  quizId={quiz.id}
                  existingQuiz={quiz}
                >
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </QuizDialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Quiz</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this quiz and all its
                        questions? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => deleteQuizMutation.mutate(quiz.id)}
                        disabled={deleteQuizMutation.isPending}
                      >
                        {deleteQuizMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Quiz"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Quiz question list component
function QuizQuestionsList({ quizId }: { quizId: number }) {
  // Fetch quiz questions
  const { data: questions, isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quiz-questions", { quizId }],
    queryFn: () =>
      apiRequest<QuizQuestion[]>(`/api/quizzes/${quizId}/questions`, {
        method: "GET",
      }),
  });

  if (isLoading) {
    return (
      <div className="py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="py-2 text-muted-foreground text-sm italic">
        No questions added yet
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-sm font-medium mb-2">
        Questions ({questions.length}):
      </p>
      <div className="space-y-1">
        {questions.slice(0, 3).map((question, index) => (
          <div
            key={question.id}
            className="text-xs text-muted-foreground truncate"
          >
            {index + 1}. {question.question}
          </div>
        ))}
        {questions.length > 3 && (
          <div className="text-xs text-muted-foreground">
            + {questions.length - 3} more questions
          </div>
        )}
      </div>
    </div>
  );
}

// Dialog for creating/editing quizzes
function QuizDialog({
  courseId,
  modules,
  quizId,
  existingQuiz,
  children,
}: {
  courseId: number;
  modules: Module[];
  quizId?: number;
  existingQuiz?: Quiz;
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const isEditing = !!quizId;
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(
    existingQuiz?.moduleId || null
  );
  const [questions, setQuestions] = useState<
    {
      id?: number;
      question: string;
      options: string[];
      correctAnswer: string;
      type: string;
      orderIndex: number;
      isNew?: boolean;
    }[]
  >([]);

  // Load questions if editing
  const { data: existingQuestions } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quiz-questions", { quizId }],
    queryFn: async () => {
      if (!quizId) return [];
      const res = await fetch(`/api/quiz-questions?quizId=${quizId}`);
      if (!res.ok) throw new Error("Failed to fetch quiz questions");
      return res.json();
    },
    enabled: !!quizId,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setQuestions(
          data.map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            type: q.type,
            orderIndex: q.orderIndex,
          }))
        );
      }
    },
  });

  // Fetch lessons for selected module
  const { data: moduleCustomLessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons", { moduleId: selectedModuleId }],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const res = await fetch(`/api/lessons?moduleId=${selectedModuleId}`);
      if (!res.ok) throw new Error("Failed to fetch lessons");
      return res.json();
    },
    enabled: !!selectedModuleId,
  });

  // Form for quiz creation/editing
  const form = useForm<{
    title: string;
    description: string | null;
    moduleId: string | null;
    lessonId: string | null;
    passingScore: number;
  }>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        description: z.string().nullable(),
        moduleId: z.string().nullable(),
        lessonId: z.string().nullable(),
        passingScore: z.number().min(0).max(100),
      })
    ),
    defaultValues: {
      title: existingQuiz?.title || "",
      description: existingQuiz?.description || "",
      moduleId: existingQuiz?.moduleId?.toString() || null,
      lessonId: existingQuiz?.lessonId?.toString() || null,
      passingScore: existingQuiz?.passingScore || 70,
    },
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (values: {
      quiz: {
        title: string;
        description: string | null;
        moduleId: number | null;
        lessonId: number | null;
        passingScore: number;
      };
      questions: {
        id?: number;
        question: string;
        options: string[];
        correctAnswer: string;
        type: string;
        orderIndex: number;
      }[];
    }) => {
      // Check if we have a lessonId for lesson-specific quiz creation
      if (values.quiz.lessonId) {
        // Use the new lesson-specific quiz endpoint
        const transformedQuestions = values.questions.map(
          (question, index) => ({
            text: question.question,
            options: question.options.map((option, optionIndex) => ({
              text: option,
              is_correct: option === question.correctAnswer,
            })),
            answer: question.options.findIndex(
              (opt) => opt === question.correctAnswer
            ),
            order: index,
          })
        );

        const quizData = {
          title: values.quiz.title,
          questions: transformedQuestions,
        };

        const quizRes = await apiRequest(
          `/api/lessons/${values.quiz.lessonId}/quizzes`,
          {
            method: "POST",
            data: quizData,
          }
        );
        return await quizRes.json();
      } else {
        // Fallback to the old course-level quiz creation for backward compatibility
        const quizRes = await apiRequest(`/api/courses/${courseId}/quizzes`, {
          method: "POST",
          data: values.quiz,
        });
        const createdQuiz = await quizRes.json();

        // Then create all questions
        const questionPromises = values.questions.map((question, index) => {
          return apiRequest(`/api/quizzes/${createdQuiz.id}/questions`, {
            method: "POST",
            data: {
              ...question,
              orderIndex: index,
            },
          });
        });

        await Promise.all(questionPromises);
        return createdQuiz;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/quizzes", { courseId }],
      });
      form.reset();
      setQuestions([]);
      toast({
        title: "Quiz Created",
        description: "Your quiz has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: async (values: {
      quiz: {
        title: string;
        description: string | null;
        moduleId: number | null;
        lessonId: number | null;
        passingScore: number;
      };
      questions: {
        id?: number;
        question: string;
        options: string[];
        correctAnswer: string;
        type: string;
        orderIndex: number;
        isNew?: boolean;
      }[];
    }) => {
      // Update the quiz
      const quizRes = await apiRequest(`/api/quizzes/${quizId}`, {
        method: "PUT",
        data: values.quiz,
      });
      await quizRes.json();

      // Handle questions - create new ones, update existing ones
      const questionPromises = values.questions.map((question, index) => {
        // New question
        if (!question.id || question.isNew) {
          return apiRequest(`/api/quizzes/${quizId}/questions`, {
            method: "POST",
            data: {
              ...question,
              orderIndex: index,
            },
          });
        }

        // Existing question to update
        return apiRequest(`/api/quiz-questions/${question.id}`, {
          method: "PUT",
          data: {
            ...question,
            orderIndex: index,
          },
        });
      });

      await Promise.all(questionPromises);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/quizzes", { courseId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quiz-questions", { quizId }],
      });
      toast({
        title: "Quiz Updated",
        description: "Your quiz has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add a new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        type: "multiple_choice",
        orderIndex: questions.length,
        isNew: true,
      },
    ]);
  };

  // Update a question
  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // Update an option in a question
  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = value;
    newQuestions[questionIndex].options = newOptions;
    setQuestions(newQuestions);
  };

  // Remove a question
  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  // Form submission handler
  const onSubmit = (values: any) => {
    // Validate questions
    if (questions.length === 0) {
      toast({
        title: "No Questions Added",
        description: "Please add at least one question to the quiz.",
        variant: "destructive",
      });
      return;
    }

    // Check if all questions have content
    const invalidQuestions = questions.filter(
      (q) => !q.question || !q.correctAnswer
    );
    if (invalidQuestions.length > 0) {
      toast({
        title: "Invalid Questions",
        description:
          "Please ensure all questions have both a question and a correct answer.",
        variant: "destructive",
      });
      return;
    }

    const quizData = {
      quiz: {
        title: values.title,
        description: values.description,
        moduleId: values.moduleId ? parseInt(values.moduleId) : null,
        lessonId: values.lessonId ? parseInt(values.lessonId) : null,
        passingScore: values.passingScore,
      },
      questions,
    };

    if (isEditing) {
      updateQuizMutation.mutate(quizData);
    } else {
      createQuizMutation.mutate(quizData);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {isEditing ? "Edit Quiz" : "Add Quiz"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Quiz" : "Create New Quiz"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update quiz details and questions."
              : "Create a new quiz to assess student knowledge."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Module 1 Assessment"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this quiz"
                      {...field}
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Module (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedModuleId(value ? parseInt(value) : null);
                        form.setValue("lessonId", null);
                      }}
                      value={field.value || "default"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {modules.map((module) => (
                          <SelectItem
                            key={module.id}
                            value={module.id.toString()}
                          >
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lessonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Lesson (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "default"}
                      disabled={
                        !selectedModuleId ||
                        !moduleCustomLessons ||
                        moduleCustomLessons.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lesson" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {moduleCustomLessons?.map((lesson) => (
                          <SelectItem
                            key={lesson.id}
                            value={lesson.id.toString()}
                          >
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Questions</h3>
                <Button type="button" variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    No questions added yet. Click "Add Question" to begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Question {qIndex + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Question
                          </label>
                          <Textarea
                            value={question.question}
                            onChange={(e) =>
                              updateQuestion(qIndex, "question", e.target.value)
                            }
                            placeholder="Enter your question here"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Type</label>
                          <Select
                            value={question.type}
                            onValueChange={(value) =>
                              updateQuestion(qIndex, "type", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="true_false">
                                True/False
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {question.type === "multiple_choice" && (
                          <div className="space-y-3">
                            <label className="text-sm font-medium">
                              Options
                            </label>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(qIndex, oIndex, e.target.value)
                                  }
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Correct Answer
                          </label>
                          {question.type === "multiple_choice" ? (
                            <Select
                              value={question.correctAnswer}
                              onValueChange={(value) =>
                                updateQuestion(qIndex, "correctAnswer", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                              <SelectContent>
                                {question.options.map((option, oIndex) => (
                                  <SelectItem
                                    key={oIndex}
                                    value={option || `option_${oIndex + 1}`}
                                  >
                                    {option || `Option ${oIndex + 1}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select
                              value={question.correctAnswer}
                              onValueChange={(value) =>
                                updateQuestion(qIndex, "correctAnswer", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  createQuizMutation.isPending || updateQuizMutation.isPending
                }
              >
                {createQuizMutation.isPending ||
                updateQuizMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Quiz"
                ) : (
                  "Create Quiz"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Module Dialog for Creating/Editing
function ModuleDialog({
  courseId,
  moduleId,
  existingModule,
  children,
}: {
  courseId: number;
  moduleId?: number;
  existingModule?: Module;
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
        description: z.string().nullable(),
        course_id: z.number().int().min(1),
        order: z.number().int().min(0),
      })
    ),
    defaultValues: {
      title: existingModule?.title || "",
      description: existingModule?.description || "",
      course_id: existingModule?.courseId || courseId || 0,
      order: existingModule?.orderIndex || 0,
    },
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (values: ModuleFormValues) => {
      const res = await apiRequest(`/api/courses/${courseId}/modules`, {
        method: "POST",
        data: values,
      });
      return res.json();
    },
    onSuccess: () => {
      // Immediate query invalidation for instant UI refresh
      queryClient.invalidateQueries({
        queryKey: ["/api/modules", { courseId }],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });

      // Secondary delayed refresh to ensure UI updates even with network latency
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/modules", { courseId }],
        });
      }, 500);

      form.reset({ title: "", description: "", course_id: 0, order: 0 });
      toast({
        title: "Module Created",
        description: "Your new module has been added to the course.",
      });
      // Close the dialog after successful creation
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
      const res = await apiRequest(`/api/modules/${moduleId}`, {
        method: "PUT",
        data: values,
      });
      return res.json();
    },
    onSuccess: () => {
      // Immediate query invalidation for instant UI refresh
      queryClient.invalidateQueries({
        queryKey: ["/api/modules", { courseId }],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });

      // Also invalidate any lessons within this module
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });

      // Secondary delayed refresh to ensure UI updates even with network latency
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/modules", { courseId }],
        });
      }, 500);

      toast({
        title: "Module Updated",
        description: "Your module has been updated successfully.",
      });
      // Close the dialog after successful update
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children || (
          <Button>
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this module"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        // Sanitize HTML content before setting
                        const sanitizedValue = e.target.value.replace(
                          /(<([^>]+)>)/gi,
                          ""
                        );
                        field.onChange(sanitizedValue);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Plain text only - HTML tags are not supported
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    The ID of the course this module belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="order"
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
                    The order in which this module appears (0 = first)
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
        video_url: z.string().nullable(),
        module_id: z.number().int().min(1),
        order: z.number().int().min(0),
      })
    ),
    defaultValues: {
      title: existingLesson?.title || "",
      content: existingLesson?.content || "",
      video_url: existingLesson?.video_url || "",
      module_id: existingLesson?.module_id || moduleId,
      order: existingLesson?.order || 0,
    },
  });

  // Update form when dialog opens to ensure module_id is set correctly
  useEffect(() => {
    if (open && !isEditing) {
      form.setValue("module_id", moduleId);
    }
  }, [open, moduleId, isEditing, form]);

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (values: LessonFormValues) => {
      const res = await apiRequest(`/api/courses/modules/${moduleId}/lessons`, {
        method: "POST",
        data: values,
      });
      return res;
    },
    onSuccess: (data) => {
      // Refresh modules to update the nested lessons data
      queryClient.invalidateQueries({
        queryKey: ["/api/modules", { courseId: moduleId }],
      });

      // Also invalidate the main modules query
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });

      // Manual refresh attempt to ensure UI is updated
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/modules", { courseId: moduleId }],
        });
      }, 500);

      form.reset({
        title: "",
        content: "",
        video_url: "",
        module_id: 0,
        order: 0,
      });
      toast({
        title: "Lesson Created",
        description: "Your new lesson has been added to the module.",
      });
      // Close the dialog after successful creation
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
      const res = await apiRequest(`/api/lessons/${lessonId}`, {
        method: "PUT",
        data: values,
      });
      return res.json();
    },
    onSuccess: () => {
      // Refresh modules to update the nested lessons data
      queryClient.invalidateQueries({
        queryKey: ["/api/modules", { courseId: moduleId }],
      });

      // Also invalidate the main modules query
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });

      // Secondary delayed invalidation to ensure UI updates even with network latency
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/modules", { courseId: moduleId }],
        });
      }, 500);

      toast({
        title: "Lesson Updated",
        description: "Your lesson has been updated successfully.",
      });
      // Close the dialog after successful update
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children || (
          <Button size="sm" variant="outline">
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
                      onChange={(e) => {
                        // Sanitize HTML content before setting
                        const sanitizedValue = e.target.value.replace(
                          /(<([^>]+)>)/gi,
                          ""
                        );
                        field.onChange(sanitizedValue);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Plain text only - HTML tags are not supported
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the URL of the video for this lesson
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden field for module_id - automatically set */}
            <FormField
              control={form.control}
              name="module_id"
              render={({ field }) => <input type="hidden" {...field} />}
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

// Accordion Item for a Module
function ModuleAccordionItem({
  module,
  courseId,
}: {
  module: Module;
  courseId: number;
}) {
  const { toast } = useToast();

  // Use lessons from the module data (nested in the API response)
  const lessons = module.lessons || [];
  const lessonsLoading = false; // No separate loading state needed since lessons come with modules

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/modules/${module.id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/modules", { courseId }],
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
        <div className="flex items-center gap-2">
          <ModuleDialog
            courseId={courseId}
            moduleId={module.id}
            existingModule={module}
          >
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          </ModuleDialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
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
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  moduleId={module.id}
                />
              ))}
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
      const res = await apiRequest(`/api/lessons/${lesson.id}`, {
        method: "DELETE",
      });
      return res;
    },
    onSuccess: () => {
      // Refresh modules to update the nested lessons data
      queryClient.invalidateQueries({
        queryKey: ["/api/modules", { courseId: moduleId }],
      });

      // Also refresh the main modules query
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });

      // Additional delayed refresh to handle any network latency
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/modules", { courseId: moduleId }],
        });
      }, 500);

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
          {lesson.video_url && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <FileDown className="h-3 w-3 mr-1" />
              Has video
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <LessonQuizDialog lessonId={lesson.id} lessonTitle={lesson.title}>
            <Button size="sm" variant="outline">
              <PenTool className="h-3 w-3 mr-1" />
              Add Quiz
            </Button>
          </LessonQuizDialog>

          <LessonDialog
            moduleId={moduleId}
            lessonId={lesson.id}
            existingLesson={lesson}
          >
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          </LessonDialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
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
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
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

// Dialog for creating quizzes specifically for lessons
function LessonQuizDialog({
  lessonId,
  lessonTitle,
  children,
}: {
  lessonId: number;
  lessonTitle: string;
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<
    {
      text: string;
      options: { text: string; is_correct: boolean }[];
      answer: number;
      order: number;
    }[]
  >([]);

  // Form for lesson quiz creation
  const form = useForm<{
    title: string;
  }>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
      })
    ),
    defaultValues: {
      title: `Quiz for ${lessonTitle}`,
    },
  });

  // Create lesson quiz mutation
  const createLessonQuizMutation = useMutation({
    mutationFn: async (values: {
      title: string;
      questions: {
        text: string;
        options: { text: string; is_correct: boolean }[];
        answer: number;
        order: number;
      }[];
    }) => {
      const quizData = {
        title: values.title,
        questions: values.questions,
      };

      const res = await apiRequest(`/api/lessons/${lessonId}/quizzes`, {
        method: "POST",
        data: quizData,
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["/api/quizzes", { courseId: 0 }], // Will be updated when we know the courseId
      });
      form.reset();
      setQuestions([]);
      toast({
        title: "Quiz Created",
        description: "Your lesson quiz has been created successfully.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add a new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        options: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
        answer: 0,
        order: questions.length,
      },
    ]);
  };

  // Update a question
  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // Update an option in a question
  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };

    // If this option is marked as correct, unmark others
    if (field === "is_correct" && value === true) {
      newOptions.forEach((option, idx) => {
        if (idx !== optionIndex) {
          option.is_correct = false;
        }
      });
      newQuestions[questionIndex].answer = optionIndex;
    }

    newQuestions[questionIndex].options = newOptions;
    setQuestions(newQuestions);
  };

  // Remove a question
  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  // Form submission handler
  const onSubmit = (values: { title: string }) => {
    // Validate questions
    if (questions.length === 0) {
      toast({
        title: "No Questions Added",
        description: "Please add at least one question to the quiz.",
        variant: "destructive",
      });
      return;
    }

    // Check if all questions have content and at least one correct answer
    const invalidQuestions = questions.filter(
      (q) =>
        !q.text ||
        !q.options.some((opt) => opt.is_correct) ||
        q.options.some((opt) => !opt.text)
    );
    if (invalidQuestions.length > 0) {
      toast({
        title: "Invalid Questions",
        description:
          "Please ensure all questions have content, all options have text, and exactly one correct answer.",
        variant: "destructive",
      });
      return;
    }

    createLessonQuizMutation.mutate({
      title: values.title,
      questions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children || (
          <Button>
            <PenTool className="mr-2 h-4 w-4" />
            Add Quiz
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create Lesson Quiz</DialogTitle>
          <DialogDescription>
            Create a quiz specifically for "{lessonTitle}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-2"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lesson Assessment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Questions</h3>
                <Button type="button" variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    No questions added yet. Click "Add Question" to begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Question {qIndex + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Question
                          </label>
                          <Textarea
                            value={question.text}
                            onChange={(e) =>
                              updateQuestion(qIndex, "text", e.target.value)
                            }
                            placeholder="Enter your question here"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium">Options</label>
                          {question.options.map((option, oIndex) => (
                            <div
                              key={oIndex}
                              className="flex gap-2 items-center"
                            >
                              <Input
                                value={option.text}
                                onChange={(e) =>
                                  updateOption(
                                    qIndex,
                                    oIndex,
                                    "text",
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${oIndex + 1}`}
                              />
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={option.is_correct}
                                  onChange={() =>
                                    updateOption(
                                      qIndex,
                                      oIndex,
                                      "is_correct",
                                      true
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                                <label className="text-sm">Correct</label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={createLessonQuizMutation.isPending}
              >
                {createLessonQuizMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Quiz"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
