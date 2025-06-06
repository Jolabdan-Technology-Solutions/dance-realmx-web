'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { UserRole } from '@prisma/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const { subscription, canSellResources, canCreateCourses, canBeBooked, canBookProfessionals } = useSubscription();

  const getRoleDisplay = () => {
    if (canSellResources) return 'Curriculum Seller';
    if (canCreateCourses) return 'Instructor';
    if (canBeBooked) return 'Professional';
    if (canBookProfessionals) return 'Student';
    return 'Free User';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-3xl font-bold">Profile</h1>
        
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Account Information</h2>
          <p>Email: {user?.email}</p>
          <p>Username: {user?.username}</p>
          <p>Name: {user?.first_name} {user?.last_name}</p>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Subscription</h2>
          <p className="text-xl font-bold">{subscription || 'Free'}</p>
          <p>Role: {getRoleDisplay()}</p>
        </div>

        <div className="flex space-x-4">
          <a
            href="/profile/edit"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Edit Profile
          </a>
          <a
            href="/subscription"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Manage Subscription
          </a>
        </div>
      </div>
    </div>
  );
} 