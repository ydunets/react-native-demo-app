# File Loading Scenarios Documentation

This documentation describes three key scenarios for file loading in the React Native/Expo application with attachment download queue functionality.

## Scenarios Overview

### [Scenario 1: Basic Queue File Loading](./scenario-1-basic-queue.md)
**Basic sequential file processing through managed queue system**
- Queue initialization and file deduplication
- Sequential download processing with progress tracking
- Cache management and completion handling
- Error recovery and network condition handling

### [Scenario 2: Background/Foreground File Loading](./scenario-2-background-foreground.md)
**File loading behavior during app state transitions**
- Automatic download pausing when app goes to background
- State preservation using MMKV persistent storage
- Seamless resumption when returning to foreground
- Resource management and battery efficiency

### [Scenario 3: Accelerated Loading via Message Attachments](./scenario-3-accelerated-loading.md)
**Priority download mechanism for immediate file access**
- Cache-first strategy for instant file opening
- Queue pausing and priority download processing
- Automatic queue resumption after completion
- User-initiated priority handling with cancellation

## Technical Architecture

### Key Components
- **Queue Management**: `stores/downloadQueue/valtioState.ts`
- **Progress Tracking**: `stores/downloadProgress/downloadProgressStore.ts`
- **App State Monitoring**: `hooks/useAppState.tsx`
- **File Operations**: `lib/files.ts` (Expo File System v17+)
- **Download Coordination**: `hooks/useDownloadMessageAttachments.tsx`

### Core Features
- **Persistent Queue**: Valtio + MMKV via `subscribe` for cross-session persistence
- **Smart Caching**: Filename-based deduplication and cache checking
- **Priority System**: Immediate downloads with cancellation support
- **Local State**: Active download task stored in a ref
- **Background Handling**: Automatic pause/resume based on app state
- **Authentication**: Bearer token injection for secure file access

## Implementation Highlights

### Queue Processing Flow
```
File Request → Cache Check → Queue Addition → Sequential Processing
     ↓             ↓            ↓                    ↓
Priority → Immediate Open → Background Process → Progress Updates
```

### State Management
- **Global State**: Persistent download queue and progress tracking
- **Local State**: Processing queue management with React refs
- **App State**: Real-time monitoring with automatic pause/resume

### Network Optimization
- Single file download at a time to prevent device overload
- Authentication token injection for secure API access
- Progress callbacks with real-time user feedback
- Network condition awareness with proper error handling

## Use Cases

### Normal Queue Processing
Perfect for batch downloading of multiple files where user can wait for sequential completion.

### Background Interruption
Handles real-world scenarios where users switch apps or lock device during downloads.

### Immediate Access
Provides instant gratification when users need specific files immediately, regardless of queue status.

---

**Related Documentation:**
- [Download Attachments Technical Guide](../download-attachments/)
- [API Integration Documentation](../../api/)
- [State Management Patterns](../../stores/)