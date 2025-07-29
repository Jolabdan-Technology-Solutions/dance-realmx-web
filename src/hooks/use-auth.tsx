// OLD AUTH HOOK - DEPRECATED
// Use useFirebaseAuth from use-firebase-auth-new.tsx instead

import { ReactNode } from "react";

// Stub types for backwards compatibility during migration
export type User = any;
export type AuthContextType = {
  user: null;
  isLoading: boolean;
  error: null;
  loginMutation: null;
  logoutMutation: null;
  registerMutation: null;
};

export const AuthContext = {
  Provider: ({ children }: { children: ReactNode }) => children,
  Consumer: ({ children }: { children: (value: AuthContextType) => ReactNode }) => 
    children({ user: null, isLoading: false, error: null, loginMutation: null, logoutMutation: null, registerMutation: null })
};

export function useAuth(): AuthContextType {
  console.warn("DEPRECATED: useAuth() is deprecated. Use useFirebaseAuth() from use-firebase-auth-new.tsx instead");
  return {
    user: null,
    isLoading: false,
    error: null,
    loginMutation: null,
    logoutMutation: null,
    registerMutation: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  console.warn("DEPRECATED: AuthProvider is deprecated. Use FirebaseAuthProvider instead");
  return <>{children}</>;
}