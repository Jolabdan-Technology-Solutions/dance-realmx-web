import React from 'react';
import { useRouter } from 'next/router';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStripe } from '@stripe/stripe-react';

interface CourseEnrollmentProps {
  courseId: number;
}

export const CourseEnrollment: React.FC<CourseEnrollmentProps> = ({ courseId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const stripe = useStripe();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    },
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/enrollments', {
        course_id: courseId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.stripe_session_id) {
        router.push(`/checkout?session_id=${data.stripe_session_id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        router.push(`/courses/${courseId}/learn`);
      }
    },
  });

  if (isLoading) {
    return <div>Loading course details...</div>;
  }

  return (
    <FeatureGuard requiredRoles={[UserRole.STUDENT]}>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
            <p className="text-gray-600 mt-2">{course.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">${course.price}</p>
            <p className="text-sm text-gray-500">One-time payment</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Full course access</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Certificate upon completion</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Lifetime access</span>
          </div>
        </div>

        <button
          onClick={() => createEnrollmentMutation.mutate()}
          disabled={createEnrollmentMutation.isPending}
          className="w-full mt-6 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {createEnrollmentMutation.isPending ? 'Processing...' : 'Enroll Now'}
        </button>
      </div>
    </FeatureGuard>
  );
}; 