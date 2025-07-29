/**
 * Complete test page for Firebase auth and client-side CRUD
 */

import React, { useState } from 'react';
import { FirebaseAuthProvider } from '../hooks/use-firebase-auth-new';
import { AuthTest } from '../components/test/AuthTest';
import { FirestoreTest } from '../components/test/FirestoreTest';

const TestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'auth' | 'firestore'>('auth');

  return (
    <FirebaseAuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-center mb-8">Firebase System Test</h1>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setActiveTab('auth')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === 'auth' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Authentication Test
              </button>
              <button
                onClick={() => setActiveTab('firestore')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === 'firestore' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Firestore CRUD Test
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm">
            {activeTab === 'auth' && <AuthTest />}
            {activeTab === 'firestore' && <FirestoreTest />}
          </div>

          {/* System Status */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Deployed Successfully</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 7 Essential Cloud Functions</li>
                  <li>• Client-side Firestore CRUD</li>
                  <li>• Username + Email auth</li>
                  <li>• Google OAuth integration</li>
                  <li>• Wide-open Firestore rules</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">🔧 Architecture</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Functions: Payments, Auth, Complex Logic</li>
                  <li>• Firestore: 90% of CRUD operations</li>
                  <li>• Real-time: onSnapshot subscriptions</li>
                  <li>• Auth: Firebase Auth + username lookup</li>
                  <li>• Storage: Cloud Storage for files</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FirebaseAuthProvider>
  );
};

export default TestPage;