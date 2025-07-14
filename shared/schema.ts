// DanceRealmX Shared Schema Types
// This file exports TypeScript types and enums derived from the Prisma schema

import { z } from "zod";

// User Roles
export const UserRoles = {
  GUEST_USER: "guest_user",
  CURRICULUM_SELLER: "curriculum_seller",
  STUDENT: "student",
  ADMIN: "admin",
  DIRECTORY_MEMBER: "directory_member",
  CERTIFICATION_MANAGER: "certification_manager",
  INSTRUCTOR_ADMIN: "instructor_admin",
  CURRICULUM_ADMIN: "curriculum_admin",
  COURSE_CREATOR_ADMIN: "course_creator_admin",
  BOOKING_PROFESSIONAL: "booking_professional",
  BOOKING_USER: "booking_user",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

// Resource Types
export const ResourceTypes = {
  DOCUMENT: "document",
  VIDEO: "video",
  AUDIO: "audio",
  TEXT: "text",
  BUNDLE: "bundle",
  IMAGE: "image",
} as const;

export type ResourceType = (typeof ResourceTypes)[keyof typeof ResourceTypes];

// Resource Status
export const ResourceStatus = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  PUBLISHED: "published",
  REJECTED: "rejected",
  ARCHIVED: "archived",
} as const;

export type ResourceStatusType =
  (typeof ResourceStatus)[keyof typeof ResourceStatus];

// Subscription Plan Types
export const SubscriptionPlanTypes = {
  MAIN: "main",
  SELLER: "seller",
  BOOKING: "booking",
} as const;

export type SubscriptionPlanType =
  (typeof SubscriptionPlanTypes)[keyof typeof SubscriptionPlanTypes];

// Subscription Status
export const SubscriptionStatus = {
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  UNPAID: "unpaid",
} as const;

export type SubscriptionStatusType =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

// Order Status
export const OrderStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

// Booking Request Status
export const BookingRequestStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type BookingRequestStatusType =
  (typeof BookingRequestStatus)[keyof typeof BookingRequestStatus];

// Booking Appointment Status
export const BookingAppointmentStatus = {
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

export type BookingAppointmentStatusType =
  (typeof BookingAppointmentStatus)[keyof typeof BookingAppointmentStatus];

// Activity Types
export const ActivityTypes = {
  LESSON_VIEW: "LESSON_VIEW",
  LESSON_COMPLETE: "LESSON_COMPLETE",
  QUIZ_PASS: "QUIZ_PASS",
  QUIZ_FAIL: "QUIZ_FAIL",
} as const;

export type ActivityType = (typeof ActivityTypes)[keyof typeof ActivityTypes];

// Common Interfaces
export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  roles: string[];
  profileImageUrl?: string;
  profile_image_url?: string;
  isApprovedSeller: boolean;
  subscriptionPlan: string;
  subscriptionStatus?: string;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface Course {
  id: number;
  title: string;
  shortName: string;
  description?: string;
  image_url?: string;
  price: number;
  instructor_id: number;
  visible: boolean;
  category_id?: number;
  difficulty_level?: string;
  duration?: string;
  created_at?: string;
  updated_at?: string;
  featured?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  price: number;
  resourceType: ResourceType;
  status: ResourceStatusType;
  seller_id: number;
  isApproved: boolean;
}

export interface ResourceReview {
  id: string;
  resource_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
  createdAt?: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  features: string[];
  priceMonthly: string;
  priceYearly: string;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  isPopular: boolean;
  isActive: boolean;
  isStandalone: boolean;
  planType: SubscriptionPlanType;
  featureDetails: any | null;
  unlockedRoles: string[];
  tier: string;
  created_at: string;
  updated_at: string;
}

// Export USER_ROLES as an alias for UserRoles for backward compatibility
export const USER_ROLES = UserRoles;

// Subscription Plan Schema
export const insertSubscriptionPlanSchema = {
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  features: z.array(z.string()),
  priceMonthly: z.number().min(0, "Monthly price must be 0 or greater"),
  priceYearly: z.number().min(0, "Yearly price must be 0 or greater"),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  planType: z.enum([
    SubscriptionPlanTypes.MAIN,
    SubscriptionPlanTypes.SELLER,
    SubscriptionPlanTypes.BOOKING,
  ]),
};

// Export all types
export * from "./types";
