import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Lock } from "lucide-react";
import { SubscriptionPlanOption } from "@/types/registration";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();

  // Fetch available plans
  const { data: plans, isLoading } = useQuery<SubscriptionPlanOption[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscriptions/plans");
      return response.json();
    },
  });

  const handleUpgrade = async (plan: SubscriptionPlanOption) => {
    try {
      // Create subscription checkout session
      const response = await apiRequest("POST", "/api/subscriptions/checkout", {
        planSlug: plan.slug,
        frequency: billingCycle.toUpperCase(),
      });
      
      const data = await response.json();
      
      if (!data.url) {
        throw new Error(data.message || "Could not initialize payment");
      }
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "There was a problem processing your upgrade. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-black text-white border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-gray-400">
            {featureName 
              ? `To access ${featureName}, you'll need to upgrade your plan.`
              : "Choose a plan that best fits your needs."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <div className="flex justify-center mb-6">
            <RadioGroup
              value={billingCycle}
              onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly">Yearly (Save 20%)</Label>
              </div>
            </RadioGroup>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans?.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-6 ${
                    plan.isPopular
                      ? "border-[#00d4ff] bg-[#00d4ff]/5"
                      : "border-gray-800"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#00d4ff] text-black px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold mb-2">
                      ${billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                      <span className="text-sm text-gray-400 font-normal">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-[#00d4ff] mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(plan)}
                    className={`w-full ${
                      plan.isPopular
                        ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    Upgrade to {plan.name}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 