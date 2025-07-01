
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { 
  Loader2, ArrowLeft, Save, Plus, Trash2, Eye, FileDown, FileUp, 
  BookOpen, CheckCircle, User, UserPlus, Award, Search, UserMinus, 
  FileText, Edit, Download, Gift, Mail, PenTool, Server,
  ChevronDown, ChevronRight, MoreVertical, Clock, Video, Users, Play
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { number, z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogClose 
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Course, Module, Lesson, Category, User as UserType, Enrollment, Certificate, Quiz, QuizQuestion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Type definitions
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

type ModuleFormValues = {
  title: string;
  description: string | null;
  orderIndex: number;
};

type LessonFormValues = {
  title: string;
  content: string;
  videoUrl: string | null;
  orderIndex: number;
};

export default function CourseDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const courseId = useMemo(() => {
    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      toast({
        title: "Invalid Course ID",
        description: "The course ID in the URL is not valid.",
        variant: "destructive",
      });
      return null;
    }
    return id;
  }, [params.id, toast]);
  
  const [activeTab, setActiveTab] = useState("details");
  
  if (courseId === null) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Invalid Course</h1>
        <p className="mb-6">The course ID in the URL is not valid.</p>
        <Link to="/instructor/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    queryFn: async () => {
      try {
        const res = await apiRequest(`/api/courses/${courseId}`, { 
          method: "GET",
          requireAuth: true 
        });
        return res;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        toast({
          title: "Error fetching course",
          description: `Failed to load course: ${errorMessage}`,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: courseId !== null,
  });

  // Fetch modules
  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/modules", { courseId }],
    queryFn: async () => {
      try {
        const res = await apiRequest(`/api/courses/${courseId}/modules`, { 
          method: "GET",
          requireAuth: true 
        });
        return res;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        toast({
          title: "Error fetching modules",
          description: `Failed to load modules: ${errorMessage}`,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: courseId !== null,
  });

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery<{ data: Category[] }>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/categories", { 
          method: "GET",
          requireAuth: true 
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
    enabled: courseId !== null,
  });

  const categories: Category[] = categoriesResponse?.data || [];

  // Course form setup
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        shortName: z.string().min(2, "Short name must be at least 2 characters"),
        description: z.string().min(20, "Description must be at least 20 characters"),
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
  
  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        shortName: course.short_name,
        description: course.description || "",
        detailedDescription: course.detailed_description,
        imageUrl: course.image_url,
        price: course.price,
        categoryId: course.categoryId,
        difficultyLevel: course.difficulty_level,
        estimatedDuration: course.duration,
        visible: course.visible,
        fullVideoUrl: course.video_url || "",
        previewVideoUrl: course.preview_video_url || "",
      });
    }
  }, [course, form]);
  
  // Course mutations
  const updateCourseMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const res = await apiRequest(`/api/courses/${courseId}`, {
        method: "PATCH",
        data: values,
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Updated",
        description: "Your course changes have been saved.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Updating Course",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/courses/${courseId}`, {
        method: "DELETE",
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Deleted",
        description: "Your course has been permanently deleted.",
      });
      window.location.href = "/instructor/dashboard";
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Deleting Course",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: CourseFormValues) => {
    updateCourseMutation.mutate(values);
  };
  
  if (authLoading || courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <h1 className="text-2xl md:text-3xl font-bold truncate">{course?.title || "Loading Course..."}</h1>
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
                  Are you sure you want to delete this course? This action cannot be undone.
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <FormField
                  control={form.control}
                  name="detailedDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-32" {...field} value={field.value || ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {field.value && !field.value.startsWith('data:') && (
                          <img src={field.value} alt="Course" className="w-full h-32 object-cover rounded-md" />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} onChange={field.onChange} />
                        </FormControl>
                        <FormDescription>Leave empty if included with subscription</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value) || null)}
                          value={field.value?.toString() || ""}
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
                            ) : categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
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
                    name="difficultyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                    onClick={form.handleSubmit(onSubmit)}
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
              </div>
            </Form>
          </div>
        </TabsContent>
        
        {/* Curriculum Tab with Module Cards */}
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
              <div className="space-y-4">
                {modules
                  .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                  .map((module) => (
                    <ModuleCard 
                      key={module.id} 
                      module={module} 
                      courseId={courseId} 
                    />
                  ))}
              </div>
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
        
        {/* Other tabs remain as placeholders for now */}
        <TabsContent value="students">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Student Management</h2>
            </div>
            <p className="text-muted-foreground">Students management coming soon...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="exams">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Quiz Management</h2>
            </div>
            <p className="text-muted-foreground">Quiz management coming soon...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="certificates">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Certificate Management</h2>
            </div>
            <p className="text-muted-foreground">Certificate management coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Module Dialog Component
function ModuleDialog({ 
  courseId, 
  moduleId, 
  existingModule, 
  children 
}: { 
  courseId: number; 
  moduleId?: number; 
  existingModule?: Module; 
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const isEditing = !!moduleId;
  const [open, setOpen] = useState(false);
  
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        description: z.string().nullable(),
        orderIndex: z.number().int().min(0),
      })
    ),
    defaultValues: {
      title: existingModule?.title || "",
      description: existingModule?.description || "",
      orderIndex: existingModule?.orderIndex || 0,
    },
  });
  
  const createModuleMutation = useMutation({
    mutationFn: async (values: ModuleFormValues) => {
      const data = { 
        title: values.title.trim(),
        description: values.description?.trim() || null,
        course_id: courseId,
        order: Number(values.orderIndex)  // Ensure it's an integer
      };
      
      const res = await apiRequest(`/api/courses/${courseId}/modules`, {
        method: "POST",
        data: data,
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", { courseId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      
      form.reset({ title: "", description: "", orderIndex: 0 });
      setOpen(false);
      
      toast({
        title: "Success",
        description: "Module created successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Creating Module",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const updateModuleMutation = useMutation({
    mutationFn: async (values: ModuleFormValues) => {
      const res = await apiRequest(`/api/modules/${moduleId}`, {
        method: "PATCH",
        data: values,
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", { courseId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      
      setOpen(false);
      toast({
        title: "Success",
        description: "Module updated successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Updating Module",
        description: errorMessage,
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
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Module" : "Add New Module"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the details of this module." 
              : "Add a new module to organize your course content."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <div className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Introduction to Basics" {...field} />
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
                      onChange={field.onChange}
                    />
                  </FormControl>
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
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
              >
                {(createModuleMutation.isPending || updateModuleMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Module" : "Add Module"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Module Card Component
function ModuleCard({ module, courseId }: { module: Module; courseId: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();

  // Fetch lessons for this module
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons", { moduleId: module.id }],
    queryFn: async () => {
      try {
        const res = await apiRequest(`/api/courses/modules/${module.id}/lessons`, { 
          method: "GET",
          requireAuth: true 
        });
        return res;
      } catch (error: any) {
        // Don't show error toast for 404 - just means no lessons yet
        if (error.response?.status !== 404) {
          const errorMessage = error.response?.data?.message || error.message;
          toast({
            title: "Error fetching lessons",
            description: `Failed to load lessons: ${errorMessage}`,
            variant: "destructive",
          });
        }
        return [];
      }
    },
    enabled: isExpanded,
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/modules/${module.id}`, {
        method: "DELETE",
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", { courseId }] });
      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Deleting Module",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const totalLessons = lessons?.length || 0;
  const totalDuration = lessons?.reduce((acc, lesson) => {
    const duration = lesson.duration ? parseInt(lesson.duration) : 0;
    return acc + duration;
  }, 0) || 0;

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${module.title}"? This action cannot be undone.`)) {
      deleteModuleMutation.mutate();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
      {/* Module Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors mr-3"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  {(module.orderIndex || 0) + 1}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {module.title}
                </h3>
              </div>
              
              {module.description && (
                <p className="text-sm text-gray-600 line-clamp-2 ml-9">
                  {module.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 ml-9">
                <div className="flex items-center text-xs text-gray-500">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {totalDuration} min
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <LessonDialog moduleId={module.id} onLessonCreated={() => setIsExpanded(true)}>
              <Button
                size="sm"
                className="text-xs px-3 py-1.5"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Lesson
              </Button>
            </LessonDialog>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="p-1.5"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <ModuleDialog courseId={courseId} moduleId={module.id} existingModule={module}>
                    <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Module
                    </button>
                  </ModuleDialog>
                  <button
                    onClick={handleDelete}
                    disabled={deleteModuleMutation.isPending}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Module
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content - Enhanced Lessons Display */}
      {isExpanded && (
        <div className="bg-gray-50/30">
          {lessonsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Loading lessons...</p>
            </div>
          ) : totalLessons > 0 ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  {totalLessons} Lesson{totalLessons !== 1 ? 's' : ''} 
                  {totalDuration > 0 && ` • ${totalDuration} min total`}
                </h4>
                <LessonDialog moduleId={module.id} onLessonCreated={() => setIsExpanded(true)}>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Lesson
                  </Button>
                </LessonDialog>
              </div>
              
              <div className="space-y-3">
                {lessons
                  ?.sort((a, b) => (a.orderIndex || a.order || 0) - (b.orderIndex || b.order || 0))
                  .map((lesson, index) => (
                    <LessonCard 
                      key={lesson.id} 
                      lesson={lesson} 
                      index={index} 
                      moduleId={module.id} 
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h4>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Start building your module by adding lessons. Each lesson can include text content, videos, and other learning materials.
                </p>
                <LessonDialog moduleId={module.id} onLessonCreated={() => setIsExpanded(true)}>
                  <Button className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Lesson
                  </Button>
                </LessonDialog>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified Lesson Card Component - only name and description
function LessonCard({ lesson, index, moduleId }: { lesson: Lesson; index: number; moduleId: number }) {
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();

  const deleteLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/lessons/${lesson.id}`, {
        method: "DELETE",
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", { moduleId }] });
      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Deleting Lesson",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`)) {
      deleteLessonMutation.mutate();
    }
  };

  // Handle different content field names from backend
  const lessonContent = lesson.content || lesson.description || '';
  const orderIndex = lesson.orderIndex ?? lesson.order ?? index;

  return (
    <div className="border-l-4 border-blue-200 bg-white hover:bg-gray-50/50 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1 min-w-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-4 mt-1">
              {orderIndex + 1}
            </span>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-gray-900 mb-2">
                {lesson.title}
              </h4>
              
              {lessonContent && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {lessonContent}
                </p>
              )}
            </div>
          </div>

          <div className="relative ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 h-auto"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                <LessonDialog moduleId={moduleId} lessonId={lesson.id} existingLesson={lesson}>
                  <button 
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowActions(false)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Lesson
                  </button>
                </LessonDialog>
                
                <button
                  onClick={() => {
                    handleDelete();
                    setShowActions(false);
                  }}
                  disabled={deleteLessonMutation.isPending}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Lesson
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Lesson Dialog Component
function LessonDialog({ 
  moduleId, 
  lessonId, 
  existingLesson, 
  children,
  onLessonCreated
}: { 
  moduleId: number; 
  lessonId?: number; 
  existingLesson?: Lesson; 
  children?: React.ReactNode;
  onLessonCreated?: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!lessonId;
  const [open, setOpen] = useState(false);
  
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        content: z.string().min(1, "Content is required"),
        videoUrl: z.string().nullable(),
        orderIndex: z.number().int().min(0),
      })
    ),
    defaultValues: {
      title: existingLesson?.title || "",
      content: existingLesson?.content || "",
      videoUrl: existingLesson?.videoUrl || "",
      orderIndex: existingLesson?.orderIndex || 0,
    },
  });

  // Update form defaults when dialog opens for new lessons
  useEffect(() => {
    if (open && !isEditing) {
      // Auto-set order index for new lessons
      form.setValue('orderIndex', 0); // You can make this dynamic based on existing lessons
    }
  }, [open, isEditing, form]);
  
  const createLessonMutation = useMutation({
    mutationFn: async (values: LessonFormValues) => {
      // Map to match your CreateLessonDto
      const data = { 
        title: values.title.trim(),
        content: values.content?.trim() || "",
        videoUrl: values.videoUrl?.trim() || undefined,
        module_id: Number(moduleId),  // Fixed: use "module_id" not "moduleId"
        order: Number(values.orderIndex)
      };
      
      const res = await apiRequest(`/api/courses/modules/${moduleId}/lessons`, {
        method: "POST",
        data: data,
        requireAuth: true,
      });
      return res;
    },
    onSuccess: (newLesson) => {
      // Invalidate lessons query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", { moduleId }] });
      
      // Also invalidate modules query to update lesson counts
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      
      // Reset form and close dialog
      form.reset({ 
        title: "", 
        content: "", 
        videoUrl: "", 
        orderIndex: 0
      });
      setOpen(false);
      
      // Expand module to show the new lesson
      onLessonCreated?.();
      
      toast({
        title: "Success! 🎉",
        description: `"${newLesson?.title || 'Lesson'}" has been created successfully.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Creating Lesson",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const updateLessonMutation = useMutation({
    mutationFn: async (values: LessonFormValues) => {
      const res = await apiRequest(`/api/lessons/${lessonId}`, {
        method: "PATCH",
        data: values,
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", { moduleId }] });
      
      setOpen(false);
      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast({
        title: "Error Updating Lesson",
        description: errorMessage,
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
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the details of this lesson." 
              : "Add a new lesson to this module."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <div className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Introduction to Variables" {...field} />
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
                      placeholder="Lesson content or description" 
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
                  <FormLabel>Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.youtube.com/watch?v=..." 
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
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
              >
                {(createLessonMutation.isPending || updateLessonMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Lesson" : "Add Lesson"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}