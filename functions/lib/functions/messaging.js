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
exports.deleteConversation = exports.getUnreadMessageCount = exports.editMessage = exports.deleteMessage = exports.markMessagesRead = exports.getMessages = exports.getConversations = exports.sendMessage = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Send Message
exports.sendMessage = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { recipientId, content, conversationId, messageType = 'TEXT', attachments = [] } = request.data;
    if (!recipientId || !content) {
        throw new https_1.HttpsError('invalid-argument', 'Recipient ID and content are required');
    }
    try {
        // Verify recipient exists
        const recipientRef = admin.firestore().collection('users').doc(recipientId);
        const recipientDoc = await recipientRef.get();
        if (!recipientDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Recipient not found');
        }
        // Get or create conversation
        let actualConversationId = conversationId;
        if (!conversationId) {
            // Check if conversation already exists between these users
            const existingConversation = await admin.firestore()
                .collection('conversations')
                .where('participants', 'array-contains', request.auth?.uid)
                .get();
            let foundConversation = null;
            for (const doc of existingConversation.docs) {
                const data = doc.data();
                if (data.participants.includes(recipientId) && data.participants.length === 2) {
                    foundConversation = doc;
                    break;
                }
            }
            if (foundConversation) {
                actualConversationId = foundConversation.id;
            }
            else {
                // Create new conversation
                const conversationRef = admin.firestore().collection('conversations').doc();
                const conversationData = {
                    participants: [request.auth.uid, recipientId],
                    lastMessage: content.substring(0, 100),
                    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
                    unreadCounts: {
                        [request.auth.uid]: 0,
                        [recipientId]: 1
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                await conversationRef.set(conversationData);
                actualConversationId = conversationRef.id;
            }
        }
        // Create message
        const messageRef = admin.firestore().collection('messages').doc();
        const messageData = {
            conversationId: actualConversationId,
            senderId: request.auth.uid,
            recipientId,
            content,
            messageType,
            attachments,
            isRead: false,
            isEdited: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await messageRef.set(messageData);
        // Update conversation
        const conversationRef = admin.firestore().collection('conversations').doc(actualConversationId);
        await conversationRef.update({
            lastMessage: content.substring(0, 100),
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            [`unreadCounts.${recipientId}`]: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create notification for recipient
        const notificationRef = admin.firestore().collection('notifications').doc();
        const senderRef = admin.firestore().collection('users').doc(request.auth.uid);
        const senderDoc = await senderRef.get();
        const senderData = senderDoc.data();
        await notificationRef.set({
            userId: recipientId,
            type: 'NEW_MESSAGE',
            title: 'New Message',
            message: `${senderData?.name || 'Someone'} sent you a message`,
            data: {
                messageId: messageRef.id,
                conversationId: actualConversationId,
                senderId: request.auth.uid
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Message sent from ${request.auth.uid} to ${recipientId}`);
        return {
            message: { id: messageRef.id, ...messageData },
            conversationId: actualConversationId
        };
    }
    catch (error) {
        logger.error('Send message error:', error);
        throw new https_1.HttpsError('internal', 'Failed to send message');
    }
});
exports.getConversations = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { limit = 20 } = request.data;
    try {
        const conversationsRef = admin.firestore().collection('conversations');
        const snapshot = await conversationsRef
            .where('participants', 'array-contains', request.auth?.uid)
            .orderBy('lastMessageAt', 'desc')
            .limit(limit)
            .get();
        const conversations = [];
        for (const doc of snapshot.docs) {
            const conversationData = doc.data();
            // Get other participant info
            const otherParticipantId = conversationData.participants.find((id) => id !== request.auth?.uid);
            let otherParticipant = null;
            if (otherParticipantId) {
                const userRef = admin.firestore().collection('users').doc(otherParticipantId);
                const userDoc = await userRef.get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    otherParticipant = {
                        id: otherParticipantId,
                        name: userData?.name,
                        profileImage: userData?.profileImage
                    };
                }
            }
            conversations.push({
                id: doc.id,
                ...conversationData,
                otherParticipant,
                unreadCount: conversationData.unreadCounts?.[request.auth?.uid] || 0
            });
        }
        return { conversations };
    }
    catch (error) {
        logger.error('Get conversations error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch conversations');
    }
});
exports.getMessages = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { conversationId, limit = 50, cursor } = request.data;
    if (!conversationId) {
        throw new https_1.HttpsError('invalid-argument', 'Conversation ID is required');
    }
    try {
        // Verify user is participant in conversation
        const conversationRef = admin.firestore().collection('conversations').doc(conversationId);
        const conversationDoc = await conversationRef.get();
        if (!conversationDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Conversation not found');
        }
        const conversationData = conversationDoc.data();
        if (!conversationData?.participants.includes(request.auth?.uid)) {
            throw new https_1.HttpsError('permission-denied', 'Not a participant in this conversation');
        }
        let query = admin.firestore().collection('messages')
            .where('conversationId', '==', conversationId)
            .orderBy('createdAt', 'desc');
        if (cursor) {
            const cursorDoc = await admin.firestore().collection('messages').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }
        const snapshot = await query.limit(limit).get();
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).reverse(); // Reverse to show chronological order
        const nextCursor = snapshot.docs.length === limit ?
            snapshot.docs[snapshot.docs.length - 1].id : null;
        return {
            messages,
            nextCursor,
            hasMore: snapshot.docs.length === limit
        };
    }
    catch (error) {
        logger.error('Get messages error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch messages');
    }
});
exports.markMessagesRead = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { conversationId } = request.data;
    if (!conversationId) {
        throw new https_1.HttpsError('invalid-argument', 'Conversation ID is required');
    }
    try {
        // Verify user is participant
        const conversationRef = admin.firestore().collection('conversations').doc(conversationId);
        const conversationDoc = await conversationRef.get();
        if (!conversationDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Conversation not found');
        }
        const conversationData = conversationDoc.data();
        if (!conversationData?.participants.includes(request.auth?.uid)) {
            throw new https_1.HttpsError('permission-denied', 'Not a participant in this conversation');
        }
        // Mark all unread messages as read
        const unreadMessages = await admin.firestore()
            .collection('messages')
            .where('conversationId', '==', conversationId)
            .where('recipientId', '==', request.auth?.uid)
            .where('isRead', '==', false)
            .get();
        const batch = admin.firestore().batch();
        unreadMessages.docs.forEach(doc => {
            batch.update(doc.ref, {
                isRead: true,
                readAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        // Reset unread count in conversation
        batch.update(conversationRef, {
            [`unreadCounts.${request.auth?.uid}`]: 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        return { success: true, markedCount: unreadMessages.size };
    }
    catch (error) {
        logger.error('Mark messages read error:', error);
        throw new https_1.HttpsError('internal', 'Failed to mark messages as read');
    }
});
exports.deleteMessage = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { messageId } = request.data;
    if (!messageId) {
        throw new https_1.HttpsError('invalid-argument', 'Message ID is required');
    }
    try {
        const messageRef = admin.firestore().collection('messages').doc(messageId);
        const messageDoc = await messageRef.get();
        if (!messageDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Message not found');
        }
        const messageData = messageDoc.data();
        if (messageData?.senderId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Can only delete your own messages');
        }
        // Check if message is less than 5 minutes old
        const messageTime = messageData?.createdAt?.toDate();
        const now = new Date();
        const minutesDiff = (now.getTime() - messageTime.getTime()) / (1000 * 60);
        if (minutesDiff > 5) {
            throw new https_1.HttpsError('failed-precondition', 'Can only delete messages within 5 minutes of sending');
        }
        // Soft delete
        await messageRef.update({
            content: '[Message deleted]',
            isDeleted: true,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Delete message error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete message');
    }
});
exports.editMessage = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { messageId, content } = request.data;
    if (!messageId || !content) {
        throw new https_1.HttpsError('invalid-argument', 'Message ID and content are required');
    }
    try {
        const messageRef = admin.firestore().collection('messages').doc(messageId);
        const messageDoc = await messageRef.get();
        if (!messageDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Message not found');
        }
        const messageData = messageDoc.data();
        if (messageData?.senderId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Can only edit your own messages');
        }
        // Check if message is less than 15 minutes old
        const messageTime = messageData?.createdAt?.toDate();
        const now = new Date();
        const minutesDiff = (now.getTime() - messageTime.getTime()) / (1000 * 60);
        if (minutesDiff > 15) {
            throw new https_1.HttpsError('failed-precondition', 'Can only edit messages within 15 minutes of sending');
        }
        await messageRef.update({
            content,
            isEdited: true,
            editedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Edit message error:', error);
        throw new https_1.HttpsError('internal', 'Failed to edit message');
    }
});
exports.getUnreadMessageCount = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const conversationsRef = admin.firestore().collection('conversations');
        const snapshot = await conversationsRef
            .where('participants', 'array-contains', request.auth?.uid)
            .get();
        let totalUnread = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = request.auth?.uid;
            if (userId) {
                const unreadCount = data.unreadCounts?.[userId] || 0;
                totalUnread += unreadCount;
            }
        });
        return { count: totalUnread };
    }
    catch (error) {
        logger.error('Get unread message count error:', error);
        throw new https_1.HttpsError('internal', 'Failed to get unread message count');
    }
});
exports.deleteConversation = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { conversationId } = request.data;
    if (!conversationId) {
        throw new https_1.HttpsError('invalid-argument', 'Conversation ID is required');
    }
    try {
        const conversationRef = admin.firestore().collection('conversations').doc(conversationId);
        const conversationDoc = await conversationRef.get();
        if (!conversationDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Conversation not found');
        }
        const conversationData = conversationDoc.data();
        if (!conversationData?.participants.includes(request.auth?.uid)) {
            throw new https_1.HttpsError('permission-denied', 'Not a participant in this conversation');
        }
        // For now, just hide conversation for this user
        // In a full implementation, you might want to delete when both users delete
        await conversationRef.update({
            [`hiddenFor.${request.auth?.uid}`]: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Delete conversation error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete conversation');
    }
});
//# sourceMappingURL=messaging.js.map