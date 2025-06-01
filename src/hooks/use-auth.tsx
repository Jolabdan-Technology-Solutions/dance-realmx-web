import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define types for our context
type LoginData = Pick<InsertUser, "username" | "password">;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 10 * 1000, // Consider data fresh for 10 seconds
  });
  
  // Listen for profile image updates and auth refresh events
  useEffect(() => {
    const handleProfileImageUpdate = (event: Event) => {
      console.log("Auth provider detected profile image update, refetching user data");
      refetch();
    };
    
    const handleAuthRefresh = () => {
      console.log("Auth refresh explicitly requested, invalidating cache and refetching");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setTimeout(() => refetch(), 100); // Small delay to ensure server-side changes are complete
    };
    
    // Listen for both types of events
    document.addEventListener('profile-image-updated', handleProfileImageUpdate);
    document.addEventListener('auth-refresh-required', handleAuthRefresh);
    
    return () => {
      document.removeEventListener('profile-image-updated', handleProfileImageUpdate);
      document.removeEventListener('auth-refresh-required', handleAuthRefresh);
    };
  }, [refetch]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login attempt with credentials:", credentials);
      
      // Make a direct fetch request for better control and debugging
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = "Login failed";
        
        try {
          // Try to parse as JSON for structured error messages
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
          console.error("Login error details:", parsedError);
        } catch (e) {
          // If not JSON, use the raw error text
          errorMessage = errorData || `Login failed: ${response.status} ${response.statusText}`;
          console.error("Login raw error:", errorData);
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    onSuccess: (user: User) => {
      console.log("Login mutation succeeded, setting user data:", user);
      
      // Update user data in the query cache
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
      
      // Manually redirect to dashboard after successful login
      window.location.href = '/dashboard';
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      
      // Provide more user-friendly error messages based on error content
      let errorMessage = error.message;
      
      if (error.message.includes("Unauthorized") || error.message.includes("401")) {
        errorMessage = "Invalid username or password. Please check your credentials and try again.";
      } else if (error.message.includes("500")) {
        errorMessage = "A server error occurred. Please try again later.";
      } else if (!errorMessage || errorMessage.trim() === "") {
        errorMessage = "Login failed. Please check your connection and try again.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log("Registration attempt with credentials:", { ...credentials, password: "[REDACTED]" });
      
      // Use a direct fetch approach for better error handling
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = "Registration failed";
        
        try {
          // Try to parse as JSON for structured error messages
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
          console.error("Registration error details:", parsedError);
        } catch (e) {
          // If not JSON, use the raw error text
          errorMessage = errorData || `Registration failed: ${response.status} ${response.statusText}`;
          console.error("Registration raw error:", errorData);
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    onSuccess: (user: User) => {
      console.log("Registration successful for user:", user.username);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to DanceRealmX, ${user.username}!`,
      });
      
      // Manually redirect to dashboard after successful registration
      window.location.href = '/dashboard';
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      // Provide a user-friendly message
      const errorMessage = error.message.includes("Username already exists") 
        ? "This username is already taken. Please try another one."
        : error.message || "Registration failed. Please check your information and try again.";
        
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear all query cache to ensure proper state update
      queryClient.clear();
      
      // Set user to null immediately
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to home page after logout
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}