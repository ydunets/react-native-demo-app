import { useEffect, useState, useCallback } from 'react';
import { Directory, File } from 'expo-file-system';
import { ATTACHMENTS_CACHE_DIR } from '@/constants/File';
import { clearAttachmentsCache, deleteCachedFile } from '@/lib/files';
import { useInFlightAttachmentId } from '@/stores/downloadQueue';
import type { DownloadMessageAttachmentsContextType } from '@/contexts/downloadMessageAttachments';

export interface CachedFile {
  name: string;
  size: number;
  attachmentId: string;
  path: string;
  isInFlight?: boolean;
}

interface UseCachedFilesResult {
  files: CachedFile[];
  totalSize: number;
  isLoading: boolean;
  isClearing: boolean;
  clearCache: () => Promise<void>;
  deleteFile: (attachmentId: string, filename: string) => Promise<void>;
}

/**
 * Parse a cached filename back into attachment ID and original name.
 * Files are stored as: {attachmentId}-{filename}
 */
const parseCachedFilename = (
  rawName: string
): { attachmentId: string; name: string } | null => {
  // Stored as: {uuid}-{filename}. UUIDs are 36 chars (8-4-4-4-12) so we can split safely.
  const UUID_LENGTH = 36;

  if (rawName.length > UUID_LENGTH && rawName[UUID_LENGTH] === '-') {
    return {
      attachmentId: rawName.substring(0, UUID_LENGTH),
      name: rawName.substring(UUID_LENGTH + 1),
    };
  }

  const dashIndex = rawName.indexOf('-');
  if (dashIndex === -1) return null;

  return {
    attachmentId: rawName.substring(0, dashIndex),
    name: rawName.substring(dashIndex + 1),
  };
};

/**
 * Hook that scans the attachments cache directory
 * and returns metadata for all cached files.
 */
export const useCachedFiles = (downloadContext?: DownloadMessageAttachmentsContextType): UseCachedFilesResult => {
  const [files, setFiles] = useState<CachedFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const inFlightId = useInFlightAttachmentId();

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
      const seen = new Set<string>();
      let size = 0;

      for (const item of items) {
        if (!(item instanceof File)) continue;

        const parsed = parseCachedFilename(item.name);
        if (!parsed) continue;

        const key = `${parsed.attachmentId}-${parsed.name}`;
        if (seen.has(key)) {
          continue; // Avoid listing duplicates with the same id/name
        }
        seen.add(key);

        const fileSize = item.size ?? 0;
        size += fileSize;

        result.push({
          name: parsed.name,
          size: fileSize,
          attachmentId: parsed.attachmentId,
          path: item.uri,
          isInFlight: parsed.attachmentId === inFlightId,
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
  }, [inFlightId]);

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

  const deleteFile = useCallback(async (attachmentId: string, filename: string) => {
    try {
      const success = await deleteCachedFile(attachmentId, filename);
      if (success) {
        // Update local state to remove the deleted file
        setFiles((prev) => {
          const updated = prev.filter((f) => f.attachmentId !== attachmentId);
          return updated;
        });
        setTotalSize((prev) => {
          const deletedFile = files.find((f) => f.attachmentId === attachmentId);
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
