import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useIsLoggedIn } from '@/stores/auth';
import { useEffect } from 'react';

export default function MainLayout() {
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();

  useEffect(() => {
    console.log('Auth Status Changed - isLoggedIn:', isLoggedIn);

    if (!isLoggedIn) {
      router.replace('/(auth)/login');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return null; // or a loading spinner
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        {/* Tab-based screens */}
        <Stack.Screen name="(tabs)" />

        {/* Modal screens */}
        <Stack.Screen
          name="send-message"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        {/* Full-screen overlay */}
        <Stack.Screen
          name="lock"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />

        {/* PDF Viewer modal */}
        <Stack.Screen
          name="pdf-viewer"
          options={{
            presentation: 'fullScreenModal',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
