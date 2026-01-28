import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { useColorScheme } from '@/lib/useColorScheme';

const CHAT_CONTENT: Record<
  string,
  { name: string; messages: { text: string; sender: 'user' | 'other'; time: string }[] }
> = {
  '1': {
    name: 'Support Team',
    messages: [
      { text: 'Hello! How can I help you today?', sender: 'other', time: '10:00 AM' },
      { text: 'I have a question about my account', sender: 'user', time: '10:05 AM' },
      {
        text: "Sure, I'd be happy to help. What would you like to know?",
        sender: 'other',
        time: '10:06 AM',
      },
    ],
  },
  '2': {
    name: 'Dr. Smith',
    messages: [
      {
        text: 'Your appointment is confirmed for next Monday at 2 PM',
        sender: 'other',
        time: '9:00 AM',
      },
      { text: "Thank you! I'll be there", sender: 'user', time: '9:15 AM' },
    ],
  },
  '3': {
    name: 'Wellness Coach',
    messages: [
      {
        text: 'Great progress this week! Keep up the good work.',
        sender: 'other',
        time: 'Yesterday',
      },
      { text: 'Thank you! I feel much better', sender: 'user', time: 'Yesterday' },
    ],
  },
};

export default function ChatDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const chat = CHAT_CONTENT[id || '1'] || CHAT_CONTENT['1'];
  const { colors } = useColorScheme();
  const [message, setMessage] = useState('');

  // Use name from params if available, otherwise use chat.name
  const displayName = name || chat.name;

  // Dynamic screen options based on chat and params
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      title: displayName,
    }),
    [displayName]
  );

  const handlePressBack = () => {
    router.back();
  };

  // Example: Update title dynamically using router.setParams()
  const handleUpdateTitle = () => {
    router.setParams({ name: `${chat.name} (Active)` });
  };

  return (
    <>
      {/* Dynamic screen options */}
      <Stack.Screen options={screenOptions} />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border bg-white p-4">
            <Pressable onPress={handlePressBack} className="flex-row items-center gap-2">
              <Icon name="chevron.left" size={20} className="text-primary" />
              <Text variant="body" color="primary">
                Back
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-3">
              <Avatar alt={displayName}>
                <AvatarFallback>
                  <Text className="text-sm">{displayName.charAt(0)}</Text>
                </AvatarFallback>
              </Avatar>
              <Text variant="heading">{displayName}</Text>
            </View>
            <Pressable onPress={handleUpdateTitle} className="p-2">
              <Icon name="pencil" size={18} className="text-primary" />
            </Pressable>
          </View>
          <ScrollView className="flex-1" contentContainerClassName="p-4 gap-3">
            {/* Messages */}
            {chat.messages.map((msg, index) => (
              <View
                key={index}
                className={`flex-row gap-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                {msg.sender === 'other' && (
                  <Avatar alt={chat.name}>
                    <AvatarFallback>
                      <Text className="text-xs">{chat.name.charAt(0)}</Text>
                    </AvatarFallback>
                  </Avatar>
                )}
                <View
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === 'user' ? 'bg-primary' : 'border border-border bg-card'
                  }`}>
                  <Text className={msg.sender === 'user' ? 'text-white' : 'text-foreground'}>
                    {msg.text}
                  </Text>
                  <Text
                    variant="caption2"
                    className={`mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-tertiary'}`}>
                    {msg.time}
                  </Text>
                </View>
                {msg.sender === 'user' && (
                  <Avatar alt="User">
                    <AvatarFallback>
                      <Text>JD</Text>
                    </AvatarFallback>
                  </Avatar>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View className="border-t border-border bg-background p-4">
            <View className="flex-row items-center gap-2">
              <View className="flex-1 rounded-lg border border-border bg-card px-4 py-2">
                <TextInput
                  placeholder="Type a message..."
                  value={message}
                  onChangeText={setMessage}
                  placeholderTextColor={colors.grey}
                  className="text-foreground"
                  multiline
                />
              </View>
              <Button
                onPress={() => {
                  // Handle send message
                  setMessage('');
                }}
                size="icon"
                className="rounded-full">
                <Icon name="paperplane.fill" className="text-white" />
              </Button>
            </View>

            {/* Example: Update title dynamically using router.setParams() */}
            <Pressable
              onPress={handleUpdateTitle}
              className="mt-4 rounded-lg border border-border bg-card p-3 active:opacity-70">
              <View className="flex-row items-center gap-2">
                <Icon name="pencil" size={18} className="text-primary" />
                <Text variant="body" color="primary">
                  Update the title (using router.setParams)
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
