import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useStripe, useElements, Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Types
type CartItem = {
  id: number;
  title: string;
  price: string;
  itemType: 'course' | 'resource';
  itemId: number;
  quantity: number;
  details?: any;
};

type PaymentStatus = 'idle' | 'processing' | 'succeeded' | 'error';

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY");
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// The Payment form component
function CheckoutForm({ orderNumber }: { orderNumber: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  // Log current state for debugging
  console.log("CheckoutForm state:", { 
    stripeLoaded: !!stripe, 
    elementsLoaded: !!elements, 
    orderNumber, 
    paymentStatus,
    paymentElementReady
  });

  // Confirm payment mutation
  const confirmOrderMutation = useMutation({
    mutationFn: async ({ orderNumber, paymentIntentId }: { orderNumber: string, paymentIntentId: string }) => {
      console.log("Confirming order:", { orderNumber, paymentIntentId });
      const response = await apiRequest('POST', `/api/orders/${orderNumber}/confirm`, { paymentIntentId });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to confirm order: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      console.log("Order confirmation successful");
      setPaymentStatus('succeeded');
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Payment Successful",
        description: "Your order has been processed successfully!",
      });
    },
    onError: (error) => {
      console.error('Error confirming order:', error);
      setPaymentStatus('error');
      setErrorMessage("There was a problem confirming your order.");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Payment form submitted");

    if (!stripe || !elements) {
      console.error("Stripe or Elements not loaded");
      toast({
        title: "Payment Error",
        description: "Payment system is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    if (!orderNumber) {
      console.error("Missing order number");
      setErrorMessage("There was a problem with your order. Please try again.");
      setPaymentStatus('error');
      toast({
        title: "Order Error",
        description: "There was a problem with your order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentElementReady) {
      console.error("Payment element not ready");
      toast({
        title: "Payment Error",
        description: "Payment form is still loading. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      console.log("Confirming payment with Stripe");
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout-success',
        },
        redirect: 'if_required'
      });

      console.log("Payment confirmation result:", result);

      if (result.error) {
        console.error("Payment error:", result.error);
        setErrorMessage(result.error.message || "An error occurred during payment processing.");
        setPaymentStatus('error');
        toast({
          title: "Payment Failed",
          description: result.error.message || "An error occurred during payment processing.",
          variant: "destructive",
        });
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        console.log("Payment intent succeeded:", result.paymentIntent);
        // Payment was successful, confirm the order in our system
        confirmOrderMutation.mutate({
          orderNumber,
          paymentIntentId: result.paymentIntent.id
        });
      } else {
        console.log("Unexpected payment intent status:", result.paymentIntent?.status);
        setErrorMessage("Payment was not completed. Please try again.");
        setPaymentStatus('error');
      }
    } catch (err) {
      console.error("Error during payment confirmation:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setPaymentStatus('error');
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setErrorMessage(null);
  };

  const handleContinueShopping = () => {
    navigate('/courses');
  };

  // Add a change handler to detect when the payment element is ready
  const handlePaymentElementChange = (event: { complete: boolean }) => {
    console.log("Payment element change event:", event);
    setPaymentElementReady(event.complete);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement onReady={() => setPaymentElementReady(true)} onChange={handlePaymentElementChange} />

      {paymentStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>
            {errorMessage || "An error occurred during payment processing."}
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'succeeded' && (
        <Alert className="bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Payment Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Your order has been processed successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 pt-2">
        {paymentStatus === 'idle' && (
          <Button 
            type="submit" 
            disabled={!stripe || !elements || !paymentElementReady}
            className="relative"
          >
            {!paymentElementReady && <Loader2 className="h-4 w-4 animate-spin absolute left-4" />}
            Pay Now
          </Button>
        )}

        {paymentStatus === 'processing' && (
          <Button disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </Button>
        )}

        {paymentStatus === 'error' && (
          <Button onClick={handleRetry}>
            Try Again
          </Button>
        )}

        {paymentStatus === 'succeeded' && (
          <Button onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        )}
      </div>
    </form>
  );
}

// Order Summary Component
function OrderSummary({ cartItems }: { cartItems: CartItem[] }) {
  const total = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * item.quantity);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between">
            <div>
              <span>{item.title}</span>
              {item.quantity > 1 && <span className="text-sm text-muted-foreground ml-1">x{item.quantity}</span>}
            </div>
            <span>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

// Main Checkout Page Component with Stripe Elements
export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch cart items
  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    // Skip if not authenticated, handled by the queryClient's config
    retry: false,
    onError: () => {
      navigate('/'); // Redirect if not logged in
    }
  });

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Making payment intent request");
        const response = await apiRequest('POST', '/api/create-payment-intent');
        if (!response.ok) {
          throw new Error(`API responded with ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Payment intent response:", data);
        return data;
      } catch (error) {
        console.error("Error in payment intent request:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Setting client secret and order number:", data);
      setClientSecret(data.clientSecret);
      setOrderNumber(data.orderNumber);
    },
    onError: (error) => {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Error",
        description: "Could not process your payment request. Please try again.",
        variant: "destructive",
      });
      navigate('/cart');
    }
  });

  useEffect(() => {
    // Create a payment intent when the cart items are loaded
    if (cartItems && cartItems.length > 0 && !clientSecret) {
      console.log("Creating payment intent for cart items:", cartItems);
      createPaymentIntentMutation.mutate();
    } else if (cartItems && cartItems.length === 0 && !isLoadingCart) {
      // Redirect to cart if it's empty
      navigate('/');
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add items before checkout.",
      });
    }
  }, [cartItems, clientSecret, isLoadingCart]);

  const isLoading = isLoadingCart || createPaymentIntentMutation.isPending || !clientSecret;
  
  console.log("Checkout page state:", { 
    isLoading, 
    clientSecret: clientSecret ? "Set" : "Not set", 
    orderNumber,
    cartItemsCount: cartItems?.length || 0
  });

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {clientSecret && (
            <StripeCheckoutWrapper
              clientSecret={clientSecret}
              orderNumber={orderNumber}
              cartItems={cartItems}
            />
          )}
        </>
      )}
    </div>
  );
}

// Wrapper component to handle Stripe Elements initialization
function StripeCheckoutWrapper({
  clientSecret,
  orderNumber,
  cartItems
}: {
  clientSecret: string;
  orderNumber: string | null;
  cartItems: CartItem[];
}) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your items before payment</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSummary cartItems={cartItems} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Enter your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckoutForm orderNumber={orderNumber} />
          </CardContent>
          <CardFooter className="flex flex-col text-sm text-muted-foreground">
            <p>All transactions are secure and encrypted.</p>
            <p>DanceRealmX will never store your payment details.</p>
          </CardFooter>
        </Card>
      </div>
    </Elements>
  );
}