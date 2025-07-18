import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Put,
  Logger,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Prisma, Subscription, SubscriptionTier } from '@prisma/client';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { RequireFeature } from '../auth/decorators/feature.decorator';
import { Feature } from '../auth/enums/feature.enum';

interface RequestWithUser extends Request {
  user: {
    id?: number;
    sub: number | string;
    email: string;
    role: string;
  };
}

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('plans')
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  findByUser(@Req() req: RequestWithUser) {
    console.log('findByUser', req.user);

    // Handle both id and sub fields for compatibility
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }

    // Convert to number if it's a string
    const numericUserId =
      typeof userId === 'string' ? parseInt(userId, 10) : userId;

    if (isNaN(numericUserId)) {
      throw new UnauthorizedException('Invalid user ID in token');
    }

    return this.subscriptionsService.findByUserId(numericUserId);
  }

  @Get('course-stats')
  @UseGuards(FeatureGuard)
  @RequireFeature(Feature.MANAGE_SUBSCRIPTIONS)
  @ApiOperation({ summary: 'Get course and enrollment statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns course and enrollment statistics',
  })
  async getCourseStats() {
    try {
      const [instructorCourses, courseEnrollments, instructorEnrollments] =
        await Promise.all([
          this.subscriptionsService.getInstructorCourseStats(),
          this.subscriptionsService.getCourseEnrollmentStats(),
          this.subscriptionsService.getInstructorEnrollmentStats(),
        ]);

      return {
        instructor_courses: instructorCourses,
        course_enrollments: courseEnrollments,
        instructor_enrollments: instructorEnrollments,
      };
    } catch (error) {
      this.logger.error(`Course stats error: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to fetch course statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics')
  @UseGuards(FeatureGuard)
  @RequireFeature(Feature.MANAGE_SUBSCRIPTIONS)
  @ApiOperation({ summary: 'Get subscription analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns subscription statistics and metrics',
  })
  async getSubscriptionAnalytics() {
    try {
      // Get total subscriptions
      const totalSubscriptions =
        await this.subscriptionsService.getTotalSubscriptions();

      // Get active subscriptions
      const activeSubscriptions =
        await this.subscriptionsService.getActiveSubscriptions();

      // Get expired subscriptions
      const expiredSubscriptions =
        await this.subscriptionsService.getExpiredSubscriptions();

      // Get subscriptions by plan
      const subscriptionsByPlan =
        await this.subscriptionsService.getSubscriptionsByPlan();

      // Get subscriptions by frequency (monthly/yearly)
      const subscriptionsByFrequency =
        await this.subscriptionsService.getSubscriptionsByFrequency();

      // Get revenue metrics
      const revenueMetrics =
        await this.subscriptionsService.getSubscriptionRevenueMetrics();

      // Get churn rate
      const churnRate = await this.subscriptionsService.getChurnRate();

      // Get subscription growth
      const subscriptionGrowth =
        await this.subscriptionsService.getSubscriptionGrowth();

      return {
        overview: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          expired: expiredSubscriptions,
        },
        distribution: {
          byPlan: subscriptionsByPlan,
          byFrequency: subscriptionsByFrequency,
        },
        metrics: {
          revenue: revenueMetrics,
          churnRate,
          growth: subscriptionGrowth,
        },
      };
    } catch (error) {
      this.logger.error(
        `Subscription analytics error: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to fetch subscription analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(+id);
  }

  @Post()
  create(
    @Body()
    createSubscriptionDto: {
      planSlug: string;
      frequency: 'MONTHLY' | 'YEARLY';
      email: string;
    },
  ) {
    return this.subscriptionsService.createCheckoutSession(
      createSubscriptionDto,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: Partial<Subscription>,
  ) {
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.subscriptionsService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.subscriptionsService.delete(+id);
  }

  @Post('checkout')
  async createSubscriptionCheckout(
    @Body()
    dto: {
      planSlug: string;
      frequency: 'MONTHLY' | 'YEARLY';
      email: string;
    },
  ) {
    try {
      console.log('Creating subscription checkout with data:', {
        ...dto,
        email: dto.email ? '***' : null,
      });

      // Validate required fields
      if (!dto.planSlug || !dto.frequency || !dto.email) {
        throw new HttpException(
          'Missing required fields: planSlug, frequency, and email are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find the plan first
      const plan = await this.subscriptionsService.findPlanBySlug(
        dto.planSlug.toLowerCase(),
      );
      if (!plan) {
        throw new HttpException(
          'Subscription plan not found',
          HttpStatus.NOT_FOUND,
        );
      }
      console.log('Found plan:', { id: plan.id, name: plan.name });

      // Find the user
      const user = await this.subscriptionsService.findUserByEmail(dto.email);
      console.log('User:', dto.email);
      console.log(
        'User lookup result:',
        user ? { id: user.id, email: user.email } : 'User not found',
      );

      if (!user) {
        throw new HttpException(
          'User not found. Please make sure you are logged in.',
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if user has a subscription tier, if not set it to 'free'
      if (!user.subscription_tier) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { subscription_tier: 'FREE' },
        });
        console.log('Set initial subscription tier to free for user:', user.id);
      }

      // Get the appropriate price ID
      const priceId =
        dto.frequency === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;
      if (!priceId) {
        throw new HttpException(
          `Stripe price ID for ${dto.frequency.toLowerCase()} plan is not set`,
          HttpStatus.BAD_REQUEST,
        );
      }
      console.log('Using price ID:', priceId);

      // Instead of using a stored price ID
      const priceAmount =
        dto.frequency === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;

      const session =
        await this.subscriptionsService.createStripeSubscriptionSession(
          user,
          plan,
          Number(priceAmount),
          dto.frequency,
        );

      console.log('Created Stripe session:', { id: session.id });

      // Create pending subscription
      await this.subscriptionsService.createPendingSubscription({
        userId: user.id,
        planId: plan.id,
        stripeSessionId: session.id,
        status: 'PENDING',
        frequency: dto.frequency,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(), // Will be updated by webhook
      });
      console.log('Created pending subscription');

      return { url: session.url };
    } catch (error) {
      console.error('Subscription checkout error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create subscription checkout session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
