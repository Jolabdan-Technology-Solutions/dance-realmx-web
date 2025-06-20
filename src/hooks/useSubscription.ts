import { useAuth } from './useAuth';
import { UserRole } from '@prisma/client';

export function useSubscription() {
  const { user } = useAuth();

  const hasRole = (role: UserRole) => {
    if (!user?.role) return false;
    return user.role.includes(role);
  };

  const canSellResources = hasRole('CURRICULUM_SELLER');
  const canCreateCourses = hasRole('INSTRUCTOR_ADMIN');
  const canBeBooked = hasRole('BOOKING_PROFESSIONAL');
  const canBookProfessionals = hasRole('BOOKING_USER');

  return {
    canSellResources,
    canCreateCourses,
    canBeBooked,
    canBookProfessionals,
    subscription: user?.subscription_tier,
  };
} 