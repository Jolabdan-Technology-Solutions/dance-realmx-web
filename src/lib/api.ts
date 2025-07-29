/**
 * LEAN API - Only essential Cloud Functions
 * Everything else uses direct Firestore operations
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './firebase';

// Initialize Functions (only for essential operations)
export const functions = getFunctions(app);

// Connect to emulator in development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// === CLOUD FUNCTIONS (Essential Only - 6 total) ===

// Auth Helpers (custom username logic)
export const lookupUserByUsername = httpsCallable(functions, 'lookupUserByUsername');
export const setUsername = httpsCallable(functions, 'setUsername');

// Payment Processing (Stripe API)
export const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');

// Complex Business Logic  
export const enrollInCourseAdvanced = httpsCallable(functions, 'enrollInCourseAdvanced');

// Email Services (SendGrid API)
export const sendBulkNotification = httpsCallable(functions, 'sendBulkNotification');

// Admin Operations (role changes)
export const becomeProfessional = httpsCallable(functions, 'becomeProfessional');

// Helper function to handle Firebase Functions errors
export const handleApiError = (error: any) => {
  console.error('Firebase Functions Error:', error);
  
  if (error.code) {
    switch (error.code) {
      case 'functions/unauthenticated':
        return { message: 'Authentication required' };
      case 'functions/permission-denied':
        return { message: 'Permission denied' };
      case 'functions/not-found':
        return { message: 'Resource not found' };
      case 'functions/already-exists':
        return { message: 'Resource already exists' };
      case 'functions/invalid-argument':
        return { message: error.message || 'Invalid request' };
      case 'functions/internal':
        return { message: 'Internal server error' };
      default:
        return { message: error.message || 'An error occurred' };
    }
  }
  
  return { message: error.message || 'An error occurred' };
};

// === EVERYTHING ELSE USES DIRECT FIRESTORE ===
// Import from ./firestore.ts for all CRUD operations:
// - Courses: getCourses, createCourse, updateCourse
// - Users: getUserProfile, updateUserProfile  
// - Notifications: getNotifications, markNotificationRead, createNotification
// - Messages: sendMessage, getMessages, markMessagesRead
// - Cart: addToCart, getCart, removeFromCart
// - Reviews: createReview, getReviews
// - Bookings: createBooking, getBookings, updateBooking
// - Enrollments: enrollInCourse, getUserEnrollments
// - And all other basic CRUD operations

// DEPRECATED: Stub API object for backward compatibility
export const api = {
  get: () => {
    throw new Error("DEPRECATED: api.get() not available. Use Firebase Functions or Firestore directly.");
  },
  post: () => {
    throw new Error("DEPRECATED: api.post() not available. Use Firebase Functions or Firestore directly.");
  },
  put: () => {
    throw new Error("DEPRECATED: api.put() not available. Use Firebase Functions or Firestore directly.");
  },
  delete: () => {
    throw new Error("DEPRECATED: api.delete() not available. Use Firebase Functions or Firestore directly.");
  },
  patch: () => {
    throw new Error("DEPRECATED: api.patch() not available. Use Firebase Functions or Firestore directly.");
  },
};