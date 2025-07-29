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
exports.getOrders = exports.checkoutCart = exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.getCart = exports.addToCart = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Cart CRUD
exports.addToCart = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { itemType, itemId, quantity = 1 } = request.data;
    if (!itemType || !itemId) {
        throw new https_1.HttpsError('invalid-argument', 'Item type and ID are required');
    }
    if (!['course', 'resource', 'subscription'].includes(itemType)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid item type');
    }
    try {
        // Check if item exists
        let itemRef;
        let itemData;
        switch (itemType) {
            case 'course':
                itemRef = admin.firestore().collection('courses').doc(itemId);
                break;
            case 'resource':
                itemRef = admin.firestore().collection('resources').doc(itemId);
                break;
            case 'subscription':
                itemRef = admin.firestore().collection('subscriptionPlans').doc(itemId);
                break;
            default:
                throw new https_1.HttpsError('invalid-argument', 'Invalid item type');
        }
        const itemDoc = await itemRef.get();
        if (!itemDoc.exists) {
            throw new https_1.HttpsError('not-found', `${itemType} not found`);
        }
        itemData = itemDoc.data();
        // Check if already in cart
        const existingCartItem = await admin.firestore()
            .collection('cart')
            .where('userId', '==', request.auth.uid)
            .where('itemType', '==', itemType)
            .where('itemId', '==', itemId)
            .get();
        if (!existingCartItem.empty) {
            // Update quantity if item already exists
            const cartItemRef = existingCartItem.docs[0].ref;
            const currentData = existingCartItem.docs[0].data();
            await cartItemRef.update({
                quantity: currentData.quantity + quantity,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            const updatedItem = await cartItemRef.get();
            return { cartItem: { id: updatedItem.id, ...updatedItem.data() } };
        }
        // Add new item to cart
        const cartRef = admin.firestore().collection('cart').doc();
        const cartData = {
            userId: request.auth.uid,
            itemType,
            itemId,
            itemTitle: itemData?.title || itemData?.name,
            itemPrice: itemData?.price || 0,
            itemImage: itemData?.imageUrl || itemData?.thumbnail,
            quantity,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await cartRef.set(cartData);
        return { cartItem: { id: cartRef.id, ...cartData } };
    }
    catch (error) {
        logger.error('Add to cart error:', error);
        throw new https_1.HttpsError('internal', 'Failed to add item to cart');
    }
});
exports.getCart = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const cartRef = admin.firestore().collection('cart');
        const snapshot = await cartRef
            .where('userId', '==', request.auth.uid)
            .orderBy('createdAt', 'desc')
            .get();
        const cartItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
        return {
            cartItems,
            subtotal,
            itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        };
    }
    catch (error) {
        logger.error('Get cart error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch cart');
    }
});
exports.updateCartItem = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { cartItemId, quantity } = request.data;
    if (!cartItemId || quantity < 0) {
        throw new https_1.HttpsError('invalid-argument', 'Valid cart item ID and quantity are required');
    }
    try {
        const cartItemRef = admin.firestore().collection('cart').doc(cartItemId);
        const cartItemDoc = await cartItemRef.get();
        if (!cartItemDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Cart item not found');
        }
        const cartItemData = cartItemDoc.data();
        if (cartItemData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot modify another user\'s cart');
        }
        if (quantity === 0) {
            // Remove item if quantity is 0
            await cartItemRef.delete();
            return { success: true, removed: true };
        }
        await cartItemRef.update({
            quantity,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const updatedItem = await cartItemRef.get();
        return { cartItem: { id: updatedItem.id, ...updatedItem.data() } };
    }
    catch (error) {
        logger.error('Update cart item error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update cart item');
    }
});
exports.removeFromCart = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { cartItemId } = request.data;
    if (!cartItemId) {
        throw new https_1.HttpsError('invalid-argument', 'Cart item ID is required');
    }
    try {
        const cartItemRef = admin.firestore().collection('cart').doc(cartItemId);
        const cartItemDoc = await cartItemRef.get();
        if (!cartItemDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Cart item not found');
        }
        const cartItemData = cartItemDoc.data();
        if (cartItemData?.userId !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Cannot remove another user\'s cart item');
        }
        await cartItemRef.delete();
        return { success: true };
    }
    catch (error) {
        logger.error('Remove from cart error:', error);
        throw new https_1.HttpsError('internal', 'Failed to remove item from cart');
    }
});
exports.clearCart = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const batch = admin.firestore().batch();
        const cartRef = admin.firestore().collection('cart');
        const snapshot = await cartRef
            .where('userId', '==', request.auth.uid)
            .get();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return { success: true, itemsRemoved: snapshot.docs.length };
    }
    catch (error) {
        logger.error('Clear cart error:', error);
        throw new https_1.HttpsError('internal', 'Failed to clear cart');
    }
});
exports.checkoutCart = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Get cart items
        const cartRef = admin.firestore().collection('cart');
        const cartSnapshot = await cartRef
            .where('userId', '==', request.auth.uid)
            .get();
        if (cartSnapshot.empty) {
            throw new https_1.HttpsError('failed-precondition', 'Cart is empty');
        }
        const cartItems = cartSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
        // Create order
        const orderRef = admin.firestore().collection('orders').doc();
        const orderData = {
            userId: request.auth.uid,
            items: cartItems.map((item) => ({
                itemType: item.itemType,
                itemId: item.itemId,
                itemTitle: item.itemTitle,
                itemPrice: item.itemPrice,
                quantity: item.quantity,
                subtotal: item.itemPrice * item.quantity
            })),
            total,
            status: 'PENDING',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await orderRef.set(orderData);
        // Clear cart after successful order creation
        const batch = admin.firestore().batch();
        cartSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return {
            order: { id: orderRef.id, ...orderData },
            total,
            itemCount: cartItems.length
        };
    }
    catch (error) {
        logger.error('Checkout cart error:', error);
        throw new https_1.HttpsError('internal', 'Failed to checkout cart');
    }
});
exports.getOrders = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const ordersRef = admin.firestore().collection('orders');
        const snapshot = await ordersRef
            .where('userId', '==', request.auth.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { orders };
    }
    catch (error) {
        logger.error('Get orders error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch orders');
    }
});
//# sourceMappingURL=cart.js.map