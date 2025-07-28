import { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient, apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, CreditCard, Calendar, AlertTriangle } from "lucide-react";

interface Subscription {
  id: number;
  plan_id: number;
  status: string;
  frequency: string;
  is_active: boolean;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_session_id: string;
  stripe_subscription_id: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  plan?: {
    id: number;
    name: string;
    slug: string;
    priceMonthly: string;
    priceYearly: string;
  };
}

export function SubscriptionManagement() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancellationReason, setCancellationReason] = useState("");

  // Fetch user's subscriptions
  const {
    data: subscriptions = [],
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
  } = useQuery<Subscription[]>({
    queryKey: ["user-subscriptions"],
    queryFn: async () => {
      const response = await apiClient.get("/api/subscriptions/user", true);
      return response;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ subscriptionId, reason }: { subscriptionId: number; reason: string }) => {
      const response = await apiRequest(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: { reason },
        requireAuth: true,
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Cancelled",
        description: data.message || "Your subscription has been scheduled for cancellation.",
      });
      // Refresh subscriptions data
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error?.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await apiRequest(`/api/subscriptions/${subscriptionId}/reactivate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        requireAuth: true,
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Reactivated",
        description: data.message || "Your subscription has been reactivated.",
      });
      // Refresh subscriptions data
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
    },
    onError: (error: any) => {
      toast({
        title: "Reactivation Failed",
        description: error?.message || "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCancelSubscription = (subscriptionId: number) => {
    cancelMutation.mutate({ 
      subscriptionId, 
      reason: cancellationReason || "User requested cancellation" 
    });
  };

  const handleReactivateSubscription = (subscriptionId: number) => {
    reactivateMutation.mutate(subscriptionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (subscription.cancel_at_period_end) {
      return <Badge variant="destructive">Cancelled - Active until {formatDate(subscription.current_period_end)}</Badge>;
    }
    
    switch (subscription.status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'TRIALING':
        return <Badge variant="secondary">Free Trial</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Please log in to manage your subscriptions.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingSubscriptions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading subscriptions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Failed to load subscriptions. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = subscriptions.filter(sub => 
    ['ACTIVE', 'TRIALING'].includes(sub.status.toUpperCase()) && sub.is_active
  );

  if (activeSubscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Manage your active subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">You don't have any active subscriptions.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/subscription'}>
            View Available Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription Management</h2>
        <p className="text-gray-600">Manage your active subscriptions and billing</p>
      </div>

      <div className="grid gap-6">
        {activeSubscriptions.map((subscription) => (
          <Card key={subscription.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {subscription.plan?.name || 'Unknown Plan'}
                  </CardTitle>
                  <CardDescription>
                    {subscription.frequency.toLowerCase()} billing • ${subscription.plan?.priceMonthly || '0'}/month
                  </CardDescription>
                </div>
                {getStatusBadge(subscription)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">Current Period</div>
                    <div className="text-gray-600">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium">Next Billing Date</div>
                  <div className="text-gray-600">
                    {subscription.cancel_at_period_end 
                      ? "Subscription ends on " + formatDate(subscription.current_period_end)
                      : formatDate(subscription.current_period_end)
                    }
                  </div>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Cancellation Scheduled</span>
                  </div>
                  <p className="text-orange-700 text-sm mt-1">
                    Your subscription will end on {formatDate(subscription.current_period_end)}. 
                    You'll continue to have access until then.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              {subscription.cancel_at_period_end ? (
                <Button
                  variant="outline"
                  onClick={() => handleReactivateSubscription(subscription.id)}
                  disabled={reactivateMutation.isPending}
                >
                  {reactivateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Reactivate Subscription
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Cancel Subscription</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your subscription? You'll continue to have access 
                        until the end of your current billing period on {formatDate(subscription.current_period_end)}.
                        <br /><br />
                        <strong>What happens when you cancel:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Your subscription will remain active until {formatDate(subscription.current_period_end)}</li>
                          <li>You won't be charged for the next billing cycle</li>
                          <li>You can reactivate anytime before the end date</li>
                          <li>After the end date, you'll be downgraded to the free plan</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelSubscription(subscription.id)}
                        disabled={cancelMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Cancel Subscription
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
                Change Plan
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
