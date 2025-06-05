import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { CourseEnrollment } from '@/components/course/CourseEnrollment';
import { CourseLearning } from '@/components/course/CourseLearning';
import { KnowledgeCheck } from '@/components/course/KnowledgeCheck';
import { Certificate } from '@/components/course/Certificate';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function CoursePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['enrollment', id],
    queryFn: async () => {
      const response = await api.get(`/courses/${id}/enrollment`);
      return response.data;
    },
    enabled: !!id,
  });

  const handleKnowledgeCheckComplete = (score: number) => {
    if (score >= 70) {
      setShowCertificate(true);
    }
  };

  if (isLoading) {
    return <div>Loading course...</div>;
  }

  if (!enrollment) {
    return <CourseEnrollment courseId={Number(id)} />;
  }

  if (showCertificate) {
    return <Certificate courseId={Number(id)} />;
  }

  if (showKnowledgeCheck) {
    return (
      <KnowledgeCheck
        lessonId={enrollment.current_lesson_id}
        onComplete={handleKnowledgeCheckComplete}
      />
    );
  }

  return (
    <CourseLearning
      courseId={Number(id)}
      onComplete={() => setShowKnowledgeCheck(true)}
    />
  );
} 