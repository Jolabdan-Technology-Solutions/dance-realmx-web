/**
 * Central utility for generating images across the application
 * Provides specialized functions for user avatars, resources, courses, etc.
 */

import { 
  DEFAULT_RESOURCE_IMAGE, 
  DEFAULT_PROFILE_IMAGE, 
  DEFAULT_INSTRUCTOR_IMAGE
} from "./constants";

/**
 * Generates an avatar URL for a user with fallback to default
 * 
 * @param firstName Optional first name for generating avatar
 * @param lastName Optional last name for generating avatar
 * @param username Optional username for generating avatar from username
 * @param url Optional explicit URL to use
 * @param fallback Optional fallback image to use
 * @returns A URL for the user avatar
 */
export function generateUserAvatarUrl(
  firstName: string | null = null,
  lastName: string | null = null,
  username?: string,
  url?: string | null,
  fallback = DEFAULT_PROFILE_IMAGE
): string {
  // If a URL is provided, use that instead of generating one
  if (url) {
    // Clean up URL
    const cleanUrl = url.split("?")[0];
    
    // Handle hardcoded dev URLs
    if (cleanUrl.includes('cdb3af24-bdfa-4abd-bc38-6fd1145ed012')) {
      try {
        const urlObj = new URL(cleanUrl);
        const pathname = urlObj.pathname;
        
        // If it's a profile image - process specially
        if (pathname.includes('profiles/profile_')) {
          console.log("Avatar: Detected profile image, applying special handling:", {
            url: pathname,
            isProfileUrl: true,
            isProfileType: true,
            entityType: "user",
            type: "profile"
          });
        }
        
        // Return the cleaned URL with origin removed
        return pathname;
      } catch (e) {
        console.error("Failed to parse hardcoded URL:", cleanUrl);
        return fallback;
      }
    }
    
    return url;
  }
  
  // Generate an avatar URL based on firstName, lastName, or username
  // Default to a generated avatar with username or initials
  const backgroundColor = "8A2BE2"; // Vibrant purple
  const textColor = "FFFFFF";       // White text
  
  // Figure out what text to display in the avatar
  let displayText: string;
  
  if (firstName && lastName) {
    // If we have first and last name, use initials
    displayText = `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (username) {
    // Use first two letters of username
    displayText = username.substring(0, 2).toUpperCase();
  } else {
    // Fallback to generic user
    displayText = "U";
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayText)}&background=${backgroundColor}&color=${textColor}&size=200&bold=true`;
}

/**
 * Generates an instructor avatar URL with fallback to instructor default
 */
export function generateInstructorAvatarUrl(
  firstName: string | null = null,
  lastName: string | null = null,
  username?: string,
  url?: string | null
): string {
  return generateUserAvatarUrl(firstName, lastName, username, url, DEFAULT_INSTRUCTOR_IMAGE);
}

/**
 * Generates an image URL for a dance style
 */
export function generateDanceStyleImageUrl(
  danceStyle: string | null | undefined
): string {
  if (!danceStyle) return DEFAULT_RESOURCE_IMAGE;
  
  // Map of dance styles to image URLs
  const styleImageMap: Record<string, string> = {
    "Ballet": "/images/dance-styles/ballet.jpg",
    "Jazz": "/images/dance-styles/jazz.jpg",
    "Contemporary": "/images/dance-styles/contemporary.jpg",
    "Hip Hop": "/images/dance-styles/hip-hop.jpg",
    "Tap": "/images/dance-styles/tap.jpg",
    "Modern": "/images/dance-styles/modern.jpg",
    "Ballroom": "/images/dance-styles/ballroom.jpg",
    "Latin": "/images/dance-styles/latin.jpg"
  };
  
  return styleImageMap[danceStyle] || DEFAULT_RESOURCE_IMAGE;
}

/**
 * Processes an image URL to ensure it's a valid absolute URL
 */
export function processImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // Skip data URLs
  if (url.startsWith('data:')) return url;
  
  // Return placeholder service URLs as is
  if (url.includes('ui-avatars.com')) return url;
  
  // For relative URLs, make them absolute
  if (url.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${url}`;
  }
  
  // For absolute URLs, ensure they use HTTPS
  if (url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  
  return url;
}

/**
 * Generates a profile image URL for a user
 * @param username The username to generate an avatar for
 * @param first_name Optional first name for generating avatar
 * @param last_name Optional last name for generating avatar
 * @returns A URL to the generated avatar
 */
export function generateProfileImageUrl(
  username: string,
  first_name: string | null = null,
  last_name: string | null = null,
): string {
  // Generate a consistent color based on the username
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash % 360);
  const saturation = 70;
  const lightness = 50;

  // Generate an avatar URL based on first_name, last_name, or username
  let displayText: string;
  if (first_name && last_name) {
    // Use initials if both first and last name are available
    displayText = `${first_name[0]}${last_name[0]}`.toUpperCase();
  } else {
    // Use first two characters of username
    displayText = username.slice(0, 2).toUpperCase();
  }

  // Use DiceBear's initials API to generate the avatar
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayText)}&backgroundColor=${encodeURIComponent(`hsl(${hue},${saturation}%,${lightness}%)`)}`;
}

/**
 * Generates a profile image URL for a user
 * @param username The username to generate an avatar for
 * @param first_name Optional first name for generating avatar
 * @returns A URL to the generated avatar
 */
export function generateProfileImageUrlFromUser(
  username: string,
  first_name: string | null = null,
): string {
  return generateProfileImageUrl(username, first_name);
}