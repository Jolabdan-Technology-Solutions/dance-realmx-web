import React, { useState } from 'react';
import { FeatureGuard } from '@/components/guards/FeatureGuard';
import { UserRole } from '@/types/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface KnowledgeCheckProps {
  lessonId: number;
  onComplete: (score: number) => void;
}

interface Question {
  id: number;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: { id: number; text: string }[];
  correct_answer: string | string[];
}

export const KnowledgeCheck: React.FC<KnowledgeCheckProps> = ({ lessonId, onComplete }) => {
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['knowledge-check', lessonId],
    queryFn: async () => {
      const response = await api.get(`/lessons/${lessonId}/knowledge-check`);
      return response.data;
    },
  });

  const submitAnswersMutation = useMutation({
    mutationFn: async (submittedAnswers: Record<number, string | string[]>) => {
      const response = await api.post(`/lessons/${lessonId}/knowledge-check/submit`, {
        answers: submittedAnswers,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      onComplete(data.score);
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', lessonId] });
    },
  });

  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = () => {
    submitAnswersMutation.mutate(answers);
  };

  if (isLoading) {
    return <div>Loading knowledge check...</div>;
  }

  return (
    <FeatureGuard requiredRoles={[UserRole.STUDENT]}>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Knowledge Check</h2>

        <div className="space-y-8">
          {questions?.map((question: Question) => (
            <div key={question.id} className="border-b pb-6">
              <p className="text-lg font-medium text-gray-900 mb-4">{question.text}</p>

              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center p-3 rounded-lg border ${
                        isSubmitted
                          ? option.text === question.correct_answer
                            ? 'bg-green-50 border-green-200'
                            : answers[question.id] === option.text
                            ? 'bg-red-50 border-red-200'
                            : 'border-gray-200'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.text}
                        checked={answers[question.id] === option.text}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        disabled={isSubmitted}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'true_false' && (
                <div className="space-y-2">
                  {['True', 'False'].map((option) => (
                    <label
                      key={option}
                      className={`flex items-center p-3 rounded-lg border ${
                        isSubmitted
                          ? option === question.correct_answer
                            ? 'bg-green-50 border-green-200'
                            : answers[question.id] === option
                            ? 'bg-red-50 border-red-200'
                            : 'border-gray-200'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        disabled={isSubmitted}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'short_answer' && (
                <textarea
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={isSubmitted}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Type your answer here..."
                />
              )}

              {isSubmitted && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                  <p className="text-sm text-gray-600">{question.correct_answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isSubmitted && (
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={submitAnswersMutation.isPending}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitAnswersMutation.isPending ? 'Submitting...' : 'Submit Answers'}
            </button>
          </div>
        )}

        {isSubmitted && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">
              Your score: {submitAnswersMutation.data?.score}%
            </p>
            <p className="text-sm text-green-600 mt-1">
              {submitAnswersMutation.data?.score >= 70
                ? 'Congratulations! You have passed the knowledge check.'
                : 'You need to score at least 70% to pass. Please review the material and try again.'}
            </p>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
}; 