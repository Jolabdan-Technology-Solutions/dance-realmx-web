import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: any;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        const [plansResponse, subscriptionResponse] = await Promise.all([
          api.get('/subscription/plans'),
          user ? api.get('/subscription/current') : Promise.resolve({ data: null })
        ]);

        setPlans(plansResponse.data);
        setSubscription(subscriptionResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch subscription data'));
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  return {
    plans,
    subscription,
    loading,
    error
  };
}; 