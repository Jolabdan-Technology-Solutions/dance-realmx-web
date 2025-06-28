import { Feature } from './enums/feature.enum';
import { UserRole } from '@prisma/client';

export const FeatureRoleMap: Record<Feature, UserRole[]> = {
  // Curriculum & Courses
  [Feature.PURCHASE_CURRICULUM]: [
    UserRole.DIRECTORY_MEMBER,
    UserRole.CURRICULUM_SELLER,
    UserRole.CERTIFICATION_MANAGER,
    UserRole.ADMIN,
  ],
  [Feature.SELL_CURRICULUM]: [
    UserRole.CURRICULUM_SELLER,
    UserRole.CERTIFICATION_MANAGER,
    UserRole.ADMIN,
  ],
  [Feature.CREATE_COURSES]: [
    UserRole.CURRICULUM_SELLER,
    UserRole.INSTRUCTOR_ADMIN,
    UserRole.ADMIN,
  ],
  [Feature.MANAGE_COURSES]: [
    UserRole.CURRICULUM_SELLER,
    UserRole.INSTRUCTOR_ADMIN,
    UserRole.ADMIN,
  ],
  [Feature.ENROLL_COURSES]: [
    UserRole.STUDENT,
    UserRole.INSTRUCTOR_ADMIN,
    UserRole.ADMIN,
  ],
  [Feature.VIEW_COURSES]: [
    UserRole.STUDENT,
    UserRole.INSTRUCTOR_ADMIN,
    UserRole.ADMIN,
  ],

  // Professional Booking
  [Feature.SEARCH_PROFESSIONALS]: [
    UserRole.DIRECTORY_MEMBER,
    UserRole.CURRICULUM_SELLER,
    UserRole.CERTIFICATION_MANAGER,
    UserRole.ADMIN,
  ],
  [Feature.BE_BOOKED]: [
    UserRole.CURRICULUM_SELLER,
    UserRole.CERTIFICATION_MANAGER,
    UserRole.ADMIN,
  ],
  [Feature.CONTACT_BOOK]: [UserRole.CERTIFICATION_MANAGER, UserRole.ADMIN],
  [Feature.CREATE_BOOKINGS]: [UserRole.STUDENT, UserRole.ADMIN],
  [Feature.MANAGE_BOOKINGS]: [UserRole.STUDENT, UserRole.ADMIN],

  // Certifications
  [Feature.TAKE_CERT_COURSE]: [
    UserRole.DIRECTORY_MEMBER,
    UserRole.CURRICULUM_SELLER,
    UserRole.CERTIFICATION_MANAGER,
    UserRole.ADMIN,
  ],
  [Feature.MANAGE_CERTIFICATIONS]: [
    UserRole.CERTIFICATION_MANAGER,
    UserRole.ADMIN,
  ],

  // Instructor Features
  [Feature.INSTRUCTOR_ANALYTICS]: [UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN],
  [Feature.MANAGE_INSTRUCTORS]: [UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN],

  // Admin Features
  [Feature.ADMIN_PANEL]: [UserRole.ADMIN],
  [Feature.MANAGE_SUBSCRIPTIONS]: [UserRole.ADMIN],
  [Feature.MANAGE_PAYMENTS]: [UserRole.ADMIN],
  [Feature.MANAGE_CATEGORIES]: [UserRole.ADMIN],
  [Feature.MANAGE_TENANTS]: [UserRole.ADMIN],
  [Feature.MANAGE_FEATURE_FLAGS]: [UserRole.ADMIN],

  // Cart & Payments
  [Feature.USE_CART]: [UserRole.STUDENT, UserRole.BOOKING_USER],
  [Feature.MAKE_PAYMENTS]: [UserRole.STUDENT, UserRole.ADMIN],
  [Feature.VIEW_PAYMENT_HISTORY]: [UserRole.STUDENT, UserRole.ADMIN],

  // Premium Features
  [Feature.FEATURED_SELLER]: [UserRole.ADMIN],

  // Resources
  [Feature.MANAGE_RESOURCES]: [
    UserRole.CURRICULUM_SELLER,
    UserRole.INSTRUCTOR,
    UserRole.ADMIN,
  ],
  [Feature.ACCESS_RESOURCES]: [
    UserRole.STUDENT,
    UserRole.INSTRUCTOR,
    UserRole.ADMIN,
  ],
};
