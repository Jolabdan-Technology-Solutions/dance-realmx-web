import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Subscription, SubscriptionTier } from '@prisma/client';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async findAll(): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      include: {
        user: true,
      },
    });
  }

  async findOne(id: number): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByUser(userId: number): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { user_id: userId },
    });
  }

  async findActive(userId: number): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
        current_period_end: {
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

  async findByUserId(userId: number): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { user_id: userId },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async create(data: {
    user_id: number;
    tier: SubscriptionTier;
    stripe_subscription_id: string;
    current_period_start: Date;
    current_period_end: Date;
    status: SubscriptionStatus;
  }): Promise<Subscription> {
    const subscription = await this.prisma.subscription.create({
      data,
      include: {
        user: true,
      },
    });

    // Get user details for email
    const user = await this.prisma.user.findUnique({
      where: { id: data.user_id },
    });

    if (user) {
      await this.mailService.sendSubscriptionConfirmation(
        user.email,
        user.first_name || user.username,
        data.tier,
        data.current_period_start,
        data.current_period_end,
      );
    }

    return subscription;
  }

  async update(id: number, data: Partial<Subscription>): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async updateStatus(
    id: number,
    status: SubscriptionStatus,
  ): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: number): Promise<Subscription> {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }

  async createCheckoutSession(data: {
    planSlug: string;
    frequency: 'MONTHLY' | 'YEARLY';
    email: string;
  }) {
    // Get the subscription plan from the database
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: data.planSlug },
    });

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Get the user by email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const priceId =
      data.frequency === 'MONTHLY'
        ? plan.stripePriceIdMonthly
        : plan.stripePriceIdYearly;

    if (!priceId) {
      throw new Error(
        `Stripe price ID for ${data.frequency.toLowerCase()} plan is not set.`,
      );
    }

    // Create a Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${this.configService.get('FRONTEND_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/subscription?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        frequency: data.frequency,
      },
    });

    // Create a pending subscription record
    await this.prisma.subscription.create({
      data: {
        user_id: user.id,
        plan_id: plan.id,
        stripe_session_id: session.id,
        status: 'PENDING',
        frequency: data.frequency,
        current_period_start: new Date(),
        current_period_end: new Date(), // Will be updated by webhook
      },
    });

    return { url: session.url };
  }

  async findAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        priceMonthly: 'asc',
      },
    });
  }

  // Helper to find a plan by slug
  async findPlanBySlug(slug: string) {
    return this.prisma.subscriptionPlan.findUnique({ where: { slug } });
  }

  // Helper to find a user by email
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Helper to create a Stripe subscription session
  async createStripeSubscriptionSession(
    user: any,
    plan: any,
    priceAmount: number,
    frequency: 'MONTHLY' | 'YEARLY',
  ) {
    if (!user?.email || !plan?.name || !priceAmount) {
      throw new HttpException(
        'Missing required data for Stripe session',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 1. Create Stripe Product
      const product = await this.stripe.products.create({
        name: `${plan.name} - ${frequency}`,
      });

      // 2. Create Stripe Price
      const price = await this.stripe.prices.create({
        unit_amount: priceAmount * 100, // Amount in cents
        currency: 'usd',
        recurring: {
          interval: frequency === 'YEARLY' ? 'year' : 'month', // Convert to Stripe interval format
        },
        product: product.id,
      });

      // 3. Create Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${this.configService.get('FRONTEND_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/subscription/cancel`,
        metadata: {
          userId: user.id,
          planId: plan.id,
          frequency,
        },
      });

      return session;
    } catch (error) {
      console.error('Stripe session creation error:', error);
      throw new HttpException(
        error.message || 'Failed to create Stripe checkout session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper to create a pending subscription record
  async createPendingSubscription({
    userId,
    planId,
    stripeSessionId,
    status,
    frequency,
    currentPeriodStart,
    currentPeriodEnd,
  }) {
    return this.prisma.subscription.create({
      data: {
        user_id: userId,
        plan_id: planId,
        stripe_session_id: stripeSessionId,
        status,
        frequency,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
      },
    });
  }
}
