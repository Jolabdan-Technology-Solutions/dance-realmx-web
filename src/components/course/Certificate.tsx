import React from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface CertificateProps {
  courseId: number;
}

export const Certificate: React.FC<CertificateProps> = ({ courseId }) => {
  const { user } = useAuth();

  const { data: certificate, isLoading } = useQuery({
    queryKey: ['certificate', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}/certificate`);
      return response.data;
    },
  });

  const handleDownload = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/certificate/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${courseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  if (isLoading) {
    return <div>Loading certificate...</div>;
  }

  if (!certificate) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">Certificate not available yet. Complete the course to earn your certificate.</p>
      </div>
    );
  }

  return (
    <FeatureGuard requiredRoles={[UserRole.STUDENT]}>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Course Completion Certificate</h2>
          <p className="text-gray-600 mt-2">Congratulations on completing the course!</p>
        </div>

        <div className="border-2 border-gray-200 rounded-lg p-8 mb-8">
          <div className="text-center">
            <div className="mb-6">
              <img
                src="/logo.png"
                alt="Course Logo"
                className="h-16 mx-auto"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Certificate of Completion</h3>
            <p className="text-gray-600 mb-6">This is to certify that</p>
            <p className="text-2xl font-bold text-gray-900 mb-6">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-gray-600 mb-6">has successfully completed the course</p>
            <p className="text-xl font-semibold text-gray-900 mb-6">{certificate.course_title}</p>
            <p className="text-gray-600 mb-6">on</p>
            <p className="text-gray-900">
              {new Date(certificate.issued_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Certificate
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Certificate
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Certificate ID: {certificate.id}</p>
          <p>Verify this certificate at: {window.location.origin}/verify/{certificate.id}</p>
        </div>
      </div>
    </FeatureGuard>
  );
}; 