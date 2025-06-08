import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UserRole } from '@prisma/client';

export const REQUIRED_TIER_KEY = 'requiredTier';
export const RequireTier = (tier: string) => SetMetadata(REQUIRED_TIER_KEY, tier);

@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<string>(
      REQUIRED_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      return false;
    }

    // Get user's active subscription
    const subscription = await this.subscriptionsService.getActiveSubscription(user.id);
    
    if (!subscription) {
      return false;
    }

    // Check if user's subscription tier has the required role
    const plan = await this.subscriptionsService.getSubscriptionPlan(subscription.plan_id);
    
    if (!plan) {
      return false;
    }

    // Check if the plan's unlocked roles include the required role
    return plan.unlockedRoles.includes(requiredTier as UserRole);
  }
} 