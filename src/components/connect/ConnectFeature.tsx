import React from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ConnectFeatureProps {
  children?: React.ReactNode;
}

export const ConnectFeature: React.FC<ConnectFeatureProps> = ({ children }) => {
  const { data: connections, isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const response = await api.get('/connections');
      return response.data;
    },
  });

  return (
    <FeatureGuard requiredSubscription={true}>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect with Members</h2>
        
        {isLoading ? (
          <div>Loading connections...</div>
        ) : (
          <div className="space-y-4">
            {connections?.map((connection: any) => (
              <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {connection.profile_image_url && (
                    <img
                      src={connection.profile_image_url}
                      alt={connection.name}
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {connection.first_name} {connection.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{connection.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = `/messages/${connection.id}`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        )}
        
        {children}
      </div>
    </FeatureGuard>
  );
}; 