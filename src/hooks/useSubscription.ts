import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/lib/api';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  features: string[];
  isPopular: boolean;
  tier: string;
}

interface Subscription {
  id: number;
  status: 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'FAILED';
  current_period_end: string;
  plan_id: number;
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