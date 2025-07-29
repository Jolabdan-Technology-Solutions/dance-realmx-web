"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("../services/firestore");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// Login with Firebase (replaces JWT login)
router.post('/login', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'Firebase ID token required' });
        }
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // Find or create user in Firestore
        const user = await findOrCreateUser(decodedToken);
        res.json({
            success: true,
            user: formatUserResponse(user),
            firebaseUid: decodedToken.uid,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});
// Get current user profile
router.get('/me', auth_1.validateFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const userDoc = await firestore_1.firestore.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = userDoc.data();
        res.json({
            user: formatUserResponse({ id: userDoc.id, ...userData }),
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Logout (client-side only for Firebase)
router.post('/logout', auth_1.validateFirebaseToken, async (req, res) => {
    res.json({ success: true, message: 'Logout successful' });
});
// Register (handled by Firebase Auth + user creation)
router.post('/register', async (req, res) => {
    try {
        const { idToken, userData } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'Firebase ID token required' });
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const user = await findOrCreateUser(decodedToken, userData);
        res.json({
            success: true,
            user: formatUserResponse(user),
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Helper function to find or create user in Firestore
async function findOrCreateUser(decodedToken, additionalData) {
    const { uid, email, name, picture } = decodedToken;
    // Check if user exists
    const userRef = firestore_1.firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        // Update last login
        await userRef.update({
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            email: email || userDoc.data()?.email,
        });
        return { id: uid, ...userDoc.data() };
    }
    else {
        // Create new user
        const [firstName, ...lastNameParts] = (name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        // Generate unique username
        let username = (additionalData?.username || email?.split('@')[0] || uid.substring(0, 8));
        const existingUsername = await firestore_1.firestore.collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();
        if (!existingUsername.empty) {
            username = `${username}_${uid.substring(0, 4)}`;
        }
        const newUser = {
            email: email || '',
            username,
            firstName: additionalData?.first_name || firstName || '',
            lastName: additionalData?.last_name || lastName || '',
            profileImageUrl: picture || '',
            role: ['GUEST_USER'],
            subscriptionTier: 'FREE',
            isActive: true,
            emailVerified: decodedToken.email_verified || false,
            authProvider: 'firebase',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        };
        await userRef.set(newUser);
        return { id: uid, ...newUser };
    }
}
// Helper function to format user response
function formatUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        profile_image_url: user.profileImageUrl,
        role: user.role || ['GUEST_USER'],
        subscription_tier: user.subscriptionTier || 'FREE',
        is_active: user.isActive !== false,
        email_verified: user.emailVerified || false,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
    };
}
//# sourceMappingURL=auth.js.map