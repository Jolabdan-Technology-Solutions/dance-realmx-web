import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Feature } from '../enums/feature.enum';
import { userHasFeatureAccess } from '../utils/feature-access.util';

export const REQUIRED_FEATURE_KEY = 'requiredFeature';
export const RequireFeature = (feature: Feature) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<Feature>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('User not authenticated.');
    }

    const userRoles = Array.isArray(user.role)
      ? user.role.map((role) => role.toUpperCase())
      : [user.role.toUpperCase()];

    const subscriptionTier = user.subscription_tier?.toUpperCase();

    if (!userHasFeatureAccess(userRoles, subscriptionTier, requiredFeature)) {
      throw new ForbiddenException(
        `You do not have access to the required feature: ${requiredFeature}.`,
      );
    }

    return true;
  }
}
