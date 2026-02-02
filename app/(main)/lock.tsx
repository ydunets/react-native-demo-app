import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { StatusBar } from 'expo-status-bar';

export default function LockScreen() {
  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center gap-6 px-6">
          <Icon name="lock.fill" size={64} className="text-white" />
          <Text variant="largeTitle" className="text-center text-white">
            Lock Screen
          </Text>
          <Text variant="body" className="text-center text-white/70">
            This is a full-screen modal (presentation: &quot;fullScreenModal&quot;). It covers the
            entire screen and is typically used for lock screens, onboarding, or critical overlays.
          </Text>
          <View className="mt-4 w-full">
            <Button variant="secondary" onPress={() => router.back()} className="bg-white">
              <Text className="text-black">Unlock</Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
