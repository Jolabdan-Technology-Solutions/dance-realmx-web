import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, QuizQuestion, Module, Course } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuizPage() {
  const { courseId, moduleId, quizId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Fetch quiz details
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  // Fetch quiz questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/quizzes/${quizId}/questions`],
    enabled: !!quizId,
  });

  // Fetch module details
  const { data: module, isLoading: isLoadingModule } = useQuery<Module>({
    queryKey: [`/api/modules/${moduleId}`],
    enabled: !!moduleId,
  });

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Submit quiz answers mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/submit`, { answers });
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the UI with results
      setQuizScore(data.score);
      setIsPassed(data.passed);
      setShowResults(true);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/enrollment`] });
      
      toast({
        title: data.passed ? "Quiz Completed Successfully" : "Quiz Needs Improvement",
        description: data.passed 
          ? "Congratulations! You've passed the quiz." 
          : `You scored ${data.score}%. Required: ${quiz?.passingScore}%.`,
        variant: data.passed ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingQuiz || isLoadingQuestions || 
                   isLoadingModule || isLoadingCourse;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz || !module || !course || questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Quiz Not Found</h1>
        <p className="mb-8">The quiz you're looking for doesn't exist or you don't have access to it.</p>
        <Link href={`/courses/${courseId}/modules/${moduleId}`}>
          <Button>Go Back to Module</Button>
        </Link>
      </div>
    );
  }

  // Sort questions by order index
  const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  
  const handleAnswerSelect = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < sortedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowConfirmSubmit(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setShowConfirmSubmit(false);
    submitQuizMutation.mutate();
  };

  // Calculate the progress percentage
  const progress = Math.round(((currentQuestionIndex + 1) / sortedQuestions.length) * 100);

  // Check if the current question has been answered
  const isCurrentQuestionAnswered = !!answers[currentQuestion.id];

  // Check if quiz is finished (all questions answered)
  const isQuizFinished = Object.keys(answers).length === sortedQuestions.length;

  // Format options for the question
  const options = currentQuestion.options as string[];

  // Results screen
  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Link href={`/courses/${courseId}/modules/${moduleId}`}>
            <Button variant="ghost" className="pl-0 mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Module
            </Button>
          </Link>

          <Card className="border-t-8 border-t-[#00d4ff]">
            <CardHeader>
              <CardTitle className="text-2xl">Quiz Results: {quiz.title}</CardTitle>
              <CardDescription>{module.title} - {course.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-6">
                {isPassed ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">Congratulations!</h3>
                    <p className="text-gray-600 mb-4">You passed the quiz with {quizScore}%.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 mb-2">Not Quite There</h3>
                    <p className="text-gray-600 mb-4">
                      You scored {quizScore}%. Required: {quiz.passingScore}%.
                    </p>
                  </div>
                )}

                <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
                  <div 
                    className={`h-4 rounded-full ${isPassed ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${quizScore}%` }}
                  ></div>
                </div>
                
                <div className="text-sm text-gray-500 mb-8">
                  Score: {quizScore}% | Passing Score: {quiz.passingScore}%
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => location.reload()}>
                Retry Quiz
              </Button>
              <Link href={`/courses/${courseId}/modules/${moduleId}`}>
                <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                  Continue Learning
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Navigation breadcrumbs */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Link href={`/courses/${courseId}/modules/${moduleId}`}>
              <Button variant="ghost" className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Module
              </Button>
            </Link>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <p className="text-gray-600">
              {course.title} &gt; {module.title}
            </p>
          </div>
        </div>

        {/* Quiz header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-gray-600 mb-4">{quiz.description}</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {sortedQuestions.length}
            </span>
            <span className="text-sm text-gray-500">
              {progress}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2 w-full" />
        </div>

        {/* Question card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Question {currentQuestionIndex + 1}: {currentQuestion.question}
            </CardTitle>
            <CardDescription>
              {currentQuestion.type === 'multiple_choice' ? 'Select one option' : 'Select true or false'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswerSelect}
            >
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered}
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
            >
              {currentQuestionIndex === sortedQuestions.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </CardFooter>
        </Card>

        {/* Submit quiz confirmation dialog */}
        <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                You've answered all {sortedQuestions.length} questions. Once submitted, you cannot change your answers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Review Answers</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitQuiz}>
                Submit Quiz
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}