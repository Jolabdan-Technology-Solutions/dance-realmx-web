import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Calendar, CreditCard, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  planName: string;
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  stripeSubscriptionId: string;
}

export function SubscriptionCancellation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Fetch current subscription
  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ['/api/subscriptions/current'],
    queryFn: () => apiRequest<Subscription>('/api/subscriptions/current'),
    enabled: !!user,
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (data: { reason?: string; immediate?: boolean }) => {
      return await apiRequest('/api/subscriptions/cancel', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription has been canceled successfully.',
      });
      setIsDialogOpen(false);
      setCancellationReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription.',
        variant: 'destructive',
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/subscriptions/reactivate', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been reactivated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate subscription.',
        variant: 'destructive',
      });
    },
  });

  const handleCancelSubscription = (immediate = false) => {
    cancelSubscriptionMutation.mutate({
      reason: cancellationReason,
      immediate,
    });
  };

  const handleReactivateSubscription = () => {
    reactivateSubscriptionMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription to manage.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
              <p className="text-lg font-semibold">{subscription.planName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Price</Label>
              <p className="text-lg font-semibold">
                {formatAmount(subscription.amount, subscription.currency)}/month
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    subscription.status === 'active'
                      ? 'success'
                      : subscription.status === 'canceled'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </Badge>
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="outline">
                    Canceling at period end
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? 'Ends On' : 'Next Billing'}
              </Label>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p>{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Subscription Ending Soon
                  </h4>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
                    You can reactivate it anytime before then.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
          <CardDescription>
            Cancel or modify your subscription settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                </p>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <X className="mr-2 h-4 w-4" />
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Subscription</DialogTitle>
                      <DialogDescription>
                        We're sorry to see you go! Please let us know why you're canceling so we can improve our service.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Reason for canceling (optional)</Label>
                        <Textarea
                          id="reason"
                          placeholder="Let us know how we can improve..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">What happens next?</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Your subscription will remain active until {formatDate(subscription.currentPeriodEnd)}</li>
                          <li>• You'll continue to have full access during this period</li>
                          <li>• No further charges will be made</li>
                          <li>• You can reactivate anytime before the end date</li>
                        </ul>
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Keep Subscription
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelSubscription(false)}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        {cancelSubscriptionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Canceling...
                          </>
                        ) : (
                          'Cancel Subscription'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your subscription is set to cancel on {formatDate(subscription.currentPeriodEnd)}. 
                  You can reactivate it to continue your access.
                </p>
                
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={reactivateSubscriptionMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {reactivateSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    'Reactivate Subscription'
                  )}
                </Button>
              </div>
            )}

            {subscription.status === 'canceled' && (
              <div className="text-center p-6 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Subscription Canceled</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Your subscription was canceled on {subscription.canceledAt ? formatDate(subscription.canceledAt) : 'N/A'}.
                </p>
                <Button asChild>
                  <a href="/subscription">Subscribe Again</a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionCancellation;
