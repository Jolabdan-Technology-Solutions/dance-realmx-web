import { Feature } from '../enums/feature.enum';
import { FeatureRoleMap } from '../feature-role.map';
import { PlanFeatureMap } from '../plan-feature.map';
import { UserRole, SubscriptionTier } from '@prisma/client';

export function userHasFeature(
  userRoles: UserRole[],
  feature: Feature,
): boolean {
  // Admin has ultimate access to all features
  if (
    userRoles.some(
      (role) => role.toUpperCase() === UserRole.ADMIN.toUpperCase(),
    )
  ) {
    return true;
  }

  const allowedRoles = FeatureRoleMap[feature];
  return userRoles.some((role) =>
    allowedRoles.some(
      (allowedRole) => allowedRole.toUpperCase() === role.toUpperCase(),
    ),
  );
}

export function userHasFeatureByPlan(
  subscriptionTier: SubscriptionTier,
  feature: Feature,
): boolean {
  // Handle case-insensitive subscription tier
  const normalizedTier = subscriptionTier?.toUpperCase() as SubscriptionTier;
  const planFeatures = PlanFeatureMap[normalizedTier];
  return planFeatures ? planFeatures.includes(feature) : false;
}

export function getUserFeatures(userRoles: UserRole[]): Feature[] {
  return Object.values(Feature).filter((feature) =>
    userHasFeature(userRoles, feature),
  );
}

export function getUserFeaturesByPlan(
  subscriptionTier: SubscriptionTier,
): Feature[] {
  const normalizedTier = subscriptionTier?.toUpperCase() as SubscriptionTier;
  return PlanFeatureMap[normalizedTier] || [];
}

export function getFeatureAccess(
  userRoles: UserRole[],
): Record<Feature, boolean> {
  const access: Record<Feature, boolean> = {} as Record<Feature, boolean>;

  Object.values(Feature).forEach((feature) => {
    access[feature] = userHasFeature(userRoles, feature);
  });

  return access;
}

export function getFeatureAccessByPlan(
  subscriptionTier: SubscriptionTier,
): Record<Feature, boolean> {
  const access: Record<Feature, boolean> = {} as Record<Feature, boolean>;

  Object.values(Feature).forEach((feature) => {
    access[feature] = userHasFeatureByPlan(subscriptionTier, feature);
  });

  return access;
}

// Combined check: user has feature access via roles OR subscription plan
export function userHasFeatureAccess(
  userRoles: UserRole[],
  subscriptionTier: SubscriptionTier,
  feature: Feature,
): boolean {
  return (
    userHasFeature(userRoles, feature) ||
    userHasFeatureByPlan(subscriptionTier, feature)
  );
}
