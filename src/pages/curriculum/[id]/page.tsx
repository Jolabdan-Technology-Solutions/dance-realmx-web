"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Seller = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  role: string[];
};

type Category = {
  id: number;
  name: string;
} | null;

type Resource = {
  id: number;
  title: string;
  description: string;
  price: number;
  ageRange: string;
  categoryId: number;
  danceStyle: string;
  difficultyLevel: string;
  sellerId: number;
  thumbnailUrl: string;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
  seller: Seller;
  category: Category;
  previewVideoUrl?: string; // Added for preview video
  isFeatured?: boolean; // Added for featured status
  fileType?: string; // Added for file type
  downloadCount?: number; // Added for download count
  fileSize?: number; // Added for file size
  format?: string; // Added for format
  tags?: string[]; // Added for tags
};

export default function CurriculumInfoPage() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);

  // Debug params
  console.log("Params object:", params);
  console.log("All param keys:", Object.keys(params || {}));

  // Try multiple possible parameter names
  const resourceId = (params?.id ||
    params?.resourceId ||
    params?.curriculum) as string;

  console.log("Resource ID:", resourceId);

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !resourceId) {
      if (!resourceId) {
        setError("No resource ID provided");
        setLoading(false);
      }
      return;
    }

    const fetchResource = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(
          `Fetching resource from: https://api.livetestdomain.com/api/resources/${resourceId}`
        );

        const res = await fetch(
          `https://api.livetestdomain.com/api/resources/${resourceId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`Response status: ${res.status}`);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Error response body:`, errorText);
          throw new Error(
            `Failed to fetch resource: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        console.log("Fetched resource data:", data);
        setResource(data);
      } catch (error) {
        console.error("Error fetching resource:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [mounted, resourceId]);

  // Don't render anything until hydration is complete
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="w-full h-64 bg-gray-300 rounded-xl mb-6"></div>
          <div className="h-8 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">
            Error Loading Resource
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Trigger a re-fetch by updating a dependency
              setMounted(false);
              setTimeout(() => setMounted(true), 10);
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Resource Not Found
          </h2>
          <p className="text-gray-500">
            The requested curriculum resource could not be found.
          </p>
        </div>
      </div>
    );
  }

  // --- Begin migrated UI from ResourceDetailsModal ---
  const hasPreviewVideo = Boolean(resource.previewVideoUrl);
  const previewVideoUrl = resource.previewVideoUrl;
  const sellerName = resource.seller
    ? `${resource.seller.first_name || ""} ${resource.seller.last_name || ""}`.trim() ||
      resource.seller.username
    : "Unknown Seller";
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { toast } = require("@/hooks/use-toast").useToast();
  const { user } = require("@/hooks/use-auth").useAuth();
  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    try {
      setIsAddingToCart(true);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "RESOURCE", itemId: resource.id }),
      });
      if (!response.ok) throw new Error("Failed to add item to cart");
      toast({
        title: "Added to cart",
        description: `${resource.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+";
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Thumbnail Image */}
      <div className="relative mb-6">
        <img
          src={resource.thumbnailUrl}
          alt={resource.title}
          className="w-full h-64 object-cover rounded-xl shadow-lg"
          onError={handleImageError}
        />
        {hasPreviewVideo && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer hover:bg-black/50 transition-all group"
            onClick={() => setVideoModalOpen(true)}
          >
            <div className="bg-primary p-4 rounded-full transform group-hover:scale-110 transition-transform">
              {/* Play icon here */}
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-6.518-3.759A1 1 0 007 8.06v7.882a1 1 0 001.234.97l6.518-1.868A1 1 0 0016 14.06V9.94a1 1 0 00-1.248-.772z"
                />
              </svg>
            </div>
            <span className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 text-sm rounded-full">
              Preview Available
            </span>
          </div>
        )}
      </div>
      {/* Title and Seller */}
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{resource.title}</h1>
        <div className="flex items-center gap-2">
          <img
            src={resource.seller?.profile_image_url}
            alt={sellerName}
            className="h-8 w-8 rounded-full"
          />
          <span className="text-gray-700">{sellerName}</span>
        </div>
      </div>
      {/* Price and Add to Cart */}
      <div className="bg-gray-100 text-black dark:bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold">
            {parseFloat(resource.price) > 0
              ? `$${parseFloat(resource.price).toFixed(2)}`
              : "Free"}
          </div>
          {resource.isFeatured && (
            <span className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs font-medium">
              Featured
            </span>
          )}
        </div>
        <div className="space-y-3">
          {user ? (
            <button
              className="w-full bg-black text-white py-2 rounded"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </button>
          ) : (
            <a
              href="/auth"
              className="w-full block text-center bg-primary text-white py-2 rounded"
            >
              Sign in to Purchase
            </a>
          )}
          {hasPreviewVideo && (
            <button
              className="w-full border border-primary text-primary py-2 rounded mt-2"
              onClick={() => setVideoModalOpen(true)}
            >
              Watch Preview
            </button>
          )}
        </div>
        <div className="space-y-3 text-sm mt-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Type:</span>
            <span>{resource.fileType?.toUpperCase() || "Document"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Downloads:</span>
            <span>{resource.downloadCount || 0}</span>
          </div>
          {resource.fileSize && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Size:</span>
              <span>
                {Math.round((resource.fileSize / (1024 * 1024)) * 10) / 10} MB
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Description */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Description</h2>
        <div className="text-gray-700">
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
      {/* Resource Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resource Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Price:</span>
              <span className="ml-2 text-green-600 font-semibold">
                ${resource.price}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Age Range:</span>
              <span className="ml-2">{resource.ageRange}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dance Style:</span>
              <span className="ml-2">{resource.danceStyle}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Difficulty:</span>
              <span className="ml-2">{resource.difficultyLevel}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Format:</span>
              <span className="ml-2">{resource.format}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Tags section */}
      {resource.tags && resource.tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* What's included section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">What's Included</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✔</span>
            <span>Downloadable {resource.fileType || "resource"} file</span>
          </li>
          {resource.previewVideoUrl && (
            <li className="flex items-center gap-2">
              <span className="text-green-600">✔</span>
              <span>Video demonstration</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <span className="text-green-600">✔</span>
            <span>Lifetime access</span>
          </li>
        </ul>
      </div>
      {/* Video Preview Modal (optional, can be implemented as a modal or inline) */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-700 text-2xl"
              onClick={() => setVideoModalOpen(false)}
            >
              ×
            </button>
            <iframe
              src={previewVideoUrl}
              title="Preview Video"
              className="w-full h-96 rounded"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
  // --- End migrated UI ---
}
