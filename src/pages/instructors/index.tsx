import React from 'react';
import { InstructorManagement } from '@/components/instructors/InstructorManagement';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function InstructorsPage() {
  const { data: instructors, isLoading } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const response = await api.get('/instructors');
      return response.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Instructors</h1>

      <InstructorManagement>
        <div className="space-y-6">
          {instructors?.map((instructor: any) => (
            <div key={instructor.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-4">
                {instructor.profile_image_url && (
                  <img
                    src={instructor.profile_image_url}
                    alt={instructor.name}
                    className="h-12 w-12 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {instructor.first_name} {instructor.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{instructor.email}</p>
                </div>
              </div>
              <div className="mt-4">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </InstructorManagement>
    </div>
  );
} 