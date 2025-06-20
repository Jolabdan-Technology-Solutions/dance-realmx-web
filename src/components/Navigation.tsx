import React from 'react';
import Link from 'next/link';
import { useSubscription } from '../hooks/useSubscription';
import { SubscriptionGuard } from './SubscriptionGuard';

const Navigation = () => {
  const { canSellResources, canCreateCourses, canBeBooked, canBookProfessionals } = useSubscription();

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">Dance Realm</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/resources" className="text-gray-700 hover:text-gray-900">
              Resources
            </Link>

            <SubscriptionGuard requiredRole="CURRICULUM_SELLER">
              <Link href="/resources/create" className="text-gray-700 hover:text-gray-900">
                Create Resource
              </Link>
            </SubscriptionGuard>

            <SubscriptionGuard requiredRole="INSTRUCTOR_ADMIN">
              <Link href="/courses" className="text-gray-700 hover:text-gray-900">
                Courses
              </Link>
            </SubscriptionGuard>

            <SubscriptionGuard requiredRole="BOOKING_USER">
              <Link href="/professionals" className="text-gray-700 hover:text-gray-900">
                Book Professional
              </Link>
            </SubscriptionGuard>

            <SubscriptionGuard requiredRole="BOOKING_PROFESSIONAL">
              <Link href="/bookings" className="text-gray-700 hover:text-gray-900">
                My Bookings
              </Link>
            </SubscriptionGuard>

            <Link href="/subscription" className="text-gray-700 hover:text-gray-900">
              Subscription
            </Link>

            <Link href="/profile" className="text-gray-700 hover:text-gray-900">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 