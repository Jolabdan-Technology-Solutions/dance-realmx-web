import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole } from "@/constants/roles";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  const allowedRoles = [UserRole.ADMIN, UserRole.CURRICULUM_ADMIN, UserRole.INSTRUCTOR_ADMIN, UserRole.COURSE_CREATOR_ADMIN, UserRole.CERTIFICATION_MANAGER, UserRole.DIRECTORY_MEMBER, UserRole.BOOKING_PROFESSIONAL, UserRole.BOOKING_USER];
  
  const hasAdminRole = user.role_mappings?.some(mapping => 
    allowedRoles.includes(mapping.role as keyof typeof UserRole)
  );

  if (!hasAdminRole) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}