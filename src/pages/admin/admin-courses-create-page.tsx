import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import AdminLayout from "@/components/layout/admin-layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

const createCourseFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  shortName: z.string().min(2, "Short name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  detailedDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.string().optional(),
  categoryId: z.number().optional(),
  instructorId: z.number().nullable().optional(),
  difficultyLevel: z.string(),
  estimatedDuration: z.string().optional(),
  visible: z.boolean(),
  previewVideoUrl: z.string().optional(),
  fullVideoUrl: z.string().optional(),
});

type CourseFormFields = z.infer<typeof createCourseFormSchema>;

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

export default function AdminCoursesCreatePage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

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
      instructorId: undefined,
      difficultyLevel: "beginner",
      estimatedDuration: "",
      visible: false,
      previewVideoUrl: "",
      fullVideoUrl: "",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (values: CreateCourseApiRequest) => {
      const response = await apiRequest("/api/courses", {
        method: "POST",
        data: values,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Created Successfully",
        description: `"${data.title || form.getValues("title")}" has been created.`,
      });
      // Optionally navigate to the edit page or admin dashboard
      // router.push(`/admin/courses/${data.id}/edit`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CourseFormFields) => {
    const payload: CreateCourseApiRequest = {
      title: values.title,
      short_name: values.shortName,
      description: values.description,
      detailed_description: values.detailedDescription,
      image_url: values.imageUrl,
      price: values.price,
      category_id: values.categoryId || null,
      instructor_id: values.instructorId || null,
      difficulty_level: values.difficultyLevel,
      duration: values.estimatedDuration,
      visible: values.visible,
      preview_video_url: values.previewVideoUrl,
      video_url: values.fullVideoUrl,
    };
    createCourseMutation.mutate(payload);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Create New Course</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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
                    <Textarea {...field} />
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
                    <Input {...field} />
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
                    <Input type="number" {...field} />
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <Input {...field} />
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
                      checked={field.value}
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
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Create Course
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
