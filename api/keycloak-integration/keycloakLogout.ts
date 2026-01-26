// FILE: api/keycloak-integration/keycloakLogout.ts
/**
 * Keycloak Logout Service
 * Handles logout operations via Keycloak endpoints
 */

import * as AuthSession from 'expo-auth-session';
import { envConfig } from '@/configs/env-config';
import { useAuthStore } from '@/store/authStore';

/**
 * Logout from Keycloak and invalidate session
 * Clears tokens, cookies, and calls Keycloak logout endpoint
 */
export const logoutFromKeycloak = async (): Promise<void> => {
  try {
    const { keycloakURL, realm, clientId } = envConfig;
    const { tokens } = useAuthStore.getState();

    // Step 1: Call Keycloak revocation endpoint with refresh token
    // This invalidates the refresh token server-side
    if (tokens?.refreshToken) {
      try {
        const revokeUrl = `${keycloakURL}/realms/${realm}/protocol/openid-connect/revoke`;
        await fetch(revokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            token: tokens.refreshToken,
          }).toString(),
        });
        console.log('✅ Refresh token revoked on Keycloak');
      } catch (e) {
        console.warn('⚠️ Token revocation failed (will still logout):', e);
      }
    }

    // Step 2: Call logout endpoint with redirect to clear session cookies
    try {
      const logoutUrl =
        `${keycloakURL}/realms/${realm}/protocol/openid-connect/logout?` +
        new URLSearchParams({
          redirect_uri: AuthSession.makeRedirectUri({ path: 'oauth2callback' }),
        }).toString();

      // Use GET request to properly clear cookies
      await fetch(logoutUrl, {
        method: 'GET',
        headers: {
          Accept: '*/*',
        },
      });
      console.log('✅ Keycloak session invalidated');
    } catch (e) {
      console.warn('⚠️ Logout endpoint call failed:', e);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    console.warn('⚠️ Keycloak logout error (will still clear local tokens):', message);
    // Don't throw - logout should always succeed locally
  }
};
