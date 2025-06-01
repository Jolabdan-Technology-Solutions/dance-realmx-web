import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Award } from "lucide-react";
import { RegistrationData } from "@/types/registration";
import { useLocation } from "wouter";

interface StepConfirmationProps {
  registrationData: RegistrationData;
}

export function StepConfirmation({ registrationData }: StepConfirmationProps) {
  const [, navigate] = useLocation();
  
  // Determine next steps based on the selected features and plan
  const getNextSteps = () => {
    const steps = [
      {
        title: "Complete Your Profile",
        description: "Add a profile picture and additional information about your dance experience and specialties.",
        buttonText: "Edit Profile",
        buttonLink: "/profile",
        icon: "profile"
      }
    ];
    
    // For instructors, suggest setting up a course
    if (registrationData.accountData?.selectedRoles.includes("instructor")) {
      steps.push({
        title: "Create Your First Course",
        description: "Start building your dance curriculum with modules, lessons, and assessments.",
        buttonText: "Create Course",
        buttonLink: "/instructor/courses/new",
        icon: "course"
      });
    }
    
    // For sellers, suggest setting up their store
    if (registrationData.accountData?.selectedRoles.includes("seller")) {
      steps.push({
        title: "Set Up Your Resource Store",
        description: "Upload your first teaching resource to start sharing and selling your materials.",
        buttonText: "Set Up Store",
        buttonLink: "/seller/store",
        icon: "store"
      });
    }
    
    // General step for all users
    steps.push({
      title: "Explore Available Courses",
      description: "Browse our catalog of dance courses and certifications.",
      buttonText: "Browse Courses",
      buttonLink: "/courses",
      icon: "explore"
    });
    
    return steps;
  };
  
  const getIconForStep = (iconType: string) => {
    switch (iconType) {
      case "profile":
        return <CheckCircle2 className="h-10 w-10 text-[#00d4ff]" />;
      case "course":
        return <Award className="h-10 w-10 text-[#00d4ff]" />;
      case "store":
        return <CheckCircle2 className="h-10 w-10 text-[#00d4ff]" />;
      case "explore":
        return <CheckCircle2 className="h-10 w-10 text-[#00d4ff]" />;
      default:
        return <CheckCircle2 className="h-10 w-10 text-[#00d4ff]" />;
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center bg-green-900/20 rounded-full p-4 mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Welcome to DanceRealmX!</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Your registration is complete and your {registrationData.recommendedPlan?.name} subscription has been activated.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getNextSteps().map((step, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="mb-4">
                {getIconForStep(step.icon)}
              </div>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">{step.description}</p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(step.buttonLink)}
              >
                {step.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-10 text-center">
        <h3 className="text-xl font-semibold mb-4">Account Details</h3>
        <div className="inline-block bg-gray-900 rounded-lg p-6 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Name</p>
              <p className="font-medium">
                {registrationData.accountData?.firstName} {registrationData.accountData?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Username</p>
              <p className="font-medium">{registrationData.accountData?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-medium">{registrationData.accountData?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Subscription Plan</p>
              <p className="font-medium">{registrationData.recommendedPlan?.name}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Button 
          size="lg"
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}