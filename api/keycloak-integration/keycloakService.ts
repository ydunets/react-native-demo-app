// FILE 6: api/keyclock-integration/keycloakService.ts
/**
 * Keycloak Service Module
 * Main service functions for Keycloak integration
 */

import { axiosClient } from '@/api/axios-client';
import { CustomError } from '@/api/errors';
import { getKeycloakIntegrationPaths } from './index';
import {
  UserInfo,
  UserProfile,
  UserRoles,
  Organization,
  PaginatedResponse,
} from './types';

/**
 * Fetch user info from Keycloak userinfo endpoint
 * @param userId - User ID to fetch info for
 * @returns User information
 * @throws CustomError on failure
 */
export const fetchUserInfo = async (userId: string): Promise<UserInfo> => {
  try {
    const paths = getKeycloakIntegrationPaths({ userId });
    const { data, status, statusText } = await axiosClient.get<UserInfo>(
      paths.user.userInfo
    );

    if (!data) {
      throw new CustomError(statusText, status);
    }

    return data;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    
    const message = error instanceof Error ? error.message : 'Failed to fetch user info';
    throw new CustomError(message, 0);
  }
};

/**
 * Fetch user profile from backend
 * @param userId - User ID to fetch profile for
 * @returns User profile information
 * @throws CustomError on failure
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const paths = getKeycloakIntegrationPaths({ userId });
    const { data, status, statusText } = await axiosClient.get<UserProfile>(
      paths.user.userProfile
    );

    if (!data) {
      throw new CustomError(statusText, status);
    }

    return data;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch user profile';
    throw new CustomError(message, 0);
  }
};

/**
 * Fetch user roles
 * @param userId - User ID to fetch roles for
 * @returns User roles from realm and clients
 * @throws CustomError on failure
 */
export const fetchUserRoles = async (userId: string): Promise<UserRoles> => {
  try {
    const paths = getKeycloakIntegrationPaths({ userId });
    const { data, status, statusText } = await axiosClient.get<UserRoles>(
      paths.user.userRoles
    );

    if (!data) {
      throw new CustomError(statusText, status);
    }

    return data;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch user roles';
    throw new CustomError(message, 0);
  }
};

/**
 * Fetch user organizations
 * @returns List of organizations for current user
 * @throws CustomError on failure
 */
export const fetchOrganizations = async (): Promise<Organization[]> => {
  try {
    const paths = getKeycloakIntegrationPaths();
    const { data, status, statusText } = await axiosClient.get<
      PaginatedResponse<Organization> | Organization[]
    >(paths.organization.list);

    if (!data) {
      throw new CustomError(statusText, status);
    }

    // Handle both paginated and direct array responses
    const organizations = Array.isArray(data) ? data : data.items || [];

    return organizations;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch organizations';
    throw new CustomError(message, 0);
  }
};

/**
 * Fetch organization by ID
 * @param organizationId - Organization ID
 * @returns Organization information
 * @throws CustomError on failure
 */
export const fetchOrganizationById = async (
  organizationId: string
): Promise<Organization> => {
  try {
    const paths = getKeycloakIntegrationPaths({ organizationId });
    const { data, status, statusText } = await axiosClient.get<Organization>(
      paths.organization.byId
    );

    if (!data) {
      throw new CustomError(statusText, status);
    }

    return data;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch organization';
    throw new CustomError(message, 0);
  }
};