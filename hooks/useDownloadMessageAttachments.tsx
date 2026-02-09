import { useCallback, useEffect } from 'react';

import { useMessageAttachments, type Attachment } from './useMessageAttachments';

import { useDownloadMessageAttachmentsContext } from '@/contexts/downloadMessageAttachments';

import { useAppState } from './useAppState';
import { useNetInfo } from './useNetInfo';
import { fileExistsInCache } from '@/lib/files';
import { useIsLoggedIn } from '@/stores/auth';
import { downloadQueueActions, downloadQueueState } from '@/stores/downloadQueue/valtioState';

export const useDownloadMessageAttachments = () => {
  const{ addCommand, runProcessing, resetQueue, cancelCurrentDownload } =
    useDownloadMessageAttachmentsContext();
  const { attachments, isSuccess } = useMessageAttachments();
  const { isAppActive } = useAppState();
  const { isConnected } = useNetInfo();
  const isAuthenticated = useIsLoggedIn();

  const addFilesToProcessingQueue = useCallback(
    async (attachments: Attachment[]) => {
      resetQueue();
      try {
        for (const attachment of attachments) {
          const filename = attachment?.name;

          if (!filename) continue;

          const exists = fileExistsInCache(filename);

          if (exists) continue;
          try {
            console.log(
              '\x1b[36m',
              `[Add Command to Queue] id=${attachment.id} filename=${attachment.name}`,
              '\x1b[0m'
            );

            addCommand({
              id: attachment.id,
              filename: attachment.name,
            });
          } catch (error) {
            console.error(
              '\x1b[31m', `[File Processing] Error queueing download for ${attachment.name}:`, '\x1b[0m',
              error
            );
          }
        }
        console.log('\x1b[36m', '[File Processing] Finished adding files to queue', '\x1b[0m');
      } catch (error) {
        console.error('\x1b[31m', '[File Processing] Download process failed:', '\x1b[0m', error);
        return false;
      }
    },
    [addCommand, resetQueue]
  );

  const startDownloads = useCallback(async () => {
    console.log(
      '\x1b[36m',
      '[File Processing] Starting downloads:',
      attachments.length,
      'attachments',
      '\x1b[0m'
    );
    if (!attachments.length) {
      console.log('\x1b[90m', '[File Processing] No attachments to process', '\x1b[0m');
      return;
    }
    
    // Read isProcessing directly from proxy to avoid stale closure issues
    // This prevents useEffect re-triggering when isProcessing changes


    if (!isAuthenticated) {
      console.log('\x1b[33m', '[File Processing] Not authenticated, downloads paused', '\x1b[0m');
      return;
    }

    if (!isAppActive) {
      console.log('\x1b[33m', '[File Processing] App is not active, downloads paused', '\x1b[0m');
      return;
    }

    if (!isConnected) {
      cancelCurrentDownload();
      console.log(
        '\x1b[33m',
        '[File Processing] No internet connection, downloads paused',
        '\x1b[0m'
      );
      return;
    }

    if (downloadQueueState.isProcessing) {
      console.log(downloadQueueState.isProcessing);
      console.log('\x1b[33m', '[File Processing] Downloads already in progress', '\x1b[0m');
      return;
    }


    if (downloadQueueState.canResumeFromBackground) {
      downloadQueueActions.resumeFromBackground();
      await runProcessing();
      return;
    }

    await addFilesToProcessingQueue(attachments);
    await runProcessing();
  }, [
    attachments,
    isAuthenticated,
    isAppActive,
    isConnected,
    addFilesToProcessingQueue,
    runProcessing,
    cancelCurrentDownload,
  ]);

  useEffect(() => {
    if (!isSuccess) return;
    startDownloads();
  }, [startDownloads, isSuccess]);
};
