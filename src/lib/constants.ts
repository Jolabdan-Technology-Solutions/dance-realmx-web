// Dance styles
export const DANCE_STYLES = [
  "Ballet", "Contemporary", "Hip Hop", "Jazz", "Tap", "Ballroom",
  "Latin", "Folk", "Modern", "Swing", "Breakdance", "Other"
];

// Age ranges
export const AGE_RANGES = [
  "All Ages", "Toddler (2-4)", "Children (5-8)", "Pre-Teen (9-12)",
  "Teen (13-17)", "Adult (18+)", "Senior (55+)"
];

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  "Beginner", "Intermediate", "Advanced", "Professional", "Mixed Levels"
];

// Resource types
export const RESOURCE_TYPES = [
  "document", "audio", "video", "image", "text", "spreadsheet", "other"
];

// The following constants are used for mapping resource types to friendly display names
export const RESOURCE_TYPE_DISPLAY_NAMES: Record<string, string> = {
  "document": "Document (PDF, Word, etc.)",
  "audio": "Audio",
  "video": "Video",
  "image": "Image",
  "text": "Text/Article",
  "spreadsheet": "Spreadsheet/CSV",
  "other": "Other"
};

// Default images to use when no image is available
export const DEFAULT_RESOURCE_IMAGE = "/images/default-resource.jpg";
export const DEFAULT_USER_IMAGE = "/images/default-user.jpg";
export const DEFAULT_SELLER_IMAGE = "/images/default-seller.jpg";
export const DEFAULT_INSTRUCTOR_IMAGE = "/images/default-instructor.jpg";
export const DEFAULT_PROFILE_IMAGE = "/images/default-profile.jpg";

// API endpoints
export const API_ENDPOINTS = {
  RESOURCES: {
    BASE: "/api/resources",
    TOGGLE_FEATURED: (resourceId: number) => `/api/resources/${resourceId}/toggle-featured`,
    BY_SELLER: (sellerId: number) => `/api/resources/seller/${sellerId}`,
    BY_CATEGORY: (categoryId: number) => `/api/resources/category/${categoryId}`,
    FEATURED: "/api/resources?featured=true",
    DETAILS: (resourceId: number) => `/api/resources/${resourceId}`,
    DOWNLOAD: (resourceId: number) => `/api/resources/${resourceId}/download`,
    REVIEWS: (resourceId: number) => `/api/resources/${resourceId}/reviews`
  },
  CURRICULUM: {
    BASE: "/api/curriculum",
    ALL: "/api/curriculum-all",
    DETAILS: (resourceId: number) => `/api/curriculum/${resourceId}`,
    DOWNLOAD: (resourceId: number) => `/api/curriculum/${resourceId}/download`,
    REVIEWS: (resourceId: number) => `/api/curriculum/${resourceId}/reviews`
  },
  CART: {
    BASE: "/api/cart",
    ADD: "/api/cart",
    REMOVE: (cartItemId: number) => `/api/cart/${cartItemId}`,
    UPDATE: (cartItemId: number) => `/api/cart/${cartItemId}`,
    REFRESH: "/api/cart/refresh"
  },
  USERS: {
    BASE: "/api/users",
    DETAILS: (userId: number) => `/api/users/${userId}`,
    CURRENT: "/api/user"
  },
  AUTH: {
    BASE: "/api/auth",
    LOGIN: "/api/login",
    REGISTER: "/api/register",
    LOGOUT: "/api/logout"
  },
  CHECKOUT: {
    BASE: "/api/checkout",
    SIMPLE: "/api/simple-checkout",
    CONFIRM: "/api/checkout/confirm",
    CANCEL: "/api/checkout/cancel"
  },
  ORDERS: {
    BASE: "/api/orders",
    RESOURCE_ORDERS: "/api/resource-orders",
    DETAILS: (orderId: number) => `/api/orders/${orderId}`
  },
  CATEGORIES: {
    BASE: "/api/categories",
    DETAILS: (categoryId: number) => `/api/categories/${categoryId}`
  },
  SELLERS: {
    BASE: "/api/sellers",
    DETAILS: (sellerId: number) => `/api/sellers/${sellerId}`
  },
  UPLOAD: {
    BASE: "/api/upload"
  },
  SUBSCRIPTION_PLANS: {
    BASE: "/api/subscriptions/plans"
  },
  COURSES: {
    BASE: "/api/courses"
  },
  ENROLLMENTS: {
    BASE: "/api/enrollments"
  },
  STRIPE_CONNECT: {
    BASE: "/api/stripe-connect",
    ACCOUNT_STATUS: "/api/stripe-connect/account-status"
  },
  ZIPCODE_LOOKUP: (zipcode: string) => `/api/zipcode-lookup/${zipcode}`
};