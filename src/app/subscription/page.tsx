'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionTier } from '@prisma/client';

const subscriptionPlans = [
  {
    name: 'Free',
    price: 0,
    features: [
      'Access to free courses',
      'Basic profile',
      'Community access',
    ],
  },
  {
    name: 'Student',
    price: 9.99,
    features: [
      'All Free features',
      'Book professionals',
      'Access to premium courses',
      'Priority support',
    ],
  },
  {
    name: 'Professional',
    price: 19.99,
    features: [
      'All Student features',
      'Get booked by students',
      'Create courses',
      'Sell resources',
      'Advanced analytics',
    ],
  },
];

export default function SubscriptionPage() {
  const { subscription, canSellResources, canCreateCourses, canBeBooked, canBookProfessionals } = useSubscription();

  const getCurrentPlan = () => {
    if (canSellResources || canCreateCourses) return 'Professional';
    if (canBeBooked || canBookProfessionals) return 'Student';
    return 'Free';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Subscription Plans</h1>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg p-6 shadow-md ${
              getCurrentPlan() === plan.name
                ? 'border-2 border-blue-500'
                : 'border border-gray-200'
            }`}
          >
            <h2 className="mb-4 text-2xl font-bold">{plan.name}</h2>
            <p className="mb-4 text-3xl font-bold">
              ${plan.price}
              <span className="text-sm font-normal text-gray-600">/month</span>
            </p>
            
            <ul className="mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full rounded px-4 py-2 font-bold ${
                getCurrentPlan() === plan.name
                  ? 'bg-gray-300 text-gray-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              disabled={getCurrentPlan() === plan.name}
            >
              {getCurrentPlan() === plan.name ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 