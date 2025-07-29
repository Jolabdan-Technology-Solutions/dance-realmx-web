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
exports.removeTagFromContent = exports.addTagToContent = exports.getTags = exports.createTag = exports.deleteCategory = exports.updateCategory = exports.getCategoryTree = exports.getCategories = exports.createCategory = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Categories CRUD
exports.createCategory = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { name, description, parentId, type = 'COURSE', color, icon } = request.data;
    if (!name) {
        throw new https_1.HttpsError('invalid-argument', 'Category name is required');
    }
    try {
        // Check admin permissions
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only admins can create categories');
        }
        // Validate parent category if provided
        if (parentId) {
            const parentRef = admin.firestore().collection('categories').doc(parentId);
            const parentDoc = await parentRef.get();
            if (!parentDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Parent category not found');
            }
        }
        const categoryRef = admin.firestore().collection('categories').doc();
        const categoryData = {
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            description: description || '',
            parentId: parentId || null,
            type, // COURSE, RESOURCE, DANCE_STYLE
            color: color || '#3B82F6',
            icon: icon || 'folder',
            level: parentId ? 1 : 0, // Will be calculated properly below
            path: '', // Will be calculated below
            isActive: true,
            courseCount: 0,
            resourceCount: 0,
            createdBy: request.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Calculate level and path
        if (parentId) {
            const parentRef = admin.firestore().collection('categories').doc(parentId);
            const parentDoc = await parentRef.get();
            const parentData = parentDoc.data();
            categoryData.level = (parentData?.level || 0) + 1;
            categoryData.path = parentData?.path ? `${parentData.path}/${parentId}` : parentId;
        }
        await categoryRef.set(categoryData);
        logger.info(`Category created: ${name}`);
        return { category: { id: categoryRef.id, ...categoryData } };
    }
    catch (error) {
        logger.error('Create category error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create category');
    }
});
exports.getCategories = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { type, parentId, includeInactive = false } = request.data;
    try {
        let query = admin.firestore().collection('categories');
        if (!includeInactive) {
            query = query.where('isActive', '==', true);
        }
        if (type) {
            query = query.where('type', '==', type);
        }
        if (parentId === null) {
            query = query.where('parentId', '==', null);
        }
        else if (parentId) {
            query = query.where('parentId', '==', parentId);
        }
        const snapshot = await query.orderBy('name', 'asc').get();
        const categories = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        return { categories };
    }
    catch (error) {
        logger.error('Get categories error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch categories');
    }
});
exports.getCategoryTree = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { type } = request.data;
    try {
        let query = admin.firestore().collection('categories')
            .where('isActive', '==', true);
        if (type) {
            query = query.where('type', '==', type);
        }
        const snapshot = await query.orderBy('level', 'asc').orderBy('name', 'asc').get();
        const categories = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        // Build tree structure
        const categoryMap = new Map();
        const rootCategories = [];
        // First pass: create map and identify roots
        categories.forEach((category) => {
            category.children = [];
            categoryMap.set(category.id, category);
            if (!category.parentId) {
                rootCategories.push(category);
            }
        });
        // Second pass: build tree
        categories.forEach((category) => {
            if (category.parentId) {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    parent.children.push(category);
                }
            }
        });
        return { categoryTree: rootCategories };
    }
    catch (error) {
        logger.error('Get category tree error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch category tree');
    }
});
exports.updateCategory = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { categoryId, ...updateData } = request.data;
    if (!categoryId) {
        throw new https_1.HttpsError('invalid-argument', 'Category ID is required');
    }
    try {
        // Check admin permissions
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only admins can update categories');
        }
        const categoryRef = admin.firestore().collection('categories').doc(categoryId);
        const categoryDoc = await categoryRef.get();
        if (!categoryDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Category not found');
        }
        const updates = {
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Update slug if name changed
        if (updateData.name) {
            updates.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        await categoryRef.update(updates);
        const updatedCategory = await categoryRef.get();
        return { category: { id: updatedCategory.id, ...updatedCategory.data() } };
    }
    catch (error) {
        logger.error('Update category error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update category');
    }
});
exports.deleteCategory = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { categoryId } = request.data;
    if (!categoryId) {
        throw new https_1.HttpsError('invalid-argument', 'Category ID is required');
    }
    try {
        // Check admin permissions
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only admins can delete categories');
        }
        const categoryRef = admin.firestore().collection('categories').doc(categoryId);
        const categoryDoc = await categoryRef.get();
        if (!categoryDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Category not found');
        }
        // Check if category has children
        const childrenQuery = await admin.firestore()
            .collection('categories')
            .where('parentId', '==', categoryId)
            .where('isActive', '==', true)
            .get();
        if (!childrenQuery.empty) {
            throw new https_1.HttpsError('failed-precondition', 'Cannot delete category with active subcategories');
        }
        // Check if category is being used
        const courseUsage = await admin.firestore()
            .collection('courses')
            .where('category', '==', categoryId)
            .where('isActive', '==', true)
            .get();
        const resourceUsage = await admin.firestore()
            .collection('resources')
            .where('category', '==', categoryId)
            .where('isActive', '==', true)
            .get();
        if (!courseUsage.empty || !resourceUsage.empty) {
            throw new https_1.HttpsError('failed-precondition', 'Cannot delete category that is being used by courses or resources');
        }
        // Soft delete
        await categoryRef.update({
            isActive: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Delete category error:', error);
        throw new https_1.HttpsError('internal', 'Failed to delete category');
    }
});
// Tags CRUD
exports.createTag = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { name, description, color } = request.data;
    if (!name) {
        throw new https_1.HttpsError('invalid-argument', 'Tag name is required');
    }
    try {
        // Check if tag already exists
        const existingTag = await admin.firestore()
            .collection('tags')
            .where('name', '==', name.toLowerCase())
            .where('isActive', '==', true)
            .get();
        if (!existingTag.empty) {
            return { tag: { id: existingTag.docs[0].id, ...existingTag.docs[0].data() } };
        }
        const tagRef = admin.firestore().collection('tags').doc();
        const tagData = {
            name: name.toLowerCase(),
            displayName: name,
            description: description || '',
            color: color || '#6B7280',
            usageCount: 0,
            isActive: true,
            createdBy: request.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await tagRef.set(tagData);
        return { tag: { id: tagRef.id, ...tagData } };
    }
    catch (error) {
        logger.error('Create tag error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create tag');
    }
});
exports.getTags = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { search, limit = 50, sortBy = 'usage' } = request.data;
    try {
        let query = admin.firestore().collection('tags')
            .where('isActive', '==', true);
        if (search) {
            query = query
                .where('name', '>=', search.toLowerCase())
                .where('name', '<=', search.toLowerCase() + '\uf8ff');
        }
        let snapshot;
        if (sortBy === 'usage') {
            snapshot = await query.orderBy('usageCount', 'desc').limit(limit).get();
        }
        else {
            snapshot = await query.orderBy('name', 'asc').limit(limit).get();
        }
        const tags = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { tags };
    }
    catch (error) {
        logger.error('Get tags error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch tags');
    }
});
exports.addTagToContent = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { contentType, contentId, tagId } = request.data;
    if (!contentType || !contentId || !tagId) {
        throw new https_1.HttpsError('invalid-argument', 'Content type, content ID, and tag ID are required');
    }
    if (!['course', 'resource'].includes(contentType)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid content type');
    }
    try {
        // Verify content exists and user has permission
        const contentRef = admin.firestore().collection(`${contentType}s`).doc(contentId);
        const contentDoc = await contentRef.get();
        if (!contentDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Content not found');
        }
        const contentData = contentDoc.data();
        // Check permissions
        const canTag = contentData?.instructorId === request.auth.uid ||
            contentData?.creatorId === request.auth.uid;
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!canTag && !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Cannot tag this content');
        }
        // Verify tag exists
        const tagRef = admin.firestore().collection('tags').doc(tagId);
        const tagDoc = await tagRef.get();
        if (!tagDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Tag not found');
        }
        // Add tag to content
        const currentTags = contentData?.tags || [];
        if (!currentTags.includes(tagId)) {
            await contentRef.update({
                tags: admin.firestore.FieldValue.arrayUnion(tagId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Update tag usage count
            await tagRef.update({
                usageCount: admin.firestore.FieldValue.increment(1),
            });
        }
        return { success: true };
    }
    catch (error) {
        logger.error('Add tag to content error:', error);
        throw new https_1.HttpsError('internal', 'Failed to add tag to content');
    }
});
exports.removeTagFromContent = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { contentType, contentId, tagId } = request.data;
    if (!contentType || !contentId || !tagId) {
        throw new https_1.HttpsError('invalid-argument', 'Content type, content ID, and tag ID are required');
    }
    try {
        // Verify content exists and user has permission
        const contentRef = admin.firestore().collection(`${contentType}s`).doc(contentId);
        const contentDoc = await contentRef.get();
        if (!contentDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Content not found');
        }
        const contentData = contentDoc.data();
        // Check permissions
        const canUntag = contentData?.instructorId === request.auth.uid ||
            contentData?.creatorId === request.auth.uid;
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!canUntag && !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Cannot untag this content');
        }
        // Remove tag from content
        const currentTags = contentData?.tags || [];
        if (currentTags.includes(tagId)) {
            await contentRef.update({
                tags: admin.firestore.FieldValue.arrayRemove(tagId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Update tag usage count
            const tagRef = admin.firestore().collection('tags').doc(tagId);
            await tagRef.update({
                usageCount: admin.firestore.FieldValue.increment(-1),
            });
        }
        return { success: true };
    }
    catch (error) {
        logger.error('Remove tag from content error:', error);
        throw new https_1.HttpsError('internal', 'Failed to remove tag from content');
    }
});
//# sourceMappingURL=categories.js.map