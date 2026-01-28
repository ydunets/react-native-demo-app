import { useEffect, useState, useCallback } from 'react';
import { Directory, File } from 'expo-file-system';
import { ATTACHMENTS_CACHE_DIR } from '@/constants/File';
import { clearAttachmentsCache } from '@/lib/files';

export interface CachedFile {
  name: string;
  size: number;
  attachmentId: string;
  path: string;
}

interface UseCachedFilesResult {
  files: CachedFile[];
  totalSize: number;
  isLoading: boolean;
  isClearing: boolean;
  clearCache: () => Promise<void>;
}

/**
 * Parse a cached filename back into attachment ID and original name.
 * Files are stored as: {attachmentId}-{filename}
 */
const parseCachedFilename = (
  rawName: string
): { attachmentId: string; name: string } | null => {
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
export const useCachedFiles = (): UseCachedFilesResult => {
  const [files, setFiles] = useState<CachedFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

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

        const parsed = parseCachedFilename(item.name);
        if (!parsed) continue;

        const fileSize = item.size ?? 0;
        size += fileSize;

        result.push({
          name: parsed.name,
          size: fileSize,
          attachmentId: parsed.attachmentId,
          path: item.uri,
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
  }, []);

  const clearCache = useCallback(async () => {
    setIsClearing(true);
    try {
      await clearAttachmentsCache();
      setFiles([]);
      setTotalSize(0);
    } catch (error) {
      console.error('[useCachedFiles] Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  }, []);

  useEffect(() => {
    loadCachedFiles();
  }, [loadCachedFiles]);

  return { files, totalSize, isLoading, isClearing, clearCache };
};
