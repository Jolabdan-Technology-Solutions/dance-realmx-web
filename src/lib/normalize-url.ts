/**
 * URL normalization utilities for making image paths work across any deployment environment
 */

/**
 * List of known development domains that should be removed from URLs
 * Add any additional testing or staging domains here
 */
export const DEV_DOMAINS = [
  'cdb3af24-bdfa-4abd-bc38-6fd1145ed012-00-zu0j8q1alywq.picard.replit.dev',
  'dancerealmx.replit.app',
  'replit.app',
  'repl.co',
  'replit.dev',
  'drx.dancerealmx.com'
];

/**
 * Checks if a URL appears to be an uploaded file path
 * @param url URL to check
 * @returns boolean indicating if the URL looks like an uploaded file
 */
function isUploadedFilePath(url: string): boolean {
  // Check for common patterns in uploaded file paths
  return (
    url.includes('/uploads/') || 
    url.includes('resource_') || 
    url.includes('profile_') || 
    url.includes('course_') ||
    url.includes('file-')
  );
}

/**
 * Normalizes a URL by:
 * 1. Removing hardcoded development domains
 * 2. Converting absolute URLs with domains to relative paths
 * 3. Handling duplicate query parameters
 * 4. Optionally adding cache busting parameters
 * 5. Special handling for uploaded files
 * 
 * @param url The URL to normalize
 * @param addCacheBusting Whether to add a cache busting parameter
 * @returns Normalized URL that will work across any deployment environment
 */
export function normalizeUrl(url: string | null | undefined, addCacheBusting = false): string {
  // Handle null/undefined URLs
  if (!url) return '';
  
  // Skip data URLs
  if (url.startsWith('data:')) return url;
  
  // Skip external service URLs (like UI Avatars or Unsplash)
  if (url.includes('ui-avatars.com') || 
      url.includes('unsplash.com') || 
      url.includes('placeholder.com')) {
    return url;
  }
  
  let normalizedUrl = url.trim();
  let originalUrl = url; // Keep the original for logging
  
  // Force HTTPS for any external HTTP URLs
  if (normalizedUrl.startsWith('http:') && !normalizedUrl.includes('localhost')) {
    normalizedUrl = normalizedUrl.replace('http:', 'https:');
  }
  
  // Handle hardcoded domains - convert to relative paths
  for (const domain of DEV_DOMAINS) {
    if (normalizedUrl.includes(domain)) {
      try {
        // Extract just the path portion
        const urlObj = new URL(normalizedUrl);
        normalizedUrl = urlObj.pathname + urlObj.search;
        console.log(`Normalized domain in URL: ${originalUrl} → ${normalizedUrl}`);
        break;
      } catch (e) {
        // If URL parsing fails, try a simple string replacement approach
        try {
          // Try to extract everything after the domain
          const domainPos = normalizedUrl.indexOf(domain);
          if (domainPos !== -1) {
            // Find where the path starts after the domain
            const pathStart = normalizedUrl.indexOf('/', domainPos + domain.length);
            if (pathStart !== -1) {
              normalizedUrl = normalizedUrl.substring(pathStart);
              console.log(`Simplified domain removal in URL: ${originalUrl} → ${normalizedUrl}`);
            }
          }
        } catch (stringError) {
          console.error(`Failed to normalize URL: ${normalizedUrl}`, stringError);
        }
      }
    }
  }
  
  // Fix URLs with duplicate query parameters (common issue with cache busting)
  if (normalizedUrl.includes('?v=') && normalizedUrl.indexOf('?v=') !== normalizedUrl.lastIndexOf('?v=')) {
    normalizedUrl = normalizedUrl.substring(0, normalizedUrl.lastIndexOf('?v='));
    console.log(`Fixed duplicate cache busting parameter: ${originalUrl} → ${normalizedUrl}`);
  }

  // Fix duplicate timestamp parameters
  if (normalizedUrl.includes('?t=') && normalizedUrl.indexOf('?t=') !== normalizedUrl.lastIndexOf('?t=')) {
    normalizedUrl = normalizedUrl.substring(0, normalizedUrl.lastIndexOf('?t='));
    console.log(`Fixed duplicate timestamp parameter: ${originalUrl} → ${normalizedUrl}`);
  }
  
  // Special handling for file uploads - ensure they have proper paths
  if (isUploadedFilePath(normalizedUrl)) {
    // Ensure uploads have the /uploads/ directory prefix
    if (!normalizedUrl.includes('/uploads/')) {
      // Add the uploads directory prefix
      const fileName = normalizedUrl.startsWith('/') 
        ? normalizedUrl.substring(1) 
        : normalizedUrl;
      
      // Parse out any query parameters
      const [fileNameBase, ...queryParts] = fileName.split('?');
      const queryString = queryParts.length > 0 ? `?${queryParts.join('?')}` : '';
      
      // Construct the proper path
      normalizedUrl = `/uploads/${fileNameBase}${queryString}`;
      console.log(`Added uploads prefix to file URL: ${originalUrl} → ${normalizedUrl}`);
    }
  }
  
  // Ensure URLs starting with '//' (protocol-relative) are converted to https
  if (normalizedUrl.startsWith('//')) {
    normalizedUrl = `https:${normalizedUrl}`;
  }
  
  // Add cache busting if requested and not already present
  if (addCacheBusting && !normalizedUrl.includes('?v=') && !normalizedUrl.includes('?t=')) {
    const separator = normalizedUrl.includes('?') ? '&' : '?';
    normalizedUrl = `${normalizedUrl}${separator}t=${Date.now()}`;
  }
  
  return normalizedUrl;
}

/**
 * Normalizes an image URL specifically for resources
 * This applies additional resource-specific handling
 */
export function normalizeResourceImageUrl(url: string | null | undefined, addCacheBusting = true): string {
  if (!url) return '';
  
  const originalUrl = url;
  
  // First do standard normalization
  let normalized = normalizeUrl(url, addCacheBusting);
  
  // Skip external service URLs
  if (normalized.includes('ui-avatars.com') || 
      normalized.includes('unsplash.com') || 
      normalized.startsWith('data:')) {
    return normalized;
  }
  
  // Check if this is already a correctly formatted resource path
  if (normalized.includes('/uploads/resources/')) {
    return normalized;
  }
  
  // Special cases for known resource patterns
  if (normalized.includes('resource_') || 
      normalized.includes('file-') || 
      normalized.includes('.pdf') || 
      normalized.includes('.jpg') || 
      normalized.includes('.jpeg') || 
      normalized.includes('.png')) {
    
    // Extract filename and query parameters
    const [filePath, ...queryParts] = normalized.split('?');
    const queryParams = queryParts.length > 0 ? `?${queryParts.join('?')}` : '';
    
    // Get just the filename without any path
    const fileName = filePath.includes('/') 
      ? filePath.substring(filePath.lastIndexOf('/') + 1) 
      : filePath;
    
    // Create the proper resources path
    normalized = `/uploads/resources/${fileName}${queryParams}`;
    console.log(`Applying resource image path normalization:`, {
      original: originalUrl,
      normalized: normalized
    });
  } else if (!normalized.startsWith('/')) {
    // Handle case where URL doesn't have a leading slash
    normalized = `/${normalized}`;
  }
  
  // Add a timestamp to bust cache if needed
  if (addCacheBusting && !normalized.includes('?t=')) {
    normalized = `${normalized}${normalized.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }
  
  return normalized;
}

/**
 * Normalizes a profile image URL
 * This applies additional profile-specific handling
 */
export function normalizeProfileImageUrl(url: string | null | undefined, addCacheBusting = true): string {
  if (!url) return '';
  
  const originalUrl = url;
  
  // First do standard normalization
  let normalized = normalizeUrl(url, addCacheBusting);
  
  // Additional profile-specific handling
  if (normalized && !normalized.includes('/uploads/profiles/') && 
     (normalized.includes('profile_') || normalized.includes('avatar'))) {
    
    // Extract filename and query parameters
    const [filePath, ...queryParts] = normalized.split('?');
    const queryParams = queryParts.length > 0 ? `?${queryParts.join('?')}` : '';
    
    // Get just the filename without any path
    const fileName = filePath.includes('/') 
      ? filePath.substring(filePath.lastIndexOf('/') + 1) 
      : filePath;
    
    // Create the proper profiles path
    normalized = `/uploads/profiles/${fileName}${queryParams}`;
    console.log(`Applying profile image fallback:`, {
      original: originalUrl,
      fallback: normalized
    });
  }
  
  return normalized;
}