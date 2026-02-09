// FILE 7: api/axios-client.tsx
/**
 * Axios HTTP Client with Bearer Token Injection
 * Handles request/response interceptors for authentication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/auth';
import { envConfig } from '@/configs/env-config';
import { CustomError } from './errors';

/**
 * Create and configure axios instance
 */
const createAxiosClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: envConfig.apiBaseUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  /**
   * Request interceptor: Inject Bearer token
   */
  client.interceptors.request.use(
    async (config) => {
      const { tokens } = useAuthStore.getState();

      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor: Handle errors and logout on 401
   */
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        const { logout } = useAuthStore.getState().actions;
        logout();

        console.warn('Unauthorized: User logged out due to expired token');
        return

        // You can emit an event or use a ref to navigate from here
        // or the guard in app/(main)/_layout.tsx will catch this and redirect
      }

      // Create CustomError from axios error
      const status = error.response?.status || 0;
      const message = error.response?.statusText || error.message || 'Network error';

      return Promise.reject(new CustomError(message, status));
    }
  );

  return client;
};

/**
 * Axios client instance
 * Singleton instance for all API requests
 */
export const axiosClient = createAxiosClient();

/**
 * Export axios for direct use if needed
 */
export default axiosClient;
