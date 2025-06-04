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
      plan_slug: string;
      success_url: string;
      cancel_url: string;
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
}
