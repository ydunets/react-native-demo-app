# Download Message Attachments System - Presentation Guide

**Complete Implementation Reference for Demo App**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Value & Problem Statement](#business-value--problem-statement)
3. [Architecture Overview](#architecture-overview)
4. [Key Components & Data Flow](#key-components--data-flow)
5. [Implementation Guide](#implementation-guide)
6. [Code Reference & Examples](#code-reference--examples)
7. [Integration Steps](#integration-steps)
8. [Demo App Implementation Checklist](#demo-app-implementation-checklist)

---

## Executive Summary

The **Download Message Attachments System** is a sophisticated file management solution for the KiiMobile healthcare messaging platform that enables:

- **Automatic Background Downloads**: Files from recent messages download automatically when network is available
- **Intelligent Queueing**: Priority-based queue with pause/resume capabilities
- **File Caching**: Smart local caching to prevent redundant downloads
- **Network Resilience**: Automatic restart on network restoration
- **Secure Access**: Token-based authentication for all downloads
- **Non-blocking UI**: All operations occur asynchronously without freezing the app

**Key Statistics**:

- Supports downloading attachments from the **last 50 messages**
- **Sequential processing** with smart pause/resume for priority files
- **Proxy-based state management** for reactive queue control
- **Base64 encoding** for secure file storage in cache directory

---

## Business Value & Problem Statement

### Problems Solved

| Problem                                      | Solution                                      |
| -------------------------------------------- | --------------------------------------------- |
| Users cannot access files shared in messages | Automatic downloading to local cache          |
| Repeated downloads waste bandwidth           | Smart file caching - check before downloading |
| Large downloads block app responsiveness     | Asynchronous queue processing                 |
| Network interruptions lose download progress | Queue persists; resumes on reconnection       |
| Users need to manually manage file access    | Integrated file viewer with downloaded files  |
| Security concerns with file transfers        | Authenticated API calls with bearer tokens    |

### Business Impact

- **Improved Care Coordination**: Healthcare providers can instantly access medical records and documents shared via messages
- **Enhanced User Experience**: Seamless offline access to previously viewed documents
- **Operational Efficiency**: Reduced user support calls about file access issues
- **Data Safety**: Secure, authenticated downloads with proper storage management

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  (Messages Screen, Chat Screen, Document Viewer)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐      ┌──────────────┐      ┌──────────────┐
    │  Hooks  │      │  Contexts    │      │  Utilities   │
    │         │      │              │      │              │
    │ - use   │      │ - Download   │      │ - File ops   │
    │   Down  │      │   Message    │      │ - Extension  │
    │   load  │      │   Attach...  │      │ - Directory  │
    │   Msgs  │      │              │      │   management │
    └────┬────┘      └──────┬───────┘      └──────┬───────┘
         │                  │                      │
         └──────────────────┼──────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
        ┌────────────┐            ┌──────────────────┐
        │   React    │            │  File System &   │
        │   Query    │            │  Network Layer   │
        │            │            │                  │
        │ - Messages │            │ - RNFetchBlob    │
        │ - API      │            │ - FileSystem API │
        │ - Caching  │            │ - NetInfo        │
        └────────────┘            └──────────────────┘
```

### Data Flow Diagram

```
App Startup
    ↓
useDownloadMessageAttachments Hook Initialized
    ↓
[Effect Trigger] App State + Network Status + Attachments Available
    ↓
addFilesToProcessingQueue()
    ├─ Check last 50 messages for attachments
    ├─ Verify file not already cached
    └─ Add to queueRef (priority: newest first via unshift)
    ↓
startProcessing()
    ↓
processQueue()
    ├─ While queueRef has items:
    │  ├─ Get auth token
    │  ├─ Make API POST request
    │  ├─ Convert response to Base64
    │  ├─ Write to cache directory
    │  ├─ Remove from queue
    │  └─ Check for pause signal
    │
    └─ Set isProcessing = false
    ↓
[User Action] Tap attachment in message
    ↓
downloadFileFromMessage(attachment)
    ├─ pauseProcessing() ← Pause background queue
    ├─ downloadFile() ← Download user's requested file
    └─ resumeProcessing() ← Resume background queue
    ↓
[Event] App goes to background
    ↓
(Queue pauses automatically - can be resumed)
```

---

## Key Components & Data Flow

### 1. **DownloadMessageAttachmentsContext** ([contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx))

**Purpose**: Central state management and file download orchestration

**Key Exports**:

```typescript
type DownloadMessageAttachmentsContextType = {
  isProcessing: boolean; // UI indicator: processing active?
  addCommand: (command: DownloadCommand) => void; // Add to queue
  resumeProcessing: () => Promise<void>; // Continue
  resetQueue: () => void; // Clear queue
  pauseProcessing: () => Promise<void>; // Pause queue
  processQueue: () => Promise<void>; // Process items
  downloadFile: (command: DownloadCommand) => Promise<boolean>;
  startProcessing: () => Promise<void>; // Begin
  downloadFileFromMessage: (attachment: Attachment) => Promise<boolean>;
};

interface DownloadCommand {
  filename: string; // "invoice.pdf"
  url: string; // API download URL
  id: string; // Unique attachment ID
}
```

**Provider Setup**:

```typescript
export const DownloadMessageAttachmentsProvider = ({ children }) => {
  // All context values created here
  // Wrap entire app in _layout.tsx
  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};

// Hook to access context
export const useDownloadMessageAttachmentsContext = () => {
  // Throws error if used outside provider
  return useContext(DownloadMessageAttachmentsContext);
};
```

**Critical Internal: useManageProcessingQueue Hook**

```typescript
const useManageProcessingQueue = () => {
  // Queue stored in ref to persist across renders
  let queueRef = useRef<DownloadCommand[]>([]);

  // Proxy-based stop signal for safe pausing
  let { current: shouldStopProxy } = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => Reflect.get(target, prop),
        set: (target, prop, value) => Reflect.set(target, prop, value)
      }
    )
  );

  const addCommand = (command: DownloadCommand) => {
    queueRef.current.unshift(command);  // Add to beginning (priority)
  };

  const resetQueue = () => {
    queueRef.current = [];
    shouldStopProxy.shouldStop = false;
  };

  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true;
    setIsProcessing(false);
    await Promise.resolve();
  };

  return { queueRef, shouldStopProxy, addCommand, pauseProcessing, ... };
};
```

### 2. **useDownloadMessageAttachments Hook** ([hooks/useDownloadMessageAttachments.tsx](hooks/useDownloadMessageAttachments.tsx))

**Purpose**: Automatic queue initialization on network restoration

**Trigger Conditions**:

```typescript
// Starts processing ONLY when ALL conditions are true:
if (isAppStateActive(appState) && isConnected) {
  startDownloads();
}

// Responds to:
// 1. attachments.length - new messages with files
// 2. appState - user brings app to foreground
// 3. isConnected - network becomes available
```

**Core Logic**:

```typescript
const addFilesToProcessingQueue = useCallback(
  async (attachments) => {
    resetQueue(); // Clear previous queue

    for (const attachment of attachments) {
      // Build file path with extension
      const filename = `${attachment?.id}.${getExtension(attachment?.name)}`;
      const path = `${ATTACHMENTS_DIR}${filename}`;

      // Check if already downloaded
      const fileInfo = await FileSystem.getInfoAsync(path);

      // Skip if missing URL or file exists
      if (!attachment?.url || fileInfo.exists) continue;

      // Add to queue
      addCommand({
        url: attachment.url,
        filename: attachment.name,
        id: attachment.id
      });
    }
  },
  [addCommand, resetQueue]
);

// Triggered when network/app state changes
useEffect(() => {
  if (!attachments.length) return;

  if (isAppStateActive(appState) && isConnected) {
    startDownloads();
  }
}, [attachments.length, appState, isConnected]);
```

### 3. **File Download Function**

**Location**: [contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx)

**Detailed Process**:

```typescript
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  // STEP 1: Get authentication token
  const accessToken = await getAuthToken();

  // STEP 2: Ensure cache directory exists
  await makeDirectory(ATTACHMENTS_DIR);

  // STEP 3: Build file path with extension
  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

  // STEP 4: Check if already cached
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    console.log(`[File Processing] ${filename}, file already exists`);
    return true; // ✓ Skip download
  }

  // STEP 5: Make authenticated API request
  const response = await RNFetchBlob.fetch(
    "POST",
    `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
    {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json, text/plain, */*",
      "Content-Type": "text/plain"
    },
    url // Send URL in request body
  );

  // STEP 6: Check for errors
  if (response.respInfo.status >= 400) {
    const message = JSON.parse(response.data).data;
    throw new Error(
      `Download file error: ${response.respInfo.status}, ${message}`
    );
  }

  // STEP 7: Convert and save
  const base64 = await response.base64();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return response.respInfo.status < 400;
};
```

### 4. **Queue Processing**

```typescript
const processQueue = async () => {
  setIsProcessing(true);

  while (queueRef.current.length) {
    console.log(
      "[File Processing] Processing queue remaining",
      queueRef.current.length
    );

    // Download first file
    const result = await downloadFile(queueRef.current[0]);

    // Exit on error
    if (!result) break;

    // Remove from queue
    queueRef.current.shift();

    // Check pause flag
    if (shouldStopProxy.shouldStop) {
      console.log("[File Processing] Stop processing");
      shouldStopProxy.shouldStop = false;
      break;
    }
  }

  console.log("[File Processing] Processing queue finished");
  setIsProcessing(false);
};
```

### 5. **Priority Download (User-Initiated)**

```typescript
const downloadFileFromMessage = async (attachment: Attachment) => {
  // PAUSE: Stop background queue
  await pauseProcessing();
  console.log("[File Processing] Processing paused");

  // DOWNLOAD: User's requested file
  const result = await downloadFile({
    filename: attachment.name,
    url: attachment.url,
    id: attachment.id
  });
  console.log("[File Processing] Download File from attachment finished");

  // RESUME: Continue background queue
  console.log("[File Processing] Processing resumed");
  resumeProcessing();

  return result;
};
```

---

## Implementation Guide

### Phase 1: Project Setup

#### 1.1 Install Dependencies

```bash
npm install expo-file-system react-native-blob-util
```

**Why these?**:

- `expo-file-system`: File operations (read, write, check existence)
- `react-native-blob-util`: Handles file downloads with proper headers

#### 1.2 Create Constants

**File**: [constants/File.ts](constants/File.ts)

```typescript
import * as FileSystem from "expo-file-system";

export const FILE_DIR = `${FileSystem.cacheDirectory}kii_mobile/`;
export const ATTACHMENTS_DIR = `${FileSystem.cacheDirectory}attachments/`;

export const EXTENSIONS = {
  PDF: "pdf"
};

export const FILE_TYPES = {
  PDF: "application/pdf"
};
```

**Update**: [constants/index.ts](constants/index.ts)

```typescript
export { ATTACHMENTS_DIR, FILE_DIR } from "./File";
```

#### 1.3 Create File Utilities

**File**: [utils/files.ts](utils/files.ts)

```typescript
import * as FileSystem from "expo-file-system";

import { ATTACHMENTS_DIR } from "@/constants";
import type Attachment from "@/models/Attachment";

// Extract file extension from filename
export const getExtension = (filename: string) => {
  return filename.split(".")[1];
};

// Get local file path for attachment
export const getAttachmentFilePath = (attachment: Attachment) =>
  `${ATTACHMENTS_DIR}${attachment.id}.${getExtension(attachment.name)}`;

// Check if directory exists
export const checkIfDirectoryExists = async (directory: string) => {
  const { isDirectory } = await FileSystem.getInfoAsync(directory).catch(
    () => ({ isDirectory: false })
  );
  return isDirectory;
};

// Create directory if doesn't exist
export const makeDirectory = async (directoryUri: string) => {
  const directoryExists = await checkIfDirectoryExists(directoryUri);
  if (!directoryExists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
};

// Convert URL filename
export const convertUrlToFileName = (url: string) => {
  const fileName = url.split("/").at(-1);
  return fileName?.split(".").at(0) ?? "";
};
```

### Phase 2: Context Creation

**File**: [contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx)

See [Code Reference & Examples](#code-reference--examples) section for complete implementation.

**Key Steps**:

1. Define context type and interface
2. Create default context with empty implementations
3. Implement `useManageProcessingQueue` internal hook
4. Implement provider component with:
   - `getAuthToken()` - Get JWT from secure storage
   - `downloadFile()` - Single file download logic
   - `processQueue()` - Sequential queue processing
   - `pauseProcessing()` / `resumeProcessing()` - Queue control
   - `downloadFileFromMessage()` - User-initiated priority download

### Phase 3: Hook Creation

**File**: [hooks/useDownloadMessageAttachments.tsx](hooks/useDownloadMessageAttachments.tsx)

See [Code Reference & Examples](#code-reference--examples) section for complete implementation.

**Key Steps**:

1. Fetch messages with attachments
2. Track network status
3. Track app state
4. Build `addFilesToProcessingQueue` function
5. Set up effect to trigger on conditions

### Phase 4: Integration

**File**: [app/\_layout.tsx](app/_layout.tsx)

```typescript
import { DownloadMessageAttachmentsProvider } from "@/contexts/downloadMessageAttachments";

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

### Phase 5: Usage in Components

```typescript
import { useDownloadMessageAttachments } from "@/hooks/useDownloadMessageAttachments";
import { useDownloadMessageAttachmentsContext } from "@/contexts/downloadMessageAttachments";

function MessageScreen() {
  // Initialize automatic downloads
  useDownloadMessageAttachments();

  // Get manual download method
  const { downloadFileFromMessage, isProcessing } =
    useDownloadMessageAttachmentsContext();

  return (
    <View>
      <Text>
        {isProcessing ? "Downloading..." : "Downloads Complete"}
      </Text>

      <Button
        onPress={() => downloadFileFromMessage(attachment)}
        title="Download Now"
      />
    </View>
  );
}
```

---

## Code Reference & Examples

### Complete Context Implementation

```typescript
// contexts/downloadMessageAttachments.tsx
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";

import * as FileSystem from "expo-file-system";
import RNFetchBlob from "react-native-blob-util";

import { axiosConfig } from "@/api/axios-client";
import { getDashboardSrvPaths } from "@/api/dashboard";
import { ATTACHMENTS_DIR } from "@/constants";
import type Attachment from "@/models/Attachment";
import { AUTH_STORE_KEY, authStorage } from "@/storage/authStorage";
import type { AuthStorageTokens } from "@/store/authStore";
import { getExtension, makeDirectory } from "@/utils/files";

type DownloadMessageAttachmentsContextType = {
  isProcessing: boolean;
  addCommand: (command: DownloadCommand) => void;
  resumeProcessing: () => Promise<void>;
  resetQueue: () => void;
  pauseProcessing: () => Promise<void>;
  processQueue: () => Promise<void>;
  downloadFile: (command: DownloadCommand) => Promise<boolean>;
  startProcessing: () => Promise<void>;
  downloadFileFromMessage: (attachment: Attachment) => Promise<boolean>;
};

export interface DownloadCommand {
  filename: string;
  url: string;
  id: string;
}

export const DownloadMessageAttachmentsContext =
  createContext<DownloadMessageAttachmentsContextType>({
    isProcessing: false,
    addCommand: () => {},
    resumeProcessing: () => Promise.resolve(),
    resetQueue: () => {},
    pauseProcessing: () => Promise.resolve(),
    processQueue: () => Promise.resolve(),
    downloadFile: () => Promise.resolve(true),
    startProcessing: () => Promise.resolve(),
    downloadFileFromMessage: () => Promise.resolve(true)
  });

export const useDownloadMessageAttachmentsContext = () => {
  const context = useContext(DownloadMessageAttachmentsContext);
  if (!context) {
    throw new Error(
      "useDownloadMessageAttachmentsContext must be used within a DownloadMessageAttachmentsProvider"
    );
  }
  return context;
};

const useManageProcessingQueue = () => {
  let queueRef = useRef<DownloadCommand[]>([]);
  let { current: shouldStopProxy } = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => {
          return Reflect.get(target, prop);
        },
        set: (target, prop, value) => {
          return Reflect.set(target, prop, value);
        }
      }
    )
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const addCommand = (command: DownloadCommand) => {
    queueRef.current.unshift(command);
  };

  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true;
    setIsProcessing(false);
    await Promise.resolve();
  };

  const resetQueue = () => {
    queueRef.current = [];
    shouldStopProxy.shouldStop = false;
  };

  return {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
    setIsProcessing
  };
};

export const DownloadMessageAttachmentsProvider = ({
  children
}: PropsWithChildren) => {
  const {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
    setIsProcessing
  } = useManageProcessingQueue();

  const getAuthToken = async (): Promise<string | undefined> => {
    const store = await authStorage.getItem(AUTH_STORE_KEY);
    if (!store) return undefined;

    const { state } = JSON.parse(store) as { state: AuthStorageTokens };
    return state.accessToken;
  };

  const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
    const accessToken = await getAuthToken();

    await makeDirectory(ATTACHMENTS_DIR);

    const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

    const fileInfo = await FileSystem.getInfoAsync(path);

    if (fileInfo.exists) {
      console.log(`[File Processing] ${filename}, file already exists`);
      return true;
    }

    const response = await RNFetchBlob.fetch(
      "POST",
      `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
      {
        ...axiosConfig.headers,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json, text/plain, */*",
        "Content-Type": "text/plain"
      },
      url
    );

    if (response.respInfo.status >= 400) {
      const message = JSON.parse(response.data).data;
      throw new Error(
        `Download file error: ${response.respInfo.status}, ${message}`
      );
    }

    const base64 = await response.base64();

    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64
    });

    return response.respInfo.status < 400;
  };

  const processQueue = async () => {
    setIsProcessing(true);

    while (queueRef.current.length) {
      console.log(
        "[File Processing] Processing queue remaining",
        queueRef.current.length
      );
      const result = await downloadFile(queueRef.current[0]);

      if (!result) {
        break;
      }

      queueRef.current.shift();

      if (shouldStopProxy.shouldStop) {
        console.log("[File Processing] Stop processing");
        shouldStopProxy.shouldStop = false;
        break;
      }
    }

    console.log("[File Processing] Processing queue finished");

    setIsProcessing(false);
  };

  const resumeProcessing = async () => {
    setIsProcessing(true);
    console.log("[File Processing] New processing queue started");
    await processQueue();
  };

  const downloadFileFromMessage = async (attachment: Attachment) => {
    await pauseProcessing();
    console.log("[File Processing] Processing paused");

    const result = await downloadFile({
      filename: attachment.name,
      url: attachment.url,
      id: attachment.id
    });
    console.log("[File Processing] Download File from attachment finished");

    console.log("[File Processing] Processing resumed");
    resumeProcessing();

    return result;
  };

  const startProcessing = async () => {
    if (!queueRef.current.length) {
      console.log(
        "[File Processing] No items in queue, processing not started"
      );
      return;
    }

    await processQueue();
  };

  const value = useMemo(
    () => ({
      isProcessing,
      addCommand,
      resumeProcessing,
      resetQueue,
      pauseProcessing,
      processQueue,
      downloadFile,
      startProcessing,
      downloadFileFromMessage
    }),
    [isProcessing]
  );

  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
```

### Complete Hook Implementation

```typescript
// hooks/useDownloadMessageAttachments.tsx
import { useCallback, useEffect } from "react";

import * as FileSystem from "expo-file-system";

import { useAllMessages } from "@/api/dashboard/messages/useMessages";
import { ATTACHMENTS_DIR, isAppStateActive } from "@/constants";
import { useDownloadMessageAttachmentsContext } from "@/contexts/downloadMessageAttachments";
import { useCheckNetworkStatus } from "@/hooks/useCheckNetworkStatus";
import type Attachment from "@/models/Attachment";
import { useAppStateStore } from "@/store/appStateStore";
import { getExtension } from "@/utils";

export const useDownloadMessageAttachments = () => {
  const { addCommand, startProcessing, resetQueue } =
    useDownloadMessageAttachmentsContext();
  const { attachments } = useAllMessages({ limit: "50" });
  const { appState } = useAppStateStore();
  const { isConnected } = useCheckNetworkStatus();

  const addFilesToProcessingQueue = useCallback(
    async (attachments: (Attachment | undefined)[]) => {
      resetQueue();
      try {
        for (const attachment of attachments) {
          const filename = `${attachment?.id}.${getExtension(attachment?.name ?? "txt")}`;

          const path = `${ATTACHMENTS_DIR}${filename}`;

          const fileInfo = await FileSystem.getInfoAsync(path);

          if (!attachment?.url || fileInfo.exists) continue;

          try {
            console.log(
              "[File Processing] Adding file to queue",
              attachment.name
            );

            addCommand({
              url: attachment.url,
              filename: attachment.name,
              id: attachment.id
            });
          } catch (error) {
            console.error(
              `[File Processing] Error queueing download for ${attachment.url}:`,
              error
            );
          }
        }
        console.log("[File Processing] Finished adding files to queue");
      } catch (error) {
        console.error("[File Processing] Download process failed:", error);
        return false;
      }
    },
    [addCommand, resetQueue]
  );

  const startDownloads = useCallback(async () => {
    if (!attachments.length) return;

    await addFilesToProcessingQueue(attachments);
    await startProcessing();
  }, [attachments, addFilesToProcessingQueue, startProcessing]);

  useEffect(() => {
    if (!attachments.length) {
      return;
    }

    console.log("[File Processing] Attachments length", attachments.length);

    if (isAppStateActive(appState) && isConnected) {
      startDownloads();
    }
  }, [attachments.length, appState, isConnected]);
};
```

---

## Integration Steps

### Step 1: Verify Dependencies

```bash
npm list expo-file-system react-native-blob-util
```

Expected output:

```
expo-file-system@16.x.x
react-native-blob-util@0.x.x
```

### Step 2: Create Files in Order

1. **[constants/File.ts](constants/File.ts)** - File paths
2. **[utils/files.ts](utils/files.ts)** - File utilities
3. **[contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx)** - Context provider
4. **[hooks/useDownloadMessageAttachments.tsx](hooks/useDownloadMessageAttachments.tsx)** - Auto-download hook

### Step 3: Update Entry Point

**[app/\_layout.tsx](app/_layout.tsx)**:

```typescript
import { DownloadMessageAttachmentsProvider } from "@/contexts/downloadMessageAttachments";

export default function RootLayout() {
  return (
    <DownloadMessageAttachmentsProvider>
      <Stack>
        {/* screens */}
      </Stack>
    </DownloadMessageAttachmentsProvider>
  );
}
```

### Step 4: Add to Message Screen

```typescript
function MessageScreen() {
  useDownloadMessageAttachments();
  const { downloadFileFromMessage, isProcessing } =
    useDownloadMessageAttachmentsContext();

  return (
    <View>
      {/* display attachments */}
    </View>
  );
}
```

### Step 5: Test with Console Logs

Check DevTools console for:

```
[File Processing] Attachments length 5
[File Processing] Adding file to queue invoice.pdf
[File Processing] Processing queue remaining 5
[File Processing] invoice.pdf, file already exists
[File Processing] Processing queue finished
```

---

## Backend Setup for Demo App

### Option 1: Mock Backend (No Backend Required) ⭐ Recommended for Demo

Create mock implementations directly in your demo app. No external dependencies!

**File**: `api/dashboard/index.ts` (Mock)

```typescript
// Mock getDashboardSrvPaths - returns same structure as real backend
export const getDashboardSrvPaths = (params?: { messageId?: string }) => {
  const controller = "/dashboardsrv/v1";

  return {
    messages: {
      unread: `${controller}/message/count/unread`,
      getMessages: `${controller}/message/mha/patient/messages`,
      createMessage: `${controller}/mha/patient/message/create`,
      archiveMessage: `${controller}/mha/patient/message/markAsRead/${params?.messageId}/archive`,
      markAsReadMessage: `${controller}/mha/patient/message/markAsRead/${params?.messageId}`,
      members: `${controller}/message/members`,
      downloadFile: `${controller}/mha/patient/message/attachment/download`
    }
  };
};
```

**File**: `api/axios-client.tsx` (Mock)

```typescript
import axios from "axios";

// Mock baseURL pointing to mock server
export const axiosConfig = {
  baseURL: "http://localhost:3000", // Mock backend URL
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
};

export const axiosInstance = axios.create(axiosConfig);

// Mock interceptor - just pass through
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
```

**File**: `api/dashboard/messages/useMessages.tsx` (Mock)

```typescript
// Mock hook returning test data
export const useAllMessages = ({ limit = "50" }: { limit?: string }) => {
  // Simulate fetching messages with attachments
  const mockAttachments = [
    {
      id: "att-1",
      name: "invoice.pdf",
      url: "/dashboardsrv/v1/mha/patient/message/attachment/download", // Will be intercepted
      size: 150000
    },
    {
      id: "att-2",
      name: "report.pdf",
      url: "/dashboardsrv/v1/mha/patient/message/attachment/download",
      size: 250000
    },
    {
      id: "att-3",
      name: "chart.xlsx",
      url: "/dashboardsrv/v1/mha/patient/message/attachment/download",
      size: 320000
    }
  ];

  return {
    attachments: mockAttachments,
    isLoading: false,
    error: null
  };
};
```

**File**: `contexts/downloadMessageAttachments.tsx` (Mock Implementation)

Update the `downloadFile` function to handle mocking:

```typescript
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  const accessToken = await getAuthToken();

  await makeDirectory(ATTACHMENTS_DIR);

  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

  const fileInfo = await FileSystem.getInfoAsync(path);

  if (fileInfo.exists) {
    console.log(`[File Processing] ${filename}, file already exists`);
    return true;
  }

  try {
    // For demo: Create mock file instead of fetching
    if (url.includes("dashboardsrv")) {
      // Mock: Create a dummy PDF in base64
      const mockBase64 =
        "JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iaiAyIDAgb2JqPDwvVHlwZS9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxPj5lbmRvYmoKMyAwIG9iajw8L1R5cGUvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdIC9Db250ZW50cyA0IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9MZW5ndGggNDQvQ2FjaGUgZmFsc2U+PnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDcwMCBUZAooSGVsbG8gV29ybGQhKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKMDAwMDAwMDQyNyAwMDAwMCBuIAp0cmFpbGVyPDwvU2l6ZSA1L1Jvb3QgMSAwIFI+PgpzdGFydHhlZnogMQolJUVPRg==";
      const base64 = mockBase64;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      console.log(`[File Processing] Mock file created: ${filename}`);
      return true;
    }

    // Real implementation would go here
    const response = await RNFetchBlob.fetch(
      "POST",
      `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
      {
        ...axiosConfig.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain"
      },
      url
    );

    if (response.respInfo.status >= 400) {
      throw new Error(`Download file error: ${response.respInfo.status}`);
    }

    const base64 = await response.base64();

    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64
    });

    return response.respInfo.status < 400;
  } catch (error) {
    console.error(`[File Processing] Error downloading ${filename}:`, error);
    throw error;
  }
};
```

### Option 2: Docker Mock Server (Advanced)

If you want a real mock server, here's a simple Node.js Express setup:

**File**: `docker/mock-backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**File**: `docker/mock-backend/package.json`

```json
{
  "name": "mock-dashboard-backend",
  "version": "1.0.0",
  "description": "Mock backend for KiiMobile demo",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**File**: `docker/mock-backend/index.js`

```javascript
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.text());

// Mock authentication
const mockToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.mock";

// Mock messages with attachments
const mockMessages = [
  {
    id: "msg-1",
    text: "Invoice for January",
    attachments: [
      { id: "att-1", name: "invoice.pdf", url: "file://invoice.pdf" }
    ]
  },
  {
    id: "msg-2",
    text: "Monthly report",
    attachments: [{ id: "att-2", name: "report.pdf", url: "file://report.pdf" }]
  },
  {
    id: "msg-3",
    text: "Sales chart",
    attachments: [{ id: "att-3", name: "chart.xlsx", url: "file://chart.xlsx" }]
  }
];

// Middleware: Check auth token
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
});

// Endpoints
app.get("/dashboardsrv/v1/message/mha/patient/messages", (req, res) => {
  console.log("[Mock Server] GET /messages");
  res.json({
    data: mockMessages,
    count: mockMessages.length
  });
});

app.get("/dashboardsrv/v1/message/count/unread", (req, res) => {
  console.log("[Mock Server] GET /unread count");
  res.json({ data: { count: 5 } });
});

app.post(
  "/dashboardsrv/v1/mha/patient/message/attachment/download",
  (req, res) => {
    console.log("[Mock Server] POST /download");
    const fileUrl = req.body; // URL sent in body

    // Create mock PDF content
    const mockPdfBase64 =
      "JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iaiAyIDAgb2JqPDwvVHlwZS9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxPj5lbmRvYmoKMyAwIG9iajw8L1R5cGUvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdIC9Db250ZW50cyA0IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9MZW5ndGggNDQvQ2FjaGUgZmFsc2U+PnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDcwMCBUZAooSGVsbG8gV29ybGQgLSBNb2NrIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA3NCAwMDAwMCBuIAowMDAwMDAwMTc4IDAwMDAwIG4gCjAwMDAwMDA0MjcgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNS9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmIDEKJSVFT0Y=";

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", 'attachment; filename="mock-file.pdf"');

    // Send base64 encoded PDF
    res.send(Buffer.from(mockPdfBase64, "base64"));
  }
);

app.get("/dashboardsrv/v1/message/members", (req, res) => {
  console.log("[Mock Server] GET /members");
  res.json({
    data: [
      { id: 1, name: "Dr. Smith" },
      { id: 2, name: "Dr. Jones" }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`[Mock Server] Listening on http://localhost:${PORT}`);
  console.log("[Mock Server] Available endpoints:");
  console.log("  - GET  /dashboardsrv/v1/message/mha/patient/messages");
  console.log("  - GET  /dashboardsrv/v1/message/count/unread");
  console.log(
    "  - POST /dashboardsrv/v1/mha/patient/message/attachment/download"
  );
  console.log("  - GET  /dashboardsrv/v1/message/members");
});
```

**File**: `docker-compose.yml`

```yaml
version: "3.8"

services:
  mock-backend:
    build:
      context: ./docker/mock-backend
    ports:
      - "3000:3000"
    volumes:
      - ./docker/mock-backend:/app
    environment:
      - NODE_ENV=development
    command: npm run dev
```

**Start Docker Server**:

```bash
# From project root
docker-compose up --build

# Or manually
cd docker/mock-backend
npm install
npm start
```

---

## Demo App Implementation Checklist

### Pre-Implementation Setup

- [ ] Clone/create demo app repository
- [ ] Install React Native/Expo dependencies
- [ ] Set up TypeScript configuration
- [ ] **Choose backend option**: Mock (recommended) or Docker
- [ ] Set up mock attachment data

### Phase 1: Infrastructure (Days 1-2)

- [ ] Copy `constants/File.ts` with paths
- [ ] Copy `utils/files.ts` with utilities
- [ ] Update `constants/index.ts` exports
- [ ] Create mock `Attachment` model:
  ```typescript
  interface Attachment {
    id: string;
    name: string;
    url: string;
  }
  ```
- [ ] **Set up backend** (choose one):
  - [ ] **Option A - Mock Backend** (Recommended): Copy mock implementations from [Backend Setup - Option 1](#option-1-mock-backend-no-backend-required--recommended-for-demo)
  - [ ] **Option B - Docker Server**: Copy Docker files and run `docker-compose up`

### Phase 2: Context Implementation (Days 2-3)

- [ ] Copy `contexts/downloadMessageAttachments.tsx`
- [ ] Update auth token retrieval (use mock for demo)
- [ ] Update API endpoint paths (use mock endpoints)
- [ ] Test `DownloadMessageAttachmentsProvider` at root

### Phase 3: Hook Implementation (Days 3-4)

- [ ] Copy `hooks/useDownloadMessageAttachments.tsx`
- [ ] Create mock `useAllMessages` hook:
  ```typescript
  const useAllMessages = ({ limit }) => ({
    attachments: mockAttachments
  });
  ```
- [ ] Create mock `useCheckNetworkStatus` hook:
  ```typescript
  const useCheckNetworkStatus = () => ({
    isConnected: true
  });
  ```
- [ ] Create mock `useAppStateStore`:
  ```typescript
  const useAppStateStore = () => ({
    appState: "active"
  });
  ```

### Phase 4: Demo Screen (Days 4-5)

- [ ] Create `(demo)/attachments-demo.tsx` screen
- [ ] Display mock attachments list
- [ ] Add manual download button
- [ ] Add download status indicator
- [ ] Show queue status and progress

### Phase 5: Testing & Polish (Days 5-6)

- [ ] Test automatic download on app start
- [ ] Test pause/resume functionality
- [ ] Test priority download (manual)
- [ ] Test cache behavior (repeated downloads)
- [ ] Create demo presentation slides
- [ ] Record demo walkthrough

### Demo Screen Example

```typescript
// app/(demo)/attachments-demo.tsx
import { useDownloadMessageAttachments } from "@/hooks/useDownloadMessageAttachments";
import { useDownloadMessageAttachmentsContext } from "@/contexts/downloadMessageAttachments";
import { View, Text, Button, FlatList } from "react-native";

export default function AttachmentsDemoScreen() {
  useDownloadMessageAttachments();

  const {
    downloadFileFromMessage,
    isProcessing,
    pauseProcessing,
    resumeProcessing
  } = useDownloadMessageAttachmentsContext();

  const mockAttachments = [
    { id: "1", name: "invoice.pdf", url: "https://api.example.com/file/1" },
    { id: "2", name: "report.pdf", url: "https://api.example.com/file/2" },
    { id: "3", name: "chart.pdf", url: "https://api.example.com/file/3" }
  ];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
        Download Message Attachments
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
          Status: {isProcessing ? "📥 Processing..." : "✅ Ready"}
        </Text>
        <Button
          title={isProcessing ? "Pause" : "Resume"}
          onPress={isProcessing ? pauseProcessing : resumeProcessing}
        />
      </View>

      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
        Attachments
      </Text>

      <FlatList
        data={mockAttachments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              marginBottom: 8,
              backgroundColor: "#f0f0f0",
              borderRadius: 8
            }}
          >
            <Text style={{ marginBottom: 8 }}>{item.name}</Text>
            <Button
              title="Download Now"
              onPress={() => downloadFileFromMessage(item)}
            />
          </View>
        )}
      />
    </View>
  );
}
```

---

## Key Design Patterns

### 1. Proxy-Based State Management

Why use Proxy instead of useState?

```typescript
// ❌ Problem with useState:
const [shouldStop, setShouldStop] = useState(false);
// Inside processQueue loop - infinite re-renders!

// ✅ Solution with Proxy:
let shouldStopProxy = useRef(new Proxy({ shouldStop: false }, { ... }));
// Proxy updates without triggering re-renders
// Can check flag synchronously inside async loop
```

**Use Case**: Need to signal async function to stop without triggering component re-render.

### 2. Ref-Based Queue

Why use useRef instead of useState?

```typescript
// ❌ Problem with useState:
const [queue, setQueue] = useState([]);
// Each state update = render cycle = performance hit

// ✅ Solution with useRef:
const queueRef = useRef([]);
// Mutations don't trigger renders
// Direct array operations (unshift, shift) are instant
```

**Use Case**: High-frequency mutations on array that doesn't need to trigger UI updates.

### 3. Priority Queue with unshift()

```typescript
// When user clicks "Download Now":
addCommand(priorityFile); // unshift adds to BEGINNING
// Queue now: [priorityFile, file1, file2, file3]
// priorityFile downloads first!
```

### 4. Pause/Resume Pattern

```typescript
// Pause signal
shouldStopProxy.shouldStop = true;
// Loop checks flag:
if (shouldStopProxy.shouldStop) break;

// Resume: just continue from same queue state
// No data loss - items still in queueRef
```

---

## Performance Considerations

| Aspect            | Implementation               | Benefit                          |
| ----------------- | ---------------------------- | -------------------------------- |
| **Queue Speed**   | Ref-based with unshift/shift | O(1) operations                  |
| **Cache Check**   | FileSystem.getInfoAsync      | Prevents redundant downloads     |
| **Sequential DL** | One file at a time           | Predictable bandwidth usage      |
| **State Updates** | Proxy (no re-renders)        | Smooth pause/resume              |
| **File Size**     | Base64 encoding              | Safe storage in cache            |
| **Memory**        | Stream-based processing      | No loading entire file in memory |

---

## Troubleshooting Guide

### Issue: Downloads not starting

```
Check [File Processing] logs:
1. "No items in queue, processing not started"
   → No attachments found
2. "Attachments length 0"
   → Network request for messages failed
3. Missing logs completely
   → useDownloadMessageAttachments hook not called
```

**Fix**: Ensure hook is called in component:

```typescript
function Screen() {
  useDownloadMessageAttachments();  // ← Must be called
  return <View />;
}
```

### Issue: Files not appearing in cache

```
Check:
1. ATTACHMENTS_DIR path exists
   → FileSystem.cacheDirectory/attachments/
2. File permissions
   → Android: uses app cache directory (auto)
   → iOS: uses app cache directory (auto)
3. File extension extraction
   → "document.pdf" → "pdf" ✓
   → "document" → undefined ✗
```

**Fix**: Ensure filenames have extensions in mock data.

### Issue: Authentication errors

```
Error: "Download file error: 401"
→ Check getAuthToken() returns valid JWT
→ Verify token not expired
→ Check Authorization header format: "Bearer <token>"
```

### Issue: Memory leaks

```
Ensure:
1. Context properly unmounts when component unmounts
2. No infinite loops in processQueue
3. File references don't persist after download
```

---

## Presentation Talking Points

### 1. Opening (Business Value)

> "The Download Message Attachments System solves a critical healthcare challenge: users need instant, secure access to medical documents shared within our messaging platform. Without this feature, users must manually manage file downloads, consuming bandwidth and creating security risks."

### 2. Problem Demonstration

Show scenario:

- User receives 5 message attachments
- Without system: User must manually tap each → wait for download → view
- With system: All files download automatically in background → instant viewing

### 3. Architecture Walk-Through

```
"The system uses three layers:
1. Context Layer - manages state and queue
2. Hook Layer - triggers automatic downloads
3. Utility Layer - handles file operations

Think of it like a smart postal system:
- Context = Post office (manages deliveries)
- Hook = Mail carrier (knows when to deliver)
- Utilities = Roads (handle delivery logistics)"
```

### 4. Key Features Highlight

- **✅ Automatic**: Starts when network available
- **✅ Smart**: Doesn't re-download existing files
- **✅ Prioritized**: User downloads interrupt background queue
- **✅ Resilient**: Resumes on network restoration
- **✅ Secure**: Authenticated API calls

### 5. Demo Flow

1. Show app starting (no network)
2. Enable network → automatic downloads start
3. Check console logs showing progress
4. User taps "Download Now" → background pauses, user file downloads first
5. User file downloaded → background resumes
6. Show cached files in device storage

### 6. Implementation Complexity

Show comparison:

```
Without system:
- Manual file management
- Bandwidth waste on re-downloads
- Poor user experience
- Security concerns

With system:
- Automated workflow
- Smart caching
- Seamless background processing
- Secure authenticated access
```

### 7. Closing

> "This system demonstrates how intelligent queue management and network-aware processing can create seamless user experiences in healthcare applications. The architecture is modular enough to adapt to other queue-based features in the platform."

---

## Additional Resources

### Related Documentation

- Authentication: `/docs/technical/en/authentication.md`
- API Integration: `/docs/technical/en/api-integration.md`
- File Management: `/utils/files.ts`
- State Management: `/store/`

### Dependencies Documentation

- [Expo File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [React Native Blob Util](https://github.com/RonRadtke/react-native-blob-util)
- React Context API

### Code Files Structure

```
├── contexts/
│   └── downloadMessageAttachments.tsx     (Main provider)
├── hooks/
│   └── useDownloadMessageAttachments.tsx  (Auto-trigger)
├── utils/
│   └── files.ts                          (File operations)
├── constants/
│   └── File.ts                           (Paths & config)
├── models/
│   └── Attachment.ts                     (Data model)
└── app/
    └── _layout.tsx                       (Provider wrapper)
```

---

**Document Version**: 1.0
**Last Updated**: January 26, 2026
**For**: Presentation & Demo App Implementation
