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
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { Prisma, Subscription, SubscriptionTier } from '@prisma/client';
import { SubscriptionStatus } from './enums/subscription-status.enum';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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
    return this.subscriptionsService.findByUserId(req.user.id);
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
    return this.subscriptionsService.createCheckoutSession(createSubscriptionDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: Partial<Subscription>,
  ) {
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.subscriptionsService.updateStatus(+id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.subscriptionsService.delete(+id);
  }

  @Post('checkout')
  async createSubscriptionCheckout(@Body() dto: { planSlug: string; frequency: 'MONTHLY' | 'YEARLY'; email: string }) {
    try {
      console.log('Creating subscription checkout with data:', { ...dto, email: dto.email ? '***' : null });

      // Validate required fields
      if (!dto.planSlug || !dto.frequency || !dto.email) {
        throw new HttpException(
          'Missing required fields: planSlug, frequency, and email are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Find the plan first
      const plan = await this.subscriptionsService.findPlanBySlug(dto.planSlug);
      if (!plan) {
        throw new HttpException('Subscription plan not found', HttpStatus.NOT_FOUND);
      }
      console.log('Found plan:', { id: plan.id, name: plan.name });

      // Find the user
      const user = await this.subscriptionsService.findUserByEmail(dto.email);
      console.log('User lookup result:', user ? { id: user.id, email: user.email } : 'User not found');
      
      if (!user) {
        throw new HttpException('User not found. Please make sure you are logged in.', HttpStatus.NOT_FOUND);
      }

      // Get the appropriate price ID
      const priceId = dto.frequency === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;
      if (!priceId) {
        throw new HttpException(
          `Stripe price ID for ${dto.frequency.toLowerCase()} plan is not set`,
          HttpStatus.BAD_REQUEST
        );
      }
      console.log('Using price ID:', priceId);

     // Instead of using a stored price ID
const priceAmount = dto.frequency === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;

const session = await this.subscriptionsService.createStripeSubscriptionSession(
  user,
  plan,
  Number(priceAmount),
  dto.frequency
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
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
