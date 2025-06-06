-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_module_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "ResourcePurchase" DROP CONSTRAINT "ResourcePurchase_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "ResourcePurchase" DROP CONSTRAINT "ResourcePurchase_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_user_id_fkey";

-- DropForeignKey
ALTER TABLE "StripeCustomer" DROP CONSTRAINT "StripeCustomer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Testimonial" DROP CONSTRAINT "Testimonial_user_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "UserCertification" DROP CONSTRAINT "UserCertification_course_id_fkey";

-- DropForeignKey
ALTER TABLE "UserCertification" DROP CONSTRAINT "UserCertification_user_id_fkey";

-- DropForeignKey
ALTER TABLE "_CourseCategories" DROP CONSTRAINT "_CourseCategories_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseCategories" DROP CONSTRAINT "_CourseCategories_B_fkey";

-- DropForeignKey
ALTER TABLE "_CourseTags" DROP CONSTRAINT "_CourseTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseTags" DROP CONSTRAINT "_CourseTags_B_fkey";

-- DropForeignKey
ALTER TABLE "user_features" DROP CONSTRAINT "user_features_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_role_mappings" DROP CONSTRAINT "user_role_mappings_user_id_fkey";
