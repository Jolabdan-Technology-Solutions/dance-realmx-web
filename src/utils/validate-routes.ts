/**
 * Route Validation Utility
 * 
 * This script extracts all routes from App.tsx and compares them 
 * against our essential routes list to ensure nothing critical is missing.
 */

import fs from 'fs';
import path from 'path';
import { ESSENTIAL_ROUTES } from '../lib/routes-checker';

// Path to App.tsx
const APP_PATH = path.resolve(__dirname, '../../src/App.tsx');

// Simple regex to extract routes from App.tsx
const ROUTE_REGEX = /<(Route|ProtectedRoute|AdminRoute|GuestRoute)\s+path="([^"]+)"/g;

function extractRoutes(): string[] {
  try {
    // Read App.tsx content
    const appContent = fs.readFileSync(APP_PATH, 'utf8');
    
    // Extract all routes
    const routes: string[] = [];
    let match;
    while ((match = ROUTE_REGEX.exec(appContent)) !== null) {
      routes.push(match[2]);
    }
    
    return routes;
  } catch (error) {
    console.error('Failed to extract routes:', error);
    return [];
  }
}

function validateRoutes(): void {
  // Extract all routes from App.tsx
  const appRoutes = extractRoutes();
  
  // Check if any essential routes are missing
  const missingRoutes = ESSENTIAL_ROUTES.filter(route => 
    !appRoutes.some(appRoute => appRoute === route));
  
  if (missingRoutes.length > 0) {
    console.error('❌ Missing essential routes:');
    missingRoutes.forEach(route => console.error(`  - ${route}`));
    process.exit(1);
  } else {
    console.log('✅ All essential routes are present!');
  }
}

// Run validation
validateRoutes();