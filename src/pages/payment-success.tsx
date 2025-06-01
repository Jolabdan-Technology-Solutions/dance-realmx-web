import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Check, Download, Calendar, DollarSign, AlertCircle, FileText, Image as ImageIcon, Video, Music, File, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/format-currency";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface PurchasedResource {
  id: number;
  resourceId: number;
  title: string;
  description: string;
  price: number;
  downloadUrl: string;
  thumbnailUrl: string;
  fileType?: string;
}

export default function PaymentSuccessPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const orderNumber = searchParams.get("order");
  
  // Helper function to get the appropriate icon based on file type
  const getFileTypeIcon = (fileType: string | undefined) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-green-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'audio':
        return <Music className="h-5 w-5 text-purple-500" />;
      case 'curriculum':
        return <FileText className="h-5 w-5 text-amber-500" />;
      case 'lesson':
        return <FileText className="h-5 w-5 text-cyan-500" />;
      default:
        return <FileQuestion className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Helper function to get the display name for file type
  const getFileTypeDisplay = (fileType: string | undefined) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return 'PDF Document';
      case 'image':
        return 'Image';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Audio';
      case 'curriculum':
        return 'Curriculum';
      case 'lesson':
        return 'Lesson Plan';
      default:
        return fileType || 'Document';
    }
  };
  
  const {
    data: purchasedResources = [], // Provide default empty array
    isLoading,
    error,
  } = useQuery<PurchasedResource[]>({
    queryKey: ["/api/purchases/by-order", orderNumber],
    queryFn: async () => {
      // If no order number, return empty array
      if (!orderNumber) return [];
      
      const response = await fetch(`/api/purchases/by-order/${orderNumber}`);
      if (!response.ok) {
        console.error('Failed to fetch purchase details:', response.status, response.statusText);
        // For 404 errors (order not found), return empty array instead of throwing
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch purchase details: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!orderNumber, // Only fetch if we have an order number
    retry: 1,
  });

  useEffect(() => {
    // If no order number is provided, redirect to home
    if (!orderNumber) {
      toast({
        title: "Invalid Order",
        description: "No order information found. Redirecting to home page.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 3000);
    }
  }, [orderNumber, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12">
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold">Loading your purchase details...</h2>
          <p className="text-muted-foreground mt-2">This will just take a moment.</p>
        </div>
      </div>
    );
  }

  // For authenticated users with no recent purchases
  if (user && (!purchasedResources || purchasedResources.length === 0)) {
    return (
      <div className="container max-w-4xl py-12">
        <PageHeader 
          title="Payment Successful!" 
          description="Your purchase has been completed successfully."
        />
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 flex items-center gap-4">
          <div className="bg-primary/10 rounded-full p-3">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Payment Confirmed</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for your purchase! An email has been sent with your download links.
            </p>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order #{orderNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your payment has been processed successfully.</p>
            <p className="mt-4">You can access all your purchased resources from your "My Purchases" page. We've also sent an email with download links to your registered email address.</p>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button className="w-full" onClick={() => setLocation("/my-purchases")}>
              View My Purchases
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/curriculum")}>
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // For guest users (no authentication)
  if (!user) {
    return (
      <div className="container max-w-4xl py-12">
        <PageHeader 
          title="Payment Successful!" 
          description="Your purchase has been completed successfully."
        />
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 flex items-center gap-4">
          <div className="bg-primary/10 rounded-full p-3">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Payment Confirmed</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for your purchase! Download links have been sent to your email.
            </p>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order #{orderNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your payment has been processed successfully.</p>
            <p className="mt-4">We've sent an email with download links to the email address you provided during checkout.</p>
            <p className="mt-4">For easier access to your purchases in the future, consider creating an account:</p>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button className="w-full" onClick={() => setLocation("/auth")}>
              Create an Account
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/curriculum")}>
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // For authenticated users with recent purchases
  return (
    <div className="container max-w-4xl py-12">
      <PageHeader 
        title="Payment Successful!" 
        description="Your purchase has been completed successfully."
      />
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 flex items-center gap-4">
        <div className="bg-primary/10 rounded-full p-3">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Payment Confirmed</h3>
          <p className="text-sm text-muted-foreground">
            Thank you for your purchase! You can download your resources immediately.
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Order #{orderNumber}</h2>
        <p className="mb-4">Your items are ready to download. We've also sent the download links to your email address.</p>
      </div>
      
      <div className="space-y-6">
        {purchasedResources && purchasedResources.map((resource) => (
          <Card key={resource.id} className="overflow-hidden">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-1 aspect-video md:aspect-square">
                <img 
                  src={resource.thumbnailUrl || '/placeholder-image.png'}
                  alt={resource.title || 'Resource'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                />
              </div>
              <div className="md:col-span-3 p-4 pt-0 md:pt-4 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-lg">{resource.title}</h3>
                  <Badge 
                    variant="outline" 
                    className="ml-2 flex items-center gap-1"
                  >
                    {getFileTypeIcon(resource.fileType)}
                    <span>{getFileTypeDisplay(resource.fileType)}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{resource.description || 'No description available'}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-sm font-medium">{formatCurrency(resource.price)}</span>
                  
                  <div className="ml-auto">
                    <a 
                      href={resource.downloadUrl && !resource.downloadUrl.includes('/api/') ? resource.downloadUrl : `/api/resources/download/${resource.resourceId}`} 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex gap-4 mt-8">
        <Button variant="outline" className="w-full md:w-auto" onClick={() => setLocation("/curriculum")}>
          Continue Shopping
        </Button>
        <Button className="w-full md:w-auto" onClick={() => setLocation("/my-purchases")}>
          View All Purchases
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground mt-6">
        <p>If you experience any issues with your downloads, please contact our support team.</p>
      </div>
    </div>
  );
}