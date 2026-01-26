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

import { useContext } from 'react';
import {
  DownloadMessageAttachmentsContext,
  DownloadContextType,
} from '@/contexts/downloadMessageAttachments';

/**
 * Hook to access download queue context
 * Must be called inside DownloadMessageAttachmentsProvider
 *
 * @returns DownloadContextType with queue management API
 * @throws Error if used outside provider
 */
export const useDownloadMessageAttachments = (): DownloadContextType => {
  const context = useContext(DownloadMessageAttachmentsContext);

  if (!context) {
    throw new Error(
      '[useDownloadMessageAttachments] Must be used within DownloadMessageAttachmentsProvider. ' +
        'Ensure DownloadMessageAttachmentsProvider wraps your app in _layout.tsx'
    );
  }

  return context;
};

/**
 * Hook to safely access download context with optional fallback
 * Returns null instead of throwing if outside provider
 * Useful for optional UI features that degrade gracefully
 *
 * @returns DownloadContextType or null if not in provider
 */
export const useDownloadMessageAttachmentsOptional = (): DownloadContextType | null => {
  return useContext(DownloadMessageAttachmentsContext) ?? null;
};
