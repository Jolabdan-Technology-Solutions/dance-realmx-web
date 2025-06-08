import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CachedImage } from "@/components/ui/cached-image";
import { VideoPreviewModal } from "./video-preview-modal";
import { DEFAULT_RESOURCE_IMAGE } from "@/lib/constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Package,
  User,
  Calendar,
  Clock,
  Download,
  Loader2,
  Check,
  File,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { convertToYouTubeEmbedUrl } from "@/lib/utils";

interface ResourceDetailsModalProps {
  resource: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (resourceId: number) => void;
  resourceId?: number; // Added for direct fetching if needed
}

export const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({
  resource: initialResource,
  resourceId,
  open,
  onOpenChange,
  onAddToCart,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [resource, setResource] = useState<any>(initialResource);

  // Fetch resource details if resourceId is provided but resource is not
  const { data, isLoading } = useQuery({
    queryKey: ["/api/curriculum", resourceId],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/curriculum/${queryKey[1]}`);
      if (!response.ok) throw new Error("Failed to fetch resource");
      return response.json();
    },
    enabled: open && !!resourceId && !initialResource,
  });

  // Update resource state when data arrives
  useEffect(() => {
    if (data) {
      setResource(data);
    } else if (initialResource) {
      setResource(initialResource);
    }
  }, [data, initialResource]);

  // Return early states
  if (!resource) return null;
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const hasPreviewVideo = Boolean(resource.previewVideoUrl);
  const previewVideoUrl = resource.previewVideoUrl
    ? convertToYouTubeEmbedUrl(resource.previewVideoUrl)
    : "";

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };

  const sellerName = resource.seller
    ? `${resource.seller.first_name || ""} ${resource.seller.last_name || ""}`.trim() ||
      resource.seller.username
    : "Unknown Seller";

  // Add to cart function
  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    try {
      setIsAddingToCart(true);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType: "resource",
          itemId: resource.id,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to cart");

      toast({
        title: "Added to cart",
        description: `${resource.title} has been added to your cart.`,
      });

      // Call parent handler if provided
      if (onAddToCart) {
        onAddToCart(resource.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-2xl font-bold">
              {resource.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-sm mt-1">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={resource.seller?.profile_image_url}
                  alt={sellerName}
                />
                <AvatarFallback>{sellerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-foreground">{sellerName}</span>
                <span className="text-xs text-muted-foreground">
                  Published{" "}
                  {formatDate(resource.createdAt || new Date().toISOString())}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-5 gap-6 py-4">
            {/* Left column - Image and price */}
            <div className="md:col-span-2">
              <div className="relative rounded-lg overflow-hidden shadow-md mb-4">
                <CachedImage
                  src={resource.imageUrl || DEFAULT_RESOURCE_IMAGE}
                  alt={resource.title}
                  className="w-full h-64 object-cover"
                />

                {hasPreviewVideo && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer hover:bg-black/50 transition-all group"
                    onClick={() => setVideoModalOpen(true)}
                  >
                    <div className="bg-primary p-4 rounded-full transform group-hover:scale-110 transition-transform">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <span className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 text-sm rounded-full">
                      Preview Available
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xl font-bold">
                    {parseFloat(resource.price) > 0
                      ? `$${parseFloat(resource.price).toFixed(2)}`
                      : "Free"}
                  </div>
                  {resource.isFeatured && (
                    <Badge variant="secondary" className="font-medium">
                      Featured
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {user ? (
                    <Button
                      className="w-full"
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>Add to Cart</>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" asChild>
                      <Link href="/auth">Sign in to Purchase</Link>
                    </Button>
                  )}

                  {hasPreviewVideo && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setVideoModalOpen(true)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Watch Preview
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span>{resource.fileType?.toUpperCase() || "Document"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  <span>{resource.downloadCount || 0} downloads</span>
                </div>
                {resource.fileSize && (
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-primary" />
                    <span>
                      {Math.round((resource.fileSize / (1024 * 1024)) * 10) /
                        10}{" "}
                      MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Details & description */}
            <div className="md:col-span-3 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <div className="text-muted-foreground">
                  {resource.description ? (
                    resource.description
                      .split("\n")
                      .map((paragraph: string, idx: number) => (
                        <p key={idx} className="mb-3">
                          {paragraph}
                        </p>
                      ))
                  ) : (
                    <p>No description provided.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Resource Details</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {resource.danceStyle && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">
                        Dance Style
                      </p>
                      <p>{resource.danceStyle}</p>
                    </div>
                  )}

                  {resource.ageRange && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">
                        Age Range
                      </p>
                      <p>{resource.ageRange}</p>
                    </div>
                  )}

                  {resource.difficultyLevel && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">
                        Difficulty
                      </p>
                      <p>{resource.difficultyLevel}</p>
                    </div>
                  )}

                  {resource.format && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">
                        Format
                      </p>
                      <p>{resource.format}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags section */}
              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* What's included section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">What's Included</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      Downloadable {resource.fileType || "resource"} file
                    </span>
                  </li>
                  {resource.previewVideoUrl && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Video demonstration</span>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Lifetime access</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleAddToCart} disabled={isAddingToCart}>
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add to Cart</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasPreviewVideo && (
        <VideoPreviewModal
          videoUrl={previewVideoUrl}
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          previewDuration={15}
        />
      )}
    </>
  );
};
