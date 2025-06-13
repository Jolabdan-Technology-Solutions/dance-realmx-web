import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface CourseContent {
  id: number;
  title: string;
  type: "video" | "quiz" | "assignment";
  duration?: number;
  isCompleted: boolean;
  isLocked: boolean;
  videoUrl?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: {
    id: number;
    name: string;
    avatar: string;
  };
  thumbnail: string;
  progress: number;
  totalDuration: number;
  content: CourseContent[];
}

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeContent, setActiveContent] = useState<CourseContent | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    },
  });

  const handleContentClick = (content: CourseContent) => {
    if (content.isLocked) {
      toast({
        title: "Content Locked",
        description: "Complete previous lessons to unlock this content.",
        variant: "destructive",
      });
      return;
    }
    setActiveContent(content);
    setIsPlaying(true);
  };

  const handleVideoComplete = async () => {
    if (!activeContent) return;

    try {
      await api.post(`/courses/${courseId}/progress`, {
        contentId: activeContent.id,
        status: "completed",
      });

      toast({
        title: "Progress Updated",
        description: "Your progress has been saved successfully.",
      });

      // Refresh course data
      // You might want to invalidate the query here
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Course Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-muted-foreground mb-4">{course.description}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-8 h-8 rounded-full"
              />
              <span>{course.instructor.name}</span>
            </div>
            <Badge variant="secondary">{course.totalDuration} minutes</Badge>
          </div>
        </div>
        <div className="md:w-1/3">
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Course Progress</span>
                <span className="text-sm text-muted-foreground">
                  {course.progress}%
                </span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          {activeContent ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {activeContent.type === "video" && activeContent.videoUrl ? (
                <video
                  src={activeContent.videoUrl}
                  controls
                  className="w-full h-full"
                  onEnded={handleVideoComplete}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  {activeContent.type === "quiz"
                    ? "Quiz Content"
                    : "Assignment Content"}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Select a lesson to start learning
              </p>
            </div>
          )}
        </div>

        {/* Course Content List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Course Content</h2>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {course.content.map((content) => (
                  <div
                    key={content.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeContent?.id === content.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    } ${content.isLocked ? "opacity-50" : ""}`}
                    onClick={() => handleContentClick(content)}
                  >
                    <div className="flex items-center gap-3">
                      {content.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : content.isLocked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{content.title}</h3>
                        {content.duration && (
                          <p className="text-sm text-muted-foreground">
                            {content.duration} minutes
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
