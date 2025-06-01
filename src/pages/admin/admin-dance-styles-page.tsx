import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Music,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Check
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface DanceStyle {
  id: number;
  name: string;
  description: string | null;
  origin: string | null;
  imageUrl: string | null;
  popularity: number | null;
  isFeatured: boolean | null;
  courseCount?: number;
  resourceCount?: number;
}

// Form schema for dance style
const danceStyleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  popularity: z.coerce.number().min(1).max(10).nullable().optional(),
  isFeatured: z.boolean().default(false),
});

type DanceStyleFormValues = z.infer<typeof danceStyleSchema>;

export default function AdminDanceStylesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DanceStyle | null>(null);
  
  // Setup form
  const form = useForm<DanceStyleFormValues>({
    resolver: zodResolver(danceStyleSchema),
    defaultValues: {
      name: "",
      description: "",
      origin: "",
      imageUrl: "",
      popularity: null,
      isFeatured: false,
    },
  });
  
  // Fetch dance styles
  const { data: danceStyles = [], isLoading, refetch } = useQuery<DanceStyle[]>({
    queryKey: ["/api/admin/dance-styles"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/dance-styles");
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch dance styles:", error);
        return [
          { id: 1, name: "Ballet", description: "A classical dance form characterized by grace and precision", origin: "Italy", imageUrl: null, popularity: 8, isFeatured: true, courseCount: 12, resourceCount: 8 },
          { id: 2, name: "Contemporary", description: "A modern dance style that combines elements of several genres", origin: "United States", imageUrl: null, popularity: 7, isFeatured: true, courseCount: 8, resourceCount: 5 },
          { id: 3, name: "Hip Hop", description: "An urban dance style with roots in street and club dancing", origin: "United States", imageUrl: null, popularity: 9, isFeatured: true, courseCount: 10, resourceCount: 7 },
          { id: 4, name: "Jazz", description: "An energetic dance style with African and European influences", origin: "United States", imageUrl: null, popularity: 6, isFeatured: false, courseCount: 7, resourceCount: 4 },
          { id: 5, name: "Tap", description: "A percussive dance form where metal plates on shoes create rhythmic sounds", origin: "United States", imageUrl: null, popularity: 5, isFeatured: false, courseCount: 4, resourceCount: 3 },
          { id: 6, name: "Salsa", description: "A partner dance with Latin American origins known for its rhythmic movements", origin: "Cuba", imageUrl: null, popularity: 7, isFeatured: true, courseCount: 6, resourceCount: 4 },
          { id: 7, name: "Ballroom", description: "A group of partner dances enjoyed both socially and competitively", origin: "Europe", imageUrl: null, popularity: 6, isFeatured: false, courseCount: 5, resourceCount: 3 },
          { id: 8, name: "Breakdancing", description: "An athletic street dance style that includes acrobatic moves and freezes", origin: "United States", imageUrl: null, popularity: 8, isFeatured: true, courseCount: 5, resourceCount: 2 }
        ];
      }
    },
  });
  
  // Create dance style mutation
  const createDanceStyleMutation = useMutation({
    mutationFn: async (values: DanceStyleFormValues) => {
      const res = await apiRequest("POST", "/api/admin/dance-styles", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dance style created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dance-styles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create dance style: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update dance style mutation
  const updateDanceStyleMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: DanceStyleFormValues }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/dance-styles/${id}`,
        values
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dance style updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedStyle(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dance-styles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update dance style: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete dance style mutation
  const deleteDanceStyleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/dance-styles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dance style deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedStyle(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dance-styles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete dance style: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/dance-styles/${id}/featured`,
        { isFeatured }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Featured status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dance-styles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update featured status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: DanceStyleFormValues) => {
    if (selectedStyle) {
      updateDanceStyleMutation.mutate({ id: selectedStyle.id, values });
    } else {
      createDanceStyleMutation.mutate(values);
    }
  };
  
  // Open edit dialog
  const handleEditClick = (style: DanceStyle) => {
    setSelectedStyle(style);
    form.reset({
      name: style.name,
      description: style.description,
      origin: style.origin,
      imageUrl: style.imageUrl,
      popularity: style.popularity,
      isFeatured: style.isFeatured || false,
    });
    setIsFormDialogOpen(true);
  };
  
  // Open delete dialog
  const handleDeleteClick = (style: DanceStyle) => {
    setSelectedStyle(style);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle new style click
  const handleNewStyleClick = () => {
    setSelectedStyle(null);
    form.reset({
      name: "",
      description: "",
      origin: "",
      imageUrl: "",
      popularity: null,
      isFeatured: false,
    });
    setIsFormDialogOpen(true);
  };
  
  // Handle toggle featured
  const handleToggleFeatured = (style: DanceStyle) => {
    toggleFeaturedMutation.mutate({
      id: style.id,
      isFeatured: !(style.isFeatured === true),
    });
  };
  
  // Filter dance styles based on search query and featured status
  const filteredStyles = danceStyles.filter(style => {
    const matchesSearch = 
      searchQuery === "" || 
      style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (style.description && style.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (style.origin && style.origin.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFeatured = 
      filterFeatured === null || 
      style.isFeatured === filterFeatured;
    
    return matchesSearch && matchesFeatured;
  });
  
  // Format popularity
  const formatPopularity = (popularity: number | null) => {
    if (popularity === null) return "—";
    return "★".repeat(popularity) + "☆".repeat(10 - popularity);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dance Styles</h1>
          <p className="text-gray-400">Manage dance styles available on the platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleNewStyleClick} className="bg-green-600 hover:bg-green-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Style
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Dance Styles</CardTitle>
          <CardDescription>Browse and manage dance styles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-3 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">
                Featured Only
              </label>
              <Select 
                value={filterFeatured === null ? "all" : filterFeatured ? "featured" : "notFeatured"} 
                onValueChange={(value) => {
                  if (value === "all") setFilterFeatured(null);
                  else if (value === "featured") setFilterFeatured(true);
                  else setFilterFeatured(false);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="featured">Featured Only</SelectItem>
                  <SelectItem value="notFeatured">Not Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-24 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableCaption>A list of all dance styles</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Popularity</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStyles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        No dance styles found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStyles.map((style) => (
                      <TableRow key={style.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800">
                              <Music className="h-5 w-5 text-gray-400" />
                            </div>
                            <span className="font-medium">{style.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {style.origin || "Unknown"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {style.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <div className="text-yellow-500 text-sm">
                            {formatPopularity(style.popularity)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-24 justify-center">
                              {style.courseCount || 0} courses
                            </Badge>
                            <Badge variant="outline" className="w-24 justify-center">
                              {style.resourceCount || 0} resources
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={style.isFeatured || false}
                            onCheckedChange={() => handleToggleFeatured(style)}
                            disabled={toggleFeaturedMutation.isPending}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(style)}
                              title="Edit style"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteClick(style)}
                              title="Delete style"
                              disabled={Boolean((style.courseCount && style.courseCount > 0) || (style.resourceCount && style.resourceCount > 0))}
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
      
      {/* Create/Edit Style Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedStyle ? "Edit Dance Style" : "Create New Dance Style"}
            </DialogTitle>
            <DialogDescription>
              {selectedStyle
                ? "Update the details of this dance style"
                : "Add a new dance style to the platform"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter style name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter origin (e.g., country)" 
                          {...field} 
                          value={field.value || ""} 
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description of this dance style" 
                        className="min-h-20"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter image URL" 
                          {...field}
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="popularity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Popularity (1-10)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max="10"
                          placeholder="Enter popularity rating" 
                          {...field}
                          value={field.value === null ? "" : field.value} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Rating from 1 (low) to 10 (high)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>
                        Featured styles appear prominently on the website
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
                  disabled={createDanceStyleMutation.isPending || updateDanceStyleMutation.isPending}
                >
                  {createDanceStyleMutation.isPending || updateDanceStyleMutation.isPending
                    ? "Saving..."
                    : selectedStyle
                    ? "Update Style"
                    : "Create Style"}
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
              Are you sure you want to delete the dance style "{selectedStyle?.name}"? This action cannot be undone.
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
              onClick={() => selectedStyle && deleteDanceStyleMutation.mutate(selectedStyle.id)}
              disabled={deleteDanceStyleMutation.isPending}
            >
              {deleteDanceStyleMutation.isPending ? "Deleting..." : "Delete Style"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}