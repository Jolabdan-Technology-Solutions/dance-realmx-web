// Stubs for shared schema types and constants used in the frontend
// Expand these as needed to match backend types

export interface User {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  bio?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
    website?: string;
  };
  dance_styles?: string[];
  experience_years?: number;
  teaching_credentials?: string;
  seller_bio?: string;
  is_approved_seller?: boolean;
  approved_seller_at?: string;
  roles?: string[];
  role?: UserRole;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  title: string;
  short_name?: string;
  description?: string;
  detailed_description?: string;
  image_url?: string;
  preview_video_url?: string;
  full_video_url?: string;
  price?: string | number;
  instructor_id?: string;
  instructor_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // ...add more fields as needed
}

export interface Resource {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  detailed_description?: string;
  tags?: string[];
  dance_style?: string;
  age_range?: string;
  difficulty_level?: string;
  image_url?: string;
  thumbnail_url?: string;
  file_path?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  resource_type?: string;
  preview_url?: string;
  preview_video_url?: string;
  full_video_url?: string;
  price?: string | number;
  price_premium?: string | number;
  price_royalty?: string | number;
  stripe_product_id?: string;
  stripe_price_id?: string;
  stripe_price_premium_id?: string;
  stripe_price_royalty_id?: string;
  is_featured?: boolean;
  is_approved?: boolean;
  approved_by_id?: string;
  approved_at?: string;
  status?: string;
  download_count?: number;
  sale_count?: number;
  view_count?: number;
  rating?: number | string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  related_course_id?: string;
  // ...add more fields as needed
}

export interface ResourceCategory {
  id: string;
  name: string;
}

export interface ResourceReview {
  id: string;
  resource_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface InstructorAvailability {
  id: string;
  instructor_id: string;
  available_from: string;
  available_to: string;
}

export interface BookingException {
  id: string;
  date: string;
  reason?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
}

export interface ResourceOrder {
  id: string;
  resource_id: string;
  user_id: string;
  status: string;
  created_at?: string;
}

export interface ResourcePurchase {
  id: string;
  resource_id: string;
  user_id: string;
  purchased_at: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issue_date: string;
  status: string;
  verification_code: string;
  recipient: string;
  course: Course;
}

export interface Booking {
  id: string;
  user_id: string;
  instructor_id: string;
  course_id?: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  status: string;
  payment_status?: string;
  participants?: number;
  notes?: string;
  price?: number | string;
  created_at?: string;
  updated_at?: string;
}

export const USER_ROLES = ["admin", "instructor", "student"] as const;
export type UserRole = typeof USER_ROLES[number];

export const SUBSCRIPTION_PLANS = [
  { id: "basic", name: "Basic", price: 0 },
  { id: "pro", name: "Pro", price: 20 },
  { id: "premium", name: "Premium", price: 50 }
];

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  price_monthly?: number;
  price_yearly?: number;
  description?: string;
  slug?: string;
}

export interface SubscriptionPlanOption {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description?: string;
  slug?: string;
  matched_features?: number;
}
