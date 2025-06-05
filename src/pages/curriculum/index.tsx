import React from 'react';
import { CurriculumCreationButton } from '@/components/curriculum/CurriculumCreationButton';
import { PremiumContent } from '@/components/curriculum/PremiumContent';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function CurriculumPage() {
  const { data: curriculums, isLoading } = useQuery({
    queryKey: ['curriculums'],
    queryFn: async () => {
      const response = await api.get('/curriculum');
      return response.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Curriculum</h1>
        <CurriculumCreationButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {curriculums?.map((curriculum: any) => (
          <div key={curriculum.id} className="bg-white shadow rounded-lg overflow-hidden">
            {curriculum.isPremium ? (
              <PremiumContent title={curriculum.title}>
                <div className="p-4">
                  <p className="text-gray-600">{curriculum.description}</p>
                  <div className="mt-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Premium
                    </span>
                  </div>
                </div>
              </PremiumContent>
            ) : (
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900">{curriculum.title}</h3>
                <p className="mt-2 text-gray-600">{curriculum.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 