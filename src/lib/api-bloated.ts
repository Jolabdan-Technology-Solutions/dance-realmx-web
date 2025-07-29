/**
 * LEAN API - Mix of Cloud Functions (for complex ops) and direct Firestore (for CRUD)
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './firebase';

// Initialize Functions (only for essential operations)
export const functions = getFunctions(app);

// Connect to emulator in development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// === CLOUD FUNCTIONS (Essential Only) ===

// Auth Helpers (custom logic)
export const lookupUserByUsername = httpsCallable(functions, 'lookupUserByUsername');
export const setUsername = httpsCallable(functions, 'setUsername');

// Payment Processing (Stripe API)
export const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');

// Complex Business Logic  
export const enrollInCourseAdvanced = httpsCallable(functions, 'enrollInCourseAdvanced');

// Email Services (SendGrid API)
export const sendBulkNotification = httpsCallable(functions, 'sendBulkNotification');

// Admin Operations
export const becomeProfessional = httpsCallable(functions, 'becomeProfessional');

// === EVERYTHING ELSE USES DIRECT FIRESTORE ===
// Import from ./firestore.ts for:
// - getCourses, createCourse, updateCourse
// - getUserProfile, updateUserProfile  
// - getNotifications, markNotificationRead
// - sendMessage, getMessages
// - addToCart, getCart, removeFromCart
// - createReview, getReviews
// - createBooking, getBookings
// - etc.
export const getModules = httpsCallable(functions, 'getModules');
export const updateModule = httpsCallable(functions, 'updateModule');
export const deleteModule = httpsCallable(functions, 'deleteModule');

// Lesson Functions
export const createLesson = httpsCallable(functions, 'createLesson');
export const getLessons = httpsCallable(functions, 'getLessons');
export const getLesson = httpsCallable(functions, 'getLesson');
export const updateLesson = httpsCallable(functions, 'updateLesson');
export const deleteLesson = httpsCallable(functions, 'deleteLesson');
export const markLessonComplete = httpsCallable(functions, 'markLessonComplete');

// Quiz Functions
export const createQuiz = httpsCallable(functions, 'createQuiz');
export const getQuizzes = httpsCallable(functions, 'getQuizzes');
export const addQuizQuestion = httpsCallable(functions, 'addQuizQuestion');
export const getQuizQuestions = httpsCallable(functions, 'getQuizQuestions');
export const submitQuiz = httpsCallable(functions, 'submitQuiz');
export const getQuizAttempts = httpsCallable(functions, 'getQuizAttempts');

// Cart Functions
export const addToCart = httpsCallable(functions, 'addToCart');
export const getCart = httpsCallable(functions, 'getCart');
export const updateCartItem = httpsCallable(functions, 'updateCartItem');
export const removeFromCart = httpsCallable(functions, 'removeFromCart');
export const clearCart = httpsCallable(functions, 'clearCart');
export const checkoutCart = httpsCallable(functions, 'checkoutCart');
export const getOrders = httpsCallable(functions, 'getOrders');

// Resource Functions
export const getResources = httpsCallable(functions, 'getResources');
export const getResource = httpsCallable(functions, 'getResource');
export const createResource = httpsCallable(functions, 'createResource');
export const updateResource = httpsCallable(functions, 'updateResource');
export const deleteResource = httpsCallable(functions, 'deleteResource');
export const purchaseResource = httpsCallable(functions, 'purchaseResource');

// Subscription Functions
export const getSubscriptionPlans = httpsCallable(functions, 'getSubscriptionPlans');
export const createSubscription = httpsCallable(functions, 'createSubscription');
export const cancelSubscription = httpsCallable(functions, 'cancelSubscription');
export const updateSubscription = httpsCallable(functions, 'updateSubscription');

// Payment Functions
export const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
export const getPaymentHistory = httpsCallable(functions, 'getPaymentHistory');

// Booking Functions
export const createBooking = httpsCallable(functions, 'createBooking');
export const getBookings = httpsCallable(functions, 'getBookings');
export const updateBooking = httpsCallable(functions, 'updateBooking');
export const cancelBooking = httpsCallable(functions, 'cancelBooking');

// User Functions
export const updateUserProfile = httpsCallable(functions, 'updateUserProfile');
export const getUserProfile = httpsCallable(functions, 'getUserProfile');
export const getUserAnalytics = httpsCallable(functions, 'getUserAnalytics');

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

// Legacy support for axios-style usage (for gradual migration)
export const api = {
  get: async (path: string) => {
    throw new Error('Legacy API calls not supported. Use Firebase Functions instead.');
  },
  post: async (path: string, data: any) => {
    throw new Error('Legacy API calls not supported. Use Firebase Functions instead.');
  },
  put: async (path: string, data: any) => {
    throw new Error('Legacy API calls not supported. Use Firebase Functions instead.');
  },
  delete: async (path: string) => {
    throw new Error('Legacy API calls not supported. Use Firebase Functions instead.');
  },
};
