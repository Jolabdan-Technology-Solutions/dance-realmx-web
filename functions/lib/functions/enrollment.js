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
exports.getUserEnrollments = exports.getEnrollmentProgress = exports.updateEnrollmentProgress = exports.enrollInCourseAdvanced = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Enhanced Course Enrollment with Progress Tracking
exports.enrollInCourseAdvanced = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId, paymentIntentId } = request.data;
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
        // Check if already enrolled
        const existingEnrollment = await admin.firestore()
            .collection('enrollments')
            .where('userId', '==', request.auth.uid)
            .where('courseId', '==', courseId)
            .where('status', 'in', ['ACTIVE', 'COMPLETED'])
            .get();
        if (!existingEnrollment.empty) {
            throw new https_1.HttpsError('already-exists', 'Already enrolled in this course');
        }
        // Verify payment if course is paid
        if (courseData?.price > 0 && !paymentIntentId) {
            throw new https_1.HttpsError('invalid-argument', 'Payment required for paid course');
        }
        if (paymentIntentId) {
            // Verify payment was successful
            const paymentRef = admin.firestore().collection('payments').doc(paymentIntentId);
            const paymentDoc = await paymentRef.get();
            if (!paymentDoc.exists || paymentDoc.data()?.status !== 'SUCCEEDED') {
                throw new https_1.HttpsError('failed-precondition', 'Payment not confirmed');
            }
        }
        // Create enrollment with detailed tracking
        const enrollmentRef = admin.firestore().collection('enrollments').doc();
        // Get course structure for progress tracking
        const modulesSnapshot = await admin.firestore()
            .collection('modules')
            .where('courseId', '==', courseId)
            .where('isActive', '==', true)
            .orderBy('order', 'asc')
            .get();
        const totalModules = modulesSnapshot.size;
        let totalLessons = 0;
        let totalQuizzes = 0;
        // Count lessons and quizzes
        for (const moduleDoc of modulesSnapshot.docs) {
            const lessonsSnapshot = await admin.firestore()
                .collection('lessons')
                .where('moduleId', '==', moduleDoc.id)
                .where('isActive', '==', true)
                .get();
            totalLessons += lessonsSnapshot.size;
            const quizzesSnapshot = await admin.firestore()
                .collection('quizzes')
                .where('moduleId', '==', moduleDoc.id)
                .where('isActive', '==', true)
                .get();
            totalQuizzes += quizzesSnapshot.size;
        }
        const enrollmentData = {
            userId: request.auth.uid,
            courseId,
            instructorId: courseData?.instructorId,
            status: 'ACTIVE',
            progress: 0,
            completedLessons: 0,
            completedQuizzes: 0,
            totalLessons,
            totalQuizzes,
            totalModules,
            currentModuleId: modulesSnapshot.docs[0]?.id || null,
            enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
            lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
            estimatedCompletionDate: null,
            actualCompletionDate: null,
            certificateIssued: false,
            paymentIntentId: paymentIntentId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await enrollmentRef.set(enrollmentData);
        // Update course enrollment count
        await courseRef.update({
            enrollmentCount: admin.firestore.FieldValue.increment(1),
        });
        // Create notification for instructor
        const notificationRef = admin.firestore().collection('notifications').doc();
        await notificationRef.set({
            userId: courseData?.instructorId,
            type: 'NEW_ENROLLMENT',
            title: 'New Course Enrollment',
            message: `A student has enrolled in your course: ${courseData?.title}`,
            data: {
                courseId,
                enrollmentId: enrollmentRef.id,
                studentId: request.auth.uid
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`User ${request.auth.uid} enrolled in course ${courseId}`);
        return { enrollment: { id: enrollmentRef.id, ...enrollmentData } };
    }
    catch (error) {
        logger.error('Enroll in course error:', error);
        throw new https_1.HttpsError('internal', 'Failed to enroll in course');
    }
});
exports.updateEnrollmentProgress = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { enrollmentId, lessonId, quizId, moduleId } = request.data;
    if (!enrollmentId) {
        throw new https_1.HttpsError('invalid-argument', 'Enrollment ID is required');
    }
    try {
        const enrollmentRef = admin.firestore().collection('enrollments').doc(enrollmentId);
        const enrollmentDoc = await enrollmentRef.get();
        if (!enrollmentDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Enrollment not found');
        }
        const enrollmentData = enrollmentDoc.data();
        if (enrollmentData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot update another user\'s enrollment');
        }
        let updates = {
            lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Update based on what was completed
        if (lessonId) {
            // Check if lesson was already completed
            const existingProgress = await admin.firestore()
                .collection('lessonProgress')
                .where('userId', '==', request.auth.uid)
                .where('lessonId', '==', lessonId)
                .where('completed', '==', true)
                .get();
            if (existingProgress.empty) {
                updates.completedLessons = admin.firestore.FieldValue.increment(1);
            }
        }
        if (quizId) {
            // Check if quiz was passed
            const quizAttempts = await admin.firestore()
                .collection('quizAttempts')
                .where('userId', '==', request.auth.uid)
                .where('quizId', '==', quizId)
                .where('passed', '==', true)
                .get();
            if (!quizAttempts.empty) {
                const existingQuizProgress = await admin.firestore()
                    .collection('quizProgress')
                    .where('userId', '==', request.auth.uid)
                    .where('quizId', '==', quizId)
                    .get();
                if (existingQuizProgress.empty) {
                    // Create quiz progress record
                    await admin.firestore().collection('quizProgress').doc().set({
                        userId: request.auth.uid,
                        quizId,
                        enrollmentId,
                        passed: true,
                        completedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    updates.completedQuizzes = admin.firestore.FieldValue.increment(1);
                }
            }
        }
        if (moduleId) {
            updates.currentModuleId = moduleId;
        }
        await enrollmentRef.update(updates);
        // Recalculate overall progress
        const updatedEnrollment = await enrollmentRef.get();
        const updatedData = updatedEnrollment.data();
        const totalItems = (updatedData?.totalLessons || 0) + (updatedData?.totalQuizzes || 0);
        const completedItems = (updatedData?.completedLessons || 0) + (updatedData?.completedQuizzes || 0);
        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        await enrollmentRef.update({
            progress: progressPercentage,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Check if course is completed
        if (progressPercentage >= 100 && updatedData?.status !== 'COMPLETED') {
            await enrollmentRef.update({
                status: 'COMPLETED',
                actualCompletionDate: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Create completion notification
            const notificationRef = admin.firestore().collection('notifications').doc();
            await notificationRef.set({
                userId: request.auth.uid,
                type: 'COURSE_COMPLETED',
                title: 'Course Completed!',
                message: 'Congratulations! You have completed the course.',
                data: {
                    enrollmentId,
                    courseId: updatedData?.courseId
                },
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return {
            success: true,
            progress: progressPercentage,
            status: progressPercentage >= 100 ? 'COMPLETED' : 'ACTIVE'
        };
    }
    catch (error) {
        logger.error('Update enrollment progress error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update enrollment progress');
    }
});
exports.getEnrollmentProgress = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId, enrollmentId } = request.data;
    if (!courseId && !enrollmentId) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID or Enrollment ID is required');
    }
    try {
        let enrollmentDoc;
        if (enrollmentId) {
            const enrollmentRef = admin.firestore().collection('enrollments').doc(enrollmentId);
            enrollmentDoc = await enrollmentRef.get();
        }
        else {
            const enrollmentQuery = await admin.firestore()
                .collection('enrollments')
                .where('userId', '==', request.auth.uid)
                .where('courseId', '==', courseId)
                .where('status', 'in', ['ACTIVE', 'COMPLETED'])
                .get();
            if (enrollmentQuery.empty) {
                throw new https_1.HttpsError('not-found', 'Enrollment not found');
            }
            enrollmentDoc = enrollmentQuery.docs[0];
        }
        if (!enrollmentDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Enrollment not found');
        }
        const enrollmentData = enrollmentDoc.data();
        if (enrollmentData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot access another user\'s enrollment');
        }
        // Get detailed progress data
        const lessonProgressQuery = await admin.firestore()
            .collection('lessonProgress')
            .where('userId', '==', request.auth.uid)
            .where('courseId', '==', enrollmentData?.courseId)
            .get();
        const quizProgressQuery = await admin.firestore()
            .collection('quizProgress')
            .where('userId', '==', request.auth.uid)
            .where('enrollmentId', '==', enrollmentDoc.id)
            .get();
        const completedLessons = lessonProgressQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const completedQuizzes = quizProgressQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return {
            enrollment: { id: enrollmentDoc.id, ...enrollmentData },
            completedLessons,
            completedQuizzes,
            progressSummary: {
                totalLessons: enrollmentData?.totalLessons || 0,
                totalQuizzes: enrollmentData?.totalQuizzes || 0,
                completedLessons: enrollmentData?.completedLessons || 0,
                completedQuizzes: enrollmentData?.completedQuizzes || 0,
                overallProgress: enrollmentData?.progress || 0,
                status: enrollmentData?.status
            }
        };
    }
    catch (error) {
        logger.error('Get enrollment progress error:', error);
        throw new https_1.HttpsError('internal', 'Failed to get enrollment progress');
    }
});
exports.getUserEnrollments = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { status = 'ACTIVE', limit = 50 } = request.data;
    try {
        let query = admin.firestore().collection('enrollments')
            .where('userId', '==', request.auth.uid);
        if (status !== 'ALL') {
            query = query.where('status', '==', status);
        }
        const snapshot = await query
            .orderBy('enrolledAt', 'desc')
            .limit(limit)
            .get();
        const enrollments = [];
        for (const doc of snapshot.docs) {
            const enrollmentData = doc.data();
            // Get course details
            const courseRef = admin.firestore().collection('courses').doc(enrollmentData.courseId);
            const courseDoc = await courseRef.get();
            const courseData = courseDoc.data();
            enrollments.push({
                id: doc.id,
                ...enrollmentData,
                course: courseData ? { id: courseDoc.id, ...courseData } : null
            });
        }
        return { enrollments };
    }
    catch (error) {
        logger.error('Get user enrollments error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch user enrollments');
    }
});
//# sourceMappingURL=enrollment.js.map