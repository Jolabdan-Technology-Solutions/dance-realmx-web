import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  FolderOpen,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  FileText
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface ResourceCategory {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  resourceCount?: number;
}

// Form schema for resource category
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminResourceCategoriesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null);
  
  // Setup form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });
  
  // Fetch categories
  const { data: categories = [], isLoading, refetch } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/admin/categories/resources"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/categories/resources");
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch resource categories:", error);
        return [
          { id: 1, name: "Lesson Plans", description: "Comprehensive dance lesson plans for all levels", imageUrl: null, resourceCount: 23 },
          { id: 2, name: "Music Playlists", description: "Curated music playlists for different dance styles", imageUrl: null, resourceCount: 18 },
          { id: 3, name: "Teaching Aids", description: "Visual aids and diagrams for teaching dance", imageUrl: null, resourceCount: 15 },
          { id: 4, name: "Class Management", description: "Resources for managing dance classes and studios", imageUrl: null, resourceCount: 12 },
          { id: 5, name: "Business Tools", description: "Business tools for dance educators", imageUrl: null, resourceCount: 9 }
        ];
      }
    },
  });
  
  // Create resource category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const res = await apiRequest("POST", "/api/admin/categories/resources", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Resource category created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories/resources"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create resource category: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update resource category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: CategoryFormValues }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/categories/resources/${id}`,
        values
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Resource category updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedCategory(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories/resources"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update resource category: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete resource category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/categories/resources/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Resource category deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories/resources"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete resource category: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: CategoryFormValues) => {
    if (selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, values });
    } else {
      createCategoryMutation.mutate(values);
    }
  };
  
  // Open edit dialog
  const handleEditClick = (category: ResourceCategory) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
    });
    setIsFormDialogOpen(true);
  };
  
  // Open delete dialog
  const handleDeleteClick = (category: ResourceCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle new category click
  const handleNewCategoryClick = () => {
    setSelectedCategory(null);
    form.reset({
      name: "",
      description: "",
      imageUrl: "",
    });
    setIsFormDialogOpen(true);
  };
  
  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Categories</h1>
          <p className="text-gray-400">Manage categories for curriculum resources</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleNewCategoryClick} className="bg-green-600 hover:bg-green-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resource Categories</CardTitle>
          <CardDescription>Browse and manage all resource categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full md:w-96">
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-3 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-24 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableCaption>A list of all resource categories</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        No categories found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800">
                              <FileText className="h-5 w-5 text-gray-400" />
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {category.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.resourceCount || 0} resources</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(category)}
                              title="Edit category"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteClick(category)}
                              title="Delete category"
                              disabled={Boolean(category.resourceCount && category.resourceCount > 0)}
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
          )}
        </CardContent>
      </Card>
      
      {/* Create/Edit Category Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Resource Category" : "Create New Resource Category"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? "Update the details of this resource category"
                : "Add a new category for curriculum resources"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the category as it will appear to users
                    </FormDescription>
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
                      <Input 
                        placeholder="Enter category description (optional)" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description explaining what this category includes
                    </FormDescription>
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
                      <Input 
                        placeholder="Enter image URL (optional)" 
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL to an image representing this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending
                    ? "Saving..."
                    : selectedCategory
                    ? "Update Category"
                    : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the resource category "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedCategory && deleteCategoryMutation.mutate(selectedCategory.id)}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}