import { useState, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import { SubscriptionPlan } from "@/shared/schema";
import { Check, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const isLoadingAuth = authContext?.isLoading || false;
  
  const { toast } = useToast();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch subscription plans from the backend
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/plans', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    }
  });

  // Fetch user's current subscription
  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch('/api/subscriptions/user');
      if (!response.ok) throw new Error('Failed to fetch current subscription');
      return response.json();
    },
    enabled: !!user
  });

  const isLoading = isLoadingAuth || isLoadingPlans;

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!plan.slug) {
      toast({
        title: "Error",
        description: "Invalid subscription plan",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Error",
        description: "Please log in to subscribe",
        variant: "destructive",
      });
      window.location.href = '/login?redirect=/subscription';
      return;
    }

    setSelectedPlan(plan.slug);
    setIsCreatingCheckout(true);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planSlug: plan.slug,
          frequency: 'month',
          email: user.email
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }
      
      if (!data.url) {
        throw new Error("No checkout URL received");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Subscription error",
        description: error instanceof Error ? error.message : "There was a problem creating your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isLoadingThisPlan = isCreatingCheckout && selectedPlan === plan.slug;
    const isCurrentPlan = currentSubscription?.plan?.slug === plan.slug;
    
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>
            <span className="font-bold text-lg">${Number(plan.priceMonthly).toFixed(2)}</span> per month
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {plan.description && (
            <p className="text-sm text-gray-300 mb-4">{plan.description}</p>
          )}
          <ul className="space-y-2">
            {plan.features.map((feature: string, index: number) => (
              <li key={index} className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            variant={isCurrentPlan ? "outline" : "default"}
            disabled={isCurrentPlan || isLoadingThisPlan}
            onClick={() => {
              if (!user) {
                // Redirect to login if user is not authenticated
                window.location.href = '/login?redirect=/subscription';
                return;
              }
              handleSubscribe(plan);
            }}
          >
            {isLoadingThisPlan ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isCurrentPlan ? "Current Plan" : user ? "Subscribe" : "Login to Subscribe"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-900 text-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Membership Plans</h1>
        <p className="text-gray-300 text-xl max-w-3xl mx-auto">
          Choose the membership level that best fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => renderPlanCard(plan))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 bg-gray-800 rounded-lg p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-white">Membership FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg text-white">What's the difference between the plans?</h3>
              <p className="text-gray-300">
                Each plan offers different features and benefits. Choose the plan that best suits your needs and goals.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg text-white">How do I change my plan?</h3>
              <p className="text-gray-300">
                You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg text-white">What happens after I subscribe?</h3>
              <p className="text-gray-300">
                After subscribing, you'll have immediate access to all features included in your chosen plan. You can manage your subscription from your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}