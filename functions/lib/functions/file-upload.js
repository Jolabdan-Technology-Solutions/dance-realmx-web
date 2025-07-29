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
exports.generateThumbnail = exports.getUserUploads = exports.deleteFile = exports.confirmUpload = exports.generateUploadUrl = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Generate signed upload URL
exports.generateUploadUrl = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { fileName, fileType, folder = 'general', maxSizeBytes = 10485760 } = request.data; // 10MB default
    if (!fileName || !fileType) {
        throw new https_1.HttpsError('invalid-argument', 'File name and type are required');
    }
    // Validate file type
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];
    if (!allowedTypes.includes(fileType)) {
        throw new https_1.HttpsError('invalid-argument', 'File type not allowed');
    }
    try {
        const bucket = admin.storage().bucket();
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${folder}/${request.auth.uid}/${timestamp}_${sanitizedFileName}`;
        const file = bucket.file(filePath);
        // Generate signed URL for upload
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: fileType,
            extensionHeaders: {
                'x-goog-content-length-range': `0,${maxSizeBytes}`
            }
        });
        // Create upload record
        const uploadRef = admin.firestore().collection('uploads').doc();
        await uploadRef.set({
            userId: request.auth.uid,
            fileName: sanitizedFileName,
            originalFileName: fileName,
            fileType,
            filePath,
            folder,
            status: 'PENDING',
            maxSizeBytes,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            uploadUrl: url,
            uploadId: uploadRef.id,
            filePath,
            expiresIn: 900 // 15 minutes
        };
    }
    catch (error) {
        logger.error('Generate upload URL error:', error);
        throw new https_1.HttpsError('internal', 'Failed to generate upload URL');
    }
});
// Confirm upload completion
exports.confirmUpload = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { uploadId } = request.data;
    if (!uploadId) {
        throw new https_1.HttpsError('invalid-argument', 'Upload ID is required');
    }
    try {
        const uploadRef = admin.firestore().collection('uploads').doc(uploadId);
        const uploadDoc = await uploadRef.get();
        if (!uploadDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Upload record not found');
        }
        const uploadData = uploadDoc.data();
        if (uploadData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot confirm another user\'s upload');
        }
        // Check if file exists in storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(uploadData?.filePath);
        const [exists] = await file.exists();
        if (!exists) {
            throw new https_1.HttpsError('not-found', 'File not found in storage');
        }
        // Get file metadata
        const [metadata] = await file.getMetadata();
        const fileSize = parseInt(metadata.size?.toString() || '0');
        // Generate public URL
        const [publicUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        // Update upload record
        await uploadRef.update({
            status: 'COMPLETED',
            fileSize,
            publicUrl,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            publicUrl,
            fileSize,
            filePath: uploadData?.filePath
        };
    }
    catch (error) {
        logger.error('Confirm upload error:', error);
        throw new https_1.HttpsError('internal', 'Failed to confirm upload');
    }
});
// Delete file
exports.deleteFile = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { uploadId, filePath } = request.data;
    if (!uploadId && !filePath) {
        throw new https_1.HttpsError('invalid-argument', 'Upload ID or file path is required');
    }
    try {
        let actualFilePath = filePath;
        let uploadDoc = null;
        if (uploadId) {
            const uploadRef = admin.firestore().collection('uploads').doc(uploadId);
            uploadDoc = await uploadRef.get();
            if (!uploadDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Upload record not found');
            }
            const uploadData = uploadDoc.data();
            if (uploadData?.userId !== request.auth.uid) {
                const userRef = admin.firestore().collection('users').doc(request.auth.uid);
                const userDocData = await userRef.get();
                const userData = userDocData.data();
                if (!userData?.role?.includes('ADMIN')) {
                    throw new https_1.HttpsError('permission-denied', 'Cannot delete another user\'s file');
                }
            }
            actualFilePath = uploadData?.filePath;
        }
        // Delete from storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(actualFilePath);
        const [exists] = await file.exists();
        if (exists) {
            await file.delete();
        }
        // Update upload record
        if (uploadDoc) {
            await uploadDoc.ref.update({
                status: 'DELETED',
                deletedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return { success: true };
    }
    catch (error) {
        logger.error('Delete file error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete file');
    }
});
// Get user uploads
exports.getUserUploads = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { folder, status = 'COMPLETED', limit = 50 } = request.data;
    try {
        let query = admin.firestore().collection('uploads')
            .where('userId', '==', request.auth.uid)
            .where('status', '==', status);
        if (folder) {
            query = query.where('folder', '==', folder);
        }
        const snapshot = await query
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        const uploads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { uploads };
    }
    catch (error) {
        logger.error('Get user uploads error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch user uploads');
    }
});
// Generate thumbnail for images/videos
exports.generateThumbnail = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { uploadId } = request.data;
    if (!uploadId) {
        throw new https_1.HttpsError('invalid-argument', 'Upload ID is required');
    }
    try {
        const uploadRef = admin.firestore().collection('uploads').doc(uploadId);
        const uploadDoc = await uploadRef.get();
        if (!uploadDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Upload record not found');
        }
        const uploadData = uploadDoc.data();
        if (uploadData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot generate thumbnail for another user\'s file');
        }
        const fileType = uploadData?.fileType;
        if (!fileType?.startsWith('image/') && !fileType?.startsWith('video/')) {
            throw new https_1.HttpsError('invalid-argument', 'Thumbnails can only be generated for images and videos');
        }
        // For now, just return the original URL for images
        // In a full implementation, you'd use Cloud Functions to generate actual thumbnails
        if (fileType.startsWith('image/')) {
            await uploadRef.update({
                thumbnailUrl: uploadData?.publicUrl,
                hasThumbnail: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                thumbnailUrl: uploadData?.publicUrl,
                success: true
            };
        }
        // For videos, you'd integrate with a service like FFmpeg
        // For now, return a placeholder
        const placeholderUrl = 'https://via.placeholder.com/300x200/cccccc/666666?text=Video';
        await uploadRef.update({
            thumbnailUrl: placeholderUrl,
            hasThumbnail: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            thumbnailUrl: placeholderUrl,
            success: true
        };
    }
    catch (error) {
        logger.error('Generate thumbnail error:', error);
        throw new https_1.HttpsError('internal', 'Failed to generate thumbnail');
    }
});
//# sourceMappingURL=file-upload.js.map