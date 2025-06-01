import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StripeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  email: string;
  onSuccess?: () => void;
}

export function StripeConnectModal({ 
  isOpen, 
  onClose, 
  userId, 
  email,
  onSuccess 
}: StripeConnectModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountLink, setAccountLink] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState(600);
  const { toast } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setAccountLink(null);
    }
  }, [isOpen]);

  const createStripeAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('POST', '/api/stripe-connect/create-account');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw errorData; // Throw the error data object instead of creating an Error
      }
      
      const data = await res.json();
      setAccountLink(data.url);
      setStep(2);
      
      // Poll for account status changes
      startStatusPolling();
    } catch (err: any) {
      console.error('Stripe Connect error:', err);
      
      let errorTitle = "Stripe Connect Error";
      let errorMessage = "Failed to create Stripe Connect account.";
      
      // Parse error data if available
      try {
        // First check if it's our API's error response structure
        if (typeof err === 'object') {
          if (err.message) {
            errorMessage = err.message;
            
            // Format a more comprehensive error message with additional details
            let fullErrorMessage = errorMessage;
            
            if (err.details) {
              fullErrorMessage += `\n\n${err.details}`;
            }
            
            if (err.moreInfo) {
              fullErrorMessage += `\n\nMore information: ${err.moreInfo}`;
            }
            
            setError(fullErrorMessage);
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
            return; // Exit early since we've handled the structured error
          }
        }
        
        // Fallback for other error types
        if (err.message) {
          errorMessage = err.message;
        }
        
        // Special case for "Connect not enabled" errors that might not come in our format
        if (typeof err.message === 'string' && err.message.includes("Connect")) {
          errorMessage = "Stripe Connect is not enabled on this account. The platform owner needs to enable it in the Stripe Dashboard.";
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      setError(errorMessage);
      toast({
        title: errorTitle,
        description: "There was a problem setting up your Stripe Connect account. See details below.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = () => {
    // Start polling for account status changes
    const intervalId = setInterval(async () => {
      try {
        const res = await apiRequest('GET', '/api/stripe-connect/account-status');
        if (res.ok) {
          const data = await res.json();
          if (data.isComplete) {
            // Account setup is complete
            clearInterval(intervalId);
            handleSetupComplete();
          }
        }
      } catch (err) {
        console.error('Error polling account status:', err);
      }
    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  };

  const handleSetupComplete = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/stripe-connect/account-status'] });
    queryClient.invalidateQueries({ queryKey: ['/api/seller/payments'] });
    
    toast({
      title: "Stripe Connect Setup Complete",
      description: "Your Stripe Connect account has been successfully set up!",
    });
    
    // Close modal and notify parent
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] h-[700px] flex flex-col dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>Stripe Connect Account Setup</DialogTitle>
          <DialogDescription>
            Set up your Stripe Connect account to receive payments for your curriculum resources
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="flex-1 flex flex-col p-4 space-y-6">
            <div className="bg-blue-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Welcome to Stripe Connect</h3>
              <p className="text-blue-100 mb-4">
                Stripe Connect allows you to receive payments directly to your bank account for your curriculum resources.
              </p>
              <p className="text-blue-100 mb-4">
                To get started, we'll create a Stripe Connect account for you. This will allow you to:
              </p>
              <ul className="list-disc pl-6 text-blue-100 mb-4 space-y-2">
                <li>Receive payments directly to your bank account</li>
                <li>Track your earnings and payouts</li>
                <li>Manage your payment settings</li>
              </ul>
              <p className="text-blue-100">
                You'll be guided through the process of setting up your account. This will include providing business information and connecting a bank account.
              </p>
            </div>

            {error && (
              <div className="bg-red-900 p-4 rounded-lg text-white">
                <p className="font-semibold mb-2">Error:</p>
                <div className="space-y-2">
                  {error.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                  
                  {error.includes("Stripe Connect is not enabled") && (
                    <div className="mt-4 pt-3 border-t border-red-700">
                      <p className="font-medium mb-1">How to fix this:</p>
                      <ol className="list-decimal pl-5 text-sm space-y-1">
                        <li>The platform administrator needs to enable Stripe Connect in the Stripe Dashboard.</li>
                        <li>Visit the "Learn More" section in the guide above for detailed instructions.</li>
                        <li>Once enabled, try again to set up your Stripe Connect account.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-auto">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={createStripeAccount}
                disabled={loading}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Continue to Stripe Connect"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && accountLink && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <iframe 
                src={accountLink}
                className="w-full h-full border-0"
                style={{ height: `${iframeHeight}px` }}
                onLoad={() => setIframeHeight(600)}
              />
            </div>
            <DialogFooter className="mt-4">
              <p className="text-sm text-gray-500">
                Complete the form above to set up your Stripe Connect account. This window will automatically update when your account is ready.
              </p>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}