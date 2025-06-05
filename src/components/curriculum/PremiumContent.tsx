import React from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';

interface PremiumContentProps {
  children: React.ReactNode;
  title?: string;
}

export const PremiumContent: React.FC<PremiumContentProps> = ({ 
  children, 
  title = 'Premium Content' 
}) => {
  return (
    <FeatureGuard requiredSubscription={true}>
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="prose max-w-none">
          {children}
        </div>
      </div>
    </FeatureGuard>
  );
}; 