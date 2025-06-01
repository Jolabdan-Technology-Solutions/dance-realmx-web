import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Certificate, Course } from "@shared/schema";
import { Loader2, ArrowLeft, Download, ExternalLink, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CertificatePage() {
  const { certificateId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: certificate, isLoading: isLoadingCertificate } = useQuery<Certificate>({
    queryKey: [`/api/certificates/${certificateId}`],
    enabled: !!certificateId,
  });

  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${certificate?.courseId}`],
    enabled: !!certificate?.courseId,
  });

  const isLoading = isLoadingCertificate || isLoadingCourse;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!certificate || !course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Certificate Not Found</h1>
        <p className="mb-8">The certificate you're looking for doesn't exist or you don't have access to it.</p>
        <Link href="/my-certifications">
          <Button>Go Back to My Certifications</Button>
        </Link>
      </div>
    );
  }

  const handleDownloadCertificate = () => {
    // Logic to download certificate
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, "_blank");
    } else {
      toast({
        title: "Download not available",
        description: "Certificate PDF is not available for download at the moment.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyCertificate = () => {
    // Logic to verify certificate
    if (certificate.verificationUrl) {
      window.open(certificate.verificationUrl, "_blank");
    } else {
      toast({
        title: "Verification not available",
        description: "Certificate verification is not available at the moment.",
        variant: "destructive",
      });
    }
  };

  // Format the date
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Navigation */}
      <div className="mb-8">
        <Link href="/my-certifications">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Certifications
          </Button>
        </Link>
      </div>

      {/* Certificate header */}
      <div className="mb-8 text-center">
        <Award className="h-16 w-16 mx-auto mb-4 text-[#00d4ff]" />
        <h1 className="text-3xl font-bold mb-2">Certificate of Completion</h1>
        <p className="text-gray-600">For {course.title}</p>
      </div>

      {/* Certificate display */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-4 border-gray-200 relative overflow-hidden mb-8">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00d4ff] to-blue-600"></div>
          <div className="absolute top-2 right-2">
            <img 
              src="/assets/images/logo.png" 
              alt="DanceRealmX Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          
          <CardContent className="pt-16 pb-12 px-12 text-center">
            <div className="mb-8">
              <h2 className="text-xl text-gray-600 mb-2">This certifies that</h2>
              <p className="text-3xl font-serif mb-2">{user?.firstName} {user?.lastName}</p>
              <div className="w-48 h-0.5 bg-gray-300 mx-auto mb-2"></div>
            </div>
            
            <div className="mb-8">
              <p className="text-lg">has successfully completed the course</p>
              <h3 className="text-2xl font-bold my-4">{course.title}</h3>
              <p>on <span className="font-semibold">{issuedDate}</span></p>
            </div>
            
            <div className="flex justify-center space-x-8 mt-8">
              <div className="text-center">
                <div className="border-t border-gray-300 w-48 pt-2">
                  <p className="font-semibold">DanceRealmX</p>
                  <p className="text-sm text-gray-600">Certifying Authority</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="border-t border-gray-300 w-48 pt-2">
                  <p className="font-semibold">Certificate ID</p>
                  <p className="text-sm text-gray-600">{certificate.certificateId}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Button 
            onClick={handleDownloadCertificate}
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
          
          <Button 
            onClick={handleVerifyCertificate}
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Verify Certificate
          </Button>
        </div>
      </div>
    </div>
  );
}