import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a YouTube URL to its embed format
 * @param url The YouTube URL to convert (can be regular or already embed format)
 * @returns A YouTube embed URL or the original URL if not a YouTube URL
 */
export function convertToYouTubeEmbedUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    // If it's already in embed format, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Handle youtube.com/watch?v= format
    let videoId: string | null = null;
    
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v');
    }
    // Handle youtu.be/ format
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
      // Remove any query parameters
      videoId = videoId.split('?')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Return original URL if it's not a recognized YouTube format
    return url;
  } catch (error) {
    console.error(`Error converting YouTube URL: ${url}`, error);
    return url || "";
  }
}

/**
 * Normalizes image URLs by converting domain-specific URLs to relative paths
 * This handles various URL scenarios to ensure consistent image loading across domains
 * @param url The original URL
 * @returns A normalized URL suitable for the current domain
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    // If it's already a relative URL, return as is
    if (url.startsWith('/')) {
      // Fix incorrect /public paths
      if (url.startsWith('/public/') && !url.includes('/api/')) {
        const correctedPath = url.replace('/public', '');
        console.log(`Removed /public prefix from path: ${url} → ${correctedPath}`);
        return correctedPath;
      }
      
      // Handle paths without proper format - convert /images/ to /public/images/
      if (url.startsWith('/images/') && url.includes('/public/images/')) {
        const correctedPath = url.replace('/public', '');
        console.log(`Fixed duplicate public in image path: ${url} → ${correctedPath}`);
        return correctedPath;
      }
      
      // Validate that the path exists for local images (only attempt for /images path)
      if (url.startsWith('/images/thumbnails/') && !url.includes('?')) {
        // We'll return the URL as is, but add a timestamp to prevent caching issues
        const timestamp = Date.now();
        return `${url}?t=${timestamp}`;
      }
      
      return url;
    }
    
    // Handle data URLs (e.g., data:image/png;base64,...)
    if (url.startsWith('data:')) return url;
    
    // Special case for ui-avatars.com or other trusted external domains
    if (url.includes('ui-avatars.com') || 
        url.includes('gravatar.com') || 
        url.includes('apis.google.com')) {
      return url;
    }
    
    // If it's from any replit.app domain
    if (url.includes('.replit.app')) {
      // Extract the path part from the URL
      const urlObj = new URL(url);
      const path = urlObj.pathname + (urlObj.search || '');
      console.log(`Normalized replit domain in URL: ${url} → ${path}`);
      
      // If this is a course image, move it to the proper location
      if (path.includes('/uploads/courses/')) {
        return path;
      }
      return path;
    }
    
    // If it's a replit-specific URL but without domain
    if (url.includes('00-zu0j8q1alywq.picard')) {
      // Extract just the path from the URL
      const parts = url.split('/');
      // Find the index of the first segment after the domain
      const startIdx = parts.findIndex(part => part.includes('picard')) + 1;
      if (startIdx > 0 && startIdx < parts.length) {
        const path = '/' + parts.slice(startIdx).join('/');
        console.log(`Normalized partial replit URL: ${url} → ${path}`);
        
        // Add special case for course images
        if (path.includes('/uploads/courses/')) {
          return path;
        }
        return path;
      }
    }
    
    // Handle old replit domain URLs
    if (url.includes('drx.dancerealmx.com')) {
      // Extract the path part from the URL
      const urlObj = new URL(url);
      const path = urlObj.pathname + (urlObj.search || '');
      console.log(`Normalized production domain in URL: ${url} → ${path}`);
      return path;
    }
    
    // Handle other HTTP/HTTPS URLs - try to convert to relative paths if they might be local
    if ((url.startsWith('http://') || url.startsWith('https://')) && 
        !url.includes('cloudflare.com') && 
        !url.includes('imgur.com') && 
        !url.includes('amazonaws.com')) {
      try {
        // Try to parse as URL and extract the path
        const urlObj = new URL(url);
        // If this is a path under /uploads, it's likely a local resource
        if (urlObj.pathname.includes('/uploads/')) {
          const path = urlObj.pathname + (urlObj.search || '');
          console.log(`Normalized HTTP URL to local path: ${url} → ${path}`);
          return path;
        }
      } catch {
        // If URL parsing fails, just return the original
      }
    }
    
    // Return the original URL if it doesn't match any normalization rules
    return url;
  } catch (error) {
    console.error(`Error normalizing URL: ${url}`, error);
    return url || "";
  }
}

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string | undefined | null, 
  currency = 'USD'
): string {
  // Handle undefined or null
  if (amount === undefined || amount === null) {
    return "$0.00";
  }
  
  // Clean string values - remove any non-numeric characters except decimal point
  let cleanAmount: string;
  
  if (typeof amount === "string") {
    // Remove any non-numeric characters except decimal point
    cleanAmount = amount.replace(/[^0-9.]/g, '');
  } else {
    // Convert number to string
    cleanAmount = amount.toString();
  }
  
  // Try to parse the cleaned amount
  const numericAmount = parseFloat(cleanAmount);
  
  // Check if parsing was successful
  if (isNaN(numericAmount)) {
    return "$0.00";
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

/**
 * Gets the initials from a full name (first letter of first and last name)
 * @param name Full name to extract initials from
 * @returns Initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 0) return '';
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts[parts.length - 1].charAt(0);
  
  return (firstInitial + lastInitial).toUpperCase();
}