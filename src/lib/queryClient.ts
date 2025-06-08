import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { api } from "./api";

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

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";

// ===========================================
// VARIATION 1: Original with Auth Support
// ===========================================
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
  requireAuth?: boolean;
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    try {
      const endpoint = queryKey[0] as string;
      const headers = options.requireAuth ? getAuthHeaders() : {};

      const response = await api.get(endpoint, { headers });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        switch (options.on401) {
          case "returnNull":
            return null as T;
          case "redirect":
            window.location.href = "/auth";
            return null as T;
          case "throw":
          default:
            throw new Error("Unauthorized");
        }
      }
      console.error("Query error:", error);
      throw error;
    }
  };
};

// ===========================================
// VARIATION 2: Generic API Request Function
// ===========================================
export const apiRequest = async <T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    requireAuth?: boolean;
    headers?: Record<string, string>;
  } = {}
): Promise<T> => {
  try {
    const {
      method = "POST",
      data,
      requireAuth = false,
      headers = {},
    } = options;

    const authHeaders = requireAuth ? getAuthHeaders() : {};
    const finalHeaders = { ...authHeaders, ...headers };

    const config = {
      headers: finalHeaders,
      ...(data && { data }),
    };

    let response;
    switch (method) {
      case "GET":
        response = await api.get(endpoint, { headers: finalHeaders });
        break;
      case "POST":
        response = await api.post(endpoint, data, { headers: finalHeaders });
        break;
      case "PUT":
        response = await api.put(endpoint, data, { headers: finalHeaders });
        break;
      case "DELETE":
        response = await api.delete(endpoint, { headers: finalHeaders });
        break;
      case "PATCH":
        response = await api.patch(endpoint, data, { headers: finalHeaders });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return response.data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// ===========================================
// VARIATION 3: Separate Authenticated Functions
// ===========================================
export const authenticatedQueryFn = <T>(
  options: {
    on401?: UnauthorizedBehavior;
  } = {}
): QueryFunction<T> => {
  return async ({ queryKey }) => {
    try {
      const endpoint = queryKey[0] as string;
      const token = getAuthToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const behavior = options.on401 || "throw";
        switch (behavior) {
          case "returnNull":
            return null as T;
          case "redirect":
            window.location.href = "/authn";
            return null as T;
          case "throw":
          default:
            throw new Error("Unauthorized");
        }
      }
      console.error("Authenticated query error:", error);
      throw error;
    }
  };
};

export const authenticatedRequest = async <T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "POST",
  data?: any,
  additionalHeaders: Record<string, string> = {}
): Promise<T> => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      ...additionalHeaders,
    };

    let response;
    switch (method) {
      case "GET":
        response = await api.get(endpoint, { headers });
        break;
      case "POST":
        response = await api.post(endpoint, data, { headers });
        break;
      case "PUT":
        response = await api.put(endpoint, data, { headers });
        break;
      case "DELETE":
        response = await api.delete(endpoint, { headers });
        break;
      case "PATCH":
        response = await api.patch(endpoint, data, { headers });
        break;
    }

    return response.data;
  } catch (error) {
    console.error("Authenticated request error:", error);
    throw error;
  }
};

// ===========================================
// VARIATION 4: Hook-style API Functions
// ===========================================
export const useApiRequest = () => {
  const makeRequest = async <T = any>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      data?: any;
      requireAuth?: boolean;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> => {
    const {
      method = "POST",
      data,
      requireAuth = false,
      headers = {},
    } = options;

    const authHeaders = requireAuth ? getAuthHeaders() : {};
    const finalHeaders = { ...authHeaders, ...headers };

    try {
      let response;
      switch (method) {
        case "GET":
          response = await api.get(endpoint, { headers: finalHeaders });
          break;
        case "POST":
          response = await api.post(endpoint, data, { headers: finalHeaders });
          break;
        case "PUT":
          response = await api.put(endpoint, data, { headers: finalHeaders });
          break;
        case "DELETE":
          response = await api.delete(endpoint, { headers: finalHeaders });
          break;
        case "PATCH":
          response = await api.patch(endpoint, data, { headers: finalHeaders });
          break;
      }

      return response.data;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  };

  return { makeRequest };
};

// ===========================================
// VARIATION 5: Class-based API Client
// ===========================================
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getHeaders(
    requireAuth: boolean = false,
    additionalHeaders: Record<string, string> = {}
  ) {
    const authHeaders = requireAuth ? getAuthHeaders() : {};
    return { ...authHeaders, ...additionalHeaders };
  }

  async get<T = any>(
    endpoint: string,
    requireAuth: boolean = false,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const finalHeaders = this.getHeaders(requireAuth, headers);
    const response = await api.get(endpoint, { headers: finalHeaders });
    return response.data;
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    requireAuth: boolean = false,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const finalHeaders = this.getHeaders(requireAuth, headers);
    const response = await api.post(endpoint, data, { headers: finalHeaders });
    return response.data;
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    requireAuth: boolean = false,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const finalHeaders = this.getHeaders(requireAuth, headers);
    const response = await api.put(endpoint, data, { headers: finalHeaders });
    return response.data;
  }

  async delete<T = any>(
    endpoint: string,
    requireAuth: boolean = false,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const finalHeaders = this.getHeaders(requireAuth, headers);
    const response = await api.delete(endpoint, { headers: finalHeaders });
    return response.data;
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    requireAuth: boolean = false,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const finalHeaders = this.getHeaders(requireAuth, headers);
    const response = await api.patch(endpoint, data, { headers: finalHeaders });
    return response.data;
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// ===========================================
// USAGE EXAMPLES
// ===========================================

/*
// Using Variation 1 (Enhanced Original)
const userQuery = useQuery({
  queryKey: ['/users/me'],
  queryFn: getQueryFn<User>({ on401: 'redirect', requireAuth: true })
});

// Using Variation 2 (Generic)
const userData = await apiRequest<User>('/users/me', {
  method: 'GET',
  requireAuth: true
});

const createUser = await apiRequest<User>('/users', {
  method: 'POST',
  data: { name: 'John', email: 'john@example.com' },
  requireAuth: true
});

// Using Variation 3 (Authenticated)
const userQuery = useQuery({
  queryKey: ['/users/me'],
  queryFn: authenticatedQueryFn<User>({ on401: 'redirect' })
});

const userData = await authenticatedRequest<User>('/users/me', 'GET');

// Using Variation 4 (Hook-style)
const { makeRequest } = useApiRequest();
const userData = await makeRequest<User>('/users/me', {
  method: 'GET',
  requireAuth: true
});

// Using Variation 5 (Class-based)
const userData = await apiClient.get<User>('/users/me', true);
const newUser = await apiClient.post<User>('/users', { name: 'John' }, true);
*/
