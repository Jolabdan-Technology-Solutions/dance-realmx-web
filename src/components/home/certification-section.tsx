import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AuthWrapper } from "@/lib/auth-wrapper";
import { useAuth } from "@/hooks/use-auth";

// Component with auth context
function CertificationWithAuth() {
  const { user } = useAuth();
  
  return (
    <p className="text-lg mt-2">
      Structured training and professional credentials to enhance your dance expertise and career.
      <Link href={user ? "/dashboard" : "/auth"} className="text-[#00d4ff] hover:underline ml-1">
        Sign in
      </Link> to your dashboard.
    </p>
  );
}

// Fallback for when auth context is not available
function CertificationWithoutAuth() {
  return (
    <p className="text-lg mt-2">
      Structured training and professional credentials to enhance your dance expertise and career.
      <Link href="/auth" className="text-[#00d4ff] hover:underline ml-1">
        Sign in
      </Link> to your dashboard.
    </p>
  );
}

export default function CertificationSection() {
  return (
    <section className="py-16 bg-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold">Dance Realm Exchange Certification Program</h2>
          <AuthWrapper fallback={<CertificationWithoutAuth />}>
            <CertificationWithAuth />
          </AuthWrapper>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-8 lg:mb-0 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1504609813442-a9c288a5f868?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=500&q=80" 
              alt="Certification Program" 
              className="rounded-lg max-h-[500px] object-contain"
            />
          </div>
          <div className="lg:w-1/2 lg:pl-10">
            <h3 className="text-2xl font-bold mb-6">Want to Get Dance Certified?</h3>
            <p className="text-lg mb-6">
              Our comprehensive certification program empowers dance educators with industry-recognized credentials. Join thousands of professionals who have enhanced their career through our structured, expert-led certification pathways.
            </p>
            <Button 
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full font-bold" 
              asChild
            >
              <Link href="/courses">Explore Certification</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
