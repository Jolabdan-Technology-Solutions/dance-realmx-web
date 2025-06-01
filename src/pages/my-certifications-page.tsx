import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Certificate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MyCertificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Certifications</h1>

      {certificates.length === 0 ? (
        <div className="text-center py-16 bg-gray-100 rounded-lg">
          <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">No Certifications Yet</h2>
          <p className="text-gray-600 mb-6">
            Complete courses to earn your certifications.
          </p>
          <Link href="/courses">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              Explore Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Award className="h-10 w-10 text-[#00d4ff]" />
                  <span className="text-sm bg-green-100 text-green-800 rounded-full px-3 py-1">
                    Verified
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Certificate #{certificate.certificateId}
                </h3>
                <p className="text-gray-600 mb-4">
                  Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
                </p>
                <div className="flex space-x-3">
                  <Link href={`/certificates/${certificate.certificateId}`}>
                    <Button variant="outline" className="flex-1">
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(certificate.pdfUrl, "_blank")}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}