/**
 * File Utilities Module
 * Handles file operations for attachment downloads
 *
 * Responsibilities:
 * - File path management (cache directory, filenames)
 * - Directory creation and validation
 * - File existence checks
 * - Storage space verification
 * - Mobile-first error handling
 *
 * Uses new expo-file-system API (v17+):
 * - Directory class for directory operations
 * - File class for file operations
 * - Paths utilities for storage and directory access
 */

import { Directory, File } from 'expo-file-system';
import { ATTACHMENTS_CACHE_DIR, MAX_FILE_SIZE } from '@/constants/File';

export const getCachedFilenames = (): Set<string> => {
  try {
    const cacheDir = new Directory(ATTACHMENTS_CACHE_DIR);
    const items = cacheDir.list();
    const names = new Set<string>();

    for (const item of items) {
      if (!(item instanceof File)) continue;
      names.add(item.name);
    }

    return names;
  } catch {
    return new Set();
  }
};

/**
 * Ensure attachments cache directory exists
 * Creates directory if it doesn't exist using new Directory API
 * Called before any download operations
 *
 * @returns true if directory exists or was created successfully
 * @throws Error if directory creation fails
 */
export const makeCacheDirectory = async (): Promise<boolean> => {
  try {
    const cacheDir = new Directory(ATTACHMENTS_CACHE_DIR);

    // Check if directory exists by trying to list it
    try {
      cacheDir.list();
      // Directory exists
      return true;
    } catch {
      // Directory doesn't exist, create it
      // Extract parent path and directory name
      const cleanPath = ATTACHMENTS_CACHE_DIR.replace(/\/$/, '');
      const lastSlash = cleanPath.lastIndexOf('/');
      const dirName = cleanPath.substring(lastSlash + 1);
      const parentPath = cleanPath.substring(0, lastSlash) || '/';
      const parentDir = new Directory(parentPath);
      parentDir.createDirectory(dirName);
      console.log('[FileUtils] Created cache directory:', ATTACHMENTS_CACHE_DIR);
      return true;
    }
  } catch (error) {
    console.error('[FileUtils] Failed to create cache directory:', error);
    throw error;
  }
};

/**
 * Get full file path for cached attachment
 * Combines cache directory with filename
 *
 * @param filename - Original filename
 * @returns Full path to cached file
 */
export const getCacheFilePath = (filename: string): string => {
  return `${ATTACHMENTS_CACHE_DIR}${filename}`;
};

/**
 * Check if a file already exists in cache
 * Used for deduplication and skip logic
 * Uses new File API for checking existence
 *
 * @param filename - Original filename
 * @returns true if file exists and is readable
 */
export const fileExistsInCache = (
  filename: string
): boolean => {
  const filePath = getCacheFilePath(filename);
  const file = new File(filePath);
  return file.exists;
};
/**
 * Get human-readable file size
 * Useful for UI display and logging
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Delete a cached file
 * Used for cleanup and corruption recovery
 * Uses new File API
 *
 * @param filename - Original filename
 * @returns true if file was deleted or didn't exist
 */
export const deleteCachedFile = async (
  filename: string
): Promise<boolean> => {
  try {
    const filePath = getCacheFilePath(filename);
    const file = new File(filePath);

    // Check if file exists before deleting
    if (file.exists) {
      file.delete();
      console.log('[FileUtils] Deleted file from cache:', filename);
      return true;
    }
    return true;
  } catch (error) {
    console.error('[FileUtils] Error deleting file:', error);
    return false;
  }
};

/**
 * Get file size for validation
 * Reads file info to get size in bytes
 * Uses new File API
 *
 * @returns File size in bytes, or 0 if file doesn't exist
 * @param path
 */
export const getCachedFileSize = (
  path :string
): number => {
  try {
    const file = new File(path);

    if (file.exists && file.size) {
      console.log("[Cached File Info] File Size, Bytes: ", file.size, "File Name: ", file.name, "");
      
      return file.size;
    }
    return 0;
  } catch (error) {
    console.warn('[File Utils] Error getting file size:', error);
    return 0;
  }
};

export const clearAttachmentsCache = async (): Promise<boolean> => {
  try {
    const cacheDir = new Directory(ATTACHMENTS_CACHE_DIR);

    try {
      // List and delete all files in directory
      const items = cacheDir.list();
      for (const item of items) {
        if (item instanceof File) {
          item.delete();
        }
      }
      console.log('[File Utils] Cleared attachments cache');
      return true;
    } catch (error: unknown) {
      // Directory might not exist, try to create fresh
      console.warn('[File Utils] Cache directory missing, recreating:', error);
      await makeCacheDirectory();
      return true;
    }
  } catch (error) {
    console.error('[File Utils] Error clearing cache:', error);
    return false;
  }
};
