import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Subscription, SubscriptionTier, UserRole } from '@prisma/client';
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

  async findOne(id: number) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id },
        include: {
          user: true,
          plan: true,
        },
      });

      if (!subscription) {
        throw new NotFoundException(`Subscription with ID ${id} not found`);
      }

      return subscription;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch subscription');
    }
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
    stripeSessionId: string,
    status: SubscriptionStatus,
  ): Promise<Subscription> {
    // First find the subscription by stripe_session_id
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripe_session_id: stripeSessionId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: subscription.user_id },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (user.subscription_tier === 'free') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { is_active: true },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { is_active: true },
      });
    }

    // Then update using the subscription's id
    return this.prisma.subscription.update({
      where: { id: subscription.id },
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

    // Check for existing pending subscription
    const existingPendingSubscription =
      await this.prisma.subscription.findFirst({
        where: {
          user_id: user.id,
          plan_id: plan.id,
          status: 'PENDING',
        },
      });

    if (existingPendingSubscription) {
      // Retrieve the existing session
      const session = await this.stripe.checkout.sessions.retrieve(
        existingPendingSubscription.stripe_session_id,
      );

      // If session is expired, create a new one
      if (session.status === 'expired') {
        await this.prisma.subscription.delete({
          where: { id: existingPendingSubscription.id },
        });
      } else {
        return { url: session.url };
      }
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

    // Create a pending subscription record only if we don't have one
    if (!existingPendingSubscription) {
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
    }

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

  async getActiveSubscription(userId: number): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
        current_period_end: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });
  }

  async getSubscriptionPlan(planId: number) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
  }

  async getTotalSubscriptions() {
    return this.prisma.subscription.count();
  }

  async getActiveSubscriptions() {
    return this.prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });
  }

  async getExpiredSubscriptions() {
    return this.prisma.subscription.count({
      where: { status: 'EXPIRED' },
    });
  }

  async getSubscriptionsByPlan() {
    return this.prisma.subscription.groupBy({
      by: ['plan_id'],
      _count: true,
    });
  }

  async getSubscriptionsByFrequency() {
    return this.prisma.subscription.groupBy({
      by: ['frequency'],
      _count: true,
    });
  }

  async getSubscriptionRevenueMetrics() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });

    const monthlyRevenue = subscriptions.reduce((acc, sub) => {
      if (sub.frequency === 'MONTHLY') {
        return acc + Number(sub.plan.priceMonthly);
      }
      return acc + Number(sub.plan.priceYearly) / 12;
    }, 0);

    const yearlyRevenue = monthlyRevenue * 12;

    return {
      monthly: monthlyRevenue,
      yearly: yearlyRevenue,
    };
  }

  async getChurnRate() {
    const totalSubscriptions = await this.prisma.subscription.count();
    const cancelledSubscriptions = await this.prisma.subscription.count({
      where: { status: 'CANCELLED' },
    });

    return totalSubscriptions > 0
      ? (cancelledSubscriptions / totalSubscriptions) * 100
      : 0;
  }

  async getSubscriptionGrowth() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [lastMonthCount, thisMonthCount] = await Promise.all([
      this.prisma.subscription.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      this.prisma.subscription.count({
        where: {
          created_at: {
            gte: thisMonth,
          },
        },
      }),
    ]);

    return lastMonthCount > 0
      ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
      : 0;
  }

  async getInstructorCourseStats() {
    const instructorStats = await this.prisma.user.findMany({
      where: {
        role: {
          has: 'INSTRUCTOR',
        },
      },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    return instructorStats.map((instructor) => ({
      instructor_id: instructor.id,
      instructor_name:
        `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
        instructor.username,
      total_courses: instructor._count.courses,
    }));
  }

  async getCourseEnrollmentStats() {
    const courseStats = await this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        instructor: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return courseStats.map((course) => ({
      course_id: course.id,
      course_title: course.title,
      instructor_id: course.instructor.id,
      instructor_name:
        `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim() ||
        course.instructor.username,
      total_enrollments: course._count.enrollments,
    }));
  }

  async getInstructorEnrollmentStats() {
    const instructorStats = await this.prisma.user.findMany({
      where: {
        role: {
          has: 'INSTRUCTOR',
        },
      },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        courses: {
          select: {
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
    });

    return instructorStats.map((instructor) => ({
      instructor_id: instructor.id,
      instructor_name:
        `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
        instructor.username,
      total_enrollments: instructor.courses.reduce(
        (acc, course) => acc + course._count.enrollments,
        0,
      ),
    }));
  }
}
