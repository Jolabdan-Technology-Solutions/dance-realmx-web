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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentHistory = exports.handleStripeWebhook = exports.createPaymentIntent = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
// Define secrets
const stripeSecretKey = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
// Initialize Stripe lazily
let stripe = null;
function getStripe() {
    if (!stripe) {
        const key = stripeSecretKey.value();
        if (!key) {
            throw new Error('Stripe secret key not configured');
        }
        stripe = new stripe_1.default(key);
    }
    return stripe;
}
exports.createPaymentIntent = (0, https_1.onCall)({ cors: true, secrets: [stripeSecretKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { amount, currency = 'usd', metadata = {} } = request.data;
    if (!amount || amount <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'Valid amount is required');
    }
    try {
        const stripeClient = getStripe();
        // Get user data
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata: {
                userId: request.auth.uid,
                userEmail: userData?.email || request.auth.token.email,
                ...metadata,
            },
        });
        // Store payment intent in Firestore
        const paymentRef = admin.firestore().collection('payments').doc(paymentIntent.id);
        await paymentRef.set({
            id: paymentIntent.id,
            userId: request.auth.uid,
            amount: amount,
            currency,
            status: 'PENDING',
            metadata,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Created payment intent ${paymentIntent.id} for user ${request.auth.uid}`);
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    }
    catch (error) {
        logger.error('Create payment intent error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create payment intent');
    }
});
exports.handleStripeWebhook = (0, https_1.onRequest)({
    cors: true,
    memory: '1GiB',
    timeoutSeconds: 60,
    secrets: [stripeSecretKey]
}, async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event;
    try {
        const stripeClient = getStripe();
        event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        logger.error('Webhook signature verification failed:', err);
        res.status(400).send('Webhook signature verification failed');
        return;
    }
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionCancelled(event.data.object);
                break;
            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        logger.error('Webhook handler error:', error);
        res.status(500).send('Webhook handler error');
    }
});
exports.getPaymentHistory = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const paymentsRef = admin.firestore().collection('payments');
        const snapshot = await paymentsRef
            .where('userId', '==', request.auth.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { payments };
    }
    catch (error) {
        logger.error('Get payment history error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch payment history');
    }
});
// Helper functions
async function handlePaymentSuccess(paymentIntent) {
    try {
        const paymentRef = admin.firestore().collection('payments').doc(paymentIntent.id);
        await paymentRef.update({
            status: 'SUCCEEDED',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            stripeData: paymentIntent,
        });
        logger.info(`Payment ${paymentIntent.id} succeeded`);
        // Handle any post-payment logic here (e.g., grant access to content)
        const metadata = paymentIntent.metadata;
        if (metadata.type === 'course_enrollment' && metadata.courseId) {
            // Auto-enroll user in course
            // Implementation would depend on your business logic
        }
    }
    catch (error) {
        logger.error('Handle payment success error:', error);
    }
}
async function handlePaymentFailure(paymentIntent) {
    try {
        const paymentRef = admin.firestore().collection('payments').doc(paymentIntent.id);
        await paymentRef.update({
            status: 'FAILED',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            stripeData: paymentIntent,
        });
        logger.info(`Payment ${paymentIntent.id} failed`);
    }
    catch (error) {
        logger.error('Handle payment failure error:', error);
    }
}
async function handleSubscriptionUpdate(subscription) {
    try {
        const customerId = subscription.customer;
        // Find user by Stripe customer ID
        const usersRef = admin.firestore().collection('users');
        const userQuery = await usersRef.where('stripeCustomerId', '==', customerId).get();
        if (userQuery.empty) {
            logger.warn(`No user found for Stripe customer ${customerId}`);
            return;
        }
        const userDoc = userQuery.docs[0];
        const userId = userDoc.id;
        // Update or create subscription record
        const subscriptionRef = admin.firestore().collection('subscriptions').doc(subscription.id);
        await subscriptionRef.set({
            id: subscription.id,
            userId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status.toUpperCase(),
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        logger.info(`Updated subscription ${subscription.id} for user ${userId}`);
    }
    catch (error) {
        logger.error('Handle subscription update error:', error);
    }
}
async function handleSubscriptionCancelled(subscription) {
    try {
        const subscriptionRef = admin.firestore().collection('subscriptions').doc(subscription.id);
        await subscriptionRef.update({
            status: 'CANCELLED',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Cancelled subscription ${subscription.id}`);
    }
    catch (error) {
        logger.error('Handle subscription cancellation error:', error);
    }
}
//# sourceMappingURL=payments.js.map