export type ChatMessage = {
  text: string;
  sender: 'user' | 'other';
  time: string;
};

export type ChatContent = {
  name: string;
  messages: ChatMessage[];
};

export const CHAT_CONTENT: Record<string, ChatContent> = {
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
