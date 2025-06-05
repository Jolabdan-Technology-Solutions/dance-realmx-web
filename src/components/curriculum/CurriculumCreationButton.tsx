import React from 'react';
import { useRouter } from 'next/router';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';

export const CurriculumCreationButton: React.FC = () => {
  const router = useRouter();

  const handleCreateCurriculum = () => {
    router.push('/curriculum/create');
  };

  return (
    <FeatureGuard requiredRoles={[UserRole.CURRICULUM_SELLER]}>
      <button
        onClick={handleCreateCurriculum}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create New Curriculum
      </button>
    </FeatureGuard>
  );
}; 