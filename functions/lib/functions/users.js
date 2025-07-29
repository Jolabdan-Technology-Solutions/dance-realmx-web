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
exports.getUserAnalytics = exports.getUserProfile = exports.updateUserProfile = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
exports.updateUserProfile = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { name, bio, danceStyles, experienceLevel, profileImageUrl, socialLinks, preferences } = request.data;
    try {
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User profile not found');
        }
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (name)
            updateData.name = name;
        if (bio)
            updateData.bio = bio;
        if (danceStyles)
            updateData.danceStyles = danceStyles;
        if (experienceLevel)
            updateData.experienceLevel = experienceLevel;
        if (profileImageUrl)
            updateData.profileImageUrl = profileImageUrl;
        if (socialLinks)
            updateData.socialLinks = socialLinks;
        if (preferences)
            updateData.preferences = preferences;
        await userRef.update(updateData);
        const updatedUser = await userRef.get();
        logger.info(`Updated profile for user ${request.auth.uid}`);
        return { user: updatedUser.data() };
    }
    catch (error) {
        logger.error('Update user profile error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update user profile');
    }
});
exports.getUserProfile = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { userId } = request.data;
    // If no userId provided, get current user's profile
    const targetUserId = userId || request.auth?.uid;
    if (!targetUserId) {
        throw new https_1.HttpsError('invalid-argument', 'User ID is required');
    }
    try {
        const userRef = admin.firestore().collection('users').doc(targetUserId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User profile not found');
        }
        const userData = userDoc.data();
        // Return public profile data only if viewing another user's profile
        if (userId && userId !== request.auth?.uid) {
            const publicData = {
                uid: userData?.uid,
                name: userData?.name,
                bio: userData?.bio,
                danceStyles: userData?.danceStyles,
                experienceLevel: userData?.experienceLevel,
                profileImageUrl: userData?.profileImageUrl,
                socialLinks: userData?.socialLinks,
                createdAt: userData?.createdAt,
            };
            return { user: publicData };
        }
        // Return full profile for own profile
        return { user: userData };
    }
    catch (error) {
        logger.error('Get user profile error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch user profile');
    }
});
exports.getUserAnalytics = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const userId = request.auth.uid;
        // Get user's enrolled courses
        const enrollmentsRef = admin.firestore().collection('enrollments');
        const enrollmentsSnapshot = await enrollmentsRef
            .where('userId', '==', userId)
            .get();
        const totalCourses = enrollmentsSnapshot.size;
        const completedCourses = enrollmentsSnapshot.docs.filter(doc => doc.data().progress >= 100).length;
        // Get user's bookings
        const bookingsRef = admin.firestore().collection('bookings');
        const bookingsSnapshot = await bookingsRef
            .where('userId', '==', userId)
            .get();
        const totalBookings = bookingsSnapshot.size;
        const completedBookings = bookingsSnapshot.docs.filter(doc => doc.data().status === 'COMPLETED').length;
        // Get user's purchases
        const purchasesRef = admin.firestore().collection('purchases');
        const purchasesSnapshot = await purchasesRef
            .where('userId', '==', userId)
            .where('status', '==', 'COMPLETED')
            .get();
        const totalPurchases = purchasesSnapshot.size;
        const totalSpent = purchasesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        // Get user's subscription status
        const subscriptionsRef = admin.firestore().collection('subscriptions');
        const subscriptionsSnapshot = await subscriptionsRef
            .where('userId', '==', userId)
            .where('status', 'in', ['ACTIVE', 'TRIALING'])
            .get();
        const hasActiveSubscription = !subscriptionsSnapshot.empty;
        const currentSubscription = hasActiveSubscription ?
            subscriptionsSnapshot.docs[0].data() : null;
        // Calculate learning progress
        const averageProgress = enrollmentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().progress || 0), 0) / Math.max(totalCourses, 1);
        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentBookings = await bookingsRef
            .where('userId', '==', userId)
            .where('createdAt', '>=', thirtyDaysAgo)
            .get();
        const recentEnrollments = await enrollmentsRef
            .where('userId', '==', userId)
            .where('enrolledAt', '>=', thirtyDaysAgo)
            .get();
        const analytics = {
            courses: {
                total: totalCourses,
                completed: completedCourses,
                averageProgress: Math.round(averageProgress),
            },
            bookings: {
                total: totalBookings,
                completed: completedBookings,
                recent: recentBookings.size,
            },
            purchases: {
                total: totalPurchases,
                totalSpent,
            },
            subscription: {
                hasActive: hasActiveSubscription,
                current: currentSubscription,
            },
            activity: {
                recentBookings: recentBookings.size,
                recentEnrollments: recentEnrollments.size,
            },
        };
        logger.info(`Generated analytics for user ${userId}`);
        return { analytics };
    }
    catch (error) {
        logger.error('Get user analytics error:', error);
        throw new https_1.HttpsError('internal', 'Failed to generate user analytics');
    }
});
//# sourceMappingURL=users.js.map