import { Router } from "express";
import { getUserFeatures, checkFeatureAccess } from "@/controllers/features";
import { getSubscriptionPlans, createCheckoutSession } from "@/controllers/subscriptions";
import { authenticate } from "@/middleware/auth";

const router = Router();

// Feature routes
router.get("/users/features", authenticate, getUserFeatures);
router.get("/features/check/:featureKey", authenticate, checkFeatureAccess);

// Subscription routes
router.get("/subscriptions/plans", getSubscriptionPlans);
router.post("/subscriptions/checkout", authenticate, createCheckoutSession);

export default router; 