import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { convertToYouTubeEmbedUrl } from "../../lib/utils";
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
  Category,
  courses,
  insertCourseSchema,
} from "../../../../shared/schema";
import { useToast } from "../../hooks/use-toast";

// Define the expected response type for course creation
type CourseCreateResponse = {
  id: number;
  // add other fields if needed
};

// Create a proper form schema that matches your form fields
const createCourseFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  shortName: z.string().min(2, "Short name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  detailedDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.string().optional(),
  categoryId: z
    .number()
    .optional()
    .refine((val) => typeof val === "number", {
      message: "Please select a category",
    }),
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
  level?: string;
  duration?: string;
  visible?: boolean;
  preview_video_url?: string;
  full_video_url?: string;
};

export default function CourseCreatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch categories for the dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["/api/categories"],
  });

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
    if (user) {
      form.setValue("instructorId", user?.id);
    }
  }, [user, form]);

  // Create new course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (values: CreateCourseApiRequest) => {
      const res = await apiRequest("POST", "/api/courses", values);
      return res.json() as Promise<CourseCreateResponse>;
    },
    onSuccess: (data: CourseCreateResponse) => {
      // Invalidate courses cache
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

      toast({
        title: "Course Created",
        description: "Your new course has been created successfully.",
      });

      // Navigate to the course edit page
      navigate(`/instructor/courses/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: CourseFormFields) => {
    console.log("Form values:", values);

    // Validate that category exists if categoryId is provided
    if (values.categoryId && categories) {
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
      description: values.description,
      detailed_description: values.detailedDescription,
      image_url: values.imageUrl,
      price: values.price,
      category_id: values.categoryId,
      instructor_id: values.instructorId,
      level: values.difficultyLevel,
      duration: values.estimatedDuration,
      visible: values.visible,
      preview_video_url: values.previewVideoUrl,
      full_video_url: values.fullVideoUrl,
    };

    createCourseMutation.mutate(transformedValues);
  };

  // Handle loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link to="/instructor/dashboard">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Course</h1>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
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
                    <FormLabel>Short Name</FormLabel>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief overview of your course..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short description that will appear in course listings.
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
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="99.99" {...field} />
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
                    <Select
                      onValueChange={(value) =>
                        field.onChange(parseInt(value) || null)
                      }
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
                        ) : categories && categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                            No categories available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The category this course belongs to.
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
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            <div className="space-y-6 border-t pt-6 mt-4">
              <h3 className="text-lg font-medium mb-4">Course Videos</h3>

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
                          // Update fullVideoUrl
                          field.onChange(e.target.value);

                          // Auto-populate previewVideoUrl with the same value
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
              <p className="text-sm text-muted-foreground italic">
                Note: The preview video URL is auto-populated from the full
                video URL. A 15-second preview will be shown when users click
                the preview button.
              </p>
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

            <div className="flex justify-end">
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
          </form>
        </Form>
      </div>
    </div>
  );
}
