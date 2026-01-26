import { View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { Text } from '@/components/nativewindui/Text';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { Icon } from '@/components/nativewindui/Icon';

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: number;
  avatar?: string;
};

const CHATS: Chat[] = [
  {
    id: '1',
    name: 'Support Team',
    lastMessage: 'Hello! How can I help you today?',
    lastMessageTime: new Date('2024-01-15T10:06:00'),
    unread: 2,
  },
  {
    id: '2',
    name: 'Dr. Smith',
    lastMessage: 'Your appointment is confirmed for next Monday at 2 PM',
    lastMessageTime: new Date('2024-01-15T09:15:00'),
    unread: 0,
  },
  {
    id: '3',
    name: 'Wellness Coach',
    lastMessage: 'Great progress this week! Keep up the good work.',
    lastMessageTime: new Date('2024-01-14T14:30:00'),
    unread: 1,
  },
  {
    id: '4',
    name: 'Nurse Johnson',
    lastMessage: 'Please remember to take your medication',
    lastMessageTime: new Date('2024-01-13T08:00:00'),
    unread: 0,
  },
  {
    id: '5',
    name: 'Therapy Group',
    lastMessage: 'The next session will be on Friday',
    lastMessageTime: new Date('2024-01-12T16:45:00'),
    unread: 3,
  },
];

type ChatItemProps = {
  chat: Chat;
  onPress: (id: string) => void;
};

function ChatItem({ chat, onPress }: ChatItemProps) {
  const formattedTime = useMemo(() => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - chat.lastMessageTime.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return chat.lastMessageTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return chat.lastMessageTime.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return chat.lastMessageTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
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
    router.push(`/(main)/(tabs)/(chat)/${id}`);
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
    router.push('/(main)/(tabs)/(chat)/new');
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
