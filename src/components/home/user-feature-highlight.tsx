import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Award,
  Calendar,
  BarChart2,
  FileText,
  Users,
  PlusCircle,
  Settings,
  Store,
  UserPlus,
  Clock,
  FileEdit,
  Sparkles,
} from "lucide-react";
import { User } from "@shared/schema";

interface UserFeatureHighlightProps {
  user: User | null;
}

export default function UserFeatureHighlight({ user }: UserFeatureHighlightProps) {
  if (!user) {
    return null; // No user logged in, don't show this section
  }

  // Determine which feature cards to show based on user role and subscription
  const isAdmin = user.role === "admin";
  const isInstructor = user.role === "instructor" || isAdmin;
  const subscriptionLevel = user.subscription_plan || "free";
  const isPremium = subscriptionLevel === "premium" || subscriptionLevel === "royalty";
  const isEducator = subscriptionLevel === "educator" || isPremium;

  return (
    <section className="bg-gray-50 py-12 border-t border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome Back, {user.first_name || user.username}!</h2>
          <p className="text-gray-600">
            Here's a quick access to the features available with your {" "}
            <Badge variant="outline" className="font-medium text-primary">
              {subscriptionLevel.charAt(0).toUpperCase() + subscriptionLevel.slice(1)} Plan
            </Badge>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Always show these cards for all logged in users */}
          <FeatureCard
            title="My Dashboard"
            description="Track your progress and manage your account"
            icon={<BarChart2 className="h-6 w-6 text-primary" />}
            linkTo="/dashboard"
            linkText="Go to Dashboard"
          />

          <FeatureCard
            title="Browse Courses"
            description="Explore our catalog of dance courses"
            icon={<BookOpen className="h-6 w-6 text-primary" />}
            linkTo="/courses"
            linkText="View Courses"
          />

          <FeatureCard
            title="Curriculum Resources"
            description="Access teaching materials and resources"
            icon={<FileText className="h-6 w-6 text-primary" />}
            linkTo="/curriculum"
            linkText="Browse Resources"
          />

          {/* For Premium and Royalty subscribers */}
          {isPremium && (
            <FeatureCard
              title="My Certifications"
              description="View and download your earned certificates"
              icon={<Award className="h-6 w-6 text-primary" />}
              linkTo="/my-certifications"
              linkText="View Certificates"
            />
          )}

          {/* For all subscribers */}
          {subscriptionLevel !== "free" && (
            <FeatureCard
              title="Connect with Instructors"
              description="Book private lessons with dance professionals"
              icon={<Calendar className="h-6 w-6 text-primary" />}
              linkTo="/connect"
              linkText="Book a Lesson"
            />
          )}

          {/* For Instructors */}
          {isInstructor && (
            <>
              <FeatureCard
                title="Instructor Dashboard"
                description="Manage your courses, students, and schedule"
                icon={<Users className="h-6 w-6 text-primary" />}
                linkTo="/instructor/dashboard"
                linkText="Instructor Portal"
                highlighted={true}
              />

              <FeatureCard
                title="Create Course"
                description="Build and publish a new dance course"
                icon={<PlusCircle className="h-6 w-6 text-primary" />}
                linkTo="/instructor/courses/create"
                linkText="Start Creating"
              />

              <FeatureCard
                title="Issue Certificates"
                description="Award certificates to qualified students"
                icon={<FileEdit className="h-6 w-6 text-primary" />}
                linkTo="/instructor/dashboard"
                linkText="Manage Certificates"
              />
            </>
          )}

          {/* For Educator subscription and above */}
          {isEducator && (
            <FeatureCard
              title="Upload Resources"
              description="Share your teaching materials with others"
              icon={<Store className="h-6 w-6 text-primary" />}
              linkTo="/upload-resource"
              linkText="Upload Resources"
            />
          )}

          {/* Admin specific features */}
          {isAdmin && (
            <>
              <FeatureCard
                title="Admin Dashboard"
                description="Manage the entire DanceRealmX platform"
                icon={<Settings className="h-6 w-6 text-primary" />}
                linkTo="/admin/dashboard"
                linkText="Admin Portal"
                highlighted={true}
              />

              <FeatureCard
                title="Manage Users"
                description="Add, edit, and manage user accounts"
                icon={<UserPlus className="h-6 w-6 text-primary" />}
                linkTo="/admin/users"
                linkText="User Management"
              />
            </>
          )}

          {/* If free user, show upgrade card */}
          {subscriptionLevel === "free" && (
            <FeatureCard
              title="Upgrade Your Plan"
              description="Get access to premium features and courses"
              icon={<Sparkles className="h-6 w-6 text-primary" />}
              linkTo="/subscription"
              linkText="View Plans"
              highlighted={true}
            />
          )}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
  linkText: string;
  highlighted?: boolean;
}

function FeatureCard({ title, description, icon, linkTo, linkText, highlighted = false }: FeatureCardProps) {
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${highlighted ? 'border-primary border-2' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          {icon}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-2">
        <Button asChild variant={highlighted ? "default" : "outline"} className="w-full">
          <Link href={linkTo}>
            {linkText}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}