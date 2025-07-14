import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCheckout } from "@/hooks/use-checkout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { StripePaymentForm } from "@/components/stripe/stripe-payment-form";
import { formatCurrency } from "@/lib/utils";

import { loadStripeConfig } from "@/lib/stripe-config";

// Initialize Stripe
const stripePromise = loadStripe(loadStripeConfig().publishableKey);

type CartItem = {
  id: number;
  user_id: number;
  course_id: number | null;
  resource_id: number | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  user?: any;
  course?: any;
  resource?: any; // <-- Add this line
  itemDetails?: any;
};

export default function CheckoutPageComplete() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const {
    items: cartItems,
    total: cartTotal,
    itemCount,
    isLoading: cartLoading,
  } = useCart();

  const {
    status: checkoutStatus,
    error: checkoutError,
    isLoading: checkoutLoading,
    startCheckout,
    resetCheckout,
  } = useCheckout();
  const { toast } = useToast();

  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<
    "cart" | "payment" | "success"
  >("cart");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your purchase",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && itemCount === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add some items to continue.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [itemCount, cartLoading, navigate, toast]);

  // Handle checkout process
  const handleStartCheckout = async () => {
    try {
      const result = await startCheckout();
      if (result) {
        setCheckoutData(result);
        setCurrentStep("payment");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentIntent: any) => {
    setCurrentStep("success");
    toast({
      title: "Order Complete!",
      description:
        "Thank you for your purchase. You will receive a confirmation email shortly.",
    });
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  // Continue shopping
  const handleContinueShopping = () => {
    navigate("/");
  };

  // View orders
  const handleViewOrders = () => {
    navigate("/dashboard/orders");
  };

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  if (itemCount === 0) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-8">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600 mt-1">
                Complete your purchase securely
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Secure Checkout</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Order Summary</span>
                  <Badge variant="secondary">{itemCount} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {item.title || item.resource?.title}
                        </h4>
                        <p className="text-sm text-gray-300 py-1">
                          {item?.resource?.type}
                        </p>
                        {item.quantity && (
                          <p className="text-sm text-white">
                            Quantity: {item?.quantity}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(
                            parseFloat(
                              item.price || item.resource?.price || "0"
                            ) * item?.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">
                      Secure Payment
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your payment information is encrypted and secure. We use
                      Stripe to process all payments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            {currentStep === "cart" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Ready to Pay</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Review your order and click the button below to proceed to
                      secure payment.
                    </p>

                    {checkoutError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {checkoutError.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleStartCheckout}
                      disabled={checkoutLoading}
                      className="w-full"
                      size="lg"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ${formatCurrency(cartTotal)}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "payment" && checkoutData && (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  clientSecret={checkoutData.clientSecret}
                  amount={checkoutData.order.total * 100} // Convert to cents
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  disabled={checkoutLoading}
                />
              </Elements>
            )}

            {currentStep === "success" && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                    <div>
                      <h3 className="text-xl font-semibold text-green-900">
                        Payment Successful!
                      </h3>
                      <p className="text-green-700 mt-2">
                        Your order has been confirmed and you will receive a
                        confirmation email shortly.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        onClick={handleViewOrders}
                        variant="outline"
                        className="flex-1"
                      >
                        View Orders
                      </Button>
                      <Button
                        onClick={handleContinueShopping}
                        className="flex-1"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
