/**
 * Token Refresh Hook
 * Automatically refreshes tokens using React Query and respects app state
 */

import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNetInfo } from '@/hooks/useNetInfo';
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
  data: AuthSession.TokenResponse | null;
}

/**
 * Configuration constants
 */
// const ONE_MINUTE = 60 * 1000;
const ACCESS_TOKEN_LIFESPAN = 60 * 60 * 1000; // 1 hour
const MAX_RETRY_ATTEMPTS = 3;
const GCTIME = ACCESS_TOKEN_LIFESPAN ** 2;

/**
 * Custom hook for automatic token refresh
 * Respects app state (foreground/background) and network connectivity
 *
 * @returns Refresh token status and utilities
 */


const useAppState = () => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [hasAppBeenInBackground, setHasAppBeenInBackground] = useState(false);

  const isAppStateBackground = (state: AppStateStatus): boolean => {
    return state === 'background' || state === 'inactive';
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);

      if (isAppStateBackground(appState) && !isAppStateBackground(nextAppState)) {
        setHasAppBeenInBackground(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  return {
    appState,
    hasAppBeenInBackground,
    setAppState,
    setHasAppBeenInBackground,
  };
};

export const useRefreshTokens = (): RefreshTokenResult => {
  const { updateTokens, tokens } = useAuthStore();
  const { isConnected } = useNetInfo();
  const {
    appState,
    hasAppBeenInBackground: returnedFromBackground,
    setHasAppBeenInBackground,
  } = useAppState();

  /**
   * Check if app state is in background
   */
  const isAppStateBackground = (state: AppStateStatus): boolean => {
    return state === 'background' || state === 'inactive';
  };

  /**
   * Token refresh function
   */
  const refreshTokens = async (): Promise<AuthSession.TokenResponse> => {
    const response = await AuthSession.refreshAsync(
      {
        refreshToken: tokens?.refreshToken,
        clientId: envConfig.clientId,
      },
      {
        tokenEndpoint: `${envConfig.keycloakURL}/realms/${envConfig.realm}/protocol/openid-connect/token`,
      }
    );

    updateTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || tokens?.refreshToken || '',
      idToken: response.idToken,
    });

    setHasAppBeenInBackground(false);

    return response;
  };

  const isAppStateBg = isAppStateBackground(appState);
  const isRefreshEnabled =
    !!tokens?.refreshToken && isConnected && (!isAppStateBg || returnedFromBackground);

  /**
   * React Query hook for token refresh
   */
  const query = useQuery({
    queryKey: ['refreshToken'],
    queryFn: refreshTokens,
    enabled: isRefreshEnabled,
    refetchInterval: ACCESS_TOKEN_LIFESPAN,
    refetchIntervalInBackground: true,
    retry: (failureCount, error) => {
      if (error instanceof CustomError && error.isAuthError()) {
        return false; // Don't retry on auth errors
      }
      return failureCount < MAX_RETRY_ATTEMPTS; // Retry network errors max 3 times
    },
    staleTime: ACCESS_TOKEN_LIFESPAN,
    gcTime: GCTIME,
  });

  return {
    data: query.data || null,
    isRefreshing: query.isFetching,
    // Allow using tokens even while refreshing if they exist
    canUseTokens: !!tokens?.accessToken,
    error: (query.error as CustomError) || null,
  };
};
