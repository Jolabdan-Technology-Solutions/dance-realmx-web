import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

// This component simply redirects seller users to their store dashboard
export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // If user is a seller, redirect to their seller store
    if (user && user.id) {
      setLocation(`/seller-store/${user.id}`);
    }
  }, [user, setLocation]);

  // While redirecting, show a minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-medium">Redirecting to Seller Dashboard...</p>
      </div>
    </div>
  );
}