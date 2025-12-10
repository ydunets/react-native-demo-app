import { useLocalSearchParams, router } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';

export default function AttachmentDetailScreen() {
  const { id, attachmentId } = useLocalSearchParams<{ id: string; attachmentId: string }>();

  const getIconName = (attachmentId: string) => {
    // Simple mapping based on attachment ID
    if (attachmentId === '1') return 'doc.fill';
    if (attachmentId === '2') {
      // Check if it's a video or image based on message ID
      if (id === '1') return 'play.circle.fill'; // Video
      return 'photo.fill'; // Image
    }
    return 'doc.fill';
  };

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View className="items-center gap-4">
            <Icon name={getIconName(attachmentId)} size={64} className="text-primary" />
            <Text variant="largeTitle" className="text-center">
              Attachment Details
            </Text>
            <Text variant="body" color="tertiary" className="text-center">
              Message ID: {id}
            </Text>
            <Text variant="body" color="tertiary" className="text-center">
              Attachment ID: {attachmentId}
            </Text>
          </View>
          <View className="mt-4 rounded-lg border border-border bg-card p-4">
            <Text variant="body">
              This screen displays attachment details. In a real app, this would show the attachment content (PDF viewer, image viewer, video player, etc.).
            </Text>
          </View>
          <View className="mt-4">
            <Button variant="secondary" onPress={() => router.back()}>
              <Text>Back to Message</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

