// FILE 8: api/keyclock-integration/useRefreshTokens.tsx
/**
 * Token Refresh Hook
 * Automatically refreshes tokens using React Query and respects app state
 */

import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@/store/authStore';
import { CustomError } from '@/api/errors';
import * as AuthSession from 'expo-auth-session';
import { envConfig } from '@/configs/env-config';

/**
 * Token refresh result type
 */
interface RefreshTokenResult {
  isRefreshing: boolean;
  canUseTokens: boolean;
  error: CustomError | null;
}

/**
 * Configuration constants
 */
const ACCESS_TOKEN_LIFESPAN = 15 * 60 * 1000; // 15 minutes
const TIMEOUT_BEFORE_REFRESH = 10 * 1000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Custom hook for automatic token refresh
 * Respects app state (foreground/background) and network connectivity
 * 
 * @returns Refresh token status and utilities
 */
export const useRefreshTokens = (): RefreshTokenResult => {
  const { tokens, updateTokens, logout } = useAuthStore();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isConnected, setIsConnected] = useState(true);
  const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);
  const [hasAppBeenInBackground, setHasAppBeenInBackground] = useState(false);

  /**
   * Check if app state is in background
   */
  const isAppStateBackground = (state: AppStateStatus): boolean => {
    return state === 'background' || state === 'inactive';
  };

  /**
   * Token refresh function
   */
  const refreshTokens = async (): Promise<void> => {
    if (!tokens?.refreshToken) {
      throw new CustomError('No refresh token available', 0);
    }

    try {
      const discovery = await AuthSession.fetchDiscoveryAsync(
        `${envConfig.keycloakURL}/realms/${envConfig.realm}`
      );

      if (!discovery?.tokenEndpoint) {
        throw new CustomError('Token endpoint not found in discovery', 0);
      }

      const response = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: envConfig.clientId,
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Invalid refresh token - logout
          logout();
          throw new CustomError('Invalid refresh token', 401);
        }
        throw new CustomError(response.statusText, response.status);
      }

      const data = await response.json();

      // Update tokens in store
      updateTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || tokens.refreshToken,
        idToken: data.id_token,
      });

      setIsTimeoutFinished(false);
      setHasAppBeenInBackground(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      throw new CustomError(message, 0);
    }
  };

  /**
   * Monitor app state changes
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);

      // Track when app comes back from background
      if (isAppStateBackground(appState) && !isAppStateBackground(nextAppState)) {
        setHasAppBeenInBackground(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  /**
   * Monitor network connectivity
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Set timeout before allowing refresh
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeoutFinished(true);
    }, TIMEOUT_BEFORE_REFRESH);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Determine if refresh should be enabled
   */
  const isRefreshEnabled =
    !!tokens &&
    !isAppStateBackground(appState) &&
    isConnected &&
    (isTimeoutFinished || hasAppBeenInBackground) &&
    !!tokens.refreshToken;

  /**
   * React Query hook for token refresh
   */
  const query = useQuery({
    queryKey: ['refreshToken'],
    queryFn: async () => {
      // If enabled is false, this shouldn't run - but if it does, return default value
      if (!tokens?.refreshToken) {
        return { accessToken: '', refreshToken: '', idToken: '' };
      }
      
      const discovery = await AuthSession.fetchDiscoveryAsync(
        `${envConfig.keycloakURL}/realms/${envConfig.realm}`
      );

      if (!discovery?.tokenEndpoint) {
        throw new CustomError('Token endpoint not found in discovery', 0);
      }

      const response = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: envConfig.clientId,
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Invalid refresh token - logout
          logout();
          throw new CustomError('Invalid refresh token', 401);
        }
        throw new CustomError(response.statusText, response.status);
      }

      const data = await response.json();

      // Update tokens in store
      updateTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || tokens.refreshToken,
        idToken: data.id_token,
      });

      setIsTimeoutFinished(false);
      setHasAppBeenInBackground(false);

      return data;
    },
    enabled: isRefreshEnabled,
    refetchInterval: ACCESS_TOKEN_LIFESPAN,
    retry: (failureCount, error) => {
      if (error instanceof CustomError && error.isAuthError()) {
        return false; // Don't retry on auth errors
      }
      return failureCount < MAX_RETRY_ATTEMPTS; // Retry network errors max 3 times
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    isRefreshing: query.isFetching,
    canUseTokens: !query.isFetching && !!tokens?.accessToken,
    error: (query.error as CustomError) || null,
  };
};