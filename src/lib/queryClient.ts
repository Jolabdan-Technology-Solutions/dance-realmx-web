import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

// Use a static API_BASE_URL instead of runtime import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Firebase-based query client - all API calls now use Firebase Functions or Firestore
// No more REST API endpoints

// Example Firebase-based query using Firestore
// For categories, courses, etc. - use the Firestore service functions

// DEPRECATED: Stub function for backward compatibility during Firebase migration
export const apiRequest = async <T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    requireAuth?: boolean;
    headers?: Record<string, string>;
  }
): Promise<T> => {
  console.warn(`DEPRECATED: apiRequest called for ${endpoint}. Use Firebase Functions or Firestore directly.`);
  throw new Error(`Legacy API endpoint ${endpoint} not available. Use Firebase Functions or Firestore.`);
};

// DEPRECATED: Stub apiClient for backward compatibility  
export const apiClient = {
  get: () => {
    throw new Error("DEPRECATED: apiClient.get() not available. Use Firebase Functions or Firestore directly.");
  },
  post: () => {
    throw new Error("DEPRECATED: apiClient.post() not available. Use Firebase Functions or Firestore directly.");
  },
  put: () => {
    throw new Error("DEPRECATED: apiClient.put() not available. Use Firebase Functions or Firestore directly.");
  },
  delete: () => {
    throw new Error("DEPRECATED: apiClient.delete() not available. Use Firebase Functions or Firestore directly.");
  },
  patch: () => {
    throw new Error("DEPRECATED: apiClient.patch() not available. Use Firebase Functions or Firestore directly.");
  },
};
