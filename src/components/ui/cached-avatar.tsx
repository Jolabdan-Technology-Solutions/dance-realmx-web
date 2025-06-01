import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, normalizeImageUrl } from "@/lib/utils";
import { DEFAULT_USER_IMAGE, DEFAULT_SELLER_IMAGE } from "@/lib/constants"; 
import { generateUserAvatarUrl } from "@/lib/image-generator";

export interface CachedAvatarProps {
  src?: string | null | undefined;
  alt?: string;
  fallbackText?: string;
  className?: string;
  fallbackClassName?: string;
  forceCacheBusting?: boolean;
  isSeller?: boolean; // Specifies if this avatar is for a seller profile
  username?: string | null; // Optional username for generating avatar
  profile_image_url?: string | null; // Optional profile image URL (alternative to src)
  type?: string; // Optional type of avatar (e.g., 'profile', 'course', etc.)
  entityType?: string; // Optional entity type (e.g., 'user', 'seller', etc.)
  first_name?: string | null; // Optional first name for generating avatar
  last_name?: string | null; // Optional last name for generating avatar
}

/**
 * CachedAvatar component with better error handling and cache busting
 * 
 * This component improves upon the default Avatar component:
 * 1. Adds cache busting to prevent stale images
 * 2. Better fallback handling with customizable styling
 * 3. Improved error handling for broken image links
 * 4. Dynamically loads the image to verify it exists before rendering
 * 5. Uses normalized URLs that work across all deployment environments
 */
export function CachedAvatar({
  src,
  alt,
  fallbackText,
  className,
  fallbackClassName,
  forceCacheBusting = true,
  isSeller = false,
  username,
  profile_image_url,
  type,
  entityType,
  first_name,
  last_name,
}: CachedAvatarProps) {
  // If profile_image_url is provided, use it as src
  const actualSrc = profile_image_url || src;
  // If alt is not provided but username is, use username as alt
  const actualAlt = alt || username || "Avatar";
  
  // For initials in the fallback
  let initials = fallbackText || "";
  
  if (!initials && first_name && last_name) {
    // Use first letter of first name and first letter of last name
    initials = `${first_name[0]}${last_name[0]}`.toUpperCase();
  } else if (!initials && username) {
    // Use first two letters of username
    initials = username.substring(0, 2).toUpperCase();
  } else if (!initials) {
    // Default to user icon
    initials = "U";
  }
  
  // Limit to 2 characters max
  initials = initials.substring(0, 2);
  
  const [imageExists, setImageExists] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  
  useEffect(() => {
    // Reset state when src changes
    setImageExists(false);
    setIsLoading(true);
    setRecoveryAttempted(false);
    
    // If no source is provided, use default or early return
    if (!actualSrc) {
      // Choose appropriate default image
      const defaultImg = isSeller ? DEFAULT_SELLER_IMAGE : DEFAULT_USER_IMAGE;
      
      // If username is provided, try to generate a user avatar
      if (username) {
        setImageUrl(generateUserAvatarUrl(username, isSeller));
        setImageExists(true);
      } else {
        setImageUrl(defaultImg);
        setImageExists(true);
      }
      
      setIsLoading(false);
      return;
    }
    
    // Use the proper URL normalization based on the profile type
    // This ensures URLs work across all deployment environments
    let normalizedUrl = "";
    
    try {
      normalizedUrl = normalizeImageUrl(actualSrc);
      
      // Add cache busting parameter if needed
      if (forceCacheBusting && normalizedUrl) {
        const cacheBustParam = `v=${Date.now()}`;
        const hasQuery = normalizedUrl.includes('?');
        normalizedUrl = hasQuery 
          ? `${normalizedUrl}&${cacheBustParam}` 
          : `${normalizedUrl}?${cacheBustParam}`;
      }
      
      // Log the normalization for debugging
      console.log(`Avatar: Normalized profile URL: ${actualSrc} → ${normalizedUrl}`);
      
      // Store the normalized URL
      setImageUrl(normalizedUrl);
    } catch (error) {
      console.error("Error normalizing avatar URL:", error);
      // On normalization error, fall back to the original URL
      normalizedUrl = actualSrc;
      setImageUrl(normalizedUrl);
    }
    
    // We'll check if the image actually exists
    const img = new Image();
    
    img.onload = () => {
      setImageExists(true);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      // Already attempted recovery once, move to fallback
      if (recoveryAttempted) {
        useDefaultOrFallback();
        return;
      }
      
      // Try recovery mechanisms
      let recoveryUrl = "";
      
      // First attempt: Try adding uploads/ prefix if missing
      if (!normalizedUrl.includes('/uploads/') && 
          !normalizedUrl.startsWith('data:') && 
          !normalizedUrl.includes('ui-avatars.com')) {
        
        // Create a path with uploads directory
        recoveryUrl = `/uploads/${normalizedUrl.startsWith('/') ? normalizedUrl.substring(1) : normalizedUrl}`;
        console.log(`Avatar: Trying recovery with uploads directory: ${recoveryUrl}`);
      }
      // Second attempt: Try profiles subdirectory
      else if (!normalizedUrl.includes('/uploads/profiles/') && 
               normalizedUrl.includes('/uploads/')) {
        
        // Try with the profiles subdirectory
        recoveryUrl = normalizedUrl.replace('/uploads/', '/uploads/profiles/');
        console.log(`Avatar: Trying recovery with profiles subdirectory: ${recoveryUrl}`);
      }
      
      // If we have a recovery URL, try it
      if (recoveryUrl) {
        setRecoveryAttempted(true);
        
        const recoveryImg = new Image();
        recoveryImg.onload = () => {
          setImageUrl(recoveryUrl);
          setImageExists(true);
          setIsLoading(false);
        };
        recoveryImg.onerror = () => {
          // If recovery fails, use default or generated avatar
          useDefaultOrFallback();
        };
        recoveryImg.src = recoveryUrl;
        return;
      }
      
      // If no recovery path available, use fallback
      useDefaultOrFallback();
    };
    
    // Function to use default image or generated avatar when image loading fails
    const useDefaultOrFallback = () => {
      if (username) {
        console.log(`Avatar: Using generated avatar for ${username}`);
        setImageUrl(generateUserAvatarUrl(username, isSeller));
        setImageExists(true);
      } else {
        console.log(`Avatar: Using default image for ${isSeller ? 'seller' : 'user'}`);
        setImageUrl(isSeller ? DEFAULT_SELLER_IMAGE : DEFAULT_USER_IMAGE);
        setImageExists(true);
      }
      setIsLoading(false);
    };
    
    // Start loading the normalized image
    img.src = normalizedUrl;
  }, [actualSrc, username, isSeller, forceCacheBusting, first_name, last_name, recoveryAttempted]);
  
  return (
    <Avatar className={cn("relative", className)}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : null}
      
      {imageExists ? (
        <AvatarImage 
          src={imageUrl} 
          alt={actualAlt} 
          className={cn(isLoading ? "opacity-0" : "opacity-100", "transition-opacity")}
        />
      ) : null}
      
      <AvatarFallback 
        className={cn(
          "bg-muted text-muted-foreground", 
          (imageExists && !isLoading) ? "hidden" : "flex",
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}