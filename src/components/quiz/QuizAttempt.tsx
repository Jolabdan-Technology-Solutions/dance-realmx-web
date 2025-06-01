import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Clock, Award, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface QuizQuestion {
  id: number;
  content: string;
  type: 'multiple-choice' | 'essay' | 'matching' | 'true-false';
  answers: string; // JSON string with answer options
  points: number;
  feedback?: string | null;
}

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  attemptsAllowed: number | null;
  moduleId: number;
}

interface QuizAttemptProps {
  quizId: number;
  onComplete: (passed: boolean) => void;
}

export function QuizAttempt({ quizId, onComplete }: QuizAttemptProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    feedback: Record<number, string>;
  } | null>(null);

  // Fetch quiz data
  const { data: quizData, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => apiRequest(`/quizzes/${quizId}`),
  });

  // Fetch quiz questions
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['quizQuestions', quizId],
    queryFn: () => apiRequest(`/quizzes/${quizId}/questions`),
    enabled: !!quizData,
  });

  // Create quiz attempt
  const createAttempt = useMutation({
    mutationFn: () => apiRequest(`/quizzes/${quizId}/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    onSuccess: (data) => {
      setAttemptId(data.id);
      // Initialize timer if there's a time limit
      if (quizData?.timeLimit) {
        setTimeRemaining(quizData.timeLimit * 60); // Convert minutes to seconds
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start quiz attempt. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Submit quiz attempt
  const submitAttempt = useMutation({
    mutationFn: (answers: Record<number, any>) => apiRequest(`/quizzes/${quizId}/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    }),
    onSuccess: (data) => {
      setIsSubmitting(false);
      setResult({
        score: data.score,
        passed: data.passed,
        feedback: data.feedback || {},
      });
      onComplete(data.passed);
    },
    onError: () => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Save progress periodically
  const saveProgress = useMutation({
    mutationFn: (answers: Record<number, any>) => apiRequest(`/quizzes/${quizId}/attempts/${attemptId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    }),
    onSuccess: () => {
      toast({
        title: 'Progress Saved',
        description: 'Your answers have been saved',
        duration: 2000,
      });
    },
  });

  // Start attempt when data is loaded
  useEffect(() => {
    if (quizData && !attemptId && !isSubmitting && !result) {
      createAttempt.mutate();
    }
  }, [quizData, attemptId, isSubmitting, result]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || isSubmitting || result) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitting, result]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!attemptId || isSubmitting || result) return;

    const saveTimer = setInterval(() => {
      if (Object.keys(userAnswers).length > 0) {
        saveProgress.mutate(userAnswers);
      }
    }, 30000);

    return () => clearInterval(saveTimer);
  }, [attemptId, userAnswers, isSubmitting, result]);

  const handleAnswerChange = (questionId: number, answer: any) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    submitAttempt.mutate(userAnswers);
  };

  const handleSaveProgress = () => {
    if (!attemptId || Object.keys(userAnswers).length === 0) return;

    saveProgress.mutate(userAnswers);
  };

  if (isLoadingQuiz || isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-2">Loading quiz...</span>
      </div>
    );
  }

  const quiz = quizData as Quiz;
  const questions = questionsData as QuizQuestion[];

  if (!quiz || !questions) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load quiz data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>
            {quiz.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            {result.passed ? (
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold mt-2">Congratulations!</h3>
                <p>You passed the quiz</p>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h3 className="text-xl font-bold mt-2">Not Passed</h3>
                <p>You did not reach the required score</p>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Your Score</span>
                <span className="font-bold">{result.score}%</span>
              </div>
              <Progress value={result.score} className="h-3" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span>Passing Score</span>
                <span className="font-bold">{quiz.passingScore}%</span>
              </div>
              <Progress value={quiz.passingScore} className="h-3 bg-muted" />
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="font-semibold text-lg mb-4">Question Feedback</h3>
            
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Questions</TabsTrigger>
                <TabsTrigger value="incorrect">Incorrect Answers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {questions.map((question, index) => (
                  <div key={question.id} className="mb-4 p-4 border rounded-md">
                    <div className="flex justify-between">
                      <span className="font-medium">Question {index + 1}</span>
                      {result.feedback[question.id] === 'correct' ? (
                        <span className="text-green-600">Correct</span>
                      ) : (
                        <span className="text-red-600">Incorrect</span>
                      )}
                    </div>
                    <p className="mt-2">{question.content}</p>
                    {question.feedback && (
                      <div className="mt-3 p-2 bg-muted rounded-md">
                        <p className="text-sm">{question.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="incorrect">
                {questions
                  .filter((question) => result.feedback[question.id] !== 'correct')
                  .map((question, index) => (
                    <div key={question.id} className="mb-4 p-4 border border-red-200 rounded-md">
                      <div className="flex justify-between">
                        <span className="font-medium">Question {index + 1}</span>
                        <span className="text-red-600">Incorrect</span>
                      </div>
                      <p className="mt-2">{question.content}</p>
                      {question.feedback && (
                        <div className="mt-3 p-2 bg-red-50 rounded-md">
                          <p className="text-sm">{question.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                {questions.filter((question) => result.feedback[question.id] !== 'correct').length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    All questions answered correctly!
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => onComplete(result.passed)}>
            {result.passed ? 'Continue to Certificate' : 'Try Again'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const parsedAnswers = currentQuestion ? JSON.parse(currentQuestion.answers) : [];
  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          </div>
          
          {timeRemaining !== null && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
        
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">{currentQuestion.content}</h3>
            
            {/* Multiple choice question */}
            {currentQuestion.type === 'multiple-choice' && (
              <RadioGroup
                value={userAnswers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-2">
                  {parsedAnswers.map((answer: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`answer-${index}`} />
                      <Label htmlFor={`answer-${index}`}>{answer}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            
            {/* Essay question */}
            {currentQuestion.type === 'essay' && (
              <Textarea
                placeholder="Enter your answer here..."
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="min-h-[150px]"
              />
            )}
            
            {/* True/False question */}
            {currentQuestion.type === 'true-false' && (
              <RadioGroup
                value={userAnswers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false">False</Label>
                  </div>
                </div>
              </RadioGroup>
            )}
            
            {/* Matching question */}
            {currentQuestion.type === 'matching' && parsedAnswers.length > 0 && (
              <div className="space-y-4">
                {parsedAnswers.map((item: { left: string; right: string[] }, index: number) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-md">{item.left}</div>
                    <select
                      className="p-2 border rounded-md"
                      value={userAnswers[currentQuestion.id]?.[index] || ''}
                      onChange={(e) => {
                        const currentMatching = { ...(userAnswers[currentQuestion.id] || {}) };
                        currentMatching[index] = e.target.value;
                        handleAnswerChange(currentQuestion.id, currentMatching);
                      }}
                    >
                      <option value="">Select an answer</option>
                      {item.right.map((option, optIndex) => (
                        <option key={optIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSaveProgress}
            disabled={saveProgress.isPending || Object.keys(userAnswers).length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
        </div>
        
        <div>
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              <Award className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 