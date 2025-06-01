import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, LogIn } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useQuery, useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// Schema for card details validation
const cardSchema = z.object({
  cardNumber: z.string()
    .min(16, { message: "Card number must be at least 16 digits" })
    .max(16, { message: "Card number must be at most 16 digits" })
    .regex(/^[0-9]+$/, { message: "Card number must contain only digits" }),
  cardholderName: z.string()
    .min(2, { message: "Cardholder name is required" }),
  expiryMonth: z.string()
    .min(1, { message: "Expiry month is required" })
    .max(2, { message: "Expiry month must be at most 2 digits" })
    .regex(/^(0?[1-9]|1[0-2])$/, { message: "Expiry month must be between 01-12" }),
  expiryYear: z.string()
    .min(2, { message: "Expiry year is required" })
    .max(4, { message: "Expiry year must be at most 4 digits" })
    .regex(/^[0-9]+$/, { message: "Expiry year must contain only digits" }),
  cvc: z.string()
    .min(3, { message: "CVC must be at least 3 digits" })
    .max(4, { message: "CVC must be at most 4 digits" })
    .regex(/^[0-9]+$/, { message: "CVC must contain only digits" }),
});

// Order Summary Component
function OrderSummary({ cartItems }: { cartItems: CartItem[] }) {
  const total = cartItems.reduce((sum, item) => {
    // Get price from the appropriate place depending on item structure
    const price = typeof item.price === 'string' ? item.price : 
                  (item.details?.price || '0');
    return sum + (parseFloat(price) * item.quantity);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {cartItems.map((item) => {
          // Get title and price from the appropriate place depending on item structure
          const title = item.title || item.details?.title || 'Unknown Item';
          const price = typeof item.price === 'string' ? item.price : 
                        (item.details?.price || '0');
          
          return (
            <div key={item.id} className="flex justify-between">
              <div>
                <span>{title}</span>
                {item.quantity > 1 && <span className="text-sm text-muted-foreground ml-1">x{item.quantity}</span>}
              </div>
              <span>{formatCurrency(parseFloat(price) * item.quantity)}</span>
            </div>
          );
        })}
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
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const guestCart = useGuestCart();
  const guestCartItems = guestCart.items || [];
  
  // Set up form with validation
  const form = useForm<z.infer<typeof cardSchema>>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardNumber: '4242424242424242', // Test card number
      cardholderName: 'Test User',
      expiryMonth: '12',
      expiryYear: '2025',
      cvc: '123',
    },
  });

  const isAuthenticated = !!user;
  const isUsingGuestCart = !isAuthenticated;

  // Fetch authenticated user's cart items
  const { data: authCartItems = [], isLoading: isLoadingCart } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated, // Only run query if user is authenticated
    retry: false
  });

  // Determine which cart items to use
  const cartItems = isAuthenticated ? authCartItems : guestCartItems;

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (isUsingGuestCart) {
        // For guest users, we're mocking order creation since we can't store it in DB
        const timestamp = Date.now();
        const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        return { 
          orderNumber: `GUEST-${timestamp}-${random1}-${random2}`,
          totalAmount: guestCartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
        };
      } else {
        // For authenticated users, call the direct API route that bypasses middleware problems
        try {
          console.log('Starting order creation request using direct route...');
          // Use the direct-create-order endpoint instead
          const response = await apiRequest('POST', '/api/simple-checkout/direct-create-order');
          console.log('Direct route response received:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body from direct route:', errorText);
            throw new Error(`Failed to create order: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          // Check content type to ensure we're getting JSON
          const contentType = response.headers.get('content-type');
          console.log('Direct route response content type:', contentType);
          
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Direct route response is not JSON:', contentType);
            const text = await response.text();
            console.log('Non-JSON response body from direct route:', text);
            
            // Try parsing the response manually if it might be JSON despite the content type
            try {
              return JSON.parse(text);
            } catch (parseErr) {
              console.error('Error trying to parse direct route response as JSON:', parseErr);
              throw new Error(`The server returned an invalid content type: ${contentType}. Please try again or contact support.`);
            }
          }
          
          const jsonData = await response.json();
          console.log('Successfully parsed JSON response from direct route:', jsonData);
          return jsonData;
        } catch (err) {
          console.error('Order creation error details:', err);
          
          // Add retry logic for specific failures
          if (err.message && (err.message.includes('duplicate') || err.message.includes('already exists'))) {
            console.log('Retrying order creation after duplicate error...');
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              // Try one more time using direct route
              console.log('Making retry request using direct route...');
              const retryResponse = await apiRequest('POST', '/api/simple-checkout/direct-create-order');
              console.log('Retry response received:', retryResponse.status, retryResponse.statusText);
            
              if (!retryResponse.ok) {
                const retryErrorText = await retryResponse.text();
                console.error('Retry error response body:', retryErrorText);
                throw new Error(`Failed to create order on retry: ${retryResponse.status} ${retryResponse.statusText} - ${retryErrorText}`);
              }
              
              const contentType = retryResponse.headers.get('content-type');
              console.log('Retry response content type:', contentType);
              
              if (!contentType || !contentType.includes('application/json')) {
                console.error('Retry response is not JSON:', contentType);
                const text = await retryResponse.text();
                console.log('Retry non-JSON response body:', text);
                
                // Try to parse the response manually if it might be JSON despite the content type
                try {
                  return JSON.parse(text);
                } catch (parseErr) {
                  console.error('Error trying to parse retry response as JSON:', parseErr);
                  // Instead of generating fake data, throw a more descriptive error
                  throw new Error(`The server returned an invalid content type: ${contentType}. Please try again or contact support.`);
                }
              }
              
              const jsonData = await retryResponse.json();
              console.log('Successfully parsed retry JSON response:', jsonData);
              return jsonData;
            } catch (retryErr) {
              console.error('Order creation retry failed:', retryErr);
              throw retryErr;
            }
          } else {
            // Re-throw other errors
            throw err;
          }
        }
      }
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      console.log("Order created:", data);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      
      // User-friendly error handling
      let errorMessage = "Could not create your order. Please try again.";
      
      if (error.message) {
        if (error.message.includes('500')) {
          errorMessage = "Our servers experienced an issue. Please try again in a few moments.";
        } else if (error.message.includes('401')) {
          errorMessage = "Your session may have expired. Please log in again.";
        }
      }
      
      toast({
        title: "Order Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate('/cart');
      }, 2000);
    }
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (cardDetails: z.infer<typeof cardSchema>) => {
      if (!orderNumber) {
        throw new Error("No order number available");
      }
      
      if (isUsingGuestCart) {
        // For guest user, we'll just simulate a successful payment
        // In a real app, you'd use a third-party payment processor API directly here
        return { success: true, message: 'Guest payment processed successfully' };
      } else {
        // For authenticated users, call the direct API
        console.log('Starting payment processing request using direct route...');
        const response = await apiRequest('POST', '/api/simple-checkout/direct-process-payment', {
          orderNumber,
          cardDetails,
        });
        
        // Handle 409 Conflict status (duplicate order number) specially
        if (response.status === 409) {
          const errorData = await response.json();
          console.log("Received 409 conflict with retry info:", errorData);
          
          if (errorData.retryOrderNumber) {
            // Update order number and retry with the new one
            setOrderNumber(errorData.retryOrderNumber);
            
            // Retry the payment with the new order number
            // Retry using direct endpoint
            console.log('Retrying payment processing using direct route...');
            const retryResponse = await apiRequest('POST', '/api/simple-checkout/direct-process-payment', {
              orderNumber: errorData.retryOrderNumber,
              cardDetails,
            });
            
            if (!retryResponse.ok) {
              const retryErrorText = await retryResponse.text();
              throw new Error(`Failed on retry: ${retryResponse.status} ${retryResponse.statusText} - ${retryErrorText}`);
            }
            
            return await retryResponse.json();
          } else {
            throw new Error(`Order number conflict, but no retry information provided`);
          }
        } else if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to process payment: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        return await response.json();
      }
    },
    onSuccess: (response) => {
      setPaymentStatus('succeeded');
      
      if (isUsingGuestCart) {
        // Clear the guest cart
        guestCart.clearCart();
      } else {
        // Invalidate cart query to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      }
      
      toast({
        title: "Payment Successful",
        description: "Your order has been processed successfully!",
      });
      
      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
        navigate(`/payment-success?order=${orderNumber}`);
      }, 1500);
    },
    onError: (error) => {
      console.error('Error processing payment:', error);
      setPaymentStatus('error');
      
      // Make error messages more user-friendly
      let userFriendlyMessage = "There was a problem processing your payment.";
      
      // Extract more specific error information if available
      if (error.message) {
        if (error.message.includes('409') || error.message.includes('duplicate') || error.message.includes('conflict')) {
          userFriendlyMessage = "There was a temporary issue with your order. Please try again.";
        } else if (error.message.includes('500')) {
          userFriendlyMessage = "Our servers encountered an issue. Please try again in a few moments.";
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          userFriendlyMessage = "Your session may have expired. Please login and try again.";
        } else if (error.message.includes('Order number')) {
          userFriendlyMessage = "There was an issue with your order number. Please try again.";
        }
      }
      
      setErrorMessage(userFriendlyMessage);
      toast({
        title: "Payment Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      
      // Add auto-retry for certain error types
      if (error.message && (error.message.includes('409') || error.message.includes('duplicate') || error.message.includes('conflict'))) {
        // Add slight delay before auto-retry
        setTimeout(() => {
          setPaymentStatus('idle');
          setErrorMessage(null);
          toast({
            title: "Retrying",
            description: "We're preparing your order again. Please try the payment after the page refreshes.",
          });
          
          // Reset the order number to trigger a fresh order creation
          setOrderNumber(null);
        }, 3000);
      }
    }
  });

  useEffect(() => {
    // Only proceed with automatic order creation when:
    // 1. We're sure about authentication state (not loading)
    // 2. There are items in the cart
    // 3. No order has been created yet
    // 4. We're not currently creating an order
    if (!isLoadingAuth && 
        cartItems.length > 0 && 
        !orderNumber && 
        !createOrderMutation.isPending) {
      
      // For guest users, show checkout options dialog
      if (isUsingGuestCart && !showCheckoutOptions) {
        setShowCheckoutOptions(true);
      } else if (!isUsingGuestCart) {
        // For authenticated users, create the order directly
        createOrderMutation.mutate();
      }
    } else if (cartItems.length === 0 && !isLoadingCart && !isLoadingAuth) {
      // Redirect to home if cart is empty
      navigate('/');
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add items before checkout.",
      });
    }
  }, [cartItems, orderNumber, isLoadingCart, isLoadingAuth, createOrderMutation.isPending]);

  const onSubmit = (formData: z.infer<typeof cardSchema>) => {
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
    processPaymentMutation.mutate(formData);
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setErrorMessage(null);
  };

  const handleContinueShopping = () => {
    navigate('/curriculum');
  };

  const handleContinueAsGuest = () => {
    setShowCheckoutOptions(false);
    createOrderMutation.mutate();
  };

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const handleSubscribeClick = () => {
    navigate('/pricing');
  };

  const isLoading = isLoadingAuth || isLoadingCart || createOrderMutation.isPending;

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 py-8">
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
            <CardContent className="pt-0">
              <OrderSummary cartItems={cartItems} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Enter your payment information</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="cardholderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="4242 4242 4242 4242"
                                maxLength={16}
                                {...field}
                              />
                              <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Use 4242 4242 4242 4242 for test payments
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="expiryMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Month</FormLabel>
                            <FormControl>
                              <Input placeholder="MM" maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="expiryYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Year</FormLabel>
                            <FormControl>
                              <Input placeholder="YYYY" maxLength={4} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input placeholder="123" maxLength={4} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col text-sm text-muted-foreground">
              <p>All transactions are secure and encrypted.</p>
              <p>DanceRealmX will never store your payment details.</p>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Checkout Options Dialog for Guest Users */}
      <AlertDialog open={showCheckoutOptions} onOpenChange={setShowCheckoutOptions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready to Checkout?</AlertDialogTitle>
            <AlertDialogDescription>
              You can either purchase as a guest or sign up for a subscription to unlock benefits including:
              <ul className="list-disc mt-2 ml-6 space-y-1">
                <li>Access to premium resources</li>
                <li>Exclusive dance curriculum materials</li>
                <li>Downloadable content history</li>
                <li>Discounts on future purchases</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
            <AlertDialogAction 
              onClick={handleSubscribeClick} 
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
            >
              View Subscription Plans
            </AlertDialogAction>
            <AlertDialogCancel onClick={handleContinueAsGuest}>
              Continue as Guest
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={handleLoginClick} 
              className="w-full mt-2 sm:mt-0"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in or Create Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}