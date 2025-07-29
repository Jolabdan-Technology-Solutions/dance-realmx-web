"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = exports.getPaymentHistory = exports.handleStripeWebhook = exports.createPaymentIntent = exports.updateSubscription = exports.cancelSubscription = exports.createSubscription = exports.getSubscriptionPlans = exports.purchaseResource = exports.deleteResource = exports.updateResource = exports.createResource = exports.getResource = exports.getResources = exports.getOrders = exports.checkoutCart = exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.getCart = exports.addToCart = exports.getQuizAttempts = exports.submitQuiz = exports.getQuizQuestions = exports.addQuizQuestion = exports.getQuizzes = exports.createQuiz = exports.markLessonComplete = exports.deleteLesson = exports.updateLesson = exports.getLesson = exports.getLessons = exports.createLesson = exports.deleteModule = exports.updateModule = exports.getModules = exports.createModule = exports.getMyCourses = exports.enrollInCourse = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourse = exports.getCourses = exports.setUsername = exports.lookupUserByUsername = exports.registerUser = exports.getCurrentUser = exports.loginUser = exports.db = void 0;
exports.confirmUpload = exports.generateUploadUrl = exports.deleteConversation = exports.getUnreadMessageCount = exports.editMessage = exports.deleteMessage = exports.markMessagesRead = exports.getMessages = exports.getConversations = exports.sendMessage = exports.removeTagFromContent = exports.addTagToContent = exports.getTags = exports.createTag = exports.deleteCategory = exports.updateCategory = exports.getCategoryTree = exports.getCategories = exports.createCategory = exports.sendBulkNotification = exports.updateNotificationSettings = exports.getNotificationSettings = exports.createNotification = exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getUnreadNotificationCount = exports.getNotifications = exports.getReviewStats = exports.markReviewHelpful = exports.deleteReview = exports.updateReview = exports.getReviews = exports.createReview = exports.getClientBookings = exports.getProfessionalBookings = exports.updateBookingStatus = exports.bookProfessional = exports.searchProfessionals = exports.becomeProfessional = exports.getUserEnrollments = exports.getEnrollmentProgress = exports.updateEnrollmentProgress = exports.enrollInCourseAdvanced = exports.getUserAnalytics = exports.getUserProfile = exports.updateUserProfile = exports.cancelBooking = exports.updateBooking = exports.getBookings = void 0;
exports.getUserAnalyticsMain = exports.getCourseAnalytics = exports.getAdminAnalytics = exports.getInstructorAnalytics = exports.generateThumbnail = exports.getUserUploads = exports.deleteFile = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Firestore
exports.db = admin.firestore();
// Auth Functions
var auth_1 = require("./functions/auth");
Object.defineProperty(exports, "loginUser", { enumerable: true, get: function () { return auth_1.loginUser; } });
Object.defineProperty(exports, "getCurrentUser", { enumerable: true, get: function () { return auth_1.getCurrentUser; } });
Object.defineProperty(exports, "registerUser", { enumerable: true, get: function () { return auth_1.registerUser; } });
Object.defineProperty(exports, "lookupUserByUsername", { enumerable: true, get: function () { return auth_1.lookupUserByUsername; } });
Object.defineProperty(exports, "setUsername", { enumerable: true, get: function () { return auth_1.setUsername; } });
// Course Functions  
var courses_1 = require("./functions/courses");
Object.defineProperty(exports, "getCourses", { enumerable: true, get: function () { return courses_1.getCourses; } });
Object.defineProperty(exports, "getCourse", { enumerable: true, get: function () { return courses_1.getCourse; } });
Object.defineProperty(exports, "createCourse", { enumerable: true, get: function () { return courses_1.createCourse; } });
Object.defineProperty(exports, "updateCourse", { enumerable: true, get: function () { return courses_1.updateCourse; } });
Object.defineProperty(exports, "deleteCourse", { enumerable: true, get: function () { return courses_1.deleteCourse; } });
Object.defineProperty(exports, "enrollInCourse", { enumerable: true, get: function () { return courses_1.enrollInCourse; } });
Object.defineProperty(exports, "getMyCourses", { enumerable: true, get: function () { return courses_1.getMyCourses; } });
// Course Module Functions
var course_modules_1 = require("./functions/course-modules");
Object.defineProperty(exports, "createModule", { enumerable: true, get: function () { return course_modules_1.createModule; } });
Object.defineProperty(exports, "getModules", { enumerable: true, get: function () { return course_modules_1.getModules; } });
Object.defineProperty(exports, "updateModule", { enumerable: true, get: function () { return course_modules_1.updateModule; } });
Object.defineProperty(exports, "deleteModule", { enumerable: true, get: function () { return course_modules_1.deleteModule; } });
// Lesson Functions
var lessons_1 = require("./functions/lessons");
Object.defineProperty(exports, "createLesson", { enumerable: true, get: function () { return lessons_1.createLesson; } });
Object.defineProperty(exports, "getLessons", { enumerable: true, get: function () { return lessons_1.getLessons; } });
Object.defineProperty(exports, "getLesson", { enumerable: true, get: function () { return lessons_1.getLesson; } });
Object.defineProperty(exports, "updateLesson", { enumerable: true, get: function () { return lessons_1.updateLesson; } });
Object.defineProperty(exports, "deleteLesson", { enumerable: true, get: function () { return lessons_1.deleteLesson; } });
Object.defineProperty(exports, "markLessonComplete", { enumerable: true, get: function () { return lessons_1.markLessonComplete; } });
// Quiz Functions
var quizzes_1 = require("./functions/quizzes");
Object.defineProperty(exports, "createQuiz", { enumerable: true, get: function () { return quizzes_1.createQuiz; } });
Object.defineProperty(exports, "getQuizzes", { enumerable: true, get: function () { return quizzes_1.getQuizzes; } });
Object.defineProperty(exports, "addQuizQuestion", { enumerable: true, get: function () { return quizzes_1.addQuizQuestion; } });
Object.defineProperty(exports, "getQuizQuestions", { enumerable: true, get: function () { return quizzes_1.getQuizQuestions; } });
Object.defineProperty(exports, "submitQuiz", { enumerable: true, get: function () { return quizzes_1.submitQuiz; } });
Object.defineProperty(exports, "getQuizAttempts", { enumerable: true, get: function () { return quizzes_1.getQuizAttempts; } });
// Cart Functions
var cart_1 = require("./functions/cart");
Object.defineProperty(exports, "addToCart", { enumerable: true, get: function () { return cart_1.addToCart; } });
Object.defineProperty(exports, "getCart", { enumerable: true, get: function () { return cart_1.getCart; } });
Object.defineProperty(exports, "updateCartItem", { enumerable: true, get: function () { return cart_1.updateCartItem; } });
Object.defineProperty(exports, "removeFromCart", { enumerable: true, get: function () { return cart_1.removeFromCart; } });
Object.defineProperty(exports, "clearCart", { enumerable: true, get: function () { return cart_1.clearCart; } });
Object.defineProperty(exports, "checkoutCart", { enumerable: true, get: function () { return cart_1.checkoutCart; } });
Object.defineProperty(exports, "getOrders", { enumerable: true, get: function () { return cart_1.getOrders; } });
// Resource/Curriculum Functions
var resources_1 = require("./functions/resources");
Object.defineProperty(exports, "getResources", { enumerable: true, get: function () { return resources_1.getResources; } });
Object.defineProperty(exports, "getResource", { enumerable: true, get: function () { return resources_1.getResource; } });
Object.defineProperty(exports, "createResource", { enumerable: true, get: function () { return resources_1.createResource; } });
Object.defineProperty(exports, "updateResource", { enumerable: true, get: function () { return resources_1.updateResource; } });
Object.defineProperty(exports, "deleteResource", { enumerable: true, get: function () { return resources_1.deleteResource; } });
Object.defineProperty(exports, "purchaseResource", { enumerable: true, get: function () { return resources_1.purchaseResource; } });
// Subscription Functions
var subscriptions_1 = require("./functions/subscriptions");
Object.defineProperty(exports, "getSubscriptionPlans", { enumerable: true, get: function () { return subscriptions_1.getSubscriptionPlans; } });
Object.defineProperty(exports, "createSubscription", { enumerable: true, get: function () { return subscriptions_1.createSubscription; } });
Object.defineProperty(exports, "cancelSubscription", { enumerable: true, get: function () { return subscriptions_1.cancelSubscription; } });
Object.defineProperty(exports, "updateSubscription", { enumerable: true, get: function () { return subscriptions_1.updateSubscription; } });
// Payment Functions
var payments_1 = require("./functions/payments");
Object.defineProperty(exports, "createPaymentIntent", { enumerable: true, get: function () { return payments_1.createPaymentIntent; } });
Object.defineProperty(exports, "handleStripeWebhook", { enumerable: true, get: function () { return payments_1.handleStripeWebhook; } });
Object.defineProperty(exports, "getPaymentHistory", { enumerable: true, get: function () { return payments_1.getPaymentHistory; } });
// Booking Functions
var bookings_1 = require("./functions/bookings");
Object.defineProperty(exports, "createBooking", { enumerable: true, get: function () { return bookings_1.createBooking; } });
Object.defineProperty(exports, "getBookings", { enumerable: true, get: function () { return bookings_1.getBookings; } });
Object.defineProperty(exports, "updateBooking", { enumerable: true, get: function () { return bookings_1.updateBooking; } });
Object.defineProperty(exports, "cancelBooking", { enumerable: true, get: function () { return bookings_1.cancelBooking; } });
// User Functions
var users_1 = require("./functions/users");
Object.defineProperty(exports, "updateUserProfile", { enumerable: true, get: function () { return users_1.updateUserProfile; } });
Object.defineProperty(exports, "getUserProfile", { enumerable: true, get: function () { return users_1.getUserProfile; } });
Object.defineProperty(exports, "getUserAnalytics", { enumerable: true, get: function () { return users_1.getUserAnalytics; } });
// Enrollment Functions
var enrollment_1 = require("./functions/enrollment");
Object.defineProperty(exports, "enrollInCourseAdvanced", { enumerable: true, get: function () { return enrollment_1.enrollInCourseAdvanced; } });
Object.defineProperty(exports, "updateEnrollmentProgress", { enumerable: true, get: function () { return enrollment_1.updateEnrollmentProgress; } });
Object.defineProperty(exports, "getEnrollmentProgress", { enumerable: true, get: function () { return enrollment_1.getEnrollmentProgress; } });
Object.defineProperty(exports, "getUserEnrollments", { enumerable: true, get: function () { return enrollment_1.getUserEnrollments; } });
// Professional Booking Functions
var professional_booking_1 = require("./functions/professional-booking");
Object.defineProperty(exports, "becomeProfessional", { enumerable: true, get: function () { return professional_booking_1.becomeProfessional; } });
Object.defineProperty(exports, "searchProfessionals", { enumerable: true, get: function () { return professional_booking_1.searchProfessionals; } });
Object.defineProperty(exports, "bookProfessional", { enumerable: true, get: function () { return professional_booking_1.bookProfessional; } });
Object.defineProperty(exports, "updateBookingStatus", { enumerable: true, get: function () { return professional_booking_1.updateBookingStatus; } });
Object.defineProperty(exports, "getProfessionalBookings", { enumerable: true, get: function () { return professional_booking_1.getProfessionalBookings; } });
Object.defineProperty(exports, "getClientBookings", { enumerable: true, get: function () { return professional_booking_1.getClientBookings; } });
// Review Functions
var reviews_1 = require("./functions/reviews");
Object.defineProperty(exports, "createReview", { enumerable: true, get: function () { return reviews_1.createReview; } });
Object.defineProperty(exports, "getReviews", { enumerable: true, get: function () { return reviews_1.getReviews; } });
Object.defineProperty(exports, "updateReview", { enumerable: true, get: function () { return reviews_1.updateReview; } });
Object.defineProperty(exports, "deleteReview", { enumerable: true, get: function () { return reviews_1.deleteReview; } });
Object.defineProperty(exports, "markReviewHelpful", { enumerable: true, get: function () { return reviews_1.markReviewHelpful; } });
Object.defineProperty(exports, "getReviewStats", { enumerable: true, get: function () { return reviews_1.getReviewStats; } });
// Notification Functions
var notifications_1 = require("./functions/notifications");
Object.defineProperty(exports, "getNotifications", { enumerable: true, get: function () { return notifications_1.getNotifications; } });
Object.defineProperty(exports, "getUnreadNotificationCount", { enumerable: true, get: function () { return notifications_1.getUnreadNotificationCount; } });
Object.defineProperty(exports, "markNotificationRead", { enumerable: true, get: function () { return notifications_1.markNotificationRead; } });
Object.defineProperty(exports, "markAllNotificationsRead", { enumerable: true, get: function () { return notifications_1.markAllNotificationsRead; } });
Object.defineProperty(exports, "deleteNotification", { enumerable: true, get: function () { return notifications_1.deleteNotification; } });
Object.defineProperty(exports, "createNotification", { enumerable: true, get: function () { return notifications_1.createNotification; } });
Object.defineProperty(exports, "getNotificationSettings", { enumerable: true, get: function () { return notifications_1.getNotificationSettings; } });
Object.defineProperty(exports, "updateNotificationSettings", { enumerable: true, get: function () { return notifications_1.updateNotificationSettings; } });
Object.defineProperty(exports, "sendBulkNotification", { enumerable: true, get: function () { return notifications_1.sendBulkNotification; } });
// Category & Tag Functions
var categories_1 = require("./functions/categories");
Object.defineProperty(exports, "createCategory", { enumerable: true, get: function () { return categories_1.createCategory; } });
Object.defineProperty(exports, "getCategories", { enumerable: true, get: function () { return categories_1.getCategories; } });
Object.defineProperty(exports, "getCategoryTree", { enumerable: true, get: function () { return categories_1.getCategoryTree; } });
Object.defineProperty(exports, "updateCategory", { enumerable: true, get: function () { return categories_1.updateCategory; } });
Object.defineProperty(exports, "deleteCategory", { enumerable: true, get: function () { return categories_1.deleteCategory; } });
Object.defineProperty(exports, "createTag", { enumerable: true, get: function () { return categories_1.createTag; } });
Object.defineProperty(exports, "getTags", { enumerable: true, get: function () { return categories_1.getTags; } });
Object.defineProperty(exports, "addTagToContent", { enumerable: true, get: function () { return categories_1.addTagToContent; } });
Object.defineProperty(exports, "removeTagFromContent", { enumerable: true, get: function () { return categories_1.removeTagFromContent; } });
// Messaging Functions
var messaging_1 = require("./functions/messaging");
Object.defineProperty(exports, "sendMessage", { enumerable: true, get: function () { return messaging_1.sendMessage; } });
Object.defineProperty(exports, "getConversations", { enumerable: true, get: function () { return messaging_1.getConversations; } });
Object.defineProperty(exports, "getMessages", { enumerable: true, get: function () { return messaging_1.getMessages; } });
Object.defineProperty(exports, "markMessagesRead", { enumerable: true, get: function () { return messaging_1.markMessagesRead; } });
Object.defineProperty(exports, "deleteMessage", { enumerable: true, get: function () { return messaging_1.deleteMessage; } });
Object.defineProperty(exports, "editMessage", { enumerable: true, get: function () { return messaging_1.editMessage; } });
Object.defineProperty(exports, "getUnreadMessageCount", { enumerable: true, get: function () { return messaging_1.getUnreadMessageCount; } });
Object.defineProperty(exports, "deleteConversation", { enumerable: true, get: function () { return messaging_1.deleteConversation; } });
// File Upload Functions
var file_upload_1 = require("./functions/file-upload");
Object.defineProperty(exports, "generateUploadUrl", { enumerable: true, get: function () { return file_upload_1.generateUploadUrl; } });
Object.defineProperty(exports, "confirmUpload", { enumerable: true, get: function () { return file_upload_1.confirmUpload; } });
Object.defineProperty(exports, "deleteFile", { enumerable: true, get: function () { return file_upload_1.deleteFile; } });
Object.defineProperty(exports, "getUserUploads", { enumerable: true, get: function () { return file_upload_1.getUserUploads; } });
Object.defineProperty(exports, "generateThumbnail", { enumerable: true, get: function () { return file_upload_1.generateThumbnail; } });
// Analytics Functions
var analytics_1 = require("./functions/analytics");
Object.defineProperty(exports, "getInstructorAnalytics", { enumerable: true, get: function () { return analytics_1.getInstructorAnalytics; } });
Object.defineProperty(exports, "getAdminAnalytics", { enumerable: true, get: function () { return analytics_1.getAdminAnalytics; } });
Object.defineProperty(exports, "getCourseAnalytics", { enumerable: true, get: function () { return analytics_1.getCourseAnalytics; } });
Object.defineProperty(exports, "getUserAnalyticsMain", { enumerable: true, get: function () { return analytics_1.getUserAnalytics; } });
//# sourceMappingURL=index-bloated.js.map