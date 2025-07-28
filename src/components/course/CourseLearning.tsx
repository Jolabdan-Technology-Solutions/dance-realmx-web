import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import axios from 'axios';

interface CourseLearningProps {
  courseId: number;
  onComplete: () => void;
}

export const CourseLearning: React.FC<CourseLearningProps> = ({ courseId, onComplete }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await axios.get(`/api/courses/${courseId}`);
      return response.data;
    },
  });

  const { data: modules, isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}/modules`);
      return response.data;
    },
  });

  const { data: lesson, isLoading: isLoadingLesson } = useQuery({
    queryKey: ['lesson', selectedLessonId],
    queryFn: async () => {
      if (!selectedLessonId) return null;
      const response = await api.get(`/lessons/${selectedLessonId}`);
      return response.data;
    },
    enabled: !!selectedLessonId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: number; completed: boolean }) => {
      const response = await api.post(`/lessons/${lessonId}/progress`, {
        completed,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      if (data.is_course_complete) {
        onComplete();
      }
    },
  });

  if (isLoadingCourse || isLoadingModules) {
    return <div>Loading course content...</div>;
  }

  return (
    <FeatureGuard requiredRoles={[UserRole.STUDENT]}>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${course.progress || 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{course.progress || 0}% Complete</p>
            </div>
          </div>

          <nav className="mt-4">
            {modules?.map((module: any) => (
              <div key={module.id} className="px-4 py-2">
                <button
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`w-full text-left px-2 py-1 rounded ${
                    selectedModuleId === module.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {module.title}
                </button>
                {selectedModuleId === module.id && (
                  <div className="ml-4 mt-2 space-y-1">
                    {module.lessons.map((lesson: any) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className={`w-full text-left px-2 py-1 rounded text-sm ${
                          selectedLessonId === lesson.id
                            ? 'bg-blue-50 text-blue-600'
                            : lesson.completed
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {lesson.completed ? '✓ ' : ''}
                        {lesson.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {isLoadingLesson ? (
            <div className="p-8">Loading lesson...</div>
          ) : lesson ? (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
              {lesson.video_url && (
                <div className="mt-6">
                  <video
                    controls
                    className="w-full rounded-lg shadow-lg"
                    src={lesson.video_url}
                  ></video>
                </div>
              )}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => {
                    const prevLesson = modules
                      .flatMap((m: any) => m.lessons)
                      .find((l: any) => l.id === lesson.id - 1);
                    if (prevLesson) {
                      setSelectedLessonId(prevLesson.id);
                    }
                  }}
                  disabled={!modules.flatMap((m: any) => m.lessons).find((l: any) => l.id === lesson.id - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous Lesson
                </button>
                <button
                  onClick={() => {
                    updateProgressMutation.mutate({
                      lessonId: lesson.id,
                      completed: true,
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Mark as Complete
                </button>
                <button
                  onClick={() => {
                    const nextLesson = modules
                      .flatMap((m: any) => m.lessons)
                      .find((l: any) => l.id === lesson.id + 1);
                    if (nextLesson) {
                      setSelectedLessonId(nextLesson.id);
                    }
                  }}
                  disabled={!modules.flatMap((m: any) => m.lessons).find((l: any) => l.id === lesson.id + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next Lesson
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select a lesson to begin learning
            </div>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
}; 