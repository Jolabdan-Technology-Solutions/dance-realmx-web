export function getApiBaseUrl() {
  // Only use import.meta.env if it exists (browser/Vite)
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use process.env in Node/Jest
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  throw new Error('API base URL is not defined');
} 