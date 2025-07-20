import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";

const editCourseFormSchema = z.object({
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
  fullVideoUrl: z.string().nullable(),
  previewVideoUrl: z.string().nullable(),
});

type CourseFormValues = z.infer<typeof editCourseFormSchema>;

export default function AdminCoursesEditPage() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Validate course ID
  const courseId = parseInt(params.id || "");
  if (!courseId || isNaN(courseId)) {
    setLocation("/admin/courses");
    return null;
  }

  // Fetch course data
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery<any>({
    queryKey: ["/api/courses", courseId],
    queryFn: async () => {
      const res = await apiRequest(`/api/courses/${courseId}`, {
        method: "GET",
      });
      return res;
    },
  });

  useEffect(() => {
    async function fetchCategories() {
      setCategoriesLoading(true);
      try {
        const res = await apiRequest("/api/categories", { method: "GET" });
        setCategories(res?.data || []);
      } catch (error: any) {
        setCategoriesError(error.message || "Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(editCourseFormSchema),
    defaultValues: {
      title: course?.title || "",
      shortName: course?.short_name || "",
      description: course?.description || "",
      detailedDescription: course?.detailed_description || "",
      imageUrl: course?.image_url || "",
      price: course?.price ? String(course.price) : "",
      categoryId: course?.category_id || null,
      difficultyLevel: course?.difficulty_level || "beginner",
      estimatedDuration: course?.duration || "",
      visible: course?.visible ?? false,
      fullVideoUrl: course?.video_url || "",
      previewVideoUrl: course?.preview_video_url || "",
    },
    values: course
      ? {
          title: course.title || "",
          shortName: course.short_name || "",
          description: course.description || "",
          detailedDescription: course.detailed_description || "",
          imageUrl: course.image_url || "",
          price: course.price ? String(course.price) : "",
          categoryId: course.category_id || null,
          difficultyLevel: course.difficulty_level || "beginner",
          estimatedDuration: course.duration || "",
          visible: course.visible ?? false,
          fullVideoUrl: course.video_url || "",
          previewVideoUrl: course.preview_video_url || "",
        }
      : undefined,
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const payload = {
        title: values.title,
        short_name: values.shortName,
        description: values.description,
        detailed_description: values.detailedDescription,
        image_url: values.imageUrl,
        price: values.price,
        category_id: values.categoryId,
        difficulty_level: values.difficultyLevel,
        duration: values.estimatedDuration,
        visible: values.visible,
        video_url: values.fullVideoUrl,
        preview_video_url: values.previewVideoUrl,
      };
      const res = await apiRequest(`/api/courses/${courseId}`, {
        method: "PATCH",
        data: payload,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    updateCourseMutation.mutate(values);
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto py-10">
        <div className="flex items-center mb-6">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold truncate">
            {course?.title || "Loading Course..."}
          </h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
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
                    <Input {...field} value={field.value ?? ""} />
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
                    <Textarea {...field} value={field.value ?? ""} />
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
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
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
                    <Input type="number" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visible"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visible</FormLabel>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="previewVideoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview Video URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullVideoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Video URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
