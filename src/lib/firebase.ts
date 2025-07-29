import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  UserCredential,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcB6XanKkMiPBA1y-MmB-ot2A6wNhpPZw",
  authDomain: "dancerealmx-b4a0a.firebaseapp.com",
  projectId: "dancerealmx-b4a0a",
  storageBucket: "dancerealmx-b4a0a.firebasestorage.app",
  messagingSenderId: "52067012391",
  appId: "1:52067012391:web:73fae17ffd5e4693cde302",
  measurementId: "G-D3JVFHX3GS"
};

// Web Client ID for OAuth
export const webClientId = "52067012391-flio9nfbt6pmtfrd400la7osns8sreec.apps.googleusercontent.com";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth functions
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<UserCredential> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    
    return result;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

// Get Firebase token
export async function getFirebaseToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) return null;
  
  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error("Error getting Firebase token:", error);
    return null;
  }
}

export { auth, db, googleProvider, analytics, app };