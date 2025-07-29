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
exports.sendBulkNotification = exports.updateNotificationSettings = exports.getNotificationSettings = exports.createNotification = exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getUnreadNotificationCount = exports.getNotifications = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Get Notifications
exports.getNotifications = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { unreadOnly = false, type, limit = 50, cursor // for pagination
     } = request.data;
    try {
        let query = admin.firestore().collection('notifications')
            .where('userId', '==', request.auth.uid);
        if (unreadOnly) {
            query = query.where('read', '==', false);
        }
        if (type) {
            query = query.where('type', '==', type);
        }
        query = query.orderBy('createdAt', 'desc');
        if (cursor) {
            const cursorDoc = await admin.firestore().collection('notifications').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }
        const snapshot = await query.limit(limit).get();
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const nextCursor = snapshot.docs.length === limit ?
            snapshot.docs[snapshot.docs.length - 1].id : null;
        return {
            notifications,
            nextCursor,
            hasMore: snapshot.docs.length === limit
        };
    }
    catch (error) {
        logger.error('Get notifications error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch notifications');
    }
});
exports.getUnreadNotificationCount = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const snapshot = await admin.firestore()
            .collection('notifications')
            .where('userId', '==', request.auth.uid)
            .where('read', '==', false)
            .get();
        return { count: snapshot.size };
    }
    catch (error) {
        logger.error('Get unread count error:', error);
        throw new https_1.HttpsError('internal', 'Failed to get unread notification count');
    }
});
exports.markNotificationRead = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { notificationId } = request.data;
    if (!notificationId) {
        throw new https_1.HttpsError('invalid-argument', 'Notification ID is required');
    }
    try {
        const notificationRef = admin.firestore().collection('notifications').doc(notificationId);
        const notificationDoc = await notificationRef.get();
        if (!notificationDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Notification not found');
        }
        const notificationData = notificationDoc.data();
        if (notificationData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot mark another user\'s notification as read');
        }
        await notificationRef.update({
            read: true,
            readAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Mark notification read error:', error);
        throw new https_1.HttpsError('internal', 'Failed to mark notification as read');
    }
});
exports.markAllNotificationsRead = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const batch = admin.firestore().batch();
        const unreadNotifications = await admin.firestore()
            .collection('notifications')
            .where('userId', '==', request.auth.uid)
            .where('read', '==', false)
            .get();
        unreadNotifications.docs.forEach(doc => {
            batch.update(doc.ref, {
                read: true,
                readAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
        return { success: true, markedCount: unreadNotifications.size };
    }
    catch (error) {
        logger.error('Mark all notifications read error:', error);
        throw new https_1.HttpsError('internal', 'Failed to mark all notifications as read');
    }
});
exports.deleteNotification = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { notificationId } = request.data;
    if (!notificationId) {
        throw new https_1.HttpsError('invalid-argument', 'Notification ID is required');
    }
    try {
        const notificationRef = admin.firestore().collection('notifications').doc(notificationId);
        const notificationDoc = await notificationRef.get();
        if (!notificationDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Notification not found');
        }
        const notificationData = notificationDoc.data();
        if (notificationData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot delete another user\'s notification');
        }
        await notificationRef.delete();
        return { success: true };
    }
    catch (error) {
        logger.error('Delete notification error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete notification');
    }
});
exports.createNotification = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { recipientId, type, title, message, data = {}, sendEmail = false } = request.data;
    if (!recipientId || !type || !title || !message) {
        throw new https_1.HttpsError('invalid-argument', 'Recipient ID, type, title, and message are required');
    }
    try {
        // Check if sender has permission to send notifications
        const senderRef = admin.firestore().collection('users').doc(request.auth.uid);
        const senderDoc = await senderRef.get();
        const senderData = senderDoc.data();
        const canSendNotifications = senderData?.role?.includes('ADMIN') ||
            senderData?.role?.includes('INSTRUCTOR') ||
            type.startsWith('SYSTEM_');
        if (!canSendNotifications) {
            throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to send notifications');
        }
        // Verify recipient exists
        const recipientRef = admin.firestore().collection('users').doc(recipientId);
        const recipientDoc = await recipientRef.get();
        if (!recipientDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Recipient not found');
        }
        // Create notification
        const notificationRef = admin.firestore().collection('notifications').doc();
        const notificationData = {
            userId: recipientId,
            senderId: request.auth.uid,
            type,
            title,
            message,
            data,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await notificationRef.set(notificationData);
        // Send email notification if requested
        if (sendEmail) {
            const recipientData = recipientDoc.data();
            if (recipientData?.email) {
                // Add to email queue (implement email service separately)
                const emailQueueRef = admin.firestore().collection('emailQueue').doc();
                await emailQueueRef.set({
                    to: recipientData.email,
                    subject: title,
                    body: message,
                    type: 'NOTIFICATION',
                    notificationId: notificationRef.id,
                    status: 'PENDING',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
        logger.info(`Notification sent from ${request.auth.uid} to ${recipientId}`);
        return { notification: { id: notificationRef.id, ...notificationData } };
    }
    catch (error) {
        logger.error('Create notification error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create notification');
    }
});
exports.getNotificationSettings = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const settingsRef = admin.firestore().collection('notificationSettings').doc(request.auth.uid);
        const settingsDoc = await settingsRef.get();
        if (!settingsDoc.exists) {
            // Return default settings
            const defaultSettings = {
                email: {
                    courseUpdates: true,
                    bookingUpdates: true,
                    paymentUpdates: true,
                    reviewNotifications: true,
                    marketingEmails: false,
                },
                push: {
                    courseUpdates: true,
                    bookingUpdates: true,
                    paymentUpdates: true,
                    reviewNotifications: true,
                    messageNotifications: true,
                },
                inApp: {
                    courseUpdates: true,
                    bookingUpdates: true,
                    paymentUpdates: true,
                    reviewNotifications: true,
                    messageNotifications: true,
                    systemUpdates: true,
                }
            };
            // Create default settings
            await settingsRef.set({
                ...defaultSettings,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { settings: defaultSettings };
        }
        return { settings: settingsDoc.data() };
    }
    catch (error) {
        logger.error('Get notification settings error:', error);
        throw new https_1.HttpsError('internal', 'Failed to get notification settings');
    }
});
exports.updateNotificationSettings = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { settings } = request.data;
    if (!settings) {
        throw new https_1.HttpsError('invalid-argument', 'Settings object is required');
    }
    try {
        const settingsRef = admin.firestore().collection('notificationSettings').doc(request.auth.uid);
        await settingsRef.set({
            ...settings,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { success: true };
    }
    catch (error) {
        logger.error('Update notification settings error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update notification settings');
    }
});
// Bulk notification sending (admin only)
exports.sendBulkNotification = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { recipientIds, userFilters, // e.g., { role: 'STUDENT', subscriptionTier: 'PREMIUM' }
    type, title, message, data = {}, sendEmail = false } = request.data;
    if (!type || !title || !message) {
        throw new https_1.HttpsError('invalid-argument', 'Type, title, and message are required');
    }
    if (!recipientIds && !userFilters) {
        throw new https_1.HttpsError('invalid-argument', 'Either recipient IDs or user filters must be provided');
    }
    try {
        // Check admin permissions
        const senderRef = admin.firestore().collection('users').doc(request.auth.uid);
        const senderDoc = await senderRef.get();
        const senderData = senderDoc.data();
        if (!senderData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only admins can send bulk notifications');
        }
        let targetUserIds = [];
        if (recipientIds) {
            targetUserIds = recipientIds;
        }
        else if (userFilters) {
            // Query users based on filters
            let userQuery = admin.firestore().collection('users');
            Object.entries(userFilters).forEach(([field, value]) => {
                if (field === 'role' && Array.isArray(value)) {
                    userQuery = userQuery.where(field, 'array-contains-any', value);
                }
                else if (Array.isArray(value)) {
                    userQuery = userQuery.where(field, 'in', value);
                }
                else {
                    userQuery = userQuery.where(field, '==', value);
                }
            });
            const userSnapshot = await userQuery.get();
            targetUserIds = userSnapshot.docs.map((doc) => doc.id);
        }
        if (targetUserIds.length === 0) {
            return { success: true, sentCount: 0 };
        }
        // Create notifications in batches
        const batchSize = 500; // Firestore batch limit
        const batches = [];
        for (let i = 0; i < targetUserIds.length; i += batchSize) {
            const batch = admin.firestore().batch();
            const batchUserIds = targetUserIds.slice(i, i + batchSize);
            batchUserIds.forEach(userId => {
                const notificationRef = admin.firestore().collection('notifications').doc();
                batch.set(notificationRef, {
                    userId,
                    senderId: request.auth.uid,
                    type,
                    title,
                    message,
                    data,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            batches.push(batch);
        }
        // Execute all batches
        await Promise.all(batches.map(batch => batch.commit()));
        // Queue emails if requested
        if (sendEmail) {
            const emailBatch = admin.firestore().batch();
            // Get user emails (simplified - in production you'd batch this too)
            const userDocs = await Promise.all(targetUserIds.slice(0, 100).map(id => // Limit for demo
             admin.firestore().collection('users').doc(id).get()));
            userDocs.forEach(userDoc => {
                if (userDoc.exists && userDoc.data()?.email) {
                    const emailRef = admin.firestore().collection('emailQueue').doc();
                    emailBatch.set(emailRef, {
                        to: userDoc.data()?.email,
                        subject: title,
                        body: message,
                        type: 'BULK_NOTIFICATION',
                        status: 'PENDING',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            });
            await emailBatch.commit();
        }
        logger.info(`Bulk notification sent to ${targetUserIds.length} users by ${request.auth.uid}`);
        return {
            success: true,
            sentCount: targetUserIds.length,
            emailQueued: sendEmail
        };
    }
    catch (error) {
        logger.error('Send bulk notification error:', error);
        throw new https_1.HttpsError('internal', 'Failed to send bulk notification');
    }
});
//# sourceMappingURL=notifications.js.map