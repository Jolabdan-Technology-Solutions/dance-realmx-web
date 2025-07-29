/**
 * Complete authentication flow with username support
 * Combines Firebase Auth with Cloud Functions for username lookup
 */

import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  getCurrentUser,
  onAuthStateChange
} from './firebase';
import { lookupUserByUsername, setUsername } from './api';
import { getUserProfile, updateUserProfile } from './firestore';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

// Login with username or email + password
export async function loginWithUsernameOrEmail(usernameOrEmail: string, password: string): Promise<AuthResult> {
  try {
    let email = usernameOrEmail;
    
    // If it doesn't contain @, treat as username and lookup email
    if (!usernameOrEmail.includes('@')) {
      try {
        const { data } = await lookupUserByUsername({ username: usernameOrEmail });
        email = data.email;
      } catch (error) {
        return { success: false, error: 'Username not found' };
      }
    }
    
    // Sign in with email + password
    const result = await signInWithEmail(email, password);
    
    // Get or create user profile
    let profile = await getUserProfile(result.user.uid);
    if (!profile) {
      // Create profile if it doesn't exist
      await updateUserProfile(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || result.user.email?.split('@')[0],
        role: ['GUEST_USER'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      profile = await getUserProfile(result.user.uid);
    }
    
    return { success: true, user: { ...result.user, profile } };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Login failed' };
  }
}

// Login with Google
export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    const result = await signInWithGoogle();
    
    // Get or create user profile
    let profile = await getUserProfile(result.user.uid);
    if (!profile) {
      // Create profile for new Google user
      await updateUserProfile(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        profileImage: result.user.photoURL,
        role: ['GUEST_USER'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      profile = await getUserProfile(result.user.uid);
    }
    
    return { success: true, user: { ...result.user, profile } };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Google login failed' };
  }
}

// Register with email + password
export async function registerWithEmail(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    const result = await signUpWithEmail(email, password, name);
    
    // Create user profile
    await updateUserProfile(result.user.uid, {
      uid: result.user.uid,
      email: result.user.email,
      name: name,
      role: ['GUEST_USER'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const profile = await getUserProfile(result.user.uid);
    
    return { success: true, user: { ...result.user, profile } };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' };
  }
}

// Set username for existing user
export async function setUserUsername(username: string): Promise<AuthResult> {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const { data } = await setUsername({ username });
    
    // Update local profile
    await updateUserProfile(user.uid, { username: data.username });
    
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to set username' };
  }
}

// Logout
export async function logout(): Promise<void> {
  await signOutUser();
}

// Get current authenticated user with profile
export async function getCurrentUserWithProfile() {
  const user = getCurrentUser();
  if (!user) return null;
  
  const profile = await getUserProfile(user.uid);
  return { ...user, profile };
}

// Auth state listener with profile
export function onAuthStateChangeWithProfile(callback: (user: any) => void) {
  return onAuthStateChange(async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      callback({ ...firebaseUser, profile });
    } else {
      callback(null);
    }
  });
}

// Check if user has username set
export async function hasUsername(): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;
  
  const profile = await getUserProfile(user.uid);
  return !!(profile?.username);
}

export { onAuthStateChange };