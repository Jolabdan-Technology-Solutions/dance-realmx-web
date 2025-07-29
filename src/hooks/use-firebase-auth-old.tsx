import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loginUser, registerUser, getCurrentUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// =======================
// Type Definitions
// =======================
type User = {
  uid: string;
  email: string;
  name?: string;
  role: string[];
  subscription_tier?: string;
  is_active?: boolean;
  profile_image_url?: string;
  created_at?: any;
  updated_at?: any;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // -----------------------
  // Firebase Auth State
  // -----------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -----------------------
  // Fetch User Profile
  // -----------------------
  const {
    data: userProfile,
    error,
    isLoading: isProfileLoading,
    refetch,
  } = useQuery<User | null, Error>({
    queryKey: ["userProfile", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      
      try {
        const result = await getCurrentUser();
        return result.data.user;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    },
    enabled: !!firebaseUser,
    staleTime: 10 * 1000,
  });

  // -----------------------
  // Event Listeners
  // -----------------------
  useEffect(() => {
    const onProfileImageUpdate = () => {
      refetch();
    };

    const onAuthRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setTimeout(() => refetch(), 100);
    };

    document.addEventListener("profile-image-updated", onProfileImageUpdate);
    document.addEventListener("auth-refresh-required", onAuthRefresh);

    return () => {
      document.removeEventListener("profile-image-updated", onProfileImageUpdate);
      document.removeEventListener("auth-refresh-required", onAuthRefresh);
    };
  }, [refetch]);

  // -----------------------
  // Login Mutation
  // -----------------------
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Call our login function to create/update user profile
      const result = await loginUser();
      return result.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["userProfile", firebaseUser?.uid], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.email}!`,
      });

      // Handle subscription redirection
      if (
        user.subscription_tier !== "FREE" &&
        user?.is_active === false
      ) {
        if (user?.role.includes("ADMIN")) {
          navigate("/admin/dashboard");
        } else {
          navigate(`/subscription?tier=${user.subscription_tier}`);
        }
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: Error) => {
      let message = "Login failed. Please try again.";
      if (error.message.includes("auth/user-not-found")) {
        message = "No user found with this email.";
      } else if (error.message.includes("auth/wrong-password")) {
        message = "Invalid password.";
      } else if (error.message.includes("auth/invalid-email")) {
        message = "Invalid email address.";
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
    mutationFn: async (credentials: RegisterData) => {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Call our register function to create user profile
      const result = await registerUser({ name: credentials.name });
      return result.data.user;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["userProfile", firebaseUser?.uid], user);
      toast({
        title: "Registration successful",
        description: `Welcome to DanceRealmX, ${user.name || user.email}!`,
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      let message = error.message;
      if (error.message.includes("auth/email-already-in-use")) {
        message = "Email already in use. Please use another email.";
      } else if (error.message.includes("auth/weak-password")) {
        message = "Password should be at least 6 characters.";
      } else if (error.message.includes("auth/invalid-email")) {
        message = "Invalid email address.";
      }

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
      await signOut(auth);
      queryClient.clear();
    },
    onSuccess: () => {
      toast({ title: "Logged out", description: "You have been logged out." });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isAuthLoading || isProfileLoading;

  return (
    <AuthContext.Provider
      value={{
        user: userProfile || null,
        firebaseUser,
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

  const isAdmin = context.user?.role?.includes("ADMIN") || false;

  return {
    ...context,
    isAdmin,
  };
}

// Export for gradual migration
export { useAuth as useFirebaseAuth, AuthProvider as FirebaseAuthProvider };