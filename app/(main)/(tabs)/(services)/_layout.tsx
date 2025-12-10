import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="services"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[service]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

