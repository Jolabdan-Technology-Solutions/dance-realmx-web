import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { api } from './api';

// Use a static API_BASE_URL instead of runtime import.meta.env
const API_BASE_URL = 'https://livetestdomain.com/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    try {
      const endpoint = queryKey[0] as string;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        if (options.on401 === "returnNull") {
          return null as T;
        }
        throw new Error("Unauthorized");
      }
      console.error('Query error:', error);
      throw error;
    }
  };
};

export const apiRequest = async (endpoint: string, options = {}) => {
  try {
    const response = await api.post(
      endpoint,
      {...options}
    );
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};