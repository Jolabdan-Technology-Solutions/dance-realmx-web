import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { 
  Loader2, MapPin, Calendar, 
  MessageCircle, BookOpen, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InstructorProfilePage() {
  const { instructorId } = useParams();
  
  // Fetch instructor details
  const { data: instructor, isLoading } = useQuery<User>({
    queryKey: [`/api/instructors/${instructorId}`],
    enabled: !!instructorId,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!instructor) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Instructor Not Found</h1>
        <p className="mb-8">The instructor you're looking for doesn't exist.</p>
        <Link href="/connect">
          <Button>Browse Instructors</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header with back navigation */}
      <div className="mb-8">
        <Link href="/connect">
          <Button variant="ghost" className="pl-0">
            &larr; Back to Instructors
          </Button>
        </Link>
      </div>
      
      {/* Instructor Profile Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Avatar className="w-32 h-32 mx-auto mb-4">
              <AvatarImage 
                src={instructor.profile_image_url ? `${instructor.profile_image_url.split('?')[0]}?t=${Date.now()}` : undefined} 
                alt={`${instructor.first_name} ${instructor.last_name}`}
                onError={(e) => {
                  console.error("Error loading instructor profile image:", instructor.profile_image_url);
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.username)}&background=00d4ff&color=fff`;
                }}
              />
              <AvatarFallback className="text-3xl">
                {instructor.first_name?.[0]}{instructor.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold mb-1">{instructor.first_name} {instructor.last_name}</h1>
            <p className="text-gray-500 mb-4 flex items-center justify-center">
              <MapPin className="h-4 w-4 mr-1" />
              New York, NY
            </p>
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="ml-1 text-sm text-green-500 font-medium">Verified Professional</span>
              </div>
            </div>
            <Link href={`/instructors/${instructorId}/book`}>
              <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 mb-4">
                Book a Session
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">About</h2>
            <p className="text-gray-700 mb-6">
              {instructor.seller_bio || 
                `Professional dance instructor with over 10 years of experience teaching various styles including ballet, contemporary, and jazz. Specializes in teaching dancers of all levels, from beginners to advanced practitioners.`
              }
            </p>
            
            <h3 className="font-semibold mb-2">Specialties</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge>Ballet</Badge>
              <Badge>Contemporary</Badge>
              <Badge>Jazz</Badge>
              <Badge>Hip Hop</Badge>
            </div>
            
            <h3 className="font-semibold mb-2">Qualifications</h3>
            <ul className="list-disc pl-5 mb-6 text-gray-700">
              <li>Bachelor of Fine Arts in Dance, Juilliard School</li>
              <li>Certified by American Ballet Theatre</li>
              <li>Former Principal Dancer, New York City Ballet</li>
            </ul>
            
            <h3 className="font-semibold mb-2">Teaching Philosophy</h3>
            <p className="text-gray-700">
              I believe in creating a supportive environment where dancers can explore movement, build technical skills, and develop their artistic voice. My teaching approach emphasizes proper technique, musicality, and personal expression.
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="classes">
        <TabsList className="mb-6">
          <TabsTrigger value="classes">Classes & Availability</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="classes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>Available times for private and group sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="font-medium">Monday</div>
                    <div>9:00 AM - 5:00 PM</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Tuesday</div>
                    <div>9:00 AM - 5:00 PM</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Wednesday</div>
                    <div>9:00 AM - 5:00 PM</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Thursday</div>
                    <div>9:00 AM - 5:00 PM</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Friday</div>
                    <div>9:00 AM - 3:00 PM</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Saturday</div>
                    <div>10:00 AM - 2:00 PM</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Sunday</div>
                    <div>Not Available</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link href={`/instructors/${instructorId}/book`}>
                    <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule a Session
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
                <CardDescription>Types of sessions and pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <UserIcon className="h-5 w-5 mr-2 text-[#00d4ff]" />
                      Private Sessions
                    </h3>
                    <p className="text-gray-600 mb-1">One-on-one personalized instruction</p>
                    <p className="font-medium">$75 per hour</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Users className="h-5 w-5 mr-2 text-[#00d4ff]" />
                      Group Sessions (2-5 people)
                    </h3>
                    <p className="text-gray-600 mb-1">Small group instruction</p>
                    <p className="font-medium">$45 per person, per hour</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 mr-2 text-[#00d4ff]" />
                      Workshop (6+ people)
                    </h3>
                    <p className="text-gray-600 mb-1">Specialized workshop instruction</p>
                    <p className="font-medium">$35 per person, per hour</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <div className="h-48 overflow-hidden">
                <img 
                  src="/assets/images/course-ballet.jpg" 
                  alt="Ballet Fundamentals"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Ballet Fundamentals</CardTitle>
                  <Badge>Beginner</Badge>
                </div>
                <CardDescription>Master the basics of ballet with proper technique</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">8 lessons</span>
                  <span className="mx-2">•</span>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm text-gray-600">Certificate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00d4ff]">$149.99</span>
                  <Link href="/courses/1">
                    <Button variant="outline">View Course</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <div className="h-48 overflow-hidden">
                <img 
                  src="/assets/images/course-contemporary.jpg" 
                  alt="Contemporary Expression"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Contemporary Expression</CardTitle>
                  <Badge>Intermediate</Badge>
                </div>
                <CardDescription>Develop your contemporary dance vocabulary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">12 lessons</span>
                  <span className="mx-2">•</span>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm text-gray-600">Certificate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00d4ff]">$199.99</span>
                  <Link href="/courses/2">
                    <Button variant="outline">View Course</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">Jane Doe</h4>
                      <p className="text-sm text-gray-500">May 15, 2023</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500 font-medium">Verified Review</span>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    Amazing instructor! I've been taking private ballet lessons and have seen tremendous improvement in my technique. Highly recommend for dancers of all levels.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarFallback>MS</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">Michael Smith</h4>
                      <p className="text-sm text-gray-500">April 3, 2023</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500 font-medium">Verified Review</span>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    I joined a group session for contemporary dance and it was an incredible experience. The instructor is patient, knowledgeable, and makes everyone feel comfortable regardless of skill level.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper icons
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function Stars(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}