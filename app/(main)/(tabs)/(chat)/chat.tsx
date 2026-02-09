import { View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { Text } from '@/components/nativewindui/Text';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { Icon } from '@/components/nativewindui/Icon';
import { CHATS, type Chat } from '@/constants/chat/chats';
import { formatChatTime } from '@/utils/chat/date';
import RoutePaths from '@/router-map/routes';

type ChatItemProps = {
  chat: Chat;
  onPress: (id: string) => void;
};

function ChatItem({ chat, onPress }: ChatItemProps) {
  const formattedTime = useMemo(() => {
    return formatChatTime(chat.lastMessageTime);
  }, [chat.lastMessageTime]);

  return (
    <Pressable
      onPress={() => onPress(chat.id)}
      className="flex-row items-center gap-3 border-b border-border bg-white p-4 active:opacity-70">
      <Avatar alt={chat.name}>
        <AvatarFallback>
          <Text className="text-sm">{chat.name.charAt(0)}</Text>
        </AvatarFallback>
      </Avatar>
      <View className="flex-1">
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="heading" className={chat.unread > 0 ? 'font-semibold' : ''}>
            {chat.name}
          </Text>
          <Text variant="caption2" color="tertiary">
            {formattedTime}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text
            variant="body"
            color="tertiary"
            numberOfLines={1}
            className={chat.unread > 0 ? 'font-medium' : ''}>
            {chat.lastMessage}
          </Text>
          {chat.unread > 0 && (
            <View className="min-w-[20] items-center justify-center rounded-full bg-primary px-2 py-0.5">
              <Text className="text-xs font-semibold text-white">
                {chat.unread > 99 ? '99+' : chat.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ChatList() {
  const router = useRouter();

  const handlePressChat = (id: string) => {
    // Dynamic navigation to chat detail without index files
    router.push(RoutePaths.ChatDetailScreen.replace('[id]', id));
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <ChatItem chat={item} onPress={handlePressChat} />
  );

  const keyExtractor = (item: Chat) => item.id;

  return (
    <FlatList
      data={CHATS}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerClassName="bg-white"
      className="flex-1"
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center p-8">
          <Icon name="message.fill" size={48} className="text-tertiary mb-4" />
          <Text variant="body" color="tertiary" className="text-center">
            No conversations yet
          </Text>
        </View>
      }
    />
  );
}

export default function ChatScreen() {
  const router = useRouter();

  const handleNewChat = () => {
    // Navigate to new chat or open chat creation modal
    router.push(RoutePaths.ChatNewScreen);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1">
        <View className="flex-row items-center justify-between border-b border-border p-4">
          <Text variant="title2">Conversations</Text>
          <Pressable
            onPress={handleNewChat}
            className="rounded-full bg-primary p-2 active:opacity-70">
            <Icon name="plus" size={20} className="text-white" />
          </Pressable>
        </View>
        <ChatList />
      </View>
    </SafeAreaView>
  );
}
