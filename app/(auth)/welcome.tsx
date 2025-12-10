import { router } from 'expo-router';
import { View, ScrollView } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';

export default function WelcomeScreen() {
  return (
    <ScrollView className="flex-1">
      <View className="gap-4 p-4 items-center justify-center min-h-full">
        <Text variant="largeTitle" className="text-center">
          Welcome
        </Text>
        <Text variant="body" color="tertiary" className="text-center">
          Welcome to the app!
        </Text>
        <View className="w-full gap-2 pt-4">
          <Button onPress={() => router.push('/login')}>
            <Text>Get Started</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

