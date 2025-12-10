import { memo, useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  Pressable
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { Icon } from '@/components/nativewindui/Icon';

type Attachment = {
  id: string;
  name: string;
  type: string;
};

type Message = {
  id: string;
  subject: string;
  preview: string;
  message: string;
  senderName: string;
  sentAt: Date;
  unread?: boolean;
  attachments?: Attachment[];
};

// Message data matching the list
const MESSAGE_DATA: Record<string, Message> = {
  '1': {
    id: '1',
    subject: 'Welcome Message',
    preview: 'Welcome to our app! This is a preview of the message content.',
    message: 'Welcome to our app! This is a detailed message view. We\'re excited to have you here. This message contains important information about getting started with our platform. Feel free to explore all the features and don\'t hesitate to reach out if you have any questions.',
    senderName: 'Support Team',
    sentAt: new Date('2024-01-15'),
    unread: true,
    attachments: [
      { id: '1', name: 'Getting Started Guide.pdf', type: 'pdf' },
      { id: '2', name: 'Welcome Video.mp4', type: 'video' },
    ],
  },
  '2': {
    id: '2',
    subject: 'Important Update',
    preview: 'We have exciting new features available. Check them out!',
    message: 'We have exciting new features available! Check them out in the Services tab. We\'ve been working hard to improve your experience and add new functionality that will make your workflow more efficient. Please take a moment to explore these updates.',
    senderName: 'Admin',
    sentAt: new Date('2024-01-14'),
    unread: true,
    attachments: [
      { id: '1', name: 'Release Notes.pdf', type: 'pdf' },
    ],
  },
  '3': {
    id: '3',
    subject: 'Reminder',
    preview: 'Don\'t forget to check in regularly for updates.',
    message: 'This is a reminder message. Don\'t forget to check in regularly. Regular check-ins help us provide you with the best possible service and ensure you\'re up to date with all the latest information.',
    senderName: 'System',
    sentAt: new Date('2024-01-13'),
    unread: false,
  },
  '4': {
    id: '4',
    subject: 'Meeting Scheduled',
    preview: 'Your meeting has been scheduled for next Monday.',
    message: 'Your meeting has been scheduled for next Monday at 2:00 PM. Please confirm your attendance and let us know if you need to reschedule. We look forward to meeting with you.',
    senderName: 'Calendar',
    sentAt: new Date('2024-01-12'),
    unread: false,
    attachments: [
      { id: '1', name: 'Meeting Agenda.docx', type: 'docx' },
      { id: '2', name: 'Location Map.png', type: 'image' },
    ],
  },
  '5': {
    id: '5',
    subject: 'Document Review',
    preview: 'Please review the attached documents at your convenience.',
    message: 'Please review the attached documents at your convenience. Your feedback is important to us. If you have any questions or concerns, please don\'t hesitate to reach out.',
    senderName: 'HR Department',
    sentAt: new Date('2024-01-11'),
    unread: true,
    attachments: [
      { id: '1', name: 'Policy Document.pdf', type: 'pdf' },
      { id: '2', name: 'Review Form.pdf', type: 'pdf' },
    ],
  },
};

function MessageHeader({ message, onBack }: { message: Message; onBack: () => void }) {
  const formattedDate = useMemo(() => {
    return message.sentAt.toLocaleDateString('en-US', {
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
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={onBack} className="flex-row items-center gap-2">
          <Icon name="chevron.left" size={20} className="text-primary" />
          <Text variant="body" color="primary">Back</Text>
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
  isAttachmentInView: boolean;
  setIsAttachmentInView: (isAttachmentInView: boolean) => void;
};

function AttachmentItem({
  attachment,
  messageId,
  isAttachmentInView,
  setIsAttachmentInView
}: AttachmentItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  const getIconName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'doc.fill';
      case 'docx':
      case 'doc':
        return 'doc.fill';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        return 'photo.fill';
      case 'mp4':
      case 'video':
        return 'play.circle.fill';
      default:
        return 'doc.fill';
    }
  };

  const handlePressAttachment = useCallback(async () => {
    // Navigate to attachment detail screen
    router.push(`/(main)/(tabs)/(messages)/message/${messageId}/attachment/${attachment.id}`);
  }, [attachment, messageId, router]);

  return (
    <Pressable
      onPress={handlePressAttachment}
      className="flex-row items-center gap-3 p-3 rounded-lg border border-border bg-card active:opacity-70">
      <Icon name={getIconName(attachment.type)} size={24} className="text-primary" />
      <View className="flex-1">
        <Text variant="body" className="mb-1">
          {attachment.name}
        </Text>
        <Text variant="caption2" color="tertiary">
          {attachment.type.toUpperCase()}
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
};

function AttachmentList({ attachments, messageId }: AttachmentListProps) {
  const [isAttachmentInView, setIsAttachmentInView] = useState(false);

  const hasAttachments = attachments && attachments.length > 0;

  if (!hasAttachments) {
    return null;
  }

  return (
    <>
      <Text variant="heading" className="mt-[20]">
        Attachments
      </Text>
      <View className="flex-row flex-wrap gap-[8] mt-[8]">
        {attachments.map((attachment) => {
          return (
            <AttachmentItem
              key={attachment.name + attachment.type}
              attachment={attachment}
              messageId={messageId}
              isAttachmentInView={isAttachmentInView}
              setIsAttachmentInView={setIsAttachmentInView}
            />
          );
        })}
      </View>
    </>
  );
}

const MemoizedAttachmentList = memo(AttachmentList);

function MessageBody({ message }: { message: Message }) {
  return (
    <View className="mt-4">
      <Text variant="title1" className="mb-4">
        {message.subject}
      </Text>
      <Text variant="body" className="leading-6 mb-6">
        {message.message}
      </Text>
      <MemoizedAttachmentList attachments={message.attachments} messageId={message.id} />
    </View>
  );
}

export default function MessageScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Get message data based on ID
  const message = useMemo(() => {
    return MESSAGE_DATA[params.id || '1'] || MESSAGE_DATA['1'];
  }, [params.id]);

  // Dynamic screen options based on message
  const screenOptions = useMemo(() => ({
    headerShown: false,
    title: message.subject,
  }), [message.subject]);

  const handlePressBack = () => {
    router.back();
  };

  return (
    <>
      {/* Dynamic screen options */}
      <Stack.Screen options={screenOptions} />
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScrollView className="flex-1">
          <View className="p-4">
            <MessageHeader message={message} onBack={handlePressBack} />
            <MessageBody message={message} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
