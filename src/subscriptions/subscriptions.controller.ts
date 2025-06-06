import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { RequireSubscription } from '../auth/decorators/require-subscription.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my-subscription')
  async getMySubscription(@Request() req) {
    return this.subscriptionsService.getActiveSubscription(req.user.id);
  }

  @Post('checkout')
  async createCheckoutSession(
    @Body() createSubscriptionDto: {
      planSlug: string;
      frequency: 'MONTHLY' | 'YEARLY' | 'month' | 'year';
      email: string;
    },
    @Request() req,
  ) {
    return this.subscriptionsService.createCheckoutSession(
      createSubscriptionDto.planSlug,
      createSubscriptionDto.frequency,
      createSubscriptionDto.email,
      req.user.id,
    );
  }

  @Patch(':id')
  @RequireSubscription('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: Partial<{
      status: SubscriptionStatus;
      planId: number;
      stripeSubscriptionId: string;
      stripeCustomerId: string;
      stripePriceId: string;
      stripeSessionId: string;
    }>,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Patch(':id/status')
  @RequireSubscription('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.subscriptionsService.updateStatus(id, status);
  }

  @Delete(':id')
  @RequireSubscription('ADMIN')
  async remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
