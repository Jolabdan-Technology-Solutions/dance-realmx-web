import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronLeft, Save, User, Key, CreditCard } from "lucide-react";

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
  roles: z.array(z.string()).optional(),
});

const userSubscriptionSchema = z.object({
  subscriptionPlanId: z.coerce.number().nullable().optional(),
  subscriptionStatus: z.string().nullable().optional(),
  subscriptionExpiresAt: z.string().optional(),
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
    },
  });

  // Subscription form
  const subscriptionForm = useForm<z.infer<typeof userSubscriptionSchema>>({
    resolver: zodResolver(userSubscriptionSchema),
    defaultValues: {
      subscriptionPlanId: null,
      subscriptionStatus: null,
      subscriptionExpiresAt: "",
    },
  });

  // Fetch user details
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest(`/api/users/${userId}`, { method: "GET" });
      setUser(res);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!isNaN(userId)) fetchUser();
  }, [userId]);

  // Fetch subscription plans
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const fetchSubscriptionPlans = async () => {
    const res = await apiRequest("/api/subscriptions/plans", { method: "GET" });
    setSubscriptionPlans(res);
  };
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      // Profile form
      profileForm.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }
  }, [user]);

  // Update user profile
  const updateProfile = async (data: z.infer<typeof userProfileSchema>) => {
    try {
      await apiRequest(`/api/users/${userId}`, { method: "PATCH", data });
      toast({
        title: "Profile updated",
        description: "User profile has been updated successfully.",
      });
      fetchUser();
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update user subscription
  const updateSubscription = async (
    data: z.infer<typeof userSubscriptionSchema>
  ) => {
    try {
      await apiRequest(`/api/users/${userId}/subscription`, {
        method: "PATCH",
        data,
      });
      toast({
        title: "Subscription updated",
        description: "User subscription has been updated successfully.",
      });
      fetchUser();
    } catch (error: any) {
      toast({
        title: "Failed to update subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle form submissions
  // Utility function to synchronize roles with primary role
  const synchronizeRolesWithPrimaryRole = (
    data: z.infer<typeof userProfileSchema>
  ) => {
    // Create a new object to avoid mutating the original
    const updatedData = { ...data };

    // If roles array is present and not empty, set primary role from first role
    if (Array.isArray(updatedData.roles) && updatedData.roles.length > 0) {
      updatedData.role = updatedData.roles[0];
    }
    // Otherwise, if primary role is set but roles array is empty or undefined, initialize roles array
    else if (
      updatedData.role &&
      (!Array.isArray(updatedData.roles) || updatedData.roles.length === 0)
    ) {
      updatedData.roles = [updatedData.role];
    }

    return updatedData;
  };

  const onSubmitProfile = (data: z.infer<typeof userProfileSchema>) => {
    updateProfile(data);
  };

  const onSubmitSubscription = (
    data: z.infer<typeof userSubscriptionSchema>
  ) => {
    updateSubscription(data);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/users")}
          >
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
                  Update user profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                    className="space-y-4"
                  >
                    <FormField
                      control={profileForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="First name"
                              {...field}
                              value={field.value || ""}
                            />
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
                            <Input
                              placeholder="Last name"
                              {...field}
                              value={field.value || ""}
                            />
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
                            <Input
                              placeholder="Email"
                              {...field}
                              readOnly
                              value={field.value || ""}
                            />
                          </FormControl>
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

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage user subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...subscriptionForm}>
                  <form
                    onSubmit={subscriptionForm.handleSubmit(
                      onSubmitSubscription
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={subscriptionForm.control}
                      name="subscriptionPlanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription Plan</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subscriptionPlans.map((plan) => (
                                <SelectItem
                                  key={plan.id}
                                  value={plan.id.toString()}
                                >
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
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
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
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                            />
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
