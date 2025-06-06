import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UserRole } from '@prisma/client';

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredSubscription?: string;
}

export function SubscriptionGuard({
  children,
  requiredRole,
  requiredSubscription,
}: SubscriptionGuardProps) {
  const { canSellResources, canCreateCourses, canBeBooked, canBookProfessionals, subscription } = useSubscription();

  const hasRequiredRole = () => {
    if (!requiredRole) return true;
    switch (requiredRole) {
      case 'CURRICULUM_SELLER':
        return canSellResources;
      case 'INSTRUCTOR_ADMIN':
        return canCreateCourses;
      case 'BOOKING_PROFESSIONAL':
        return canBeBooked;
      case 'BOOKING_USER':
        return canBookProfessionals;
      default:
        return false;
    }
  };

  const hasRequiredSubscription = () => {
    if (!requiredSubscription) return true;
    return subscription === requiredSubscription;
  };

  if (!hasRequiredRole() || !hasRequiredSubscription()) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Subscription Required</h2>
        <p className="mb-4 text-gray-600">
          This feature requires a {requiredSubscription} subscription.
        </p>
        <a
          href="/subscription"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Upgrade Now
        </a>
      </div>
    );
  }

  return <>{children}</>;
} 