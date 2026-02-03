import { memo, useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { Text } from '@/components/nativewindui/Text';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { Icon } from '@/components/nativewindui/Icon';
import {
  getCachedFilenames,
  getCachedFileSize,
  getCacheFilePath,
  fileExistsInCache,
} from '@/lib/files';
import type { Attachment, MessageWithAttachments } from '@/hooks/useMessageAttachments';
import { useDownloadMessageAttachmentsContext } from '@/contexts/downloadMessageAttachments';

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

function MessageHeader({ message, onBack }: { message: MessageWithAttachments; onBack: () => void }) {
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
  onPress: (attachment: Attachment) => void;
};

function AttachmentItem({ attachment, onPress }: AttachmentItemProps) {
  const [isDownloading] = useState(false);
  const isInMobileCache = getCachedFilenames().has(attachment.name);
  const isCache = isInMobileCache && attachment.fileSizeBytes === getCachedFileSize(getCacheFilePath(attachment.filename));

  const extension = useMemo(() => getFileExtension(attachment.name), [attachment.name]);
  const iconName = useMemo(() => getIconNameFromExtension(extension), [extension]);
  const fileSizeText = useMemo(
    () => formatFileSize(attachment.fileSizeBytes ?? 0),
    [attachment.fileSizeBytes]
  );

  const handlePress = useCallback(() => onPress(attachment), [attachment, onPress]);

  // Background color based on cache status
  // Cached: green tint, Not cached: default card background
  const backgroundClass = isCache ? 'bg-green-50 border-green-200' : 'bg-card border-border';

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-3 rounded-lg border p-3 active:opacity-70 ${backgroundClass}`}>
      <Icon name={iconName as any} size={24} className="text-primary" />
      <View className="flex-1">
        <Text variant="body" className="mb-1" numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text variant="caption2" color="tertiary">
          {extension.toUpperCase()} • {fileSizeText}
        </Text>
      </View>
      {isDownloading ? (
        <ActivityIndicator size="small" className="text-primary" />
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

function AttachmentList({ attachments, onAttachmentPress }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <View className="mt-2 gap-2">
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onPress={onAttachmentPress}
          />
        ))}
      </View>
    </>
  );
}

const MemoizedAttachmentList = memo(AttachmentList);

type MessageBodyProps = {
  message: MessageWithAttachments;
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
  const { downloadFileFromMessage } = useDownloadMessageAttachmentsContext();
  const params = useLocalSearchParams<{ id: string; messageData?: string }>();

  const router = useRouter();

  // Parse message data from route params
  const message = useMemo<MessageWithAttachments | null>(() => {
    if (!params.messageData) return null;

    try {
      return JSON.parse(params.messageData) as MessageWithAttachments;
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

  const openPdfViewer = useCallback(
    (fileName: string) => {
      router.push({
        pathname: '/(main)/pdf-viewer',
        params: { fileName },
      });
    },
    [router]
  );

  const handleAttachmentPress = useCallback(
    async (attachment: Attachment) => {
      const { filename } = attachment;

      // Check if already cached - findCachedFilePath returns actual path or null
      const existsInCache = fileExistsInCache(filename)

      if( existsInCache ) {
        openPdfViewer(filename);
        return;
      }

      const result = await downloadFileFromMessage(attachment);

      if( !result ) {
        console.warn('[MessageScreen] Attachment download failed');
        return;
      }

      if (getFileExtension(filename) !== 'pdf') {
        return;
      }

      openPdfViewer(filename);
    },
    [openPdfViewer, downloadFileFromMessage]
  );

  if (!message) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="flex-1 items-center justify-center p-4">
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
