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
exports.getQuizAttempts = exports.submitQuiz = exports.getQuizQuestions = exports.addQuizQuestion = exports.getQuizzes = exports.createQuiz = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Quiz CRUD
exports.createQuiz = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { lessonId, title, description, passingScore = 70, timeLimit, maxAttempts = 3 } = request.data;
    if (!lessonId || !title) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID and title are required');
    }
    try {
        // Check lesson exists and get course permissions
        const lessonRef = admin.firestore().collection('lessons').doc(lessonId);
        const lessonDoc = await lessonRef.get();
        if (!lessonDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Lesson not found');
        }
        const lessonData = lessonDoc.data();
        const courseRef = admin.firestore().collection('courses').doc(lessonData?.courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can create quizzes');
        }
        const quizRef = admin.firestore().collection('quizzes').doc();
        const quizData = {
            lessonId,
            courseId: lessonData?.courseId,
            moduleId: lessonData?.moduleId,
            title,
            description: description || '',
            passingScore,
            timeLimit: timeLimit || null,
            maxAttempts,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await quizRef.set(quizData);
        logger.info(`Created quiz: ${title} for lesson ${lessonId}`);
        return { quiz: { id: quizRef.id, ...quizData } };
    }
    catch (error) {
        logger.error('Create quiz error:', error);
        throw new https_1.HttpsError('internal', 'Failed to create quiz');
    }
});
exports.getQuizzes = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { lessonId, courseId } = request.data;
    if (!lessonId && !courseId) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID or Course ID is required');
    }
    try {
        let query = admin.firestore().collection('quizzes')
            .where('isActive', '==', true);
        if (lessonId) {
            query = query.where('lessonId', '==', lessonId);
        }
        else if (courseId) {
            query = query.where('courseId', '==', courseId);
        }
        const snapshot = await query.get();
        const quizzes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { quizzes };
    }
    catch (error) {
        logger.error('Get quizzes error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch quizzes');
    }
});
// Quiz Questions CRUD
exports.addQuizQuestion = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { quizId, question, type = 'MULTIPLE_CHOICE', options = [], correctAnswer, points = 1, explanation } = request.data;
    if (!quizId || !question || !correctAnswer) {
        throw new https_1.HttpsError('invalid-argument', 'Quiz ID, question, and correct answer are required');
    }
    try {
        // Check quiz exists and permissions
        const quizRef = admin.firestore().collection('quizzes').doc(quizId);
        const quizDoc = await quizRef.get();
        if (!quizDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Quiz not found');
        }
        const quizData = quizDoc.data();
        const courseRef = admin.firestore().collection('courses').doc(quizData?.courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        const userRef = admin.firestore().collection('users').doc(request.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (courseData?.instructorId !== request.auth.uid &&
            !userData?.role?.includes('ADMIN')) {
            throw new https_1.HttpsError('permission-denied', 'Only the instructor or admin can add questions');
        }
        const questionRef = admin.firestore().collection('quizQuestions').doc();
        const questionData = {
            quizId,
            question,
            type,
            options,
            correctAnswer,
            points,
            explanation: explanation || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await questionRef.set(questionData);
        return { question: { id: questionRef.id, ...questionData } };
    }
    catch (error) {
        logger.error('Add quiz question error:', error);
        throw new https_1.HttpsError('internal', 'Failed to add quiz question');
    }
});
exports.getQuizQuestions = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { quizId } = request.data;
    if (!quizId) {
        throw new https_1.HttpsError('invalid-argument', 'Quiz ID is required');
    }
    try {
        const questionsRef = admin.firestore().collection('quizQuestions');
        const snapshot = await questionsRef
            .where('quizId', '==', quizId)
            .get();
        const questions = snapshot.docs.map(doc => {
            const data = doc.data();
            // Don't expose correct answers to students
            if (request.auth) {
                // Check if user is instructor/admin later, for now hide answers
                delete data.correctAnswer;
            }
            return {
                id: doc.id,
                ...data
            };
        });
        return { questions };
    }
    catch (error) {
        logger.error('Get quiz questions error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch quiz questions');
    }
});
// Quiz Attempts
exports.submitQuiz = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { quizId, answers } = request.data;
    if (!quizId || !answers) {
        throw new https_1.HttpsError('invalid-argument', 'Quiz ID and answers are required');
    }
    try {
        // Get quiz details
        const quizRef = admin.firestore().collection('quizzes').doc(quizId);
        const quizDoc = await quizRef.get();
        if (!quizDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Quiz not found');
        }
        const quizData = quizDoc.data();
        // Check if user is enrolled in the course
        const enrollmentQuery = await admin.firestore()
            .collection('enrollments')
            .where('userId', '==', request.auth.uid)
            .where('courseId', '==', quizData?.courseId)
            .where('status', '==', 'ACTIVE')
            .get();
        if (enrollmentQuery.empty) {
            throw new https_1.HttpsError('permission-denied', 'You must be enrolled to take this quiz');
        }
        // Check attempt limit
        const existingAttempts = await admin.firestore()
            .collection('quizAttempts')
            .where('userId', '==', request.auth.uid)
            .where('quizId', '==', quizId)
            .get();
        if (existingAttempts.size >= (quizData?.maxAttempts || 3)) {
            throw new https_1.HttpsError('resource-exhausted', 'Maximum attempts exceeded');
        }
        // Get correct answers
        const questionsRef = admin.firestore().collection('quizQuestions');
        const questionsSnapshot = await questionsRef
            .where('quizId', '==', quizId)
            .get();
        const questions = questionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Calculate score
        let totalPoints = 0;
        let earnedPoints = 0;
        const results = [];
        for (const question of questions) {
            const questionData = question;
            totalPoints += questionData.points || 1;
            const userAnswer = answers[question.id];
            const isCorrect = userAnswer === questionData.correctAnswer;
            if (isCorrect) {
                earnedPoints += questionData.points || 1;
            }
            results.push({
                questionId: question.id,
                userAnswer,
                correctAnswer: questionData.correctAnswer,
                isCorrect,
                points: isCorrect ? (questionData.points || 1) : 0
            });
        }
        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = score >= (quizData?.passingScore || 70);
        // Save attempt
        const attemptRef = admin.firestore().collection('quizAttempts').doc();
        const attemptData = {
            userId: request.auth.uid,
            quizId,
            courseId: quizData?.courseId,
            answers,
            results,
            score,
            totalPoints,
            earnedPoints,
            passed,
            attemptNumber: existingAttempts.size + 1,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await attemptRef.set(attemptData);
        return {
            attempt: { id: attemptRef.id, ...attemptData },
            score,
            passed,
            results: results.map(r => ({
                questionId: r.questionId,
                isCorrect: r.isCorrect,
                points: r.points
            }))
        };
    }
    catch (error) {
        logger.error('Submit quiz error:', error);
        throw new https_1.HttpsError('internal', 'Failed to submit quiz');
    }
});
exports.getQuizAttempts = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { quizId } = request.data;
    if (!quizId) {
        throw new https_1.HttpsError('invalid-argument', 'Quiz ID is required');
    }
    try {
        const attemptsRef = admin.firestore().collection('quizAttempts');
        const snapshot = await attemptsRef
            .where('userId', '==', request.auth.uid)
            .where('quizId', '==', quizId)
            .orderBy('submittedAt', 'desc')
            .get();
        const attempts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { attempts };
    }
    catch (error) {
        logger.error('Get quiz attempts error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch quiz attempts');
    }
});
//# sourceMappingURL=quizzes.js.map