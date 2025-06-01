import { useAuth } from "@/hooks/use-auth";
import { SUBSCRIPTION_LEVELS, SUBSCRIPTION_LEVEL_MAP } from "@/components/subscription/require-subscription";

export function useSubscription() {
  const { user } = useAuth();

  // Get the user's subscription level
  const userSubscriptionLevel = user?.subscription_plan 
    ? SUBSCRIPTION_LEVEL_MAP[user.subscription_plan] || SUBSCRIPTION_LEVELS.FREE
    : SUBSCRIPTION_LEVELS.FREE;
  
  // Check if the user has access to a specific feature level
  const hasAccess = (requiredLevel: keyof typeof SUBSCRIPTION_LEVELS) => {
    return userSubscriptionLevel >= SUBSCRIPTION_LEVELS[requiredLevel];
  };

  // Get user's current plan name
  const currentPlanName = user?.subscription_plan 
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
    isEducator: hasAccess("EDUCATOR"),
    isPremium: hasAccess("PREMIUM"),
    isRoyalty: hasAccess("ROYALTY"),
    subscriptionStatus,
    subscriptionExpiresAt
  };
}