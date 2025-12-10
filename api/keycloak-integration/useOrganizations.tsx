// FILE 9: api/keyclock-integration/useOrganizations.tsx
/**
 * Organizations React Query Hook
 * Example service hook for fetching user organizations
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchOrganizations } from './keycloakService';
import { Organization } from './types';
import { CustomError } from '@/api/errors';

/**
 * Custom hook for fetching organizations
 * Follows React Query patterns with caching and stale time
 * 
 * @returns Query result with organizations data, loading, and error states
 */
export const useOrganizations = (): UseQueryResult<Organization[], CustomError> => {
  return useQuery<Organization[], CustomError>({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof CustomError && error.isAuthError()) {
        return false;
      }
      // Retry network errors up to 3 times
      if (error instanceof CustomError && error.isNetworkError()) {
        return failureCount < 3;
      }
      return false;
    },
  });
};