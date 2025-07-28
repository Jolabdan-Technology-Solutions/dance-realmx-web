import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { UserRole } from "@/constants/roles";

/**
 * Component to redirect users to their appropriate dashboard based on role
 */
export function DashboardRedirect() {
  const { user } = useAuth();
  const [location] = useLocation();

  // Allow access to login page even when logged in
  if (location === "/auth") {
    return null;
  }

  if (!user) {
    // If not logged in, redirect to auth page
    return <Redirect to="/auth" />;
  }

  // Check if user has multiple roles
  const hasRolesArray =
    Array.isArray(user?.role) && user?.role && user?.role.length > 0;
  const hasMultipleRoles = hasRolesArray && user?.role && user?.role.length > 1;

  if (user?.role.includes(UserRole.ADMIN)) {
    return <Redirect to="/admin" />;
  }

  // If user has multiple roles, redirect to multi-role dashboard
  if (hasMultipleRoles) {
    return <Redirect to="/multi-dashboard" />;
  }

  // For users with a single role in the roles array
  if (hasRolesArray && user?.role && user?.role.length === 1) {
    switch (user?.role[0]) {
      case UserRole.CURRICULUM_SELLER:
        return <Redirect to="/multi-dashboard" />;
      case UserRole.INSTRUCTOR_ADMIN:
        return <Redirect to="/multi-dashboard" />;
      case UserRole.ADMIN:
        return <Redirect to="/admin" />;
      case UserRole.CURRICULUM_ADMIN:
        return <Redirect to="/multi-dashboard" />;
    }
  }

  // For legacy users without roles array or users with empty roles array
  // Redirect based on the primary role
  switch (user?.role) {
    case UserRole.CURRICULUM_SELLER:
      return <Redirect to="/multi-dashboard" />;
    case UserRole.INSTRUCTOR_ADMIN:
      return <Redirect to="/multi-dashboard" />;
    case UserRole.ADMIN:
      return <Redirect to="/admin" />;
    case UserRole.CURRICULUM_ADMIN:
      return <Redirect to="/multi-dashboard" />;
    default:
      // All other roles go to the regular dashboard
      return <Redirect to="/dashboard/user" />;
  }
}
