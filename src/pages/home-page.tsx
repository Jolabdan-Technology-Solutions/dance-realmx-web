import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/use-auth";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Award,
  Users,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  XCircle,
  MessageSquarePlus,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import FeaturedImagesSlider from "../components/home/featured-images-slider";
import { useToast } from "../hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Define a type for resource objects
  type Resource = {
    id: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    title: string;
    price?: string;
    description?: string;
    previewVideoUrl?: string | null;
    fullVideoUrl?: string | null;
  };

  interface Testimonial {
    id?: string;
    userImage?: string;
    userName?: string;
    userTitle?: string;
    resourceType?: "course" | "resource" | "general" | null;
    resourceName?: string | null;
    isVerifiedProfessional?: boolean;
    text: string;
    createdAt?: string;
  }

  // Load featured curriculum resources
  const [featuredResources, setFeaturedResources] = useState<any[]>([]);
  const [featuredImagesLoading, setFeaturedImagesLoading] = useState(false);

  // Testimonials section state
  const [activeTestimonialTab, setActiveTestimonialTab] = useState("all");
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState("general");
  const [resourceName, setResourceName] = useState("");
  const [verified, setVerified] = useState(false);
  const [testimonialText, setTestimonialText] = useState("");

  // Query to fetch testimonials from the API
  const {
    data: testimonials = [],
    isLoading: isTestimonialsLoading,
    refetch: refetchTestimonials,
  } = useQuery({
    queryKey: ["/api/testimonials"],
    queryFn: async () => {
      const response = await fetch("/api/testimonials");
      if (!response.ok) {
        throw new Error("Failed to fetch testimonials");
      }
      return response.json();
    },
  });

  console.log(isTestimonialsLoading);

  useEffect(() => {
    document.title = "DanceRealmX | Discover the Realm of Possibilities";
  }, []);

  // Determine login state and role to personalize the banner
  const isLoggedIn = !!user && !isLoading;
  const isInstructor = user?.role === "instructor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  // Filter testimonials based on active tab
  interface Testimonial {
    id?: string;
    userImage?: string;
    userName?: string;
    userTitle?: string;
    resourceType?: "course" | "resource" | "general" | null;
    resourceName?: string | null;
    isVerifiedProfessional?: boolean;
    text: string;
    createdAt?: string;
  }

  const displayedTestimonials: Testimonial[] = testimonials.filter(
    (testimonial: Testimonial) => {
      if (activeTestimonialTab === "all") return true;
      return testimonial.resourceType === activeTestimonialTab;
    }
  );

  // For this implementation, we'll use local state instead of an API call
  // In a production environment, this would connect to a backend endpoint

  // Handle add testimonial button click
  const handleAddTestimonial = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please log in to share your experience",
        variant: "destructive",
      });
      return;
    }

    setTestimonialModalOpen(true);
  };

  const openTestimonialModal = (type: string) => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please log in to share your experience",
        variant: "destructive",
      });
      return;
    }

    setReviewType(type);
    setTestimonialModalOpen(true);
  };

  // Define the type for testimonial data
  interface SubmitTestimonialInput {
    text: string;
    isVerifiedProfessional: boolean;
    resourceType: string | null;
    resourceName: string | null;
  }

  // Create a mutation to submit testimonials
  const submitTestimonialMutation = useMutation({
    mutationFn: async (testimonialData: SubmitTestimonialInput) => {
      const response = await apiRequest(
        "POST",
        "/api/testimonials",
        testimonialData
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit testimonial");
      }
      return response.json();
    },
    onSuccess: () => {
      // On success, invalidate testimonials query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });

      // Reset form and state
      setTestimonialModalOpen(false);
      setTestimonialText("");
      setVerified(false);
      setResourceName("");

      toast({
        title: "Thank you for your feedback!",
        description: "Your testimonial has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description:
          error.message ||
          "There was an error submitting your testimonial. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle testimonial submission
  const handleSubmitTestimonial = () => {
    if (!testimonialText) {
      toast({
        title: "Review text required",
        description: "Please enter your review before submitting",
        variant: "destructive",
      });
      return;
    }

    // Prepare testimonial data
    const testimonialData = {
      text: testimonialText,
      isVerifiedProfessional: verified,
      resourceType: reviewType === "general" ? null : reviewType,
      resourceName: resourceName || null,
    };

    // Submit the testimonial using our mutation
    submitTestimonialMutation.mutate(testimonialData);
  };

  const displayName = user?.first_name || user?.username || 'Guest';

  return (
    <div className="min-h-screen">
      {isLoggedIn ? (
        // LOGGED IN VERSION - Current modern landing page
        <>
          {/* Main Hero Banner for logged in users */}
          <section
            className="relative h-[60vh] flex items-center justify-center"
            role="banner"
            aria-label="DanceRealmX Hero Banner"
            style={{
              backgroundImage: "url('/assets/images/bannerimage.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>

            <div className="z-10 text-center px-4 max-w-5xl">
              <h1 className="text-4xl font-bold mb-2 text-white">
                Welcome {isInstructor ? "Instructor" : ""} {displayName}!
              </h1>

              <p className="text-xl mb-6 text-white max-w-2xl mx-auto">
                Continue your journey with DanceRealmX - explore our{" "}
                {isInstructor ? "teaching tools" : "learning resources"} below.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {/* Main CTA buttons - context sensitive based on user role */}
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
            </div>
          </section>

          {/* Featured Images Slider for logged in users */}
          <section className="py-16 bg-gray-900">
            <div className="container mx-auto px-4 max-w-[95%]">
              <h2 className="text-4xl font-bold mb-8 text-white text-center">
                Featured Resources
              </h2>
              {featuredImagesLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <FeaturedImagesSlider images={featuredResources} />
              )}
            </div>
          </section>

          {/* Mission & Vision Section for logged in users */}
          <section className="py-16 bg-gray-900 text-white">
            <div className="container mx-auto px-4 max-w-[95%]">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-4xl font-bold mb-6 text-center">
                  What is{" "}
                  <span className="text-[#00d4ff]">Dance Realm Exchange</span>?
                </h2>

                <div className="mb-12 text-center">
                  <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                    An emerging collaborative platform for dance professionals,
                    studios, and educators to be the one-stop shop for
                    certifications, curriculum, and choreography (and eventual
                    marketplace).
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                  <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 text-[#00d4ff]">
                      Our Mission
                    </h3>
                    <div className="space-y-6">
                      <p className="text-gray-300">
                        Dance Realm Exchange is a collaborative platform that
                        brings together educators to exchange ideas, share
                        expertise, and shape the future of dance education.
                      </p>
                      <p className="text-gray-300">
                        Our mission through our collaborative platform is to
                        empower dance educators to unlock their potential,
                        inspire their students, and redefine excellence in dance
                        instruction.
                      </p>
                      <p className="text-gray-300">
                        We aim to spark innovation in dance education, provide
                        impactful learning opportunities, and inspire teachers
                        to pursue excellence in their teaching practices.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 text-[#00d4ff]">
                      Our Vision
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          Transforming Teaching, Inspiring Movement
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          Elevating Dance, One Educator at a Time
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          Discover. Exchange. Empower.
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          Redefining Excellence in Dance Instruction
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          A Platform for Visionary Dance Educators
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-[#00d4ff]">
                      About Dance Realm Exchange
                    </h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                    The Dance Realm Exchange platform and conference are
                    complementary manifestations of the same vision - creating a
                    collaborative, educational exchange for dance professionals.
                  </p>
                  <p className="text-gray-300">
                    Our online platform serves as the digital home for the dance
                    education community, while our conference brings this
                    vibrant community together in the physical realm. Both share
                    the same mission: to elevate dance education through
                    collaboration, innovation, and excellence.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Welcome Section for logged in users */}
          <section className="py-16 bg-white text-black">
            <div className="container mx-auto px-4 max-w-[95%]">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-black">
                  Welcome to DanceRealmX
                </h2>
                <p className="text-lg mb-8 text-gray-700">
                  We're dedicated to providing the highest quality resources for
                  dance educators and students. Explore our platform to discover
                  certification courses, connect with instructors, and access
                  premium curriculum resources.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 bg-gray-50 rounded-lg flex flex-col h-full">
                    <Award className="h-12 w-12 text-[#00d4ff] mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2 text-black">
                      Get Certified
                    </h3>
                    <p className="text-gray-700 mb-4 flex-grow">
                      Earn professional certifications recognized throughout the
                      dance community.
                    </p>
                    <Link href="/courses" className="mt-auto">
                      <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-5 py-2 font-medium w-full">
                        Explore Courses
                      </Button>
                    </Link>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-lg flex flex-col h-full">
                    <Users className="h-12 w-12 text-[#00d4ff] mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2 text-black">
                      Connect
                    </h3>
                    <p className="text-gray-700 mb-4 flex-grow">
                      Find qualified instructors or offer your services to
                      students looking for expertise.
                    </p>
                    <Link href="/connect" className="mt-auto">
                      <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-5 py-2 font-medium w-full">
                        Connect Now
                      </Button>
                    </Link>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-lg flex flex-col h-full">
                    <BookOpen className="h-12 w-12 text-[#00d4ff] mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2 text-black">
                      Curriculum
                    </h3>
                    <p className="text-gray-700 mb-4 flex-grow">
                      Access professionally designed curriculum resources for
                      all dance styles and levels.
                    </p>
                    <Link href="/curriculum" className="mt-auto">
                      <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-5 py-2 font-medium w-full">
                        Browse Resources
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action for logged in users */}
          <section className="py-16 bg-[#00d4ff]">
            <div className="container mx-auto px-4 text-center max-w-[95%]">
              <h2 className="text-3xl font-bold mb-6 text-black">
                Ready to elevate your dance education?
              </h2>
              <p className="text-lg mb-8 text-black max-w-3xl mx-auto">
                Explore all our premium features and resources designed to
                enhance your dance education journey.
              </p>
              <Link href="/curriculum">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-3 font-bold">
                  Browse Curriculum Resources
                </Button>
              </Link>
            </div>
          </section>
        </>
      ) : (
        // GUEST VERSION - Original landing page design
        <>
          {/* Hero Banner for guests */}
          <section
            className="relative h-screen flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: "url('/assets/images/bannerimage.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Background overlay */}
            <div className="absolute inset-0 w-full h-full z-0">
              <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            </div>

            {/* Hero content */}
            <div className="relative z-10 text-center px-4 max-w-6xl">
              <img
                src="/assets/images/Dance realm logo.png"
                alt="DanceRealmX Logo"
                className="max-w-[400px] h-auto mx-auto mb-8 filter brightness-150"
              />
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                Discover the Realm of Possibilities
              </h1>
              
              <div className="flex flex-wrap justify-center gap-4">
                {/* "Join Us" button removed as requested */}
               <Link href="/connect?tab=get-booked">
                  <Button className="bg-purple-600 text-white hover:bg-purple-700 rounded-full px-8 py-4 text-lg font-bold">
                    Get Booked
                  </Button>
                </Link>
                <Link href="/connect?tab=book">
                  <Button className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-4 text-lg font-bold">
                    Book a Professional
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Grid Section for guests */}
          <section
            className="py-20 text-white relative bg-cover bg-center"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url("/assets/images/certificationimage.png")',
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="container mx-auto px-4 max-w-[95%]">
              <h2 className="text-4xl font-bold mb-16 text-center">
                The Complete{" "}
                <span className="text-[#00d4ff]">Dance Education</span> Platform
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-24 h-24 bg-[#00d4ff] rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-12 w-12 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Curriculum</h3>
                  <p className="text-gray-300 mb-6">
                    Access premium dance curriculum resources for all styles and
                    age groups. Save time with professionally designed lesson
                    plans and teaching materials.
                  </p>
                  <Link href="/curriculum">
                    <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium">
                      Get Curriculum
                    </Button>
                  </Link>
                </div>

                <div className="text-center">
                  <div className="w-24 h-24 bg-[#00d4ff] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Connect</h3>
                  <p className="text-gray-300 mb-6">
                    Join a vibrant community of dance educators.
                    Find and hire professional instructors, choreographers and adjudicators or create a profile and get booked.
                  </p>
                  <Link href="/connect">
                    <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium">
                      Get Connected
                    </Button>
                  </Link>
                </div>
                 <div className="text-center">
                  <div className="w-24 h-24 bg-[#00d4ff] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Certification</h3>
                  <p className="text-gray-300 mb-6">
                    Earn industry-recognized dance certifications taught by
                    world-class instructors. Enhance your credentials and open
                    doors to new opportunities.
                  </p>
                  <Link href="/courses">
                    <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium">
                      Get Certified
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
          {/* Welcome to DanceRealmX Section */}
          <section
            className="py-16 text-white relative bg-cover bg-center"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), url("/assets/images/Dance realm logo.png")',
              backgroundPosition: "center",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="container mx-auto px-4 relative z-10 max-w-[95%]">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-4xl font-bold mb-6 text-center">
                  Welcome to <span className="text-[#00d4ff]">DanceRealmX</span>
                </h2>

                <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-[#00d4ff]">
                      Our Mission
                    </h3>
                    <p className="text-lg text-gray-300 mb-6">
                     The mission of Dance Realm Exchange is to spark innovation in dance education, provide impactful learning opportunities, and inspire dance professionals to pursue excellence in their craft. Through our collaborative platform, both online and in-person, we bring together educators to exchange ideas, share expertise, and shape the future of dance.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src="/assets/images/welcome-image.png"
                      alt="DanceRealmX Banner"
                      className="rounded-lg shadow-xl max-w-full h-auto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1  gap-8 mb-10">
                  <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 text-[#00d4ff]">
                      Our Vision
                    </h3>
                    <div className="space-y-4">
                      

                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          Elevating Dance, One Educator at a Time
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          Discover. Exchange. Empower.
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700 rounded-md flex items-start">
                        <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-gray-900" />
                        </div>
                        <p className="text-white">
                          Redefining Excellence in Dance Instruction
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

    {/* What is DanceRealmX Section */}
          <section className="py-16 bg-gradient-to-b from-gray-800 via-gray-700 to-black text-white relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-[95%]">
              <div className="mx-auto">
                <h2 className="text-4xl font-bold mb-6 text-center">
                  What is{" "}
                  <span className="text-[#00d4ff]">Dance Realm Exchange</span>?
                </h2>

                <div className="mb-12 text-center">
      
                  <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto ">
                    Dance Realm Exchange is a dynamic platform designed to empower dance educators by fostering collaboration, innovation, and growth. We aim to redefine what's possible in the world of dance.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Featured Images Slider for guests */}
          {/*  <section className="py-16 bg-gray-900">
            <div className="container mx-auto px-4 max-w-[95%]">*/}
             {/* <h2 className="text-4xl font-bold mb-8 text-white text-center">
                Curriculum Search and Download Resources for all Ages and Styles of Dance
              </h2>*/}
              {featuredImagesLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <FeaturedImagesSlider images={featuredResources} />
              )} {/* 
            </div>
          </section>*/}


{/* Connection Section */}
<section className="py-20 bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white">
  <div className="container mx-auto px-4 max-w-[90%]">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div className="order-2 md:order-1">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#00d4ff]">
          Connect & Book Professionals
        </h2>
        <ul className="mb-6 space-y-3 text-lg">
          <li className="flex items-center">
            <CheckCircle className="h-6 w-6 text-[#00d4ff] mr-2" />
            Find and hire instructors, choreographers, and adjudicators
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-6 w-6 text-[#00d4ff] mr-2" />
            Create a professional profile and get booked
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-6 w-6 text-[#00d4ff] mr-2" />
            Grow your network in the dance community
          </li>
        </ul>
        <div className="flex flex-wrap gap-4">
          <Link href="/connect?tab=get-booked">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium">
              Get Booked
            </Button>
          </Link>
          <Link href="/connect?tab=book">
            <Button className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full px-6 py-3 font-medium">
              Book a Professional
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex justify-center order-1 md:order-2">
        <img
          src="/assets/images/certificationimage.png"
          alt="Connect and Book Professionals"
          className="rounded-2xl shadow-2xl max-w-[90%] md:max-w-[70%] h-auto"
        />
      </div>
    </div>
  </div>
</section>

{/* Certification Section */}
<section className="py-20 bg-gradient-to-l from-gray-900 via-black to-gray-900 text-white">
  <div className="container mx-auto px-4 max-w-[90%]">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div className="flex justify-center">
        <img
          src="/assets/images/Thrive-logo.webp"
          alt="Certification Image"
          className="rounded-2xl shadow-2xl max-w-[90%] md:max-w-[70%] h-auto border-4 border-[#00d4ff]/20"
        />
      </div>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#00d4ff]">
          Get Certified
        </h2>
        <p className="text-lg text-gray-300 mb-6">
          Take online courses and earn industry-recognized certifications taught by world-class dance educators. Boost your credentials and unlock new opportunities in your dance career.
        </p>
        <ul className="mb-6 space-y-3 text-lg">
          <li className="flex items-center">
            <CheckCircle className="h-6 w-6 text-[#00d4ff] mr-2" />
            Flexible, self-paced online learning
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-6 w-6 text-[#00d4ff] mr-2" />
            Learn from top industry professionals
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-6 w-6 text-[#00d4ff] mr-2" />
            Certificates to showcase your expertise
          </li>
        </ul>
        <Link href="/courses">
          <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium">
            Explore Certifications
          </Button>
        </Link>
      </div>
    </div>
  </div>
</section>

          {/* Membership Plans Section */}
          <section className="py-20 bg-black">
  <div className="container mx-auto px-4 max-w-[80%]">
    <h2 className="text-4xl font-bold mb-4 text-center text-white">
      Plans & Pricing
    </h2>
    <p className="text-xl text-gray-300 mb-10 text-center max-w-3xl mx-auto">
      Browse Dance Professionals, Certifications, and Purchase Curriculum with a free membership
    </p>
    <h3 className="text-2xl font-bold mb-8 text-center text-white">
      Which Plan is Right for Me?
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="bg-gray-900 text-white text-lg font-bold py-4 px-2 rounded-tl-xl"></th>
            <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6">Free</th>
            <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6">Nobility<br /><span className="text-[#00d4ff] text-base font-semibold">$9.99/mo</span></th>
            <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6">Royalty<br /><span className="text-[#00d4ff] text-base font-semibold">$19.99/mo</span></th>
            <th className="bg-gray-900 text-white text-lg font-bold py-4 px-6 rounded-tr-xl">Imperial<br /><span className="text-[#00d4ff] text-base font-semibold">$29.99/mo</span></th>
          </tr>
        </thead>
        <tbody className="text-gray-200 text-base">
          {/* Feature: Purchase Curriculum */}
          <tr className="bg-gray-900">
            <td className="py-4 px-2 font-semibold">Purchase Curriculum</td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
          </tr>
          {/* Feature: Search Dance Professionals */}
          <tr className="bg-gray-800">
            <td className="py-4 px-2 font-semibold">Search Dance Professionals</td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
          </tr>
          {/* Feature: Take a Certification Course */}
          <tr className="bg-gray-900">
            <td className="py-4 px-2 font-semibold">Take a Certification Course</td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
          </tr>
          {/* Feature: Be Booked as a Dance Professional */}
          <tr className="bg-gray-800">
            <td className="py-4 px-2 font-semibold">Be Booked as a Dance Professional</td>
            <td className="text-center text-gray-500">—</td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
          </tr>
          {/* Feature: Sell Curriculum */}
          <tr className="bg-gray-900">
            <td className="py-4 px-2 font-semibold">Sell Curriculum</td>
            <td className="text-center text-gray-500">—</td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
          </tr>
          {/* Feature: Contact and Book Dance Professionals */}
          <tr className="bg-gray-800">
            <td className="py-4 px-2 font-semibold">Contact and Book Dance Professionals</td>
            <td className="text-center text-gray-500">—</td>
            <td className="text-center text-gray-500">—</td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
          </tr>
          {/* Feature: Be Featured as a Premium Seller */}
          <tr className="bg-gray-900">
            <td className="py-4 px-2 font-semibold">Be Featured as a Premium Seller</td>
            <td className="text-center text-gray-500">—</td>
            <td className="text-center text-gray-500">—</td>
            <td className="text-center text-gray-500">—</td>
            <td className="text-center"><CheckCircle className="inline h-6 w-6 text-[#00d4ff]" /></td>
          </tr>
         
        </tbody>
      </table>
      {/* a button that says COMPARE PLANS - this button will take them to the plans and pricing page */}
      <div className="mt-8 text-center">
        <Link href="/subscription">
          <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-8 py-3 font-bold">
            Compare Plans
          </Button>
        </Link>
      </div>
    </div>
  </div>
</section>

          {/* Call to Action for guests */}
          <section className="py-20 bg-[#00d4ff]">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold mb-6 text-black">
                Ready to Step into the Realm?
              </h2>
              <p className="text-xl mb-10 text-black max-w-3xl mx-auto">
                Join thousands of dance educators and students who are
                transforming their approach to teaching and learning through
                DanceRealmX.
              </p>
              <Link href="/register">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-4 text-lg font-bold">
                  Join DanceRealmX Today
                </Button>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
