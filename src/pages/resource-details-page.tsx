import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useGuestMode } from "@/hooks/use-guest-mode";
import { Resource, ResourceReview, User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Download, Award, ThumbsUp, FileText, CheckCircle,
  Clock, Calendar, User as UserIcon, BadgeCheck,
  Share2, Bookmark, Loader2, Heart, ShoppingCart, Video
} from "lucide-react";
import { VideoPreviewModal } from "@/components/curriculum/video-preview-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { CachedImage } from "@/components/ui/cached-image";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ResourceDetailsPage() {
  const { resourceId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addItem } = useGuestCart();
  const { guestMode } = useGuestMode();
  // State for auth dialog
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [actionType, setActionType] = useState<'download' | 'cart'>('cart');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Function to convert regular YouTube URLs to embed format
  const convertToYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Handle youtu.be format
    if (url.includes('youtu.be')) {
      const id = url.split('/').pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    
    // Handle youtube.com/watch format
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // If it's already an embed URL or other format, return as is
    return url;
  };

  // Fetch resource details
  const { data: resource, isLoading: isLoadingResource } = useQuery<Resource>({
    queryKey: [`/api/curriculum/${resourceId}`],
    enabled: !!resourceId,
  });

  // Fetch resource reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<ResourceReview[]>({
    queryKey: [`/api/curriculum/${resourceId}/reviews`],
    enabled: !!resourceId,
  });
  
  // Check if user has purchased this resource
  const { data: userPurchases = [], isLoading: isLoadingPurchases } = useQuery<{resourceId: number}[]>({
    queryKey: ['/api/user/purchases'],
    enabled: !!user,
  });
  
  // Determine if the current user has purchased this resource
  const hasPurchased = user && userPurchases.some(purchase => 
    purchase.resourceId === Number(resourceId)
  );

  // Fetch seller information
  const { data: seller, isLoading: isLoadingSeller } = useQuery<User>({
    queryKey: [`/api/users/${resource?.sellerId}`],
    enabled: !!resource?.sellerId,
  });

  // Check if user has purchased this resource
  const { data: hasPurchasedResource, isLoading: isLoadingPurchaseStatus } = useQuery<boolean>({
    queryKey: [`/api/curriculum/${resourceId}/purchased`],
    enabled: !!user && !!resourceId,
  });

  // We've removed the purchase resource mutation as we're using cart only

  // Download resource mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/curriculum/${resourceId}/download`);
      return await res.json();
    },
    onSuccess: (data) => {
      // Open the download URL
      window.open(data.downloadUrl, "_blank");
      
      toast({
        title: "Download Started",
        description: "Your resource download has started.",
      });
      
      // Invalidate relevant queries to update download count
      queryClient.invalidateQueries({ queryKey: [`/api/curriculum/${resourceId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle adding item to cart
  const handleAddToCart = () => {
    if (!resource) return;
    
    if (user) {
      // If user is authenticated, use the regular cart API
      navigate("/cart", { state: { resourceId: resource.id } });
    } else if (guestMode) {
      // If in guest mode, add to guest cart
      addItem({
        id: resource.id,
        title: resource.title,
        price: resource.price || '0',
        itemType: 'resource',
        itemId: resource.id,
        quantity: 1,
        imageUrl: resource.imageUrl || undefined
      });
      
      toast({
        title: "Added to Cart",
        description: "The resource has been added to your cart.",
      });
    } else {
      // If not in guest mode and not authenticated, show auth dialog
      setActionType('cart');
      setShowAuthDialog(true);
    }
  };

  const isLoading = isLoadingResource || isLoadingReviews || 
                   isLoadingSeller || isLoadingPurchaseStatus;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!resource || !seller) {
    return (
      <div className="w-full px-4 md:px-8 lg:px-16 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Resource Not Found</h1>
        <p className="mb-8">The resource you're looking for doesn't exist or has been removed.</p>
        <Link href="/curriculum">
          <Button>Browse Resources</Button>
        </Link>
      </div>
    );
  }

  // No longer displaying ratings as per requirements
  // All rating information has been removed

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // We've removed the direct purchase functionality

  // Handle download button click
  const handleDownload = () => {
    if (!user && Number(resource?.price) > 0) {
      setActionType('download');
      setShowAuthDialog(true);
      return;
    }
    
    // Free resources can be downloaded without authentication
    if (Number(resource?.price) === 0) {
      downloadMutation.mutate();
      return;
    }
    
    // Check if user has purchased the resource
    if (!hasPurchasedResource && Number(resource.price) > 0) {
      toast({
        title: "Purchase Required",
        description: "You need to purchase this resource before downloading.",
        variant: "destructive",
      });
      return;
    }
    
    // If user is authenticated and has purchased, download
    downloadMutation.mutate();
  };
  
  // Continue as guest handler
  const continueAsGuest = () => {
    // For cart actions, redirect to cart as guest
    if (actionType === 'cart') {
      navigate("/cart", { state: { guestMode: true, resourceId } });
    } else {
      // For downloads of free resources, just download
      if (Number(resource?.price) === 0) {
        downloadMutation.mutate();
      } else {
        toast({
          title: "Authentication Required",
          description: "You need an account to download premium resources.",
        });
      }
    }
    setShowAuthDialog(false);
  };
  
  // Register or login handler
  const registerOrLogin = () => {
    // Redirect to auth page with return URL
    navigate("/auth", { state: { redirect: `/curriculum/${resourceId}` } });
    setShowAuthDialog(false);
  };

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 py-12">
      {/* Header with back navigation */}
      <div className="mb-8">
        <Link href="/curriculum">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Button>
        </Link>
      </div>

      {/* Resource Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Resource Image */}
        <div className="lg:col-span-1">
          <div 
            className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative" 
            onClick={() => {
              if (resource.fullVideoUrl) {
                setSelectedVideoUrl(resource.fullVideoUrl);
                setPreviewModalOpen(true);
              }
            }}
          >
            <CachedImage 
              src={resource.imageUrl || ''}
              alt={resource.title}
              className="w-full h-full aspect-square"
              imgClassName="object-cover"
              fallback={
                <div className="flex items-center justify-center h-64">
                  <FileText className="h-24 w-24 text-gray-400" />
                </div>
              }
            />
            {resource.fullVideoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity">
                <Video className="w-16 h-16 text-white" />
              </div>
            )}
          </div>
        </div>
        
        {/* Resource Info */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{resource.title}</h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="outline" className="px-2 py-1 bg-gray-50">
              {resource.fileType || "Document"}
            </Badge>
            {/* Rating display removed */}
            <div className="flex items-center text-gray-500">
              <Download className="h-4 w-4 mr-1" />
              <span>{resource.downloadCount || 0} downloads</span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">{resource.description}</p>
          
          {/* Seller info */}
          <div className="flex items-center mb-6">
            <CachedAvatar 
              src={seller.profile_image_url}
              alt={`${seller.first_name} ${seller.last_name}`} 
              className="h-10 w-10 mr-3"
              fallbackText={`${seller.first_name?.[0]}${seller.last_name?.[0]}`}
            />
            <div>
              <p className="font-medium flex items-center">
                {seller.first_name} {seller.last_name}
                {seller.role === "instructor" && (
                  <BadgeCheck className="h-4 w-4 text-blue-500 ml-1" />
                )}
              </p>
              <p className="text-sm text-gray-500">
                Created on {formatDate(resource.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Price and action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-3xl font-bold">
              {Number(resource.price) === 0 
                ? <span className="text-green-600">Free</span> 
                : <span>${Number(resource.price).toFixed(2)}</span>
              }
            </div>
            
            <div className="flex flex-wrap gap-3">
              {hasPurchasedResource || Number(resource.price) === 0 ? (
                <Button 
                  onClick={handleDownload}
                  disabled={downloadMutation.isPending}
                  className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download Now
                </Button>
              ) : (
                <Button 
                  onClick={handleAddToCart}
                  className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart (${Number(resource.price).toFixed(2)})
                </Button>
              )}
              
              <Button variant="outline">
                <Heart className="mr-2 h-4 w-4" />
                Save
              </Button>
              
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Content Tabs */}
      <Tabs defaultValue="details" className="max-w-4xl">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="space-y-8">
            {/* Detailed Description */}
            {/* Video Section */}
            {(resource.previewVideoUrl || resource.fullVideoUrl) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Resource Videos</h2>
                
                {/* Preview Video - visible to all users */}
                {resource.previewVideoUrl && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Preview Video</h3>
                    <div className="aspect-video rounded-lg overflow-hidden border">
                      <iframe
                        src={convertToYouTubeEmbedUrl(resource.previewVideoUrl)}
                        title="Preview Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      This is a preview video available to all users.
                    </p>
                  </div>
                )}
                
                {/* Full Video Section - always show container but conditionally show video */}
                {resource.fullVideoUrl && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Full Instructional Video</h3>
                    
                    {/* Always showing the actual video for development/testing */}
                    <div className="aspect-video rounded-lg overflow-hidden border">
                      <iframe
                        src={convertToYouTubeEmbedUrl(resource.fullVideoUrl)}
                        title="Full Instructional Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {hasPurchasedResource 
                        ? "This full instructional video is available to you as a purchaser of this resource."
                        : "For testing purposes, this video is visible to all users. In production, it would only be visible to purchasers."}
                    </p>
                    
                    {/* In production, we would use this code instead:
                    {hasPurchased ? (
                      <>
                        <div className="aspect-video rounded-lg overflow-hidden border">
                          <iframe
                            src={convertToYouTubeEmbedUrl(resource.fullVideoUrl)}
                            title="Full Instructional Video"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          This full instructional video is available to you as a purchaser of this resource.
                        </p>
                      </>
                    ) : (
                      <div className="aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="text-2xl mb-2">🔒</div>
                          <h4 className="text-lg mb-2">Full Video Locked</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Purchase this resource to access the full instructional video
                          </p>
                          <Button 
                            onClick={handleAddToCart}
                            className="mt-2"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Add to Cart (${Number(resource.price).toFixed(2)})
                          </Button>
                        </div>
                      </div>
                    )} */}
                  </div>
                )}
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold mb-4">About this Resource</h2>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: resource.detailedDescription || resource.description || '' }} />
              </div>
            </div>
            
            {/* Features/Specifications */}
            <div>
              <h2 className="text-xl font-bold mb-4">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(resource.updatedAt || resource.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">File Type</p>
                    <p className="font-medium uppercase">{resource.fileType || "Document"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Published</p>
                    <p className="font-medium">{formatDate(resource.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Creator</p>
                    <p className="font-medium">{seller.first_name} {seller.last_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews">
          <div className="space-y-8">
            {/* Reviews count summary */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex flex-col items-center justify-center">
                <p className="text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            {/* Review List */}
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <CachedAvatar 
                          src={null}
                          alt="User"
                          className="h-8 w-8 mr-3"
                          fallbackText="U"
                        />
                        <span className="font-medium">User</span>
                      </div>
                      {/* Ratings display removed */}
                    </div>
                    <p className="text-gray-500 text-sm mb-3">
                      {formatDate(review.createdAt)}
                    </p>
                    <p>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Resources (optional) */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Display related resources here */}
        </div>
      </div>

      {/* We removed the Purchase Confirmation Dialog as we're only using the cart now */}

      {/* Authentication Option Dialog */}
      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'cart' ? 'Sign in or Continue as Guest' : 'Sign in to Download'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'cart' 
                ? 'You can continue as a guest to add this resource to your cart or sign in to your account.'
                : 'You can download this resource as a guest if it\'s free, or sign in to access premium content.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={continueAsGuest}
            >
              Continue as Guest
            </Button>
            <Button 
              className="w-full sm:w-auto bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" 
              onClick={registerOrLogin}
            >
              Sign In / Register
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        videoUrl={selectedVideoUrl}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        previewDuration={15}
      />
    </div>
  );
}