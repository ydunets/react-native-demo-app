import { useCallback, useEffect } from 'react';

import { AttachmentInput, useMessageAttachments } from './useMessageAttachments';

import { useDownloadMessageAttachmentsContext } from '@/contexts/downloadMessageAttachments';

import { useAppState } from './useAppState';
import { useNetInfo } from './useNetInfo';
import { fileExistsInCache } from '@/lib/files';
import { useIsLoggedIn } from '@/stores/auth';
import useManageProcessingQueue from '@/hooks/useManageProcessingQueue';

export const useDownloadMessageAttachments = () => {
  const {
    isProcessing,
  } = useManageProcessingQueue();
  const { addCommand, startProcessing, resetQueue, cancelCurrentDownload } =
    useDownloadMessageAttachmentsContext();
  const { attachments } = useMessageAttachments();
  const { isAppActive } = useAppState();
  const { isConnected } = useNetInfo();
  const isAuthenticated = useIsLoggedIn();

  const addFilesToProcessingQueue = useCallback(
    async (attachments: AttachmentInput[]) => {
      resetQueue();
      try {
        for (const attachment of attachments) {
          const filename = attachment?.name;

          if (!filename) continue;

          const exists = fileExistsInCache(filename);

          if (exists) continue;
          try {
            console.log('[File Processing] Adding file to queue', attachment.name);

            addCommand({
              filename: attachment.name,
            });
          } catch (error) {
            console.error(
              `[File Processing] Error queueing download for ${attachment.name}:`,
              error
            );
          }
        }
        console.log('[File Processing] Finished adding files to queue');
      } catch (error) {
        console.error('[File Processing] Download process failed:', error);
        return false;
      }
    },
    [addCommand, resetQueue]
  );

  const startDownloads = useCallback(async () => {
    if (!attachments.length) {
      console.log('[File Processing] No attachments to process');
      return;
    }
    if (isProcessing.current) {
      console.log('[File Processing] Downloads already in progress');
      return;
    }

    if (!isAuthenticated) {
      console.log('[File Processing] Not authenticated, downloads paused');
      return;
    }
    
    if(!isAppActive) {
      console.log('[File Processing] App is not active, downloads paused');
      return;
    }

    if(!isConnected) {
      cancelCurrentDownload();
      console.log('[File Processing] No internet connection, downloads paused');
      return;
    }

    await addFilesToProcessingQueue(attachments);
    await startProcessing();
  }, [attachments, isProcessing, isAuthenticated, isAppActive, isConnected, addFilesToProcessingQueue, startProcessing, cancelCurrentDownload]);

  useEffect(() => {
    startDownloads()
  }, [startDownloads]);
};
