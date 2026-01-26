/**
 * File constants for attachment download system
 * Defines paths, size limits, and supported file types
 */

import { Paths } from 'expo-file-system';

/**
 * Base directory for all attachments (inside cache directory)
 */
export const ATTACHMENTS_DIR = `${Paths.cache}attachments/`;

/**
 * Cache directory specifically for downloaded attachments
 */
export const ATTACHMENTS_CACHE_DIR = ATTACHMENTS_DIR;

/**
 * Maximum file size allowed for downloads (50MB in bytes)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Supported file types for attachments
 * Used for validation and UI display
 */
export const FILE_TYPES = {
  // Documents
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  TXT: 'text/plain',

  // Images
  JPEG: 'image/jpeg',
  JPG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',

  // Videos
  MP4: 'video/mp4',
  MOV: 'video/quicktime',
  AVI: 'video/x-msvideo',
  WEBM: 'video/webm',

  // Audio
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',

  // Archives
  ZIP: 'application/zip',
  RAR: 'application/x-rar-compressed',
  '7Z': 'application/x-7z-compressed',
  TAR: 'application/x-tar',
  GZ: 'application/gzip',
} as const;

/**
 * File extension to MIME type mapping
 */
export const EXTENSION_TO_MIME: Record<string, string> = {
  // Documents
  pdf: FILE_TYPES.PDF,
  doc: FILE_TYPES.DOC,
  docx: FILE_TYPES.DOCX,
  xls: FILE_TYPES.XLS,
  xlsx: FILE_TYPES.XLSX,
  ppt: FILE_TYPES.PPT,
  pptx: FILE_TYPES.PPTX,
  txt: FILE_TYPES.TXT,

  // Images
  jpeg: FILE_TYPES.JPEG,
  jpg: FILE_TYPES.JPG,
  png: FILE_TYPES.PNG,
  gif: FILE_TYPES.GIF,
  webp: FILE_TYPES.WEBP,
  svg: FILE_TYPES.SVG,

  // Videos
  mp4: FILE_TYPES.MP4,
  mov: FILE_TYPES.MOV,
  avi: FILE_TYPES.AVI,
  webm: FILE_TYPES.WEBM,

  // Audio
  mp3: FILE_TYPES.MP3,
  wav: FILE_TYPES.WAV,
  ogg: FILE_TYPES.OGG,

  // Archives
  zip: FILE_TYPES.ZIP,
  rar: FILE_TYPES.RAR,
  '7z': FILE_TYPES['7Z'],
  tar: FILE_TYPES.TAR,
  gz: FILE_TYPES.GZ,
};

/**
 * Get MIME type from file extension
 */
export const getMimeTypeFromExtension = (extension: string): string | undefined => {
  return EXTENSION_TO_MIME[extension.toLowerCase()];
};

/**
 * Check if file size is within allowed limit
 */
export const isFileSizeValid = (sizeInBytes: number): boolean => {
  return sizeInBytes <= MAX_FILE_SIZE;
};
