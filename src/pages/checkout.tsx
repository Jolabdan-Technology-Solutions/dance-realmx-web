import { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation } from 'wouter';

// Custom implementation of useSearchParams for wouter
const useSearchParams = () => {
  const [location] = useLocation();
  return [new URLSearchParams(location.split('?')[1] || '')];
};
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ returnUrl }: { returnUrl: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + (returnUrl || '/'),
        },
        redirect: 'if_required',
      });

      if (result.error) {
        toast({
          title: 'Payment Failed',
          description: result.error.message || 'Your payment was not successful, please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Payment Successful',
          description: 'Thank you for your purchase!',
        });
        
        // Redirect after successful payment
        setTimeout(() => {
          setLocation(returnUrl || '/');
        }, 1500);
      }
    } catch (err: any) {
      toast({
        title: 'Payment Error',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
};

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get('clientSecret');
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { toast } = useToast();

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Checkout Session</h1>
        <p className="mb-6">No payment information was provided. Please try again.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md mx-auto bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-center mb-6">Checkout</h1>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm returnUrl={returnUrl} />
          </Elements>
        </div>
      </div>
    </div>
  );
}