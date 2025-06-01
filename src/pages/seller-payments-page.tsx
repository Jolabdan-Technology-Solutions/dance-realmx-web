import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { StripeConnectOnboarding } from "@/components/stripe/stripe-connect-onboarding";
import { StripeConnectModal } from "@/components/stripe/stripe-connect-modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CircleDollarSign, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

export default function SellerPaymentsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  // Check if the user is a seller or curriculum officer
  const canAccessPage = user && (user.role === "seller" || user.role === "curriculum_officer");

  // Get payments data
  const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['/api/seller/payments'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/seller/payments');
        return await res.json();
      } catch (error) {
        console.error("Error fetching payments data:", error);
        return { 
          pendingPayouts: 0,
          totalEarnings: 0,
          recentTransactions: []
        };
      }
    },
    enabled: canAccessPage,
  });

  // Handle Stripe Connect return after onboarding
  useEffect(() => {
    // Check if the user is returning from Stripe Connect onboarding
    const urlParams = new URLSearchParams(window.location.search);
    const stripeReturn = urlParams.get('stripe_return');
    const stateParam = urlParams.get('state');

    if (stripeReturn) {
      // Create a mutation to refresh the account status
      const refreshAccountStatus = async () => {
        try {
          // Call the account status API to update the local state
          await queryClient.invalidateQueries({ queryKey: ['/api/stripe-connect/account-status'] });
          await queryClient.invalidateQueries({ queryKey: ['/api/seller/payments'] });
          
          if (stripeReturn === 'success') {
            toast({
              title: "Stripe Connect Updated",
              description: "Your account information has been updated successfully. You can now receive payments for your curriculum resources.",
            });
          } else if (stripeReturn === 'refresh') {
            toast({
              title: "Stripe Connect Session Expired",
              description: "Your onboarding session expired. Please try again to complete the setup process.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error refreshing account status:', error);
          toast({
            title: "Update Error",
            description: "There was an error refreshing your account status. Please try again.",
            variant: "destructive",
          });
        }
      };

      // Run the refresh
      refreshAccountStatus();
      
      // Clear the URL parameters
      navigate("/seller/payments", { replace: true });
    }
  }, [navigate, toast, queryClient]);

  if (!canAccessPage) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="mb-8">You need to be a seller or curriculum officer to access this page.</p>
        <Button onClick={() => navigate("/")}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Payments</h1>
        <p className="text-gray-500">Manage your payment settings and view your earnings</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Stripe Connect Account</h2>
          
          {/* Get stripe connect status from the StripeConnectOnboarding component */}
          <StripeConnectOnboarding />
          
          {/* Add button for in-app Stripe Connect onboarding */}
          <div className="mt-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">In-App Onboarding Option</h3>
            <p className="text-gray-300 mb-4">
              Set up your Stripe Connect account without leaving DanceRealmX using our streamlined in-app wizard.
            </p>
            <Button 
              onClick={() => setModalOpen(true)}
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-medium"
            >
              Set Up Stripe Connect (In-App)
            </Button>
          </div>

          {/* Stripe Connect Modal */}
          {user && (
            <StripeConnectModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              userId={user.id}
              email={user.email || ''}
              onSuccess={() => {
                refetchPayments();
                toast({
                  title: "Stripe Connect Setup Complete",
                  description: "Your account has been successfully set up to receive payments!",
                });
              }}
            />
          )}
        </section>
        
        {isLoadingPayments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <section className="text-foreground">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Payment Overview</h2>
              <Button variant="outline" size="sm" onClick={() => refetchPayments()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-700">
                <div className="flex items-center mb-4">
                  <CircleDollarSign className="h-6 w-6 text-green-400 mr-2" />
                  <h3 className="text-lg font-medium text-white">Total Earnings</h3>
                </div>
                <p className="text-3xl font-bold text-white">${Number(paymentsData?.totalEarnings || 0).toFixed(2)}</p>
              </div>
              
              <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-700">
                <div className="flex items-center mb-4">
                  <CircleDollarSign className="h-6 w-6 text-blue-400 mr-2" />
                  <h3 className="text-lg font-medium text-white">Pending Payouts</h3>
                </div>
                <p className="text-3xl font-bold text-white">${Number(paymentsData?.pendingPayouts || 0).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-lg shadow border border-slate-700">
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-medium text-white">Recent Transactions</h3>
              </div>
              
              {paymentsData?.recentTransactions && paymentsData.recentTransactions.length > 0 ? (
                <div className="divide-y divide-slate-700">
                  {paymentsData.recentTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-white">{transaction.description}</p>
                        <p className="text-sm text-slate-300">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <p className={`font-medium ${transaction.type === 'payout' ? 'text-green-400' : 'text-blue-400'}`}>
                        {transaction.type === 'payout' ? '-' : '+'} ${Number(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-300">
                  <p>No transactions yet</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}