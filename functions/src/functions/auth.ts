import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Login/Register User - Firebase handles auth, we just create/update user profile
export const loginUser = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid, email, name } = request.auth.token;
    
    try {
      // Check if user profile exists
      const userRef = admin.firestore().collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // Create user profile on first login
        await userRef.set({
          uid,
          email,
          name,
          username: null, // Will be set later by user
          role: ['GUEST_USER'],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        logger.info(`Created new user profile for ${email}`);
      } else {
        // Update last login
        await userRef.update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      const userData = await userRef.get();
      return { user: userData.data() };
      
    } catch (error) {
      logger.error('Login error:', error);
      throw new HttpsError('internal', 'Failed to process login');
    }
  }
);

export const registerUser = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid, email } = request.auth.token;
    const { name, role = ['GUEST_USER'] } = request.data;
    
    try {
      const userRef = admin.firestore().collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        throw new HttpsError('already-exists', 'User already registered');
      }
      
      await userRef.set({
        uid,
        email,
        name,
        username: null, // Will be set later by user
        role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      logger.info(`Registered new user: ${email}`);
      
      const userData = await userRef.get();
      return { user: userData.data() };
      
    } catch (error) {
      logger.error('Registration error:', error);
      throw new HttpsError('internal', 'Failed to register user');
    }
  }
);

export const getCurrentUser = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid } = request.auth;
    
    try {
      const userRef = admin.firestore().collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }
      
      return { user: userDoc.data() };
      
    } catch (error) {
      logger.error('Get current user error:', error);
      throw new HttpsError('internal', 'Failed to get user data');
    }
  }
);

// Username to Email lookup for login
export const lookupUserByUsername = onCall(
  { cors: true },
  async (request) => {
    const { username } = request.data;
    
    if (!username) {
      throw new HttpsError('invalid-argument', 'Username is required');
    }
    
    try {
      // Query users collection for username
      const usersRef = admin.firestore().collection('users');
      const snapshot = await usersRef.where('username', '==', username.toLowerCase()).get();
      
      if (snapshot.empty) {
        throw new HttpsError('not-found', 'User not found');
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      return { 
        email: userData.email,
        uid: userData.uid,
        name: userData.name 
      };
      
    } catch (error) {
      logger.error('Username lookup error:', error);
      throw new HttpsError('internal', 'Failed to lookup user');
    }
  }
);

// Set username during registration/profile update
export const setUsername = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { username } = request.data;
    
    if (!username) {
      throw new HttpsError('invalid-argument', 'Username is required');
    }
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new HttpsError('invalid-argument', 'Username must be 3-20 characters, letters, numbers, and underscores only');
    }
    
    try {
      const normalizedUsername = username.toLowerCase();
      
      // Check if username already exists
      const usersRef = admin.firestore().collection('users');
      const existingUser = await usersRef.where('username', '==', normalizedUsername).get();
      
      if (!existingUser.empty) {
        const existingUserData = existingUser.docs[0].data();
        if (existingUserData.uid !== request.auth.uid) {
          throw new HttpsError('already-exists', 'Username already taken');
        }
      }
      
      // Update user profile with username
      const userRef = admin.firestore().collection('users').doc(request.auth.uid);
      await userRef.update({
        username: normalizedUsername,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      logger.info(`Username set for user ${request.auth.uid}: ${normalizedUsername}`);
      
      return { success: true, username: normalizedUsername };
      
    } catch (error) {
      logger.error('Set username error:', error);
      throw new HttpsError('internal', 'Failed to set username');
    }
  }
);