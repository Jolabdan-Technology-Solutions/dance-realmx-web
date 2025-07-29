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
exports.updateSubscription = exports.cancelSubscription = exports.createSubscription = exports.getSubscriptionPlans = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
exports.getSubscriptionPlans = (0, https_1.onCall)({ cors: true }, async (request) => {
    try {
        const plansRef = admin.firestore().collection('subscriptionPlans');
        const snapshot = await plansRef.where('isActive', '==', true).get();
        const plans = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { plans };
    }
    catch (error) {
        logger.error('Get subscription plans error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch subscription plans');
    }
});
exports.createSubscription = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { planId } = request.data;
    if (!planId) {
        throw new https_1.HttpsError('invalid-argument', 'Plan ID is required');
    }
    try {
        // Check if plan exists
        const planRef = admin.firestore().collection('subscriptionPlans').doc(planId);
        const planDoc = await planRef.get();
        if (!planDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Subscription plan not found');
        }
        // Check if user already has active subscription
        const existingSub = await admin.firestore()
            .collection('subscriptions')
            .where('userId', '==', request.auth.uid)
            .where('status', 'in', ['ACTIVE', 'TRIALING'])
            .get();
        if (!existingSub.empty) {
            throw new https_1.HttpsError('already-exists', 'User already has an active subscription');
        }
        const planData = planDoc.data();
        const subscriptionRef = admin.firestore().collection('subscriptions').doc();
        const subscriptionData = {
            userId: request.auth.uid,
            planId,
            status: 'PENDING',
            amount: planData?.price || 0,
            currency: planData?.currency || 'USD',
            interval: planData?.interval || 'MONTHLY',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await subscriptionRef.set(subscriptionData);
        logger.info(`Created subscription for user ${request.auth.uid}`);
        return { subscription: { id: subscriptionRef.id, ...subscriptionData } };
    }
    catch (error) {
        logger.error('Create subscription error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create subscription');
    }
});
exports.cancelSubscription = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId } = request.data;
    if (!subscriptionId) {
        throw new https_1.HttpsError('invalid-argument', 'Subscription ID is required');
    }
    try {
        const subscriptionRef = admin.firestore().collection('subscriptions').doc(subscriptionId);
        const subscriptionDoc = await subscriptionRef.get();
        if (!subscriptionDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Subscription not found');
        }
        const subscriptionData = subscriptionDoc.data();
        // Check if user owns this subscription
        if (subscriptionData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot cancel another user\'s subscription');
        }
        // Update subscription status
        await subscriptionRef.update({
            status: 'CANCELLED',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Cancelled subscription ${subscriptionId}`);
        return { success: true };
    }
    catch (error) {
        logger.error('Cancel subscription error:', error);
        throw new https_1.HttpsError('internal', 'Failed to cancel subscription');
    }
});
exports.updateSubscription = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId, planId } = request.data;
    if (!subscriptionId || !planId) {
        throw new https_1.HttpsError('invalid-argument', 'Subscription ID and Plan ID are required');
    }
    try {
        const subscriptionRef = admin.firestore().collection('subscriptions').doc(subscriptionId);
        const subscriptionDoc = await subscriptionRef.get();
        if (!subscriptionDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Subscription not found');
        }
        const subscriptionData = subscriptionDoc.data();
        // Check if user owns this subscription
        if (subscriptionData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot update another user\'s subscription');
        }
        // Check if new plan exists
        const planRef = admin.firestore().collection('subscriptionPlans').doc(planId);
        const planDoc = await planRef.get();
        if (!planDoc.exists) {
            throw new https_1.HttpsError('not-found', 'New subscription plan not found');
        }
        const planData = planDoc.data();
        // Update subscription
        await subscriptionRef.update({
            planId,
            amount: planData?.price || 0,
            currency: planData?.currency || 'USD',
            interval: planData?.interval || 'MONTHLY',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Updated subscription ${subscriptionId}`);
        const updatedSubscription = await subscriptionRef.get();
        return { subscription: { id: updatedSubscription.id, ...updatedSubscription.data() } };
    }
    catch (error) {
        logger.error('Update subscription error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update subscription');
    }
});
//# sourceMappingURL=subscriptions.js.map