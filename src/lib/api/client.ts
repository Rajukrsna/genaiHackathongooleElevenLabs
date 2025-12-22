import { useAuth } from '@clerk/clerk-react';
import type { ApiResponse } from '@/types';
import { API_CONFIG } from './config';

/**
 * Custom API Error class
 */
export class ApiErrorClass extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Client class for making authenticated requests to Python backend
 */
class ApiClient {
  private baseURL: string;
  private getToken: (() => Promise<string | null>) | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  /**
   * Set the function to retrieve auth token from Clerk
   */
  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter;
  }

  /**
   * Make an authenticated HTTP request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get auth token from Clerk
      const token = this.getToken ? await this.getToken() : null;

      // Check if body is FormData (don't set Content-Type for FormData)
      const isFormData = options.body instanceof FormData;

      // Build headers as a plain object to allow string indexing
      const headers: Record<string, string> = {};
      
      // Only add default headers if not FormData
      if (!isFormData) {
        Object.assign(headers, API_CONFIG.headers as Record<string, string>);
      }
      
      // Add custom headers from options
      Object.assign(headers, options.headers as Record<string, string>);

      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make the request
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Parse response
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw new ApiErrorClass(
          response.status,
          data.message || data.error || 'Request failed',
          data.errors
        );
      }

      // Return successful response
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof ApiErrorClass) {
        throw error;
      }

      throw new ApiErrorClass(
        500,
        error instanceof Error ? error.message : 'Network error occurred'
      );
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      ...options,
      headers: {
        // Don't set Content-Type for FormData - browser sets it with boundary
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options?.headers || {}),
      },
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

/**
 * Hook to initialize API client with Clerk auth
 * Call this at the root of your app
 */
export function useInitializeApiClient() {
  const { getToken } = useAuth();
  
  // Set up the token getter with custom JWT template
  apiClient.setTokenGetter(() => getToken({ template: "neonLab" }));
}
