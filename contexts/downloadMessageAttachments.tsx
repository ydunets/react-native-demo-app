import {
  useRef,
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';
import useManageProcessingQueue from '@/hooks/useManageProcessingQueue';  

import RNFetchBlob, { type FetchBlobResponse, type StatefulPromise } from 'react-native-blob-util';
import { getCacheFilePath, makeCacheDirectory, deleteCachedFile, fileExistsInCache } from '@/lib/files';
import { useAuthStore } from '@/stores/auth';
import { envConfig } from '@/configs/env-config';
import { DownloadCommand } from '@/stores/downloadQueue';
import { useDownloadProgressStore } from '@/stores/downloadProgress';
import { Attachment } from '@/types';

const DOWNLOAD_DELAY_MS = 2000;

export type DownloadMessageAttachmentsContextType = {
  addCommand: (command: DownloadCommand) => void;
  resumeProcessing: () => Promise<void>;
  resetQueue: () => void;
  pauseProcessing: () => Promise<void>;
  processQueue: () => Promise<void>;
  downloadFile: (command: DownloadCommand) => Promise<string | undefined>;
  startProcessing: () => Promise<void>;
  downloadFileFromMessage: (attachment: Attachment) => Promise<string | undefined>;
  cancelCurrentDownload: () => void;
};

export const DownloadMessageAttachmentsContext =
  createContext<DownloadMessageAttachmentsContextType>({
    addCommand: () => {},
    resumeProcessing: () => Promise.resolve(),
    resetQueue: () => {},
    pauseProcessing: () => Promise.resolve(),
    processQueue: () => Promise.resolve(),
    downloadFile: () => Promise.resolve(undefined),
    startProcessing: () => Promise.resolve(),
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
  const {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
  } = useManageProcessingQueue();
  const progressActions = useDownloadProgressStore((state) => state.actions);
  const currentTaskRef = useRef<StatefulPromise<FetchBlobResponse>>(null);

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
      console.log(
        'Downloaded file to: ',
        expoPath,
        ' - native path: ',
        nativePath,
        ' - cache path:'
      );
      return expoPath;
    } catch (error) {
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
    isProcessing.current = true;
    const totalFiles = queueRef.current.length;

    while (queueRef.current.length) {
      const currentCommand = queueRef.current[0];
      const currentFileNumber = totalFiles - queueRef.current.length + 1;
      
      progressActions.setProgress(currentFileNumber, totalFiles, currentCommand.filename);
      
      console.log('\x1b[33m', `[File Processing] Processing queue remaining ${queueRef.current.length} - ${currentCommand.filename}`, '\x1b[0m');
      const result = await downloadFile(currentCommand);

      if (!result) {
        break;
      }

      queueRef.current.shift();

      if (shouldStopProxy.shouldStop) {
        console.log('\x1b[35m', '[File Processing] Stop processing', '\x1b[0m');
        shouldStopProxy.shouldStop = false;
        break;
      }
    }

    isProcessing.current = false;
    progressActions.resetProgress();
  };

  const resumeProcessing = async () => {
    isProcessing.current = true;
    console.log('\x1b[32m', '[File Processing] New processing queue started', '\x1b[0m');
    await processQueue();
  };

  const downloadFileFromMessage = async (attachment: Attachment) => {
    const { name: filename } = attachment;

    // Check if file already exists in cache
    const existsInCache = fileExistsInCache(filename);
    if (existsInCache) {
      console.log('\x1b[32m', `[File Processing] File already cached, skipping download: ${filename}`, '\x1b[0m');
      return getCacheFilePath(filename);
    }

    await pauseProcessing();

    const filePath = await downloadFile({
      filename,
    });

    queueRef.current = queueRef.current.filter(command => command.filename !== filename);

    console.log('\x1b[36m', '[File Processing] Download File from attachment finished', '\x1b[0m');

    await resumeProcessing();
    
    return filePath;
  };

  const startProcessing = async () => {
    // Synchronous check using ref to prevent race condition
    if (isProcessing.current) {
      console.log('\x1b[33m', '[File Processing] Already processing (blocked by ref), skipping start', '\x1b[0m');
      return;
    }

    if (!queueRef.current.length) {
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
      startProcessing,
      downloadFileFromMessage,
      cancelCurrentDownload
    }),
    [isProcessing.current]
  );

  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
