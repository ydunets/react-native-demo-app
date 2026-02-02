/**
 * Authentication Context with OAuth Discovery
 * Provides app-wide authentication setup and discovery document
 */

import React, { ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useQueryClient } from '@tanstack/react-query';
import { useIsLoggedIn, useAuthActions } from '@/stores/auth';
import type { UserProfile } from '@/stores/auth';
import { useRefreshTokens } from '@/hooks/useRefreshTokens';
import { envConfig } from '@/configs/env-config';
import { useNonce } from '@/hooks/useNonce';
import { jwtDecode } from '@/lib/jwtDecode';
import { MESSAGE_ATTACHMENTS } from '@/hooks/useMessageAttachments';

/**
 * Auth context value type
 */
interface AuthContextValue {
  discovery: AuthSession.DiscoveryDocument | null;
  isAuthenticated: boolean;
  authRequestError: string | null;
  isAuthRequestLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

/**
 * Create auth context with initial null value
 */
export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Initializes OAuth discovery and manages app-wide auth state
 *
 * @param children - Child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();
  const { logoutFromKeycloak, setTokens, setUser } = useAuthActions();
  const { isRefreshing, canUseTokens } = useRefreshTokens();
  const queryClient = useQueryClient();
  const discoveryUrl = `${envConfig.keycloakURL}/realms/${envConfig.realm}`;
  const discovery = AuthSession.useAutoDiscovery(discoveryUrl);
  const [authRequestError, setAuthRequestError] = React.useState<string | null>(null);
  const [isAuthRequestLoading, setIsAuthRequestLoading] = React.useState(false);
  const { nonce, validateNonce } = useNonce(32);

  console.log('Discovery Document Authorization Endpoint:', discovery?.authorizationEndpoint);

  /**
   * Handle Keycloak OAuth login
   */
  const handleKeycloakLogin = async () => {
    try {
      setIsAuthRequestLoading(true);
      setAuthRequestError(null);

      if (!discovery) {
        throw new Error('OAuth discovery document not available');
      }

      // Create auth request
      const redirectUri = AuthSession.makeRedirectUri({ path: 'oauth2callback' });

      const request = new AuthSession.AuthRequest({
        clientId: envConfig.clientId,
        redirectUri: redirectUri,
        scopes: ['openid', 'profile', 'email'],
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        usePKCE: true,
        extraParams: {
          nonce,
        },
      });

      // Prompt user to login
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange authorization code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            code: result.params.code,
            clientId: envConfig.clientId,
            redirectUri: redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
          },
          discovery
        );

        const nonceValid = validateNonce(tokenResponse.idToken || '');

        console.log('Is nonce valid?', nonceValid.toString());

        if (nonceValid && tokenResponse.idToken) {
          // Decode ID token to extract user information
          try {
            const decodedToken = jwtDecode(tokenResponse.idToken);
            // Extract user profile from token
            const userProfile: UserProfile = {
              id: decodedToken.sub || '',
              email: decodedToken.email || decodedToken.preferred_username || '',
              name:
                decodedToken.name ||
                decodedToken.given_name + ' ' + decodedToken.family_name ||
                decodedToken.preferred_username ||
                '',
            };

            // Store tokens and user info
            setTokens({
              accessToken: tokenResponse.accessToken,
              refreshToken: tokenResponse.refreshToken || '',
              idToken: tokenResponse.idToken,
            });

            setUser(userProfile);
          } catch (decodeError) {
            console.error('Error decoding ID token:', decodeError);
            setAuthRequestError('Failed to decode user information');
          }
        }
      } else if (result.type === 'cancel') {
        setAuthRequestError('Login cancelled');
      } else if (result.type === 'error') {
        setAuthRequestError(`Login error: ${result.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setAuthRequestError(message);
      console.error('Login error:', err);
    } finally {
      setIsAuthRequestLoading(false);
    }
  };
  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      console.log('Starting logout...');

      await queryClient.invalidateQueries({ queryKey: MESSAGE_ATTACHMENTS });
      // Call Keycloak logout - this invalidates server session
      await logoutFromKeycloak();

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force local logout even if Keycloak logout fails
      await logoutFromKeycloak();
      
      // Still invalidate cache on error
      await queryClient.invalidateQueries({ queryKey: MESSAGE_ATTACHMENTS });
    }
  };

  /**
   * Determine if user is authenticated
   * User must be logged in and tokens must be valid
   */
  const isAuthenticated = isLoggedIn && canUseTokens && !isRefreshing;

  const value: AuthContextValue = {
    discovery,
    isAuthenticated,
    authRequestError,
    isAuthRequestLoading: isAuthRequestLoading || !discovery,
    logout: handleLogout,
    login: handleKeycloakLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuthContext = (): AuthContextValue => {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};