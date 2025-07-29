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
exports.getMyCourses = exports.enrollInCourse = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourse = exports.getCourses = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
exports.getCourses = (0, https_1.onCall)({ cors: true }, async (request) => {
    try {
        const coursesRef = admin.firestore().collection('courses');
        const snapshot = await coursesRef.where('isActive', '==', true).get();
        const courses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { courses };
    }
    catch (error) {
        logger.error('Get courses error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch courses');
    }
});
exports.getCourse = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { courseId } = request.data;
    if (!courseId) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID is required');
    }
    try {
        const courseRef = admin.firestore().collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Course not found');
        }
        return { course: { id: courseDoc.id, ...courseDoc.data() } };
    }
    catch (error) {
        logger.error('Get course error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch course');
    }
});
exports.createCourse = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check user role
    const userRef = admin.firestore().collection('users').doc(request.auth.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    if (!userData?.role?.includes('ADMIN') && !userData?.role?.includes('INSTRUCTOR')) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions');
    }
    const { title, description, price, category, skillLevel, duration } = request.data;
    if (!title || !description) {
        throw new https_1.HttpsError('invalid-argument', 'Title and description are required');
    }
    try {
        const courseRef = admin.firestore().collection('courses').doc();
        const courseData = {
            title,
            description,
            price: price || 0,
            category: category || 'GENERAL',
            skillLevel: skillLevel || 'BEGINNER',
            duration: duration || 0,
            instructorId: request.auth.uid,
            isActive: true,
            enrollmentCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await courseRef.set(courseData);
        logger.info(`Created course: ${title}`);
        return { course: { id: courseRef.id, ...courseData } };
    }
    catch (error) {
        logger.error('Create course error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create course');
    }
});
exports.updateCourse = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId, ...updateData } = request.data;
    if (!courseId) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID is required');
    }
    try {
        const courseRef = admin.firestore().collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Course not found');
        }
        const courseData = courseDoc.data();
        // Check permissions - only instructor or admin can update
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can update this course');
        }
        const updatedData = {
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await courseRef.update(updatedData);
        const updatedCourse = await courseRef.get();
        return { course: { id: updatedCourse.id, ...updatedCourse.data() } };
    }
    catch (error) {
        logger.error('Update course error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update course');
    }
});
exports.deleteCourse = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId } = request.data;
    if (!courseId) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID is required');
    }
    try {
        const courseRef = admin.firestore().collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Course not found');
        }
        const courseData = courseDoc.data();
        // Check permissions
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can delete this course');
        }
        // Soft delete
        await courseRef.update({
            isActive: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Delete course error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete course');
    }
});
exports.enrollInCourse = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId } = request.data;
    if (!courseId) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID is required');
    }
    try {
        const courseRef = admin.firestore().collection('courses').doc(courseId);
        const enrollmentRef = admin.firestore().collection('enrollments').doc();
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Course not found');
        }
        // Check if already enrolled
        const existingEnrollment = await admin.firestore()
            .collection('enrollments')
            .where('userId', '==', request.auth.uid)
            .where('courseId', '==', courseId)
            .where('status', '==', 'ACTIVE')
            .get();
        if (!existingEnrollment.empty) {
            throw new https_1.HttpsError('already-exists', 'Already enrolled in this course');
        }
        // Create enrollment
        const enrollmentData = {
            userId: request.auth.uid,
            courseId,
            status: 'ACTIVE',
            progress: 0,
            enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await enrollmentRef.set(enrollmentData);
        // Update course enrollment count
        await courseRef.update({
            enrollmentCount: admin.firestore.FieldValue.increment(1),
        });
        return { enrollment: { id: enrollmentRef.id, ...enrollmentData } };
    }
    catch (error) {
        logger.error('Enroll in course error:', error);
        throw new https_1.HttpsError('internal', 'Failed to enroll in course');
    }
});
exports.getMyCourses = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const enrollmentsRef = admin.firestore().collection('enrollments');
        const snapshot = await enrollmentsRef
            .where('userId', '==', request.auth.uid)
            .where('status', '==', 'ACTIVE')
            .get();
        const courseIds = snapshot.docs.map(doc => doc.data().courseId);
        if (courseIds.length === 0) {
            return { courses: [] };
        }
        // Get course details
        const coursesRef = admin.firestore().collection('courses');
        const courseDocs = await Promise.all(courseIds.map(id => coursesRef.doc(id).get()));
        const courses = courseDocs
            .filter(doc => doc.exists)
            .map(doc => ({ id: doc.id, ...doc.data() }));
        return { courses };
    }
    catch (error) {
        logger.error('Get my courses error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch enrolled courses');
    }
});
//# sourceMappingURL=courses.js.map