import { useFirebaseAuth } from "@/hooks/use-firebase-auth-new";
import { Redirect, useLocation } from "wouter";
import { UserRole } from "@/constants/roles";

/**
 * Component to redirect users to their appropriate dashboard based on role
 */
export function DashboardRedirect() {
  const { user } = useFirebaseAuth();
  const [location] = useLocation();

  // Allow access to login page even when logged in
  if (location === "/auth") {
    return null;
  }

  if (!user) {
    // If not logged in, redirect to auth page
    return <Redirect to="/auth" />;
  }

  // Check if user has multiple roles from Firebase profile
  const userRoles = user?.profile?.role || [];
  const hasMultipleRoles = userRoles.length > 1;

  if (userRoles.includes(UserRole.ADMIN)) {
    return <Redirect to="/admin" />;
  }

  // If user has multiple roles, redirect to multi-role dashboard
  if (hasMultipleRoles) {
    return <Redirect to="/multi-dashboard" />;
  }

  // For users with a single role
  if (userRoles.length === 1) {
    switch (userRoles[0]) {
      case UserRole.CURRICULUM_SELLER:
        return <Redirect to="/multi-dashboard" />;
      case UserRole.INSTRUCTOR_ADMIN:
        return <Redirect to="/multi-dashboard" />;
      case UserRole.ADMIN:
        return <Redirect to="/admin" />;
      case UserRole.CURRICULUM_ADMIN:
        return <Redirect to="/multi-dashboard" />;
      default:
        return <Redirect to="/dashboard/user" />;
    }
  }

  // Default for users with no specific roles
  return <Redirect to="/dashboard/user" />;
}
