import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuthContext } from '@/contexts/auth';
import RootPath from '@/router-map/routes';

export default function LoginScreen() {
  const { colors } = useColorScheme();
  const authContext = useAuthContext();

  if (authContext.isAuthRequestLoading) {
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

        {authContext.authRequestError && (
          <View className="mt-4 w-full rounded-lg bg-red-100 p-4">
            <Text className="text-red-800">{authContext.authRequestError}</Text>
          </View>
        )}

        <View className="w-full gap-2 pt-4">
          <Button
            disabled={authContext.isAuthRequestLoading}
            onLongPress={async () => {
              router.replace(RootPath.Sitemap);
            }} 
            onPress={async () => {
              await authContext.login();
              router.replace(RootPath.HomeScreen);
            }}>
            {authContext.isAuthRequestLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text>Login</Text>
            )}
          </Button>
        </View>

        {authContext.discovery && (
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