import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
export const db = admin.firestore();

// === ESSENTIAL CLOUD FUNCTIONS ONLY ===

// Auth Helpers (custom logic required)
export { lookupUserByUsername, setUsername } from './functions/auth';

// Payment Processing (3rd party API - Stripe)
export { createPaymentIntent, handleStripeWebhook } from './functions/payments';

// Complex Business Logic
export { enrollInCourseAdvanced } from './functions/enrollment';

// Email Services (3rd party API - SendGrid)  
export { sendBulkNotification } from './functions/notifications';

// Admin Operations (sensitive operations)
export { becomeProfessional } from './functions/professional-booking';

// === EVERYTHING ELSE MOVES TO CLIENT-SIDE FIRESTORE ===
// - Basic CRUD (courses, users, messages, reviews, bookings)
// - Notifications (mark read, delete, create) 
// - Cart operations
// - File upload confirmation
// - Analytics queries
// - All simple reads/writes/updates