export type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: number;
  avatar?: string;
};

export const CHATS: Chat[] = [
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
