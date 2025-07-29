/**
 * Client-side Firestore operations
 * Replaces 90% of the Cloud Functions with direct DB operations
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';

// === COURSES ===
export const coursesRef = collection(db, 'courses');

export const getCourses = async (filters?: any) => {
  let q = query(coursesRef, where('isActive', '==', true));
  if (filters?.category) q = query(q, where('category', '==', filters.category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getCourse = async (courseId: string) => {
  const docRef = doc(db, 'courses', courseId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const createCourse = async (courseData: any, instructorId: string) => {
  return await addDoc(coursesRef, {
    ...courseData,
    instructorId,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateCourse = async (courseId: string, updates: any) => {
  const docRef = doc(db, 'courses', courseId);
  return await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// === USERS ===
export const usersRef = collection(db, 'users');

export const getUserProfile = async (userId: string) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const docRef = doc(db, 'users', userId);
  return await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// === NOTIFICATIONS ===
export const notificationsRef = collection(db, 'notifications');

export const getNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  const q = query(
    notificationsRef, 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  });
};

export const markNotificationRead = async (notificationId: string) => {
  const docRef = doc(db, 'notifications', notificationId);
  return await updateDoc(docRef, {
    read: true,
    readAt: serverTimestamp(),
  });
};

export const createNotification = async (notificationData: any) => {
  return await addDoc(notificationsRef, {
    ...notificationData,
    read: false,
    createdAt: serverTimestamp(),
  });
};

// === MESSAGES ===
export const messagesRef = collection(db, 'messages');
export const conversationsRef = collection(db, 'conversations');

export const sendMessage = async (messageData: any) => {
  return await addDoc(messagesRef, {
    ...messageData,
    isRead: false,
    createdAt: serverTimestamp(),
  });
};

export const getMessages = (conversationId: string, callback: (messages: any[]) => void) => {
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

export const markMessagesRead = async (conversationId: string, userId: string) => {
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  
  const updates = snapshot.docs.map(doc => 
    updateDoc(doc.ref, { 
      isRead: true, 
      readAt: serverTimestamp() 
    })
  );
  
  return await Promise.all(updates);
};

// === CART ===
export const cartRef = collection(db, 'cart');

export const addToCart = async (userId: string, item: any) => {
  return await addDoc(cartRef, {
    userId,
    ...item,
    createdAt: serverTimestamp(),
  });
};

export const getCart = (userId: string, callback: (cartItems: any[]) => void) => {
  const q = query(cartRef, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const cartItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(cartItems);
  });
};

export const removeFromCart = async (cartItemId: string) => {
  const docRef = doc(db, 'cart', cartItemId);
  return await deleteDoc(docRef);
};

// === REVIEWS ===
export const reviewsRef = collection(db, 'reviews');

export const createReview = async (reviewData: any) => {
  return await addDoc(reviewsRef, {
    ...reviewData,
    isVisible: true,
    helpfulCount: 0,
    createdAt: serverTimestamp(),
  });
};

export const getReviews = async (targetType: string, targetId: string) => {
  const q = query(
    reviewsRef,
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
    where('isVisible', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// === BOOKINGS ===
export const bookingsRef = collection(db, 'bookings');

export const createBooking = async (bookingData: any) => {
  return await addDoc(bookingsRef, {
    ...bookingData,
    status: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getBookings = (userId: string, callback: (bookings: any[]) => void) => {
  const q = query(
    bookingsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(bookings);
  });
};

export const updateBooking = async (bookingId: string, updates: any) => {
  const docRef = doc(db, 'bookings', bookingId);
  return await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// === ENROLLMENTS ===
export const enrollmentsRef = collection(db, 'enrollments');

export const enrollInCourse = async (userId: string, courseId: string) => {
  return await addDoc(enrollmentsRef, {
    userId,
    courseId,
    status: 'ACTIVE',
    progress: 0,
    enrolledAt: serverTimestamp(),
  });
};

export const getUserEnrollments = (userId: string, callback: (enrollments: any[]) => void) => {
  const q = query(enrollmentsRef, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(enrollments);
  });
};

// === GENERIC HELPERS ===
export const getCollection = async (collectionName: string, filters?: any) => {
  const collectionRef = collection(db, collectionName);
  let q = query(collectionRef);
  
  if (filters) {
    Object.entries(filters).forEach(([field, value]) => {
      q = query(q, where(field, '==', value));
    });
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToCollection = (
  collectionName: string, 
  callback: (data: any[]) => void,
  filters?: any
) => {
  const collectionRef = collection(db, collectionName);
  let q = query(collectionRef);
  
  if (filters) {
    Object.entries(filters).forEach(([field, value]) => {
      q = query(q, where(field, '==', value));
    });
  }
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};