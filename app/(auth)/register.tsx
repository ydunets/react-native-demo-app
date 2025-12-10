import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';

export default function RegistrationScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center gap-4 px-6">
      <Text variant="largeTitle" className="text-center">
        Registration Screen
      </Text>
      <Text variant="body" color="tertiary" className="text-center">
        This is the registration screen.
      </Text>
      <View className="w-full gap-2 pt-4">
        <Button onPress={() => router.back()}>
          <Text>Back to Login</Text>
        </Button>
      </View>
      </View>
    </SafeAreaView>
  );
}

