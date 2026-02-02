import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';

type Message = {
  id: string;
  subject: string;
  preview: string;
  senderName: string;
  sentAt: Date;
  unread?: boolean;
};

// Generate 50 messages
const generateMessages = (): Message[] => {
  const senders = [
    'Support Team',
    'Admin',
    'System',
    'Calendar',
    'HR Department',
    'Finance Team',
    'Marketing',
    'IT Support',
    'Legal Department',
    'Operations',
    'Customer Service',
    'Product Team',
    'Sales Team',
    'Design Team',
    'Engineering',
    'Quality Assurance',
    'Project Manager',
    'Executive Team',
    'Security Team',
    'Compliance',
  ];

  const subjects = [
    'Welcome Message',
    'Important Update',
    'Reminder',
    'Meeting Scheduled',
    'Document Review',
    'Payment Received',
    'Account Verification',
    'Password Reset',
    'New Feature Available',
    'Maintenance Notice',
    'Security Alert',
    'Policy Update',
    'Training Session',
    'Performance Review',
    'Budget Approval',
    'Contract Renewal',
    'Event Invitation',
    'Survey Request',
    'Feedback Requested',
    'Status Update',
    'Action Required',
    'Confirmation Needed',
    'Deadline Approaching',
    'Resource Available',
    'System Upgrade',
    'Data Backup Complete',
    'Report Generated',
    'Invoice Sent',
    'Receipt Confirmed',
    'Appointment Confirmed',
    'Order Shipped',
    'Delivery Scheduled',
    'Return Processed',
    'Refund Issued',
    'Subscription Renewed',
    'Trial Ending Soon',
    'Upgrade Available',
    'Feature Request',
    'Bug Report',
    'Support Ticket',
    'Knowledge Base',
    'FAQ Update',
    'Best Practices',
    'Tips & Tricks',
    'Newsletter',
    'Announcement',
    'Holiday Notice',
    'Office Closure',
    'Emergency Alert',
    'Test Message',
  ];

  const previews = [
    'Welcome to our app! This is a preview of the message content.',
    'We have exciting new features available. Check them out!',
    "Don't forget to check in regularly for updates.",
    'Your meeting has been scheduled for next Monday.',
    'Please review the attached documents at your convenience.',
    'Your payment has been successfully processed.',
    'Please verify your account to continue using our services.',
    'A password reset request has been initiated for your account.',
    "We're excited to announce a new feature that will enhance your experience.",
    'Scheduled maintenance will occur this weekend. Services may be temporarily unavailable.',
    'We detected unusual activity on your account. Please review immediately.',
    'Our privacy policy has been updated. Please review the changes.',
    "You're invited to attend our upcoming training session.",
    'Your performance review is scheduled. Please prepare accordingly.',
    'Your budget request has been approved and funds are available.',
    'Your contract is up for renewal. Please review the terms.',
    "You're invited to our upcoming event. RSVP by clicking here.",
    'We value your feedback. Please take a moment to complete our survey.',
    "We'd love to hear your thoughts. Share your feedback with us.",
    "Here's the latest status update on your request.",
    'Your immediate attention is required. Please take action.',
    'Please confirm your details to proceed.',
    'This deadline is approaching. Please complete the task.',
    'New resources are now available in your dashboard.',
    'A system upgrade is scheduled. New features will be available.',
    'Your data backup has been completed successfully.',
    'Your requested report has been generated and is ready.',
    'Your invoice has been sent. Please review and process payment.',
    'Your receipt has been confirmed. Thank you for your purchase.',
    'Your appointment has been confirmed. We look forward to seeing you.',
    'Your order has been shipped. Track your package here.',
    'Your delivery has been scheduled. Expect it within 2-3 business days.',
    'Your return has been processed. Refund will be issued shortly.',
    'Your refund has been issued. It should appear in your account within 5-7 days.',
    'Your subscription has been renewed. Thank you for your continued support.',
    'Your trial period is ending soon. Upgrade to continue enjoying our services.',
    'An upgrade is available for your account. Unlock additional features.',
    "We've received your feature request. Our team will review it.",
    "Thank you for reporting this bug. We're working on a fix.",
    "Your support ticket has been created. We'll respond within 24 hours.",
    'New articles have been added to our knowledge base. Check them out.',
    'Our FAQ section has been updated with new information.',
    'Here are some best practices to help you get the most out of our platform.',
    'Check out these tips and tricks to improve your workflow.',
    'Our monthly newsletter is here. Read the latest updates.',
    'Important announcement: Please read for updates on our services.',
    'Holiday notice: Our offices will be closed on the following dates.',
    'Office closure: We will be closed for maintenance.',
    'Emergency alert: Please review this important security update.',
    'This is a test message to verify your notification settings.',
  ];

  const messages: Message[] = [];
  const baseDate = new Date('2024-01-15');

  for (let i = 0; i < 50; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    messages.push({
      id: String(i + 1),
      subject: subjects[i % subjects.length],
      preview: previews[i % previews.length],
      senderName: senders[i % senders.length],
      sentAt: date,
      unread: Math.random() > 0.5, // Random unread status
    });
  }

  return messages;
};

const MESSAGES: Message[] = generateMessages();

type MessageItemProps = {
  message: Message;
  onPress: (id: string) => void;
};

function MessageItem({ message, onPress }: MessageItemProps) {
  const formattedDate = useMemo(() => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - message.sentAt.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return message.sentAt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return message.sentAt.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return message.sentAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }, [message.sentAt]);

  return (
    <Pressable
      onPress={() => onPress(message.id)}
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
        <Text variant="body" color="tertiary" numberOfLines={2} className="mt-1">
          {message.preview}
        </Text>
      </View>
      {message.unread && <View className="mt-2 h-2 w-2 rounded-full bg-primary" />}
    </Pressable>
  );
}

function MessageList() {
  const router = useRouter();

  const handlePressMessage = (id: string) => {
    // Dynamic navigation to message detail without index files
    router.push(`/(main)/(tabs)/(messages)/message/${id}`);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <MessageItem message={item} onPress={handlePressMessage} />
  );

  const keyExtractor = (item: Message) => item.id;

  return (
    <FlashList
      data={MESSAGES}
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
