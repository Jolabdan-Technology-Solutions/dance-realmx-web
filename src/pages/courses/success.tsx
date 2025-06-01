import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';

export default function CourseEnrollmentSuccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Extract the Stripe session ID and course ID from the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const session_id = searchParams.get('session_id');
    const course_id = searchParams.get('courseId');
    
    console.log('URL Parameters:', { session_id, course_id });
    
    if (session_id) {
      setSessionId(session_id);
    }
    
    if (course_id) {
      setCourseId(course_id);
      console.log('Set courseId:', course_id);
    }
  }, [location]);

  // Fetch the course details and enrollment status
  const { 
    data: courseData, 
    isLoading, 
    error,
    isError
  } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('No course ID provided');
      
      // Log the course ID and API URL we're calling
      const apiUrl = `/api/courses/${courseId}`;
      console.log('Fetching course from:', apiUrl);
      
      try {
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API error:', res.status, errorText);
          setDebugInfo(`API Error ${res.status}: ${errorText}`);
          throw new Error(`Failed to fetch course details: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Course data received:', data);
        return data;
      } catch (err) {
        console.error('Fetch error:', err);
        setDebugInfo(`Fetch error: ${err.message}`);
        throw err;
      }
    },
    enabled: !!courseId && !!user,
    retry: 3,
    refetchOnWindowFocus: false
  });

  // Process enrollment if we have a session ID
  useEffect(() => {
    if (sessionId && user && courseId) {
      // Call API to process enrollment with Stripe session ID
      const processEnrollment = async () => {
        try {
          console.log('Processing enrollment with:', { sessionId, courseId });
          
          const res = await fetch('/api/enrollments/process-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              courseId
            }),
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Enrollment error:', res.status, errorData);
            setDebugInfo(`Enrollment Error ${res.status}: ${JSON.stringify(errorData)}`);
            throw new Error(errorData.message || 'Failed to process enrollment');
          }
          
          const responseData = await res.json();
          console.log('Enrollment response:', responseData);
          
          toast({
            title: "Enrollment Successful",
            description: "You have successfully enrolled in this course.",
          });
        } catch (error) {
          console.error('Error processing enrollment:', error);
          toast({
            title: "Enrollment Processing Error",
            description: error instanceof Error ? error.message : "An error occurred processing your enrollment.",
            variant: "destructive",
          });
        }
      };
      
      processEnrollment();
    }
  }, [sessionId, user, courseId, toast]);

  // If we're still loading, show a spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-bold">Processing your enrollment...</h2>
        <p className="text-muted-foreground">Please wait while we confirm your payment</p>
      </div>
    );
  }

  // If there was an error fetching the course details
  if (isError || !courseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              </div>
              <CardTitle className="text-xl text-center">Course Not Found</CardTitle>
              <CardDescription className="text-center">
                The course you're looking for does not exist or has been removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                {error instanceof Error ? error.message : 'Course not found.'}
              </p>
              {debugInfo && (
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-left text-xs overflow-auto mb-4 max-h-32">
                  <pre>{debugInfo}</pre>
                </div>
              )}
              <p className="mb-4 text-sm">
                Course ID: {courseId}<br />
                Session ID: {sessionId?.substring(0, 10)}...
              </p>
              <Button asChild>
                <Link to="/courses">
                  Back to Courses
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success view
  return (
    <div className="container max-w-4xl py-12 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0">
          <Link to="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>
      
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold">Enrollment Successful!</h1>
        <p className="text-xl text-muted-foreground mt-2">
          You are now enrolled in this course
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{courseData.title}</CardTitle>
          <CardDescription>Your enrollment has been confirmed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {courseData.imageUrl && (
              <img 
                src={courseData.imageUrl} 
                alt={courseData.title} 
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-medium">{courseData.title}</h3>
              <p className="text-sm text-muted-foreground">
                {courseData.instructorName ? `Instructor: ${courseData.instructorName}` : 'Course available now'}
              </p>
            </div>
          </div>
          
          <p className="text-sm">
            Thank you for enrolling! You can now access all course materials and begin learning.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild variant="outline">
            <Link to="/courses">
              Browse More Courses
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/courses/${courseId}`}>
              Start Learning
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 