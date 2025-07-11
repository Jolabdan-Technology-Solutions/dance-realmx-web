import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

export function StripePaymentForm({
  clientSecret,
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the "PaymentIntentClientSecret" from the query string
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent?.status) {
          case "succeeded":
            setSucceeded(true);
            onPaymentSuccess(paymentIntent);
            break;
          case "processing":
            setError("Your payment is processing.");
            break;
          case "requires_payment_method":
            setError("Your payment was not successful, please try again.");
            break;
          default:
            setError("Something went wrong.");
            break;
        }
      });
    }
  }, [stripe, onPaymentSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setIsProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Customer Name", // You can make this dynamic
          },
        },
      });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      onPaymentError(stripeError.message || "Payment failed");
      toast({
        title: "Payment Failed",
        description: stripeError.message || "Payment failed",
        variant: "destructive",
      });
    } else if (paymentIntent?.status === "succeeded") {
      setSucceeded(true);
      onPaymentSuccess(paymentIntent);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully",
      });
    }

    setIsProcessing(false);
  };

  if (succeeded) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <span className="font-semibold">Payment successful!</span>
          </div>
          <p className="text-center text-muted-foreground mt-2">
            Your order has been confirmed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Information</label>
            <div className="border rounded-md p-3">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center text-sm">
            <span>Total Amount:</span>
            <span className="font-semibold">${(amount / 100).toFixed(2)}</span>
          </div>

          <Button
            type="submit"
            disabled={!stripe || isProcessing || disabled}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${(amount / 100).toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
