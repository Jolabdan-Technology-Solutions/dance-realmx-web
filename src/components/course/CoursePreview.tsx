import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LockIcon, PlayIcon, ClipboardIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface Module {
  id: number;
  title: string;
  description: string | null;
  type: 'lesson' | 'video' | 'quiz' | 'assignment';
  isPreviewable: boolean;
}

interface CoursePreviewProps {
  courseId: number;
  onEnroll: () => void;
}

export function CoursePreview({ courseId, onEnroll }: CoursePreviewProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  // Fetch course preview data
  const { data, isLoading, error } = useQuery({
    queryKey: ['coursePreview', courseId],
    queryFn: () => apiRequest(`/courses/${courseId}/preview`),
  });

  // Create checkout session mutation
  const createCheckoutSession = useMutation({
    mutationFn: () => apiRequest('/enrollments/checkout', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    }),
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Select first previewable module on load
  useEffect(() => {
    if (data?.previewModules && data.previewModules.length > 0) {
      setSelectedModuleId(data.previewModules[0].id);
    }
  }, [data]);

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      // Store intended course in local storage for after login
      localStorage.setItem('enrollIntentCourseId', courseId.toString());
      navigate('/login?redirect=enroll');
      return;
    }

    // Otherwise proceed to checkout
    createCheckoutSession.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading course preview...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load course preview. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const { course, previewModules, isEnrolled, requiresAuth } = data;
  const selectedModule = previewModules.find(m => m.id === selectedModuleId) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Course Info */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription>
              {course.duration && <span>{course.duration} • </span>}
              {course.level && <Badge variant="outline">{course.level}</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <strong>Price:</strong> ${course.price.toFixed(2)}
            </div>
            <div className="mb-4">
              {course.description}
            </div>
            {course.certificateEnabled && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                Certificate Available
              </Badge>
            )}
          </CardContent>
          <CardFooter>
            {isEnrolled ? (
              <Button className="w-full" onClick={onEnroll}>
                Continue Learning
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleEnrollClick}
                disabled={createCheckoutSession.isPending}
              >
                {createCheckoutSession.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {requiresAuth ? 'Sign In to Enroll' : 'Enroll Now'}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Preview Modules List */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Available Preview Content</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {previewModules.map((module) => (
                <li 
                  key={module.id}
                  className={`p-2 rounded-md cursor-pointer flex items-center ${
                    selectedModuleId === module.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedModuleId(module.id)}
                >
                  {module.type === 'video' && <PlayIcon className="h-4 w-4 mr-2" />}
                  {module.type === 'lesson' && <ClipboardIcon className="h-4 w-4 mr-2" />}
                  {module.title}
                </li>
              ))}
            </ul>
            
            {previewModules.length === 0 && (
              <p className="text-muted-foreground text-sm">No preview content available</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Preview Content */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Course Preview</CardTitle>
            <CardDescription>
              {selectedModule ? selectedModule.title : 'Select a module to preview'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedModule ? (
              <div>
                <div className="prose max-w-none">
                  {selectedModule.description && <p>{selectedModule.description}</p>}
                  
                  {/* Render appropriate preview based on module type */}
                  {selectedModule.type === 'video' && (
                    <div className="aspect-video bg-muted relative rounded-md overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <PlayIcon className="h-16 w-16 text-primary/30" />
                        <p className="mt-4 text-muted-foreground">Preview available (limited to {course.previewDuration} seconds)</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedModule.type === 'lesson' && (
                    <div className="border rounded-md p-4 bg-muted/30">
                      <p>This is a sample of the lesson content. The full content is available after enrollment.</p>
                      <p className="mt-2 text-muted-foreground">Preview shows {course.previewPages} page(s).</p>
                    </div>
                  )}
                  
                  {selectedModule.type === 'quiz' && (
                    <div className="border rounded-md p-4 bg-muted/30">
                      <p>Sample quiz questions will be available here.</p>
                      <p className="mt-2 text-muted-foreground">Full quiz available after enrollment.</p>
                    </div>
                  )}
                </div>
                
                {/* Locked content indicator */}
                <div className="mt-8 text-center p-4 border border-dashed rounded-md">
                  <LockIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 font-medium">Full Access Locked</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enroll in this course to access all content and get a certificate of completion.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={handleEnrollClick}
                    disabled={createCheckoutSession.isPending}
                  >
                    {createCheckoutSession.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {requiresAuth ? 'Sign In to Enroll' : 'Enroll Now'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a module from the list to preview its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 