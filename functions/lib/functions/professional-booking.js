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
exports.getClientBookings = exports.getProfessionalBookings = exports.updateBookingStatus = exports.bookProfessional = exports.searchProfessionals = exports.becomeProfessional = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Professional Profile Management
exports.becomeProfessional = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { bio, danceStyles, experience, certifications, hourlyRate, location, availability, services, travelRadius, profileImage } = request.data;
    if (!bio || !danceStyles || !hourlyRate || !location) {
        throw new https_1.HttpsError('invalid-argument', 'Bio, dance styles, hourly rate, and location are required');
    }
    try {
        // Update user profile to include professional status
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const updatedRoles = [...(userData?.role || [])];
        if (!updatedRoles.includes('PROFESSIONAL')) {
            updatedRoles.push('PROFESSIONAL');
        }
        // Create/update professional profile
        const professionalRef = admin.firestore().collection('professionals').doc(request.auth.uid);
        const professionalData = {
            userId: request.auth.uid,
            name: userData?.name,
            email: userData?.email,
            bio,
            danceStyles, // Array of dance styles
            experience, // Years of experience
            certifications: certifications || [],
            hourlyRate,
            location: {
                city: location.city,
                state: location.state,
                country: location.country || 'US',
                coordinates: location.coordinates || null
            },
            availability: availability || {}, // Weekly schedule
            services: services || [], // Array of services offered
            travelRadius: travelRadius || 25, // Miles
            profileImage: profileImage || userData?.profileImage,
            rating: 0,
            reviewCount: 0,
            totalBookings: 0,
            isActive: true,
            verificationStatus: 'PENDING',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Use batch to update both user and professional profiles
        const batch = admin.firestore().batch();
        batch.update(userRef, {
            role: updatedRoles,
            isProfessional: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        batch.set(professionalRef, professionalData, { merge: true });
        await batch.commit();
        logger.info(`User ${request.auth.uid} became a professional`);
        return { professional: { id: request.auth.uid, ...professionalData } };
    }
    catch (error) {
        logger.error('Become professional error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create professional profile');
    }
});
exports.searchProfessionals = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { location, danceStyles, maxRate, minRating, travelRadius, services, limit = 20 } = request.data;
    try {
        let query = admin.firestore().collection('professionals')
            .where('isActive', '==', true)
            .where('verificationStatus', '==', 'VERIFIED');
        // Apply filters
        if (danceStyles && danceStyles.length > 0) {
            query = query.where('danceStyles', 'array-contains-any', danceStyles);
        }
        if (maxRate) {
            query = query.where('hourlyRate', '<=', maxRate);
        }
        if (minRating) {
            query = query.where('rating', '>=', minRating);
        }
        if (services && services.length > 0) {
            query = query.where('services', 'array-contains-any', services);
        }
        let snapshot = await query.limit(limit * 2).get(); // Get more to filter by location
        let professionals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Filter by location if provided
        if (location && location.coordinates) {
            professionals = professionals.filter((prof) => {
                if (!prof.location?.coordinates)
                    return false;
                const distance = calculateDistance(location.coordinates.lat, location.coordinates.lng, prof.location.coordinates.lat, prof.location.coordinates.lng);
                const maxDistance = travelRadius || prof.travelRadius || 25;
                return distance <= maxDistance;
            });
        }
        // Sort by rating and limit results
        professionals = professionals
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit);
        return { professionals };
    }
    catch (error) {
        logger.error('Search professionals error:', error);
        throw new https_1.HttpsError('internal', 'Failed to search professionals');
    }
});
exports.bookProfessional = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { professionalId, serviceType, date, startTime, duration, // in hours
    location, message, participants = 1 } = request.data;
    if (!professionalId || !serviceType || !date || !startTime || !duration) {
        throw new https_1.HttpsError('invalid-argument', 'Professional ID, service type, date, start time, and duration are required');
    }
    try {
        // Get professional details
        const professionalRef = admin.firestore().collection('professionals').doc(professionalId);
        const professionalDoc = await professionalRef.get();
        if (!professionalDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Professional not found');
        }
        const professionalData = professionalDoc.data();
        if (!professionalData?.isActive) {
            throw new https_1.HttpsError('failed-precondition', 'Professional is not available');
        }
        // Check availability
        const bookingDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(bookingDateTime.getTime() + (duration * 60 * 60 * 1000));
        // Check for conflicting bookings
        const conflictingBookings = await admin.firestore()
            .collection('professionalBookings')
            .where('professionalId', '==', professionalId)
            .where('status', 'in', ['CONFIRMED', 'PENDING'])
            .where('date', '==', date)
            .get();
        for (const booking of conflictingBookings.docs) {
            const bookingData = booking.data();
            const existingStart = new Date(`${bookingData.date}T${bookingData.startTime}`);
            const existingEnd = new Date(existingStart.getTime() + (bookingData.duration * 60 * 60 * 1000));
            // Check for overlap
            if (bookingDateTime < existingEnd && endDateTime > existingStart) {
                throw new https_1.HttpsError('resource-exhausted', 'Professional is not available at the requested time');
            }
        }
        // Calculate pricing
        const hourlyRate = professionalData?.hourlyRate || 0;
        const basePrice = hourlyRate * duration;
        const participantMultiplier = participants > 1 ? 1 + ((participants - 1) * 0.3) : 1; // 30% extra per additional participant
        const totalPrice = Math.round(basePrice * participantMultiplier);
        // Create booking
        const bookingRef = admin.firestore().collection('professionalBookings').doc();
        const bookingData = {
            clientId: request.auth.uid,
            professionalId,
            serviceType,
            date,
            startTime,
            endTime: endDateTime.toTimeString().slice(0, 5), // HH:MM format
            duration,
            location: location || 'To be determined',
            message: message || '',
            participants,
            hourlyRate,
            totalPrice,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await bookingRef.set(bookingData);
        // Create notifications for both client and professional
        const batch = admin.firestore().batch();
        // Notification for professional
        const professionalNotificationRef = admin.firestore().collection('notifications').doc();
        batch.set(professionalNotificationRef, {
            userId: professionalId,
            type: 'NEW_BOOKING_REQUEST',
            title: 'New Booking Request',
            message: `You have a new booking request for ${serviceType} on ${date} at ${startTime}`,
            data: {
                bookingId: bookingRef.id,
                clientId: request.auth.uid,
                serviceType,
                date,
                startTime
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Notification for client
        const clientNotificationRef = admin.firestore().collection('notifications').doc();
        batch.set(clientNotificationRef, {
            userId: request.auth.uid,
            type: 'BOOKING_SUBMITTED',
            title: 'Booking Request Submitted',
            message: `Your booking request for ${professionalData?.name} has been submitted and is pending approval`,
            data: {
                bookingId: bookingRef.id,
                professionalId,
                serviceType,
                date,
                startTime
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        logger.info(`Booking ${bookingRef.id} created for professional ${professionalId}`);
        return {
            booking: { id: bookingRef.id, ...bookingData },
            professional: { id: professionalId, name: professionalData?.name, hourlyRate }
        };
    }
    catch (error) {
        logger.error('Book professional error:', error);
        throw new https_1.HttpsError('internal', 'Failed to book professional');
    }
});
exports.updateBookingStatus = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { bookingId, status, message } = request.data;
    if (!bookingId || !status) {
        throw new https_1.HttpsError('invalid-argument', 'Booking ID and status are required');
    }
    if (!['CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid status');
    }
    try {
        const bookingRef = admin.firestore().collection('professionalBookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Booking not found');
        }
        const bookingData = bookingDoc.data();
        // Check permissions
        const canUpdate = bookingData?.professionalId === request.auth.uid ||
            bookingData?.clientId === request.auth.uid;
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!canUpdate && !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Cannot update this booking');
        }
        // Status-specific validations
        if (status === 'CONFIRMED' && bookingData?.professionalId !== request.auth.uid && !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the professional can confirm bookings');
        }
        if (status === 'CANCELLED' && bookingData?.clientId !== request.auth.uid && !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the client can cancel bookings');
        }
        // Update booking
        const updates = {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (message) {
            updates.statusMessage = message;
        }
        if (status === 'CONFIRMED') {
            updates.confirmedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        else if (status === 'COMPLETED') {
            updates.completedAt = admin.firestore.FieldValue.serverTimestamp();
            // Update professional's total bookings
            const professionalRef = admin.firestore().collection('professionals').doc(bookingData?.professionalId);
            await professionalRef.update({
                totalBookings: admin.firestore.FieldValue.increment(1),
            });
        }
        await bookingRef.update(updates);
        // Create notification for the other party
        const notificationRef = admin.firestore().collection('notifications').doc();
        const recipientId = bookingData?.professionalId === request.auth.uid ?
            bookingData?.clientId : bookingData?.professionalId;
        let notificationTitle = '';
        let notificationMessage = '';
        switch (status) {
            case 'CONFIRMED':
                notificationTitle = 'Booking Confirmed';
                notificationMessage = `Your booking request has been confirmed for ${bookingData?.date} at ${bookingData?.startTime}`;
                break;
            case 'DECLINED':
                notificationTitle = 'Booking Declined';
                notificationMessage = `Your booking request has been declined`;
                break;
            case 'CANCELLED':
                notificationTitle = 'Booking Cancelled';
                notificationMessage = `A booking has been cancelled for ${bookingData?.date} at ${bookingData?.startTime}`;
                break;
            case 'COMPLETED':
                notificationTitle = 'Booking Completed';
                notificationMessage = `Your booking session has been completed`;
                break;
        }
        await notificationRef.set({
            userId: recipientId,
            type: `BOOKING_${status}`,
            title: notificationTitle,
            message: notificationMessage,
            data: {
                bookingId,
                status,
                message
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, status };
    }
    catch (error) {
        logger.error('Update booking status error:', error);
        throw new https_1.HttpsError('internal', 'Failed to update booking status');
    }
});
exports.getProfessionalBookings = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { status, upcoming = true, limit = 50 } = request.data;
    try {
        let query = admin.firestore().collection('professionalBookings')
            .where('professionalId', '==', request.auth.uid);
        if (status) {
            query = query.where('status', '==', status);
        }
        if (upcoming) {
            const today = new Date().toISOString().split('T')[0];
            query = query.where('date', '>=', today);
        }
        const snapshot = await query
            .orderBy('date', upcoming ? 'asc' : 'desc')
            .orderBy('startTime', 'asc')
            .limit(limit)
            .get();
        const bookings = [];
        for (const doc of snapshot.docs) {
            const bookingData = doc.data();
            // Get client details
            const clientRef = admin.firestore().collection('users').doc(bookingData.clientId);
            const clientDoc = await clientRef.get();
            const clientData = clientDoc.data();
            bookings.push({
                id: doc.id,
                ...bookingData,
                client: clientData ? {
                    id: clientDoc.id,
                    name: clientData.name,
                    email: clientData.email,
                    profileImage: clientData.profileImage
                } : null
            });
        }
        return { bookings };
    }
    catch (error) {
        logger.error('Get professional bookings error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch professional bookings');
    }
});
exports.getClientBookings = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { status, upcoming = true, limit = 50 } = request.data;
    try {
        let query = admin.firestore().collection('professionalBookings')
            .where('clientId', '==', request.auth.uid);
        if (status) {
            query = query.where('status', '==', status);
        }
        if (upcoming) {
            const today = new Date().toISOString().split('T')[0];
            query = query.where('date', '>=', today);
        }
        const snapshot = await query
            .orderBy('date', upcoming ? 'asc' : 'desc')
            .orderBy('startTime', 'asc')
            .limit(limit)
            .get();
        const bookings = [];
        for (const doc of snapshot.docs) {
            const bookingData = doc.data();
            // Get professional details
            const professionalRef = admin.firestore().collection('professionals').doc(bookingData.professionalId);
            const professionalDoc = await professionalRef.get();
            const professionalData = professionalDoc.data();
            bookings.push({
                id: doc.id,
                ...bookingData,
                professional: professionalData ? {
                    id: professionalDoc.id,
                    name: professionalData.name,
                    profileImage: professionalData.profileImage,
                    rating: professionalData.rating,
                    danceStyles: professionalData.danceStyles
                } : null
            });
        }
        return { bookings };
    }
    catch (error) {
        logger.error('Get client bookings error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch client bookings');
    }
});
// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(value) {
    return value * Math.PI / 180;
}
//# sourceMappingURL=professional-booking.js.map