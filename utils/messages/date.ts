const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const formatMessageDate = (sentAt: string): string => {
  const sentDate = new Date(sentAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - sentDate.getTime());
  const diffDays = Math.floor(diffTime / MS_PER_DAY);

  if (diffDays === 0) {
    return sentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return sentDate.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return sentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};
