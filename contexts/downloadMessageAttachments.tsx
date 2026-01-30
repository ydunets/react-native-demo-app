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

  const downloadFile = async ({ filename, id }: DownloadCommand) => {
    const accessToken = authStore.tokens?.accessToken;
    if (!accessToken) {
      console.warn('[File Download] No access token available, cannot download file');
      return undefined;
    }

    try {
      await makeCacheDirectory();

      // Get expo-file-system path and convert to native path for RNFetchBlob
      const expoPath = getCacheFilePath(id, filename);
      const nativePath = expoPath.replace(/^file:\/\//, '');

      const delayParam = DOWNLOAD_DELAY_MS > 0 ? `?delay=${DOWNLOAD_DELAY_MS}` : '';
      const response = await RNFetchBlob.config({
        path: nativePath,
      }).fetch(
        'POST',
        `${envConfig.fileServerBaseURL}/api/files/download-binary${delayParam}`,
        {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        JSON.stringify({ filename })
      );

      const status = response.info().status;
      if (status < 200 || status >= 300) {
        console.warn('[DownloadContext] Download failed', filename, status);
        return undefined;
      }

      // File is already written to disk by RNFetchBlob - return the file path
      return expoPath;
    } catch (error) {
      console.error('[DownloadContext] Error downloading file', filename, error);
      return undefined;
    }
  };

  const processQueue = async () => {
    setIsProcessing(true);

    while (queueRef.current.length) {
      console.log('[File Processing] Processing queue remaining', queueRef.current.length, queueRef.current[0].filename);
      const result = await downloadFile(queueRef.current[0]);

      if (!result) {
        break;
      }

      queueRef.current.shift();

      if (shouldStopProxy.shouldStop) {
        console.log('[File Processing] Stop processing');
        shouldStopProxy.shouldStop = false;
        break;
      }
    }

    setIsProcessing(false);
  };

  const resumeProcessing = async () => {
    setIsProcessing(true);
    console.log('[File Processing] New processing queue started');
    await processQueue();
  };

  const downloadFileFromMessage = async (attachment: AttachmentInput) => {
    await pauseProcessing();

    const filePath = await downloadFile({
      filename: attachment.name,
      id: attachment.id,
    });
    console.log('[File Processing] Download File from attachment finished');
    resumeProcessing();
    
    return filePath;
  };

  const startProcessing = async () => {
    if (!queueRef.current.length) {
      console.log('[File Processing] No items in queue, processing not started');
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
