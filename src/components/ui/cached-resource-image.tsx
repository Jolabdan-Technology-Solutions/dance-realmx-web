import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  ResourceData, 
  generateResourceImageUrl, 
  handleResourceImageError, 
  generateResourcePlaceholderData 
} from "@/lib/generate-resource-image";
import { ResourcePlaceholder } from "./resource-placeholder";
import { CachedImage } from "./cached-image";

interface CachedResourceImageProps {
  resource: ResourceData;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  imgClassName?: string;
  aspectRatio?: "square" | "video" | "auto";
  fallback?: React.ReactNode;
}

/**
 * Specialized image component for dance curriculum resources 
 * with enhanced error handling and multiple fallback paths
 */
export function CachedResourceImage({
  resource,
  alt,
  size = "md",
  className,
  imgClassName,
  aspectRatio = "square",
  fallback,
}: CachedResourceImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attemptedRecovery, setAttemptedRecovery] = useState(false);
  
  // Use the resource title as alt text if none is provided
  const imageAlt = alt || `${resource.title} - ${resource.danceStyle || 'Dance Resource'}`;
  
  // Get the appropriate image URL from the resource
  // We make sure to apply our improved resource image URL generation
  const imageUrl = generateResourceImageUrl(resource);
  
  // Define aspect ratio classes
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };
  
  // Enhanced error handling with specialized fallbacks for resources
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (attemptedRecovery) {
      // If we've already tried recovery paths, show the placeholder
      setError(true);
    } else {
      // First failure, attempt recovery
      setAttemptedRecovery(true);
      
      // Use our specialized error handler for resource images
      // This will try multiple paths in sequence
      handleResourceImageError(e, resource);
    }
  };
  
  // Generate a placeholder component if no fallback provided
  const defaultFallback = error || !imageUrl 
    ? <ResourcePlaceholder {...generateResourcePlaceholderData(resource, size)} />
    : null;
  
  return (
    <div className={cn(
      "overflow-hidden relative rounded",
      aspectRatioClasses[aspectRatio],
      className
    )}>
      {imageUrl && !error ? (
        <CachedImage
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full"
          imgClassName={cn("object-cover w-full h-full", imgClassName)}
          onError={handleError}
          onLoadingComplete={() => setLoading(false)}
          contentType="resource"
          resource={resource}
          forceCacheBusting={true}
        />
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
}