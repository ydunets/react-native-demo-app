import { useCallback, useEffect, useState } from 'react';
import { Directory, File } from 'expo-file-system';
import { ATTACHMENTS_CACHE_DIR } from '@/constants/File';
import { clearAttachmentsCache, deleteCachedFile } from '@/lib/files';
import { useCurrentCommandId } from '@/stores/downloadQueue/valtioHooks';
import type { DownloadMessageAttachmentsContextType } from '@/contexts/downloadMessageAttachments';

export interface CachedFile {
  name: string;
  size: number;
  path: string;
  isInFlight?: boolean;
}

interface UseCachedFilesResult {
  files: CachedFile[];
  totalSize: number;
  isLoading: boolean;
  isClearing: boolean;
  clearCache: () => Promise<void>;
  deleteFile: (filename: string) => Promise<void>;
}

/**
 * Hook that scans the attachments cache directory
 * and returns metadata for all cached files.
 */
export const useCachedFiles = (downloadContext?: DownloadMessageAttachmentsContextType): UseCachedFilesResult => {
  const [files, setFiles] = useState<CachedFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const currentCommandId = useCurrentCommandId();

  const loadCachedFiles = useCallback(() => {
    try {
      const cacheDir = new Directory(ATTACHMENTS_CACHE_DIR);

      let items: (File | Directory)[];
      try {
        items = cacheDir.list();
      } catch {
        // Directory doesn't exist yet — no cached files
        setFiles([]);
        setTotalSize(0);
        setIsLoading(false);
        return;
      }

      const result: CachedFile[] = [];
      let size = 0;

      for (const item of items) {
        if (!(item instanceof File)) continue;

        const fileSize = item.size ?? 0;
        size += fileSize;

        result.push({
          name: item.name,
          size: fileSize,
          path: item.uri,
          isInFlight: item.name === currentCommandId,
        });
      }

      // Sort by name alphabetically
      result.sort((a, b) => a.name.localeCompare(b.name));

      setFiles(result);
      setTotalSize(size);
    } catch (error) {
      console.error('[useCachedFiles] Failed to load cached files:', error);
      setFiles([]);
      setTotalSize(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentCommandId]);

  const clearCache = useCallback(async () => {
    setIsClearing(true);
    try {
      // First, stop any ongoing downloads to prevent race conditions
      if (downloadContext) {
        await downloadContext.pauseProcessing();
        downloadContext.resetQueue();
        console.log('[useCachedFiles] Download queue paused and reset');
      }
      
      // Now safe to clear the cache
      await clearAttachmentsCache();
      setFiles([]);
      setTotalSize(0);
    } catch (error) {
      console.error('[useCachedFiles] Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  }, [downloadContext]);

  const deleteFile = useCallback(async (filename: string) => {
    try {
      const success = await deleteCachedFile(filename);
      if (success) {
        // Update local state to remove the deleted file
        setFiles((prev) => {
          return prev.filter((file) => file.name !== filename);
        });
        setTotalSize((prev) => {
          const deletedFile = files.find((file) => file.name === filename);
          return prev - (deletedFile?.size ?? 0);
        });
      }
    } catch (error) {
      console.error('[useCachedFiles] Failed to delete file:', error);
    }
  }, [files]);

  useEffect(() => {
    loadCachedFiles();
  }, [loadCachedFiles]);

  return { files, totalSize, isLoading, isClearing, clearCache, deleteFile };
};
