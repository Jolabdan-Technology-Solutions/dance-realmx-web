import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <main className="bg-black text-white">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4 max-w-[95%]">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">About DanceRealmX</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Welcome to DanceRealmX, the premier platform empowering dance educators and professionals with the tools, resources, and community they need to excel.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose DanceRealmX Section - Moved from home page */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-[95%]">
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-md">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-white">Why Choose DanceRealmX?</h2>
                <p className="text-gray-300 mb-6 text-lg">
                  Our platform offers comprehensive solutions for dance education professionals and students alike, helping you achieve your goals through certification, collaboration, and resources.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Access to a vibrant community of dance professionals</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Industry-recognized certification programs</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Premium curriculum resources created by experts</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#00d4ff] rounded-full p-1 mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-300">Connect with students and other dance professionals</p>
                  </div>
                </div>
                <div className="mt-8">
                  <Link href="/courses">
                    <Button 
                      className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium"
                    >
                      View Certification Courses <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/assets/images/certificationimage.png" 
                  alt="Dance Certification" 
                  className="rounded-lg shadow-lg max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 max-w-[95%]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Mission</h2>
            <div className="w-20 h-1 bg-[#00d4ff] mx-auto"></div>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-gray-300 mb-6">
              At DanceRealmX, our mission is to empower dance educators with the tools, resources, and community they need to excel in their craft and share their passion for dance with the world.
            </p>
            <p className="text-xl text-gray-300">
              We strive to elevate dance education by providing a platform that connects, certifies, and supports professionals at every stage of their career.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 max-w-[95%]">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Ready to Join Our Community?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Discover the benefits of our platform and take your dance education career to the next level.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/courses">
                <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full px-6 py-3 font-medium">
                  Explore Certification
                </Button>
              </Link>
              <Link href="/resources">
                <Button className="bg-transparent border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 rounded-full px-6 py-3 font-medium">
                  Browse Curriculum
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}