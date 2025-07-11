import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

export const SUBSCRIPTION_REQUIRED_KEY = 'subscriptionRequired';
export const SubscriptionRequired = () =>
  SetMetadata(SUBSCRIPTION_REQUIRED_KEY, true);

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const subscriptionRequired = this.reflector.getAllAndOverride<boolean>(
      SUBSCRIPTION_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!subscriptionRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('User not authenticated.');
    }

    // Always allow ADMIN users
    if (
      (Array.isArray(user.role) &&
        user.role.map((r) => r.toUpperCase()).includes('ADMIN')) ||
      (!Array.isArray(user.role) && user.role.toUpperCase() === 'ADMIN')
    ) {
      return true;
    }

    console.log('user ', user);

    // Allow if user.is_active is true and subscription_tier is not 'FREE'
    if (
      user.is_active &&
      user.subscription_tier &&
      user.subscription_tier !== 'FREE'
    ) {
      return true;
    }

    // Check if user has an active subscription in the subscription table
    const activeSubscription = await this.subscriptionsService.findActive(
      user.id,
    );
    if (!activeSubscription) {
      throw new ForbiddenException('You do not have an active subscription.');
    }
    return true;
  }
}
