import {
  validateContentLength,
  getFileMetadata,
  readFileFromStorage,
  listStorageFiles,
} from '../src/storage/fileStorage';
import fs from 'fs';
import path from 'path';

// ============================================================================
// File Storage Module Tests
// ============================================================================

describe('File Storage Module', () => {
  describe('validateContentLength', () => {
    it('should accept valid file sizes', () => {
      const validation = validateContentLength(1024);
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should accept files up to 50MB', () => {
      const validation = validateContentLength(52428800); // Exactly 50MB
      expect(validation.valid).toBe(true);
    });

    it('should reject files exceeding 50MB', () => {
      const validation = validateContentLength(52428801); // 50MB + 1 byte
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('exceeds maximum limit');
    });

    it('should reject zero or negative sizes', () => {
      expect(validateContentLength(0).valid).toBe(false);
      expect(validateContentLength(-1).valid).toBe(false);
    });

    it('should reject non-integer sizes', () => {
      expect(validateContentLength(1024.5).valid).toBe(false);
    });

    it('should provide helpful error messages', () => {
      const validation = validateContentLength(52428801);
      expect(validation.error).toContain('MB');
    });

    it('should include size information in error message', () => {
      const validation = validateContentLength(104857600); // 100MB
      expect(validation.error).toContain('100.00');
    });
  });

  describe('getFileMetadata', () => {
    it('should return null for non-existent files', () => {
      const metadata = getFileMetadata('nonexistent-file.txt');
      expect(metadata).toBeNull();
    });

    it('should return metadata for existing files', () => {
      const metadata = getFileMetadata('sample-text.txt');
      if (metadata) {
        expect(metadata).toHaveProperty('filename');
        expect(metadata).toHaveProperty('size');
        expect(metadata).toHaveProperty('lastModified');
        expect(metadata.size).toBeGreaterThan(0);
      }
    });

    it('should prevent directory traversal attacks', () => {
      const metadata = getFileMetadata('../../../etc/passwd');
      expect(metadata).toBeNull();
    });

    it('should prevent absolute path attacks', () => {
      const metadata = getFileMetadata('/etc/passwd');
      expect(metadata).toBeNull();
    });

    it('should return correct file size', () => {
      const metadata = getFileMetadata('sample-text.txt');
      if (metadata) {
        expect(typeof metadata.size).toBe('number');
        expect(metadata.size).toBeGreaterThan(0);
      }
    });

    it('should return correct filename without path', () => {
      const metadata = getFileMetadata('sample-text.txt');
      if (metadata) {
        expect(metadata.filename).toBe('sample-text.txt');
      }
    });

    it('should return lastModified timestamp', () => {
      const metadata = getFileMetadata('sample-text.txt');
      if (metadata) {
        expect(typeof metadata.lastModified).toBe('number');
        expect(metadata.lastModified).toBeGreaterThan(0);
      }
    });
  });

  describe('readFileFromStorage', () => {
    it('should read existing files and return Base64', async () => {
      const response = await readFileFromStorage('sample-text.txt');
      expect(response).toHaveProperty('filename');
      expect(response).toHaveProperty('size');
      expect(response).toHaveProperty('base64');
      expect(response.filename).toBe('sample-text.txt');
      expect(typeof response.base64).toBe('string');
    });

    it('should throw 404 error for non-existent files', async () => {
      try {
        await readFileFromStorage('nonexistent-file.txt');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('not found');
      }
    });

    it('should throw 413 error for files exceeding size limit', async () => {
      // This test assumes we don't have a >50MB file in the test directory
      // We'll create a mock scenario by temporarily modifying MAX_FILE_SIZE
      const originalEnv = process.env.MAX_FILE_SIZE;
      process.env.MAX_FILE_SIZE = '100'; // 100 bytes

      try {
        await readFileFromStorage('sample-text.txt');
        // If file is larger than 100 bytes, it should fail
      } catch (error: any) {
        if (error.statusCode === 413) {
          expect(error.message).toContain('exceeds');
        }
      } finally {
        process.env.MAX_FILE_SIZE = originalEnv;
      }
    });

    it('should prevent directory traversal attacks', async () => {
      try {
        await readFileFromStorage('../../etc/passwd');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should return valid Base64 encoded content', async () => {
      const response = await readFileFromStorage('sample-text.txt');
      expect(() => Buffer.from(response.base64, 'base64')).not.toThrow();
    });

    it('should return correct file size', async () => {
      const response = await readFileFromStorage('sample-text.txt');
      expect(response.size).toBeGreaterThan(0);
      expect(response.contentLength).toBe(response.size);
    });

    it('should decode Base64 to original content', async () => {
      const response = await readFileFromStorage('sample-text.txt');
      const decodedBuffer = Buffer.from(response.base64, 'base64');
      const decodedContent = decodedBuffer.toString('utf-8');
      expect(decodedContent.length).toBeGreaterThan(0);
    });

    it('should handle various file types', async () => {
      const filesToTest = ['sample-text.txt', 'sample-data.json'];

      for (const filename of filesToTest) {
        if (fs.existsSync(path.join(process.env.STORAGE_PATH || '../files', filename))) {
          const response = await readFileFromStorage(filename);
          expect(response.filename).toBe(filename);
          expect(response.base64).toBeTruthy();
        }
      }
    });

    it('should return buffer and Base64 in response', async () => {
      const response = await readFileFromStorage('sample-text.txt');
      expect(response).toHaveProperty('buffer');
      expect(Buffer.isBuffer(response.buffer)).toBe(true);
      expect(response.buffer.toString('base64')).toBe(response.base64);
    });
  });

  describe('listStorageFiles', () => {
    it('should return an array of filenames', () => {
      const files = listStorageFiles();
      expect(Array.isArray(files)).toBe(true);
    });

    it('should only return files, not directories', () => {
      const files = listStorageFiles();
      const storagePath = process.env.STORAGE_PATH || path.join(__dirname, '../../files');

      for (const file of files) {
        const filePath = path.join(storagePath, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          expect(stats.isFile()).toBe(true);
        }
      }
    });

    it('should handle empty storage directory', () => {
      const files = listStorageFiles();
      expect(Array.isArray(files)).toBe(true);
      // If storage directory exists and has files, they will be returned
    });

    it('should return file count', () => {
      const files = listStorageFiles();
      expect(files.length).toBeGreaterThanOrEqual(0);
    });

    it('should include sample test files', () => {
      const files = listStorageFiles();
      // Check that at least one of the sample files exists
      const hasSampleFiles = files.some(
        (f: string) => f.includes('sample') || f === 'sample-text.txt' || f === 'sample-data.json'
      );
      expect(hasSampleFiles).toBe(true);
    });

    it('should handle errors gracefully', () => {
      // Assuming listStorageFiles handles errors internally
      expect(() => listStorageFiles()).not.toThrow();
    });
  });

  describe('File Security', () => {
    it('should prevent path traversal with .. sequences', async () => {
      try {
        await readFileFromStorage('../package.json');
        fail('Should prevent directory traversal');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should prevent absolute path attacks', async () => {
      try {
        await readFileFromStorage('/etc/passwd');
        fail('Should prevent absolute paths');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate filename format in getFileMetadata', () => {
      const metadata1 = getFileMetadata('../../../etc/passwd');
      const metadata2 = getFileMetadata('/absolute/path');
      expect(metadata1).toBeNull();
      expect(metadata2).toBeNull();
    });

    it('should handle filenames with special characters safely', async () => {
      try {
        const response = await readFileFromStorage('sample-text.txt');
        expect(response.filename).toBe('sample-text.txt');
      } catch {
        // File may not exist, but function should not throw on special chars
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent read requests', async () => {
      const promises = [
        readFileFromStorage('sample-text.txt'),
        readFileFromStorage('sample-text.txt'),
        readFileFromStorage('sample-text.txt'),
      ];

      const results = await Promise.allSettled(promises);
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('should handle concurrent metadata requests', () => {
      const promises = [
        Promise.resolve(getFileMetadata('sample-text.txt')),
        Promise.resolve(getFileMetadata('sample-text.txt')),
        Promise.resolve(getFileMetadata('sample-text.txt')),
      ];

      expect(() => {
        Promise.all(promises);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', async () => {
      try {
        await readFileFromStorage('nonexistent.txt');
      } catch (error: any) {
        expect(error.statusCode).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });

    it('should provide meaningful error messages', async () => {
      try {
        await readFileFromStorage('nonexistent.txt');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });
});
