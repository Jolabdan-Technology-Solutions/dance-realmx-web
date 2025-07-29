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
exports.deleteModule = exports.updateModule = exports.getModules = exports.createModule = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Course Modules CRUD
exports.createModule = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId, title, description, order } = request.data;
    if (!courseId || !title) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID and title are required');
    }
    try {
        // Check if user can modify this course
        const courseRef = admin.firestore().collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Course not found');
        }
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can create modules');
        }
        const moduleRef = admin.firestore().collection('modules').doc();
        const moduleData = {
            courseId,
            title,
            description: description || '',
            order: order || 0,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await moduleRef.set(moduleData);
        logger.info(`Created module: ${title} for course ${courseId}`);
        return { module: { id: moduleRef.id, ...moduleData } };
    }
    catch (error) {
        logger.error('Create module error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create module');
    }
});
exports.getModules = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { courseId } = request.data;
    if (!courseId) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID is required');
    }
    try {
        const modulesRef = admin.firestore().collection('modules');
        const snapshot = await modulesRef
            .where('courseId', '==', courseId)
            .where('isActive', '==', true)
            .orderBy('order', 'asc')
            .get();
        const modules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { modules };
    }
    catch (error) {
        logger.error('Get modules error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch modules');
    }
});
exports.updateModule = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { moduleId, ...updateData } = request.data;
    if (!moduleId) {
        throw new https_1.HttpsError('invalid-argument', 'Module ID is required');
    }
    try {
        const moduleRef = admin.firestore().collection('modules').doc(moduleId);
        const moduleDoc = await moduleRef.get();
        if (!moduleDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Module not found');
        }
        const moduleData = moduleDoc.data();
        // Check course permissions
        const courseRef = admin.firestore().collection('courses').doc(moduleData?.courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can update modules');
        }
        const updatedData = {
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await moduleRef.update(updatedData);
        const updatedModule = await moduleRef.get();
        return { module: { id: updatedModule.id, ...updatedModule.data() } };
    }
    catch (error) {
        logger.error('Update module error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update module');
    }
});
exports.deleteModule = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { moduleId } = request.data;
    if (!moduleId) {
        throw new https_1.HttpsError('invalid-argument', 'Module ID is required');
    }
    try {
        const moduleRef = admin.firestore().collection('modules').doc(moduleId);
        const moduleDoc = await moduleRef.get();
        if (!moduleDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Module not found');
        }
        const moduleData = moduleDoc.data();
        // Check course permissions
        const courseRef = admin.firestore().collection('courses').doc(moduleData?.courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can delete modules');
        }
        // Soft delete
        await moduleRef.update({
            isActive: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Delete module error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete module');
    }
});
//# sourceMappingURL=course-modules.js.map