import {
  type PropsWithChildren,
  createContext,
  use,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import RNFetchBlob from 'react-native-blob-util';
import { AttachmentInput } from '@/hooks/useMessageAttachments';
import { findCachedFilePath, getCacheFilePath, makeCacheDirectory } from '@/lib/files';
import { useAuthStore } from '@/stores/auth';
import { envConfig } from '@/configs/env-config';

const DOWNLOAD_DELAY_MS = 2000;

type DownloadMessageAttachmentsContextType = {
  isProcessing: boolean;
  addCommand: (command: DownloadCommand) => void;
  resumeProcessing: () => Promise<void>;
  resetQueue: () => void;
  pauseProcessing: () => Promise<void>;
  processQueue: () => Promise<void>;
  downloadFile: (command: DownloadCommand) => Promise<boolean>;
  startProcessing: () => Promise<void>;
  downloadFileFromMessage: (attachment: AttachmentInput) => Promise<boolean>;
};

export interface DownloadCommand {
  filename: string;
  id: string;
}

export const DownloadMessageAttachmentsContext =
  createContext<DownloadMessageAttachmentsContextType>({
    isProcessing: false,
    addCommand: () => {},
    resumeProcessing: () => Promise.resolve(),
    resetQueue: () => {},
    pauseProcessing: () => Promise.resolve(),
    processQueue: () => Promise.resolve(),
    downloadFile: () => Promise.resolve(true),
    startProcessing: () => Promise.resolve(),
    downloadFileFromMessage: () => Promise.resolve(true),
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

const useManageProcessingQueue = () => {
  let queueRef = useRef<DownloadCommand[]>([]);
  let { current: shouldStopProxy } = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => {
          return Reflect.get(target, prop);
        },
        set: (target, prop, value) => {
          return Reflect.set(target, prop, value);
        },
      }
    )
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const addCommand = (command: DownloadCommand) => {
    queueRef.current.unshift(command);
  };

  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true;
    setIsProcessing(false);

    await Promise.resolve();
  };

  const resetQueue = () => {
    queueRef.current = [];
    shouldStopProxy.shouldStop = false;
  };

  return {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
    setIsProcessing,
  };
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

  const downloadFile = async ({ filename, id }: {filename: string; id: string}) => {
    const accessToken = authStore.tokens?.accessToken;
    if (!accessToken) {
      console.warn('[File Download] No access token available, cannot download file');
      return false;
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
        return false;
      }

      // File is already written to disk by RNFetchBlob
      return true;
    } catch (error) {
      console.error('[DownloadContext] Error downloading file', filename, error);
      return false;
    }
  };

  const processQueue = async () => {
    setIsProcessing(true);

    while (queueRef.current.length) {
      console.log('[File Processing] Processing queue remaining', queueRef.current.length);
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

    console.log('[File Processing] Processing queue finished');

    setIsProcessing(false);
  };

  const resumeProcessing = async () => {
    setIsProcessing(true);
    console.log('[File Processing] New processing queue started');
    await processQueue();
  };

  const downloadFileFromMessage = async (attachment: AttachmentInput) => {
    await pauseProcessing();
    console.log('[File Processing] Processing paused');

    const result = await downloadFile({
      filename: attachment.name,
      id: attachment.id,
    });
    console.log('[File Processing] Download File from attachment finished');

    console.log('[File Processing] Processing resumed');
    resumeProcessing();

    console.log("downloadFileFromMessage returning", getCacheFilePath(attachment.id, attachment.name));
    
    return findCachedFilePath(attachment.id, attachment.name);
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
