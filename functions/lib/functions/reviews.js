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
exports.getReviewStats = exports.markReviewHelpful = exports.deleteReview = exports.updateReview = exports.getReviews = exports.createReview = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Create Review
exports.createReview = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { targetType, // 'course' or 'professional'
    targetId, rating, title, comment, helpfulTags = [] } = request.data;
    if (!targetType || !targetId || !rating || rating < 1 || rating > 5) {
        throw new https_1.HttpsError('invalid-argument', 'Target type, target ID, and valid rating (1-5) are required');
    }
    if (!['course', 'professional'].includes(targetType)) {
        throw new https_1.HttpsError('invalid-argument', 'Target type must be "course" or "professional"');
    }
    try {
        // Check if target exists and user has permission to review
        let targetRef;
        let canReview = false;
        if (targetType === 'course') {
            targetRef = admin.firestore().collection('courses').doc(targetId);
            // Check if user is enrolled in the course
            const enrollmentQuery = await admin.firestore()
                .collection('enrollments')
                .where('userId', '==', request.auth.uid)
                .where('courseId', '==', targetId)
                .where('status', 'in', ['ACTIVE', 'COMPLETED'])
                .get();
            canReview = !enrollmentQuery.empty;
        }
        else if (targetType === 'professional') {
            targetRef = admin.firestore().collection('professionals').doc(targetId);
            // Check if user has had a completed booking with the professional
            const bookingQuery = await admin.firestore()
                .collection('professionalBookings')
                .where('clientId', '==', request.auth.uid)
                .where('professionalId', '==', targetId)
                .where('status', '==', 'COMPLETED')
                .get();
            canReview = !bookingQuery.empty;
        }
        const targetDoc = await targetRef.get();
        if (!targetDoc.exists) {
            throw new https_1.HttpsError('not-found', `${targetType} not found`);
        }
        if (!canReview) {
            throw new https_1.HttpsError('permission-denied', `You must ${targetType === 'course' ? 'be enrolled in' : 'have completed a booking with'} this ${targetType} to leave a review`);
        }
        // Check if user has already reviewed this target
        const existingReview = await admin.firestore()
            .collection('reviews')
            .where('userId', '==', request.auth.uid)
            .where('targetType', '==', targetType)
            .where('targetId', '==', targetId)
            .get();
        if (!existingReview.empty) {
            throw new https_1.HttpsError('already-exists', 'You have already reviewed this ' + targetType);
        }
        // Get user info
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        // Create review
        const reviewRef = admin.firestore().collection('reviews').doc();
        const reviewData = {
            userId: request.auth.uid,
            userName: userData?.name || 'Anonymous',
            userImage: userData?.profileImage || null,
            targetType,
            targetId,
            rating,
            title: title || '',
            comment: comment || '',
            helpfulTags,
            helpfulCount: 0,
            reportedCount: 0,
            isVisible: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await reviewRef.set(reviewData);
        // Update target's rating
        await updateTargetRating(targetType, targetId);
        // Create notification for target owner
        let ownerId = null;
        const targetData = targetDoc.data();
        if (targetType === 'course') {
            ownerId = targetData?.instructorId;
        }
        else if (targetType === 'professional') {
            ownerId = targetId; // Professional ID is the same as user ID
        }
        if (ownerId && ownerId !== request.auth.uid) {
            const notificationRef = admin.firestore().collection('notifications').doc();
            await notificationRef.set({
                userId: ownerId,
                type: 'NEW_REVIEW',
                title: 'New Review Received',
                message: `You received a ${rating}-star review ${title ? `titled "${title}"` : ''}`,
                data: {
                    reviewId: reviewRef.id,
                    targetType,
                    targetId,
                    rating,
                    reviewerId: request.auth.uid
                },
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        logger.info(`Review created for ${targetType} ${targetId} by user ${request.auth.uid}`);
        return { review: { id: reviewRef.id, ...reviewData } };
    }
    catch (error) {
        logger.error('Create review error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create review');
    }
});
exports.getReviews = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { targetType, targetId, rating, sortBy = 'newest', limit = 20 } = request.data;
    if (!targetType || !targetId) {
        throw new https_1.HttpsError('invalid-argument', 'Target type and target ID are required');
    }
    try {
        let query = admin.firestore().collection('reviews')
            .where('targetType', '==', targetType)
            .where('targetId', '==', targetId)
            .where('isVisible', '==', true);
        if (rating) {
            query = query.where('rating', '==', rating);
        }
        // Apply sorting
        switch (sortBy) {
            case 'newest':
                query = query.orderBy('createdAt', 'desc');
                break;
            case 'oldest':
                query = query.orderBy('createdAt', 'asc');
                break;
            case 'highest':
                query = query.orderBy('rating', 'desc').orderBy('createdAt', 'desc');
                break;
            case 'lowest':
                query = query.orderBy('rating', 'asc').orderBy('createdAt', 'desc');
                break;
            case 'helpful':
                query = query.orderBy('helpfulCount', 'desc').orderBy('createdAt', 'desc');
                break;
            default:
                query = query.orderBy('createdAt', 'desc');
        }
        const snapshot = await query.limit(limit).get();
        const reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { reviews };
    }
    catch (error) {
        logger.error('Get reviews error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch reviews');
    }
});
exports.updateReview = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { reviewId, rating, title, comment, helpfulTags } = request.data;
    if (!reviewId) {
        throw new https_1.HttpsError('invalid-argument', 'Review ID is required');
    }
    try {
        const reviewRef = admin.firestore().collection('reviews').doc(reviewId);
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Review not found');
        }
        const reviewData = reviewDoc.data();
        if (reviewData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot update another user\'s review');
        }
        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                throw new https_1.HttpsError('invalid-argument', 'Rating must be between 1 and 5');
            }
            updates.rating = rating;
        }
        if (title !== undefined)
            updates.title = title;
        if (comment !== undefined)
            updates.comment = comment;
        if (helpfulTags !== undefined)
            updates.helpfulTags = helpfulTags;
        await reviewRef.update(updates);
        // Update target rating if rating changed
        if (rating !== undefined && rating !== reviewData?.rating) {
            await updateTargetRating(reviewData?.targetType, reviewData?.targetId);
        }
        const updatedReview = await reviewRef.get();
        return { review: { id: updatedReview.id, ...updatedReview.data() } };
    }
    catch (error) {
        logger.error('Update review error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update review');
    }
});
exports.deleteReview = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { reviewId } = request.data;
    if (!reviewId) {
        throw new https_1.HttpsError('invalid-argument', 'Review ID is required');
    }
    try {
        const reviewRef = admin.firestore().collection('reviews').doc(reviewId);
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Review not found');
        }
        const reviewData = reviewDoc.data();
        // Check permissions
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const canDelete = reviewData?.userId === request.auth.uid ||
            userData?.role?.includes('ADMIN');
        if (!canDelete) {
            throw new https_1.HttpsError('permission-denied', 'Cannot delete this review');
        }
        // Soft delete
        await reviewRef.update({
            isVisible: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update target rating
        await updateTargetRating(reviewData?.targetType, reviewData?.targetId);
        return { success: true };
    }
    catch (error) {
        logger.error('Delete review error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete review');
    }
});
exports.markReviewHelpful = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { reviewId, helpful = true } = request.data;
    if (!reviewId) {
        throw new https_1.HttpsError('invalid-argument', 'Review ID is required');
    }
    try {
        const reviewRef = admin.firestore().collection('reviews').doc(reviewId);
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Review not found');
        }
        // Check if user has already marked this review
        const existingMark = await admin.firestore()
            .collection('reviewHelpfulness')
            .where('userId', '==', request.auth.uid)
            .where('reviewId', '==', reviewId)
            .get();
        const batch = admin.firestore().batch();
        if (!existingMark.empty) {
            // Update existing mark
            const markRef = existingMark.docs[0].ref;
            const currentMark = existingMark.docs[0].data();
            if (currentMark.helpful !== helpful) {
                batch.update(markRef, {
                    helpful,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                // Update review helpful count
                const increment = helpful ? 2 : -2; // +2 if changing from unhelpful to helpful, -2 if opposite
                batch.update(reviewRef, {
                    helpfulCount: admin.firestore.FieldValue.increment(increment),
                });
            }
        }
        else {
            // Create new mark
            const markRef = admin.firestore().collection('reviewHelpfulness').doc();
            batch.set(markRef, {
                userId: request.auth.uid,
                reviewId,
                helpful,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Update review helpful count
            const increment = helpful ? 1 : -1;
            batch.update(reviewRef, {
                helpfulCount: admin.firestore.FieldValue.increment(increment),
            });
        }
        await batch.commit();
        return { success: true, helpful };
    }
    catch (error) {
        logger.error('Mark review helpful error:', error);
        throw new https_1.HttpsError('internal', 'Failed to mark review helpfulness');
    }
});
exports.getReviewStats = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { targetType, targetId } = request.data;
    if (!targetType || !targetId) {
        throw new https_1.HttpsError('invalid-argument', 'Target type and target ID are required');
    }
    try {
        const reviewsQuery = await admin.firestore()
            .collection('reviews')
            .where('targetType', '==', targetType)
            .where('targetId', '==', targetId)
            .where('isVisible', '==', true)
            .get();
        const reviews = reviewsQuery.docs.map(doc => doc.data());
        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }
        // Calculate statistics
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((review) => {
            ratingDistribution[review.rating]++;
        });
        return {
            averageRating,
            totalReviews: reviews.length,
            ratingDistribution
        };
    }
    catch (error) {
        logger.error('Get review stats error:', error);
        throw new https_1.HttpsError('internal', 'Failed to get review statistics');
    }
});
// Helper function to update target's overall rating
async function updateTargetRating(targetType, targetId) {
    try {
        const reviewsQuery = await admin.firestore()
            .collection('reviews')
            .where('targetType', '==', targetType)
            .where('targetId', '==', targetId)
            .where('isVisible', '==', true)
            .get();
        const reviews = reviewsQuery.docs.map(doc => doc.data());
        let averageRating = 0;
        let reviewCount = reviews.length;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
        }
        // Update target collection
        const collection = targetType === 'course' ? 'courses' : 'professionals';
        const targetRef = admin.firestore().collection(collection).doc(targetId);
        await targetRef.update({
            rating: averageRating,
            reviewCount: reviewCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        logger.error('Update target rating error:', error);
    }
}
//# sourceMappingURL=reviews.js.map