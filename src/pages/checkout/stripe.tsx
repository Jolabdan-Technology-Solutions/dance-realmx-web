import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Custom implementation of useSearchParams for wouter
const useSearchParams = () => {
  const [location] = useLocation();
  return [new URLSearchParams(location.split('?')[1] || '')];
};

export default function StripeCheckoutPage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  const courseId = searchParams.get('courseId');
  const resourceId = searchParams.get('resourceId');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStripeConfigError, setIsStripeConfigError] = useState(false);

  useEffect(() => {
    async function createCheckoutSession() {
      try {
        if (!plan && !courseId && !resourceId) {
          setError('Missing plan or item information');
          setIsCreatingCheckout(false);
          return;
        }

        // Success URL with session_id and plan information for the success page
        const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`;
        const cancelUrl = `${window.location.origin}/subscription?canceled=true`;

        let response;

        if (plan) {
          // Handle subscription plan checkout
          response = await apiRequest("POST", "/api/create-subscription", {
            planSlug: plan,
            successUrl,
            cancelUrl
          });
        } else if (courseId) {
          // Handle course checkout
          response = await apiRequest("POST", "/api/create-course-checkout", {
            courseId,
            successUrl: `${window.location.origin}/courses/success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}`,
            cancelUrl: `${window.location.origin}/courses`
          });
        } else if (resourceId) {
          // Handle resource checkout
          response = await apiRequest("POST", "/api/create-resource-checkout", {
            resourceId,
            successUrl: `${window.location.origin}/curriculum/success?session_id={CHECKOUT_SESSION_ID}&resourceId=${resourceId}`,
            cancelUrl: `${window.location.origin}/curriculum`
          });
        }

        if (!response?.ok) {
          const errorData = await response?.json();
          
          // Check specifically for Stripe configuration errors
          if (errorData?.stripeConfigMissing || 
              (errorData?.error && errorData.error.includes("Payment processing is not available"))) {
            setIsStripeConfigError(true);
            throw new Error("Payment processing is not available. The Stripe integration needs to be configured.");
          }
          
          throw new Error(errorData?.message || errorData?.error || "Failed to create checkout session");
        }
        
        const { url } = await response.json();

        // Redirect to Stripe Checkout
        window.location.href = url;
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        setError(error.message || "There was a problem setting up your checkout. Please try again.");
        toast({
          title: "Checkout Error",
          description: error.message || "There was a problem setting up your checkout. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingCheckout(false);
      }
    }

    createCheckoutSession();
  }, [plan, courseId, resourceId, toast]);

  const handleContact = () => {
    // You can either redirect to a contact page or open email client
    window.location.href = "mailto:support@dancerealmx.com?subject=Payment%20Processing%20Issue";
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gray-900">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            {isStripeConfigError ? (
              <>
                <AlertTriangle className="h-6 w-6 text-amber-500 inline-block mr-2" />
                Payment Processing Unavailable
              </>
            ) : (
              "Preparing Checkout"
            )}
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            {isCreatingCheckout 
              ? "Setting up your secure checkout session..."
              : isStripeConfigError
                ? "Payment processing is currently unavailable"
                : error
                  ? "Error creating checkout session"
                  : "Redirecting to checkout..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreatingCheckout ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-[#00d4ff]" />
            </div>
          ) : isStripeConfigError ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-amber-400 mb-4">
                The payment system is currently unavailable. Please try again later or contact support.
              </p>
              <div className="bg-gray-900 p-4 rounded-md text-sm text-gray-400 text-left">
                <p className="font-medium mb-1">Details:</p>
                <p>The Stripe payment integration needs to be configured. This typically requires updating API keys or account settings.</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-[#00d4ff]" />
              <p className="ml-3">Redirecting to Stripe...</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
          >
            Go Back
          </Button>
          
          {isStripeConfigError && (
            <Button 
              onClick={handleContact}
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
            >
              Contact Support
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}