import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="messages"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="message/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
