// course modulepage import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Course, Module, Lesson, Quiz } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Book, Play, CheckCircle, CircleX, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link, useParams } from "wouter";

export default function CourseModulePage() {
  const { courseId, moduleId } = useParams();
  const { user } = useAuth();

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch module details
  const { data: module, isLoading: isLoadingModule } = useQuery<Module>({
    queryKey: [`/api/modules/${moduleId}`],
    enabled: !!moduleId,
  });

  // Fetch lessons for this module
  const { data: lessons = [], isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: [`/api/modules/${moduleId}/lessons`],
    enabled: !!moduleId,
  });

  // Fetch quizzes for this module
  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: [`/api/modules/${moduleId}/quizzes`],
    enabled: !!moduleId,
  });

  // Fetch enrollment and progress if user is logged in
  const { data: enrollment, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: [`/api/courses/${courseId}/enrollment`],
    enabled: !!user && !!courseId,
  });

  // Fetch lesson progress if user is logged in
  const { data: lessonProgress = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: [`/api/enrollment/${enrollment?.id}/progress`],
    enabled: !!enrollment?.id,
  });

  const isLoading = isLoadingCourse || isLoadingModule || isLoadingLessons || 
                   isLoadingQuizzes || isLoadingEnrollment || isLoadingProgress;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!module || !course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Module Not Found</h1>
        <p className="mb-8">The module you're looking for doesn't exist or you don't have access to it.</p>
        <Link href="/courses">
          <Button>Go Back to Courses</Button>
        </Link>
      </div>
    );
  }

  // Check which lessons have been completed
  const isLessonCompleted = (lessonId: number) => {
    return lessonProgress.some(progress => progress.lessonId === lessonId && progress.completed);
  };

  // Calculate module progress percentage
  const completedLessons = lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
  const progressPercentage = lessons.length > 0 
    ? Math.round((completedLessons / lessons.length) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Course navigation */}
      <div className="mb-8">
        <Link href={`/courses/${courseId}`}>
          <Button variant="ghost" className="pl-0">
            &larr; Back to {course.title}
          </Button>
        </Link>
      </div>

      {/* Module header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
        <p className="text-gray-600 mb-4">{module.description}</p>
        <Progress value={progressPercentage} className="h-2 w-full mb-2" />
        <p className="text-sm text-gray-500">{progressPercentage}% Complete</p>
      </div>

      {/* Lessons section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Lessons</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-500">No lessons available in this module.</p>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id);
              return (
                <div key={lesson.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-3 rounded-full mr-4">
                        <Book className="h-5 w-5 text-[#00d4ff]" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {index + 1}. {lesson.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {lesson.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {completed ? (
                        <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                      ) : null}
                      <Link href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
                        <Button>
                          {completed ? "Review" : "Start"}
                          <Play className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quizzes section */}
      {quizzes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Quizzes & Assessments</h2>
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4">
                      <FileQuestion className="h-5 w-5 text-[#00d4ff]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{quiz.title}</h3>
                      <p className="text-sm text-gray-500">
                        Passing score: {quiz.passingScore}%
                      </p>
                    </div>
                  </div>
                  <Link href={`/courses/${courseId}/modules/${moduleId}/quizzes/${quiz.id}`}>
                    <Button>
                      Take Quiz
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}