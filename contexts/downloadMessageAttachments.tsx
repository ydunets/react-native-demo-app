import {
  useRef,
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';
import {
  downloadQueueState,
  downloadQueueActions,
} from '@/stores/downloadQueue/valtioState';

import RNFetchBlob, { type FetchBlobResponse, type StatefulPromise } from 'react-native-blob-util';
import { getCacheFilePath, makeCacheDirectory, deleteCachedFile, fileExistsInCache } from '@/lib/files';
import { useAuthStore } from '@/stores/auth';
import { envConfig } from '@/configs/env-config';
import { DownloadCommand } from '@/stores/downloadQueue';
import { useDownloadProgressStore } from '@/stores/downloadProgress';
import { Attachment } from '@/hooks/useMessageAttachments';

const DOWNLOAD_DELAY_MS = 2000;

export type DownloadMessageAttachmentsContextType = {
  addCommand: (command: DownloadCommand) => void;
  resumeProcessing: () => void;
  resetQueue: () => void;
  pauseProcessing: () => void;
  processQueue: () => Promise<void>;
  downloadFile: (command: DownloadCommand) => Promise<string | undefined>;
  runProcessing: () => Promise<void>;
  downloadFileFromMessage: (attachment: Attachment) => Promise<string | undefined>;
  cancelCurrentDownload: () => void;
};

export const DownloadMessageAttachmentsContext =
  createContext<DownloadMessageAttachmentsContextType>({
    addCommand: () => {},
    resumeProcessing: () => {},
    resetQueue: () => {},
    pauseProcessing: () => {},
    processQueue: () => Promise.resolve(),
    downloadFile: () => Promise.resolve(undefined),
    runProcessing: () => Promise.resolve(),
    downloadFileFromMessage: () => Promise.resolve(undefined),
    cancelCurrentDownload: () => Promise.resolve(),
  });

export const useDownloadMessageAttachmentsContext = () => {
  const context = useContext(DownloadMessageAttachmentsContext);
  if (!context) {
    throw new Error(
      'useDownloadMessageAttachmentsContext must be used within a DownloadMessageAttachmentsProvider'
    );
  }
  return context;
};


export const DownloadMessageAttachmentsProvider = ({ children }: PropsWithChildren) => {
  const progressActions = useDownloadProgressStore((state) => state.actions);
  const currentTaskRef = useRef<StatefulPromise<FetchBlobResponse>>(null);

  // Destructure actions for cleaner usage
  const {
    addCommand,
    removeCommand,
    startProcessing,
    pauseProcessing,
    pauseDueToAuth,
    pauseDueToMessageDownload,
    resumeProcessing,
    completeCurrentCommand,
    completeProcessing,
    resetQueue,
  } = downloadQueueActions;
  const downloadFile = async ({ filename }: Omit<DownloadCommand,"id">) => {
    // Get current auth state (same pattern as axios interceptor)
    const { tokens } = useAuthStore.getState();
    const accessToken = tokens?.accessToken;

    if (!accessToken) {
      console.warn(
        '\x1b[33m',
        '[File Download] No access token available, cannot download file',
        '\x1b[0m'
      );
      pauseDueToAuth();
      return undefined;
    }

    const expoPath = getCacheFilePath(filename);

    try {
      await makeCacheDirectory();

      // Get expo-file-system path and convert to native path for RNFetchBlob
      const nativePath = expoPath.replace(/^file:\/\//, '');

      console.log('\x1b[36m', `[Download] Starting download: ${filename}`, '\x1b[0m');

      const delayParam = DOWNLOAD_DELAY_MS > 0 ? `?delay=${DOWNLOAD_DELAY_MS}` : '';
      let fileSize = 0;

      const downloadFileTask = RNFetchBlob.config({
        path: nativePath,
      })
        .fetch(
          'POST',
          `${envConfig.fileServerBaseURL}/api/files/download-binary${delayParam}`,
          {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/octet-stream',
          },
          JSON.stringify({ filename })
        )
        .progress({ count: 0 }, (received, total) => {
          const percent = total > 0 ? ((received / total) * 100).toFixed(1) : 0;
          fileSize = total;
          if (received !== total)
            console.log(
              '\x1b[34m',
              `[Download Progress] ${filename} - ${percent}% (${received} / ${total} bytes)`,
              '\x1b[0m'
            );
        });

      // Store task reference for potential cancellation
      currentTaskRef.current = downloadFileTask;

      await downloadFileTask;
      console.log(
        '\x1b[32m',
        `[Download] Completed: ${filename} - 100% (${fileSize} / ${fileSize} bytes)`,
        '\x1b[0m'
      );
      currentTaskRef.current = null;
      return expoPath;
    } catch (error) {
      currentTaskRef.current = null;
      
      // Check if this was a cancellation (not a real error)
      const isCancelled = error instanceof Error && 
        (error.message.includes('canceled') || error.name === 'ReactNativeBlobUtilCanceledFetch');
      
      if (isCancelled) {
        console.log('\x1b[33m', `[Download] Cancelled: ${filename}`, '\x1b[0m');
        return undefined;
      }
      
      console.warn(
        '\x1b[31m',
        `[DownloadContext] Error downloading file ${filename}`,
        '\x1b[0m',
        error
      );
      await deleteCachedFile(filename);
      currentTaskRef.current = null;
      return undefined;
    }
  };

  const processQueue = async () => {
    // Check authentication before starting
    const { tokens } = useAuthStore.getState();
    if (!tokens?.accessToken) {
      console.log('\x1b[33m', '[File Processing] Not authenticated, cannot start processing', '\x1b[0m');
      return;
    }

    startProcessing();
    const totalFiles = downloadQueueState.queueCount;

    while (downloadQueueState.hasQueuedItems) {
      // Check if we should pause before starting next download
      if (downloadQueueState.isPaused) {
        console.log('\x1b[35m', '[File Processing] Queue paused, stopping loop', '\x1b[0m');
        break;
      }

      const currentCommand = downloadQueueState.currentCommand;
      if (!currentCommand) break;
      
      const currentFileNumber = totalFiles - downloadQueueState.queueCount + 1;
      
      progressActions.setProgress(currentFileNumber, totalFiles, currentCommand.filename);
      
      console.log('\x1b[33m', `[File Processing] Processing queue remaining ${downloadQueueState.queueCount} - ${currentCommand.filename}`, '\x1b[0m');
      const result = await downloadFile(currentCommand);

      if (!result) {
        break;
      }

      // Mark completed and remove from queue (immutable)
      completeCurrentCommand();

      // Check pause state after each file completes
      if (downloadQueueState.isPaused) {
        console.log('\x1b[35m', '[File Processing] Paused after file completion', '\x1b[0m');
        break;
      }
    }

    completeProcessing();
    progressActions.resetProgress();
  };

  const downloadFileFromMessage = async (attachment: Attachment) => {
    const { name: filename } = attachment;

    // Check if file already exists in cache
    const existsInCache = fileExistsInCache(filename);
    if (existsInCache) {
      console.log('\x1b[32m', `[File Processing] File already cached, skipping download: ${filename}`, '\x1b[0m');
      return getCacheFilePath(filename);
    }

    // Pause queue processing and cancel current download for priority
    pauseDueToMessageDownload();
    await currentTaskRef.current?.cancel(() => {
      console.log('\x1b[31m', '[File Processing] Current download cancelled for priority file', '\x1b[0m');
    });

    const filePath = await downloadFile({
      filename,
    });

    // Remove this file from queue if it was queued
    removeCommand(attachment.id);

    console.log('\x1b[36m', '[File Processing] Download File from attachment finished', '\x1b[0m');

    // Resume queue processing (will restart from where it left off)
    // Only resume if authenticated and has items
    const { tokens } = useAuthStore.getState();
    if (downloadQueueState.hasQueuedItems && tokens?.accessToken) {
      resumeProcessing();
      // Re-trigger queue processing
      processQueue();
    }
    
    return filePath;
  };

  const runProcessing = async () => {
    // Synchronous check using Valtio proxy to prevent race condition
    if (downloadQueueState.isProcessing) {
      console.log('\x1b[33m', '[File Processing] Already processing (blocked by state), skipping start', '\x1b[0m');
      return;
    }

    if (!downloadQueueState.hasQueuedItems) {
      console.log('\x1b[90m', '[File Processing] No items in queue, processing not started', '\x1b[0m');
      return;
    }

    await processQueue();
  };

  const cancelCurrentDownload = async () => {
    await currentTaskRef.current?.cancel(() => {
      console.log('\x1b[31m', '[File Processing] Download cancelled', '\x1b[0m');
    })
  }

  const value = useMemo(
    () => ({
      addCommand,
      resumeProcessing,
      resetQueue,
      pauseProcessing,
      processQueue,
      downloadFile,
      runProcessing,
      downloadFileFromMessage,
      cancelCurrentDownload
    }),
    // Actions are stable, no deps needed
    []
  );

  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};