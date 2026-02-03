import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useIsLoggedIn } from '@/stores/auth';
import { DownloadProgressOverlay } from '@/components/DownloadProgressOverlay';

export default function MainLayout() {
  const isLoggedIn = useIsLoggedIn();

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
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
      
      {/* Download progress overlay - shows above all screens */}
      <DownloadProgressOverlay />
    </>
  );
}
