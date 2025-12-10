import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';

export default function LoginScreen() {
  const { colors } = useColorScheme();

  const handleLogin = () => {
    // Navigate to main app after login - default to services tab (first tab)
    router.replace('/(main)/(tabs)/(services)/services');
  };

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center gap-4 px-6">
      <Text variant="largeTitle" className="text-center">
        Login Screen
      </Text>
      <Text variant="body" color="tertiary" className="text-center">
        This is the login screen from the Auth Stack
      </Text>
      <View className="w-full gap-2 pt-4">
        <Button onPress={handleLogin}>
          <Text>Login</Text>
        </Button>
        <Button
          variant="secondary"
          onPress={() => router.push('/(auth)/register')}>
          <Text>Go to Register</Text>
        </Button>
        <Button
          variant="plain"
          onPress={() => router.push('/(auth)/forgot-password')}>
          <Text>Forgot Password?</Text>
        </Button>
      </View>
      </View>
    </SafeAreaView>
  );
}

