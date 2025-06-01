import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  BookOpen, 
  Calendar, 
  Users, 
  FileText, 
  Sparkles
} from "lucide-react";

export default function BenefitsSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center mb-12 gap-8">
          {/* Certification Image */}
          <div className="md:w-1/3 flex justify-center">
            <img 
              src="/assets/images/certificationimage.png" 
              alt="Dance Certification" 
              className="max-w-full h-auto max-h-80 object-contain"
            />
          </div>
          
          {/* Section Heading and Text */}
          <div className="md:w-2/3 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-4 text-black">Why Choose DanceRealmX?</h2>
            <p className="text-lg text-gray-600">
              Our platform offers comprehensive solutions for dance education professionals and students alike,
              helping you achieve your goals through certification, collaboration, and resources.
            </p>
            <div className="mt-4">
              <Button asChild className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                <Link href="/courses">View Certification Courses</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Certification Benefit */}
          <BenefitCard
            icon={<CheckCircle className="h-16 w-16 text-[#FF6384]" />}
            title="Industry-Recognized Certification"
            description="Earn credentials that are respected throughout the dance education industry, enhancing your professional portfolio and career prospects."
            linkTo="/courses"
            linkText="Browse Certification Courses"
            imageSrc="/assets/images/benefits/recognition.jpg"
          />

          {/* Connect Benefit */}
          <BenefitCard
            icon={<Calendar className="h-16 w-16 text-[#36A2EB]" />}
            title="Connect with Top Instructors"
            description="Book private lessons, workshops, and consultations with experienced dance professionals who can help elevate your skills."
            linkTo="/connect"
            linkText="Find an Instructor"
            imageSrc="/assets/images/benefits/instructor.jpg"
          />

          {/* Curriculum Benefit */}
          <BenefitCard
            icon={<FileText className="h-16 w-16 text-[#FFCE56]" />}
            title="Comprehensive Curriculum Resources"
            description="Access a vast library of teaching materials, lesson plans, and educational content created by dance experts."
            linkTo="/curriculum"
            linkText="Explore Curriculum Materials"
            imageSrc="/assets/images/curriculum-materials.png"
          />

          {/* For Instructors */}
          <BenefitCard
            icon={<Users className="h-16 w-16 text-[#4BC0C0]" />}
            title="For Dance Educators"
            description="Create and market your own courses, share your curriculum materials, and connect with students looking for your expertise."
            linkTo="/subscription"
            linkText="View Instructor Plans"
            imageSrc="/assets/images/teaching-dance.png"
          />

          {/* For Students */}
          <BenefitCard
            icon={<BookOpen className="h-16 w-16 text-[#9966FF]" />}
            title="For Dance Students"
            description="Learn from the best, track your progress, earn certifications, and find personalized instruction to match your goals."
            linkTo="/courses"
            linkText="Start Learning Today"
            imageSrc="/assets/images/learning-dance.png"
          />

          {/* Community */}
          <BenefitCard
            icon={<Sparkles className="h-16 w-16 text-[#FF9F40]" />}
            title="Join a Global Community"
            description="Connect with fellow dancers, instructors, and enthusiasts from around the world to share ideas and inspirations."
            linkTo="/subscription"
            linkText="Join Our Community"
            imageSrc="/assets/images/dance-community.png"
          />
        </div>

        <div className="mt-16 text-center">
          <div className="bg-primary/10 rounded-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-3 text-black">Ready to transform your dance education?</h3>
            <p className="text-gray-600 mb-6">
              Whether you're looking to learn, teach, or connect, DanceRealmX has everything you need.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                <Link href="/auth">Sign Up Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/subscription">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
  imageSrc: string;
}

function BenefitCard({ icon, title, description, linkTo, linkText, imageSrc }: BenefitCardProps) {
  // Extract the color from the icon's className
  const iconElement = icon as React.ReactElement;
  const colorClass = iconElement.props.className.match(/text-\[(.*?)\]/)?.[1] || '#00d4ff';
  
  return (
    <div className="group flex flex-col bg-white rounded-3xl shadow-md transition-all hover:shadow-lg overflow-hidden border-0">
      {/* Top colored section with large icon */}
      <div 
        className="relative h-44 flex items-center justify-center p-6" 
        style={{ backgroundColor: colorClass + '20' }} // Light background based on icon color
      >
        <div 
          className="rounded-full p-6 shadow-md transform group-hover:scale-110 transition-transform"
          style={{ backgroundColor: 'white' }}
        >
          {icon}
        </div>
      </div>
      
      {/* Content section */}
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold mb-2 text-center text-black">{title}</h3>
        <p className="text-gray-600 mb-6 text-center flex-grow">{description}</p>
        <Button 
          asChild 
          className="mt-auto w-full rounded-full font-semibold transition-all" 
          style={{ 
            backgroundColor: colorClass, 
            color: 'white',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Link href={linkTo}>{linkText}</Link>
        </Button>
      </div>
    </div>
  );
}