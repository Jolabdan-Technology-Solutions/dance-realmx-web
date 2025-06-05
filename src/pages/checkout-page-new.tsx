import { useStripe, useElements, Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';

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

// Stripe configuration
declare global {
  interface ImportMeta {
    env: {
      VITE_STRIPE_PUBLIC_KEY: string;
    };
  }
}

// Debug: Log all environment variables
console.log('Environment variables:', import.meta.env);

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Stripe public key is missing. Available env vars:', Object.keys(import.meta.env));
  throw new Error("Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY");
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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

// Main Checkout Page Component
export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch cart items
  const {
    data,
    isLoading: isLoadingCart,
    error: cartError
  } = useQuery<CartItem[], Error>({
    queryKey: ['/api/cart'],
    retry: false,
  });
  const cartItems: CartItem[] = data ?? [];

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
    onError: (error: Error) => {
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
    if (cartError) {
      console.error('Error fetching cart:', cartError);
      navigate('/'); // Redirect if not logged in
    }
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
  }, [cartItems, clientSecret, isLoadingCart, cartError]);

  const isLoading = isLoadingCart || createPaymentIntentMutation.isPending || !clientSecret;
  
  console.log("Checkout page state:", { 
    isLoading, 
    clientSecret: clientSecret ? "Set" : "Not set", 
    orderNumber,
    cartItemsCount: cartItems.length || 0
  });

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm orderNumber={orderNumber} clientSecret={clientSecret} />
                </Elements>
              )}
            </CardContent>
            <CardFooter className="flex flex-col text-sm text-muted-foreground">
              <p>All transactions are secure and encrypted.</p>
              <p>DanceRealmX will never store your payment details.</p>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Simple payment form component
function CheckoutForm({ orderNumber, clientSecret }: { orderNumber: string | null; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Confirm order mutation
  const confirmOrderMutation = useMutation({
    mutationFn: async ({ orderNumber, paymentIntentId }: { orderNumber: string, paymentIntentId: string }) => {
      const response = await apiRequest('POST', `/api/orders/${orderNumber}/confirm`, { paymentIntentId });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to confirm order: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      setPaymentStatus('succeeded');
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Payment successful",
        description: "Your order has been confirmed.",
      });
    },
    onError: (error: Error) => {
      setPaymentStatus('error');
      setErrorMessage(error.message);
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !orderNumber) return;

    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (submitError) {
        throw submitError;
      }

      // Get the payment intent ID from the elements
      const paymentElement = elements.getElement(PaymentElement);
      if (!paymentElement) {
        throw new Error('Payment element not found');
      }

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Confirm the order with the payment intent ID
      await confirmOrderMutation.mutateAsync({
        orderNumber,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setErrorMessage(null);
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentStatus === 'succeeded' ? (
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold">Payment Successful!</h3>
          <p className="text-muted-foreground">Thank you for your purchase.</p>
          <Button onClick={handleContinueShopping}>Continue Shopping</Button>
        </div>
      ) : paymentStatus === 'error' ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry}>Try Again</Button>
        </div>
      ) : (
        <>
          <PaymentElement
            onChange={(e) => setIsReady(e.complete)}
            className="space-y-4"
          />
          <Button
            type="submit"
            disabled={!isReady || paymentStatus === 'processing'}
            className="w-full"
          >
            {paymentStatus === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
        </>
      )}
    </form>
  );
}