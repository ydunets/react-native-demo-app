/**
 * useMessages
 * Fetches messages with attachments from the backend API
 */

import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/axios-client';
import { useIsLoggedIn, useIsHydrated } from '@/stores/auth';
import { MessageWithAttachments } from '@/hooks/useMessageAttachments';

const DEFAULT_LIMIT = 50;
const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
const EMPTY_MESSAGES: MessageWithAttachments[] = [];

type MessagesResponse = {
  messages?: MessageWithAttachments[];
}

const fetchMessages = async (limit: number): Promise<MessageWithAttachments[]> => {
  const { data } = await axiosClient.get<MessagesResponse>('/messages/recent', {
    params: { limit, includeAttachments: true },
  });

  return data?.messages ?? [];
};

export interface UseMessagesOptions {
  limit?: number;
  enabled?: boolean;
}

export const useMessages = (options: UseMessagesOptions = {}) => {
  const { limit = DEFAULT_LIMIT, enabled = true } = options;
  const isLoggedIn = useIsLoggedIn();
  const isHydrated = useIsHydrated();

  // Only fetch when: store is hydrated, user is logged in, and enabled
  const shouldFetch = isHydrated && isLoggedIn && enabled;

  const query = useQuery<MessageWithAttachments[], Error>({
    queryKey: ['messages', limit],
    queryFn: () => fetchMessages(limit),
    staleTime: STALE_TIME_MS,
    enabled: shouldFetch,
  });

  return {
    messages: query.data ?? EMPTY_MESSAGES,
    isLoading: query.isLoading || query.isFetching,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};
