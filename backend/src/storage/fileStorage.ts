import * as fs from 'fs';
import * as path from 'path';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10); // 50MB default
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(process.cwd(), 'files');

/**
 * Interface for file metadata
 */
export interface FileMetadata {
  filename: string;
  size: number;
  mimeType?: string;
  lastModified: number;
}

/**
 * Interface for file response
 */
export interface FileResponse {
  filename: string;
  size: number;
  contentLength: number;
  buffer: Buffer;
  base64: string;
}

/**
 * Validate content length against size limits
 * @param contentLength Size in bytes
 * @returns { valid: boolean, error?: string }
 */
export const validateContentLength = (
  contentLength: number
): { valid: boolean; error?: string } => {
  if (!Number.isInteger(contentLength) || contentLength <= 0) {
    return { valid: false, error: 'Invalid content length' };
  }

  if (contentLength > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(contentLength / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit (${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  return { valid: true };
};

/**
 * Get file metadata (without reading full file)
 * @param filename Name of the file to check
 * @returns FileMetadata or null if file doesn't exist
 */
export const getFileMetadata = (filename: string): FileMetadata | null => {
  try {
    // Prevent directory traversal attacks
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('Invalid filename');
    }

    const filePath = path.join(STORAGE_PATH, filename);

    // Ensure the resolved path is within STORAGE_PATH
    if (!filePath.startsWith(STORAGE_PATH)) {
      throw new Error('Invalid filename');
    }

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);

    if (!stats.isFile()) {
      throw new Error('Path is not a file');
    }

    return {
      filename: path.basename(filename),
      size: stats.size,
      lastModified: stats.mtimeMs,
    };
  } catch (error) {
    console.error(`Error getting file metadata for ${filename}:`, error);
    return null;
  }
};

/**
 * Read file from storage and return as buffer + Base64
 * @param filename Name of the file to read
 * @returns FileResponse with buffer and Base64 encoded content
 * @throws Error if file not found or exceeds size limits
 */
export const readFileFromStorage = async (filename: string): Promise<FileResponse> => {
  try {
    // Validate filename (prevent directory traversal)
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('Invalid filename');
    }

    const filePath = path.join(STORAGE_PATH, filename);

    // Ensure the resolved path is within STORAGE_PATH
    if (!filePath.startsWith(STORAGE_PATH)) {
      throw new Error('Invalid filename');
    }

    // Check file exists
    if (!fs.existsSync(filePath)) {
      const error = new Error('File not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    if (!stats.isFile()) {
      const error = new Error('Path is not a file');
      (error as any).statusCode = 400;
      throw error;
    }

    // Validate size
    const validation = validateContentLength(stats.size);
    if (!validation.valid) {
      const error = new Error(validation.error);
      (error as any).statusCode = 413; // Payload Too Large
      throw error;
    }

    // Read file
    const buffer = fs.readFileSync(filePath);

    // Convert to Base64
    const base64 = buffer.toString('base64');

    return {
      filename: path.basename(filename),
      size: stats.size,
      contentLength: stats.size,
      buffer,
      base64,
    };
  } catch (error: any) {
    console.error(`Error reading file ${filename}:`, error.message);
    throw error;
  }
};

/**
 * List available files in storage (for testing/debugging)
 * @returns Array of filenames
 */
export const listStorageFiles = (): string[] => {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      return [];
    }

    const files = fs.readdirSync(STORAGE_PATH).filter((file) => {
      const filePath = path.join(STORAGE_PATH, file);
      return fs.statSync(filePath).isFile();
    });

    return files;
  } catch (error) {
    console.error('Error listing storage files:', error);
    return [];
  }
};

/**
 * Create storage directory if it doesn't exist
 */
export const initializeStorage = (): void => {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      fs.mkdirSync(STORAGE_PATH, { recursive: true });
      console.log(`Created storage directory: ${STORAGE_PATH}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export { STORAGE_PATH, MAX_FILE_SIZE };
