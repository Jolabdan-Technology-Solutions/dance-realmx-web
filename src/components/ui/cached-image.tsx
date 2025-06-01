import React, { useState, useEffect } from "react";
import { cn, normalizeImageUrl } from "@/lib/utils";
import { ResourceData } from "@/lib/generate-resource-image";

export interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: React.ReactNode;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoadingComplete?: () => void;
  contentType?: "resource" | "profile" | "course" | "general";
  resource?: ResourceData;
  forceCacheBusting?: boolean;
  width?: number | string;
  height?: number | string;
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>["crossOrigin"];
  loading?: React.ImgHTMLAttributes<HTMLImageElement>["loading"];
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  sizes?: string;
  decoding?: React.ImgHTMLAttributes<HTMLImageElement>["decoding"];
  style?: React.CSSProperties;
}

/**
 * CachedImage component with built-in loading states and error handling
 * Base component for all image rendering in the application with improved URL normalization
 */
export function CachedImage({
  src,
  alt,
  className,
  imgClassName,
  fallback,
  onError,
  onLoadingComplete,
  contentType = "general",
  resource,
  forceCacheBusting = false,
  ...props
}: CachedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(!src); // Set error to true if src is null/undefined/empty
  const [imgSrc, setImgSrc] = useState<string>('');
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  
  // Early return if src is null, undefined, or empty
  if (!src) {
    console.warn("CachedImage: Empty or null src provided", { contentType });
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }
  
  // Use useEffect to apply URL normalization once on mount
  useEffect(() => {
    // Apply image URL normalization using our utility function
    const normalizedSrc = normalizeImageUrl(src);
    
    // Add additional debugging for resource images
    if (contentType === "resource" && resource) {
      console.log(`Applying resource image for resource ${resource.id}:`, { 
        original: src,
        normalized: normalizedSrc
      });
    }
    
    // Add cache busting parameter if needed
    if (forceCacheBusting && normalizedSrc) {
      const cacheBustParam = `v=${Date.now()}`;
      const hasQuery = normalizedSrc.includes('?');
      const normalizedWithCache = hasQuery 
        ? `${normalizedSrc}&${cacheBustParam}` 
        : `${normalizedSrc}?${cacheBustParam}`;
      setImgSrc(normalizedWithCache);
    } else {
      setImgSrc(normalizedSrc);
    }
  }, [src, contentType, forceCacheBusting, resource]);
  
  // Handle image loading errors with enhanced recovery
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (recoveryAttempted) {
      // We've already tried to recover once, now we fail
      console.error(`Image failed to load after recovery attempt: ${imgSrc}`, {
        contentType,
        originalSrc: src,
        finalSrc: e.currentTarget.src,
        resourceId: resource?.id,
        resourceTitle: resource?.title
      });
      
      setError(true);
      
      // Call the parent's error handler if provided
      if (onError) {
        onError(e);
      }
      return;
    }
    
    // For resources, log specific debug info and try specialized recovery
    if (contentType === 'resource' && resource) {
      console.error("Resource image failed to load:", e.currentTarget.src, {
        resourceId: resource.id,
        title: resource.title
      });
      
      // Enhanced backup logic for resources - they could be in multiple different places
      // Try a series of paths in sequence to find where the image actually is
      let recoveryUrl = "";
      
      // Extract the filename from the path
      const urlParts = imgSrc.split('?')[0]; // Remove query parameters
      const fileName = urlParts.substring(urlParts.lastIndexOf('/') + 1);
      
      // Try all possible paths where the image might be located
      if (imgSrc.includes('/uploads/resources/')) {
        // Already in resources folder - try general uploads
        recoveryUrl = imgSrc.replace('/uploads/resources/', '/uploads/');
      } else if (imgSrc.includes('/uploads/')) {
        // Try resources folder
        recoveryUrl = imgSrc.replace('/uploads/', '/uploads/resources/');
      } else if (!imgSrc.includes('/uploads/')) {
        // No uploads folder at all - try both locations
        recoveryUrl = `/uploads/${fileName}`;
      }
      
      // If none of the above worked, try direct paths with just the filename
      if (!recoveryUrl || recoveryUrl === imgSrc) {
        recoveryUrl = `/images/thumbnails/${fileName}`;
      }
      
      if (recoveryUrl && recoveryUrl !== imgSrc) {
        console.log(`Attempting directory recovery for resource image: ${recoveryUrl}`);
        setImgSrc(recoveryUrl);
        setRecoveryAttempted(true);
        return; // Give recovery a chance
      }
    }
    
    // Try to recover with a direct URL if this is a relative path
    if (imgSrc.startsWith('/') && !recoveryAttempted) {
      // If using a relative URL, try with the current domain
      const recoveryUrl = `${window.location.origin}${imgSrc}`;
      console.log(`Attempting recovery with absolute URL: ${recoveryUrl}`);
      
      setImgSrc(recoveryUrl);
      setRecoveryAttempted(true);
      return; // Don't set error state yet, give the recovery a chance
    }
    
    // If we get here, all recovery attempts failed
    setError(true);
    
    // Call the parent's error handler if provided
    if (onError) {
      onError(e);
    }
  };
  
  const handleLoad = () => {
    setLoading(false);
    
    if (onLoadingComplete) {
      onLoadingComplete();
    }
  };
  
  // If there's an error and no fallback, hide the image
  if (error && !fallback) {
    return null;
  }
  
  // If there's an error and a fallback, show the fallback
  if (error && fallback) {
    return <>{fallback}</>;
  }
  
  // Don't render until we have a normalized URL
  if (!imgSrc) {
    return (
      <div className={cn("relative", className)}>
        <div className="absolute inset-0 flex items-center justify-center bg-background/20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("relative", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={cn("transition-opacity", loading ? "opacity-0" : "opacity-100", imgClassName)}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
}