import { useAuth } from "@/hooks/use-auth";
import { SUBSCRIPTION_LEVELS, SUBSCRIPTION_LEVEL_MAP } from "@/components/subscription/require-subscription";

export function useSubscription() {
  const { user } = useAuth();

  // Get the user's subscription level using subscription_tier (not subscription_plan)
  const userSubscriptionLevel = user?.subscription_tier 
    ? SUBSCRIPTION_LEVEL_MAP[user.subscription_tier.toLowerCase()] || SUBSCRIPTION_LEVELS.FREE
    : SUBSCRIPTION_LEVELS.FREE;
  
  // Check if the user has access to a specific feature level
  const hasAccess = (requiredLevel: keyof typeof SUBSCRIPTION_LEVELS) => {
    return userSubscriptionLevel >= SUBSCRIPTION_LEVELS[requiredLevel];
  };

  // Get user's current plan name using subscription_tier
  const currentPlanName = user?.subscription_tier 
    ? Object.entries(SUBSCRIPTION_LEVEL_MAP).find(
        ([, level]) => level === userSubscriptionLevel
      )?.[0] || "free"
    : "free";

  const subscriptionStatus = user?.subscription_status;
  const subscriptionExpiresAt = user?.subscription_expires_at;

  return {
    userSubscriptionLevel,
    planName: currentPlanName,
    hasAccess,
    isNobility: hasAccess("NOBILITY"),
    isRoyalty: hasAccess("ROYALTY"),
    isImperial: hasAccess("IMPERIAL"),
    subscriptionStatus,
    subscriptionExpiresAt
  };
}