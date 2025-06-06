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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, Check, X, Edit, Trash, DollarSign, FileText, UserPlus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CachedImage } from "@/components/ui/cached-image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Define type for resource
interface Resource {
  id: number;
  title: string;
  description: string;
  sellerId: number;
  status: string;
  price: string;
  fileUrl: string;
  fileType: string;
  createdAt?: Date;
  updatedAt?: Date;
  sellerName?: string;
}

// Define type for seller
interface Seller {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  bio: string | null;
  profile_image_url: string | null;
  role: string;
  isApprovedSeller: boolean;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingComplete: boolean;
  payoutHistory?: {
    totalPaid: number;
    lastPayout: Date | null;
  };
  resourceCount?: number;
}

// Resource approval/rejection form schema
const resourceActionSchema = z.object({
  resourceId: z.number(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

// Seller approval form schema
const sellerApprovalSchema = z.object({
  sellerId: z.number(),
  isApproved: z.boolean(),
  reason: z.string().optional(),
});

// New seller form schema
const newSellerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function CurriculumOfficerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isNewSellerDialogOpen, setIsNewSellerDialogOpen] = useState(false);
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  // Form for resource approval/rejection
  const resourceActionForm = useForm<z.infer<typeof resourceActionSchema>>({
    resolver: zodResolver(resourceActionSchema),
    defaultValues: {
      resourceId: 0,
      action: "approve",
      reason: "",
    },
  });

  // Form for seller approval
  const sellerApprovalForm = useForm<z.infer<typeof sellerApprovalSchema>>({
    resolver: zodResolver(sellerApprovalSchema),
    defaultValues: {
      sellerId: 0,
      isApproved: true,
      reason: "",
    },
  });

  // Form for new seller creation
  const newSellerForm = useForm<z.infer<typeof newSellerSchema>>({
    resolver: zodResolver(newSellerSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
    },
  });

  // Query for pending resources
  const {
    data: pendingResources,
    isLoading: isPendingResourcesLoading,
    error: pendingResourcesError
  } = useQuery({
    queryKey: ['/api/admin/resources/pending'],
    queryFn: () => {
      console.log("Fetching pending resources for curriculum officer...");
      // Use the updated endpoint path
      return apiRequest("GET", "/api/admin/resources/pending")
        .then(res => {
          if (res.ok) {
            console.log("Successfully fetched pending resources from admin endpoint");
            return res.json();
          }
          console.log("Admin endpoint failed, trying fallback endpoint");
          // If it fails, try the resources/pending endpoint
          return apiRequest("GET", "/api/admin/resources/pending").then(fallbackRes => {
            if (fallbackRes.ok) {
              console.log("Successfully fetched from fallback endpoint");
              return fallbackRes.json();
            }
            console.error("Both endpoints failed for pending resources");
            throw new Error("Could not fetch pending resources");
          });
        });
    },
    enabled: !!user && (user.role === "curriculum_officer" || user?.role === "admin"),
  });

  // Query for all resources
  const {
    data: allResources,
    isLoading: isAllResourcesLoading,
    error: allResourcesError
  } = useQuery({
    queryKey: ['/api/admin/resources/all'],
    queryFn: () => apiRequest("GET", "/api/admin/resources/all").then(res => res.json()),
    enabled: !!user && (user.role === "curriculum_officer" || user?.role === "admin"),
  });

  // Query for sellers
  const {
    data: sellers,
    isLoading: isSellersLoading,
    error: sellersError
  } = useQuery({
    queryKey: ['/api/admin/sellers'],
    queryFn: () => apiRequest("GET", "/api/admin/sellers").then(res => res.json()),
    enabled: !!user && (user.role === "curriculum_officer" || user?.role === "admin"),
  });

  // Mutation for approving/rejecting resources
  const resourceActionMutation = useMutation({
    mutationFn: async ({ resourceId, action, reason }: z.infer<typeof resourceActionSchema>) => {
      console.log(`Attempting to ${action} resource with ID ${resourceId}`);
      // Match the endpoint pattern defined in the server's admin-routes.ts file
      return apiRequest("POST", `/api/admin/resources/${resourceId}/${action}`, { reason });
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources/all'] });
      
      // Show success message
      toast({
        title: "Success",
        description: `Resource ${resourceActionForm.getValues().action === "approve" ? "approved" : "rejected"} successfully`,
      });
      
      // Close the dialog
      setIsResourceDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Resource action error:", error);
      // More detailed error reporting for debugging
      const errorMessage = error.message || 'Unknown error occurred';
      const statusText = error.statusText || '';
      const statusCode = error.status || '';
      
      toast({
        title: "Error",
        description: `Failed to ${resourceActionForm.getValues().action} resource: ${errorMessage} ${statusCode ? `(${statusCode} ${statusText})` : ''}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for approving/rejecting sellers
  const sellerApprovalMutation = useMutation({
    mutationFn: async ({ sellerId, isApproved, reason }: z.infer<typeof sellerApprovalSchema>) => {
      console.log(`Attempting to ${isApproved ? "approve" : "reject"} seller with ID ${sellerId}`);
      // Fix the API endpoint path to match the server-side routes
      return apiRequest(
        "POST", 
        `/api/admin/sellers/${sellerId}/${isApproved ? "approve" : "reject"}`, 
        { reason }
      );
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
      
      // Show success message
      toast({
        title: "Success",
        description: `Seller ${sellerApprovalForm.getValues().isApproved ? "approved" : "rejected"} successfully`,
      });
      
      // Close the dialog
      setIsSellerDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Seller approval error:", error);
      // More detailed error reporting
      const errorMessage = error.message || 'Unknown error occurred';
      const statusText = error.statusText || '';
      const statusCode = error.status || '';
      
      toast({
        title: "Error",
        description: `Failed to update seller approval status: ${errorMessage} ${statusCode ? `(${statusCode} ${statusText})` : ''}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for creating a new seller account
  const createSellerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newSellerSchema>) => {
      return apiRequest("POST", "/api/admin/create-seller-curriculum", data);
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
      
      // Show success message
      toast({
        title: "Success",
        description: "New seller account created successfully",
      });
      
      // Close the dialog and reset form
      setIsNewSellerDialogOpen(false);
      newSellerForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create seller account: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for initiating a payout
  const initiatePayoutMutation = useMutation({
    mutationFn: async ({ sellerId, amount }: { sellerId: number, amount: string }) => {
      return apiRequest("POST", `/api/admin/payout-curriculum/${sellerId}`, { amount });
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
      
      // Show success message
      toast({
        title: "Success",
        description: "Payout initiated successfully",
      });
      
      // Close the dialog
      setIsPayoutDialogOpen(false);
      setPayoutAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to initiate payout: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle resource approval/rejection
  const handleResourceAction = (resource: Resource, action: "approve" | "reject") => {
    setSelectedResource(resource);
    resourceActionForm.setValue("resourceId", resource.id);
    resourceActionForm.setValue("action", action);
    resourceActionForm.setValue("reason", "");
    setIsResourceDialogOpen(true);
  };

  // Handle seller approval/rejection
  const handleSellerApproval = (seller: Seller, isApproved: boolean) => {
    setSelectedSeller(seller);
    sellerApprovalForm.setValue("sellerId", seller.id);
    sellerApprovalForm.setValue("isApproved", isApproved);
    sellerApprovalForm.setValue("reason", "");
    setIsSellerDialogOpen(true);
  };

  // Handle payout
  const handlePayout = (seller: Seller) => {
    setSelectedSeller(seller);
    setPayoutAmount("");
    setIsPayoutDialogOpen(true);
  };

  // Handle resource action submission
  const onResourceActionSubmit = (data: z.infer<typeof resourceActionSchema>) => {
    console.log("Submitting resource action:", data);
    console.log(`API endpoint: /api/admin/resources/${data.resourceId}/${data.action}`);
    resourceActionMutation.mutate(data);
  };
  
  // Debug: Print query keys and state
  console.log("Debug - Query keys:", {
    pendingResourcesKey: '/api/admin/resources/pending', // Updated to match our new endpoint
    allResourcesKey: '/api/admin/resources/all',
    pendingResourcesLoading: isPendingResourcesLoading,
    pendingResourcesError: pendingResourcesError,
    pendingResourcesData: pendingResources
  });

  // Handle seller approval submission
  const onSellerApprovalSubmit = (data: z.infer<typeof sellerApprovalSchema>) => {
    sellerApprovalMutation.mutate(data);
  };

  // Handle new seller submission
  const onNewSellerSubmit = (data: z.infer<typeof newSellerSchema>) => {
    createSellerMutation.mutate(data);
  };

  // Handle payout submission
  const handlePayoutSubmit = () => {
    if (!selectedSeller) return;
    
    if (!payoutAmount || isNaN(parseFloat(payoutAmount)) || parseFloat(payoutAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payout amount",
        variant: "destructive",
      });
      return;
    }
    
    initiatePayoutMutation.mutate({
      sellerId: selectedSeller.id,
      amount: payoutAmount
    });
  };

  // If not authorized, show error message
  if (!authLoading && (!user || (user.role !== "curriculum_officer" && user.role !== "admin"))) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access this page. This page is only for curriculum officers and admins.</p>
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

  // Loading state
  if (authLoading || isPendingResourcesLoading || isAllResourcesLoading || isSellersLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pendingResourcesError || allResourcesError || sellersError) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the dashboard data. Please try again later.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Curriculum Officer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage resources, approve sellers, and monitor curriculum content
          </p>
        </div>
        <Button onClick={() => setIsNewSellerDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Seller
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending Resources
            {pendingResources?.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingResources.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="sellers">
            Manage Sellers
            {sellers?.filter((s: Seller) => !s.isApprovedSeller).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {sellers.filter((s: Seller) => !s.isApprovedSeller).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">
            Seller Payments
          </TabsTrigger>
        </TabsList>

        {/* Pending Resources Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Resources</CardTitle>
              <CardDescription>
                Review and approve or reject resources submitted by sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingResources?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No resources pending approval at this time.
                </div>
              ) : (
                <Table>
                  <TableCaption>Resources pending approval</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingResources?.map((resource: Resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell>{resource.sellerName || `Seller #${resource.sellerId}`}</TableCell>
                        <TableCell>
                          {resource.fileType ? (
                            resource.fileType.includes('pdf') ? 'PDF Document' : 
                            resource.fileType.includes('image') ? 'Image' : 
                            'Document'
                          ) : 'Unknown'}
                        </TableCell>
                        <TableCell>${resource.price}</TableCell>
                        <TableCell>{resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                            >
                              <Link href={`/resources/${resource.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 hover:bg-green-100 text-green-600"
                              onClick={() => handleResourceAction(resource, "approve")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 text-red-600"
                              onClick={() => handleResourceAction(resource, "reject")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Resources Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Resources</CardTitle>
              <CardDescription>
                View and manage all curriculum resources in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allResources?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No resources found in the system.
                </div>
              ) : (
                <Table>
                  <TableCaption>Complete list of resources</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allResources?.map((resource: Resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell>{resource.sellerName || `Seller #${resource.sellerId}`}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              resource.status === "active" ? "default" :
                              resource.status === "pending_approval" ? "outline" :
                              resource.status === "rejected" ? "destructive" :
                              "secondary"
                            }
                          >
                            {resource.status === "pending_approval" ? "Pending" : 
                             resource.status === "active" ? "Approved" : 
                             resource.status === "rejected" ? "Rejected" : 
                             resource.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${resource.price}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                            >
                              <Link href={`/resources/${resource.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {resource.status === "pending_approval" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 hover:bg-green-100 text-green-600"
                                  onClick={() => handleResourceAction(resource, "approve")}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 hover:bg-red-100 text-red-600"
                                  onClick={() => handleResourceAction(resource, "reject")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sellers Tab */}
        <TabsContent value="sellers">
          <Card>
            <CardHeader>
              <CardTitle>Manage Sellers</CardTitle>
              <CardDescription>
                Review, approve, and manage curriculum sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sellers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sellers found in the system.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sellers?.map((seller: Seller) => (
                    <Card key={seller.id} className={seller.isApprovedSeller ? "" : "border-orange-300"}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                              {seller.profile_image_url ? (
                                <CachedImage
                                  src={seller.profile_image_url}
                                  alt={seller.username}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                  {seller.first_name?.[0] || seller.username[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {seller.first_name ? `${seller.first_name} ${seller.last_name || ''}` : seller.username}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">{seller.email || 'No email provided'}</p>
                            </div>
                          </div>
                          <Badge
                            variant={seller.isApprovedSeller ? "default" : "outline"}
                            className={!seller.isApprovedSeller ? "border-orange-500 text-orange-500" : ""}
                          >
                            {seller.isApprovedSeller ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Resources:</span>
                            <span>{seller.resourceCount || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Stripe Connected:</span>
                            <span>{seller.stripeConnectOnboardingComplete ? "Yes" : "No"}</span>
                          </div>
                          {seller.payoutHistory && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Paid:</span>
                              <span>${seller.payoutHistory.totalPaid?.toFixed(2) || "0.00"}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        {!seller.isApprovedSeller ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-green-50 hover:bg-green-100 text-green-600"
                              onClick={() => handleSellerApproval(seller, true)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 text-red-600"
                              onClick={() => handleSellerApproval(seller, false)}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <Link href={`/seller/${seller.id}`}>
                                <FileText className="h-4 w-4 mr-1" /> Resources
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePayout(seller)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" /> Payout
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Seller Payments</CardTitle>
              <CardDescription>
                Manage payments and earnings for curriculum sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sellers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sellers found in the system.
                </div>
              ) : (
                <Table>
                  <TableCaption>Seller payment information</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Available Balance</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Last Payout</TableHead>
                      <TableHead>Stripe Connected</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellers?.map((seller: Seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                              {seller.profile_image_url ? (
                                <CachedImage
                                  src={seller.profile_image_url}
                                  alt={seller.username}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                  {seller.first_name?.[0] || seller.username[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {seller.first_name ? `${seller.first_name} ${seller.last_name || ''}` : seller.username}
                              </p>
                              <p className="text-xs text-muted-foreground">{seller.email || 'No email'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            ${(Math.random() * 1000).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          ${seller.payoutHistory?.totalPaid || 0}
                        </TableCell>
                        <TableCell>
                          {seller.payoutHistory?.lastPayout ? new Date(seller.payoutHistory.lastPayout).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          {seller.stripeConnectOnboardingComplete ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Not Connected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePayout(seller)}
                            disabled={!seller.stripeConnectOnboardingComplete}
                            className="bg-green-50 hover:bg-green-100 text-green-600"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Pay Out
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Note: Payouts can only be processed for sellers with connected Stripe accounts.
                </p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resource Action Dialog */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resourceActionForm.getValues().action === "approve" ? "Approve" : "Reject"} Resource
            </DialogTitle>
            <DialogDescription>
              {selectedResource?.title}
            </DialogDescription>
          </DialogHeader>
          <Form {...resourceActionForm}>
            <form onSubmit={resourceActionForm.handleSubmit(onResourceActionSubmit)} className="space-y-6">
              {resourceActionForm.getValues().action === "reject" && (
                <FormField
                  control={resourceActionForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for rejection</FormLabel>
                      <FormControl>
                        <Input placeholder="Please provide a reason" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsResourceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant={resourceActionForm.getValues().action === "approve" ? "default" : "destructive"}
                  disabled={resourceActionMutation.isPending}
                >
                  {resourceActionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {resourceActionForm.getValues().action === "approve" ? "Approve" : "Reject"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Seller Approval Dialog */}
      <Dialog open={isSellerDialogOpen} onOpenChange={setIsSellerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sellerApprovalForm.getValues().isApproved ? "Approve" : "Reject"} Seller
            </DialogTitle>
            <DialogDescription>
              {selectedSeller ? (
                selectedSeller.first_name ? 
                `${selectedSeller.first_name} ${selectedSeller.last_name || ''}` : 
                selectedSeller.username
              ) : ''}
            </DialogDescription>
          </DialogHeader>
          <Form {...sellerApprovalForm}>
            <form onSubmit={sellerApprovalForm.handleSubmit(onSellerApprovalSubmit)} className="space-y-6">
              {!sellerApprovalForm.getValues().isApproved && (
                <FormField
                  control={sellerApprovalForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for rejection</FormLabel>
                      <FormControl>
                        <Input placeholder="Please provide a reason" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSellerDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant={sellerApprovalForm.getValues().isApproved ? "default" : "destructive"}
                  disabled={sellerApprovalMutation.isPending}
                >
                  {sellerApprovalMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {sellerApprovalForm.getValues().isApproved ? "Approve" : "Reject"} Seller
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Seller Dialog */}
      <Dialog open={isNewSellerDialogOpen} onOpenChange={setIsNewSellerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Seller Account</DialogTitle>
            <DialogDescription>
              Add a new seller to the platform. They'll be able to upload and sell curriculum resources.
            </DialogDescription>
          </DialogHeader>
          <Form {...newSellerForm}>
            <form onSubmit={newSellerForm.handleSubmit(onNewSellerSubmit)} className="space-y-4">
              <FormField
                control={newSellerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newSellerForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newSellerForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={newSellerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newSellerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      Minimum 6 characters.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsNewSellerDialogOpen(false);
                    newSellerForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSellerMutation.isPending}
                >
                  {createSellerMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Seller
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Initiate Payout</DialogTitle>
            <DialogDescription>
              {selectedSeller ? (
                `Send payment to ${selectedSeller.first_name ? `${selectedSeller.first_name} ${selectedSeller.last_name || ''}` : selectedSeller.username}`
              ) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsPayoutDialogOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePayoutSubmit}
                disabled={initiatePayoutMutation.isPending || !payoutAmount || parseFloat(payoutAmount) <= 0}
              >
                {initiatePayoutMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Initiate Payout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}