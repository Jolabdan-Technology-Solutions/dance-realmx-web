import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Loader2, Check, X, ArrowUp } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  tier: string;
  isPopular?: boolean;
  unlockedRoles?: string[];
}

interface UpgradeEligibility {
  eligible: boolean;
  type: "new" | "upgrade";
  currentPlan: SubscriptionPlan | null;
  targetPlan: SubscriptionPlan;
  prorationAmount: number;
  currentSubscription?: any;
  reason?: string;
}

interface SubscriptionUpgradeProps {
  targetPlanSlug?: string;
  onUpgradeComplete?: () => void;
  showCurrentPlan?: boolean;
}

export default function SubscriptionUpgrade({
  targetPlanSlug,
  onUpgradeComplete,
  showCurrentPlan = true,
}: SubscriptionUpgradeProps) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [eligibility, setEligibility] = useState<UpgradeEligibility | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [frequency, setFrequency] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (targetPlanSlug) {
      const plan = plans.find((p) => p.slug === targetPlanSlug);
      if (plan) {
        setSelectedPlan(plan);
        checkEligibility(plan.slug);
      }
    }
  }, [targetPlanSlug, plans]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subscriptions/plans");
      setPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setPlans([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (planSlug: string) => {
    if (!user?.id) return;

    try {
      const response = await api.get(
        `/subscriptions/upgrade/eligibility/${planSlug}`
      );
      setEligibility(response.data);
    } catch (error) {
      console.error("Error checking eligibility:", error);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    checkEligibility(plan.slug);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || !user?.id) return;

    try {
      setUpgradeLoading(true);
      const response = await api.post("/subscriptions/upgrade/session", {
        targetPlanSlug: selectedPlan.slug,
        frequency,
      });

      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error creating upgrade session:", error);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!user?.subscription_plan) return null;
    return plans.find((p) => p.slug === user.subscription_plan);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "FREE":
        return "bg-gray-500";
      case "NOBILITY":
        return "bg-blue-500";
      case "IMPERIAL":
        return "bg-purple-500";
      case "ROYAL":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <span className="ml-2 text-white">Loading subscription plans...</span>
      </div>
    );
  }

  // If no plans available, show friendly message
  if (!Array.isArray(plans) || plans.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            No Plans Available
          </h3>
          <p className="text-gray-300 mb-4">
            We're having trouble loading the subscription plans right now.
          </p>
          <Button 
            onClick={fetchPlans}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const availablePlans = plans.filter((plan) => {
    if (!currentPlan) return true;
    const currentTier = currentPlan.tier;
    const planTier = plan.tier;
    const tierOrder = ["FREE", "NOBILITY", "ROYALTY", "IMPERIAL"];
    return tierOrder.indexOf(planTier) > tierOrder.indexOf(currentTier);
  });

  return (
    <div className="space-y-6">
      {/* Current Plan Display */}
      {showCurrentPlan && currentPlan && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {currentPlan.name}
                </h3>
                <p className="text-gray-300">{currentPlan.description}</p>
                <Badge className={`mt-2 ${getTierColor(currentPlan.tier)}`}>
                  {currentPlan.tier}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Current</p>
                <p className="text-lg font-semibold text-white">
                  {formatPrice(currentPlan.priceMonthly)}/month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Available Upgrades</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availablePlans.map((plan) => (
            <Card
              key={plan.id}
              className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-blue-500 ${
                selectedPlan?.id === plan.id
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : ""
              }`}
              onClick={() => handlePlanSelect(plan)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  {plan.isPopular && (
                    <Badge className="bg-yellow-500 text-black">Popular</Badge>
                  )}
                </div>
                <CardDescription className="text-gray-300">
                  {plan.description}
                </CardDescription>
                <Badge className={`w-fit ${getTierColor(plan.tier)}`}>
                  {plan.tier}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Monthly</span>
                      <span className="text-white font-semibold">
                        {formatPrice(plan.priceMonthly)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Yearly</span>
                      <span className="text-white font-semibold">
                        {formatPrice(plan.priceYearly)}
                        <span className="text-sm text-green-400 ml-1">
                          (Save 20%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">
                      Features:
                    </h4>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center text-sm text-gray-300"
                        >
                          <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-sm text-gray-400">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Unlocked Roles */}
                  {plan.unlockedRoles && plan.unlockedRoles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white">
                        Unlocked Roles:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {plan.unlockedRoles.map((role, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {role.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eligibility Status */}
                  {eligibility && eligibility.targetPlan.id === plan.id && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-700">
                      {eligibility.eligible ? (
                        <div className="flex items-center text-green-400">
                          <Check className="h-4 w-4 mr-2" />
                          <span className="text-sm">Eligible for upgrade</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-400">
                          <X className="h-4 w-4 mr-2" />
                          <span className="text-sm">{eligibility.reason}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upgrade Button */}
      {selectedPlan && eligibility?.eligible && (
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Upgrade to {selectedPlan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Frequency Selection */}
                <div className="flex space-x-4">
                  <Button
                    variant={frequency === "MONTHLY" ? "default" : "outline"}
                    onClick={() => setFrequency("MONTHLY")}
                    className={frequency === "MONTHLY" ? "bg-blue-500" : ""}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={frequency === "YEARLY" ? "default" : "outline"}
                    onClick={() => setFrequency("YEARLY")}
                    className={frequency === "YEARLY" ? "bg-blue-500" : ""}
                  >
                    Yearly (Save 20%)
                  </Button>
                </div>

                {/* Price Display */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {formatPrice(
                      frequency === "MONTHLY"
                        ? selectedPlan.priceMonthly
                        : selectedPlan.priceYearly
                    )}
                    <span className="text-lg text-gray-300">
                      /{frequency === "MONTHLY" ? "month" : "year"}
                    </span>
                  </p>
                  {eligibility.prorationAmount > 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                      Proration credit:{" "}
                      {formatPrice(eligibility.prorationAmount / 100)}
                    </p>
                  )}
                </div>

                {/* Upgrade Button */}
                <Button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={upgradeLoading}
                >
                  {upgradeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowUp className="h-4 w-4 mr-2" />
                  )}
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Confirmation Modal */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Upgrade</DialogTitle>
            <DialogDescription className="text-gray-300">
              You're about to upgrade to the {selectedPlan?.name} plan for{" "}
              {formatPrice(
                frequency === "MONTHLY"
                  ? selectedPlan?.priceMonthly || 0
                  : selectedPlan?.priceYearly || 0
              )}
              /{frequency === "MONTHLY" ? "month" : "year"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={upgradeLoading}>
              {upgradeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
