import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import ResourceDetails from "@/components/curriculum/resource-details";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import CurriculumInfoPage from "./curriculumInfo-page";

const CurriculumDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading } = useAuth();
  const resourceId = parseInt(id || "0");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-4">
        <Link href="/curriculum">
          <Button variant="ghost" size="sm">
            ← Back to Curriculum
          </Button>
        </Link>
      </div>

      {resourceId > 0 ? (
        <CurriculumInfoPage resourceId={resourceId} />
      ) : (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Resource Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The curriculum resource you are looking for does not exist or has
            been removed.
          </p>
          <Link href="/curriculum">
            <Button>Browse Curriculum Resources</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CurriculumDetailsPage;
