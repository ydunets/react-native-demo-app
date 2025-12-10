import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function MainLayout() {
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    console.log('Auth Status Changed - isLoggedIn:', isLoggedIn);
    
    if (!isLoggedIn) {
      router.replace('/(auth)/login');
    }
  }, [isLoggedIn]);

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
      </Stack>
    </>
  );
}
