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
                className="h-28 mx-auto mb-8 filter brightness-150"
              />
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                Discover the Realm of Possibilities
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto">
                Join DanceRealmX to elevate your dance education with
                certification, curriculum, and connections.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {/* "Join Us" button removed as requested */}
                <Link href="/register">
                  <Button className="bg-purple-600 text-white hover:bg-purple-700 rounded-full px-8 py-4 text-lg font-bold">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-4 text-lg font-bold">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Scroll down indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
              <ChevronDown className="h-10 w-10 text-white" />
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
                    <p className="text-lg text-gray-300 mb-6">
                      DanceRealmX is a dynamic online platform created to
                      empower dance educators with the resources, training, and
                      community support needed to excel in their profession. Our
                      platform aims to create a comprehensive ecosystem for
                      dance educators to learn, share, connect, and grow.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src="/assets/images/bannerimgdre.png"
                      alt="DanceRealmX Banner"
                      className="rounded-lg shadow-xl max-w-full h-auto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-md">
                    <h3 className="text-xl font-bold mb-3 text-white flex items-center">
                      <span className="w-8 h-8 bg-[#00d4ff] rounded-full flex items-center justify-center text-black font-bold mr-2">
                        1
                      </span>
                      Connect
                    </h3>
                    <p className="text-gray-300">
                      Join a vibrant community of dance professionals sharing
                      knowledge, techniques, and resources to enhance teaching
                      practices.
                    </p>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-md">
                    <h3 className="text-xl font-bold mb-3 text-white flex items-center">
                      <span className="w-8 h-8 bg-[#00d4ff] rounded-full flex items-center justify-center text-black font-bold mr-2">
                        2
                      </span>
                      Certification
                    </h3>
                    <p className="text-gray-300">
                      Earn industry-recognized credentials through our
                      comprehensive certification programs designed by leading
                      dance professionals.
                    </p>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-md">
                    <h3 className="text-xl font-bold mb-3 text-white flex items-center">
                      <span className="w-8 h-8 bg-[#00d4ff] rounded-full flex items-center justify-center text-black font-bold mr-2">
                        3
                      </span>
                      Curriculum
                    </h3>
                    <p className="text-gray-300">
                      Access premium, ready-to-use curriculum resources that
                      save time and elevate your dance instruction to new
                      heights.
                    </p>
                  </div>
                </div>

                {/* "Why Choose DanceRealmX" section moved to About page */}
              </div>
            </div>
          </section>

          {/* Mission & Vision Section */}
          <section className="py-16 bg-gray-900 text-white">
            <div className="container mx-auto px-4 max-w-[95%]">
              <div className="mx-auto">
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

          {/* Featured Images Slider for guests */}
          <section className="py-16 bg-gray-900">
            <div className="container mx-auto px-4 max-w-[95%]">
              <h2 className="text-4xl font-bold mb-8 text-white text-center">
                Featured Curriculum
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
                    Join a vibrant community of dance educators and students.
                    Find qualified instructors or offer your expertise to those
                    seeking guidance.
                  </p>
                  <Link href="/connect">
                    <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium">
                      Get Connected
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-20 bg-black text-white">
            <div className="container mx-auto px-4 max-w-[95%]">
              <h2 className="text-4xl font-bold mb-6 text-center">
                What Educators{" "}
                <span className="text-[#00d4ff]">Say About Us</span>
              </h2>
              <p className="text-lg text-gray-300 mb-10 text-center max-w-3xl mx-auto">
                Read what our community is saying about our courses and
                resources. Have you used our curriculum resources or taken a
                certification course? Share your experience below!
              </p>

              <div className="mb-16">
                <div className="flex justify-center mb-8">
                  <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
                    <button
                      className={`px-4 py-2 ${activeTestimonialTab === "all" ? "bg-[#00d4ff] text-black font-medium" : "bg-transparent text-white"}`}
                      onClick={() => setActiveTestimonialTab("all")}
                    >
                      All Testimonials
                    </button>
                    <button
                      className={`px-4 py-2 ${activeTestimonialTab === "courses" ? "bg-[#00d4ff] text-black font-medium" : "bg-transparent text-white"}`}
                      onClick={() => setActiveTestimonialTab("courses")}
                    >
                      Course Reviews
                    </button>
                    <button
                      className={`px-4 py-2 ${activeTestimonialTab === "resources" ? "bg-[#00d4ff] text-black font-medium" : "bg-transparent text-white"}`}
                      onClick={() => setActiveTestimonialTab("resources")}
                    >
                      Resource Reviews
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {isTestimonialsLoading ? (
                    <div className="col-span-3 flex justify-center py-10">
                      <Loader2 className="h-10 w-10 animate-spin text-[#00d4ff]" />
                    </div>
                  ) : displayedTestimonials.length === 0 ? (
                    <div className="col-span-3 text-center py-10 bg-gray-900 rounded-lg border border-gray-800">
                      <p className="text-gray-300 mb-4">
                        No testimonials available yet. Be the first to share
                        your experience!
                      </p>
                      {isLoggedIn && (
                        <Button
                          onClick={() => openTestimonialModal("general")}
                          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                        >
                          <MessageSquarePlus className="h-4 w-4 mr-2" />
                          Add Testimonial
                        </Button>
                      )}
                    </div>
                  ) : (
                    displayedTestimonials.map(
                      (testimonial: Testimonial, index: number) => (
                        <div
                          key={testimonial.id || index}
                          className="bg-gray-900 p-8 rounded-lg shadow-md border border-gray-800 relative"
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 rounded-full overflow-hidden border-4 border-black w-16 h-16">
                            <img
                              src={
                                testimonial.userImage ||
                                "/assets/images/default-avatar.png"
                              }
                              alt={testimonial.userName || "User"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback for missing image
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.backgroundColor = "#00d4ff";
                              }}
                            />
                          </div>
                          <div className="pt-6 text-center">
                            {testimonial.resourceType && (
                              <div className="mb-2">
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    testimonial.resourceType === "course"
                                      ? "bg-purple-700 text-white"
                                      : "bg-emerald-700 text-white"
                                  }`}
                                >
                                  {testimonial.resourceType === "course"
                                    ? "Course"
                                    : "Resource"}
                                </span>
                                {testimonial.resourceName && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    {testimonial.resourceName}
                                  </span>
                                )}
                              </div>
                            )}
                            {testimonial.isVerifiedProfessional && (
                              <div className="flex justify-center mb-2">
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                  <span className="text-green-500 font-medium text-sm">
                                    Verified Professional
                                  </span>
                                </div>
                              </div>
                            )}
                            <p className="text-gray-300 italic mb-4">
                              "{testimonial.text}"
                            </p>
                            <p className="font-bold text-white">
                              {testimonial.userName || "Anonymous User"}
                            </p>
                            <p className="text-sm text-gray-400">
                              {testimonial.userTitle || "DanceRealmX Member"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {testimonial.createdAt
                                ? new Date(
                                    testimonial.createdAt
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "Recent"}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>

                {/* Add Testimonial Button - Shows modal for authenticated users or redirects to login */}
                <div className="text-center">
                  <Button
                    onClick={handleAddTestimonial}
                    className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-2 font-medium"
                  >
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Share Your Experience
                  </Button>
                </div>
              </div>

              {/* Testimonial Modal */}
              <Dialog
                open={testimonialModalOpen}
                onOpenChange={setTestimonialModalOpen}
              >
                <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">
                      Share Your Experience
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Let the community know about your experience with our
                      courses or resources.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="review-type">
                        What are you reviewing?
                      </Label>
                      <Select value={reviewType} onValueChange={setReviewType}>
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select what you're reviewing" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="general">
                            General Experience
                          </SelectItem>
                          <SelectItem value="course">
                            Certification Course
                          </SelectItem>
                          <SelectItem value="resource">
                            Curriculum Resource
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(reviewType === "course" || reviewType === "resource") && (
                      <div className="space-y-2">
                        <Label htmlFor="resource-name">
                          {reviewType === "course"
                            ? "Course Name"
                            : "Resource Name"}
                        </Label>
                        <Input
                          id="resource-name"
                          value={resourceName}
                          onChange={(e) => setResourceName(e.target.value)}
                          className="bg-gray-800 border-gray-700"
                          placeholder={
                            reviewType === "course"
                              ? "Enter course name"
                              : "Enter resource name"
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="verified-professional"
                          checked={verified}
                          onCheckedChange={(checked) =>
                            setVerified(checked === true)
                          }
                        />
                        <Label
                          htmlFor="verified-professional"
                          className="cursor-pointer"
                        >
                          I am a verified dance professional
                        </Label>
                      </div>
                      <p className="text-xs text-gray-400">
                        Check this box if you are a certified instructor or
                        professional in the dance field.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="testimonial-text">Your Review</Label>
                      <Textarea
                        id="testimonial-text"
                        value={testimonialText}
                        onChange={(e) => setTestimonialText(e.target.value)}
                        className="bg-gray-800 border-gray-700 min-h-[100px]"
                        placeholder="Share your experience with the DanceRealmX community..."
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTestimonialModalOpen(false)}
                      className="border-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitTestimonial}
                      className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                      disabled={submitTestimonialMutation.isPending}
                    >
                      {submitTestimonialMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          {/* Membership Plans Section */}
          <section className="py-20 bg-black">
            <div className="container mx-auto px-4 max-w-[95%]">
              <h2 className="text-4xl font-bold mb-4 text-center text-white">
                Membership Plans
              </h2>
              <p className="text-xl text-gray-300 mb-10 text-center max-w-3xl mx-auto">
                Choose the membership level that best fits your needs. Unlock
                premium features and resources.
              </p>

              {/* Seller Plans */}
              <div className="mb-16">
                <h3 className="text-2xl font-bold mb-8 text-center text-white">
                  For Curriculum Sellers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Basic Seller Plan */}
                  <div className="border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gray-900">
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">
                        Basic Seller
                      </h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $25
                        </span>
                        <span className="text-gray-400"> one-time fee</span>
                      </div>
                      <Link href="/checkout/stripe?plan=seller_basic">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Account and store set up</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>55% profit on all sales</span>
                        </li>
                        <li className="flex items-center text-gray-500">
                          <XCircle className="h-5 w-5 text-gray-600 mr-2" />
                          <span>Premium marketing features</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Premium Seller Plan */}
                  <div className="border-2 border-[#00d4ff] rounded-xl overflow-hidden shadow-2xl relative bg-gray-900">
                    <div className="absolute top-0 right-0 bg-[#00d4ff] text-black font-bold px-4 py-1 rounded-bl-lg">
                      Recommended
                    </div>
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">
                        Premium Seller
                      </h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $50
                        </span>
                        <span className="text-gray-400">/year</span>
                      </div>
                      <Link href="/checkout/stripe?plan=seller_premium">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Account and store set up</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>75% profit on all sales</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>
                            Premium marketing on website & social media
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Directory Plans */}
              <div className="mb-16">
                <h3 className="text-2xl font-bold mb-8 text-center text-white">
                  Professional Directory Listings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Basic Directory Plan */}
                  <div className="border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gray-900">
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">
                        Basic Directory
                      </h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $24.99
                        </span>
                        <span className="text-gray-400">/year</span>
                      </div>
                      <Link href="/checkout/stripe?plan=directory_basic">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Includes yearly background check</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Profile listing</span>
                        </li>
                        <li className="flex items-center text-gray-500">
                          <XCircle className="h-5 w-5 text-gray-600 mr-2" />
                          <span>Premium marketing features</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Premium Directory Plan */}
                  <div className="border-2 border-[#00d4ff] rounded-xl overflow-hidden shadow-2xl relative bg-gray-900">
                    <div className="absolute top-0 right-0 bg-[#00d4ff] text-black font-bold px-4 py-1 rounded-bl-lg">
                      Featured
                    </div>
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">
                        Premium Directory
                      </h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $7.99
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <Link href="/checkout/stripe?plan=directory_premium">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Yearly background check</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Profile listing</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Premium marketing features</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Directory Access Plans */}
              <div className="mb-16">
                <h3 className="text-2xl font-bold mb-8 text-center text-white">
                  Talent Directory Membership Access
                </h3>
                <p className="text-gray-300 text-center mb-8 max-w-3xl mx-auto">
                  Dance Realm Exchange requires a membership in order to
                  directly contact professional dance educators on our Talent
                  Search Directory.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {/* Annual Plan */}
                  <div className="border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gray-900">
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">Annual</h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $4.99
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <Link href="/checkout/stripe?plan=access_annual">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Access to professional directory</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Direct messaging with professionals</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Best value long-term</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Quarterly Plan */}
                  <div className="border-2 border-[#00d4ff] rounded-xl overflow-hidden shadow-2xl relative bg-gray-900">
                    <div className="absolute top-0 right-0 bg-[#00d4ff] text-black font-bold px-4 py-1 rounded-bl-lg">
                      Popular
                    </div>
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">
                        Quarterly
                      </h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $9.99
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <Link href="/checkout/stripe?plan=access_quarterly">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Access to professional directory</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Direct messaging with professionals</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Flexible quarterly commitment</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Monthly Plan */}
                  <div className="border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gray-900">
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">Monthly</h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $19.99
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <Link href="/checkout/stripe?plan=access_monthly">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Access to professional directory</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Direct messaging with professionals</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>No long-term commitment</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Royalty All-In-One Plan */}
              <div>
                <h3 className="text-2xl font-bold mb-8 text-center text-white">
                  All-In-One Solution
                </h3>
                <div className="max-w-md mx-auto">
                  <div className="border-2 border-[#00d4ff] rounded-xl overflow-hidden shadow-2xl relative bg-gray-900">
                    <div className="absolute top-0 right-0 bg-[#00d4ff] text-black font-bold px-4 py-1 rounded-bl-lg">
                      Best Value
                    </div>
                    <div className="p-6 bg-gray-900 border-b border-gray-800">
                      <h3 className="text-2xl font-bold text-white">
                        Royalty Membership
                      </h3>
                      <div className="mt-4 mb-6">
                        <span className="text-4xl font-bold text-white">
                          $99.99
                        </span>
                        <span className="text-gray-400">/year</span>
                      </div>
                      <Link href="/checkout/stripe?plan=royalty">
                        <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full py-2 font-medium">
                          Subscribe
                        </Button>
                      </Link>
                    </div>
                    <div className="p-6 text-gray-300">
                      <p className="font-bold mb-4 text-xl text-center text-[#00d4ff]">
                        Includes Everything:
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Premium Seller Membership</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Premium Directory Membership</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Talent Directory Annual Access</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>
                            Save over 40% compared to individual plans
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
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
