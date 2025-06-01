import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceOrder } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

interface OrderDetails {
  id: number;
  resourceId: number;
  resourceType: string;
  amount: number;
  status: string;
  createdAt: string;
  seller: { id: number, username: string, first_name: string | null, last_name: string | null }
}

export default function CurriculumPurchaseSuccess() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Extract the Stripe session ID from the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const session_id = searchParams.get('session_id');
    if (session_id) {
      setSessionId(session_id);
    }
  }, [location]);

  // Fetch the order details using the session ID
  const { 
    data: orderDetails, 
    isLoading, 
    error,
    isError
  } = useQuery<ResourceOrder & { 
    resource: any, 
    seller: { id: number, username: string, first_name: string | null, last_name: string | null } 
  }>({
    queryKey: ['/api/resource-orders/session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID provided');
      const res = await fetch(`/api/resource-orders/session/${sessionId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch order details');
      }
      return res.json();
    },
    enabled: !!sessionId && !!user,
    retry: 3,
    refetchOnWindowFocus: false
  });

  // If we're still loading or don't have a session ID yet, show a loading indicator
  if (isLoading || !sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-bold">Processing your purchase...</h2>
        <p className="text-muted-foreground">Please wait while we confirm your payment</p>
      </div>
    );
  }

  // If there was an error fetching the order details
  if (isError || !orderDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Purchase Verification Error</CardTitle>
              <CardDescription className="text-center">
                We couldn't verify your purchase at this time.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                {error instanceof Error ? error.message : 'An unknown error occurred.'}
              </p>
              <Button asChild variant="outline" className="mr-2">
                <Link to="/curriculum">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Curriculum
                </Link>
              </Button>
              <Button asChild>
                <Link to="/my-resources">View My Resources</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // The success view with purchase details
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b">
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <CardTitle className="text-2xl text-center">Purchase Successful!</CardTitle>
              <CardDescription className="text-center mt-2">
                Your curriculum resource is ready to download.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{orderDetails.resource.title}</h3>
                <div className="text-sm text-gray-600">
                  By {orderDetails.seller.first_name} {orderDetails.seller.last_name}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span className="font-medium">${parseFloat(orderDetails.price).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order Date:</span>
                <span className="font-medium">
                  {new Date(orderDetails.orderedAt).toLocaleDateString()}
                </span>
              </div>
              
              {orderDetails.resource.fileUrl && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Your curriculum is ready to download</p>
                  <Button asChild className="w-full">
                    <a 
                      href={`/api/curriculum/${orderDetails.resourceId}/download`} 
                      download
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Now
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/my-resources">View My Resources</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/curriculum">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}