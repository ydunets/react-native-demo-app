import { useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuthStore } from '@/store/authStore';
import { useAuthContext } from '@/contexts/auth';
import { envConfig } from '@/configs/env-config';

export default function LoginScreen() {
  const { colors } = useColorScheme();
  const { setTokens } = useAuthStore();
  const { discovery, isDiscoveryLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle Keycloak OAuth login
   */
  const handleKeycloakLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!discovery) {
        throw new Error('OAuth discovery document not available');
      }

      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: envConfig.clientId,
        redirectUri: AuthSession.makeRedirectUri({ path: 'oauth2callback' }),
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
      });

      // Prompt user to login
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange authorization code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync({
          code: result.params.code,
          clientId: envConfig.clientId,
          redirectUri: AuthSession.makeRedirectUri({ path: 'oauth2callback' }),
          extraParams: {
            code_verifier: request.codeVerifier || '',
          },
        }, discovery);

        // Store tokens in auth store
        setTokens({
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken || '',
          idToken: tokenResponse.idToken,
        });

        // Navigate to main app
        router.replace('/(main)/(tabs)/(services)/services');
      } else if (result.type === 'cancel') {
        setError('Login cancelled');
      } else if (result.type === 'error') {
        setError(`Login error: ${result.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle demo/test login (without Keycloak)
   */
  const handleDemoLogin = () => {
    try {
      // For demo purposes - set mock tokens
      setTokens({
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdHVzZXJAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInVzZXIiXX0sImlhdCI6MTYwMzEwMzcxNCwiZXhwIjoxNjAzMTkwMTE0fQ.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ',
        refreshToken: 'mock-refresh-token',
      });

      router.replace('/(main)/(tabs)/(services)/services');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo login failed';
      setError(message);
    }
  };

  if (isDiscoveryLoading) {
    return (
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4">Loading authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text variant="largeTitle" className="text-center">
          Keycloak Login
        </Text>
        <Text variant="body" color="tertiary" className="text-center">
          Sign in with your Keycloak account
        </Text>

        {error && (
          <View className="mt-4 w-full rounded-lg bg-red-100 p-4">
            <Text className="text-red-800">{error}</Text>
          </View>
        )}

        <View className="w-full gap-2 pt-4">
          <Button
            disabled={isLoading || !discovery}
            onPress={handleKeycloakLogin}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text>Login</Text>
            )}
          </Button>
        </View>

        {discovery && (
          <View className="mt-6 w-full rounded-lg bg-gray-100 p-3">
            <Text variant="caption1" className="text-center text-gray-600">
              ✓ Connected to Keycloak
              {'\n'}
              Realm: expo-app-realm
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}