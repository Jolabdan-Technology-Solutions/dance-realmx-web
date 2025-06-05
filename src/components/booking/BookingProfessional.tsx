import React from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const BookingProfessional: React.FC = () => {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['professional-bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings/professional');
      return response.data;
    },
  });

  return (
    <FeatureGuard requiredRoles={[UserRole.BOOKING_PROFESSIONAL]}>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Booking Schedule</h2>
        
        {isLoading ? (
          <div>Loading bookings...</div>
        ) : (
          <div className="space-y-4">
            {bookings?.map((booking: any) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Session with {booking.user.first_name} {booking.user.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.session_start).toLocaleString()} - 
                      {new Date(booking.session_end).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  {booking.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleBookingAction(booking.id, 'CONFIRMED')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleBookingAction(booking.id, 'CANCELLED')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

const handleBookingAction = async (bookingId: number, status: string) => {
  try {
    await api.patch(`/bookings/${bookingId}`, { status });
    // The query will automatically refetch due to React Query's cache invalidation
  } catch (error) {
    console.error('Error updating booking:', error);
  }
}; 