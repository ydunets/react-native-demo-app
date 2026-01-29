import { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { ActivityIndicator, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { Text } from '@/components/nativewindui/Text';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { Icon } from '@/components/nativewindui/Icon';
import { getCachedFilenames } from '@/lib/files';
import type { Message, Attachment } from '@/types/message';

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

/**
 * Format file size in human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < BYTES_PER_KB) return `${bytes} B`;
  if (bytes < BYTES_PER_MB) return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Get icon name based on file extension
 */
const getIconNameFromExtension = (extension: string): string => {
  switch (extension) {
    case 'pdf':
      return 'doc.fill';
    case 'docx':
    case 'doc':
      return 'doc.fill';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return 'photo.fill';
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'play.circle.fill';
    default:
      return 'doc.fill';
  }
};

function MessageHeader({ message, onBack }: { message: Message; onBack: () => void }) {
  const formattedDate = useMemo(() => {
    const sentDate = new Date(message.sentAt);
    return sentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [message.sentAt]);

  return (
    <View className="border-b border-border pb-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable onPress={onBack} className="flex-row items-center gap-2">
          <Icon name="chevron.left" size={20} className="text-primary" />
          <Text variant="body" color="primary">
            Back
          </Text>
        </Pressable>
        <Pressable className="p-2">
          <Icon name="archivebox.fill" size={24} className="text-primary" />
        </Pressable>
      </View>
      <View className="flex-row items-center gap-3">
        <Avatar alt={message.senderName}>
          <AvatarFallback>
            <Text className="text-sm">{message.senderName.charAt(0)}</Text>
          </AvatarFallback>
        </Avatar>
        <View className="flex-1">
          <Text variant="heading" className="mb-1">
            {message.senderName}
          </Text>
          <Text variant="caption2" color="tertiary">
            {formattedDate}
          </Text>
        </View>
      </View>
    </View>
  );
}

type AttachmentItemProps = {
  attachment: Attachment;
  messageId: string;
  isCached: boolean;
  onPress: (attachment: Attachment) => void;
};

function AttachmentItem({ attachment, messageId, isCached, onPress }: AttachmentItemProps) {
  const [isDownloading] = useState(false);

  const extension = useMemo(() => getFileExtension(attachment.name), [attachment.name]);
  const iconName = useMemo(() => getIconNameFromExtension(extension), [extension]);
  const fileSizeText = useMemo(
    () => formatFileSize(attachment.fileSizeBytes),
    [attachment.fileSizeBytes]
  );

  const handlePress = useCallback(() => onPress(attachment), [attachment, onPress]);

  // Background color based on cache status
  // Cached: green tint, Not cached: default card background
  const backgroundClass = isCached
    ? 'bg-green-50 border-green-200'
    : 'bg-card border-border';

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-3 rounded-lg border p-3 active:opacity-70 ${backgroundClass}`}>
      <Icon name={iconName} size={24} className="text-primary" />
      <View className="flex-1">
        <Text variant="body" className="mb-1" numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text variant="caption2" color="tertiary">
          {extension.toUpperCase()} • {fileSizeText}
          {isCached && ' • Cached'}
        </Text>
      </View>
      {isDownloading ? (
        <ActivityIndicator size="small" className="text-primary" />
      ) : isCached ? (
        <Icon name="checkmark.circle.fill" size={20} className="text-green-600" />
      ) : (
        <Icon name="arrow.down.circle" size={20} className="text-tertiary" />
      )}
    </Pressable>
  );
}

type AttachmentListProps = {
  attachments: Attachment[] | undefined;
  messageId: string;
  onAttachmentPress: (attachment: Attachment) => void;
};

function AttachmentList({ attachments, messageId, onAttachmentPress }: AttachmentListProps) {
  const [cachedFilenames, setCachedFilenames] = useState<Set<string>>(new Set());

  // Check cache status on mount and when attachments change
  useEffect(() => {
    const checkCache = () => {
      const cached = getCachedFilenames();
      setCachedFilenames(cached);
    };

    checkCache();

    // Re-check cache periodically in case files are downloaded
    const interval = setInterval(checkCache, 2000);
    return () => clearInterval(interval);
  }, [attachments]);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const cachedCount = attachments.filter((a) => cachedFilenames.has(a.name)).length;

  return (
    <>
      <Text variant="heading" className="mt-5">
        Attachments ({cachedCount}/{attachments.length} cached)
      </Text>
      <View className="mt-2 gap-2">
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            messageId={messageId}
            isCached={cachedFilenames.has(attachment.name)}
            onPress={onAttachmentPress}
          />
        ))}
      </View>
    </>
  );
}

const MemoizedAttachmentList = memo(AttachmentList);

type MessageBodyProps = {
  message: Message;
  onAttachmentPress: (attachment: Attachment) => void;
};

function MessageBody({ message, onAttachmentPress }: MessageBodyProps) {
  return (
    <View className="mt-4">
      <Text variant="title1" className="mb-4">
        {message.subject}
      </Text>
      <Text variant="body" className="mb-6 leading-6">
        {message.preview}
      </Text>
      <MemoizedAttachmentList
        attachments={message.attachments}
        messageId={message.id}
        onAttachmentPress={onAttachmentPress}
      />
    </View>
  );
}

export default function MessageScreen() {
  const params = useLocalSearchParams<{ id: string; messageData?: string }>();
  const router = useRouter();

  // Parse message data from route params
  const message = useMemo<Message | null>(() => {
    if (!params.messageData) return null;

    try {
      return JSON.parse(params.messageData) as Message;
    } catch {
      console.warn('[MessageScreen] Failed to parse message data');
      return null;
    }
  }, [params.messageData]);

  // Dynamic screen options based on message
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      title: message?.subject ?? 'Message',
    }),
    [message?.subject]
  );

  const handlePressBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAttachmentPress = useCallback((attachment: Attachment) => {
    // TODO: Phase 2 - Implement priority download
    // For now, log the attachment press
    console.log('[MessageScreen] Attachment pressed:', attachment.name, attachment.id);
  }, []);

  if (!message) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="flex-1 items-center justify-center p-4">
            <Icon name="exclamationmark.triangle" size={48} className="text-destructive" />
            <Text variant="body" color="tertiary" className="mt-2 text-center">
              Message not found
            </Text>
            <Pressable onPress={handlePressBack} className="mt-4">
              <Text variant="body" color="primary">
                Go back
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScrollView className="flex-1">
          <View className="p-4">
            <MessageHeader message={message} onBack={handlePressBack} />
            <MessageBody message={message} onAttachmentPress={handleAttachmentPress} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
