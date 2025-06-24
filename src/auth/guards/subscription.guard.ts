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

    // Admins and instructors don't need subscriptions
    if (user.role === Role.ADMIN || user.role === Role.INSTRUCTOR_ADMIN) {
      return true;
    }

    // Check if user has an active subscription
    const activeSubscription = await this.subscriptionsService.findActive(
      user.id,
    );
    if (!activeSubscription) {
      throw new ForbiddenException('You do not have an active subscription.');
    }
    return true;
  }
}
