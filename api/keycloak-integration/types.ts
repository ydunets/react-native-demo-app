// FILE 4: api/keyclock-integration/types.ts
/**
 * TypeScript Types for Keycloak Integration
 */

/**
 * User information from Keycloak userinfo endpoint
 */
export interface UserInfo {
  sub: string;
  email_verified?: boolean;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  locale?: string;
}

/**
 * User profile with extended information
 */
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  createdTimestamp: number;
  attributes?: {
    [key: string]: string[];
  };
}

/**
 * User roles from Keycloak
 */
export interface UserRoles {
  realmRoles: string[];
  clientRoles: {
    [clientId: string]: string[];
  };
}

/**
 * Organization information
 */
export interface Organization {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  attributes?: {
    [key: string]: string[];
  };
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  error: string;
  error_description?: string;
  message?: string;
}

/**
 * Token refresh response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}