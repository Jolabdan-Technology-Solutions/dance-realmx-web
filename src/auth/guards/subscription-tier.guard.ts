import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UserRole } from '@prisma/client';

export const REQUIRED_TIER_KEY = 'requiredTier';
export const RequireTier = (tier: string) =>
  SetMetadata(REQUIRED_TIER_KEY, tier);

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
      throw new ForbiddenException('User not authenticated.');
    }

    // Get user's active subscription
    const subscription = await this.subscriptionsService.getActiveSubscription(
      user.id,
    );
    if (!subscription) {
      throw new ForbiddenException(
        'You do not have an active subscription required to perform this action.',
      );
    }

    // Check if user's subscription plan exists
    const plan = await this.subscriptionsService.getSubscriptionPlan(
      subscription.plan_id,
    );
    if (!plan) {
      throw new ForbiddenException(
        'Your subscription plan could not be found.',
      );
    }

    // Check if the plan's unlocked roles include the required role
    if (!plan.unlockedRoles.includes(requiredTier as UserRole)) {
      throw new ForbiddenException(
        `Your subscription does not grant access to the required role: ${requiredTier}.`,
      );
    }

    return true;
  }
}
