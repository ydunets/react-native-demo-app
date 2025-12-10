import { router } from 'expo-router';
import { View, ScrollView } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';

export default function UserFilesScreen() {
  return (
    <ScrollView className="flex-1">
      <View className="gap-4 p-4">
        <Text variant="largeTitle">User Files</Text>
        <Text variant="body" color="tertiary">
          Access your files here.
        </Text>
        <View className="mt-4">
          <Button variant="secondary" onPress={() => router.back()}>
            <Text>Back</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

