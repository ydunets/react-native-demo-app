const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const formatChatTime = (lastMessageTime: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastMessageTime.getTime());
  const diffDays = Math.floor(diffTime / MS_PER_DAY);

  if (diffDays === 0) {
    return lastMessageTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return lastMessageTime.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return lastMessageTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};
