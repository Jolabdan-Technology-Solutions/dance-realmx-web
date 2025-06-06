import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, Subscription } from '@prisma/client';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        plan: true,
      },
    });
  }

  async findActive(userId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: {
          gt: new Date(),
        },
      },
    });
  }

  async findById(id: number): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id: parseInt(planId) },
    });
  }

  async getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
    return this.prisma.subscriptionPlan.findUnique({
      where: { slug },
    });
  }

  async createCheckoutSession(
    planSlug: string,
    frequency: 'MONTHLY' | 'YEARLY' | 'month' | 'year',
    email: string,
    userId: string,
  ) {
    const plan = await this.getSubscriptionPlanBySlug(planSlug);
    if (!plan) {
      throw new HttpException('Plan not found', 404);
    }

    let priceId: string | undefined;
    const isMonthly = frequency.toLowerCase() === 'monthly' || frequency.toLowerCase() === 'month';

    switch (planSlug.toLowerCase()) {
      case 'silver':
        priceId = isMonthly ? process.env.STRIPE_PRICE_SILVER_MONTHLY : process.env.STRIPE_PRICE_SILVER_YEARLY;
        break;
      case 'gold':
        priceId = isMonthly ? process.env.STRIPE_PRICE_GOLD_MONTHLY : process.env.STRIPE_PRICE_GOLD_YEARLY;
        break;
      case 'platinum':
        priceId = isMonthly ? process.env.STRIPE_PRICE_PLATINUM_MONTHLY : process.env.STRIPE_PRICE_PLATINUM_YEARLY;
        break;
      default:
        throw new HttpException('Invalid plan', 400);
    }

    if (!priceId) {
      throw new HttpException(`Stripe price ID for ${planSlug} ${frequency} plan is not set`, 400);
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription`,
        customer_email: email,
        metadata: {
          userId,
          planId: plan.id.toString(),
        },
      });

      // Create a pending subscription
      await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          stripeSessionId: session.id,
          status: SubscriptionStatus.PENDING,
          frequency: frequency.toLowerCase(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new HttpException('Failed to create checkout session', 500);
    }
  }

  async update(
    id: string,
    updateSubscriptionDto: Partial<{
      status: SubscriptionStatus;
      planId: number;
      stripeSubscriptionId: string;
      stripeCustomerId: string;
      stripePriceId: string;
      stripeSessionId: string;
    }>,
  ) {
    return this.prisma.subscription.update({
      where: { id: parseInt(id) },
      data: updateSubscriptionDto,
    });
  }

  async updateStatus(id: string, status: SubscriptionStatus) {
    return this.prisma.subscription.update({
      where: { id: parseInt(id) },
      data: { status },
    });
  }

  async remove(id: string) {
    return this.prisma.subscription.delete({
      where: { id: parseInt(id) },
    });
  }
}
