import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function MainLayout() {
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
