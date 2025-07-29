/**
 * Firebase-aware API utilities for making requests to the server
 */

import axios from "axios";
import { getFirebaseToken } from "./firebase";

// Use a static API_BASE_URL instead of runtime import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/";

export const firebaseApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor for Firebase auth token
firebaseApi.interceptors.request.use(async (config) => {
  try {
    // Try to get Firebase token first
    const firebaseToken = await getFirebaseToken();
    if (firebaseToken) {
      config.headers.Authorization = `Bearer ${firebaseToken}`;
      return config;
    }

    // Fallback to JWT token if no Firebase token
    const jwtToken = localStorage.getItem("access_token");
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
  } catch (error) {
    console.warn("Failed to get Firebase token:", error);
    
    // Fallback to JWT token
    const jwtToken = localStorage.getItem("access_token");
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
  }

  // Remove any existing CORS headers to prevent duplication
  delete config.headers["Access-Control-Allow-Origin"];
  delete config.headers["Access-Control-Allow-Methods"];
  delete config.headers["Access-Control-Allow-Headers"];
  delete config.headers["Access-Control-Allow-Credentials"];
  
  return config;
});

// Add response interceptor for error handling
firebaseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear both tokens on 401
      localStorage.removeItem("access_token");
      // Firebase logout will be handled by the auth context
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleFirebaseApiError = (error: any) => {
  if (error.response) {
    console.error("Firebase API Error:", error.response.data);
    return error.response.data;
  } else if (error.request) {
    console.error("Firebase API Request Error:", error.request);
    return { message: "No response from server" };
  } else {
    console.error("Firebase API Setup Error:", error.message);
    return { message: error.message };
  }
};

export default firebaseApi;