import { useState } from "react";
import { Link } from "wouter";
import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const certificationCourses = [
  {
    id: 1,
    title: "Ballet Education Certification",
    description: "Comprehensive training on ballet teaching methodology, technique analysis, and age-appropriate instruction.",
    imageSrc: "/assets/images/certification/Certification image.png",
    level: "Advanced",
    duration: "12 weeks",
    instructors: ["Sarah Johnson", "Michael Chen"],
    price: "$299",
    features: [
      "Professional teaching standards",
      "Anatomically-correct technique",
      "Age-appropriate methods",
      "Student assessment tools",
      "Digital certification upon completion"
    ]
  },
  {
    id: 2,
    title: "Contemporary Dance Instructor Certification",
    description: "Learn to teach contemporary dance with a focus on expression, fluidity, and modern techniques.",
    imageSrc: "/assets/images/certification/Certification image.png",
    level: "Intermediate",
    duration: "10 weeks",
    instructors: ["Emma Davis", "Jason Rodriguez"],
    price: "$249",
    features: [
      "Contemporary movement principles",
      "Improvisation teaching methods",
      "Composition and choreography",
      "Student performance assessment",
      "Digital certification upon completion"
    ]
  },
  {
    id: 3,
    title: "Hip-Hop Dance Education Certificate",
    description: "Master the art of teaching hip-hop dance styles, history, and cultural context to students of all levels.",
    imageSrc: "/assets/images/certification/Certification image.png",
    level: "All Levels",
    duration: "8 weeks",
    instructors: ["Marcus Thompson", "Alicia Gomez"],
    price: "$199",
    features: [
      "Hip-hop movement fundamentals",
      "Cultural context and history",
      "Age-appropriate choreography",
      "Freestyle teaching techniques",
      "Digital certification upon completion"
    ]
  },
  {
    id: 4,
    title: "Dance Business Management Certificate",
    description: "Essential business skills for dance educators looking to start or grow a studio or independent teaching practice.",
    imageSrc: "/assets/images/certification/Certification image.png",
    level: "Beginner",
    duration: "6 weeks",
    instructors: ["Jessica Williams", "Robert Taylor"],
    price: "$179",
    features: [
      "Studio business planning",
      "Marketing for dance education",
      "Student retention strategies",
      "Financial management basics",
      "Digital certification upon completion"
    ]
  }
];

export default function CertificationShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(certificationCourses.length / itemsPerPage);
  
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages);
  };
  
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPages) % totalPages);
  };
  
  const visibleCourses = certificationCourses.slice(
    currentIndex * itemsPerPage,
    currentIndex * itemsPerPage + itemsPerPage
  );

  return (
    <section className="py-12 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-primary" />
              Certification Courses
            </h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Earn industry-recognized credentials that set you apart in the dance education field. Our certification courses are designed by dance professionals with decades of experience.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/courses" className="flex items-center gap-2">
                View All Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={course.imageSrc || '/assets/images/course-placeholder.svg'}
                    alt={course.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/assets/images/course-placeholder.svg';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-primary font-medium">
                      {course.level}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{course.duration}</span>
                    <span>{course.price}</span>
                  </div>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <h4 className="font-medium mb-2 text-sm">What you'll learn:</h4>
                  <ul className="space-y-1">
                    {course.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/course-details/${course.id}`}>View Course Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }).map((_, index) => (
                <Button
                  key={index}
                  variant={index === currentIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentIndex(index)}
                  className={index === currentIndex ? "bg-primary text-white" : ""}
                >
                  {index + 1}
                </Button>
              ))}
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={nextSlide}
                disabled={currentIndex === totalPages - 1}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}