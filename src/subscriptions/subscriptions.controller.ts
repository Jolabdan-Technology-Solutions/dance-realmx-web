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
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get('user')
  findByUser(@Req() req: RequestWithUser) {
    return this.subscriptionsService.findByUserId(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(+id);
  }

  @Post()
  create(
    @Body()
    createSubscriptionDto: {
      tier: SubscriptionTier;
      stripe_subscription_id: string;
      current_period_start: Date;
      current_period_end: Date;
      status: SubscriptionStatus;
    },
    @Req() req: RequestWithUser,
  ) {
    return this.subscriptionsService.create({
      ...createSubscriptionDto,
      user_id: req.user.id,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: Partial<Subscription>,
  ) {
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.subscriptionsService.updateStatus(+id, status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.subscriptionsService.delete(+id);
  }
}
