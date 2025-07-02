import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Play,
  BookOpen,
  Clock,
  FileText,
  Eye,
  Loader2,
  ChevronDown,
  ChevronRight,
  Video,
} from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  content: string;
  video_url?: string;
  module_id: number;
  order: number;
  created_at?: string;
  updated_at?: string;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  order: number;
  lessons?: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description?: string;
  instructorId: number;
  imageUrl?: string;
}

export default function LessonPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const courseIdNum = parseInt(courseId);
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseIdNum],
    queryFn: () =>
      apiRequest<Course>(`/api/courses/${courseIdNum}`, { method: "GET" }),
    enabled: !!courseIdNum,
  });

  // Fetch all modules for the course
  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/courses/modules", courseIdNum],
    queryFn: () =>
      apiRequest<Module[]>(`/api/courses/${courseIdNum}/modules`, {
        method: "GET",
      }),
    enabled: !!courseIdNum,
  });

  // Toggle module expansion
  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Open video modal
  const openVideoModal = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsVideoModalOpen(true);
  };

  // Loading state
  if (courseLoading || modulesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/courses">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/courses">
          <Button variant="ghost" size="sm" className="h-auto p-0">
            Courses
          </Button>
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{course.title}</span>
      </div>

      {/* Course Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground text-lg">{course.description}</p>
        )}
      </div>

      {/* Modules and Lessons */}
      <div className="space-y-6">
        {modules && modules.length > 0 ? (
          modules.map((module) => (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {expandedModules.has(module.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      {module.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {module.lessons?.length || 0} lessons
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedModules.has(module.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                              <span className="text-sm font-medium text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{lesson.title}</h3>
                              {lesson.content && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {lesson.content}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.video_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openVideoModal(lesson)}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Watch
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Navigate to lesson detail page
                                window.open(`/lesson/${courseIdNum}`, "_blank");
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No lessons available in this module yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Modules Available</h3>
            <p className="text-muted-foreground mb-4">
              This course doesn't have any modules yet.
            </p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.title}</DialogTitle>
          </DialogHeader>
          {selectedLesson?.video_url && (
            <div className="aspect-video">
              <iframe
                src={selectedLesson.video_url}
                className="w-full h-full rounded-md"
                allowFullScreen
                title={selectedLesson.title}
              />
            </div>
          )}
          {selectedLesson?.content && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Lesson Content</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">
                  {selectedLesson.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
