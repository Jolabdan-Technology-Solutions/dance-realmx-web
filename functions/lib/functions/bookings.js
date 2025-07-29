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
exports.cancelBooking = exports.updateBooking = exports.getBookings = exports.createBooking = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
exports.createBooking = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { eventId, sessionId, bookingDate, bookingTime, numberOfPeople = 1, notes } = request.data;
    if (!eventId && !sessionId) {
        throw new https_1.HttpsError('invalid-argument', 'Either event ID or session ID is required');
    }
    if (!bookingDate || !bookingTime) {
        throw new https_1.HttpsError('invalid-argument', 'Booking date and time are required');
    }
    try {
        // Validate the event/session exists
        let resourceRef;
        let resourceData;
        if (eventId) {
            resourceRef = admin.firestore().collection('events').doc(eventId);
        }
        else {
            resourceRef = admin.firestore().collection('sessions').doc(sessionId);
        }
        const resourceDoc = await resourceRef.get();
        if (!resourceDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Event or session not found');
        }
        resourceData = resourceDoc.data();
        // Check availability
        const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
        const existingBookingsRef = admin.firestore().collection('bookings');
        const conflictingBookings = await existingBookingsRef
            .where(eventId ? 'eventId' : 'sessionId', '==', eventId || sessionId)
            .where('bookingDateTime', '==', bookingDateTime)
            .where('status', 'in', ['CONFIRMED', 'PENDING'])
            .get();
        const currentBookings = conflictingBookings.docs.reduce((total, doc) => total + (doc.data().numberOfPeople || 1), 0);
        const maxCapacity = resourceData?.maxCapacity || 20;
        if (currentBookings + numberOfPeople > maxCapacity) {
            throw new https_1.HttpsError('resource-exhausted', 'Not enough spots available');
        }
        // Create booking
        const bookingRef = admin.firestore().collection('bookings').doc();
        const bookingData = {
            userId: request.auth.uid,
            eventId: eventId || null,
            sessionId: sessionId || null,
            bookingDateTime,
            numberOfPeople,
            notes: notes || '',
            status: 'CONFIRMED', // or PENDING if payment required
            price: resourceData?.price || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await bookingRef.set(bookingData);
        logger.info(`Created booking ${bookingRef.id} for user ${request.auth.uid}`);
        return { booking: { id: bookingRef.id, ...bookingData } };
    }
    catch (error) {
        logger.error('Create booking error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create booking');
    }
});
exports.getBookings = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { status, upcoming = true } = request.data;
    try {
        let query = admin.firestore().collection('bookings')
            .where('userId', '==', request.auth.uid);
        if (status) {
            query = query.where('status', '==', status);
        }
        if (upcoming) {
            query = query.where('bookingDateTime', '>=', new Date());
        }
        const snapshot = await query
            .orderBy('bookingDateTime', upcoming ? 'asc' : 'desc')
            .limit(50)
            .get();
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { bookings };
    }
    catch (error) {
        logger.error('Get bookings error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch bookings');
    }
});
exports.updateBooking = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { bookingId, ...updateData } = request.data;
    if (!bookingId) {
        throw new https_1.HttpsError('invalid-argument', 'Booking ID is required');
    }
    try {
        const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Booking not found');
        }
        const bookingData = bookingDoc.data();
        // Check if user owns this booking or is admin
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (bookingData?.userId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Cannot update another user\'s booking');
        }
        // Don't allow updates to past bookings
        if (bookingData?.bookingDateTime && bookingData.bookingDateTime.toDate() < new Date()) {
            throw new https_1.HttpsError('failed-precondition', 'Cannot update past bookings');
        }
        const updatedData = {
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await bookingRef.update(updatedData);
        const updatedBooking = await bookingRef.get();
        return { booking: { id: updatedBooking.id, ...updatedBooking.data() } };
    }
    catch (error) {
        logger.error('Update booking error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update booking');
    }
});
exports.cancelBooking = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { bookingId, reason } = request.data;
    if (!bookingId) {
        throw new https_1.HttpsError('invalid-argument', 'Booking ID is required');
    }
    try {
        const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Booking not found');
        }
        const bookingData = bookingDoc.data();
        // Check if user owns this booking or is admin
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (bookingData?.userId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Cannot cancel another user\'s booking');
        }
        // Check cancellation policy (e.g., must cancel 24 hours before)
        if (bookingData?.bookingDateTime) {
            const bookingTime = bookingData.bookingDateTime.toDate();
            const now = new Date();
            const hoursDifference = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursDifference < 24 && !userData?.role?.includes('ADMIN')) {
                throw new https_1.HttpsError('failed-precondition', 'Bookings must be cancelled at least 24 hours in advance');
            }
        }
        await bookingRef.update({
            status: 'CANCELLED',
            cancellationReason: reason || 'User requested cancellation',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Cancelled booking ${bookingId}`);
        // Here you could add refund logic if needed
        return { success: true };
    }
    catch (error) {
        logger.error('Cancel booking error:', error);
        throw new https_1.HttpsError('internal', 'Failed to cancel booking');
    }
});
//# sourceMappingURL=bookings.js.map