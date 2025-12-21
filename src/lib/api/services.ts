/**
 * API Service Layer
 * Organized methods for calling your Python backend
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type { User, UserProfile, DataItem, PaginatedResponse } from '@/types';

/**
 * Authentication Services
 */
export const authService = {
  /**
   * Get current user profile
   */
  async getProfile() {
    return apiClient.get<User>(API_ENDPOINTS.auth.profile);
  },

  /**
   * Logout current user
   */
  async logout() {
    return apiClient.post(API_ENDPOINTS.auth.logout);
  },
};

/**
 * User Services
 */
export const userService = {
  /**
   * Get current user details
   */
  async getMe() {
    return apiClient.get<UserProfile>(API_ENDPOINTS.users.me);
  },

  /**
   * Get user by ID
   */
  async getUser(userId: string) {
    return apiClient.get<UserProfile>(API_ENDPOINTS.users.profile(userId));
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<UserProfile>) {
    return apiClient.patch<UserProfile>(API_ENDPOINTS.users.update(userId), data);
  },
};

/**
 * Data Services (Example for your Python backend)
 */
export const dataService = {
  /**
   * List all data items with pagination
   */
  async list(params?: { page?: number; pageSize?: number; search?: string }) {
    return apiClient.get<PaginatedResponse<DataItem>>(API_ENDPOINTS.data.list, params);
  },

  /**
   * Get a single data item by ID
   */
  async get(id: string) {
    return apiClient.get<DataItem>(API_ENDPOINTS.data.get(id));
  },

  /**
   * Create a new data item
   */
  async create(data: Omit<DataItem, 'id' | 'createdAt' | 'updatedAt'>) {
    return apiClient.post<DataItem>(API_ENDPOINTS.data.create, data);
  },

  /**
   * Update an existing data item
   */
  async update(id: string, data: Partial<DataItem>) {
    return apiClient.patch<DataItem>(API_ENDPOINTS.data.update(id), data);
  },

  /**
   * Delete a data item
   */
  async delete(id: string) {
    return apiClient.delete(API_ENDPOINTS.data.delete(id));
  },
};

/**
 * Export all services
 */
export const api = {
  auth: authService,
  user: userService,
  data: dataService,
};
