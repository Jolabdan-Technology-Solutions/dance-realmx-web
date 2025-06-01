import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lesson, Module, Course } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LessonPage() {
  const { courseId, moduleId, lessonId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch lesson details
  const { data: lesson, isLoading: isLoadingLesson } = useQuery<Lesson>({
    queryKey: [`/api/lessons/${lessonId}`],
    enabled: !!lessonId,
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

  // Fetch other lessons in the module for navigation
  const { data: moduleLessons = [], isLoading: isLoadingModuleLessons } = useQuery<Lesson[]>({
    queryKey: [`/api/modules/${moduleId}/lessons`],
    enabled: !!moduleId,
  });

  // Fetch enrollment data
  const { data: enrollment, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: [`/api/courses/${courseId}/enrollment`],
    enabled: !!user && !!courseId,
  });

  // Fetch lesson progress
  const { data: lessonProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: [`/api/enrollment/${enrollment?.id}/lesson/${lessonId}/progress`],
    enabled: !!enrollment?.id && !!lessonId,
  });

  // Mark lesson as completed
  const markLessonCompletedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/enrollment/${enrollment?.id}/lesson/${lessonId}/complete`);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/enrollment/${enrollment?.id}/lesson/${lessonId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/enrollment/${enrollment?.id}/progress`] });
      
      toast({
        title: "Lesson completed",
        description: "Your progress has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark lesson as completed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingLesson || isLoadingModule || isLoadingCourse || 
                   isLoadingModuleLessons || isLoadingEnrollment || isLoadingProgress;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!lesson || !module || !course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Lesson Not Found</h1>
        <p className="mb-8">The lesson you're looking for doesn't exist or you don't have access to it.</p>
        <Link href={`/courses/${courseId}`}>
          <Button>Go Back to Course</Button>
        </Link>
      </div>
    );
  }

  // Sort lessons by order index
  const sortedLessons = [...moduleLessons].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Find the current lesson index
  const currentLessonIndex = sortedLessons.findIndex(l => l.id === Number(lessonId));
  
  // Determine previous and next lessons
  const prevLesson = currentLessonIndex > 0 ? sortedLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < sortedLessons.length - 1 ? sortedLessons[currentLessonIndex + 1] : null;

  const isCompleted = lessonProgress?.completed;

  const handleMarkAsComplete = () => {
    markLessonCompletedMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-12">
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

      {/* Lesson content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
        
        {lesson.videoUrl && (
          <div className="mb-6 aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={lesson.videoUrl}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        )}
        
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
        </div>
      </div>

      {/* Lesson actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 rounded-lg p-6">
        {/* Navigation buttons */}
        <div className="flex gap-3 mb-4 sm:mb-0">
          {prevLesson && (
            <Link href={`/courses/${courseId}/modules/${moduleId}/lessons/${prevLesson.id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Lesson
              </Button>
            </Link>
          )}
        </div>

        {/* Mark as complete button */}
        {!isCompleted ? (
          <Button 
            onClick={handleMarkAsComplete}
            disabled={markLessonCompletedMutation.isPending}
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          >
            {markLessonCompletedMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Mark as Complete
          </Button>
        ) : (
          <Button disabled className="bg-green-100 text-green-800">
            <CheckCircle className="mr-2 h-4 w-4" />
            Completed
          </Button>
        )}

        {/* Next lesson button */}
        <div className="flex gap-3 mt-4 sm:mt-0">
          {nextLesson && (
            <Link href={`/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.id}`}>
              <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                Next Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}