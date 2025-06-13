export enum UserRole {
  STUDENT = "STUDENT",
  PROFESSIONAL = "PROFESSIONAL",
  SELLER = "SELLER",
  ADMIN = "ADMIN",
  CURRICULUM_ADMIN = "CURRICULUM_ADMIN",
  INSTRUCTOR = "INSTRUCTOR",
  COURSE_CREATOR = "COURSE_CREATOR",
  CERTIFICATION_MANAGER = "CERTIFICATION_MANAGER",
  DIRECTORY_MEMBER = "DIRECTORY_MEMBER",
  BOOKING_PROFESSIONAL = "BOOKING_PROFESSIONAL",
  BOOKING_USER = "BOOKING_USER",
  INSTRUCTOR_ADMIN = "INSTRUCTOR_ADMIN",
  COURSE_CREATOR_ADMIN = "COURSE_CREATOR_ADMIN"
}

export interface UserRoleMapping {
  id: number;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  profile_image_url: string | null;
  profileImageUrl?: string | null;
  auth_provider: string | null;
  created_at: Date;
  updated_at: Date;
  frequency: string | null;
  is_active: boolean | null;
  bio?: string | null;
  subscription_plan?: string | null;
  subscriptionPlan?: string | null;
  subscription_status?: string | null;
  subscriptionStatus?: string | null;
  subscription_expires_at?: Date | null;
  subscriptionExpiresAt?: Date | null;
  role_mappings: UserRoleMapping[];
  subscription_tier?: string;
}
