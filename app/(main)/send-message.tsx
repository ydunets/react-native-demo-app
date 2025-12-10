import { router } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';

export default function SendMessageModal() {
  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <ScrollView className="flex-1">
      <View className="gap-4 p-4">
        <View className="items-center gap-2">
          <Icon name="paperplane.fill" size={48} className="text-primary" />
          <Text variant="title1">Send Message</Text>
        </View>
        <Text variant="body" color="tertiary" className="text-center">
          This is a modal screen (presentation: "modal"). It slides up from the bottom and can be dismissed by swiping down or tapping the back button.
        </Text>
        <View className="mt-4 rounded-lg border border-border bg-card p-4">
          <Text variant="body" color="tertiary">
            Message composition form would go here...
          </Text>
        </View>
        <View className="mt-4 gap-2">
          <Button onPress={() => router.back()}>
            <Text>Send Message</Text>
          </Button>
          <Button variant="plain" onPress={() => router.back()}>
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

