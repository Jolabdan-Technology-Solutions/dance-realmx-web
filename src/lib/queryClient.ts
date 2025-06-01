import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Backend server configuration
const API_BASE_URL = "http://localhost:6000";

async function throwIfResNotOk(res: Response, urlPath?: string) {
  if (!res.ok) {
    // Special handling for resource and course-related endpoints when status is 401
    // This is a workaround to allow guest access to resource and course pages
    if (
      res.status === 401 &&
      urlPath &&
      (urlPath.startsWith("/api/resources") ||
        urlPath.startsWith("/api/curriculum") ||
        urlPath.startsWith("/api/courses"))
    ) {
      console.log(`Suppressing 401 error for guest access to: ${urlPath}`);
      // Return empty data instead of throwing for resources and courses
      return;
    }

    // Log detailed error information for debugging
    console.error(`API response error:`, {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
    });

    try {
      const text = (await res.text()) || res.statusText;
      console.error("Error response body:", text);
      throw new Error(`${res.status}: ${text}`);
    } catch (err) {
      console.error("Error parsing response body:", err);
      throw new Error(`${res.status}: ${res.statusText || "Unknown error"}`);
    }
  }
}

// Helper function to construct full API URLs
function getFullApiUrl(endpoint: string): string {
  // If the endpoint already includes the full URL, return as is
  if (endpoint.startsWith("http")) {
    return endpoint;
  }

  console.log("endpoint", endpoint);
  // If the endpoint starts with /api, prepend the base URL
  if (endpoint.startsWith("/api")) {
    return `${API_BASE_URL}${endpoint}`;
  }
  // Otherwise, assume it's a relative path and prepend base URL + /api
  return `${API_BASE_URL}/api${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { isFormData?: boolean }
): Promise<Response> {
  const fullUrl = getFullApiUrl(url);
  console.log(`Making ${method} request to ${fullUrl}`, data ? { data } : "");

  const isFormData = options?.isFormData || false;

  const res = await fetch(fullUrl, {
    method,
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    body: data
      ? isFormData
        ? (data as FormData)
        : JSON.stringify(data)
      : undefined,
    credentials: "include", // This should ensure cookies are sent and received
  });

  console.log(`Response from ${fullUrl}:`, {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(Array.from(res.headers.entries())),
  });

  await throwIfResNotOk(res, url);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    const fullUrl = getFullApiUrl(endpoint);

    console.log(`Making query request to ${fullUrl}`, {
      unauthorizedBehavior,
    });

    const res = await apiRequest("GET", endpoint);

    console.log(`Query response from ${fullUrl}:`, {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(Array.from(res.headers.entries())),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Returning null for unauthorized request to ${fullUrl}`);
      return null;
    }

    await throwIfResNotOk(res, endpoint);

    // Special case for 401 responses on resource and course endpoints
    // This allows guests to see public listing data
    if (
      res.status === 401 &&
      (endpoint.startsWith("/api/resources") ||
        endpoint.startsWith("/api/curriculum") ||
        endpoint.startsWith("/api/courses"))
    ) {
      console.log(
        `Returning empty data for unauthorized request to ${fullUrl}`
      );
      // Return empty data structure based on endpoint type
      if (endpoint.endsWith("/reviews")) {
        return [];
      }
      return null;
    }

    const data = await res.json();
    console.log(`Query data from ${fullUrl}:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
