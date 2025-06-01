/**
 * Route Checker - Simple utility to verify essential routes are present
 * 
 * This should be run during development to make sure critical routes
 * haven't been accidentally removed.
 */

// These are the essential routes that MUST be maintained
// If any of these are missing from App.tsx, it's a problem
export const ESSENTIAL_ROUTES = [
  // Core routes
  "/",
  "/auth",
  
  // Curriculum module routes
  "/curriculum",
  "/curriculum/:resourceId",
  "/curriculum/upload",
  "/upload-resource",  // Legacy but still supported
  "/curriculum/:id/edit",
  "/my-resources",
  
  // Cart module routes
  "/cart",
  "/checkout",
  "/simple-checkout",
  "/payment-success",
  "/my-purchases",
  
  // Dashboard routes
  "/dashboard",
  "/dashboard/user",
  "/profile",
  "/profile/edit",
  
  // Booking module routes
  "/connect",
  "/my-bookings",
  
  // Subscription routes
  "/subscription",
  "/subscription/success"
];

// Simple function to call during development to verify routes
export function checkEssentialRoutes(appRoutes: string[]): string[] {
  return ESSENTIAL_ROUTES.filter(route => !appRoutes.includes(route));
}