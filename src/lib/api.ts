/**
 * API utilities for making requests to the server
 */

export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  customHeaders?: Record<string, string>
) {
  const url = path.startsWith('http') ? path : path;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body && method !== 'GET') {
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
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
} 