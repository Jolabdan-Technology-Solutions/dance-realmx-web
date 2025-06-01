import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { 
  Loader2, Mail, User as UserIcon, Calendar, 
  Briefcase, Award, BookOpen, Award, MessageCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthWrapper } from "@/lib/auth-wrapper";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/format-date";

function UserProfileContent() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  
  // Fetch user details
  const { data: profileUser, isLoading, error } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  
  // Is this the current user's profile?
  const isOwnProfile = currentUser?.id === Number(userId);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error || !profileUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
        <p className="mb-8">The user you're looking for doesn't exist or you don't have permission to view this profile.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  // Determine user role display
  const roleDisplay = {
    'admin': 'Administrator',
    'user': 'Member',
    'instructor': 'Instructor',
    'seller': 'Curriculum Seller',
    'curriculum_officer': 'Curriculum Officer',
    'moderator': 'Moderator'
  };

  // Subscription tier display
  const subscriptionTierDisplay = {
    'free': 'Free Tier',
    'educator': 'Educator Tier',
    'premium': 'Premium Tier',
    'royalty': 'Royalty Tier'
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Profile image */}
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary">
              <AvatarImage src={profileUser.profile_image_url || ''} alt={profileUser.username} />
              <AvatarFallback className="text-2xl">
                {profileUser.first_name?.charAt(0) || profileUser.username?.charAt(0)}
                {profileUser.last_name?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Profile info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">
              {profileUser.first_name} {profileUser.last_name}
            </h1>
            <p className="text-gray-400 mb-2">@{profileUser.username}</p>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
              {profileUser.role && (
                <Badge variant="outline" className="font-medium py-1">
                  {roleDisplay[profileUser.role] || profileUser.role}
                </Badge>
              )}
              {profileUser.subscriptionTier && (
                <Badge className="bg-primary text-primary-foreground font-medium py-1">
                  {subscriptionTierDisplay[profileUser.subscriptionTier] || profileUser.subscriptionTier}
                </Badge>
              )}
            </div>
            
            {profileUser.seller_bio && (
              <p className="text-gray-300 mt-2 max-w-2xl">
                {profileUser.seller_bio}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
              {isOwnProfile ? (
                <Link href="/profile/edit">
                  <Button variant="outline">
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <Link href={`/connect/message/${profileUser.id}`}>
                  <Button variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </Link>
              )}
              
              {profileUser.role === 'instructor' && (
                <Link href={`/instructors/${profileUser.id}/book`}>
                  <Button variant="outline" className="ml-2">
                    Book a Lesson
                  </Button>
                </Link>
              )}
              
              {profileUser.role === 'seller' && (
                <Link href={`/sellers/${profileUser.id}`}>
                  <Button variant="outline" className="ml-2">
                    View Store
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile content */}
      <Tabs defaultValue="about">
        <TabsList className="mb-6">
          <TabsTrigger value="about">About</TabsTrigger>
          {profileUser.role === 'seller' && (
            <TabsTrigger value="resources">Resources</TabsTrigger>
          )}
          {profileUser.role === 'instructor' && (
            <TabsTrigger value="courses">Courses</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileUser.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profileUser.email}</span>
                  </div>
                )}
                {profileUser.createdAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Member since {formatDate(new Date(profileUser.createdAt))}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {profileUser.role === 'instructor' && (
            <Card>
              <CardHeader>
                <CardTitle>Instructor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileUser.instructorSpecialties && (
                    <div>
                      <h3 className="font-medium mb-2">Dance Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {profileUser.instructorSpecialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profileUser.instructorExperience && (
                    <div>
                      <h3 className="font-medium mb-2">Experience</h3>
                      <p>{profileUser.instructorExperience} years</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {profileUser.role === 'seller' && (
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Curriculum Resources</CardTitle>
                <CardDescription>
                  Resources created by this seller
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Link href={`/sellers/${profileUser.id}`}>
                    <Button>
                      <BookOpen className="mr-2 h-4 w-4" />
                      View All Resources
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {profileUser.role === 'instructor' && (
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Courses</CardTitle>
                <CardDescription>
                  Courses taught by this instructor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">View courses or book lessons with this instructor</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Link href={`/instructors/${profileUser.id}/courses`}>
                      <Button variant="outline">
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Courses
                      </Button>
                    </Link>
                    <Link href={`/instructors/${profileUser.id}/book`}>
                      <Button>
                        <Calendar className="mr-2 h-4 w-4" />
                        Book a Lesson
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Export the wrapped component
export default function UserProfilePage() {
  return (
    <AuthWrapper fallback={<UserProfileContent />}>
      <UserProfileContent />
    </AuthWrapper>
  );
}