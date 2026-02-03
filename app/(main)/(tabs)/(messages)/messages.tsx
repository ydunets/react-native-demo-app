import { View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo, useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { useMessages } from '@/hooks/useMessages';
import type { Message } from '@/types/message';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type MessageItemProps = {
  message: Message;
  onPress: (message: Message) => void;
};

function MessageItem({ message, onPress }: MessageItemProps) {
  const formattedDate = useMemo(() => {
    const sentDate = new Date(message.sentAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - sentDate.getTime());
    const diffDays = Math.floor(diffTime / MS_PER_DAY);

    if (diffDays === 0) {
      return sentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return sentDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return sentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }, [message.sentAt]);

  const handlePress = useCallback(() => onPress(message), [message, onPress]);

  const attachmentCount = message.attachments?.length ?? 0;

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-start gap-3 border-b border-border bg-white p-4 active:opacity-70">
      <Avatar alt={message.senderName}>
        <AvatarFallback>
          <Text className="text-xs">{message.senderName.charAt(0)}</Text>
        </AvatarFallback>
      </Avatar>
      <View className="flex-1">
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="heading" className={message.unread ? 'font-semibold' : ''}>
            {message.senderName}
          </Text>
          <Text variant="caption2" color="tertiary">
            {formattedDate}
          </Text>
        </View>
        <Text
          variant="subhead"
          color="primary"
          className={message.unread ? 'font-medium' : ''}
          numberOfLines={1}>
          {message.subject}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text variant="body" color="tertiary" numberOfLines={2} className="flex-1">
            {message.preview}
          </Text>
          {attachmentCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Icon name="paperclip" size={14} className="text-tertiary" />
              <Text variant="caption2" color="tertiary">
                {attachmentCount}
              </Text>
            </View>
          )}
        </View>
      </View>
      {message.unread && <View className="mt-2 h-2 w-2 rounded-full bg-primary" />}
    </Pressable>
  );
}

function MessageList() {
  const router = useRouter();
  const { messages, isLoading, error } = useMessages();

  const handlePressMessage = useCallback(
    (message: Message) => {
      router.push({
        pathname: '/(main)/(tabs)/(messages)/message/[id]',
        params: { id: message.id, messageData: JSON.stringify(message) },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => <MessageItem message={item} onPress={handlePressMessage} />,
    [handlePressMessage]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text variant="body" color="tertiary" className="mt-2">
          Loading messages...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text variant="body" color="tertiary" className="mt-2 text-center">
          Failed to load messages
        </Text>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Icon name="tray" size={48} className="text-tertiary" />
        <Text variant="body" color="tertiary" className="mt-2 text-center">
          No messages
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingBottom: 16 }}
    />
  );
}

export default function Messages() {
  const router = useRouter();

  const handleSendMessage = () => {
    router.push('/(main)/send-message');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1">
        <View className="border-b border-border p-4">
          <Button variant="plain" onPress={handleSendMessage}>
            <Icon name="square.and.pencil" size={24} className="text-primary" />
            <Text variant="heading" color="primary">
              New Message
            </Text>
          </Button>
        </View>
        <MessageList />
      </View>
    </SafeAreaView>
  );
}
