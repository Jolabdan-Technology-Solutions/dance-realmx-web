import { DEFAULT_RESOURCE_IMAGE } from "./constants";
// Removed React import to avoid circular dependencies

/**
 * Comprehensive image handling system for resources
 * Creates a multi-layer fallback chain to ensure resources always have appropriate images
 */

// Interface for resource data
export interface ResourceData {
  id: number;
  title: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  danceStyle?: string | null;
  [key: string]: any; // Allow other properties
}

/**
 * Generates URL for resource image based on available data
 * Prioritizes display-ready images in this order:
 * 1. Custom imageUrl from resource
 * 2. Thumbnail URL from resource
 * 3. Constructed path based on standard patterns (/uploads/resources/resource_[id].jpg)
 * 4. Constructed path based on fallback patterns (/images/thumbnails/resource_[id].jpg)
 * 5. Generated placeholder URL using resource metadata
 * 6. Default fallback image
 */
export function generateResourceImageUrl(resource: ResourceData): string {
  // If we already have a valid imageUrl, use it
  if (
    typeof resource.thumbnailUrl === "string" &&
    resource.thumbnailUrl &&
    resource.thumbnailUrl.trim() !== ""
  ) {
    return resource.thumbnailUrl;
  }

  // If we have a thumbnailUrl, use that as fallback
  if (
    typeof resource.thumbnailUrl === "string" &&
    resource.thumbnailUrl &&
    resource.thumbnailUrl.trim() !== ""
  ) {
    return resource.thumbnailUrl;
  }

  // Try common pattern locations based on the resource ID
  if (resource.id) {
    // Try a series of predictable paths where resource images might be stored:
    // 1. Use resource_[id].jpg pattern in resources directory
    const resourcePath = `/uploads/resources/resource_${resource.id}.jpg`;

    // 2. Use thumbnails directory for smaller preview images
    const thumbnailPath = `/images/thumbnails/resource_${resource.id}.jpg`;

    // Determine if we're in a browser environment
    if (typeof window !== "undefined") {
      // In browser, we'll return the resource path and let the error handler try alternatives
      return resourcePath;
    } else {
      // In SSR, just return the resource path
      return resourcePath;
    }
  }

  // If we have enough data to generate a placeholder, create one
  if (resource.id && resource.title) {
    // Generate a deterministic color based on resource ID
    const colors = [
      "FF6B6B",
      "4ECDC4",
      "FF9F1C",
      "2EC4B6",
      "E71D36",
      "011627",
      "FDFFFC",
      "235789",
    ];
    const colorIndex = resource.id % colors.length;
    const backgroundColor = colors[colorIndex];

    // Create resource initials for placeholder
    const initials = resource.title
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();

    // Generate a UI Avatars URL with resource attributes
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=128&bold=true`;
  }

  // Last resort - return default image
  return DEFAULT_RESOURCE_IMAGE;
}

/**
 * Handles image loading errors for resources with a multi-stage fallback system
 * Updates the img element directly with most appropriate fallback
 */
export function handleResourceImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  resource: ResourceData
): void {
  const imgElement = event.currentTarget;
  const originalSrc = imgElement.src;

  console.error(`Resource image failed to load: ${originalSrc}`, {
    resourceId: resource.id,
    title: resource.title,
  });

  // If the original source was already our last-resort options, give up
  if (
    originalSrc.includes("ui-avatars.com") ||
    originalSrc === DEFAULT_RESOURCE_IMAGE
  ) {
    // We're already at the fallback chain end, hide the image
    imgElement.style.display = "none";
    return;
  }

  // Try to find alternatives for this resource image
  // First, try predictable path patterns in various locations
  if (resource.id) {
    // Try a series of fallback locations
    const locations = [
      // 1. Standard resource location
      `/uploads/resources/resource_${resource.id}.jpg`,
      // 2. Generic uploads location
      `/uploads/resource_${resource.id}.jpg`,
      // 3. Thumbnails folder
      `/images/thumbnails/resource_${resource.id}.jpg`,
      // 4. Alternative file naming without resource_ prefix
      `/uploads/resources/${resource.id}.jpg`,
      // 5. Direct ID as filename
      `/uploads/${resource.id}.jpg`,
      // 6. File upload naming patterns
      `/uploads/file-${resource.id}.jpg`,
    ];

    // Try each location in order
    for (const location of locations) {
      // Skip if we're already trying this location
      if (originalSrc.includes(location)) continue;

      // Log the recovery attempt
      console.log(
        `Attempting resource recovery for ID ${resource.id} with: ${location}`
      );

      // Try this location
      imgElement.src = location;
      return; // Let the browser try this path
    }
  }

  // If direct paths didn't work, try generating a placeholder
  const fallbackSrc = generateResourceImageUrl(resource);

  // Only proceed if we have a different fallback
  if (fallbackSrc && fallbackSrc !== originalSrc) {
    // Log the fallback operation
    console.log(
      `Applying resource image fallback for resource ${resource.id}:`,
      {
        original: originalSrc,
        fallback: fallbackSrc,
      }
    );

    // Apply the fallback
    imgElement.src = fallbackSrc;
    imgElement.style.display = ""; // Show the image again
  } else {
    // No suitable fallback, hide the image
    imgElement.style.display = "none";
  }
}

/**
 * Checks if a URL is a valid image by attempting to load it
 * Returns a promise that resolves with true if valid, false otherwise
 */
export async function checkImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();

    img.onload = () => {
      resolve(true);
    };

    img.onerror = () => {
      resolve(false);
    };

    // Set a timeout in case the image takes too long to load
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);

    // Set the source to start loading
    img.src = url;

    // Clean up the timeout when image loads or errors
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
  });
}

/**
 * Preloads an image to ensure it's in the browser cache
 * Returns a promise that resolves when the image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve();
    };

    img.onerror = () => {
      reject(new Error(`Failed to preload image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Checks if a URL is a valid image URL format
 * Note: This doesn't check if the image actually exists
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Check if it's a valid URL format
  try {
    const urlObj = new URL(url);
    return true;
  } catch (e) {
    // If it's a relative path, it might still be valid
    if (url.startsWith("/")) return true;
    return false;
  }
}

/**
 * Generates resource placeholder data for UI use
 * Used when an image fails to load or isn't available
 */
export function generateResourcePlaceholderData(
  resource: ResourceData,
  size: "sm" | "md" | "lg" = "md"
): { title: string; danceStyle?: string | null; size: "sm" | "md" | "lg" } {
  if (!resource || !resource.title) {
    return {
      title: "Unknown Resource",
      danceStyle: null,
      size,
    };
  }

  return {
    title: resource.title,
    danceStyle: resource.danceStyle || null,
    size,
  };
}

/**
 * Generates a preview URL for a resource
 * Used for thumbnails, cards, and featured items
 */
export function generateResourcePreviewUrl(
  resource: ResourceData,
  size: number = 300
): string {
  // If we have a valid imageUrl, use it
  if (resource.imageUrl) {
    return resource.imageUrl;
  }

  // If we have a thumbnailUrl, use that as fallback
  if (resource.thumbnailUrl) {
    return resource.thumbnailUrl;
  }

  // Generate a placeholder URL based on resource data
  return generateResourceImageUrl(resource);
}
