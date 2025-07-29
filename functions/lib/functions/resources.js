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
exports.purchaseResource = exports.deleteResource = exports.updateResource = exports.createResource = exports.getResource = exports.getResources = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
exports.getResources = (0, https_1.onCall)({ cors: true }, async (request) => {
    try {
        const resourcesRef = admin.firestore().collection('resources');
        const snapshot = await resourcesRef.where('isActive', '==', true).get();
        const resources = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { resources };
    }
    catch (error) {
        logger.error('Get resources error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch resources');
    }
});
exports.getResource = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { resourceId } = request.data;
    if (!resourceId) {
        throw new https_1.HttpsError('invalid-argument', 'Resource ID is required');
    }
    try {
        const resourceRef = admin.firestore().collection('resources').doc(resourceId);
        const resourceDoc = await resourceRef.get();
        if (!resourceDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Resource not found');
        }
        return { resource: { id: resourceDoc.id, ...resourceDoc.data() } };
    }
    catch (error) {
        logger.error('Get resource error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch resource');
    }
});
exports.createResource = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check user role
    const userRef = admin.firestore().collection('users').doc(request.auth.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    if (!userData?.role?.includes('ADMIN') && !userData?.role?.includes('INSTRUCTOR')) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions');
    }
    const { title, description, type, price, category, fileUrl } = request.data;
    if (!title || !description || !type) {
        throw new https_1.HttpsError('invalid-argument', 'Title, description, and type are required');
    }
    try {
        const resourceRef = admin.firestore().collection('resources').doc();
        const resourceData = {
            title,
            description,
            type, // VIDEO, PDF, AUDIO, etc.
            price: price || 0,
            category: category || 'GENERAL',
            fileUrl: fileUrl || null,
            creatorId: request.auth.uid,
            isActive: true,
            downloadCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await resourceRef.set(resourceData);
        logger.info(`Created resource: ${title}`);
        return { resource: { id: resourceRef.id, ...resourceData } };
    }
    catch (error) {
        logger.error('Create resource error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create resource');
    }
});
exports.updateResource = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { resourceId, ...updateData } = request.data;
    if (!resourceId) {
        throw new https_1.HttpsError('invalid-argument', 'Resource ID is required');
    }
    try {
        const resourceRef = admin.firestore().collection('resources').doc(resourceId);
        const resourceDoc = await resourceRef.get();
        if (!resourceDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Resource not found');
        }
        const resourceData = resourceDoc.data();
        // Check permissions - only creator or admin can update
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (resourceData?.creatorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the creator or admin can update this resource');
        }
        const updatedData = {
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await resourceRef.update(updatedData);
        const updatedResource = await resourceRef.get();
        return { resource: { id: updatedResource.id, ...updatedResource.data() } };
    }
    catch (error) {
        logger.error('Update resource error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update resource');
    }
});
exports.deleteResource = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { resourceId } = request.data;
    if (!resourceId) {
        throw new https_1.HttpsError('invalid-argument', 'Resource ID is required');
    }
    try {
        const resourceRef = admin.firestore().collection('resources').doc(resourceId);
        const resourceDoc = await resourceRef.get();
        if (!resourceDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Resource not found');
        }
        const resourceData = resourceDoc.data();
        // Check permissions
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (resourceData?.creatorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the creator or admin can delete this resource');
        }
        // Soft delete
        await resourceRef.update({
            isActive: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Delete resource error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete resource');
    }
});
exports.purchaseResource = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { resourceId } = request.data;
    if (!resourceId) {
        throw new https_1.HttpsError('invalid-argument', 'Resource ID is required');
    }
    try {
        const resourceRef = admin.firestore().collection('resources').doc(resourceId);
        const resourceDoc = await resourceRef.get();
        if (!resourceDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Resource not found');
        }
        const resourceData = resourceDoc.data();
        // Check if already purchased
        const existingPurchase = await admin.firestore()
            .collection('purchases')
            .where('userId', '==', request.auth.uid)
            .where('resourceId', '==', resourceId)
            .where('status', '==', 'COMPLETED')
            .get();
        if (!existingPurchase.empty) {
            throw new https_1.HttpsError('already-exists', 'Resource already purchased');
        }
        // If free resource, create purchase record directly
        if (resourceData?.price === 0) {
            const purchaseRef = admin.firestore().collection('purchases').doc();
            const purchaseData = {
                userId: request.auth.uid,
                resourceId,
                amount: 0,
                status: 'COMPLETED',
                purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await purchaseRef.set(purchaseData);
            // Update download count
            await resourceRef.update({
                downloadCount: admin.firestore.FieldValue.increment(1),
            });
            return { purchase: { id: purchaseRef.id, ...purchaseData } };
        }
        // For paid resources, you would integrate with Stripe here
        throw new https_1.HttpsError('unimplemented', 'Paid resource purchases not yet implemented');
    }
    catch (error) {
        logger.error('Purchase resource error:', error);
        throw new https_1.HttpsError('internal', 'Failed to purchase resource');
    }
});
//# sourceMappingURL=resources.js.map