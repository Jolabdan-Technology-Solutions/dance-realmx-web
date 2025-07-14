import { createContext, ReactNode, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@/types/user";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { UserRole } from "@/constants/roles";

// =======================
// Type Definitions
// =======================
type LoginData = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<
    User,
    Error,
    Omit<User, "id" | "created_at" | "updated_at">
  >;
};

// =======================
// Context
// =======================
const AuthContext = createContext<AuthContextType | null>(null);
export { AuthContext };

// =======================
// Provider
// =======================
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // -----------------------
  // Fetch Current User
  // -----------------------
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull", requireAuth: true }),
    staleTime: 10 * 1000,
  });

  // -----------------------
  // Event Listener for Updates
  // -----------------------
  useEffect(() => {
    const onProfileImageUpdate = (event: CustomEvent) => {
      console.log("=== Profile Image Update Event Received ===");
      console.log("Event details:", event.detail);
      console.log("Current user before refetch:", {
        id: user?.id,
        profile_image_url: user?.profile_image_url,
        username: user?.username,
      });

      // Force immediate refetch
      refetch();
    };

    const onAuthRefresh = () => {
      console.log("=== Auth Refresh Event Received ===");
      console.log("Current user before refresh:", {
        id: user?.id,
        profile_image_url: user?.profile_image_url,
        username: user?.username,
      });

      // Invalidate queries and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });

      // Add a delay to ensure invalidation is processed
      setTimeout(() => {
        console.log("Refetching user data after invalidation");
        refetch();
      }, 100);
    };

    document.addEventListener(
      "profile-image-updated",
      onProfileImageUpdate as EventListener
    );
    document.addEventListener("auth-refresh-required", onAuthRefresh);

    return () => {
      document.removeEventListener(
        "profile-image-updated",
        onProfileImageUpdate as EventListener
      );
      document.removeEventListener("auth-refresh-required", onAuthRefresh);
    };
  }, [refetch, user, queryClient]);

  // -----------------------
  // Login Mutation
  // -----------------------
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await api.post("/api/login", credentials);
      const data = response.data;

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/me"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });

      console.log("user", user);

      if (
        user.subscription_tier !== "free".toUpperCase() &&
        user?.is_active === false
      ) {
        if (user?.role.includes(UserRole.ADMIN)) {
          window.location.href = `/admin/dashboard`;
        } else {
          window.location.href = `/subscription?tier=${user.subscription_tier}`;
        }
      } else {
        window.location.href = "/dashboard";
      }
    },
    onError: (error: Error) => {
      let message = "Login failed. Please try again.";
      if (error.message.includes("401")) {
        message = "Invalid username or password.";
      } else if (error.message.includes("500")) {
        message = "A server error occurred. Please try again later.";
      }

      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // -----------------------
  // Register Mutation
  // -----------------------
  const registerMutation = useMutation({
    mutationFn: async (
      credentials: Omit<User, "id" | "created_at" | "updated_at">
    ) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.text();
        try {
          const parsed = JSON.parse(errorData);
          throw new Error(parsed.message || "Registration failed.");
        } catch {
          throw new Error(
            errorData || `Registration failed: ${response.status}`
          );
        }
      }

      return await response.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/me"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to DanceRealmX, ${user.username}!`,
      });
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      const message = error.message.includes("Username already exists")
        ? "Username already taken. Please choose another."
        : error.message;

      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // -----------------------
  // Logout Mutation
  // -----------------------
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear auth token from localStorage
      localStorage.removeItem("access_token");
      // Clear all queries from the cache
      queryClient.clear();
      // Set user to null
      queryClient.setQueryData(["/api/me"], null);
    },
    onSuccess: () => {
      toast({ title: "Logged out", description: "You have been logged out." });
      window.location.href = "/";
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

// =======================
// Hook
// =======================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const isAdmin =
    context.user?.role_mappings?.some(
      (mapping) =>
        mapping.role === "ADMIN" ||
        mapping.role === "CURRICULUM_ADMIN" ||
        mapping.role === "INSTRUCTOR_ADMIN" ||
        mapping.role === "COURSE_CREATOR_ADMIN"
    ) || false;

  return {
    ...context,
    isAdmin,
  };
}
