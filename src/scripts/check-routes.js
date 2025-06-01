/**
 * Simple script to validate that no essential routes are missing
 * 
 * This should be run whenever changes are made to App.tsx
 */

const fs = require('fs');
const path = require('path');

// Key routes that must be present in App.tsx
const ESSENTIAL_ROUTES = [
  // Core routes
  { path: "/", type: "Route" },
  { path: "/auth", type: "Route" },
  
  // Curriculum module routes
  { path: "/curriculum", type: "GuestRoute" },
  { path: "/curriculum/:resourceId", type: "GuestRoute" },
  { path: "/curriculum/upload", type: "ProtectedRoute" },
  { path: "/upload-resource", type: "ProtectedRoute" },  // Legacy but still supported
  { path: "/curriculum/:id/edit", type: "ProtectedRoute" },
  { path: "/my-resources", type: "ProtectedRoute" },
  
  // Cart module routes
  { path: "/cart", type: "Route" },
  { path: "/checkout", type: "ProtectedRoute" },
  { path: "/simple-checkout", type: "Route" },
  { path: "/payment-success", type: "Route" },
  { path: "/my-purchases", type: "ProtectedRoute" },
  
  // Dashboard routes
  { path: "/dashboard", type: "Route" },
  { path: "/dashboard/user", type: "ProtectedRoute" },
  { path: "/profile", type: "ProtectedRoute" },
  { path: "/profile/edit", type: "ProtectedRoute" },
  
  // Booking module routes
  { path: "/connect", type: "Route" },
  { path: "/my-bookings", type: "ProtectedRoute" },
  
  // Subscription routes
  { path: "/subscription", type: "Route" },
  { path: "/subscription/success", type: "Route" }
];

// Path to App.tsx
const APP_PATH = path.resolve(__dirname, '../../src/App.tsx');

// Extract routes and their protection types from App.tsx
function extractRoutes() {
  try {
    const appContent = fs.readFileSync(APP_PATH, 'utf8');
    
    // Find all route definitions
    const routes = [];
    
    // Extract <Route path="...">
    const routeRegex = /<Route\s+path=["']([^"']+)["']/g;
    let match;
    while ((match = routeRegex.exec(appContent)) !== null) {
      routes.push({ path: match[1], type: "Route" });
    }
    
    // Extract <ProtectedRoute path="...">
    const protectedRouteRegex = /<ProtectedRoute\s+path=["']([^"']+)["']/g;
    while ((match = protectedRouteRegex.exec(appContent)) !== null) {
      routes.push({ path: match[1], type: "ProtectedRoute" });
    }
    
    // Extract <GuestRoute path="...">
    const guestRouteRegex = /<GuestRoute\s+path=["']([^"']+)["']/g;
    while ((match = guestRouteRegex.exec(appContent)) !== null) {
      routes.push({ path: match[1], type: "GuestRoute" });
    }
    
    // Extract <AdminRoute path="...">
    const adminRouteRegex = /<AdminRoute\s+path=["']([^"']+)["']/g;
    while ((match = adminRouteRegex.exec(appContent)) !== null) {
      routes.push({ path: match[1], type: "AdminRoute" });
    }
    
    return routes;
  } catch (error) {
    console.error('Failed to extract routes:', error);
    return [];
  }
}

// Validate that all essential routes exist
function validateRoutes() {
  const appRoutes = extractRoutes();
  
  console.log(`Found ${appRoutes.length} routes in App.tsx`);
  
  // Check if any essential routes are missing
  const missingRoutes = ESSENTIAL_ROUTES.filter(essentialRoute => 
    !appRoutes.some(appRoute => 
      appRoute.path === essentialRoute.path && 
      appRoute.type === essentialRoute.type
    )
  );
  
  // Check if any essential routes have wrong protection type
  const wrongProtectionRoutes = ESSENTIAL_ROUTES.filter(essentialRoute => 
    appRoutes.some(appRoute => 
      appRoute.path === essentialRoute.path && 
      appRoute.type !== essentialRoute.type
    )
  );
  
  if (missingRoutes.length > 0) {
    console.error('❌ Missing essential routes:');
    missingRoutes.forEach(route => 
      console.error(`  - ${route.path} (${route.type})`)
    );
  }
  
  if (wrongProtectionRoutes.length > 0) {
    console.error('⚠️ Routes with incorrect protection:');
    wrongProtectionRoutes.forEach(route => {
      const actualRoute = appRoutes.find(r => r.path === route.path);
      console.error(`  - ${route.path} (expected: ${route.type}, actual: ${actualRoute ? actualRoute.type : 'missing'})`);
    });
  }
  
  if (missingRoutes.length === 0 && wrongProtectionRoutes.length === 0) {
    console.log('✅ All essential routes are present with correct protection!');
    return true;
  } else {
    return false;
  }
}

// Run validation
const isValid = validateRoutes();
if (!isValid) {
  process.exit(1);
}