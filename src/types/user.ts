export enum UserRole {
  GUEST_USER = 'GUEST_USER',
  CURRICULUM_SELLER = 'CURRICULUM_SELLER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  DIRECTORY_MEMBER = 'DIRECTORY_MEMBER',
  CERTIFICATION_MANAGER = 'CERTIFICATION_MANAGER',
  INSTRUCTOR_ADMIN = 'INSTRUCTOR_ADMIN',
  CURRICULUM_ADMIN = 'CURRICULUM_ADMIN',
  COURSE_CREATOR_ADMIN = 'COURSE_CREATOR_ADMIN',
  BOOKING_PROFESSIONAL = 'BOOKING_PROFESSIONAL',
  BOOKING_USER = 'BOOKING_USER'
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