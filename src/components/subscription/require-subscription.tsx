import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

// Define the subscription plan hierarchy
export const SUBSCRIPTION_LEVELS = {
  FREE: 0,
  EDUCATOR: 10,
  PREMIUM: 20,
  ROYALTY: 30
};

// Map subscription plan slugs to their level
export const SUBSCRIPTION_LEVEL_MAP: Record<string, number> = {
  "free": SUBSCRIPTION_LEVELS.FREE,
  "educator": SUBSCRIPTION_LEVELS.EDUCATOR,
  "premium": SUBSCRIPTION_LEVELS.PREMIUM,
  "royalty": SUBSCRIPTION_LEVELS.ROYALTY,
  
  // Legacy plan mappings
  "basic_seller": SUBSCRIPTION_LEVELS.EDUCATOR,
  "premium_seller": SUBSCRIPTION_LEVELS.EDUCATOR,
  "basic_directory": SUBSCRIPTION_LEVELS.FREE,
  "premium_directory": SUBSCRIPTION_LEVELS.PREMIUM,
  "annual_access": SUBSCRIPTION_LEVELS.PREMIUM,
  "quarterly_access": SUBSCRIPTION_LEVELS.PREMIUM,
  "monthly_access": SUBSCRIPTION_LEVELS.PREMIUM,
};

interface RequireSubscriptionProps {
  children: ReactNode;
  requiredPlan: keyof typeof SUBSCRIPTION_LEVELS;
  fallback?: ReactNode;
  message?: string;
}

export default function RequireSubscription({
  children,
  requiredPlan,
  fallback,
  message = "This feature requires a higher subscription level."
}: RequireSubscriptionProps) {
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [, navigate] = useLocation();

  // Get the user's subscription level
  const userSubscriptionLevel = user?.subscription_plan
    ? SUBSCRIPTION_LEVEL_MAP[user.subscription_plan] || SUBSCRIPTION_LEVELS.FREE
    : SUBSCRIPTION_LEVELS.FREE;
  
  // Check if the user has sufficient access
  const hasAccess = userSubscriptionLevel >= SUBSCRIPTION_LEVELS[requiredPlan];

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
        <Button onClick={() => setUpgradeModalOpen(true)} className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
          Upgrade Subscription
        </Button>
      </div>

      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Subscription Upgrade Required</DialogTitle>
            <DialogDescription className="text-gray-300">
              This feature requires a {requiredPlan.toLowerCase()} subscription or higher.
              Would you like to upgrade your subscription now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
              Not Now
            </Button>
            <Button onClick={() => navigate("/subscription")} className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              View Subscription Options
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}