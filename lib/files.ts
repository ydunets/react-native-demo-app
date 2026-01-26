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

import { Directory, File, Paths } from 'expo-file-system';
import { ATTACHMENTS_CACHE_DIR, MAX_FILE_SIZE } from '@/constants/File';

/**
 * Get file extension from filename
 * @param filename - Full filename with extension
 * @returns File extension in lowercase (without dot)
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex + 1).toLowerCase();
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
 * Combines cache directory with attachment ID and filename
 *
 * @param attachmentId - Unique identifier for the attachment
 * @param filename - Original filename
 * @returns Full path to cached file
 */
export const getCacheFilePath = (attachmentId: string, filename: string): string => {
  // Use attachment ID as directory name for organization
  return `${ATTACHMENTS_CACHE_DIR}${attachmentId}-${filename}`;
};

/**
 * Check if a file already exists in cache
 * Used for deduplication and skip logic
 * Uses new File API for checking existence
 *
 * @param attachmentId - Unique identifier for the attachment
 * @param filename - Original filename
 * @returns true if file exists and is readable
 */
export const fileExistsInCache = async (
  attachmentId: string,
  filename: string
): Promise<boolean> => {
  try {
    const filePath = getCacheFilePath(attachmentId, filename);
    const file = new File(filePath);
    // File.exists is a synchronous property
    return file.exists;
  } catch (error) {
    console.warn('[FileUtils] Error checking file existence:', error);
    return false;
  }
};

/**
 * Check if device has enough storage space
 * Uses new Paths.availableDiskSpace API
 *
 * @param requiredSizeBytes - Size needed in bytes
 * @returns true if enough space is available
 */
export const hasEnoughStorageSpace = async (requiredSizeBytes: number): Promise<boolean> => {
  try {
    // Get available disk space using new API
    const availableSpace = Paths.availableDiskSpace;

    // Require at least the file size + 10% buffer for filesystem overhead
    const requiredWithBuffer = requiredSizeBytes * 1.1;

    return availableSpace > requiredWithBuffer;
  } catch (error) {
    console.warn('[FileUtils] Error checking storage space:', error);
    // On error, assume we have space (fail-safe approach)
    return true;
  }
};

/**
 * Validate file size is within limits
 * Checks both file system limit and app limit (50MB)
 *
 * @param sizeBytes - File size in bytes
 * @returns true if size is acceptable
 */
export const isFileSizeValid = (sizeBytes: number): boolean => {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE;
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
 * @param attachmentId - Unique identifier for the attachment
 * @param filename - Original filename
 * @returns true if file was deleted or didn't exist
 */
export const deleteCachedFile = async (
  attachmentId: string,
  filename: string
): Promise<boolean> => {
  try {
    const filePath = getCacheFilePath(attachmentId, filename);
    const file = new File(filePath);

    // Check if file exists before deleting
    if (file.exists) {
      await file.delete();
      console.log('[FileUtils] Deleted corrupted file:', filePath);
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
 * @param attachmentId - Unique identifier for the attachment
 * @param filename - Original filename
 * @returns File size in bytes, or 0 if file doesn't exist
 */
export const getCachedFileSize = async (
  attachmentId: string,
  filename: string
): Promise<number> => {
  try {
    const filePath = getCacheFilePath(attachmentId, filename);
    const file = new File(filePath);

    if (file.exists && file.size) {
      return file.size;
    }
    return 0;
  } catch (error) {
    console.warn('[FileUtils] Error getting file size:', error);
    return 0;
  }
};

/**
 * Clear entire attachments cache directory
 * Use with caution - removes all cached attachments
 * Uses new Directory API
 *
 * @returns true if cache was cleared successfully
 */
export const clearAttachmentsCache = async (): Promise<boolean> => {
  try {
    const cacheDir = new Directory(ATTACHMENTS_CACHE_DIR);

    try {
      // List and delete all files in directory
      const items = cacheDir.list();
      for (const item of items) {
        if (item instanceof File) {
          await item.delete();
        }
      }
      console.log('[FileUtils] Cleared attachments cache');
      return true;
    } catch (error: unknown) {
      // Directory might not exist, try to create fresh
      console.warn('[FileUtils] Cache directory missing, recreating:', error);
      await makeCacheDirectory();
      return true;
    }
  } catch (error) {
    console.error('[FileUtils] Error clearing cache:', error);
    return false;
  }
};
