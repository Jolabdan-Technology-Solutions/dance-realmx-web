// DanceRealmX Shared Schema Types
// This file exports TypeScript types and enums derived from the Prisma schema

import { z } from 'zod';

// User Roles
export const UserRoles = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  SELLER: 'seller',
  CURRICULUM_OFFICER: 'curriculum_officer',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

// Resource Types
export const ResourceTypes = {
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
  TEXT: 'text',
  BUNDLE: 'bundle',
  IMAGE: 'image',
} as const;

export type ResourceType = typeof ResourceTypes[keyof typeof ResourceTypes];

// Resource Status
export const ResourceStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;

export type ResourceStatusType = typeof ResourceStatus[keyof typeof ResourceStatus];

// Subscription Plan Types
export const SubscriptionPlanTypes = {
  MAIN: 'main',
  SELLER: 'seller',
  BOOKING: 'booking',
} as const;

export type SubscriptionPlanType = typeof SubscriptionPlanTypes[keyof typeof SubscriptionPlanTypes];

// Subscription Status
export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
} as const;

export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

// Order Status
export const OrderStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Booking Request Status
export const BookingRequestStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type BookingRequestStatusType = typeof BookingRequestStatus[keyof typeof BookingRequestStatus];

// Booking Appointment Status
export const BookingAppointmentStatus = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export type BookingAppointmentStatusType = typeof BookingAppointmentStatus[keyof typeof BookingAppointmentStatus];

// Activity Types
export const ActivityTypes = {
  LESSON_VIEW: 'LESSON_VIEW',
  LESSON_COMPLETE: 'LESSON_COMPLETE',
  QUIZ_PASS: 'QUIZ_PASS',
  QUIZ_FAIL: 'QUIZ_FAIL',
} as const;

export type ActivityType = typeof ActivityTypes[keyof typeof ActivityTypes];

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
  imageUrl?: string;
  price: number;
  instructorId: number;
  visible: boolean;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  price: number;
  resourceType: ResourceType;
  status: ResourceStatusType;
  sellerId: number;
  isApproved: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  isPopular: boolean;
  isActive: boolean;
  planType: SubscriptionPlanType;
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
export * from './types'; 
