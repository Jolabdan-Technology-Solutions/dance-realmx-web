import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export function AuthWrapper({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  // Use the hook directly instead of context for better reliability
  const { user, isLoading } = useAuth();
  
  console.log("AuthWrapper - Current auth state:", { user, isLoading });
  
  // If we're still loading, show a loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-20">Loading...</div>;
  }
  
  // If we have a user, render the children, otherwise render the fallback
  if (user) {
    console.log("AuthWrapper - User authenticated, showing protected content");
    return <>{children}</>;
  } else if (fallback) {
    console.log("AuthWrapper - User not authenticated, showing fallback content");
    return <>{fallback}</>;
  }
  
  // Otherwise, just render nothing
  console.log("AuthWrapper - No user and no fallback provided");
  return null;
}