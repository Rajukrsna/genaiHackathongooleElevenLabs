/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
 
  // In development, this will be proxied through Vite
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * API Endpoints
 * Organized by resource/feature
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },
  
  // User endpoints
  users: {
    me: '/auth/me',
    profile: (userId: string) => `/users/${userId}`,
    update: (userId: string) => `/users/${userId}`,
  },
  
  // Data endpoints (example for your Express backend)
  data: {
    list: '/data',
    get: (id: string) => `/data/${id}`,
    create: '/data',
    update: (id: string) => `/data/${id}`,
    delete: (id: string) => `/data/${id}`,
  },
  
  // Add more endpoints as needed for your Express backend
} as const;
