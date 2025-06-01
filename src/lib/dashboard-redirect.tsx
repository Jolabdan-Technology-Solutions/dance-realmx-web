import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { USER_ROLES } from "@/constants/roles";

/**
 * Component to redirect users to their appropriate dashboard based on role
 */
export function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) {
    // If not logged in, redirect to auth page
    return <Redirect to="/auth" />;
  }

  // Check if user has multiple roles
  const hasRolesArray = Array.isArray(user?.roles) && user?.roles && user?.roles.length > 0;
  const hasMultipleRoles = hasRolesArray && user?.roles && user?.roles.length > 1;
  
  // If user has multiple roles, redirect to multi-role dashboard
  if (hasMultipleRoles) {
    return <Redirect to="/multi-dashboard" />;
  }
  
  // For users with a single role in the roles array
  if (hasRolesArray && user?.roles && user?.roles.length === 1) {
    switch (user?.roles[0]) {
      case USER_ROLES.SELLER:
        return <Redirect to="/seller-dashboard" />;
      case USER_ROLES.INSTRUCTOR:
        return <Redirect to="/instructor/dashboard" />;
      case USER_ROLES.ADMIN:
        return <Redirect to="/admin" />;
      case USER_ROLES.CURRICULUM_OFFICER:
        return <Redirect to="/admin/curriculum-officer" />;
    }
  }
  
  // For legacy users without roles array or users with empty roles array
  // Redirect based on the primary role
  switch (user?.role) {
    case USER_ROLES.SELLER:
      return <Redirect to="/seller-dashboard" />;
    case USER_ROLES.INSTRUCTOR:
      return <Redirect to="/instructor/dashboard" />;
    case USER_ROLES.ADMIN:
      return <Redirect to="/admin" />;
    case USER_ROLES.CURRICULUM_OFFICER:
      return <Redirect to="/admin/curriculum-officer" />;
    default:
      // All other roles go to the regular dashboard
      return <Redirect to="/dashboard/user" />;
  }
}