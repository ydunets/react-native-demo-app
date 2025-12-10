function MessageScreen() {
  useDownloadMessageAttachments(); // Hook will auto-start queue
  const { downloadFileFromMessage } = useDownloadMessageAttachmentsContext();

  return (
    <Button
      onPress={() => downloadFileFromMessage(attachment)}
      title="Download Now"
    />
  );
}# Feature Documentation: Download Message Attachments

---

## What Problem Does It Solve?

**Value Proposition & Business Context**

- **Primary Problem:** Users need to access and view message attachments (documents, images, files) sent within the healthcare messaging system, but mobile devices require local file access for viewing and sharing attachments.
- **Business Value:** Enables healthcare providers and patients to seamlessly access critical documents, medical records, images, and other files shared through the messaging system, improving care coordination and communication efficiency.
- **User Pain Points Addressed:**
  - Eliminates the need for users to manually download each attachment
  - Provides offline access to previously downloaded attachments
  - Handles network connectivity issues gracefully with retry mechanisms
  - Prevents duplicate downloads and storage waste
- **Technical Challenges Solved:**
  - Manages authenticated API calls for secure file downloads
  - Implements intelligent queueing system for batch downloads
  - Handles file system operations and storage management
  - Provides background processing without blocking the UI

---

## How Is It Accessed and Used?

**Implementation Details & User Journey**

### Access Methods

- **Entry Points:**
  - Automatically triggered when viewing message lists with attachments
  - Manual download when tapping on individual attachment items in message details
  - Background processing when app becomes active and network is available
- **Prerequisites:**
  - User must be authenticated with valid access tokens
  - Device must have sufficient storage space
  - Network connectivity required for initial downloads
- **Permissions Required:**
  - File system read/write permissions
  - Network access permissions
  - Authentication via Keycloak OIDC tokens

### Key Usage Steps

1. **Automatic Background Download:** When user views messages, the system automatically queues attachments from the last 50 messages for download
2. **Queue Processing:** The system processes downloads in the background, respecting network connectivity and app state
3. **File Storage:** Downloaded files are saved to device cache with unique identifiers and proper file extensions
4. **User Interaction:** When user taps an attachment, the system either opens the locally cached file or initiates immediate download
5. **Document Viewing:** Uses native document viewer to display downloaded files with proper headers and titles

### Integration Points

- **UI Components:**
  - `AttachmentItem` components in message details
  - `AttachmentList` for displaying multiple attachments
  - Loading indicators during download process
- **Data Flow:**
  - Messages API provides attachment metadata
  - Download queue manages file processing
  - Local file system stores downloaded content
  - Document viewer handles file presentation

---

## Known Limitations and Prerequisites

**Important Considerations & Requirements**

### Current Limitations

- **Functional Limitations:**
  - Only downloads attachments from the most recent 50 messages
  - No support for resuming interrupted downloads
  - No file size limits or warnings implemented
  - Limited to file types supported by native document viewer
- **Performance Constraints:**
  - Downloads process sequentially, not in parallel
  - Large files may impact app performance during download
  - No compression or optimization for bandwidth usage
- **Platform Restrictions:**
  - Relies on device's native document viewing capabilities
  - File storage limited to app's cache directory
  - iOS and Android may handle certain file types differently
- **Scalability Considerations:**
  - Queue processing could become inefficient with large numbers of attachments
  - No cleanup mechanism for old cached files
  - Memory usage may increase with large attachment queues

---

## Technical Implementation Details

**Architecture & Code Structure**

### Key Components

- **Files/Modules:**
  - `/contexts/downloadMessageAttachments.tsx` - Main context provider for download functionality
  - `/hooks/useDownloadMessageAttachments.tsx` - Hook for managing automatic downloads
  - `/models/Attachment.ts` & `/models/MhaAttachment.ts` - Attachment data models
  - `/utils/files.ts` - File system utility functions
  - `/constants/File.ts` - File-related constants and directories
- **Dependencies:**
  - `expo-file-system` - File system operations and directory management
  - `react-native-blob-util` - HTTP requests for file downloads
  - `@react-native-documents/viewer` - Native document viewing
  - `@react-native-community/netinfo` - Network connectivity detection
- **Configuration:**
  - `ATTACHMENTS_DIR` - Cache directory for downloaded files
  - API endpoints configured via dashboard service paths
  - Authentication tokens from secure storage

### Code Examples

```typescript
// Download Context Usage
const { downloadFileFromMessage, isProcessing } =
  useDownloadMessageAttachmentsContext();

// Manual download of specific attachment
const handleDownloadAttachment = async (attachment: Attachment) => {
  const success = await downloadFileFromMessage(attachment);
  if (success) {
    // Open the downloaded file
    await viewDocument({
      uri: getAttachmentFilePath(attachment),
      headerTitle: attachment.name
    });
  }
};

// Automatic background download setup
export const useDownloadMessageAttachments = () => {
  const { addCommand, startProcessing, resetQueue } =
    useDownloadMessageAttachmentsContext();
  const { attachments } = useAllMessages({ limit: "50" });

  const addFilesToProcessingQueue = useCallback(
    async (attachments) => {
      resetQueue();
      for (const attachment of attachments) {
        const filename = `${attachment?.id}.${getExtension(attachment?.name ?? "txt")}`;
        const path = `${ATTACHMENTS_DIR}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(path);

        if (!attachment?.url || fileInfo.exists) continue;

        addCommand({
          url: attachment.url,
          filename: attachment.name,
          id: attachment.id
        });
      }
    },
    [addCommand, resetQueue]
  );
};

// File download implementation
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  const accessToken = await getAuthToken();
  await makeDirectory(ATTACHMENTS_DIR);

  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;
  const fileInfo = await FileSystem.getInfoAsync(path);

  if (fileInfo.exists) return true;

  const response = await RNFetchBlob.fetch(
    "POST",
    `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
    {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json, text/plain, */*",
      "Content-Type": "text/plain"
    },
    url
  );

  const base64 = await response.base64();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return response.respInfo.status < 400;
};
```

### Queue Management Architecture

```typescript
// Processing queue with proxy-based control
const useManageProcessingQueue = () => {
  let queueRef = useRef<DownloadCommand[]>([]);
  let shouldStopProxy = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => Reflect.get(target, prop),
        set: (target, prop, value) => Reflect.set(target, prop, value)
      }
    )
  );

  const processQueue = async () => {
    setIsProcessing(true);
    while (queueRef.current.length) {
      const result = await downloadFile(queueRef.current[0]);
      if (!result || shouldStopProxy.current.shouldStop) break;
      queueRef.current.shift();
    }
    setIsProcessing(false);
  };
};
```

### File System Integration

```typescript
// File path generation and management
export const getAttachmentFilePath = (attachment: Attachment) =>
  `${ATTACHMENTS_DIR}${attachment.id}.${getExtension(attachment.name)}`;

export const makeDirectory = async (directoryUri: string) => {
  const directoryExists = await checkIfDirectoryExists(directoryUri);
  if (!directoryExists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
};

// Network-aware download triggering
useEffect(() => {
  if (attachments.length && isAppStateActive(appState) && isConnected) {
    startDownloads();
  }
}, [attachments.length, appState, isConnected]);
```

---

**Note:** This feature integrates seamlessly with the React Native healthcare messaging system, providing robust file management capabilities while maintaining security through authenticated API calls and proper error handling mechanisms.
