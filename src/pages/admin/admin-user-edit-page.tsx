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
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  profile_image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// Form validation schemas
const userProfileSchema = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").nullable().optional(),
  bio: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().optional(),
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
      first_name: "",
      last_name: "",
      email: "",
      bio: "",
      profile_image_url: "",
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
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        bio: user.bio,
        profile_image_url: user.profile_image_url,
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
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Edit User</h1>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="password">
              <Key className="h-4 w-4 mr-2" />
              Password
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
                <CardDescription>Update user profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="profile_image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="Profile image URL" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(USER_ROLES).map(([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update user password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
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
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage user subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...subscriptionForm}>
                  <form onSubmit={subscriptionForm.handleSubmit(onSubmitSubscription)} className="space-y-4">
                    <FormField
                      control={subscriptionForm.control}
                      name="subscriptionPlanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription Plan</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subscriptionPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
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
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
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
                            <Input type="date" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Update Subscription
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}