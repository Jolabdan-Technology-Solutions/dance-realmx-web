/**
 * Route Registry - Central repository of all application routes
 * 
 * This registry helps prevent accidental route removal and provides a central
 * reference for all application routes. Using this system:
 * 
 * 1. All routes are registered in a single location
 * 2. Routes can be categorized by module or feature
 * 3. We can detect missing or invalid routes during development
 * 4. We maintain a history of previously working routes
 */

export type RouteConfig = {
  path: string;
  component: string;
  isProtected: boolean;
  isAdmin?: boolean;
  isGuest?: boolean;
  legacyPaths?: string[];
  module: string;
  description?: string;
};

/**
 * Core application routes organized by module
 */
export const ROUTE_REGISTRY: RouteConfig[] = [
  // Home & Auth
  { 
    path: "/", 
    component: "HomePage",
    isProtected: false,
    module: "core",
    description: "Landing page with featured content" 
  },
  { 
    path: "/auth", 
    component: "AuthPage",
    isProtected: false,
    module: "auth",
    description: "Login and registration page" 
  },
  { 
    path: "/register", 
    component: "RegistrationFlowPage",
    isProtected: false,
    module: "auth",
    description: "Multi-step registration and subscription flow" 
  },
  
  // Course Certification Module
  { 
    path: "/courses", 
    component: "CoursesPage",
    isProtected: false,
    module: "certification",
    description: "Course listings page" 
  },
  { 
    path: "/courses/:id", 
    component: "CourseDetailsPage",
    isProtected: false,
    module: "certification",
    description: "Course details page" 
  },
  { 
    path: "/courses/:courseId/modules/:moduleId", 
    component: "CourseModulePage",
    isProtected: true,
    module: "certification",
    description: "Course module page" 
  },
  { 
    path: "/courses/:courseId/modules/:moduleId/lessons/:lessonId", 
    component: "LessonPage",
    isProtected: true,
    module: "certification",
    description: "Lesson page" 
  },
  { 
    path: "/courses/:courseId/modules/:moduleId/quizzes/:quizId", 
    component: "QuizPage",
    isProtected: true,
    module: "certification",
    description: "Quiz page" 
  },
  { 
    path: "/my-certifications", 
    component: "MyCertificationsPage",
    isProtected: true,
    module: "certification",
    description: "User certifications page" 
  },
  { 
    path: "/certificate-templates", 
    component: "CertificateTemplatesPage",
    isProtected: true,
    module: "certification",
    description: "Certificate templates management page" 
  },
  { 
    path: "/certificates/:certificateId", 
    component: "CertificatePage",
    isProtected: true,
    module: "certification",
    description: "Certificate display page" 
  },
  
  // Connect - Booking Module
  { 
    path: "/connect", 
    component: "ConnectPageNew",
    isProtected: false,
    module: "connect",
    description: "Connect main page" 
  },
  { 
    path: "/connect-updated", 
    component: "ConnectPageUpdated",
    isProtected: false,
    module: "connect",
    description: "Updated connect page" 
  },
  { 
    path: "/connect-old", 
    component: "Connect",
    isProtected: false,
    module: "connect",
    description: "Legacy connect page" 
  },
  { 
    path: "/connect/book/:instructorId", 
    component: "Booking",
    isProtected: true,
    module: "connect",
    description: "Booking page for instructor" 
  },
  { 
    path: "/connect/profile", 
    component: "InstructorProfile",
    isProtected: true,
    module: "connect",
    description: "Instructor profile page" 
  },
  { 
    path: "/instructors/:instructorId", 
    component: "InstructorProfile",
    isProtected: false,
    module: "connect",
    description: "Public instructor profile page" 
  },
  { 
    path: "/instructors/:instructorId/book", 
    component: "Booking",
    isProtected: true,
    module: "connect",
    description: "Book instructor page" 
  },
  { 
    path: "/my-bookings", 
    component: "MyBookings",
    isProtected: true,
    module: "connect",
    description: "User's bookings page" 
  },
  
  // Curriculum Resource Module
  { 
    path: "/curriculum", 
    component: "Curriculum",
    isProtected: false,
    isGuest: true,
    module: "curriculum",
    description: "Curriculum resources page" 
  },
  { 
    path: "/curriculum/:resourceId", 
    component: "ResourceDetails",
    isProtected: false,
    isGuest: true,
    module: "curriculum",
    description: "Resource details page" 
  },
  { 
    path: "/curriculum/upload", 
    component: "UploadResource",
    isProtected: true,
    module: "curriculum",
    description: "Upload resource page",
    legacyPaths: ["/upload-resource"] 
  },
  { 
    path: "/upload-resource", 
    component: "UploadResource",
    isProtected: true,
    module: "curriculum",
    description: "Legacy upload resource page" 
  },
  { 
    path: "/curriculum/:id/edit", 
    component: "EditResource",
    isProtected: true,
    module: "curriculum",
    description: "Edit resource page" 
  },
  { 
    path: "/sellers/:sellerId", 
    component: "SellerStore",
    isProtected: false,
    isGuest: true,
    module: "curriculum",
    description: "Seller store page" 
  },
  { 
    path: "/seller-store/:sellerId", 
    component: "SellerStore",
    isProtected: false,
    isGuest: true,
    module: "curriculum",
    description: "Alternate seller store page" 
  },
  { 
    path: "/my-store", 
    component: "SellerStore",
    isProtected: true,
    module: "curriculum",
    description: "Current user's store page" 
  },
  { 
    path: "/my-resources", 
    component: "MyResources",
    isProtected: true,
    module: "curriculum",
    description: "Current user's resources page" 
  },
  
  // Legacy Resources Module (redirects to Curriculum)
  { 
    path: "/resources", 
    component: "RedirectToCurriculum",
    isProtected: false,
    module: "curriculum",
    description: "Legacy resources page (redirects)" 
  },
  { 
    path: "/resources/:resourceId", 
    component: "RedirectToCurriculumResource",
    isProtected: false,
    module: "curriculum",
    description: "Legacy resource details page (redirects)" 
  },
  { 
    path: "/resources/:id/edit", 
    component: "RedirectToCurriculumEdit",
    isProtected: false,
    module: "curriculum",
    description: "Legacy edit resource page (redirects)" 
  },
  
  // Subscription Module
  { 
    path: "/subscription", 
    component: "Subscription",
    isProtected: false,
    module: "subscription",
    description: "Subscription page" 
  },
  { 
    path: "/subscription/success", 
    component: "SubscriptionSuccess",
    isProtected: false,
    module: "subscription",
    description: "Subscription success page" 
  },
  { 
    path: "/pricing", 
    component: "Pricing",
    isProtected: false,
    module: "subscription",
    description: "Pricing page" 
  },
  
  // Shopping Cart and Checkout Module
  { 
    path: "/cart", 
    component: "Cart",
    isProtected: false,
    module: "cart",
    description: "Shopping cart page" 
  },
  { 
    path: "/checkout", 
    component: "Checkout",
    isProtected: true,
    module: "cart",
    description: "Checkout page" 
  },
  { 
    path: "/simple-checkout", 
    component: "SimpleCheckout",
    isProtected: false,
    module: "cart",
    description: "Simple checkout page" 
  },
  { 
    path: "/payment-success", 
    component: "PaymentSuccess",
    isProtected: false,
    module: "cart",
    description: "Payment success page" 
  },
  { 
    path: "/my-purchases", 
    component: "MyPurchases",
    isProtected: true,
    module: "cart",
    description: "User purchases page" 
  },
  
  // Dashboard and Profile
  { 
    path: "/my-dashboard", 
    component: "DashboardRedirect",
    isProtected: true,
    module: "dashboard",
    description: "Dashboard redirect" 
  },
  { 
    path: "/dashboard", 
    component: "DashboardRedirect",
    isProtected: true,
    module: "dashboard",
    description: "Dashboard redirect" 
  },
  { 
    path: "/dashboard/user", 
    component: "Dashboard",
    isProtected: true,
    module: "dashboard",
    description: "User dashboard" 
  },
  { 
    path: "/seller-dashboard", 
    component: "SellerDashboard",
    isProtected: true,
    module: "dashboard",
    description: "Seller dashboard" 
  },
  { 
    path: "/seller/payments", 
    component: "SellerPayments",
    isProtected: true,
    module: "dashboard",
    description: "Seller payments page" 
  },
  { 
    path: "/profile", 
    component: "ProfileEdit",
    isProtected: true,
    module: "dashboard",
    description: "Profile edit page" 
  },
  { 
    path: "/profile/edit", 
    component: "ProfileEdit",
    isProtected: true,
    module: "dashboard",
    description: "Profile edit page" 
  },
  { 
    path: "/profile/:userId", 
    component: "UserProfile",
    isProtected: false,
    module: "dashboard",
    description: "Public user profile page" 
  },
  
  // Instructor Pages
  { 
    path: "/instructor/dashboard", 
    component: "InstructorDashboard",
    isProtected: true,
    module: "instructor",
    description: "Instructor dashboard" 
  },
  { 
    path: "/instructor/courses/create", 
    component: "CourseCreate",
    isProtected: true,
    module: "instructor",
    description: "Create course page" 
  },
  { 
    path: "/instructor/courses/:id", 
    component: "CourseDetail",
    isProtected: true,
    module: "instructor",
    description: "Course details for instructor" 
  },
  
  // Admin Routes
  { 
    path: "/admin", 
    component: "AdminDashboard",
    isProtected: true,
    isAdmin: true,
    module: "admin",
    description: "Admin dashboard" 
  },
  // ... Admin routes follow same pattern
];

/**
 * Helper function to get all routes for a specific module
 */
export function getModuleRoutes(moduleName: string): RouteConfig[] {
  return ROUTE_REGISTRY.filter(route => route.module === moduleName);
}

/**
 * Helper function to find a route by path
 */
export function findRouteByPath(path: string): RouteConfig | undefined {
  return ROUTE_REGISTRY.find(route => route.path === path);
}

/**
 * Helper function to find routes with legacy paths that should redirect
 */
export function getLegacyRedirectRoutes(): RouteConfig[] {
  return ROUTE_REGISTRY.filter(route => route.legacyPaths && route.legacyPaths.length > 0);
}

/**
 * Helper function to validate that all routes in the registry exist in App.tsx
 * This would be used in a development check script
 */
export function validateRouteRegistry(
  appRoutes: string[]
): { missing: string[], extra: string[] } {
  const registryPaths = ROUTE_REGISTRY.map(r => r.path);
  
  // Find routes in registry that don't exist in app
  const missing = registryPaths.filter(path => !appRoutes.includes(path));
  
  // Find routes in app that aren't in the registry
  const extra = appRoutes.filter(path => !registryPaths.includes(path));
  
  return { missing, extra };
}