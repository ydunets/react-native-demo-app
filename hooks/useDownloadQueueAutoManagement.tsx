/**
 * useDownloadQueueAutoManagement Hook
 * Separate hook for screens that need network/app state auto-management
 * (Startup initialization uses explicit manual control to avoid infinite loops)
 *
 * Usage in screens:
 * ```tsx
 * const { queue, isProcessing } = useDownloadQueueAutoManagement();
 * ```
 */

import { useDownloadMessageAttachments } from './useDownloadMessageAttachments';

/**
 * Hook for screens that need automatic pause/resume on network/app state changes
 * Should NOT be used in startup code (use useDownloadMessageAttachments with auto flags disabled)
 *
 * @returns DownloadContextType with auto-management enabled
 */
export const useDownloadQueueAutoManagement = () => {
  // Enable auto-management for screens (not for startup)
  return useDownloadMessageAttachments({
    autoManageNetwork: true,
    autoManageAppState: true,
  });
};
