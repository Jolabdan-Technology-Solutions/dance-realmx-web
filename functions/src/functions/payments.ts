import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';

// Define secrets
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

// Initialize Stripe lazily
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = stripeSecretKey.value();
    if (!key) {
      throw new Error('Stripe secret key not configured');
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

export const createPaymentIntent = onCall(
  { cors: true, secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, currency = 'usd', metadata = {} } = request.data;
    
    if (!amount || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Valid amount is required');
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
      
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw new HttpsError('internal', 'Failed to create payment intent');
    }
  }
);

export const handleStripeWebhook = onRequest(
  { 
    cors: true,
    memory: '1GiB',
    timeoutSeconds: 60,
    secrets: [stripeSecretKey]
  },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    let event: Stripe.Event;
    
    try {
      const stripeClient = getStripe();
      event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      res.status(400).send('Webhook signature verification failed');
      return;
    }
    
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
          break;
          
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      logger.error('Webhook handler error:', error);
      res.status(500).send('Webhook handler error');
    }
  }
);

export const getPaymentHistory = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
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
      
    } catch (error) {
      logger.error('Get payment history error:', error);
      throw new HttpsError('internal', 'Failed to fetch payment history');
    }
  }
);

// Helper functions
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
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
    
  } catch (error) {
    logger.error('Handle payment success error:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const paymentRef = admin.firestore().collection('payments').doc(paymentIntent.id);
    
    await paymentRef.update({
      status: 'FAILED',
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeData: paymentIntent,
    });
    
    logger.info(`Payment ${paymentIntent.id} failed`);
    
  } catch (error) {
    logger.error('Handle payment failure error:', error);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
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
      currentPeriodStart: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : null,
      currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    logger.info(`Updated subscription ${subscription.id} for user ${userId}`);
    
  } catch (error) {
    logger.error('Handle subscription update error:', error);
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  try {
    const subscriptionRef = admin.firestore().collection('subscriptions').doc(subscription.id);
    
    await subscriptionRef.update({
      status: 'CANCELLED',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info(`Cancelled subscription ${subscription.id}`);
    
  } catch (error) {
    logger.error('Handle subscription cancellation error:', error);
  }
}