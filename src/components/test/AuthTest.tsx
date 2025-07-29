/**
 * Test component to verify Firebase auth system works
 */

import React, { useState } from 'react';
import { useFirebaseAuth } from '../../hooks/use-firebase-auth-new';

export const AuthTest: React.FC = () => {
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });
  const [usernameForm, setUsernameForm] = useState({ username: '' });
  
  const { 
    user, 
    isLoading, 
    login, 
    loginWithGoogle, 
    register, 
    logout, 
    setUsername,
    hasUsername,
    isAuthenticated 
  } = useFirebaseAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginForm.usernameOrEmail, loginForm.password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(registerForm.email, registerForm.password, registerForm.name);
  };

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    await setUsername(usernameForm.username);
  };

  const checkHasUsername = async () => {
    const result = await hasUsername();
    alert(`Has username: ${result}`);
  };

  if (isLoading) {
    return <div className="p-6">Loading authentication...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Firebase Auth Test</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Auth Status:</h3>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        {user && (
          <div className="mt-2">
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Display Name:</strong> {user.displayName}</p>
            <p><strong>Profile Username:</strong> {user.profile?.username || 'Not set'}</p>
            <p><strong>Profile Role:</strong> {user.profile?.role?.join(', ') || 'No roles'}</p>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Login Form */}
          <div className="border p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">Login</h3>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="text"
                placeholder="Username or Email"
                value={loginForm.usernameOrEmail}
                onChange={(e) => setLoginForm({...loginForm, usernameOrEmail: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                Login
              </button>
            </form>
            
            <div className="mt-3">
              <button 
                onClick={loginWithGoogle}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                Login with Google
              </button>
            </div>
          </div>

          {/* Register Form */}
          <div className="border p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">Register</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
                Register
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={logout}
              className="bg-red-500 text-white p-3 rounded hover:bg-red-600"
            >
              Logout
            </button>
            
            <button 
              onClick={checkHasUsername}
              className="bg-purple-500 text-white p-3 rounded hover:bg-purple-600"
            >
              Check Has Username
            </button>
          </div>

          {/* Set Username */}
          <div className="border p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">Set Username</h3>
            <form onSubmit={handleSetUsername} className="flex gap-3">
              <input
                type="text"
                placeholder="Choose username"
                value={usernameForm.username}
                onChange={(e) => setUsernameForm({username: e.target.value})}
                className="flex-1 p-2 border rounded"
                required
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Set Username
              </button>
            </form>
          </div>

          {/* Test Username Login */}
          <div className="border p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">Test Username Login</h3>
            <p className="text-sm text-gray-600 mb-3">
              After setting a username, logout and try logging in with your username instead of email.
            </p>
            <p className="text-sm">
              <strong>Your username:</strong> {user.profile?.username || 'Not set yet'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};