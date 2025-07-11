/**
 * API utilities for making requests to the server
 */

import axios from "axios";

// Use a static API_BASE_URL instead of runtime import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Remove any existing CORS headers to prevent duplication
  delete config.headers["Access-Control-Allow-Origin"];
  delete config.headers["Access-Control-Allow-Methods"];
  delete config.headers["Access-Control-Allow-Headers"];
  delete config.headers["Access-Control-Allow-Credentials"];
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      // Don't redirect automatically - let components handle it
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error("API Error:", error.response.data);
    return error.response.data;
  } else if (error.request) {
    // The request was made but no response was received
    console.error("API Request Error:", error.request);
    return { message: "No response from server" };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("API Setup Error:", error.message);
    return { message: error.message };
  }
};

export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  customHeaders?: Record<string, string>
) {
  const url = path.startsWith("http") ? path : path;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
    //credentials: 'include',
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number }
) {
  const { timeout = 8000, ...options } = init || {};

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
