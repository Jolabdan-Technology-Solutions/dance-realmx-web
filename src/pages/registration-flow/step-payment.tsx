import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, CreditCard, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RegistrationData } from "@/types/registration";

interface StepPaymentProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
}

// Make sure to call `loadStripe` outside of a component's render
// to avoid recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function StepPayment({ registrationData, updateRegistrationData }: StepPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Create payment intent when component mounts
  useEffect(() => {
    const createSubscription = async () => {
      if (!registrationData.accountData || !registrationData.recommendedPlan) {
        setErrorMessage("Missing account or plan information");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Create subscription checkout session
        const response = await apiRequest("POST", "/api/subscriptions/checkout", {
          planSlug: registrationData.recommendedPlan.slug,
          frequency: 'month',
          email: registrationData.accountData.email
        });
        
        const data = await response.json();
        
        if (!data.url) {
          throw new Error(data.message || "Could not initialize payment");
        }
        
        window.location.href = data.url;
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        setErrorMessage(error.message || "There was a problem creating the subscription");
        
        toast({
          title: "Payment Setup Failed",
          description: error.message || "There was a problem setting up the payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createSubscription();
  }, [registrationData.accountData, registrationData.recommendedPlan, toast]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-[#00d4ff] mb-4" />
        <p className="text-center text-lg">Setting up your subscription...</p>
      </div>
    );
  }
  
  if (errorMessage) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }
  
  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <p className="text-center text-lg">Unable to initialize payment. Please try again later.</p>
      </div>
    );
  }
  
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">Complete Your Payment</h2>
          <p className="text-gray-400">
            Provide your payment information to activate your account.
          </p>
        </div>
        
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#00d4ff',
                colorBackground: '#000000',
                colorText: '#ffffff',
                colorDanger: '#ef4444',
                fontFamily: 'Inter, sans-serif',
              }
            }
          }}
        >
          <PaymentForm 
            updateRegistrationData={updateRegistrationData} 
            planName={registrationData.recommendedPlan?.name || ''}
          />
        </Elements>
      </div>
      
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">Order Summary</h2>
          <p className="text-gray-400">
            Review your subscription details before completing payment.
          </p>
        </div>
        
        <Card className="bg-gray-900 mb-6">
          <CardHeader>
            <CardTitle>{registrationData.recommendedPlan?.name} Plan</CardTitle>
            <CardDescription>
              {registrationData.paymentMethod === "monthly" ? "Monthly" : "Annual"} Subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <span>Billing Cycle</span>
                <span className="font-medium">{registrationData.paymentMethod === "monthly" ? "Monthly" : "Annual"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-medium">
                  ${registrationData.paymentMethod === "monthly" 
                    ? registrationData.recommendedPlan?.priceMonthly 
                    : registrationData.recommendedPlan?.priceYearly}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <span>Tax</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>
                  ${registrationData.paymentMethod === "monthly" 
                    ? registrationData.recommendedPlan?.priceMonthly 
                    : registrationData.recommendedPlan?.priceYearly}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Lock className="h-3 w-3" />
              <span>Secure transaction</span>
            </div>
            <p className="text-sm text-gray-400">
              You can cancel or change your subscription at any time from your account settings.
            </p>
          </CardFooter>
        </Card>
        
        <Alert className="bg-gray-900 border-gray-800">
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Test Card Information</AlertTitle>
          <AlertDescription className="text-sm text-gray-400">
            Use the test card number 4242 4242 4242 4242, any future expiration date, any 3-digit CVC, and any postal code.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

function PaymentForm({ 
  updateRegistrationData, 
  planName 
}: { 
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  planName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setIsLoading(true);
    setPaymentError(null);
    
    try {
      // Confirm the payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Not used since we'll handle success in-app
        },
        redirect: 'if_required',
      });
      
      if (result.error) {
        // Payment failed
        setPaymentError(result.error.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: result.error.message || "Payment failed. Please try again.",
          variant: "destructive",
        });
      } else {
        // Payment succeeded
        setPaymentSuccess(true);
        updateRegistrationData({
          paymentCompleted: true
        });
        
        toast({
          title: "Payment Successful",
          description: `You have successfully subscribed to the ${planName} plan.`,
        });
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentError(error.message || "Payment processing failed");
      
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (paymentSuccess) {
    return (
      <div className="bg-green-900/20 border border-green-800 rounded-lg p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
        <p className="mb-4 text-gray-300">
          Your subscription has been activated. You're ready to go!
        </p>
        <p className="text-sm text-gray-400">
          A confirmation email has been sent to your email address.
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
      
      <div className="p-4 border border-gray-800 rounded-lg bg-black">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now
          </>
        )}
      </Button>
    </form>
  );
}