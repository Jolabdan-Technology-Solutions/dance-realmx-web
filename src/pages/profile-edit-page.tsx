import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  User as UserIcon,
  KeyRound,
  Users,
} from "lucide-react";
import { AuthWrapper } from "@/lib/auth-wrapper";

// Form validation schemas
const userDetailsSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const profileDetailsSchema = z.object({
  bio: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip_code: z.string().optional(),
  location: z.string().optional(),
  travel_distance: z.number().optional(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  session_duration: z.number().optional(),
  years_experience: z.number().optional(),
  portfolio: z.string().url().optional().or(z.literal("")),
  service_category: z.array(z.string()).optional(),
  dance_style: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  role: string[];
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: number;
    user_id: number;
    bio?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    is_professional?: boolean;
    is_verified?: boolean;
    service_category?: string[];
    dance_style?: string[];
    location?: string;
    travel_distance?: number;
    price_min?: number;
    price_max?: number;
    session_duration?: number;
    years_experience?: number;
    services?: string[];
    availability?: Array<{
      start_date: string;
      end_date: string;
      time_slots: string[];
    }>;
    portfolio?: string;
    pricing?: number;
  };
}

function ProfileEditContent() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Forms
  const userDetailsForm = useForm<z.infer<typeof userDetailsSchema>>({
    resolver: zodResolver(userDetailsSchema),
  });

  const profileDetailsForm = useForm<z.infer<typeof profileDetailsSchema>>({
    resolver: zodResolver(profileDetailsSchema),
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiRequest(
          `/api/me`,
          {
            method: "GET",
            requireAuth: true,
          }
        );
        setProfile(result);

        // Initialize user details form
        userDetailsForm.reset({
          first_name: result.first_name || "",
          last_name: result.last_name || "",
          email: result.email || "",
          username: result.username || "",
        });

        // Initialize profile details form
        profileDetailsForm.reset({
          bio: result.profile?.bio || "",
          phone_number: result.profile?.phone_number || "",
          address: result.profile?.address || "",
          city: result.profile?.city || "",
          state: result.profile?.state || "",
          country: result.profile?.country || "",
          zip_code: result.profile?.zip_code || "",
          location: result.profile?.location || "",
          travel_distance: result.profile?.travel_distance || 0,
          price_min: result.profile?.price_min || 0,
          price_max: result.profile?.price_max || 0,
          session_duration: result.profile?.session_duration || 0,
          years_experience: result.profile?.years_experience || 0,
          portfolio: result.profile?.portfolio || "",
          service_category: result.profile?.service_category || [],
          dance_style: result.profile?.dance_style || [],
          services: result.profile?.services || [],
        });
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, userDetailsForm, profileDetailsForm, toast]);

  // Mutations
  const updateUserDetailsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userDetailsSchema>) => {
      return await apiRequest(
        `/api/users/${user?.id}`,
        {
          method: "PATCH",
          data,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileDetailsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileDetailsSchema>) => {
      return await apiRequest(
        `/api/profiles/me`,
        {
          method: "PATCH",
          data,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return await apiRequest(
        `/api/change-password`,
        {
          method: "POST",
          data,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitUserDetails = (data: z.infer<typeof userDetailsSchema>) => {
    updateUserDetailsMutation.mutate(data);
  };

  const onSubmitProfileDetails = (
    data: z.infer<typeof profileDetailsSchema>
  ) => {
    updateProfileDetailsMutation.mutate(data);
  };

  const onSubmitPassword = (data: z.infer<typeof passwordSchema>) => {
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600">Update your account information</p>
          </div>
        </div>

        <Tabs defaultValue="user-details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="user-details"
              className="flex items-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              User Details
            </TabsTrigger>
            <TabsTrigger
              value="profile-details"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Profile Details
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Password
            </TabsTrigger>
          </TabsList>

          {/* User Details Tab */}
          <TabsContent value="user-details">
            <Card>
              <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>
                  Update your basic account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...userDetailsForm}>
                  <form
                    onSubmit={userDetailsForm.handleSubmit(onSubmitUserDetails)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={userDetailsForm.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userDetailsForm.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={userDetailsForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" readOnly {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={updateUserDetailsMutation.isPending}
                      className="w-full"
                    >
                      {updateUserDetailsMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Save User Details
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Details Tab */}
          <TabsContent value="profile-details">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                  Update your professional profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileDetailsForm}>
                  <form
                    onSubmit={profileDetailsForm.handleSubmit(
                      onSubmitProfileDetails
                    )}
                    className="space-y-6"
                  >
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Basic Information
                      </h3>
                      <FormField
                        control={profileDetailsForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Tell us about yourself..."
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileDetailsForm.control}
                        name="phone_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1234567890" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileDetailsForm.control}
                        name="portfolio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://your-portfolio.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Location Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileDetailsForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="123 Main St" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileDetailsForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="New York" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileDetailsForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="NY" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileDetailsForm.control}
                          name="zip_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="10001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileDetailsForm.control}
                        name="travel_distance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Travel Distance (miles)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                placeholder="25"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Professional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Professional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileDetailsForm.control}
                          name="years_experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of Experience</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  placeholder="5"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileDetailsForm.control}
                          name="session_duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Duration (minutes)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  placeholder="60"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileDetailsForm.control}
                          name="price_min"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Price ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  placeholder="50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileDetailsForm.control}
                          name="price_max"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Price ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  placeholder="150"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={updateProfileDetailsMutation.isPending}
                      className="w-full"
                    >
                      {updateProfileDetailsMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Save Profile Details
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
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
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={updatePasswordMutation.isPending}
                      className="w-full"
                    >
                      {updatePasswordMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <AuthWrapper>
      <ProfileEditContent />
    </AuthWrapper>
  );
}
