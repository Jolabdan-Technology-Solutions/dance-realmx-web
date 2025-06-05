import React from 'react';
import { useRouter } from 'next/router';
import { ConnectFeature } from '@/components/connect/ConnectFeature';
import { MessageFeature } from '@/components/messages/MessageFeature';
import { BookingProfessional } from '@/components/booking/BookingProfessional';
import { BookingUser } from '@/components/booking/BookingUser';
import { useAuth } from '@/hooks/useAuth';

export default function ConnectPage() {
  const router = useRouter();
  const { recipientId } = router.query;
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <ConnectFeature />
          {user?.role === 'BOOKING_PROFESSIONAL' ? (
            <BookingProfessional />
          ) : (
            <BookingUser />
          )}
        </div>
        <div>
          {recipientId && <MessageFeature recipientId={recipientId as string} />}
        </div>
      </div>
    </div>
  );
} 