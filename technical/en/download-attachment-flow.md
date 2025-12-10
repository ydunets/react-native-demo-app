# Technical Documentation: Download Message Attachments System

## 1. Implementation Purpose

Implement a **message attachment download queue** with support for:

- Automatic queue management upon network connection restoration
- Processing pause/resume without data loss
- Prioritization of urgent downloads (interrupting current queue)
- File caching in local file system
- Processing state tracking (active/inactive)

---

## 2. Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│  useDownloadMessageAttachments (Hook)                        │
│  ├─ Initiates downloads upon network restoration            │
│  ├─ Subscribes to appState and networkStatus changes        │
│  └─ Populates queue with new files                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  DownloadMessageAttachmentsContext (Context + Provider)      │
│  ├─ Manages command queue                                   │
│  ├─ Coordinates pause/resume operations                     │
│  └─ Provides file download methods                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  useManageProcessingQueue (Internal Hook)                    │
│  ├─ Manages ref-based command queue                         │
│  ├─ Tracks shouldStop flag via Proxy                        │
│  └─ Manages isProcessing state                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Key Functions Step-by-Step Logic

### 3.1 Queue Initialization: `useManageProcessingQueue`

**Purpose**: Create isolated queue management with reactive state.

```typescript
// Uses Proxy to track stop flag
let { current: shouldStopProxy } = useRef(
  new Proxy(
    { shouldStop: false },
    {
      get: (target, prop) => Reflect.get(target, prop),
      set: (target, prop, value) => Reflect.set(target, prop, value)
    }
  )
);

// Returns management methods
return {
  queueRef,           // useRef<DownloadCommand[]>
  shouldStopProxy,    // For safe pause
  addCommand,         // Add file to queue beginning (priority)
  pauseProcessing,    // Stop processing
  setIsProcessing     // Update UI state
};
```

**Data Flow**:

```
addCommand → queueRef.current.unshift(command)
                     ↓
         queueRef = [file1, file2, file3...]
```

---

### 3.2 Single File Download: `downloadFile`

**Purpose**: Download a single file via API with cache checking and error handling.

```typescript
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  // STEP 1: Get authorization token from secure storage
  const accessToken = await getAuthToken();

  // STEP 2: Ensure directory exists
  await makeDirectory(ATTACHMENTS_DIR);

  // STEP 3: Build path with file extension
  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

  // STEP 4: Check cache (file already downloaded?)
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    console.log(`[File Processing] ${filename}, file already exists`);
    return true; // ✓ File exists, skip
  }

  // STEP 5: POST request to API for download
  const response = await RNFetchBlob.fetch(
    "POST",
    `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
    {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain"
    },
    url // Send file URL in request body
  );

  // STEP 6: Check error status
  if (response.respInfo.status >= 400) {
    const message = JSON.parse(response.data).data;
    throw new Error(`Download file error: ${response.respInfo.status}`);
  }

  // STEP 7: Save in Base64 format to local FS
  const base64 = await response.base64();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return response.respInfo.status < 400;
};
```

**Usage Examples**:

```typescript
// Successful download of new file
await downloadFile({
  filename: "invoice.pdf",
  url: "https://api.example.com/file/123",
  id: "attachment-456"
});
// Result: /Documents/files/attachment-456.pdf created

// Repeated download (cache hit)
await downloadFile({ ... });
// Result: returns true without re-download (file exists)
```

---

### 3.3 Queue Processing: `processQueue`

**Purpose**: Sequentially download all files from queue with ability to stop.

```typescript
const processQueue = async () => {
  setIsProcessing(true); // UI: show "processing active"

  // STEP 1: Loop while queue has items
  while (queueRef.current.length) {
    console.log(
      "[File Processing] Processing queue remaining",
      queueRef.current.length
    );

    // STEP 2: Download first file from queue
    const result = await downloadFile(queueRef.current[0]);

    // STEP 3: If download failed - exit loop
    if (!result) {
      break; // ✗ Error, stop processing
    }

    // STEP 4: Remove downloaded file from queue
    queueRef.current.shift(); // Remove from beginning

    // STEP 5: Check pause flag (is shouldStop set?)
    if (shouldStopProxy.shouldStop) {
      console.log("[File Processing] Stop processing");
      shouldStopProxy.shouldStop = false;
      break; // Processing paused externally
    }
  }

  setIsProcessing(false); // UI: hide "processing active"
};
```

**Timeline**:

```
Time   Event                    queueRef           isProcessing
────────────────────────────────────────────────────────────────
t=0    processQueue started     [A, B, C]          true
t=1    A downloaded             [B, C]             true
t=2    B downloaded             [C]                true
t=3    pauseProcessing()        [C]                false
t=4    resumeProcessing()       [C]                true
t=5    C downloaded             []                 true
t=6    loop completed           []                 false
```

---

### 3.4 Pausing: `pauseProcessing` and `resumeProcessing`

**Purpose**: Interrupt current processing for priority files.

```typescript
// PAUSE: Stop queue
const pauseProcessing = async () => {
  shouldStopProxy.shouldStop = true; // Flag for processQueue loop
  setIsProcessing(false); // UI: hide "processing active"
  await Promise.resolve(); // Allow React to update
};

// RESUME: Continue from same point
const resumeProcessing = async () => {
  setIsProcessing(true);
  console.log("[File Processing] New processing queue started");
  await processQueue(); // Process remaining files
};
```

**Usage Scenario** (urgent attachment download):

```typescript
// Background queue processing: [file1, file2, file3]
// User clicked "Download Now" on chat file

const downloadFileFromMessage = async (attachment: Attachment) => {
  await pauseProcessing(); // ⏸ Stop background
  // queueRef = [file1, file2, file3], isProcessing = false

  const result = await downloadFile({
    // ↓ Download urgent file
    filename: attachment.name,
    url: attachment.url,
    id: attachment.id
  });

  resumeProcessing(); // ▶ Resume background
  // Processing of [file1, file2, file3] resumed
};
```

---

### 3.5 Download Initiation: `useDownloadMessageAttachments`

**Purpose**: Hook for automatic queue startup upon network restoration.

```typescript
// STEP 1: Prepare attachments for queue
const addFilesToProcessingQueue = useCallback(
  async (attachments: (Attachment | undefined)[]) => {
    resetQueue(); // Clear old queue

    for (const attachment of attachments) {
      const filename = `${attachment?.id}.${getExtension(attachment?.name)}`;
      const path = `${ATTACHMENTS_DIR}${filename}`;

      // Check local cache
      const fileInfo = await FileSystem.getInfoAsync(path);

      if (!attachment?.url || fileInfo.exists) continue; // ✓ Already have it

      // STEP 2: Add to queue for background processing
      addCommand({
        url: attachment.url,
        filename: attachment.name,
        id: attachment.id
      });
    }
  },
  [addCommand, resetQueue]
);

// STEP 3: Monitor network restoration and app state
useEffect(() => {
  if (!attachments.length) return;

  // Start downloads ONLY if:
  // 1. App is active (foreground)
  // 2. Internet available (isConnected = true)
  if (isAppStateActive(appState) && isConnected) {
    addFilesToProcessingQueue(attachments);
    startProcessing(); // Begin queue processing
  }
}, [attachments.length, appState, isConnected]);
```

**Real-world Scenario**:

```
1. App started, no internet
   → useDownloadMessageAttachments: does nothing

2. User enables Wi-Fi
   → isConnected changes to true
   → isAppStateActive(appState) = true
   → useEffect triggers
   → addFilesToProcessingQueue adds all attachments to queueRef
   → startProcessing() begins downloading files in background

3. User closed app
   → appState = 'background'
   → pauseProcessing() automatically called (if implemented)
   → queueRef remains untouched for later resumption
```

---

## 4. Application Integration

**Provider Wrapper**:

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <DownloadMessageAttachmentsProvider>
      <Stack>
        {/* All screens have context access */}
      </Stack>
    </DownloadMessageAttachmentsProvider>
  );
}
```

**Component Usage**:

```typescript
function MessageScreen() {
  useDownloadMessageAttachments(); // Hook will auto-start queue
  const { downloadFileFromMessage } = useDownloadMessageAttachmentsContext();

  return (
    <Button
      onPress={() => downloadFileFromMessage(attachment)}
      title="Download Now"
    />
  );
}
```

---

## 5. Key Characteristics

| Characteristic         | Implementation                                          |
| ---------------------- | ------------------------------------------------------- |
| **Caching**            | Check via `FileSystem.getInfoAsync()` before download   |
| **Prioritization**     | `unshift()` adds new files to queue beginning           |
| **Security**           | Token from secure storage `authStorage`                 |
| **Error Handling**     | Check `status >= 400`, throw Error                      |
| **Reactivity**         | Zustand `setIsProcessing` updates UI state              |
| **Network Resilience** | Hook monitors `isConnected` via `useCheckNetworkStatus` |
