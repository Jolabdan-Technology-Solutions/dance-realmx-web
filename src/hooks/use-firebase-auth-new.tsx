/**
 * Firebase-based authentication hook
 * Replaces the old API-based auth system
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  loginWithUsernameOrEmail,
  loginWithGoogle,
  registerWithEmail,
  logout,
  getCurrentUserWithProfile,
  onAuthStateChangeWithProfile,
  setUserUsername,
  hasUsername,
  AuthResult
} from '../lib/auth-complete';
import { useToast } from './use-toast';

interface AuthUser extends FirebaseUser {
  profile?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setUsername: (username: string) => Promise<AuthResult>;
  hasUsername: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChangeWithProfile((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (usernameOrEmail: string, password: string): Promise<AuthResult> => {
    const result = await loginWithUsernameOrEmail(usernameOrEmail, password);
    
    if (result.success) {
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
    } else {
      toast({
        title: "Login failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    return result;
  };

  const handleGoogleLogin = async (): Promise<AuthResult> => {
    const result = await loginWithGoogle();
    
    if (result.success) {
      toast({
        title: "Login successful",
        description: `Welcome!`,
      });
    } else {
      toast({
        title: "Google login failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    return result;
  };

  const handleRegister = async (email: string, password: string, name: string): Promise<AuthResult> => {
    const result = await registerWithEmail(email, password, name);
    
    if (result.success) {
      toast({
        title: "Registration successful",
        description: `Welcome to DanceRealmX, ${name}!`,
      });
    } else {
      toast({
        title: "Registration failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    return result;
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been logged out.",
    });
  };

  const handleSetUsername = async (username: string): Promise<AuthResult> => {
    const result = await setUserUsername(username);
    
    if (result.success) {
      toast({
        title: "Username set",
        description: `Your username is now @${username}`,
      });
      // Refresh user data
      const updatedUser = await getCurrentUserWithProfile();
      setUser(updatedUser);
    } else {
      toast({
        title: "Failed to set username",
        description: result.error,
        variant: "destructive",
      });
    }
    
    return result;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login: handleLogin,
    loginWithGoogle: handleGoogleLogin,
    register: handleRegister,
    logout: handleLogout,
    setUsername: handleSetUsername,
    hasUsername,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

// Helper hooks for common auth checks
export function useRequireAuth() {
  const { user, isLoading } = useFirebaseAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setShouldRedirect(true);
    }
  }, [user, isLoading]);

  return { user, isLoading, shouldRedirect };
}

export function useIsAdmin() {
  const { user } = useFirebaseAuth();
  return user?.profile?.role?.includes('ADMIN') || false;
}

export function useIsInstructor() {
  const { user } = useFirebaseAuth();
  return user?.profile?.role?.includes('INSTRUCTOR') || user?.profile?.role?.includes('ADMIN') || false;
}