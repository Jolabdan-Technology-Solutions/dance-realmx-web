import { useState, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import { SUBSCRIPTION_PLANS } from "#shared/schema";
import { SubscriptionPlan } from "#shared/schema";
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
import { apiRequest } from "@/lib/queryClient";

// Seller Plans
const BASIC_SELLER_FEATURES = [
  "account and store set up",
  "55% profit on all sales"
];

const PREMIUM_SELLER_FEATURES = [
  "Account and store set up",
  "75% profit on all sales",
  "Premium marketing on the website and social media"
];

// Directory Plans
const BASIC_DIRECTORY_FEATURES = [
  "includes yearly background check",
  "profile listing"
];

const PREMIUM_DIRECTORY_FEATURES = [
  "yearly background check",
  "profile listing",
  "premium marketing features"
];

// Access Membership Plans
const ANNUAL_ACCESS_FEATURES = [
  "Access to professional directory",
  "Direct messaging with professionals",
  "Annual membership"
];

const QUARTERLY_ACCESS_FEATURES = [
  "Access to professional directory",
  "Direct messaging with professionals",
  "Quarterly membership"
];

const MONTHLY_ACCESS_FEATURES = [
  "Access to professional directory",
  "Direct messaging with professionals",
  "Monthly membership"
];

// Royalty All-in-One Plan
const ROYALTY_FEATURES = [
  "Premium Seller Membership",
  "Premium Directory Membership",
  "Talent Directory Membership Access Annual Membership"
];

export default function SubscriptionPage() {
  // Safely access the auth context without throwing errors
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const isLoadingAuth = authContext?.isLoading || false;
  
  const { toast } = useToast();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch subscription plans from the backend
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    }
  });

  const isLoading = isLoadingAuth || isLoadingPlans;

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.slug);
    setIsCreatingCheckout(true);

    try {
      // Success URL with session_id and plan information for the success page
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.slug}`;
      const cancelUrl = `${window.location.origin}/subscription?canceled=true`;

      // For simplicity and consistency, we can now use our dedicated Stripe checkout flow
      // with the new /api/create-subscription endpoint
      const response = await apiRequest("POST", "/api/create-subscription", {
        plan_slug: plan.slug,
        success_url: successUrl,
        cancel_url: cancelUrl
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create checkout session");
      }
      
      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Subscription error",
        description: "There was a problem creating your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (title: string, price: string, period: string, features: string[], buttonText: string = "Subscribe", slug: string = "") => {
    const isLoadingThisPlan = isCreatingCheckout && selectedPlan === slug;
    const isCurrentPlan = user?.subscription_plan === slug;
    
    // Create a plan object that matches the SubscriptionPlan type
    const plan: SubscriptionPlan = {
      id: 0,
      name: title,
      slug: slug,
      description: price + " " + period,
      features: features,
      price_monthly: price.replace("$", ""),
      price_yearly: price.replace("$", ""),
      is_popular: false,
      is_active: true,
      stripe_price_id_monthly: `price_${slug}`,
      stripe_price_id_yearly: `price_${slug}`
    };
    
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            <span className="font-bold text-lg">{price}</span> {period}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <ul className="space-y-2 mb-6">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            variant={isCurrentPlan ? "outline" : "default"}
            disabled={isCurrentPlan || isLoadingThisPlan || !slug}
            onClick={() => slug && handleSubscribe(plan)}
          >
            {isLoadingThisPlan ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isCurrentPlan ? "Current Plan" : buttonText}
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

      {/* Seller Plans Section */}
      <div className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-3 text-white">Seller</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          {renderPlanCard(
            "Basic Seller", 
            "$25.00", 
            "one time fee",
            BASIC_SELLER_FEATURES,
            "Get Started",
            "basic_seller"
          )}
          {renderPlanCard(
            "Premium Seller", 
            "$50.00", 
            "per year",
            PREMIUM_SELLER_FEATURES,
            "Subscribe",
            "premium_seller"
          )}
        </div>
        <div className="text-center mt-4">
          <p className="text-lg text-gray-300">The above is just for sellers</p>
        </div>
      </div>

      {/* Directory Plans Section */}
      <div className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-3 text-white">Directory</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          {renderPlanCard(
            "Basic Directory", 
            "$24.99", 
            "per year",
            BASIC_DIRECTORY_FEATURES,
            "Subscribe",
            "basic_directory"
          )}
          {renderPlanCard(
            "Premium Directory", 
            "$7.99", 
            "per month",
            PREMIUM_DIRECTORY_FEATURES,
            "Subscribe",
            "premium_directory"
          )}
        </div>
        <div className="text-center mt-4">
          <p className="text-lg text-gray-300">The above is for the professionals who want to be in the directory for booking</p>
        </div>
      </div>

      {/* Talent Directory Membership Section */}
      <div className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-3 text-white">Talent Directory Membership Access</h2>
          <p className="text-gray-300 mt-2">
            Dance Realm Exchange requires a membership in order to directly contact professional dance educators on our Talent Search Directory.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
          {renderPlanCard(
            "Annual membership", 
            "$4.99", 
            "per month",
            ANNUAL_ACCESS_FEATURES,
            "Subscribe",
            "annual_access"
          )}
          {renderPlanCard(
            "Quarterly membership", 
            "$9.99", 
            "per month",
            QUARTERLY_ACCESS_FEATURES,
            "Subscribe",
            "quarterly_access"
          )}
          {renderPlanCard(
            "Monthly membership", 
            "$19.99", 
            "per month",
            MONTHLY_ACCESS_FEATURES,
            "Subscribe",
            "monthly_access"
          )}
        </div>
        
        <div className="text-center mt-4">
          <p className="text-lg text-gray-300">
            The above is for members who want to access the professional directory in order to message the professional
          </p>
        </div>
      </div>

      {/* Royalty Membership Section */}
      <div className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-3 text-white">Royalty Membership</h2>
        </div>
        <div className="grid grid-cols-1 max-w-md mx-auto">
          {renderPlanCard(
            "Royalty Membership", 
            "$99.99", 
            "One time annual fee",
            ROYALTY_FEATURES,
            "Subscribe",
            "royalty"
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 bg-gray-800 rounded-lg p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-white">Membership FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg text-white">What's the difference between the plans?</h3>
              <p className="text-gray-300">
                Seller plans allow you to sell curriculum resources, Directory plans list you as an instructor, Access plans let you contact professionals, and the Royalty plan combines all features.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg text-white">Is there a background check?</h3>
              <p className="text-gray-300">
                Yes, all Directory plans include a yearly background check to ensure the safety and professionalism of our listed instructors.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg text-white">How do the one-time fees work?</h3>
              <p className="text-gray-300">
                Seller plans and the Basic Directory plan require a one-time payment, not a recurring subscription. The Premium Directory and Access plans are billed on a recurring basis.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg text-white">What's included in the Royalty plan?</h3>
              <p className="text-gray-300">
                The Royalty plan includes all features from the Premium Seller, Premium Directory, and Annual Access plans at a discounted price. It's the best value if you want to both sell resources and be listed in our directory.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}