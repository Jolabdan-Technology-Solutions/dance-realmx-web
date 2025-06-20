import { applyDecorators, UseGuards } from '@nestjs/common';
import { SubscriptionTierGuard } from '../guards/subscription-tier.guard';
import { RequireTier } from '../guards/subscription-tier.guard';

export function RequireSubscription(tier: string) {
  return applyDecorators(
    RequireTier(tier),
    UseGuards(SubscriptionTierGuard),
  );
} 