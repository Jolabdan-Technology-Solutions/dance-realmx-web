#!/bin/bash
# Delete all bloated functions

firebase functions:delete bookProfessional --region us-central1 --confirm
firebase functions:delete cancelSubscription --region us-central1 --confirm
firebase functions:delete clearCart --region us-central1 --confirm
firebase functions:delete createQuiz --region us-central1 --confirm
firebase functions:delete createReview --region us-central1 --confirm
firebase functions:delete deleteCourse --region us-central1 --confirm
firebase functions:delete getCategories --region us-central1 --confirm
firebase functions:delete getCourses --region us-central1 --confirm
firebase functions:delete getMyCourses --region us-central1 --confirm
firebase functions:delete getOrders --region us-central1 --confirm
firebase functions:delete getQuizzes --region us-central1 --confirm
firebase functions:delete getResource --region us-central1 --confirm
firebase functions:delete getReviewStats --region us-central1 --confirm
firebase functions:delete getUserAnalyticsMain --region us-central1 --confirm
firebase functions:delete getUserProfile --region us-central1 --confirm
firebase functions:delete markNotificationRead --region us-central1 --confirm
firebase functions:delete registerUser --region us-central1 --confirm
firebase functions:delete updateBooking --region us-central1 --confirm
firebase functions:delete updateCourse --region us-central1 --confirm
firebase functions:delete updateEnrollmentProgress --region us-central1 --confirm
firebase functions:delete updateNotificationSettings --region us-central1 --confirm
firebase functions:delete updateResource --region us-central1 --confirm
firebase functions:delete updateSubscription --region us-central1 --confirm