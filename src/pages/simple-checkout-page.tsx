import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useQuery, useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
export default function SimpleCheckoutPage() {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242424242424242',
    expMonth: '12',
    expYear: '2025',
    cvc: '123',
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch cart items
  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    retry: false,
    onError: () => {
      navigate('/'); // Redirect if not logged in
    }
  });

  // Payment process mutation
  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/process-payment', {
        orderNumber,
        cardDetails,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process payment: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setPaymentStatus('succeeded');
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Payment Successful",
        description: "Your order has been processed successfully!",
      });
    },
    onError: (error) => {
      console.error('Error processing payment:', error);
      setPaymentStatus('error');
      setErrorMessage("There was a problem processing your payment.");
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/create-order');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create order: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Could not create your order. Please try again.",
        variant: "destructive",
      });
      navigate('/cart');
    }
  });

  useEffect(() => {
    if (cartItems.length > 0 && !orderNumber) {
      createOrderMutation.mutate();
    } else if (cartItems.length === 0 && !isLoadingCart) {
      navigate('/');
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add items before checkout.",
      });
    }
  }, [cartItems, orderNumber, isLoadingCart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber) {
      toast({
        title: "Error",
        description: "Order not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage(null);
    processPaymentMutation.mutate();
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setErrorMessage(null);
  };

  const handleContinueShopping = () => {
    navigate('/curriculum');
  };

  const isLoading = isLoadingCart || createOrderMutation.isPending;

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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input 
                      id="cardNumber"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleInputChange}
                      placeholder="4242 4242 4242 4242" 
                      maxLength={16}
                    />
                    <div className="text-xs text-muted-foreground">
                      Use 4242 4242 4242 4242 for test payments
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expMonth">Expiry Month</Label>
                      <Input 
                        id="expMonth"
                        name="expMonth"
                        value={cardDetails.expMonth}
                        onChange={handleInputChange}
                        placeholder="MM" 
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expYear">Expiry Year</Label>
                      <Input 
                        id="expYear"
                        name="expYear"
                        value={cardDetails.expYear}
                        onChange={handleInputChange}
                        placeholder="YYYY" 
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input 
                        id="cvc"
                        name="cvc"
                        value={cardDetails.cvc}
                        onChange={handleInputChange}
                        placeholder="123" 
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>

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
                      className="gap-2"
                    >
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