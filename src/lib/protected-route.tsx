import { useFirebaseAuth } from "../hooks/use-firebase-auth-new";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Direct implementation of protected route using useAuth hook
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return (
    <Route path={path}>
      {(params) => <ProtectedContent Component={Component} params={params} />}
    </Route>
  );
}

// Separate component to handle the auth logic inside the route
function ProtectedContent({
  Component,
  params,
}: {
  Component: () => React.JSX.Element;
  params: any;
}) {
  // Use the safe try/catch version of useAuth to handle cases where
  // AuthContext might not be available yet
  let user = null;
  let isLoading = true;
  let error = null;

  try {
    // This will throw an error if the context is not available
    const auth = useFirebaseAuth();
    user = auth.user;
    isLoading = auth.isLoading;
    error = auth.error;
  } catch (e) {
    // If useFirebaseAuth throws, we're not in the FirebaseAuthProvider context yet
    console.log(
      "Firebase auth context not available in ProtectedRoute, redirecting to login"
    );
    return <Redirect to="/auth" />;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-white">Verifying authentication...</span>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If we have a user, render the protected component
  return <Component />;
}
