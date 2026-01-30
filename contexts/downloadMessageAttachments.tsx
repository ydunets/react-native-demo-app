import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';
import useManageProcessingQueue from '@/hooks/useManageProcessingQueue';  

import RNFetchBlob from 'react-native-blob-util';
import { AttachmentInput } from '@/hooks/useMessageAttachments';
import { getCacheFilePath, makeCacheDirectory } from '@/lib/files';
import { useAuthStore } from '@/stores/auth';
import { envConfig } from '@/configs/env-config';
import { DownloadCommand } from '@/stores/downloadQueue';
import { useDownloadProgressStore } from '@/stores/downloadProgress';

const DOWNLOAD_DELAY_MS = 2000;


export type DownloadMessageAttachmentsContextType = {
  isProcessing: boolean;
  addCommand: (command: DownloadCommand) => void;
  resumeProcessing: () => Promise<void>;
  resetQueue: () => void;
  pauseProcessing: () => Promise<void>;
  processQueue: () => Promise<void>;
  downloadFile: (command: DownloadCommand) => Promise<string | undefined>;
  startProcessing: () => Promise<void>;
  downloadFileFromMessage: (attachment: AttachmentInput) => Promise<string | undefined>;
};

export const DownloadMessageAttachmentsContext =
  createContext<DownloadMessageAttachmentsContextType>({
    isProcessing: false,
    addCommand: () => {},
    resumeProcessing: () => Promise.resolve(),
    resetQueue: () => {},
    pauseProcessing: () => Promise.resolve(),
    processQueue: () => Promise.resolve(),
    downloadFile: () => Promise.resolve(undefined),
    startProcessing: () => Promise.resolve(),
    downloadFileFromMessage: () => Promise.resolve(undefined),
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
    setIsProcessing,
  } = useManageProcessingQueue();
  const authStore = useAuthStore();
  const progressActions = useDownloadProgressStore((state) => state.actions);

  const downloadFile = async ({ filename, id }: DownloadCommand) => {
    const accessToken = authStore.tokens?.accessToken;
    if (!accessToken) {
      console.warn('\x1b[33m', '[File Download] No access token available, cannot download file', '\x1b[0m');
      return undefined;
    }

    try {
      await makeCacheDirectory();

      // Get expo-file-system path and convert to native path for RNFetchBlob
      const expoPath = getCacheFilePath(id, filename);
      const nativePath = expoPath.replace(/^file:\/\//, '');

      console.log('\x1b[36m', `[Download] Starting download: ${filename}`, '\x1b[0m');
      
      const delayParam = DOWNLOAD_DELAY_MS > 0 ? `?delay=${DOWNLOAD_DELAY_MS}` : '';
      let fileSize = 0;
      const response = await RNFetchBlob.config({
        path: nativePath,
      })
        .fetch(
          'POST',
          `${envConfig.fileServerBaseURL}/api/files/download-binary${delayParam}`,
          {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/octet-stream'
          },
          JSON.stringify({ filename })
        )
        .progress({ count: 0 }, (received, total) => {
          const percent = total > 0 ? ((received / total) * 100).toFixed(1) : 0;
          fileSize = total;
          if(received != total)
          console.log(
            '\x1b[34m', `[Download Progress] ${filename} - ${percent}% (${received} / ${total} bytes)`, '\x1b[0m'
          );
        });

      const status = response.info().status;
      console.log('\x1b[32m', `[Download] Completed: ${filename} - 100% (${fileSize} / ${fileSize} bytes)`, '\x1b[0m');
      
      if (status < 200 || status >= 300) {
        console.warn('\x1b[31m', `[DownloadContext] Download failed ${filename} - Status: ${status}`, '\x1b[0m');
        return undefined;
      }

      // File is already written to disk by RNFetchBlob - return the file path
      console.log('\x1b[32m', `[Download] Success: ${filename} saved to cache`, '\x1b[0m');
      return expoPath;
    } catch (error) {
      console.error('\x1b[31m', `[DownloadContext] Error downloading file ${filename}`, '\x1b[0m', error);
      return undefined;
    }
  };

  const processQueue = async () => {
    setIsProcessing(true);
    const totalFiles = queueRef.current.length;
    let currentFileNumber = 0;

    while (queueRef.current.length) {
      currentFileNumber++;
      progressActions.setProgress(currentFileNumber, totalFiles);
      
      console.log('\x1b[33m', `[File Processing] Processing queue remaining ${queueRef.current.length} - ${queueRef.current[0].filename}`, '\x1b[0m');
      const result = await downloadFile(queueRef.current[0]);

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

    setIsProcessing(false);
    progressActions.resetProgress();
  };

  const resumeProcessing = async () => {
    setIsProcessing(true);
    console.log('\x1b[32m', '[File Processing] New processing queue started', '\x1b[0m');
    await processQueue();
  };

  const downloadFileFromMessage = async (attachment: AttachmentInput) => {
    await pauseProcessing();

    const filePath = await downloadFile({
      filename: attachment.name,
      id: attachment.id,
    });
    console.log('\x1b[36m', '[File Processing] Download File from attachment finished', '\x1b[0m');
    resumeProcessing();
    
    return filePath;
  };

  const startProcessing = async () => {
    if (!queueRef.current.length) {
      console.log('\x1b[90m', '[File Processing] No items in queue, processing not started', '\x1b[0m');
      return;
    }

    await processQueue();
  };

  const value = useMemo(
    () => ({
      isProcessing,
      addCommand,
      resumeProcessing,
      resetQueue,
      pauseProcessing,
      processQueue,
      downloadFile,
      startProcessing,
      downloadFileFromMessage,
    }),
    [isProcessing]
  );

  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
