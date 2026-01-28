import { useEffect } from 'react';


import { useAppState } from './useAppState';
import { useNetInfo } from './useNetInfo';
import { useDownloadQueueActions } from '@/stores/downloadQueue';

/**
 * Hook to access download queue context
 * Must be called inside DownloadMessageAttachmentsProvider
 *
 * @returns DownloadContextType with queue management API
 * @throws Error if used outside provider
 */
export const useDownloadMessageAttachments = () => {
  const { pauseProcessing, resumeProcessing } = useDownloadQueueActions();
  const { isAppActive } = useAppState();
  const { isConnected } = useNetInfo();

  // Pause/resume based on network status
  useEffect(() => {
    if (isConnected && isAppActive) {
      resumeProcessing();
    } else {
      pauseProcessing();
    }
  }, [isConnected, isAppActive, pauseProcessing, resumeProcessing]);
};
