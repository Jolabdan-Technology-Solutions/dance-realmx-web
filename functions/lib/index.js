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
exports.becomeProfessional = exports.sendBulkNotification = exports.enrollInCourseAdvanced = exports.handleStripeWebhook = exports.createPaymentIntent = exports.setUsername = exports.lookupUserByUsername = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Firestore
exports.db = admin.firestore();
// === ESSENTIAL CLOUD FUNCTIONS ONLY ===
// Auth Helpers (custom logic required)
var auth_1 = require("./functions/auth");
Object.defineProperty(exports, "lookupUserByUsername", { enumerable: true, get: function () { return auth_1.lookupUserByUsername; } });
Object.defineProperty(exports, "setUsername", { enumerable: true, get: function () { return auth_1.setUsername; } });
// Payment Processing (3rd party API - Stripe)
var payments_1 = require("./functions/payments");
Object.defineProperty(exports, "createPaymentIntent", { enumerable: true, get: function () { return payments_1.createPaymentIntent; } });
Object.defineProperty(exports, "handleStripeWebhook", { enumerable: true, get: function () { return payments_1.handleStripeWebhook; } });
// Complex Business Logic
var enrollment_1 = require("./functions/enrollment");
Object.defineProperty(exports, "enrollInCourseAdvanced", { enumerable: true, get: function () { return enrollment_1.enrollInCourseAdvanced; } });
// Email Services (3rd party API - SendGrid)  
var notifications_1 = require("./functions/notifications");
Object.defineProperty(exports, "sendBulkNotification", { enumerable: true, get: function () { return notifications_1.sendBulkNotification; } });
// Admin Operations (sensitive operations)
var professional_booking_1 = require("./functions/professional-booking");
Object.defineProperty(exports, "becomeProfessional", { enumerable: true, get: function () { return professional_booking_1.becomeProfessional; } });
// === EVERYTHING ELSE MOVES TO CLIENT-SIDE FIRESTORE ===
// - Basic CRUD (courses, users, messages, reviews, bookings)
// - Notifications (mark read, delete, create) 
// - Cart operations
// - File upload confirmation
// - Analytics queries
// - All simple reads/writes/updates
//# sourceMappingURL=index.js.map