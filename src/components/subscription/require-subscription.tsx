import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

// Define the subscription plan hierarchy
export const SUBSCRIPTION_LEVELS = {
  FREE: 0,
  NOBILITY: 10,
  ROYALTY: 20,
  IMPERIAL: 30,
};

// Map subscription plan slugs to their level
export const SUBSCRIPTION_LEVEL_MAP: Record<string, number> = {
  free: SUBSCRIPTION_LEVELS.FREE,
  nobility: SUBSCRIPTION_LEVELS.NOBILITY,
  royalty: SUBSCRIPTION_LEVELS.ROYALTY,
  imperial: SUBSCRIPTION_LEVELS.IMPERIAL,

  // Legacy plan mappings
  educator: SUBSCRIPTION_LEVELS.NOBILITY,
  premium: SUBSCRIPTION_LEVELS.ROYALTY,
  basic_seller: SUBSCRIPTION_LEVELS.NOBILITY,
  premium_seller: SUBSCRIPTION_LEVELS.NOBILITY,
  basic_directory: SUBSCRIPTION_LEVELS.FREE,
  premium_directory: SUBSCRIPTION_LEVELS.ROYALTY,
  annual_access: SUBSCRIPTION_LEVELS.ROYALTY,
  quarterly_access: SUBSCRIPTION_LEVELS.ROYALTY,
  monthly_access: SUBSCRIPTION_LEVELS.ROYALTY,
};

interface RequireSubscriptionProps {
  children: ReactNode;
  level: number;
  feature?: string;
  description?: string;
  fallback?: ReactNode;
  message?: string;
}

export default function RequireSubscription({
  children,
  level,
  feature,
  description,
  fallback,
  message = "This feature requires a higher subscription level.",
}: RequireSubscriptionProps) {
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [, navigate] = useLocation();

  // Get the user's subscription level using subscription_tier
  const userSubscriptionLevel = user?.subscription_tier
    ? SUBSCRIPTION_LEVEL_MAP[user.subscription_tier.toLowerCase()] || SUBSCRIPTION_LEVELS.FREE
    : SUBSCRIPTION_LEVELS.FREE;

  // Check if the user has sufficient access
  const hasAccess = userSubscriptionLevel >= level;

  // If the user has access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If there's a fallback, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Otherwise, render a button that opens the upgrade modal
  return (
    <>
      <div className="p-4 border rounded-lg bg-gray-800 text-center">
        <p className="mb-4">{message}</p>
        <Button
          onClick={() => setUpgradeModalOpen(true)}
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
        >
          Upgrade Subscription
        </Button>
      </div>

      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Subscription Upgrade Required</DialogTitle>
            <DialogDescription className="text-gray-300">
              {feature ? `${feature} requires` : 'This feature requires'} a {
                level >= SUBSCRIPTION_LEVELS.IMPERIAL ? 'Imperial' :
                level >= SUBSCRIPTION_LEVELS.ROYALTY ? 'Royalty' :
                level >= SUBSCRIPTION_LEVELS.NOBILITY ? 'Nobility' : 'Free'
              } subscription or higher. {description && `${description}.`} Would you like to upgrade your subscription now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeModalOpen(false)}
            >
              Not Now
            </Button>
            <Button
              onClick={() => navigate("/subscription/upgrade")}
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
            >
              View Subscription Options
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export both as default and named export for flexibility
export { RequireSubscription };
