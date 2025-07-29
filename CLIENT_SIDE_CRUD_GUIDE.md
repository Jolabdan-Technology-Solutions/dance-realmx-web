# Client-Side CRUD Guide

## Architecture Change ✨

**BEFORE (Bloated):** 100+ Cloud Functions for basic CRUD
**AFTER (Lean):** 7 essential Cloud Functions + Direct Firestore for everything else

## Usage Patterns

### Basic CRUD Operations

```javascript
import { 
  getCourses, 
  createCourse, 
  updateCourse,
  getUserProfile,
  updateUserProfile,
  getNotifications,
  markNotificationRead,
  createNotification
} from '../lib/firestore';

// ✅ Courses
const courses = await getCourses({ category: 'dance' });
const course = await getCourse('courseId123');
const newCourse = await createCourse(courseData, instructorId);
await updateCourse('courseId123', { title: 'New Title' });

// ✅ User Profiles  
const profile = await getUserProfile(userId);
await updateUserProfile(userId, { name: 'New Name' });

// ✅ Notifications (Real-time!)
const unsubscribe = getNotifications(userId, (notifications) => {
  console.log('Real-time notifications:', notifications);
});
await markNotificationRead('notificationId123'); // Client-side update!
await createNotification({ userId, title: 'Hello', message: 'World' });
```

### Real-time Subscriptions

```javascript
// ✅ Real-time cart updates
const unsubscribe = getCart(userId, (cartItems) => {
  setCartItems(cartItems);
});

// ✅ Real-time messages
const unsubscribe = getMessages(conversationId, (messages) => {
  setMessages(messages);
});

// ✅ Real-time bookings
const unsubscribe = getBookings(userId, (bookings) => {
  setBookings(bookings);
});
```

### Complex Operations (Still use Cloud Functions)

```javascript
import { 
  lookupUserByUsername,
  setUsername,
  createPaymentIntent,
  enrollInCourseAdvanced,
  becomeProfessional,
  sendBulkNotification
} from '../lib/api';

// ✅ Username auth
const { data } = await lookupUserByUsername({ username: 'johndoe' });
// Use data.email with Firebase signInWithEmailAndPassword

// ✅ Payments
const { data } = await createPaymentIntent({ amount: 99.99, currency: 'usd' });

// ✅ Complex enrollment (with progress tracking)
const { data } = await enrollInCourseAdvanced({ courseId, userId });

// ✅ Role changes
const { data } = await becomeProfessional({ specialties: ['hip-hop', 'jazz'] });
```

## Migration Examples

### Before (Bloated Function Call)
```javascript
// ❌ OLD: Unnecessary cloud function for simple read
import { getNotifications } from '../lib/api';
const { data } = await getNotifications({ userId });
```

### After (Direct Firestore)
```javascript
// ✅ NEW: Direct real-time Firestore subscription
import { getNotifications } from '../lib/firestore';
const unsubscribe = getNotifications(userId, (notifications) => {
  setNotifications(notifications);
});
```

### Before (Bloated Function Call)
```javascript
// ❌ OLD: Cloud function for basic update
import { markNotificationRead } from '../lib/api';
await markNotificationRead({ notificationId });
```

### After (Direct Firestore)
```javascript
// ✅ NEW: Direct client-side update
import { markNotificationRead } from '../lib/firestore';
await markNotificationRead(notificationId);
```

## Available Client-Side Operations

### ✅ Courses
- `getCourses(filters?)` - List courses with optional filters
- `getCourse(courseId)` - Get single course
- `createCourse(courseData, instructorId)` - Create new course
- `updateCourse(courseId, updates)` - Update course

### ✅ Users
- `getUserProfile(userId)` - Get user profile
- `updateUserProfile(userId, updates)` - Update user profile

### ✅ Notifications
- `getNotifications(userId, callback)` - Real-time subscription
- `markNotificationRead(notificationId)` - Mark as read
- `createNotification(notificationData)` - Create notification

### ✅ Messages
- `sendMessage(messageData)` - Send message
- `getMessages(conversationId, callback)` - Real-time messages
- `markMessagesRead(conversationId, userId)` - Mark as read

### ✅ Cart
- `addToCart(userId, item)` - Add item to cart
- `getCart(userId, callback)` - Real-time cart updates
- `removeFromCart(cartItemId)` - Remove from cart

### ✅ Reviews
- `createReview(reviewData)` - Create review
- `getReviews(targetType, targetId)` - Get reviews for content

### ✅ Bookings
- `createBooking(bookingData)` - Create booking
- `getBookings(userId, callback)` - Real-time bookings
- `updateBooking(bookingId, updates)` - Update booking

### ✅ Enrollments
- `enrollInCourse(userId, courseId)` - Simple enrollment
- `getUserEnrollments(userId, callback)` - Real-time enrollments

### ✅ Generic Operations
- `getCollection(collectionName, filters?)` - Generic read
- `subscribeToCollection(collectionName, callback, filters?)` - Generic real-time

## Security

- **Firestore Rules:** Wide open for testing (`allow read, write: if true`)
- **Production:** Will add proper auth-based rules later
- **Cloud Functions:** Still handle sensitive operations (payments, emails, admin)

## Performance Benefits

- **Faster:** Direct Firestore calls vs HTTP round-trips
- **Real-time:** Built-in subscriptions with `onSnapshot`
- **Cheaper:** Fewer cloud function invocations  
- **Scalable:** Client-side operations scale with users
- **Offline:** Firestore offline persistence works automatically

## Testing

Import and use the test component:
```javascript
import { FirestoreTest } from '../components/test/FirestoreTest';

// Add to any page to test CRUD operations
<FirestoreTest />
```

## Key Architecture Principles

1. **Cloud Functions only for:**
   - 3rd party APIs (Stripe, SendGrid)
   - Complex business logic (enrollment with progress)
   - Admin operations (role changes)
   - Custom auth logic (username lookup)

2. **Direct Firestore for:**
   - Basic CRUD operations
   - Real-time subscriptions
   - Simple updates (mark as read, etc.)
   - User-generated content

3. **Security Rules handle authorization** (when implemented)
4. **Client handles UI state and real-time updates**