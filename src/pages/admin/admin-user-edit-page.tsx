import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { USER_ROLES } from "@/constants/roles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  ChevronLeft, 
  Save, 
  User, 
  Key, 
  Mail, 
  BadgeCheck,
  CreditCard,
  Calendar,
  Check
} from "lucide-react";

// Utility function to handle role toggling
const handleRoleToggle = (
  field: ControllerRenderProps<any, "roles">, 
  roleValue: string,
  checked: boolean | string
) => {
  // Ensure we're working with an array
  const currentRoles = Array.isArray(field.value) ? field.value : [];
  
  // Convert checked to boolean if it's a string
  const isChecked = typeof checked === 'string' ? checked === 'true' : checked;
  
  if (isChecked) {
    // Add the role if checked
    field.onChange([...currentRoles, roleValue]);
  } else {
    // Remove the role if unchecked
    field.onChange(currentRoles.filter(role => role !== roleValue));
  }
};

interface User {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  roles: string[] | null; // Multi-role support
  bio: string | null;
  profileImageUrl: string | null;
  subscriptionPlanId: number | null;
  subscriptionType: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  subscriptionExpiresAt: Date | null;
}

// Form validation schemas
const userProfileSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").nullable().optional(),
  bio: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  role: z.string(), // Keep for backwards compatibility
  roles: z.array(z.string()).optional()
});

const userPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const userSubscriptionSchema = z.object({
  subscriptionPlanId: z.coerce.number().nullable().optional(),
  subscriptionStatus: z.string().nullable().optional(),
  subscriptionExpiresAt: z.string().optional()
});

export default function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const userId = parseInt(id);
  
  // Profile form
  const profileForm = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      bio: "",
      profileImageUrl: "",
      role: USER_ROLES.USER,
      roles: []
    }
  });
  
  // Password form
  const passwordForm = useForm<z.infer<typeof userPasswordSchema>>({
    resolver: zodResolver(userPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });
  
  // Subscription form
  const subscriptionForm = useForm<z.infer<typeof userSubscriptionSchema>>({
    resolver: zodResolver(userSubscriptionSchema),
    defaultValues: {
      subscriptionPlanId: null,
      subscriptionStatus: null,
      subscriptionExpiresAt: ""
    }
  });
  
  // Fetch user details
  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: [`/api/admin/users/${userId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}`);
      return res.json();
    },
    enabled: !isNaN(userId)
  });
  
  // Fetch subscription plans
  const { data: subscriptionPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return res.json();
    }
  });
  
  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      // Profile form
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        role: user.role || USER_ROLES.USER,
        roles: user.roles || []
      });
      
      // Subscription form
      subscriptionForm.reset({
        subscriptionPlanId: user.subscriptionPlanId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt 
          ? new Date(user.subscriptionExpiresAt).toISOString().substring(0, 10)
          : undefined
      });
    }
  }, [user]);
  
  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userProfileSchema>) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "User profile has been updated successfully.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update user password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/password`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "User password has been updated successfully.",
      });
      passwordForm.reset({
        password: "",
        confirmPassword: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update user subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userSubscriptionSchema>) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/subscription`, {
        ...data,
        subscriptionExpiresAt: data.subscriptionExpiresAt 
          ? new Date(data.subscriptionExpiresAt) 
          : null
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "User subscription has been updated successfully.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  // Utility function to synchronize roles with primary role
  const synchronizeRolesWithPrimaryRole = (data: z.infer<typeof userProfileSchema>) => {
    // Create a new object to avoid mutating the original
    const updatedData = { ...data };
    
    // If roles array is present and not empty, set primary role from first role
    if (Array.isArray(updatedData.roles) && updatedData.roles.length > 0) {
      updatedData.role = updatedData.roles[0];
    } 
    // Otherwise, if primary role is set but roles array is empty or undefined, initialize roles array
    else if (updatedData.role && (!Array.isArray(updatedData.roles) || updatedData.roles.length === 0)) {
      updatedData.roles = [updatedData.role];
    }
    
    return updatedData;
  };

  const onSubmitProfile = (data: z.infer<typeof userProfileSchema>) => {
    // Synchronize roles with primary role before sending to API
    const updatedData = synchronizeRolesWithPrimaryRole(data);
    
    // Transform roles field to selectedRoles as expected by the server API
    const apiData = {
      ...updatedData,
      selectedRoles: updatedData.roles // Server expects 'selectedRoles' instead of 'roles'
    };
    
    updateProfileMutation.mutate(apiData);
  };
  
  const onSubmitPassword = (data: z.infer<typeof userPasswordSchema>) => {
    updatePasswordMutation.mutate({ password: data.password });
  };
  
  const onSubmitSubscription = (data: z.infer<typeof userSubscriptionSchema>) => {
    updateSubscriptionMutation.mutate(data);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate("/admin/users")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
            <p className="text-gray-400">
              {isLoading ? "Loading..." : `Editing ${user?.username || 'unknown user'}`}
            </p>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      ) : (
        <>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security">
                <Key className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="subscription">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Update the user's profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="First name" {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Last name" {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="user@example.com" {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="roles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>User Roles</FormLabel>
                            <FormDescription>
                              Assign multiple roles to this user to control their access and permissions
                            </FormDescription>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="user-role"
                                  checked={Array.isArray(field.value) && field.value.includes(USER_ROLES.USER)}
                                  onCheckedChange={(checked) => handleRoleToggle(field, USER_ROLES.USER, checked)}
                                />
                                <label
                                  htmlFor="user-role"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  User
                                </label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="instructor-role"
                                  checked={Array.isArray(field.value) && field.value.includes(USER_ROLES.INSTRUCTOR)}
                                  onCheckedChange={(checked) => handleRoleToggle(field, USER_ROLES.INSTRUCTOR, checked)}
                                />
                                <label
                                  htmlFor="instructor-role"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Instructor
                                </label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="moderator-role"
                                  checked={Array.isArray(field.value) && field.value.includes(USER_ROLES.MODERATOR)}
                                  onCheckedChange={(checked) => handleRoleToggle(field, USER_ROLES.MODERATOR, checked)}
                                />
                                <label
                                  htmlFor="moderator-role"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Moderator
                                </label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="admin-role"
                                  checked={Array.isArray(field.value) && field.value.includes(USER_ROLES.ADMIN)}
                                  onCheckedChange={(checked) => handleRoleToggle(field, USER_ROLES.ADMIN, checked)}
                                />
                                <label
                                  htmlFor="admin-role"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Admin
                                </label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="seller-role"
                                  checked={Array.isArray(field.value) && field.value.includes(USER_ROLES.SELLER)}
                                  onCheckedChange={(checked) => handleRoleToggle(field, USER_ROLES.SELLER, checked)}
                                />
                                <label
                                  htmlFor="seller-role"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Seller
                                </label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="curriculum-officer-role"
                                  checked={Array.isArray(field.value) && field.value.includes(USER_ROLES.CURRICULUM_OFFICER)}
                                  onCheckedChange={(checked) => handleRoleToggle(field, USER_ROLES.CURRICULUM_OFFICER, checked)}
                                />
                                <label
                                  htmlFor="curriculum-officer-role"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Curriculum Officer
                                </label>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {/* Keep legacy role field for backward compatibility */}
                      <input type="hidden" {...profileForm.register("role")} />
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="User biography or description" 
                                {...field} 
                                value={field.value || ""} 
                                className="min-h-32"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="profileImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <FileUpload
                                  onUploadComplete={(url) => field.onChange(url)}
                                  defaultValue={field.value || ""}
                                  uploadEndpoint="/api/profile/upload"
                                  acceptedTypes="image/*"
                                  label="Profile Image"
                                  buttonText="Choose profile image"
                                />
                                {field.value && !field.value.startsWith('data:') && (
                                  <div className="text-sm text-muted-foreground">
                                    Current URL: {field.value}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700" 
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update the user's password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="New password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700" 
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? (
                            <>Updating...</>
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-2" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Settings</CardTitle>
                  <CardDescription>
                    Manage the user's subscription plan and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...subscriptionForm}>
                    <form onSubmit={subscriptionForm.handleSubmit(onSubmitSubscription)} className="space-y-6">
                      <FormField
                        control={subscriptionForm.control}
                        name="subscriptionPlanId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subscription Plan</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))} 
                              defaultValue={field.value?.toString() || "null"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subscription plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="null">No Subscription</SelectItem>
                                {subscriptionPlans.map((plan) => (
                                  <SelectItem key={plan.id} value={plan.id.toString()}>
                                    {plan.name} (${plan.priceMonthly}/month)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={subscriptionForm.control}
                        name="subscriptionStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || "null"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="null">None</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                                <SelectItem value="past_due">Past Due</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={subscriptionForm.control}
                        name="subscriptionExpiresAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormDescription>
                              When the subscription expires
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700" 
                          disabled={updateSubscriptionMutation.isPending}
                        >
                          {updateSubscriptionMutation.isPending ? (
                            <>Updating...</>
                          ) : (
                            <>
                              <BadgeCheck className="h-4 w-4 mr-2" />
                              Update Subscription
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}