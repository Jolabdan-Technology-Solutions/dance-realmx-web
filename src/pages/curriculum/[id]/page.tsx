import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Download,
  Award,
  ThumbsUp,
  User,
  FileText,
  Edit,
  Heart,
  Share2,
  BookmarkPlus,
  Bookmark,
  PlayCircle,
  Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// import PurchaseButton from "./purchase-button";
import { Resource, ResourceReview, User as UserType } from "@shared/schema";
import { SUBSCRIPTION_PLANS } from "@/shared/schema";
import { CachedImage } from "@/components/ui/cached-image";
import { DEFAULT_RESOURCE_IMAGE } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { convertToYouTubeEmbedUrl } from "@/lib/utils";
import { VideoPreviewModal } from "@/components/curriculum/video-preview-modal";

// Helper function to format dates in a consistent way
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface ResourceDetailsProps {
  resourceId: number;
}

const ResourceDetails = ({ resourceId }: ResourceDetailsProps) => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  // Fetch resource details
  const { data: resource, isLoading: isLoadingResource } = useQuery({
    queryKey: ["/api/curriculum", resourceId],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(
        `https://api.livetestdomain.com/api/resources/${id}`
      );
      if (!response.ok) throw new Error("Failed to fetch resource");
      const data = await response.json();
      console.log("Query data from /api/resources/" + resourceId + ":", data);
      return data;
    },
  });

  // Generate share URL
  useEffect(() => {
    if (resource) {
      setShareUrl(`${window.location.origin}/curriculum/${resourceId}`);
    }
  }, [resource, resourceId]);

  // Handle save resource functionality
  const handleSaveResource = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save this resource",
        variant: "destructive",
      });
      return;
    }

    // Toggle save state - in a real implementation, this would call an API
    setIsSaved(!isSaved);

    toast({
      title: isSaved ? "Resource removed from saved items" : "Resource saved",
      description: isSaved
        ? "This resource has been removed from your saved items"
        : "This resource has been added to your saved items",
      variant: "default",
    });
  };

  // Handle share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource?.title || "Dance curriculum resource",
          text:
            resource?.description || "Check out this dance curriculum resource",
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        setShareDialogOpen(true);
      }
    } else {
      setShareDialogOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        toast({
          title: "Link copied",
          description: "Resource link copied to clipboard",
        });
        setShareDialogOpen(false);
      },
      (err) => {
        console.error("Failed to copy link:", err);
        toast({
          title: "Failed to copy",
          description: "Could not copy the link to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  // Fetch resource reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["/api/curriculum", resourceId, "reviews"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(
        `https://api.livetestdomain.com/api/curriculum/${resourceId}/reviews`
      );
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
  });

  // Fetch seller details
  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ["/api/users", resource?.seller?.id],
    enabled: !!resource?.seller?.id,
    queryFn: async ({ queryKey }) => {
      const response = await fetch(
        `https://api.livetestdomain.com/api/users/${resource?.seller?.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch seller details");
      return response.json();
    },
  });

  // Check if the user has purchased this resource
  const { data: userPurchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["/api/resource-orders", "user"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch(
        "https://api.livetestdomain.com/api/resource-orders"
      );
      if (!response.ok) throw new Error("Failed to fetch purchases");
      return response.json();
    },
  });

  const hasPurchased = userPurchases?.some(
    (purchase: any) =>
      purchase.resourceId === resourceId && purchase.status === "completed"
  );

  // Fetch other resources from the same seller
  const { data: sellerResources, isLoading: isLoadingSellerResources } =
    useQuery({
      queryKey: ["/api/resources/seller", resource?.sellerId],
      enabled: !!resource?.sellerId,
      queryFn: async () => {
        const response = await fetch(
          `https://api.livetestdomain.com/api/resources/seller/${resource.sellerId}`
        );
        if (!response.ok) throw new Error("Failed to fetch seller resources");
        const data = await response.json();
        // Filter out the current resource and limit to 4 items
        return data.filter((r: any) => r.id !== resourceId).slice(0, 4);
      },
    });

  // Calculate the appropriate price based on user's subscription
  const getPrice = () => {
    if (!resource) return "0.00";

    // Check if user has premium or royalty subscription
    const isPremium = user?.subscription_plan === "premium";
    const isRoyalty = user?.subscription_plan === "royalty";

    if (isRoyalty && resource.price_royalty) {
      return resource.price_royalty;
    } else if (isPremium && resource.price_premium) {
      return resource.price_premium;
    } else {
      return resource.price;
    }
  };

  // Handle resource download
  const handleDownload = async () => {
    if (!resource) return;

    try {
      setIsDownloading(true);
      const response = await fetch(
        `https://api.livetestdomain.com/api/resources/${resourceId}/download`
      );

      if (!response.ok) {
        throw new Error("Failed to download resource");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resource.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoadingResource) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (!resource) {
    return <div>Resource not found</div>;
  }

  return (
    <div className="space-y-6 p-9">
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Resource</DialogTitle>
            <DialogDescription>
              Copy the link below to share this resource with others.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button type="button" size="sm" onClick={copyToClipboard}>
              Copy
            </Button>
          </div>
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{resource.title}</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveResource}
                  className="flex items-center"
                >
                  {isSaved ? (
                    <Bookmark className="h-4 w-4 mr-1" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4 mr-1" />
                  )}
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {resource.danceStyle && (
                <Badge variant="outline">{resource.danceStyle}</Badge>
              )}
              {resource.ageRange && (
                <Badge variant="outline">{resource.ageRange}</Badge>
              )}
              {resource.difficultyLevel && (
                <Badge variant="outline">{resource.difficultyLevel}</Badge>
              )}
              {resource.type && <Badge>{resource.type}</Badge>}
            </div>
          </div>

          <div className="w-full max-h-96 rounded-lg overflow-hidden">
            <CachedImage
              src={
                resource.thumbnailUrl || resource.url || DEFAULT_RESOURCE_IMAGE
              }
              alt={resource.title}
              className="w-full h-full object-cover"
              contentType="resource"
              fallback={
                <div className="h-64 w-full flex items-center justify-center bg-gray-100">
                  <FileText className="h-16 w-16 text-gray-400" />
                </div>
              }
            />
          </div>

          <div className="prose prose-blue max-w-none">
            {resource.detailedDescription ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: resource.detailedDescription,
                }}
              />
            ) : (
              <p>{resource.description || "No description available."}</p>
            )}
          </div>

          {/* Video Section */}
          {resource.url && resource.type === "VIDEO" && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Resource Video</h2>

              {hasPurchased ? (
                <>
                  {/* Full video for purchasers */}
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <iframe
                      src={convertToYouTubeEmbedUrl(resource.url)}
                      title="Full Instructional Video"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This full instructional video is available to you as a
                    purchaser of this resource.
                  </p>
                </>
              ) : (
                <>
                  {/* Preview thumbnail with play button */}
                  <div className="aspect-video rounded-lg overflow-hidden border relative group">
                    {/* Play button overlay for 15-second preview */}
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedVideoUrl(resource.url);
                        setPreviewModalOpen(true);
                      }}
                    >
                      <div className="flex flex-col items-center justify-center text-white transform scale-90 group-hover:scale-100 transition-transform">
                        <PlayCircle className="h-16 w-16 mb-2" />
                        <span className="text-sm font-medium">
                          Play 15-second preview
                        </span>
                      </div>
                    </div>

                    {/* Static thumbnail */}
                    <div className="w-full h-full">
                      <CachedImage
                        src={resource.thumbnailUrl || DEFAULT_RESOURCE_IMAGE}
                        alt={`Preview for ${resource.title}`}
                        className="w-full h-full object-cover"
                        contentType="resource"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      Click to watch a 15-second preview
                    </p>

                    {/* <PurchaseButton
                      resourceId={resourceId}
                      price={getPrice()}
                      title={resource.title || ""}
                      className="ml-4"
                    /> */}
                  </div>

                  <div className="mt-3 p-3 border rounded-md bg-muted/30">
                    <p className="text-sm flex items-start">
                      <div className="text-primary mr-2 mt-0.5">🔒</div>
                      Purchase this resource to access the full instructional
                      video and all included materials.
                    </p>
                  </div>
                </>
              )}

              {/* Video Preview Modal */}
              <VideoPreviewModal
                videoUrl={selectedVideoUrl}
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                previewDuration={15}
              />
            </div>
          )}

          {/* Reviews section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            {isLoadingReviews ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: ResourceReview) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Review</CardTitle>
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground">
                              Customer Review
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {review.created_at || review.createdAt
                            ? formatDate(
                                new Date(review.created_at || review.createdAt)
                              )
                            : "Recently"}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{review.comment || "No additional comments."}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="sticky top-10 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seller Information */}
                {seller && (
                  <div className="border rounded-md p-3 mb-4">
                    <div className="flex items-center space-x-8">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <CachedImage
                          src={
                            seller.profile_image_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.username)}&background=00d4ff&color=fff`
                          }
                          alt={seller.username}
                          className="w-full h-full"
                          contentType="resource"
                          imgClassName="w-full h-full object-cover"
                          fallback={
                            <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-full">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          }
                        />
                      </div>

                      <div className="flex flex-col">
                        <h3 className="font-medium text-lg">
                          {seller.username}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          {seller.role && seller.role.includes("ADMIN") && (
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                              Admin
                            </span>
                          )}
                          {seller.is_approved_seller && (
                            <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 ml-1">
                              Verified Seller
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {seller.seller_bio && (
                      <div className="mt-2 text-sm text-gray-600">
                        {seller.seller_bio}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Link
                        href={`/instructors/${seller.id}`}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:underline"
                      >
                        <User className="h-3 w-3" />
                        <span>View profile</span>
                      </Link>
                      <Link
                        href={`/sellers/${seller.id}`}
                        className="flex items-center space-x-1 text-sm text-green-600 hover:underline"
                      >
                        <span>View store</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Price and Purchase */}
                <div className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Price:</span>
                    <span className="font-bold text-xl">
                      ${parseFloat(getPrice()).toFixed(2)}
                    </span>
                  </div>

                  {user?.subscription_plan &&
                    user.subscription_plan !== "basic" && (
                      <div className="text-sm text-green-600">
                        {user.subscription_plan === "royalty"
                          ? "Royalty"
                          : "Premium"}{" "}
                        member discount applied
                      </div>
                    )}

                  {hasPurchased ? (
                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full"
                    >
                      {isDownloading ? (
                        <span className="flex items-center">
                          <Skeleton className="h-4 w-4 rounded-full mr-2 animate-spin" />
                          Downloading...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </span>
                      )}
                    </Button>
                  ) : (
                    //
                    <div></div>
                  )}
                </div>

                {/* Resource Metadata */}
                <div className="border rounded-md p-3">
                  <h3 className="font-medium mb-2">Resource Info</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downloads:</span>
                      <span>{resource.download_count || 0}</span>
                    </div>
                    {resource.pages && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pages:</span>
                        <span>{resource.pages}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{formatDate(new Date(resource.created_at))}</span>
                    </div>
                    {resource.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Updated:</span>
                        <span>{formatDate(new Date(resource.updated_at))}</span>
                      </div>
                    )}
                  </div>

                  {/* Edit Resource Button - Only visible to resource owner or curriculum officers */}
                  {user &&
                    (user.id === resource.sellerId ||
                      user.role === "curriculum_officer" ||
                      user.role === "admin") && (
                      <div className="mt-4 pt-3 border-t">
                        <Link
                          href={`/curriculum/${resource.id}/edit`}
                          className="w-full"
                        >
                          <Button variant="outline" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Resource
                          </Button>
                        </Link>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* More from this seller */}
            {sellerResources && sellerResources.length > 0 && (
              <Card id="more-from-seller">
                <CardHeader>
                  <CardTitle>More from this seller</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sellerResources.map((sellerResource: any) => (
                    <Link
                      key={sellerResource.id}
                      href={`/curriculum/${sellerResource.id}`}
                      className="block group"
                    >
                      <div className="flex items-center space-x-10 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
                          <CachedImage
                            src={
                              sellerResource.thumbnailUrl ||
                              DEFAULT_RESOURCE_IMAGE
                            }
                            alt={sellerResource.title}
                            className="w-full h-full object-cover"
                            contentType="resource"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate group-hover:underline group-hover:text-blue-600">
                            {sellerResource.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-3">
                            $
                            {parseFloat(sellerResource.price || "0").toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {seller && (
                    <div className="pt-2 border-t">
                      <Link
                        href={`/sellers/${seller.id}`}
                        className="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        <span>View all resources from {seller.username}</span>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetails;
