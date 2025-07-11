import { useState, useContext, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import { SubscriptionPlan } from "@/shared/schema";
import { Check, Loader2, Star, CheckCircle } from "lucide-react";
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

// Constants
const API_BASE_URL = "https://api.livetestdomain.com/api";
const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"]; // Add other valid active statuses if needed

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
        `${API_BASE_URL}/subscriptions/plans`,
        false
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's current subscription
  const {
    data: currentSubscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
  } = useQuery<CurrentSubscription>({
    queryKey: ["current-subscription"],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_BASE_URL}/subscriptions/user`,
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
      throw new Error(response?.message || "Failed to create checkout session");
    }

    return response.url;
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Validation
    if (!plan.slug) {
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
        planSlug: plan.slug, // Don't convert to uppercase - use as-is from API
        frequency: "MONTHLY",
        email: user.email,
      });

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
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

    // Check for active subscriptions (not pending)
    const isCurrentPlan = userSubscriptions.some(
      (subscription: Subscription) =>
        subscription.plan_id === plan.id &&
        ACTIVE_STATUSES.includes(subscription.status) &&
        subscription.is_active // Additional check using is_active field
    );

    const isPopular = plan.isPopular || false; // Fallback to false if undefined

    return { isCurrentPlan, isPopular };
  };

  const getButtonText = (plan: SubscriptionPlan, isCurrentPlan: boolean) => {
    const userSubscriptions = currentSubscription || [];

    const hasPendingSubscription = userSubscriptions.some(
      (sub: Subscription) => sub.plan_id === plan.id && sub.status === "PENDING"
    );

    // If user has active subscription for this plan
    if (isCurrentPlan && !hasPendingSubscription) {
      return "Current Plan";
    }

    // If user has pending subscription and this matches selected tier
    if (selectedTier === plan.name && hasPendingSubscription) {
      return "Proceed to Pay";
    }

    // Check if user has any pending subscription for this plan
    if (hasPendingSubscription) {
      return "Payment Pending";
    }

    return user ? "Subscribe" : "Login to Subscribe";
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const { isCurrentPlan, isPopular } = getPlanStatus(plan);
    const isLoadingThisPlan =
      checkoutState.isLoading && checkoutState.selectedPlan === plan.slug;
    const buttonText = getButtonText(plan, isCurrentPlan);

    return (
      <Card
        key={plan.id}
        className={`flex flex-col relative ${
          isPopular ? "border-blue-500 shadow-lg" : ""
        }`}
      >
        {isPopular && (
          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        )}

        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>
            <span className="font-bold text-lg">
              ${Number(plan.priceMonthly).toFixed(2)}
            </span>{" "}
            per month
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-grow">
          {plan.description && (
            <p className="text-sm text-gray-300 mb-4">{plan.description}</p>
          )}

          <ul className="space-y-2">
            {plan.features.map((feature: string, index: number) => (
              <li key={index} className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
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
          <p className="text-gray-300">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (plansError || subscriptionError) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Failed to load{" "}
            {plansError ? "subscription plans" : "subscription data"}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <p className="text-gray-300">No subscription plans available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-900 text-white min-h-screen">
      {/* Membership Plans Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 max-w-[80%]">
          <h2 className="text-4xl font-bold mb-4 text-center text-white">
            Plans & Pricing
          </h2>
          <p className="text-xl text-gray-300 mb-10 text-center max-w-3xl mx-auto">
            Browse Dance Professionals, Certifications, and Purchase Curriculum
            with a free membership
          </p>
          <h3 className="text-2xl font-bold mb-8 text-center text-white">
            Which Plan is Right for Me?
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="bg-gray-900 text-white text-lg font-bold py-4 px-2 rounded-tl-xl"></th>
                  <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6">
                    Free
                  </th>
                  <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6">
                    Nobility
                    <br />
                    <span className="text-[#00d4ff] text-base font-semibold">
                      $9.99/mo
                    </span>
                  </th>
                  <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6">
                    Royalty
                    <br />
                    <span className="text-[#00d4ff] text-base font-semibold">
                      $19.99/mo
                    </span>
                  </th>
                  <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6 rounded-tr-xl">
                    Imperial
                    <br />
                    <span className="text-[#00d4ff] text-base font-semibold">
                      $29.99/mo
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-200 text-base">
                {/* Feature: Purchase Curriculum */}
                <tr className="bg-gray-900">
                  <td className="py-4 px-2 font-semibold">
                    Purchase Curriculum
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                </tr>
                {/* Feature: Search Dance Professionals */}
                <tr className="bg-gray-800">
                  <td className="py-4 px-2 font-semibold">
                    Search Dance Professionals
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                </tr>
                {/* Feature: Take a Certification Course */}
                <tr className="bg-gray-900">
                  <td className="py-4 px-2 font-semibold">
                    Take a Certification Course
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                </tr>
                {/* Feature: Be Booked as a Dance Professional */}
                <tr className="bg-gray-800">
                  <td className="py-4 px-2 font-semibold">
                    Be Booked as a Dance Professional
                  </td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                </tr>
                {/* Feature: Sell Curriculum */}
                <tr className="bg-gray-900">
                  <td className="py-4 px-2 font-semibold">Sell Curriculum</td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                </tr>
                {/* Feature: Contact and Book Dance Professionals */}
                <tr className="bg-gray-800">
                  <td className="py-4 px-2 font-semibold">
                    Contact and Book Dance Professionals
                  </td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                </tr>
                {/* Feature: Be Featured as a Premium Seller */}
                <tr className="bg-gray-900">
                  <td className="py-4 px-2 font-semibold">
                    Be Featured as a Premium Seller
                  </td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-center">
                    <CheckCircle className="inline h-6 w-6 text-[#00d4ff]" />
                  </td>
                </tr>
              </tbody>
            </table>
            {/* a button that says COMPARE PLANS - this button will take them to the plans and pricing page */}
          </div>
        </div>
      </section>
      {/* Header */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-300 text-xl max-w-3xl mx-auto">
          Select the membership level that best fits your needs and unlock
          premium features.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
        {plans.map(renderPlanCard)}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-white text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-white mb-2">
                What's the difference between the plans?
              </h3>
              <p className="text-gray-300">
                Each plan offers different features and benefits. Higher-tier
                plans include more advanced features, increased limits, and
                priority support.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-white mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-gray-300">
                Yes, you can upgrade or downgrade your plan at any time from
                your account settings. Changes will be reflected in your next
                billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-white mb-2">
                What happens after I subscribe?
              </h3>
              <p className="text-gray-300">
                After subscribing, you'll have immediate access to all features
                included in your chosen plan. You can manage your subscription
                and billing from your account dashboard.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-300">
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
