# Binary Streaming Fix for Large File Downloads

## Problem

Large PDF files (40MB+) were downloading but resulting in zero-byte or corrupted files.

## Root Cause

The original `/api/files/download` endpoint returned JSON with base64-encoded file content:

```javascript
// Returns JSON with base64-encoded file
res.json({ 
  filename: "file.pdf",
  base64: "JVBERi0xLjQK..." // 40MB file = ~55MB base64 string
});
```

**Why it failed for large files:**
1. Base64 encoding adds ~33% overhead (40MB → 55MB)
2. `response.base64()` loads entire file into memory as a string
3. Large strings cause truncation or memory exhaustion
4. JSON parsing fails on truncated responses

## Solution

### Backend: New Binary Streaming Endpoint

Created `/api/files/download-binary` that streams raw bytes:

```javascript
// backend/src/routes/files.ts
router.post('/download-binary', authMiddleware, async (req, res) => {
  const { filename } = req.body;
  const filePath = getFilePath(filename);
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  fs.createReadStream(filePath).pipe(res);
});
```

**Why it works:**
- **No base64 overhead** - Binary is ~33% smaller
- **Streaming** - File sent in chunks, not loaded into memory
- **Pipe pattern** - Efficient memory usage regardless of file size

### Client: Direct-to-Disk Saving

**Initial Implementation (Crashed on Large Files):**

```javascript
// ❌ Problem: Loads entire file into memory
const response = await RNFetchBlob.fetch(
  'POST',
  `${baseURL}/api/files/download-binary`,
  { Authorization: `Bearer ${token}` },
  JSON.stringify({ filename })
);

const base64 = await response.base64(); // Crash! 50MB → 67MB string in memory
const filePath = getCacheFilePath(attachmentId, filename);
const file = new File(filePath);
await file.write(base64, { encoding: 'base64' });
```

**Issue:** RNFetchBlob expects native filesystem paths (`/data/user/...`), but expo-file-system returns URI paths (`file:///data/user/...`). Direct path usage crashed.

**Fixed Implementation (Streams to Disk):**

```javascript
// ✅ Solution: Stream to disk + path conversion
const expoPath = getCacheFilePath(attachmentId, filename);
const nativePath = expoPath.replace(/^file:\/\//, ''); // Strip file:// prefix

const response = await RNFetchBlob.config({
  path: nativePath, // Save directly to native path
}).fetch(
  'POST',
  `${baseURL}/api/files/download-binary`,
  { Authorization: `Bearer ${token}` },
  JSON.stringify({ filename })
);

// File is already on disk - no base64 conversion needed!
```

**Why it works:**
- Converts expo-file-system URI (`file://`) to native path for RNFetchBlob
- Data flows directly: Server → Network → Disk (no memory buffer)
- No memory buffering of entire file
- Handles files of any size without crashes

## Comparison

| Aspect | Old (JSON/Base64) | In-Memory Binary | Final (Streaming) |
|--------|-------------------|------------------|-------------------|
| Memory Usage | O(file size) × 1.33 | O(file size) × 1.33 | O(chunk size) |
| Transfer Size | +33% overhead | Exact file size | Exact file size |
| Max File Size | ~10-20MB | ~20-30MB | Unlimited |
| Client Handling | Parse JSON, decode base64 | Fetch, convert base64, write | Stream to disk |
| Path Compatibility | N/A | Crashed (URI mismatch) | ✅ Converted URI to native |

## Files Changed

### Backend Changes (Binary Endpoint)
1. **Backend**: `backend/src/routes/files.ts` - Added `/download-binary` endpoint with streaming
2. **Backend**: `backend/src/storage/fileStorage.ts` - Added `getFilePath()` and `getFileMetadata()` helpers

### Client Changes (Streaming Implementation)
3. **Client**: `contexts/downloadMessageAttachments.tsx` - Updated `fetchAndSaveFile()`:
   - Removed `File` import (no longer needed - unused diagnostic fixed)
   - Converted expo-file-system URI to native path via `replace(/^file:\/\//, '')`
   - Changed from `response.base64()` + `file.write()` to `RNFetchBlob.config({ path }).fetch()`
   - File now streams directly to disk during download

## Result

- ✅ 40MB PDFs download successfully
- ✅ All 21 test files download correctly
- ✅ No memory issues on device
- ✅ Consistent file sizes verified
