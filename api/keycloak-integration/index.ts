// FILE 5: api/keyclock-integration/index.ts
/**
 * Keycloak Integration Path Helpers and Exports
 */

/**
 * API path parameters
 */
export interface ApiPathsParams {
  userId?: string;
  organizationId?: string;
}

/**
 * Controller paths helper
 * Builds full endpoint paths with variable substitution
 */
export const createControllerPaths = (
  controller: string,
  paths: Record<string, string>
): Record<string, string> => {
  return Object.entries(paths).reduce((acc, [key, path]) => {
    acc[key] = `${controller}${path}`;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Get all Keycloak integration API paths
 * Uses controller-based path structure for organization
 */
export const getKeycloakIntegrationPaths = (params: ApiPathsParams = {}) => {
  const controller = '/keycloak-integration/v1';
  
  return {
    /**
     * User endpoints
     */
    user: createControllerPaths(controller, {
      userInfo: `/user/${params.userId || '{userId}'}/info`,
      userProfile: `/user/${params.userId || '{userId}'}/profile`,
      userRoles: `/user/${params.userId || '{userId}'}/roles`,
    }),

    /**
     * Organization endpoints
     */
    organization: createControllerPaths(controller, {
      list: '/organizations',
      byId: `/organizations/${params.organizationId || '{organizationId}'}`,
    }),
  };
};