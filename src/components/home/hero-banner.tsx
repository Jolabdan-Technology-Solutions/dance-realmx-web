import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, Users, ChevronDown, GraduationCap } from "lucide-react";

export default function HeroBanner() {
  const { user, isLoading } = useAuth();
  
  // Determine login state and role to personalize the banner
  const isLoggedIn = !!user && !isLoading;
  const isInstructor = user?.role === "instructor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  
  return (
    <section 
      className="relative bg-cover bg-center h-[60vh] flex items-center justify-center" 
      style={{ backgroundImage: `url('/assets/images/bannerimage.png')` }}
      role="banner"
      aria-label="DanceRealmX Hero Banner"
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      
      <div className="z-10 text-center px-4 max-w-5xl">
        <img 
          src="/assets/images/Dance realm logo.png" 
          alt="Dance Realm Logo" 
          className="max-w-[250px] h-auto mx-auto mb-4"
        />
        
        {/* Personalized greeting for logged in users */}
        {isLoggedIn ? (
          <h1 className="text-4xl font-bold mb-2 text-white">
            Welcome {isInstructor ? "Instructor" : ""} {user.first_name || user.firstName || user.username}!
          </h1>
        ) : (
          <h1 className="text-4xl font-bold mb-2 text-white">Discover the Realm of Possibilities</h1>
        )}
        
        <p className="text-xl mb-6 text-white max-w-2xl mx-auto">
          {isLoggedIn 
            ? `Continue your journey with DanceRealmX - explore our ${isInstructor ? 'teaching tools' : 'learning resources'} below.` 
            : "Join DanceRealmX"}
        </p>
        
        <div className="flex flex-wrap justify-center gap-3">
          {/* Main CTA buttons - context sensitive based on user role */}
          {isLoggedIn ? (
            <>
              {isInstructor ? (
                <Link href="/instructor/dashboard">
                  <Button 
                    className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-8 py-3 font-bold"
                    aria-label="Go to Instructor Dashboard"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Instructor Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button 
                    className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-8 py-3 font-bold"
                    aria-label="Go to Your Dashboard"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    My Dashboard
                  </Button>
                </Link>
              )}
              
              {isAdmin && (
                <Link href="/admin/dashboard">
                  <Button 
                    className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-8 py-3 font-bold"
                    aria-label="Go to Admin Dashboard"
                  >
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/register">
                <Button 
                  className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-8 py-3 font-bold"
                  aria-label="Sign in or Register"
                >
                  Get Started
                </Button>
              </Link>
              
              <Link href="/subscription">
                <Button 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3 font-bold"
                  aria-label="View membership plans"
                >
                  View Plans
                </Button>
              </Link>
            </>
          )}
        </div>
        
        {/* Feature navigation buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link href="/curriculum">
            <Button 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10 rounded-full"
              aria-label="Browse curriculum resources"
            >
              Get Curriculum
            </Button>
          </Link>
          <Link href="/courses">
            <Button 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10 rounded-full"
              aria-label="Browse certification courses"
            >
              Get Certified
            </Button>
          </Link>
          <Link href="/connect">
            <Button 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10 rounded-full"
              aria-label="Connect with dance instructors"
            >
              Get Connected
            </Button>
          </Link>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <ChevronDown className="h-8 w-8 text-white" aria-hidden="true" />
          <span className="sr-only">Scroll down for more content</span>
        </div>
      </div>
    </section>
  );
}