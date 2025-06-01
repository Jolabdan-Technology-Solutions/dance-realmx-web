import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Layers,
  ShoppingBag,
  Users,
  Calendar,
  Award,
  Video,
  FileText,
  Share2
} from "lucide-react";
import { RegistrationData, FeatureCategory, Feature } from "@/types/registration";

interface StepFeatureSelectionProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
}

export function StepFeatureSelection({ registrationData, updateRegistrationData }: StepFeatureSelectionProps) {
  const [activeTab, setActiveTab] = useState<FeatureCategory>("instructor");
  
  const features: Feature[] = [
    // Instructor features
    {
      id: "create_courses",
      name: "Create and Teach Courses",
      description: "Build dance courses with modules, lessons, and assessments",
      category: "instructor",
      icon: "BookOpen"
    },
    {
      id: "issue_certificates",
      name: "Issue Certificates",
      description: "Award certificates for completed courses",
      category: "instructor",
      icon: "Award"
    },
    {
      id: "manage_students",
      name: "Manage Students",
      description: "Track student progress and engagement",
      category: "instructor",
      icon: "Users"
    },
    {
      id: "create_quizzes",
      name: "Create Quizzes and Assessments",
      description: "Design evaluations for your courses",
      category: "instructor",
      icon: "FileText"
    },
    {
      id: "upload_videos",
      name: "Upload and Share Videos",
      description: "Share dance tutorials and demonstrations",
      category: "instructor",
      icon: "Video"
    },
    {
      id: "schedule_classes",
      name: "Schedule Classes",
      description: "Create and manage class schedules",
      category: "instructor",
      icon: "Calendar"
    },
    
    // Student features
    {
      id: "enroll_courses",
      name: "Enroll in Courses",
      description: "Access dance education from top instructors",
      category: "student",
      icon: "BookOpen"
    },
    {
      id: "earn_certificates",
      name: "Earn Certificates",
      description: "Gain dance certification credentials",
      category: "student",
      icon: "Award"
    },
    {
      id: "track_progress",
      name: "Track Learning Progress",
      description: "Monitor your advancement through courses",
      category: "student",
      icon: "Layers"
    },
    {
      id: "book_sessions",
      name: "Book Private Sessions",
      description: "Schedule one-on-one time with instructors",
      category: "student",
      icon: "Calendar"
    },
    
    // Seller features
    {
      id: "sell_resources",
      name: "Sell Teaching Resources",
      description: "Monetize your dance teaching materials",
      category: "seller",
      icon: "ShoppingBag"
    },
    {
      id: "resource_analytics",
      name: "Resource Analytics",
      description: "Track sales and performance of your resources",
      category: "seller",
      icon: "Layers"
    },
    {
      id: "store_dashboard",
      name: "Seller Store Dashboard",
      description: "Manage your curriculum resources store",
      category: "seller",
      icon: "Layers"
    },
    {
      id: "resource_management",
      name: "Resource Management",
      description: "Upload, price, and organize your teaching materials",
      category: "seller",
      icon: "FileText"
    },
    
    // Connect features
    {
      id: "connect_profile",
      name: "Connect Professional Profile",
      description: "Create a profile to get bookings for teaching",
      category: "connect",
      icon: "Users"
    },
    {
      id: "connect_availability",
      name: "Set Teaching Availability",
      description: "Define when you're available to teach or perform",
      category: "connect",
      icon: "Calendar"
    },
    {
      id: "connect_bookings",
      name: "Manage Bookings",
      description: "Accept, decline, and manage dance engagements",
      category: "connect",
      icon: "Calendar"
    },
    {
      id: "connect_messaging",
      name: "Secure Messaging",
      description: "Communicate with potential clients securely",
      category: "connect",
      icon: "Share2"
    }
  ];
  
  const getIconComponent = (iconName: string) => {
    switch(iconName) {
      case "BookOpen": return <BookOpen className="h-6 w-6" />;
      case "Layers": return <Layers className="h-6 w-6" />;
      case "ShoppingBag": return <ShoppingBag className="h-6 w-6" />;
      case "Users": return <Users className="h-6 w-6" />;
      case "Calendar": return <Calendar className="h-6 w-6" />;
      case "Award": return <Award className="h-6 w-6" />;
      case "Video": return <Video className="h-6 w-6" />;
      case "FileText": return <FileText className="h-6 w-6" />;
      case "Share2": return <Share2 className="h-6 w-6" />;
      default: return <BookOpen className="h-6 w-6" />;
    }
  };
  
  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      updateRegistrationData({
        selectedFeatures: [...registrationData.selectedFeatures, featureId]
      });
    } else {
      updateRegistrationData({
        selectedFeatures: registrationData.selectedFeatures.filter(id => id !== featureId)
      });
    }
  };
  
  const countFeaturesByCategory = (category: FeatureCategory) => {
    return features.filter(feature => 
      feature.category === category && 
      registrationData.selectedFeatures.includes(feature.id)
    ).length;
  };
  
  const categoryDisplayNames: Record<FeatureCategory, string> = {
    instructor: "Instructor",
    student: "Student",
    seller: "Seller",
    connect: "Connect"
  };
  
  // When features change, clean up any selected features that no longer exist
  useEffect(() => {
    const validFeatureIds = features.map(f => f.id);
    const filteredFeatures = registrationData.selectedFeatures.filter(id => 
      validFeatureIds.includes(id)
    );
    
    if (filteredFeatures.length !== registrationData.selectedFeatures.length) {
      updateRegistrationData({
        selectedFeatures: filteredFeatures
      });
    }
  }, [features, registrationData.selectedFeatures, updateRegistrationData]);
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3">What would you like to do with DanceRealmX?</h2>
        <p className="text-gray-400">
          Select the features that match your needs. This will help us recommend the right membership plan for you.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FeatureCategory)}>
        <TabsList className="grid grid-cols-4 mb-6">
          {Object.entries(categoryDisplayNames).map(([category, displayName]) => (
            <TabsTrigger 
              key={category} 
              value={category} 
              className="relative"
            >
              {displayName}
              {countFeaturesByCategory(category as FeatureCategory) > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#00d4ff] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {countFeaturesByCategory(category as FeatureCategory)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.keys(categoryDisplayNames).map((category) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features
                .filter(feature => feature.category === category)
                .map(feature => (
                  <Card key={feature.id} className={`border hover:border-[#00d4ff] transition-colors ${
                    registrationData.selectedFeatures.includes(feature.id) ? 'border-[#00d4ff] bg-[#00d4ff]/10' : ''
                  }`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="text-[#00d4ff] mb-2">
                          {feature.icon && getIconComponent(feature.icon)}
                        </div>
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={registrationData.selectedFeatures.includes(feature.id)}
                          onCheckedChange={(checked) => 
                            handleFeatureToggle(feature.id, checked as boolean)
                          }
                        />
                      </div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-400">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="mt-6">
        <p className="text-sm text-gray-400">
          Selected features: <span className="font-semibold text-white">{registrationData.selectedFeatures.length}</span>
        </p>
      </div>
    </div>
  );
}