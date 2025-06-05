import '@testing-library/jest-dom';
import fetch from 'node-fetch';

// Add fetch to global scope
global.fetch = fetch as any;

// Mock environment variables
process.env.VITE_API_URL = 'https://api.livetestdomain.com';
process.env.VITE_FRONTEND_URL = 'https://livetestdomain.com';

// Mock getApiBaseUrl to avoid import.meta in tests
jest.mock('./lib/getApiBaseUrl', () => ({
  getApiBaseUrl: () => process.env.VITE_API_URL,
}));

// Mock localStorage with all required properties
const localStorageMock: Storage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock }); 