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
exports.getUserAnalytics = exports.getCourseAnalytics = exports.getAdminAnalytics = exports.getInstructorAnalytics = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Instructor Analytics
exports.getInstructorAnalytics = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { timeRange = '30d', instructorId } = request.data;
    try {
        const targetInstructorId = instructorId || request.auth.uid;
        // Check permissions
        if (targetInstructorId !== request.auth.uid) {
            const userRef = admin.firestore().collection('users').doc(request.auth.uid);
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            if (!userData?.role?.includes('ADMIN')) {
                throw new https_1.HttpsError('permission-denied', 'Cannot view another instructor\'s analytics');
            }
        }
        const timeRangeMs = getTimeRangeMs(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        // Get instructor courses
        const coursesSnapshot = await admin.firestore()
            .collection('courses')
            .where('instructorId', '==', targetInstructorId)
            .where('isActive', '==', true)
            .get();
        const courseIds = coursesSnapshot.docs.map(doc => doc.id);
        if (courseIds.length === 0) {
            return {
                overview: { totalStudents: 0, totalRevenue: 0, totalCourses: 0, avgRating: 0 },
                coursePerformance: [],
                revenueData: [],
                studentEngagement: { totalEnrollments: 0, completionRate: 0, avgProgress: 0 }
            };
        }
        // Get enrollments
        const enrollmentsSnapshot = await admin.firestore()
            .collection('enrollments')
            .where('courseId', 'in', courseIds.slice(0, 10)) // Firestore 'in' limit
            .get();
        // Get payments
        const paymentsSnapshot = await admin.firestore()
            .collection('payments')
            .where('createdAt', '>=', startDate)
            .where('status', '==', 'SUCCEEDED')
            .get();
        // Calculate overview metrics
        const totalStudents = new Set(enrollmentsSnapshot.docs.map(doc => doc.data().userId)).size;
        const totalCourses = courseIds.length;
        let totalRevenue = 0;
        const revenueByDate = new Map();
        paymentsSnapshot.docs.forEach(doc => {
            const paymentData = doc.data();
            // Check if payment is for instructor's courses
            const courseId = paymentData.metadata?.courseId;
            if (courseIds.includes(courseId)) {
                totalRevenue += paymentData.amount;
                const date = paymentData.createdAt.toDate().toISOString().split('T')[0];
                revenueByDate.set(date, (revenueByDate.get(date) || 0) + paymentData.amount);
            }
        });
        // Calculate average rating
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const avgRating = courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length;
        // Course performance
        const coursePerformance = courses.map((course) => {
            const courseEnrollments = enrollmentsSnapshot.docs.filter(doc => doc.data().courseId === course.id);
            const completedEnrollments = courseEnrollments.filter(doc => doc.data().status === 'COMPLETED');
            return {
                courseId: course.id,
                courseName: course.title,
                enrollments: courseEnrollments.length,
                completions: completedEnrollments.length,
                completionRate: courseEnrollments.length > 0 ? (completedEnrollments.length / courseEnrollments.length) * 100 : 0,
                rating: course.rating || 0,
                reviewCount: course.reviewCount || 0
            };
        });
        // Revenue data for chart
        const revenueData = Array.from(revenueByDate.entries()).map(([date, amount]) => ({
            date,
            amount,
            formattedDate: new Date(date).toLocaleDateString()
        })).sort((a, b) => a.date.localeCompare(b.date));
        // Student engagement
        const totalEnrollments = enrollmentsSnapshot.docs.length;
        const completedEnrollments = enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'COMPLETED').length;
        const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
        const avgProgress = enrollmentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().progress || 0), 0) / Math.max(totalEnrollments, 1);
        return {
            overview: {
                totalStudents,
                totalRevenue,
                totalCourses,
                avgRating: Math.round(avgRating * 10) / 10
            },
            coursePerformance: coursePerformance.sort((a, b) => b.enrollments - a.enrollments),
            revenueData,
            studentEngagement: {
                totalEnrollments,
                completionRate: Math.round(completionRate * 10) / 10,
                avgProgress: Math.round(avgProgress * 10) / 10
            }
        };
    }
    catch (error) {
        logger.error('Get instructor analytics error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch instructor analytics');
    }
});
// Admin Analytics
exports.getAdminAnalytics = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Check admin permissions
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Admin access required');
        }
        const { timeRange = '30d' } = request.data;
        const timeRangeMs = getTimeRangeMs(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        // Get platform-wide metrics
        const [usersSnapshot, coursesSnapshot, enrollmentsSnapshot, paymentsSnapshot, subscriptionsSnapshot] = await Promise.all([
            admin.firestore().collection('users').get(),
            admin.firestore().collection('courses').where('isActive', '==', true).get(),
            admin.firestore().collection('enrollments').where('enrolledAt', '>=', startDate).get(),
            admin.firestore().collection('payments').where('createdAt', '>=', startDate).where('status', '==', 'SUCCEEDED').get(),
            admin.firestore().collection('subscriptions').where('status', 'in', ['ACTIVE', 'TRIALING']).get()
        ]);
        // Calculate metrics
        const totalUsers = usersSnapshot.size;
        const totalCourses = coursesSnapshot.size;
        const newEnrollments = enrollmentsSnapshot.size;
        const totalRevenue = paymentsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        const activeSubscriptions = subscriptionsSnapshot.size;
        // User growth data
        const userGrowthByDate = new Map();
        usersSnapshot.docs.forEach(doc => {
            const userData = doc.data();
            if (userData.createdAt && userData.createdAt.toDate() >= startDate) {
                const date = userData.createdAt.toDate().toISOString().split('T')[0];
                userGrowthByDate.set(date, (userGrowthByDate.get(date) || 0) + 1);
            }
        });
        // Revenue by date
        const revenueByDate = new Map();
        paymentsSnapshot.docs.forEach(doc => {
            const paymentData = doc.data();
            const date = paymentData.createdAt.toDate().toISOString().split('T')[0];
            revenueByDate.set(date, (revenueByDate.get(date) || 0) + paymentData.amount);
        });
        // Top courses
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const topCourses = courses
            .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
            .slice(0, 10)
            .map((course) => ({
            id: course.id,
            title: course.title,
            enrollments: course.enrollmentCount || 0,
            rating: course.rating || 0,
            instructor: course.instructorName || 'Unknown'
        }));
        // User role distribution
        const roleDistribution = { STUDENT: 0, INSTRUCTOR: 0, PROFESSIONAL: 0, ADMIN: 0 };
        usersSnapshot.docs.forEach(doc => {
            const userData = doc.data();
            const roles = userData.role || ['GUEST_USER'];
            roles.forEach((role) => {
                if (roleDistribution.hasOwnProperty(role)) {
                    roleDistribution[role]++;
                }
            });
        });
        return {
            overview: {
                totalUsers,
                totalCourses,
                newEnrollments,
                totalRevenue,
                activeSubscriptions
            },
            userGrowth: Array.from(userGrowthByDate.entries()).map(([date, count]) => ({
                date,
                count,
                formattedDate: new Date(date).toLocaleDateString()
            })).sort((a, b) => a.date.localeCompare(b.date)),
            revenueData: Array.from(revenueByDate.entries()).map(([date, amount]) => ({
                date,
                amount,
                formattedDate: new Date(date).toLocaleDateString()
            })).sort((a, b) => a.date.localeCompare(b.date)),
            topCourses,
            roleDistribution
        };
    }
    catch (error) {
        logger.error('Get admin analytics error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch admin analytics');
    }
});
// Course Analytics
exports.getCourseAnalytics = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId, timeRange = '30d' } = request.data;
    if (!courseId) {
        throw new https_1.HttpsError('invalid-argument', 'Course ID is required');
    }
    try {
        // Verify course exists and check permissions
        const courseRef = admin.firestore().collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Course not found');
        }
        const courseData = courseDoc.data();
        // Check permissions
        const isInstructor = courseData?.instructorId === request.auth.uid;
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const isAdmin = userData?.role?.includes('ADMIN');
        if (!isInstructor && !isAdmin) {
            throw new https_1.HttpsError('permission-denied', 'Cannot view analytics for this course');
        }
        const timeRangeMs = getTimeRangeMs(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        // Get course enrollments
        const enrollmentsSnapshot = await admin.firestore()
            .collection('enrollments')
            .where('courseId', '==', courseId)
            .get();
        // Get recent enrollments
        const recentEnrollmentsSnapshot = await admin.firestore()
            .collection('enrollments')
            .where('courseId', '==', courseId)
            .where('enrolledAt', '>=', startDate)
            .get();
        // Get lesson progress
        const lessonProgressSnapshot = await admin.firestore()
            .collection('lessonProgress')
            .where('courseId', '==', courseId)
            .get();
        // Get quiz attempts
        const quizAttemptsSnapshot = await admin.firestore()
            .collection('quizAttempts')
            .where('courseId', '==', courseId)
            .get();
        // Get reviews
        const reviewsSnapshot = await admin.firestore()
            .collection('reviews')
            .where('targetType', '==', 'course')
            .where('targetId', '==', courseId)
            .where('isVisible', '==', true)
            .get();
        // Calculate metrics
        const totalEnrollments = enrollmentsSnapshot.size;
        const newEnrollments = recentEnrollmentsSnapshot.size;
        const completedEnrollments = enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'COMPLETED').length;
        const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
        // Progress distribution
        const progressDistribution = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
        enrollmentsSnapshot.docs.forEach(doc => {
            const progress = doc.data().progress || 0;
            if (progress <= 25)
                progressDistribution['0-25']++;
            else if (progress <= 50)
                progressDistribution['26-50']++;
            else if (progress <= 75)
                progressDistribution['51-75']++;
            else
                progressDistribution['76-100']++;
        });
        // Enrollment trend
        const enrollmentsByDate = new Map();
        recentEnrollmentsSnapshot.docs.forEach(doc => {
            const enrollmentData = doc.data();
            const date = enrollmentData.enrolledAt.toDate().toISOString().split('T')[0];
            enrollmentsByDate.set(date, (enrollmentsByDate.get(date) || 0) + 1);
        });
        // Quiz performance
        const quizAttempts = quizAttemptsSnapshot.docs.map(doc => doc.data());
        const avgQuizScore = quizAttempts.length > 0 ?
            quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length : 0;
        // Reviews summary
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        const avgRating = reviews.length > 0 ?
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
        return {
            overview: {
                totalEnrollments,
                newEnrollments,
                completionRate: Math.round(completionRate * 10) / 10,
                avgRating: Math.round(avgRating * 10) / 10,
                totalReviews: reviews.length
            },
            progressDistribution,
            enrollmentTrend: Array.from(enrollmentsByDate.entries()).map(([date, count]) => ({
                date,
                count,
                formattedDate: new Date(date).toLocaleDateString()
            })).sort((a, b) => a.date.localeCompare(b.date)),
            quizPerformance: {
                avgScore: Math.round(avgQuizScore * 10) / 10,
                totalAttempts: quizAttempts.length,
                passRate: quizAttempts.length > 0 ?
                    (quizAttempts.filter(attempt => attempt.passed).length / quizAttempts.length) * 100 : 0
            },
            studentEngagement: {
                totalLessonViews: lessonProgressSnapshot.size,
                uniqueStudents: new Set(lessonProgressSnapshot.docs.map(doc => doc.data().userId)).size
            }
        };
    }
    catch (error) {
        logger.error('Get course analytics error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch course analytics');
    }
});
// User Analytics
exports.getUserAnalytics = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, timeRange = '30d' } = request.data;
    const targetUserId = userId || request.auth.uid;
    try {
        // Check permissions
        if (targetUserId !== request.auth.uid) {
            const userRef = admin.firestore().collection('users').doc(request.auth.uid);
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            if (!userData?.role?.includes('ADMIN')) {
                throw new https_1.HttpsError('permission-denied', 'Cannot view another user\'s analytics');
            }
        }
        const timeRangeMs = getTimeRangeMs(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        // Get user data
        const [enrollmentsSnapshot, lessonProgressSnapshot, quizAttemptsSnapshot, bookingsSnapshot, paymentsSnapshot] = await Promise.all([
            admin.firestore().collection('enrollments').where('userId', '==', targetUserId).get(),
            admin.firestore().collection('lessonProgress').where('userId', '==', targetUserId).get(),
            admin.firestore().collection('quizAttempts').where('userId', '==', targetUserId).get(),
            admin.firestore().collection('professionalBookings').where('clientId', '==', targetUserId).get(),
            admin.firestore().collection('payments').where('userId', '==', targetUserId).where('status', '==', 'SUCCEEDED').get()
        ]);
        // Calculate learning metrics
        const totalCourses = enrollmentsSnapshot.size;
        const completedCourses = enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'COMPLETED').length;
        const avgProgress = enrollmentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().progress || 0), 0) / Math.max(totalCourses, 1);
        const totalLessonsCompleted = lessonProgressSnapshot.docs.filter(doc => doc.data().completed).length;
        const totalQuizAttempts = quizAttemptsSnapshot.size;
        const passedQuizzes = quizAttemptsSnapshot.docs.filter(doc => doc.data().passed).length;
        // Spending analysis
        const totalSpent = paymentsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        // Booking history
        const totalBookings = bookingsSnapshot.size;
        const completedBookings = bookingsSnapshot.docs.filter(doc => doc.data().status === 'COMPLETED').length;
        // Learning streak (simplified)
        const recentLessonProgress = lessonProgressSnapshot.docs
            .filter(doc => doc.data().completedAt && doc.data().completedAt.toDate() >= startDate)
            .sort((a, b) => b.data().completedAt.toDate().getTime() - a.data().completedAt.toDate().getTime());
        return {
            learningProgress: {
                totalCourses,
                completedCourses,
                avgProgress: Math.round(avgProgress * 10) / 10,
                completionRate: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0
            },
            activity: {
                totalLessonsCompleted,
                totalQuizAttempts,
                passedQuizzes,
                quizPassRate: totalQuizAttempts > 0 ? (passedQuizzes / totalQuizAttempts) * 100 : 0
            },
            bookings: {
                totalBookings,
                completedBookings,
                completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
            },
            spending: {
                totalSpent,
                avgPerCourse: totalCourses > 0 ? totalSpent / totalCourses : 0
            },
            recentActivity: recentLessonProgress.slice(0, 10).map(doc => ({
                lessonId: doc.data().lessonId,
                completedAt: doc.data().completedAt.toDate(),
                courseId: doc.data().courseId
            }))
        };
    }
    catch (error) {
        logger.error('Get user analytics error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch user analytics');
    }
});
// Helper function to convert time range to milliseconds
function getTimeRangeMs(timeRange) {
    switch (timeRange) {
        case '7d': return 7 * 24 * 60 * 60 * 1000;
        case '30d': return 30 * 24 * 60 * 60 * 1000;
        case '90d': return 90 * 24 * 60 * 60 * 1000;
        case '1y': return 365 * 24 * 60 * 60 * 1000;
        default: return 30 * 24 * 60 * 60 * 1000;
    }
}
//# sourceMappingURL=analytics.js.map