/**
 * Test component to verify client-side Firestore CRUD operations work
 */

import React, { useState, useEffect } from 'react';
import { 
  getCourses, 
  createCourse, 
  getUserProfile, 
  updateUserProfile,
  getNotifications,
  markNotificationRead,
  createNotification 
} from '../../lib/firestore';
import { useAuth } from '../../hooks/use-auth';

export const FirestoreTest: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { user } = useAuth();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCoursesCRUD = async () => {
    try {
      // Test getCourses
      const coursesList = await getCourses();
      setCourses(coursesList);
      addResult(`✅ getCourses: Found ${coursesList.length} courses`);

      // Test createCourse (if user is authenticated)
      if (user) {
        const newCourse = await createCourse({
          title: 'Test Course',
          description: 'Client-side test course',
          price: 99
        }, user.uid);
        addResult(`✅ createCourse: Created course ${newCourse.id}`);
      }
    } catch (error) {
      addResult(`❌ Courses test failed: ${error}`);
    }
  };

  const testUserProfile = async () => {
    if (!user) {
      addResult('⚠️ User not authenticated, skipping user tests');
      return;
    }

    try {
      // Test getUserProfile
      const profile = await getUserProfile(user.uid);
      addResult(`✅ getUserProfile: ${profile ? 'Found profile' : 'No profile found'}`);

      // Test updateUserProfile
      await updateUserProfile(user.uid, {
        lastTestRun: new Date().toISOString()
      });
      addResult(`✅ updateUserProfile: Updated successfully`);
    } catch (error) {
      addResult(`❌ User profile test failed: ${error}`);
    }
  };

  const testNotifications = async () => {
    if (!user) {
      addResult('⚠️ User not authenticated, skipping notification tests');
      return;
    }

    try {
      // Test createNotification
      const newNotification = await createNotification({
        userId: user.uid,
        type: 'TEST',
        title: 'Test Notification',
        message: 'This is a client-side test notification'
      });
      addResult(`✅ createNotification: Created ${newNotification.id}`);

      // Test real-time getNotifications
      const unsubscribe = getNotifications(user.uid, (notificationsList) => {
        setNotifications(notificationsList);
        addResult(`✅ getNotifications: Real-time update with ${notificationsList.length} notifications`);
      });

      // Clean up listener after 3 seconds
      setTimeout(() => {
        unsubscribe();
        addResult(`✅ Unsubscribed from notifications listener`);
      }, 3000);

    } catch (error) {
      addResult(`❌ Notifications test failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 Starting Firestore client-side tests...');
    
    await testCoursesCRUD();
    await testUserProfile();
    await testNotifications();
    
    addResult('✨ All tests completed!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Firestore Client-Side CRUD Test</h2>
      
      <div className="mb-6">
        <button 
          onClick={runAllTests}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Run All Tests
        </button>
      </div>

      {/* Test Results */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
        <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm font-mono">
              {result}
            </div>
          ))}
        </div>
      </div>

      {/* Courses Data */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Courses ({courses.length}):</h3>
        <div className="bg-gray-50 p-4 rounded max-h-40 overflow-y-auto">
          {courses.map((course, index) => (
            <div key={index} className="text-sm mb-1">
              {course.title} - {course.instructorId}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Data */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Notifications ({notifications.length}):</h3>
        <div className="bg-gray-50 p-4 rounded max-h-40 overflow-y-auto">
          {notifications.map((notification, index) => (
            <div key={index} className="text-sm mb-1">
              <span className={notification.read ? 'text-gray-500' : 'font-bold'}>
                {notification.title}: {notification.message}
              </span>
              {!notification.read && (
                <button 
                  onClick={() => markNotificationRead(notification.id)}
                  className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};