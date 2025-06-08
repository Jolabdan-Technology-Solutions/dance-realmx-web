import { useState, useContext, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import { SubscriptionPlan } from "@/shared/schema";
import { Check, Loader2, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient, apiRequest } from "@/lib/queryClient";

interface CheckoutRequest {
  planSlug: string;
  frequency: "MONTHLY" | "YEARLY";
  email: string;
}

interface Subscription {
  id: number;
  plan_id: number;
  status: string;
  frequency: string;
  is_active: boolean;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_session_id: string;
  stripe_subscription_id: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

type CurrentSubscription = Subscription[];

// Helper function to get URL parameters
const getURLParam = (name: string): string | null => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  return null;
};

export default function SubscriptionPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const isLoadingAuth = authContext?.isLoading || false;
  const selectedTier = getURLParam("tier") || user?.subscription_tier;
  const { toast } = useToast();

  const [checkoutState, setCheckoutState] = useState<{
    isLoading: boolean;
    selectedPlan: string | null;
  }>({
    isLoading: false,
    selectedPlan: null,
  });

  // Fetch subscription plans
  const {
    data: plans = [],
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await apiClient.get(
        "https://api.livetestdomain.com/api/subscriptions/plans",
        false
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's current subscription
  const { data: currentSubscription, isLoading: isLoadingSubscription } =
    useQuery<CurrentSubscription>({
      queryKey: ["current-subscription"],
      queryFn: async () => {
        const response = await apiClient.get(
          "https://api.livetestdomain.com/api/subscriptions/user",
          true
        );
        return response;
      },
      enabled: !!user,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });

  const redirectToAuth = useCallback(() => {
    window.location.href = "/auth?redirect=/subscription";
  }, []);

  const showError = useCallback(
    (message: string) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const createCheckoutSession = async (request: CheckoutRequest) => {
    try {
      const response = await apiRequest("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: request,
        requireAuth: true,
      });

      console.log("Checkout response:", response);

      if (!response?.url) {
        throw new Error(
          response?.message || "Failed to create checkout session"
        );
      }

      return response.url;
    } catch (error) {
      console.error("Checkout session error:", error);
      throw error;
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Validation
    if (!plan?.slug) {
      showError("Invalid subscription plan");
      return;
    }

    if (!user?.email) {
      showError("Please log in to subscribe");
      redirectToAuth();
      return;
    }

    setCheckoutState({
      isLoading: true,
      selectedPlan: plan.slug,
    });

    try {
      const checkoutUrl = await createCheckoutSession({
        planSlug: plan.slug.toUpperCase(),
        frequency: "MONTHLY",
        email: user.email,
      });

      // Redirect to checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to create subscription. Please try again."
      );
    } finally {
      setCheckoutState({
        isLoading: false,
        selectedPlan: null,
      });
    }
  };

  const getPlanStatus = (plan: SubscriptionPlan) => {
    const userSubscriptions = currentSubscription || [];
    const isCurrentPlan = userSubscriptions.some(
      (subscription: Subscription) =>
        subscription.plan_id === plan.id &&
        subscription.is_active &&
        subscription.status === "ACTIVE"
    );

    const isPopular = plan.name?.toLowerCase().includes("pro");

    return { isCurrentPlan, isPopular };
  };

  const getButtonText = (plan: SubscriptionPlan, isCurrentPlan: boolean) => {
    if (!user) return "Login to Subscribe";

    if (isCurrentPlan) return "Current Plan";

    const userSubscriptions = currentSubscription || [];
    const hasPendingSubscription = userSubscriptions.some(
      (sub: Subscription) => sub.plan_id === plan.id && sub.status === "PENDING"
    );

    if (plan.name?.toUpperCase() && hasPendingSubscription) {
      return "Proceed to Pay";
    }

    if (selectedTier === plan.name?.toUpperCase() && !hasPendingSubscription) {
      return "Activate";
    }

    return "Subscribe";
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const { isCurrentPlan, isPopular } = getPlanStatus(plan);
    const isLoadingThisPlan =
      checkoutState.isLoading && checkoutState.selectedPlan === plan.slug;
    const buttonText = getButtonText(plan, isCurrentPlan);

    return (
      <Card
        key={plan.id}
        className={`flex flex-col relative transition-all duration-200 hover:shadow-lg ${
          isPopular ? "border-blue-500 shadow-lg ring-1 ring-blue-500/20" : ""
        }`}
      >
        {isPopular && (
          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        )}

        {buttonText === "Activate" && (
          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600">
            <Check className="h-3 w-3 mr-1" />
            Activate
          </Badge>
        )}

        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription className="text-lg">
            <span className="font-bold text-2xl text-foreground">
              ${Number(plan.priceMonthly || 0).toFixed(2)}
            </span>
            <span className="text-muted-foreground"> / month</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-grow">
          {plan.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {plan.description}
            </p>
          )}

          {plan.features && plan.features.length > 0 && (
            <ul className="space-y-2">
              {plan.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            variant={
              isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"
            }
            disabled={isCurrentPlan || isLoadingThisPlan}
            onClick={() => {
              if (!user) {
                redirectToAuth();
                return;
              }
              handleSubscribe(plan);
            }}
          >
            {isLoadingThisPlan && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            {buttonText}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const isLoading = isLoadingAuth || isLoadingPlans || isLoadingSubscription;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Failed to load subscription plans
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <p className="text-muted-foreground">No subscription plans available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
          Select the membership level that best fits your needs and unlock
          premium features.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {plans.map(renderPlanCard)}
      </div>

      {/* FAQ Section */}
      <div className="bg-card rounded-lg p-8 border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                What's the difference between the plans?
              </h3>
              <p className="text-muted-foreground">
                Each plan offers different features and benefits. Higher-tier
                plans include more advanced features, increased limits, and
                priority support.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time from
                your account settings. Changes will be reflected in your next
                billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                What happens after I subscribe?
              </h3>
              <p className="text-muted-foreground">
                After subscribing, you'll have immediate access to all features
                included in your chosen plan. You can manage your subscription
                and billing from your account dashboard.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Is there a free trial?
              </h3>
              <p className="text-muted-foreground">
                We offer a 14-day free trial for new users. You can cancel
                anytime during the trial period without being charged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
