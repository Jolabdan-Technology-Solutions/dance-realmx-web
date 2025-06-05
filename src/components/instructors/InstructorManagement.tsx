import React from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';

interface InstructorManagementProps {
  children: React.ReactNode;
}

export const InstructorManagement: React.FC<InstructorManagementProps> = ({ children }) => {
  return (
    <FeatureGuard 
      requiredRoles={[UserRole.INSTRUCTOR_ADMIN]} 
      requiredSubscription={true}
    >
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructor Management</h2>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </FeatureGuard>
  );
}; 