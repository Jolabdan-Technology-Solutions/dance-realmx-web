import React, { useState } from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const BookingUser: React.FC = () => {
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const queryClient = useQueryClient();

  const { data: instructors, isLoading: isLoadingInstructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const response = await api.get('/instructors');
      return response.data;
    },
  });

  const { data: userBookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['user-bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings/user');
      return response.data;
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      setSelectedInstructor(null);
      setSessionDate('');
      setSessionTime('');
    },
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInstructor && sessionDate && sessionTime) {
      const sessionStart = new Date(`${sessionDate}T${sessionTime}`);
      const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000); // 1 hour session

      createBookingMutation.mutate({
        instructor_id: selectedInstructor,
        session_start: sessionStart.toISOString(),
        session_end: sessionEnd.toISOString(),
      });
    }
  };

  return (
    <FeatureGuard requiredRoles={[UserRole.BOOKING_USER]}>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Book a Session</h2>

        <form onSubmit={handleBookingSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Instructor</label>
            <select
              value={selectedInstructor || ''}
              onChange={(e) => setSelectedInstructor(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Choose an instructor</option>
              {instructors?.map((instructor: any) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.first_name} {instructor.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={createBookingMutation.isPending}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {createBookingMutation.isPending ? 'Booking...' : 'Book Session'}
          </button>
        </form>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Bookings</h3>
          {isLoadingBookings ? (
            <div>Loading bookings...</div>
          ) : (
            <div className="space-y-4">
              {userBookings?.map((booking: any) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Session with {booking.instructor.first_name} {booking.instructor.last_name}
                      </h4>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
}; 