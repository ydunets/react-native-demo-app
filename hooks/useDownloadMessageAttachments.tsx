/**
 * useDownloadMessageAttachments Hook
 * Provides type-safe access to download queue context from any component
 *
 * Usage:
 * ```tsx
 * const { queue, isProcessing, addCommand, startProcessing } = useDownloadMessageAttachments();
 * ```
 *
 * Error Handling:
 * - Throws error if used outside DownloadMessageAttachmentsProvider
 * - Provides clear error message for debugging
 */

import { useContext, useEffect } from 'react';

import {
  DownloadMessageAttachmentsContext,
  DownloadContextType,
} from '@/contexts/downloadMessageAttachments';
import { useAppState } from './useAppState';
import { useNetInfo } from './useNetInfo';

export interface DownloadHookOptions {
  autoManageNetwork?: boolean;
  autoManageAppState?: boolean;
}

/**
 * Hook to access download queue context
 * Must be called inside DownloadMessageAttachmentsProvider
 *
 * @returns DownloadContextType with queue management API
 * @throws Error if used outside provider
 */
export const useDownloadMessageAttachments = (): DownloadContextType => {
  const context = useContext(DownloadMessageAttachmentsContext);
  const { isAppActive } = useAppState();
  const { isConnected } = useNetInfo();

  if (!context) {
    throw new Error(
      '[useDownloadMessageAttachments] Must be used within DownloadMessageAttachmentsProvider. ' +
        'Ensure DownloadMessageAttachmentsProvider wraps your app in _layout.tsx'
    );
  }

  // Pause/resume based on network status
  useEffect(() => {
    if (isConnected) {
      context.resumeProcessing();
    } else {
      context.pauseProcessing();
    }
  }, [isConnected, context]);

  // Pause/resume based on app foreground/background
  useEffect(() => {
    if (isAppActive) {
      context.resumeProcessing();
    } else {
      context.pauseProcessing();
    }
  }, [isAppActive, context]);

  return context;
};
