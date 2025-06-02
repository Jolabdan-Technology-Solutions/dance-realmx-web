import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/user";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { CachedImage } from "@/components/ui/cached-image";
import { Loader2, ArrowLeft, Save, User as UserIcon, KeyRound } from "lucide-react";
import { AuthWrapper } from "@/lib/auth-wrapper";

// Form validation schemas
const userProfileSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  bio: z.string().optional().nullable(),
  profile_image_url: z.string().optional().nullable(),
});

const userPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

function ProfileEditContent() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Profile form
  const profileForm = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      bio: "",
      profile_image_url: "",
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

  // Initialize forms with user data
  useEffect(() => {
    if (user) {
      profileForm.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        bio: user.bio,
        profile_image_url: user.profile_image_url,
      });
      setIsLoading(false);
    }
  }, [user, profileForm]);
  
  // Listen for profile image updates from the FileUpload component
  useEffect(() => {
    // Event handler for profile image updates
    const handleProfileImageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ url: string }>;
      console.log("Profile image updated event received:", customEvent.detail.url);
      
      // Force refetch user data to get the updated profile image
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Also update the form with the new image URL
      profileForm.setValue("profile_image_url", customEvent.detail.url);
    };
    
    // Add event listener
    document.addEventListener('profile-image-updated', handleProfileImageUpdate);
    
    // Cleanup
    return () => {
      document.removeEventListener('profile-image-updated', handleProfileImageUpdate);
    };
  }, [profileForm]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userProfileSchema>) => {
      console.log("Updating profile with data:", data);
      const res = await apiRequest("PATCH", `/api/users/profile`, data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      console.log("Profile updated successfully:", updatedUser);
      
      // Immediately update the user in the cache
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      // Force refetch to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Also invalidate any user-specific queries
      if (updatedUser.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${updatedUser.id}`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await apiRequest("PATCH", `/api/users/password`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      
      // Reset the password form
      passwordForm.reset({
        password: "",
        confirmPassword: ""
      });
      
      // Refresh user data to ensure everything is in sync
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: z.infer<typeof userProfileSchema>) => {
    // Make sure we're logging the data we're submitting for debugging
    console.log("Submitting profile data:", data);
    
    // Ensure we're correctly handling the profile image URL
    const formData = {
      ...data,
      // Make sure we're passing the profile_image_url exactly as it was set by the FileUpload component
      profile_image_url: data.profile_image_url || null
    };
    
    console.log("Final formData with profile_image_url:", formData.profile_image_url);
    
    updateProfileMutation.mutate(formData, {
      onSuccess: (updatedUser) => {
        console.log("Profile updated successfully, user data:", updatedUser);
        
        // Add timestamp to image URL to force refresh in UI
        if (updatedUser.profile_image_url) {
          // Update the user in cache with timestamped image URL for immediate UI refresh
          // First, clean any existing timestamp parameter
          const baseUrl = updatedUser.profile_image_url.split('?')[0];
          const userWithTimestampedImage = {
            ...updatedUser,
            // Apply cleaned URL with new timestamp for proper cache busting
            profile_image_url: `${baseUrl}?t=${Date.now()}`
          };
          queryClient.setQueryData(["/api/user"], userWithTimestampedImage);
          
          // Also update user-specific queries if needed
          if (updatedUser.id) {
            queryClient.setQueryData([`/api/users/${updatedUser.id}`], userWithTimestampedImage);
            queryClient.setQueryData([`/api/instructors/${updatedUser.id}`], userWithTimestampedImage);
          }
        }
        
        // Log the timestamp-updated user cache data
        console.log("Updated user cache data with timestamped profile image URL");
        
        // Navigate back to dashboard after successful update
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000); // Short delay to show success message
      }
    });
  };

  const onSubmitPassword = (data: z.infer<typeof userPasswordSchema>) => {
    updatePasswordMutation.mutate({ password: data.password });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to edit your profile.</p>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/dashboard")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <KeyRound className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about yourself" 
                              {...field} 
                              value={field.value || ""} 
                              className="min-h-32"
                            />
                          </FormControl>
                          <FormDescription>
                            This bio will be visible on your public profile.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="profile_image_url"
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
                              {field.value && (
                                <div className="mt-2">
                                  <div className="text-sm text-muted-foreground mb-2">
                                    Current profile image preview:
                                  </div>
                                  <div className="w-24 h-24">
                                    <CachedAvatar
                                      src={field.value}
                                      alt={`${user?.first_name || user?.username || "User"}'s Profile`}
                                      className="w-full h-full border-2 border-primary/30"
                                      fallbackText={user?.first_name?.[0] || user?.username?.[0] || "U"}
                                      forceCacheBusting={true}
                                    />
                                  </div>
                                  <div className="mt-2">
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        navigate("/profile-image-debug");
                                      }}
                                    >
                                      Having issues? Use Debug Tool
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
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
                  Update your password to keep your account secure
                </CardDescription>
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
                            <Input type="password" placeholder="New password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Must be at least 6 characters long.
                          </FormDescription>
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
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                        disabled={updatePasswordMutation.isPending}
                      >
                        {updatePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
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
        </Tabs>
      )}
    </div>
  );
}

// Export the wrapped component
export default function ProfileEditPage() {
  return (
    <AuthWrapper>
      <ProfileEditContent />
    </AuthWrapper>
  );
}