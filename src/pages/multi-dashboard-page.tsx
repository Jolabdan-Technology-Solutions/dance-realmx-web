import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { UserRole } from "@/constants/roles";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ShoppingBag,
  BookOpen,
  UserCog,
  Users,
  Plus,
  File,
  AlertTriangle,
  BarChart3,
  Upload,
  X,
  Image,
  Package,
  Pencil,
  Trash,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseDetailsModal } from "@/components/courses/course-details-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResourceType } from "./admin/ResourceType";
import { Checkbox } from "@/components/ui/checkbox";

const API_BASE_URL = "https://api.livetestdomain.com";
const UPLOAD_ENDPOINT = "https://api.livetestdomain.com/api/upload";

// Helper for price formatting
const formatPrice = (price: string | number | null) => {
  if (!price) return "$0.00";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
};

// Helper for file type detection
const getResourceType = (fileUrl: string, fileName: string = "") => {
  const url = fileUrl.toLowerCase();
  const name = fileName.toLowerCase();

  if (
    url.includes(".mp4") ||
    url.includes(".mov") ||
    url.includes(".avi") ||
    name.includes(".mp4")
  ) {
    return "VIDEO";
  }
  if (
    url.includes(".mp3") ||
    url.includes(".wav") ||
    url.includes(".m4a") ||
    name.includes(".mp3")
  ) {
    return "AUDIO";
  }
  if (url.includes(".pdf") || name.includes(".pdf")) {
    return "DOCUMENT";
  }
  if (
    url.includes(".jpg") ||
    url.includes(".png") ||
    url.includes(".jpeg") ||
    name.includes(".jpg")
  ) {
    return "IMAGE";
  }
  return "DOCUMENT"; // Default fallback
};

// Dance styles options
const DANCE_STYLES = [
  "Ballet",
  "Hip-Hop",
  "Jazz",
  "Contemporary",
  "Salsa",
  "Bachata",
  "Ballroom",
  "Latin",
  "Tap",
  "Lyrical",
  "Commercial",
  "Breakdancing",
  "Krump",
  "House",
  "Waacking",
  "Voguing",
  "Other",
];

// Difficulty levels
const DIFFICULTY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Professional",
];

// Age ranges
const AGE_RANGES = [
  "3-5",
  "6-8",
  "9-12",
  "13-17",
  "18-25",
  "26-35",
  "36-45",
  "46+",
  "All Ages",
];

/**
 * Multi-role dashboard for users with multiple roles
 * This component shows different tabs and features based on the roles assigned to the user
 */
export default function MultiDashboardPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<
    string | null
  >(null);
  const [resourceType, setResourceType] = useState<string>("VIDEO");
  const [isMainFileUploading, setIsMainFileUploading] = useState(false);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  // Add is_featured state
  const [is_featured, setis_featured] = useState(false);

  const resetCreateForm = () => {
    setUploadedFileUrl(null);
    setUploadedThumbnailUrl(null);
    setResourceType("VIDEO");
    setIsMainFileUploading(false);
    setIsThumbnailUploading(false);
    setis_featured(false); // Reset is_featured
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/resource-categories"],
    queryFn: async () => {
      const res = await apiRequest("/api/resource-categories", {
        method: "GET",
      });
      console.log("Resource categories", res);
      return await res;
    },
  });

  const { data: resourceCourses = [] } = useQuery({
    queryKey: ["/api/resource"],
    queryFn: async () => {
      const res = await apiRequest(`/api/resources/seller/${user?.id}`, {
        method: "GET",
      });
      console.log("Resource", res);
      return await res;
    },
  });

  console.log("resource", resourceCourses);

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      const response = await apiRequest(`/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(resourceData),
      });

      if (!response) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Created Successfully",
        description: `Resource has been added to the curriculum.`,
      });
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description:
          error instanceof Error ? error.message : "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`${API_BASE_URL}/api/resources/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Updated",
        description: "The resource has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/resources/${id}`, {
        method: "DELETE",
      });

      if (!response) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.status === 204 ? {} : await response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Deleted",
        description: "The resource has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  const handleUpdateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    const formData = new FormData(e.target as HTMLFormElement);

    const updateData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: parseFloat((formData.get("price") as string) || "0"),
      ageRange: formData.get("ageRange") as string,
      danceStyle: formData.get("danceStyle") as string,
      difficultyLevel: formData.get("difficultyLevel") as string,
      // status: formData.get("status") as string,
      is_featured: formData.has("is_featured"),
    };

    updateResourceMutation.mutate({
      id: selectedResource.id,
      data: updateData,
    });
  };

  // Handle resource creation form submission
  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    // Enhanced validation with better error messages
    if (!uploadedFileUrl) {
      toast({
        title: "Main File Required",
        description:
          "Please upload the main resource file before creating the resource. Click 'Choose Main File' to upload.",
        variant: "destructive",
      });
      return;
    }

    if (isMainFileUploading || isThumbnailUploading) {
      toast({
        title: "Upload In Progress",
        description:
          "Please wait for the file upload to complete before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Check required form fields
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const danceStyle = formData.get("danceStyle") as string;
    const difficultyLevel = formData.get("difficultyLevel") as string;
    const ageRange = formData.get("ageRange") as string;

    if (
      !title ||
      !description ||
      !danceStyle ||
      !difficultyLevel ||
      !ageRange
    ) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields (marked with *).",
        variant: "destructive",
      });
      return;
    }

    // Build the payload according to API specification
    const resourcePayload: {
      title: string;
      description: string;
      price: number;
      ageRange: string;
      categoryId: number | null;
      danceStyle: string;
      difficultyLevel: string;
      thumbnailUrl: string;
      type: ResourceType;
      url: string;
      is_featured: boolean; // Add is_featured to the payload
    } = {
      title,
      description,
      price: parseFloat(price || "0"),
      ageRange,
      categoryId: parseInt(formData.get("categoryId") as string) || null,
      danceStyle,
      difficultyLevel,
      thumbnailUrl: uploadedThumbnailUrl || "",
      type: resourceType as ResourceType,
      url: uploadedFileUrl!,
      is_featured, // Include is_featured in the payload
    };

    console.log("Sending resource payload:", resourcePayload);

    // Show a loading toast
    toast({
      title: "Creating Resource",
      description: "Please wait while we create your resource...",
    });

    createResourceMutation.mutate(resourcePayload);
  };

  {
    /* Course Details Modal */
  }
  {
    selectedCourseId && (
      <CourseDetailsModal
        courseId={selectedCourseId}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          // Allow for transition animation
          setTimeout(() => setSelectedCourseId(null), 300);
        }}
      />
    );
  }

  // Fetch instructor courses from the API
  const instructorCourses = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: async () => {
      const response = await fetch(
        `https://api.livetestdomain.com/api/courses/instructor/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Adjust based on your auth setup
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      // console.log(data);
      return data.data; // Return the courses array from the API response
    },
    // Only enabled when user is logged in and has instructor role
    enabled:
      !isLoading &&
      !!user &&
      Array.isArray(user.role) &&
      user.role.includes(UserRole.INSTRUCTOR_ADMIN),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch instructor courses from the API
  // const resourceCourses = useQuery({
  //   queryKey: ["/resources-courses"],
  //   queryFn: async () => {
  //     const response = await apiRequest(`api/resources/seller/${user?.id}`, {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       requireAuth: true,
  //     });
  //     if (!response) {
  //       throw new Error("Failed to fetch resource");
  //     }
  //     const data = await response.json();
  //     console.log("Resource", data);
  //     return data.data; // Return the courses array from the API response
  //   },
  //   // Only enabled when user is logged in and has instructor role
  //   enabled: !isLoading && !!user,
  //   staleTime: 1000 * 60 * 5, // 5 minutes
  // });

  useEffect(() => {
    // Set default active tab based on user roles
    if (user && Array.isArray(user.role) && user.role.length > 0) {
      // Prioritized role order for default tab selection
      const priorityOrder = [
        UserRole.ADMIN,
        UserRole.INSTRUCTOR_ADMIN,
        UserRole.CURRICULUM_SELLER,
        UserRole.CURRICULUM_ADMIN,
        UserRole.MODERATOR,
        UserRole.USER,
      ];

      // Find the highest priority role the user has
      for (const role of priorityOrder) {
        if (user.role.includes(role)) {
          setActiveTab(role);
          break;
        }
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || !Array.isArray(user.role) || user.role.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">No Roles Assigned</h1>
        <p className="mb-4">
          You don't have any roles assigned. Please contact an administrator.
        </p>
        <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  // Determine which role tabs to show
  const hasSellerRole = user.role.includes(UserRole.CURRICULUM_SELLER);
  const hasInstructorRole = user.role.includes(UserRole.INSTRUCTOR_ADMIN);
  const hasAdminRole = user.role.includes(UserRole.ADMIN);
  const hasCurriculumOfficerRole = user.role.includes(
    UserRole.CURRICULUM_ADMIN
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Manage all your roles and access features from one place
          </p>
        </div>
      </div>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="flex flex-wrap">
          {hasSellerRole && (
            <TabsTrigger value={UserRole.CURRICULUM_SELLER}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Seller Dashboard
            </TabsTrigger>
          )}

          {hasInstructorRole && (
            <TabsTrigger value={UserRole.INSTRUCTOR_ADMIN}>
              <BookOpen className="h-4 w-4 mr-2" />
              Instructor Dashboard
            </TabsTrigger>
          )}

          {hasAdminRole && (
            <TabsTrigger value={UserRole.ADMIN}>
              <UserCog className="h-4 w-4 mr-2" />
              Admin Dashboard
            </TabsTrigger>
          )}
        </TabsList>

        {/* Seller Dashboard Tab */}
        {hasSellerRole && (
          <TabsContent value={UserRole.CURRICULUM_SELLER} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Seller Dashboard</h2>
              <div className="flex items-center space-x-2 my-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <span>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resources
                  </span>
                </Button>
                {/* <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer/sellers">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Sellers
                  </Link>
                </Button> */}
                {/* <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer">
                    <Users className="h-4 w-4 mr-2" />
                    Full Curriculum Portal
                  </Link>
                </Button> */}
              </div>
            </div>

            {/* Curriculum Officer summary */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pending Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BookOpen className="inline mr-2 h-5 w-5" />7
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Approved Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <File className="inline mr-2 h-5 w-5" />
                    52
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Users className="inline mr-2 h-5 w-5" />
                    18
                  </div>
                </CardContent>
              </Card>
            </div> */}

            {/* Pending Resources */}
            <div className="flex justify-between items-center pb-6">
              <h3 className="text-xl font-semibold">Your Resource</h3>
              <span className="">Total Resource: {resourceCourses.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {resourceCourses.length > 0 ? (
                <>
                  {resourceCourses.map((resource: any, i: any) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="w-full h-auto rounded-md bg-muted mb-2 flex items-center justify-center">
                          {resource.type === "IMAGE" ? (
                            <img
                              src={`${resource.thumbnailUrl}`}
                              alt={resource.title}
                            />
                          ) : (
                            <File className="h-12 w-12 text-muted-foreground opacity-50" />
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {resource?.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm text-muted-foreground mb-2">
                          Price{" "}
                          <span className="font-medium">
                            ${resource?.price}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Difficulty Level{" "}
                          <span className="font-medium">
                            {resource?.difficultyLevel}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Age Range{" "}
                          <span className="font-medium">
                            {resource?.ageRange}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {/* Submitted {resource.submitted} */}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="flex space-x-2 justify-self-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                            onClick={() => {
                              setIsEditDialogOpen(true);
                              setSelectedResource(resource);
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                            onClick={() => {
                              setIsDeleteDialogOpen(true);
                              setSelectedResource(resource);
                            }}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No resources found.
                </div>
              )}
            </div>

            {/* <div className="mt-2">
              <Button asChild>
                <Link href="/admin/curriculum-officer">
                  Go to Full Curriculum Dashboard
                </Link>
              </Button>
            </div> */}
          </TabsContent>
        )}
        {/* Instructor Dashboard Tab */}
        {hasInstructorRole && (
          <TabsContent value={UserRole.INSTRUCTOR_ADMIN} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Instructor Dashboard</h2>
              <div className="flex items-center flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Link>
                </Button>
                {/* <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/certificates">
                    <Award className="h-4 w-4 mr-2" />
                    Certificates
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/quizzes">
                    <svg
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    Quizzes
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/students">
                    <Users className="h-4 w-4 mr-2" />
                    Students
                  </Link>
                </Button> */}
                {/* <Button asChild variant="outline" size="sm">
                  <Link href="/instructor-module-page">
                    <Users className="h-4 w-4 mr-2" />
                    Modules
                  </Link>
                </Button> */}
                {/* <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/dashboard">
                    Full Instructor Portal
                  </Link>
                </Button> */}
              </div>
            </div>

            {/* Instructor analytics summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BookOpen className="inline mr-2 h-5 w-5" />
                    {instructorCourses.isLoading ? (
                      <Loader2 className="inline h-6 w-6 animate-spin ml-2" />
                    ) : instructorCourses.error ? (
                      <span className="text-red-500">-</span>
                    ) : (
                      instructorCourses.data?.length || 0
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Users className="inline mr-2 h-5 w-5" />
                    {instructorCourses.isLoading ? (
                      <Loader2 className="inline h-6 w-6 animate-spin ml-2" />
                    ) : instructorCourses.error ? (
                      <span className="text-red-500">-</span>
                    ) : (
                      instructorCourses?.data?.reduce(
                        (total: any, course: any) =>
                          total + (course.enrollment_count || 0),
                        0
                      ) || 0
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Certificates Issued</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Award className="inline mr-2 h-5 w-5" />
                    16
                  </div>
                </CardContent>
              </Card> */}
            </div>

            {/* Main instructor functionality section */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
              {/* Course Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    <CardTitle>Course Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        Manage existing courses
                      </span>
                      <Link
                        href="/instructor/courses"
                        className="text-primary hover:underline"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Create new course</span>
                      <Link
                        href="/instructor/courses/create"
                        className="text-primary hover:underline"
                      >
                        Create
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Edit course content</span>
                      <Link
                        href="/instructor/courses"
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                    {/* <div className="flex justify-between text-sm">
                      <span className="font-medium">Course analytics</span>
                      <Link
                        href="/instructor/analytics"
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </div> */}
                  </div>
                </CardContent>
              </Card>

              {/* Student Management */}
              {/* <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <CardTitle>Student Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">View all students</span>
                      <Link
                        href="/instructor/students"
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Manage enrollments</span>
                      <Link
                        href="/instructor/enrollments"
                        className="text-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Student progress</span>
                      <Link
                        href="/instructor/student-progress"
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Export student data</span>
                      <Link
                        href="/instructor/export"
                        className="text-primary hover:underline"
                      >
                        Export
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card> */}

              {/* Quiz & Assessment */}
              {/* <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    <CardTitle>Quiz & Assessment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Create new quiz</span>
                      <Link
                        href="/instructor/quizzes/create"
                        className="text-primary hover:underline"
                      >
                        Create
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        Manage existing quizzes
                      </span>
                      <Link
                        href="/instructor/quizzes"
                        className="text-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Review quiz results</span>
                      <Link
                        href="/instructor/quiz-results"
                        className="text-primary hover:underline"
                      >
                        Review
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Quiz settings</span>
                      <Link
                        href="/instructor/quizzes/settings"
                        className="text-primary hover:underline"
                      >
                        Configure
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card> */}

              {/* Certificate Management */}
              {/* <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    <CardTitle>Certificate Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Issue new certificate</span>
                      <Link
                        href="/instructor/certificates/issue"
                        className="text-primary hover:underline"
                      >
                        Issue
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Certificate templates</span>
                      <Link
                        href="/instructor/certificate-templates"
                        className="text-primary hover:underline"
                      >
                        Templates
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Create template</span>
                      <Link
                        href="/instructor/certificate-templates/create"
                        className="text-primary hover:underline"
                      >
                        Create
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Issued certificates</span>
                      <Link
                        href="/instructor/certificates"
                        className="text-primary hover:underline"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>

            {/* Instructor Courses */}
            <h3 className="text-xl font-semibold mb-3">Your Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {instructorCourses.isLoading ? (
                <div className="col-span-3 flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : instructorCourses.error ? (
                <div className="col-span-3 bg-muted p-6 rounded-lg text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-2">
                    Error Loading Courses
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {instructorCourses.error instanceof Error
                      ? instructorCourses.error.message
                      : "Failed to fetch your courses. Please try again."}
                  </p>
                </div>
              ) : instructorCourses.data &&
                instructorCourses.data?.length > 0 ? (
                instructorCourses?.data?.map((course: any) => (
                  <Card key={course.id}>
                    <CardHeader className="pb-2">
                      <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
                        {course.image_url ? (
                          <img
                            src={course.image_url}
                            alt={course.title}
                            className="h-full w-full object-cover rounded-md"
                          />
                        ) : (
                          <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
                        )}
                      </div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Duration</span>
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Level</span>
                        <span className="capitalize">
                          {course.difficulty_level}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Price</span>
                        <span>${course.price}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {course.enrollment_count || 0} Students
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/instructor/courses/${course.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 bg-muted p-6 rounded-lg text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't created any courses yet. Click the button below
                    to get started.
                  </p>
                  <Button asChild>
                    <Link href="/instructor/courses/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* <div className="mt-2">
              <Button asChild>
                <Link href="/instructor/dashboard">
                  Go to Full Instructor Dashboard
                </Link>
              </Button>
            </div> */}
          </TabsContent>
        )}

        {/* Admin Dashboard Tab */}
        {hasAdminRole && (
          <TabsContent value={UserRole.ADMIN} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Courses
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/dashboard">Full Admin Portal</Link>
                </Button>
              </div>
            </div>

            {/* Admin stats summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Users className="inline mr-2 h-5 w-5" />
                    137
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BookOpen className="inline mr-2 h-5 w-5" />
                    24
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Approved Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <ShoppingBag className="inline mr-2 h-5 w-5" />
                    18
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <svg
                      className="inline mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
                      <path d="M12 18V6" />
                    </svg>
                    $12,480
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent User Activity */}
            <h3 className="text-xl font-semibold mb-3">Recent User Activity</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {[
                    {
                      user: "John Rodriguez",
                      action: "Enrolled in 'Ballet Certification Program'",
                      time: "2 hours ago",
                    },
                    {
                      user: "Sarah Thomas",
                      action:
                        "Uploaded new resource 'Contemporary Dance Syllabus'",
                      time: "4 hours ago",
                    },
                    {
                      user: "Michael Chen",
                      action: "Purchased 'Hip Hop Curriculum Bundle'",
                      time: "Yesterday",
                    },
                    {
                      user: "Emma Jackson",
                      action: "Completed 'Jazz Dance Fundamentals' course",
                      time: "2 days ago",
                    },
                    {
                      user: "Robert Kim",
                      action: "Registered as a new instructor",
                      time: "3 days ago",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{activity.user}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.action}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-4">
              <Button asChild>
                <Link href="/admin/dashboard">Go to Full Admin Dashboard</Link>
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Curriculum Officer Tab */}
        {hasCurriculumOfficerRole && (
          <TabsContent value={UserRole.CURRICULUM_ADMIN} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Curriculum Officer Dashboard
              </h2>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Review Resources
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer/sellers">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Sellers
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/curriculum-officer">
                    Full Curriculum Portal
                  </Link>
                </Button>
              </div>
            </div>

            {/* Curriculum Officer summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pending Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <BookOpen className="inline mr-2 h-5 w-5" />7
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Approved Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <File className="inline mr-2 h-5 w-5" />
                    52
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    <Users className="inline mr-2 h-5 w-5" />
                    18
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Resources */}
            <h3 className="text-xl font-semibold mb-3">
              Pending Resource Reviews
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {resourceCourses.data?.map(
                ({ resource, i }: { resource: any; i: any }) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <div className="w-full h-32 rounded-md bg-muted mb-2 flex items-center justify-center">
                        <File className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                      <CardTitle className="text-lg">
                        {resource.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        Submitted by{" "}
                        <span className="font-medium">{resource.seller}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Submitted {resource.submitted}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-500"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )
              )}
            </div>

            {/* <div className="mt-2">
              <Button asChild>
                <Link href="/admin/curriculum-officer">
                  Go to Full Curriculum Dashboard
                </Link>
              </Button>
            </div> */}
          </TabsContent>
        )}
      </Tabs>

      {/* Course Details Modal */}
      {selectedCourseId && (
        <CourseDetailsModal
          courseId={selectedCourseId}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            // Allow for transition animation
            setTimeout(() => setSelectedCourseId(null), 300);
          }}
        />
      )}

      {/* Create Resource Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Dance Resource</DialogTitle>
            <DialogDescription>
              Upload a new dance curriculum resource to the platform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateResource}>
            <div className="grid gap-6 py-4">
              {/* File Upload Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Resource Files
                </Label>

                {/* Main Resource File */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div>
                      <Label className="text-sm font-medium">
                        Main Resource File *
                      </Label>
                      <p className="text-xs text-gray-500">
                        Upload your dance instruction video, audio, or document
                      </p>
                    </div>
                  </div>

                  {/* Custom File Selection and Upload */}
                  <div className="mt-4 space-y-4">
                    {!uploadedFileUrl ? (
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-blue-50 border-blue-200 text-blue-700"
                          onClick={() =>
                            document.getElementById("main-file-input")?.click()
                          }
                          disabled={isMainFileUploading}
                        >
                          {isMainFileUploading ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Main File
                            </>
                          )}
                        </Button>

                        {/* Hidden file input */}
                        <input
                          id="main-file-input"
                          type="file"
                          accept="video/*,audio/*,application/pdf,.doc,.docx,image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            console.log(file);
                            // Validate file size
                            if (file.size > 50 * 1024 * 1024) {
                              toast({
                                title: "File Too Large",
                                description:
                                  "Please select a file smaller than 50MB.",
                                variant: "destructive",
                              });
                              return;
                            }

                            setIsMainFileUploading(true);

                            try {
                              console.log(
                                "Starting file upload to:",
                                UPLOAD_ENDPOINT
                              );
                              console.log("Using authentication: Bearer token");
                              console.log("File details:", {
                                name: file.name,
                                size:
                                  (file.size / 1024 / 1024).toFixed(2) + "MB",
                                type: file.type,
                              });
                              console.log(
                                "Sending only file data (no additional metadata)"
                              );

                              // Create FormData
                              const formData = new FormData();
                              formData.append("file", file);
                              // Remove type and entity_type fields as API doesn't expect them

                              // Debug FormData contents
                              // console.log("Thumbnail FormData contents:");
                              // for (let [key, value] of formData.entries()) {
                              //   if (value instanceof File) {
                              //     console.log(
                              //       `- ${key}: File[${value.name}, ${value.size} bytes, ${value.type}]`
                              //     );
                              //   } else {
                              //     console.log(`- ${key}: ${value}`);
                              //   }
                              // }

                              // Debug FormData contents
                              // console.log("FormData contents:");
                              // for (let [key, value] of formData.entries()) {
                              //   if (value instanceof File) {
                              //     console.log(
                              //       `- ${key}: File[${value.name}, ${value.size} bytes, ${value.type}]`
                              //     );
                              //   } else {
                              //     console.log(`- ${key}: ${value}`);
                              //   }
                              // }

                              // Upload to server
                              const response = await apiRequest(
                                UPLOAD_ENDPOINT,
                                {
                                  method: "POST",
                                  data: formData,
                                  headers: {
                                    "Content-Type": "multipart/form-data",
                                  },
                                }
                              );

                              if (!response) {
                                let errorMessage = `Upload failed with status ${response.status}`;
                                try {
                                  const errorData = await response.data;
                                  console.error(
                                    "API Error Response:",
                                    errorData
                                  );
                                  errorMessage =
                                    errorData.message ||
                                    errorData.error ||
                                    errorMessage;
                                  if (Array.isArray(errorData.message)) {
                                    errorMessage = errorData.message.join(", ");
                                  }
                                } catch (parseError) {
                                  const errorText = await response;
                                  console.error(
                                    "Raw error response:",
                                    errorText
                                  );
                                  errorMessage = errorText || errorMessage;
                                }
                                throw new Error(errorMessage);
                              }

                              const result = await response.data;
                              console.log(
                                "Upload successful - Full response:",
                                result
                              );

                              // Try multiple possible URL field names
                              const fileUrl =
                                result.url ||
                                result.file_url ||
                                result.fileUrl ||
                                result.downloadUrl ||
                                result.path ||
                                result.location ||
                                result.data?.url ||
                                result.data?.file_url;

                              console.log("Extracted file URL:", fileUrl);
                              console.log(
                                "Available response keys:",
                                Object.keys(result)
                              );

                              if (!fileUrl) {
                                console.error(
                                  "No file URL found in response. Available fields:",
                                  Object.keys(result)
                                );
                                throw new Error(
                                  `No file URL returned from server. Response keys: ${Object.keys(result).join(", ")}`
                                );
                              }

                              setUploadedFileUrl(fileUrl);

                              // Detect resource type
                              const detectedType = getResourceType(
                                fileUrl,
                                file.name
                              );
                              setResourceType(detectedType);

                              console.log(
                                "File upload completed successfully:",
                                {
                                  url: fileUrl,
                                  type: detectedType,
                                  uploadedFileUrl: fileUrl,
                                }
                              );

                              toast({
                                title: "File Uploaded Successfully",
                                description: `${file.name} has been uploaded as a ${detectedType.toLowerCase()} resource.`,
                              });
                            } catch (error) {
                              console.error("Upload error:", error);
                              toast({
                                title: "Upload Failed",
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to upload file. Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsMainFileUploading(false);
                              // Reset the input
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* {getResourceTypeIcon(resourceType)} */}
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                ✓ File uploaded successfully
                              </p>
                              <p className="text-xs text-green-600">
                                {uploadedFileUrl.split("/").pop()} (
                                {resourceType})
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById("main-file-input")
                                  ?.click()
                              }
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Change File
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadedFileUrl(null);
                                setResourceType("VIDEO");
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* File validation info */}
                    <div className="text-xs text-gray-500 text-center">
                      <p>
                        Supported formats: MP4, MOV, MP3, WAV, PDF, DOC, DOCX,
                        JPG, PNG
                      </p>
                      <p>Maximum file size: 50MB</p>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Image className="h-4 w-4 text-gray-500" />
                    <Label className="text-sm font-medium">
                      Thumbnail Image (Optional)
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload a preview image for your resource
                  </p>

                  {/* Custom Thumbnail Selection and Upload */}
                  <div className="space-y-3">
                    {!uploadedThumbnailUrl ? (
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          onClick={() =>
                            document
                              .getElementById("thumbnail-file-input")
                              ?.click()
                          }
                          disabled={isThumbnailUploading}
                        >
                          {isThumbnailUploading ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Image className="h-4 w-4 mr-2" />
                              Choose Thumbnail
                            </>
                          )}
                        </Button>

                        {/* Hidden thumbnail file input */}
                        <input
                          id="thumbnail-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Validate file size
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: "Image Too Large",
                                description:
                                  "Please select an image smaller than 5MB.",
                                variant: "destructive",
                              });
                              return;
                            }

                            setIsThumbnailUploading(true);

                            try {
                              console.log(
                                "Starting thumbnail upload to:",
                                UPLOAD_ENDPOINT
                              );
                              console.log("Using authentication: Bearer token");
                              console.log("Thumbnail details:", {
                                name: file.name,
                                size:
                                  (file.size / 1024 / 1024).toFixed(2) + "MB",
                                type: file.type,
                              });
                              console.log(
                                "Sending only file data (no additional metadata)"
                              );

                              // Create FormData
                              const formData = new FormData();
                              formData.append("file", file);
                              // Remove type and entity_type fields as API doesn't expect them

                              // Upload to server
                              const response = await apiRequest(
                                UPLOAD_ENDPOINT,
                                {
                                  method: "POST",
                                  data: formData,
                                  headers: {
                                    "Content-Type": "multipart/form-data",
                                  },
                                }
                              );

                              if (!response) {
                                let errorMessage = `Thumbnail upload failed with status ${response.status}`;
                                try {
                                  const errorData = await response;
                                  console.error(
                                    "Thumbnail API Error Response:",
                                    errorData
                                  );
                                  errorMessage =
                                    errorData.message ||
                                    errorData.error ||
                                    errorMessage;
                                  if (Array.isArray(errorData.message)) {
                                    errorMessage = errorData.message.join(", ");
                                  }
                                } catch (parseError) {
                                  const errorText = await response;
                                  console.error(
                                    "Raw thumbnail error response:",
                                    errorText
                                  );
                                  errorMessage = errorText || errorMessage;
                                }
                                throw new Error(errorMessage);
                              }

                              const result = await response;
                              console.log(
                                "Thumbnail upload successful - Full response:",
                                result
                              );

                              // Try multiple possible URL field names
                              const imageUrl =
                                result.url ||
                                result.image_url ||
                                result.fileUrl ||
                                result.file_url ||
                                result.downloadUrl ||
                                result.path ||
                                result.location ||
                                result.data?.url ||
                                result.data?.image_url;

                              console.log("Extracted thumbnail URL:", imageUrl);
                              console.log(
                                "Available response keys:",
                                Object.keys(result)
                              );

                              if (!imageUrl) {
                                console.error(
                                  "No image URL found in response. Available fields:",
                                  Object.keys(result)
                                );
                                throw new Error(
                                  `No image URL returned from server. Response keys: ${Object.keys(result).join(", ")}`
                                );
                              }

                              setUploadedThumbnailUrl(imageUrl);

                              console.log(
                                "Thumbnail upload completed successfully:",
                                {
                                  url: imageUrl,
                                  uploadedThumbnailUrl: imageUrl,
                                }
                              );

                              toast({
                                title: "Thumbnail Uploaded",
                                description: `${file.name} has been uploaded successfully.`,
                              });
                            } catch (error) {
                              console.error("Thumbnail upload error:", error);
                              toast({
                                title: "Thumbnail Upload Failed",
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to upload thumbnail. Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsThumbnailUploading(false);
                              // Reset the input
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={uploadedThumbnailUrl}
                              alt="Thumbnail preview"
                              className="h-10 w-10 rounded object-cover border border-green-300"
                            />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                ✓ Thumbnail uploaded
                              </p>
                              <p className="text-xs text-green-600">
                                {uploadedThumbnailUrl.split("/").pop()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById("thumbnail-file-input")
                                  ?.click()
                              }
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadedThumbnailUrl(null)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 text-center">
                      <p>Supported formats: JPG, PNG, GIF, WebP</p>
                      <p>Maximum file size: 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Basic Information
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      placeholder="e.g., Beginner Salsa Routine"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="29.99"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    required
                    placeholder="Describe what students will learn from this resource..."
                  />
                </div>
              </div>

              <Separator />

              {/* Dance Specifics */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Dance Specifics
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="danceStyle">Dance Style *</Label>
                    <Select name="danceStyle" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dance style" />
                      </SelectTrigger>
                      <SelectContent>
                        {DANCE_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficultyLevel">Difficulty Level *</Label>
                    <Select name="difficultyLevel" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ageRange">Age Range *</Label>
                    <Select name="ageRange" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age range" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Resource Type Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Resource Type *
                </Label>
                <Select
                  value={resourceType}
                  onValueChange={(val) => setResourceType(val as ResourceType)}
                  required
                  name="resourceType"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ResourceType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryId">Category (Optional)</Label>
                  <Select name="categoryId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add is_featured checkbox to the form */}
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={is_featured}
                    onChange={(e) => setis_featured(e.target.checked)}
                    name="is_featured"
                  />
                  <span>Featured Resource</span>
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              {/* Status indicator for form completion */}
              <div className="flex-1 text-left">
                {!uploadedFileUrl && (
                  <div className="text-sm text-amber-600 mb-2">
                    {/* <span className="font-medium">⚠️ Upload a main file to enable resource creation</span> */}
                  </div>
                )}
                {uploadedFileUrl && !createResourceMutation.isPending && (
                  <div className="text-sm text-green-600 mb-2">
                    <span className="font-medium">
                      ✅ Ready to create resource
                    </span>
                  </div>
                )}
                {(isMainFileUploading || isThumbnailUploading) && (
                  <div className="text-sm text-blue-600 mb-2">
                    <span className="font-medium">
                      ⏳ Upload in progress...
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createResourceMutation.isPending ||
                    // !uploadedFileUrl ||
                    isMainFileUploading ||
                    isThumbnailUploading
                  }
                  className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createResourceMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Resource"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Make changes to the resource properties below.
            </DialogDescription>
          </DialogHeader>

          {selectedResource && (
            <form onSubmit={handleUpdateResource}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={selectedResource.title}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={selectedResource.description}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="danceStyle">Dance Style</Label>
                      <Select
                        name="danceStyle"
                        defaultValue={selectedResource.danceStyle}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dance style" />
                        </SelectTrigger>
                        <SelectContent>
                          {DANCE_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                      <Select
                        name="difficultyLevel"
                        defaultValue={selectedResource.difficultyLevel}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ageRange">Age Range</Label>
                      <Select
                        name="ageRange"
                        defaultValue={selectedResource.ageRange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_RANGES.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={selectedResource.price || "0.00"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        name="status"
                        defaultValue={selectedResource.status || "pending"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="is_featured"
                        name="is_featured"
                        defaultChecked={selectedResource.is_featured}
                      />
                      <Label htmlFor="is_featured">Featured Resource</Label>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateResourceMutation.isPending}
                >
                  {updateResourceMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedResource && (
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center overflow-hidden">
                  {selectedResource.thumbnailUrl ? (
                    <img
                      src={selectedResource.thumbnailUrl}
                      alt={selectedResource.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{selectedResource.title}</div>
                  <div className="text-sm text-gray-400">
                    {selectedResource.danceStyle} •{" "}
                    {selectedResource.difficultyLevel}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedResource &&
                deleteResourceMutation.mutate(selectedResource.id)
              }
              disabled={deleteResourceMutation.isPending}
            >
              {deleteResourceMutation.isPending
                ? "Deleting..."
                : "Delete Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
