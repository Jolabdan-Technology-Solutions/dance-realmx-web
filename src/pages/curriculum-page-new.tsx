import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Package, Plus, Loader2, User, Award, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { API_ENDPOINTS, DEFAULT_RESOURCE_IMAGE } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CachedImage } from "@/components/ui/cached-image";

// Simple curriculum page that focuses on directly fetching and displaying resources
export default function CurriculumPageNew() {
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use try-catch to handle the case when AuthContext is not available
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Auth context not available, user will be null
    console.log("Auth context not available");
  }

  // Directly fetch resources with fetch API to bypass any type issues
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        // Use the API_ENDPOINTS from constants
        const resourceEndpoint = API_ENDPOINTS.RESOURCES.BASE;
        console.log("Fetching resources from:", resourceEndpoint);
        const response = await fetch(resourceEndpoint);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Resources loaded:", data);
        
        if (data && Array.isArray(data)) {
          // Process the resources to ensure all required fields have fallbacks
          const processedResources = await Promise.all(data.map(async resource => {
            // For each resource, fetch the seller information
            let sellerName = "Anonymous Instructor";
            let sellerProfileImageUrl = null;
            let averageRating = 0;
            let reviewCount = 0;
            
            // Only fetch seller data if we have a valid sellerId
            if (resource.sellerId) {
              try {
                const sellerResponse = await fetch(`/api/users/${resource.sellerId}`);
                if (sellerResponse.ok) {
                  const sellerData = await sellerResponse.json();
                  sellerName = sellerData.username || 
                              `${sellerData.firstName || ''} ${sellerData.lastName || ''}`.trim() || 
                              "Anonymous Instructor";
                  sellerProfileImageUrl = sellerData.profileImageUrl;
                }
                
                // Try to fetch ratings for this resource
                const reviewsResponse = await fetch(`/api/curriculum/${resource.id}/reviews`);
                if (reviewsResponse.ok) {
                  const reviewsData = await reviewsResponse.json();
                  if (Array.isArray(reviewsData) && reviewsData.length > 0) {
                    // Calculate average rating
                    const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
                    averageRating = totalRating / reviewsData.length;
                    reviewCount = reviewsData.length;
                  }
                }
              } catch (err) {
                console.warn("Error fetching seller or review data:", err);
                // Continue with default values
              }
            }
            
            return {
              id: resource.id || 0,
              title: resource.title || "Untitled Resource",
              description: resource.description || "",
              price: resource.price || "0",
              fileType: resource.fileType || "pdf",
              imageUrl: resource.imageUrl || resource.fileUrl || resource.thumbnailUrl || DEFAULT_RESOURCE_IMAGE,
              downloadCount: resource.downloadCount || 0,
              status: resource.status || "active",
              sellerId: resource.sellerId || 1,
              sellerName, 
              sellerProfileImageUrl,
              averageRating,
              reviewCount,
              ...resource
            };
          }));
          
          setResources(processedResources);
          
          toast({
            title: "Resources loaded",
            description: `Found ${processedResources.length} curriculum resources.`,
            variant: "default"
          });
        } else {
          throw new Error("Invalid data format for resources");
        }
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        toast({
          title: "Error loading resources",
          description: "There was a problem loading curriculum resources. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-16 bg-gray-100 rounded-lg">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">Error Loading Resources</h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-16 bg-gray-100 rounded-lg">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">No Resources Found</h2>
          <p className="text-gray-600 mb-6">
            No curriculum resources are currently available. Please check back later.
          </p>
          {user && (
            <Link href="/curriculum/upload">
              <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                <Plus className="mr-2 h-4 w-4" />
                Upload Resource
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Dance Curriculum Resources</h1>
        <p className="text-gray-600 text-xl max-w-3xl mx-auto">
          Browse our collection of high-quality resources to enhance your dance teaching and practice.
        </p>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end mb-8">
        {user && (
          <Link href="/curriculum/upload">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </Link>
        )}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Card key={resource.id} className="overflow-hidden flex flex-col">
            <div className="h-40 overflow-hidden bg-gray-100 flex items-center justify-center">
              <CachedImage
                src={resource.imageUrl || resource.fileUrl || resource.thumbnailUrl || DEFAULT_RESOURCE_IMAGE}
                alt={resource.title}
                className="w-full h-full"
                imgClassName="w-full h-full object-cover transition-transform hover:scale-105"
                contentType="resource"
                fallback={
                  <div className="h-40 w-full flex items-center justify-center bg-gray-100">
                    <Package className="h-6 w-6 text-gray-500" />
                  </div>
                }
              />
            </div>
            <CardHeader>
              <CardTitle className="text-xl line-clamp-1">{resource.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {resource.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2">
                {/* Resource metrics */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{resource.downloadCount || 0} downloads</span>
                  
                  {/* Verified Professional badge */}
                  <div className="flex items-center">
                    <Award className="h-4 w-4 text-blue-400 mr-1" />
                    <span className="text-xs text-gray-500">Verified Professional</span>
                  </div>
                </div>
                
                {/* Seller info with thumbnail */}
                <div className="flex items-center mt-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
                    <CachedImage
                      src={resource.sellerProfileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(resource.sellerName || 'Instructor')}&background=00d4ff&color=fff`}
                      alt={resource.sellerName || 'Instructor'}
                      className="w-full h-full"
                      contentType="resource"
                      imgClassName="w-full h-full object-cover"
                      fallback={
                        <div className="w-5 h-5 bg-gray-200 flex items-center justify-center rounded-full">
                          <User className="h-3 w-3 text-gray-500" />
                        </div>
                      }
                    />
                  </div>
                  <span className="text-xs text-gray-600 truncate">
                    {resource.sellerName || 'Anonymous Instructor'}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="font-bold text-xl">
                {Number(resource.price) === 0 
                  ? <span className="text-green-600">Free</span> 
                  : <span>${Number(resource.price).toFixed(2)}</span>
                }
              </div>
              <Link href={`/curriculum/${resource.id}`}>
                <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                  View Details
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}