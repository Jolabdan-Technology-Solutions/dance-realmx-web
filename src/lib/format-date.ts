/**
 * Format a date into human-readable format
 * @param date Date to format
 * @param options Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  // If no date is provided, return empty string
  if (!date) return '';

  // Convert to Date object if it's not already
  const dateObj = date instanceof Date ? date : new Date(date);

  // Default formatting options
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  // Return formatted date
  try {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date to a short format (MM/DD/YYYY)
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatShortDate(date: Date | string | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

/**
 * Format a date with time
 * @param date Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a relative time (e.g., "5 minutes ago", "2 days ago")
 * @param date Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  
  // Convert milliseconds to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  // Less than a minute
  if (diffSec < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than a month (approximated as 30 days)
  if (diffSec < 2592000) {
    const days = Math.floor(diffSec / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Less than a year (approximated as 365 days)
  if (diffSec < 31536000) {
    const months = Math.floor(diffSec / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  // More than a year
  const years = Math.floor(diffSec / 31536000);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}