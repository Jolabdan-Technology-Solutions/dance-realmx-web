import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { USER_ROLES } from "@/constants/roles";
import { StripeConnectModal } from "./stripe-connect-modal";
import { StripeConnectGuideModal } from "./stripe-connect-guide-modal";

export function StripeConnectOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  
  // Check if user has seller or curriculum officer role
  const canUseStripeConnect = () => {
    return user && [USER_ROLES.SELLER, USER_ROLES.CURRICULUM_OFFICER].includes(user.role as any);
  };
  
  // Get Stripe Connect account status
  const { 
    data: connectAccount,
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['/api/stripe-connect/account-status'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/stripe-connect/account-status');
        
        if (res.status === 404) {
          // No Stripe Connect account yet, not an error
          return { hasAccount: false, accountComplete: false };
        }
        
        const data = await res.json();
        return { 
          hasAccount: true,
          accountId: data.accountId,
          accountComplete: data.isComplete,
          detailsSubmitted: data.detailsSubmitted,
          chargesEnabled: data.chargesEnabled,
          payoutsEnabled: data.payoutsEnabled
        };
      } catch (error) {
        console.error("Error fetching Stripe Connect status:", error);
        return { hasAccount: false, accountComplete: false };
      }
    },
    enabled: canUseStripeConnect(),
  });

  // Create a Connect account and get an onboarding link
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest('POST', '/api/stripe-connect/create-account');
        
        if (!res.ok) {
          // Parse error response for detailed information
          const errorData = await res.json();
          
          if (errorData.moreInfo) {
            throw new Error(`${errorData.message || "Stripe Connect Error"}. ${errorData.details || ""} Learn more: ${errorData.moreInfo}`);
          } else if (errorData.details) {
            throw new Error(`${errorData.message || "Stripe Connect Error"}. ${errorData.details}`);
          } else if (res.status === 400 && errorData.message?.includes("not enabled")) {
            // Handle specific Stripe Connect not enabled error
            throw new Error("Stripe Connect is not enabled on this account. The Stripe account needs to be configured for Connect in the Stripe Dashboard.");
          }
          
          throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Stripe Connect error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.url) {
        setOnboardingUrl(data.url);
        // Open the onboarding URL in a new tab
        window.open(data.url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to get onboarding link. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Stripe Connect Error",
        description: error.message || "Failed to create Stripe Connect account. This usually means Stripe Connect needs to be enabled in your Stripe Dashboard.", 
        variant: "destructive",
      });
    },
  });

  // Create a new onboarding link for an existing account
  const refreshOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/stripe-connect/refresh-onboarding');
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        setOnboardingUrl(data.url);
        // Open the onboarding URL in a new tab
        window.open(data.url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to get onboarding link. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to refresh onboarding link: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Check if onboarding was completed when user returns from Stripe
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Always check status on component mount
      if (connectAccount?.hasAccount) {
        await refetchStatus();
        
        // If we have an account but it's not complete, set up polling
        if (!connectAccount.accountComplete) {
          console.log('Account exists but is not complete, setting up polling to check status');
        }
      }
    };

    // Run this check when the component mounts
    checkOnboardingStatus();
    
    // Get query parameters to detect Stripe return
    const urlParams = new URLSearchParams(window.location.search);
    const stripeReturn = urlParams.get('stripe_return');
    
    // If returning from Stripe, force an immediate status check
    if (stripeReturn) {
      console.log('Detected return from Stripe Connect onboarding, refreshing status');
      refetchStatus();
    }
    
    // Set up interval to check status every 5 seconds (in case user completes onboarding in another tab)
    const intervalId = setInterval(() => {
      if (connectAccount?.hasAccount && !connectAccount?.accountComplete) {
        console.log('Polling for Stripe Connect account status updates');
        refetchStatus();
      }
    }, 5000);
    
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [connectAccount, refetchStatus]);

  // Open the guide modal
  const handleOpenGuideModal = () => {
    setIsGuideModalOpen(true);
  };
  
  // Handle continuing from guide modal to setup
  const handleContinueFromGuide = () => {
    setIsGuideModalOpen(false);
    setIsModalOpen(true);
  };

  // Handle starting the onboarding process via modal
  const handleOnboardingWithModal = () => {
    setIsModalOpen(true);
  };

  // Handle starting the traditional onboarding process
  const handleOnboardingWithRedirect = () => {
    if (connectAccount?.hasAccount) {
      refreshOnboardingMutation.mutate();
    } else {
      createAccountMutation.mutate();
    }
  };

  // Handle completed modal onboarding
  const handleOnboardingSuccess = () => {
    refetchStatus();
  };

  if (!canUseStripeConnect()) {
    return null; // Don't show anything for non-sellers/curriculum officers
  }

  const isAccountComplete = connectAccount?.accountComplete;
  const isLoading = isLoadingStatus || createAccountMutation.isPending || refreshOnboardingMutation.isPending;

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span>Stripe Connect Account</span>
              {isAccountComplete && (
                <Badge className="ml-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleOpenGuideModal}
              className="flex items-center"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              <span>Learn More</span>
            </Button>
          </div>
          <CardDescription>
            Set up your Stripe Connect account to receive payments for your curriculum resources
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-background dark:bg-background text-foreground dark:text-foreground">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isAccountComplete ? (
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-300 mr-3" />
                <div>
                  <p className="font-medium text-white">Your Stripe Connect account is set up and ready to receive payments!</p>
                  <p className="text-sm text-green-100 mt-1">Account ID: {connectAccount.accountId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium flex items-center">
                    <span className={connectAccount.detailsSubmitted ? "text-green-300" : "text-amber-300"}>
                      {connectAccount.detailsSubmitted ? (
                        <><CheckCircle className="h-4 w-4 mr-1 inline" /> Details Submitted</>
                      ) : (
                        <><AlertCircle className="h-4 w-4 mr-1 inline" /> Pending Details</>
                      )}
                    </span>
                  </h3>
                </div>
                
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium flex items-center">
                    <span className={connectAccount.payoutsEnabled ? "text-green-300" : "text-amber-300"}>
                      {connectAccount.payoutsEnabled ? (
                        <><CheckCircle className="h-4 w-4 mr-1 inline" /> Payouts Enabled</>
                      ) : (
                        <><AlertCircle className="h-4 w-4 mr-1 inline" /> Payouts Pending</>
                      )}
                    </span>
                  </h3>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {connectAccount?.hasAccount ? (
                <div className="bg-amber-900 p-4 rounded-lg flex items-start">
                  <AlertCircle className="h-6 w-6 text-amber-300 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Your Stripe Connect account setup is incomplete</p>
                    <p className="text-sm text-amber-100 mt-1">
                      Please complete the onboarding process to start receiving payments for your curriculum resources.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-900 p-4 rounded-lg flex items-start">
                  <AlertCircle className="h-6 w-6 text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Create a Stripe Connect account to receive payments</p>
                    <p className="text-sm text-blue-100 mt-1">
                      To sell curriculum resources, you need to set up a Stripe Connect account for secure payments.
                    </p>
                    <Button 
                      onClick={handleOpenGuideModal}
                      variant="outline" 
                      className="mt-3 border-blue-300 text-blue-100 hover:bg-blue-800 hover:text-white"
                      size="sm"
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Need help setting up?
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {!isAccountComplete && (
            <>
              <Button
                onClick={handleOnboardingWithModal}
                disabled={isLoading}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : connectAccount?.hasAccount ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Setup (In-App)
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Set Up Stripe Connect (In-App)
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleOnboardingWithRedirect}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </>
                )}
              </Button>
            </>
          )}
          
          {isAccountComplete && !connectAccount.payoutsEnabled && (
            <Button
              onClick={handleOnboardingWithRedirect}
              variant="outline"
              className="ml-2"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Update Account Details
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Stripe Connect Modal */}
      {user && (
        <StripeConnectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={user.id}
          email={user.email || ''}
          onSuccess={handleOnboardingSuccess}
        />
      )}

      {/* Stripe Connect Guide Modal */}
      <StripeConnectGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onContinue={handleContinueFromGuide}
      />
    </>
  );
}