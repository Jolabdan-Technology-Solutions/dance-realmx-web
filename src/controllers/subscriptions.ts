import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function getSubscriptionPlans(req: Request, res: Response) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    });

    return res.json(plans);
  } catch (error) {
    console.error("Error getting subscription plans:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { planSlug, frequency } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get the plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { slug: planSlug },
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Get or create Stripe customer
    let stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { user_id: userId },
    });

    if (!stripeCustomer) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        metadata: {
          userId: userId.toString(),
        },
      });

      stripeCustomer = await prisma.stripeCustomer.create({
        data: {
          user_id: userId,
          stripe_customer_id: customer.id,
        },
      });
    }

    // Create checkout session
    const priceId = frequency === "MONTHLY" 
      ? plan.stripePriceIdMonthly 
      : plan.stripePriceIdYearly;

    if (!priceId) {
      return res.status(400).json({ message: "Plan price not configured" });
    }

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new Error("FRONTEND_URL environment variable is not set");
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard`,
      metadata: {
        userId: userId.toString(),
        planId: plan.id.toString(),
        frequency,
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
} 