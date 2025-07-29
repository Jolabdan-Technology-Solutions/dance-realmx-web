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
exports.markLessonComplete = exports.deleteLesson = exports.updateLesson = exports.getLesson = exports.getLessons = exports.createLesson = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Lessons CRUD
exports.createLesson = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { moduleId, title, description, content, videoUrl, duration, order, isPreview = false } = request.data;
    if (!moduleId || !title) {
        throw new https_1.HttpsError('invalid-argument', 'Module ID and title are required');
    }
    try {
        // Check module exists and get course permissions
        const moduleRef = admin.firestore().collection('modules').doc(moduleId);
        const moduleDoc = await moduleRef.get();
        if (!moduleDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Module not found');
        }
        const moduleData = moduleDoc.data();
        const courseRef = admin.firestore().collection('courses').doc(moduleData?.courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can create lessons');
        }
        const lessonRef = admin.firestore().collection('lessons').doc();
        const lessonData = {
            moduleId,
            courseId: moduleData?.courseId,
            title,
            description: description || '',
            content: content || '',
            videoUrl: videoUrl || null,
            duration: duration || 0,
            order: order || 0,
            isPreview,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await lessonRef.set(lessonData);
        logger.info(`Created lesson: ${title} for module ${moduleId}`);
        return { lesson: { id: lessonRef.id, ...lessonData } };
    }
    catch (error) {
        logger.error('Create lesson error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create lesson');
    }
});
exports.getLessons = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { moduleId } = request.data;
    if (!moduleId) {
        throw new https_1.HttpsError('invalid-argument', 'Module ID is required');
    }
    try {
        const lessonsRef = admin.firestore().collection('lessons');
        const snapshot = await lessonsRef
            .where('moduleId', '==', moduleId)
            .where('isActive', '==', true)
            .orderBy('order', 'asc')
            .get();
        const lessons = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { lessons };
    }
    catch (error) {
        logger.error('Get lessons error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch lessons');
    }
});
exports.getLesson = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { lessonId } = request.data;
    if (!lessonId) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID is required');
    }
    try {
        const lessonRef = admin.firestore().collection('lessons').doc(lessonId);
        const lessonDoc = await lessonRef.get();
        if (!lessonDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Lesson not found');
        }
        const lessonData = lessonDoc.data();
        // Check if user has access to this lesson
        if (request.auth) {
            // Check if user is enrolled in the course or is the instructor
            const courseId = lessonData?.courseId;
            if (courseId) {
                const enrollmentQuery = await admin.firestore()
                    .collection('enrollments')
                    .where('userId', '==', request.auth.uid)
                    .where('courseId', '==', courseId)
                    .where('status', '==', 'ACTIVE')
                    .get();
                const courseRef = admin.firestore().collection('courses').doc(courseId);
                const courseDoc = await courseRef.get();
                const courseData = courseDoc.data();
                const userRef = admin.firestore().collection('users').doc(request.auth.uid);
                const userDoc = await userRef.get();
                const userData = userDoc.data();
                const hasAccess = !enrollmentQuery.empty ||
                    courseData?.instructorId === request.auth.uid ||
                    userData?.role?.includes('ADMIN') ||
                    lessonData?.isPreview;
                if (!hasAccess) {
                    throw new https_1.HttpsError('permission-denied', 'You must be enrolled to access this lesson');
                }
            }
        }
        else if (!lessonData?.isPreview) {
            throw new https_1.HttpsError('permission-denied', 'Authentication required for non-preview lessons');
        }
        return { lesson: { id: lessonDoc.id, ...lessonData } };
    }
    catch (error) {
        logger.error('Get lesson error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch lesson');
    }
});
exports.updateLesson = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { lessonId, ...updateData } = request.data;
    if (!lessonId) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID is required');
    }
    try {
        const lessonRef = admin.firestore().collection('lessons').doc(lessonId);
        const lessonDoc = await lessonRef.get();
        if (!lessonDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Lesson not found');
        }
        const lessonData = lessonDoc.data();
        // Check course permissions
        const courseRef = admin.firestore().collection('courses').doc(lessonData?.courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can update lessons');
        }
        const updatedData = {
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await lessonRef.update(updatedData);
        const updatedLesson = await lessonRef.get();
        return { lesson: { id: updatedLesson.id, ...updatedLesson.data() } };
    }
    catch (error) {
        logger.error('Update lesson error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update lesson');
    }
});
exports.deleteLesson = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { lessonId } = request.data;
    if (!lessonId) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID is required');
    }
    try {
        const lessonRef = admin.firestore().collection('lessons').doc(lessonId);
        const lessonDoc = await lessonRef.get();
        if (!lessonDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Lesson not found');
        }
        const lessonData = lessonDoc.data();
        // Check course permissions
        const courseRef = admin.firestore().collection('courses').doc(lessonData?.courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can delete lessons');
        }
        // Soft delete
        await lessonRef.update({
            isActive: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Delete lesson error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete lesson');
    }
});
// Track lesson progress
exports.markLessonComplete = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { lessonId } = request.data;
    if (!lessonId) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID is required');
    }
    try {
        const lessonRef = admin.firestore().collection('lessons').doc(lessonId);
        const lessonDoc = await lessonRef.get();
        if (!lessonDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Lesson not found');
        }
        const lessonData = lessonDoc.data();
        // Check if user is enrolled in the course
        const enrollmentQuery = await admin.firestore()
            .collection('enrollments')
            .where('userId', '==', request.auth.uid)
            .where('courseId', '==', lessonData?.courseId)
            .where('status', '==', 'ACTIVE')
            .get();
        if (enrollmentQuery.empty) {
            throw new https_1.HttpsError('permission-denied', 'You must be enrolled to mark lessons complete');
        }
        // Create or update lesson progress
        const progressRef = admin.firestore().collection('lessonProgress').doc();
        const progressQuery = await admin.firestore()
            .collection('lessonProgress')
            .where('userId', '==', request.auth.uid)
            .where('lessonId', '==', lessonId)
            .get();
        if (progressQuery.empty) {
            await progressRef.set({
                userId: request.auth.uid,
                lessonId,
                courseId: lessonData?.courseId,
                moduleId: lessonData?.moduleId,
                completed: true,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        else {
            const existingProgressRef = progressQuery.docs[0].ref;
            await existingProgressRef.update({
                completed: true,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return { success: true };
    }
    catch (error) {
        logger.error('Mark lesson complete error:', error);
        throw new https_1.HttpsError('internal', 'Failed to mark lesson complete');
    }
});
//# sourceMappingURL=lessons.js.map