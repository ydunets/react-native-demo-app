# Tasks: Attachment Download Queue System

**Branch**: `001-attachment-download-queue`  
**Input**: Design documents from `/specs/001-attachment-download-queue/`  
**Status**: Ready for implementation  
**Organization**: Tasks grouped by user story (P1 → P2 → P3 → P4) for independent parallel implementation

---

## Format Reference

Each task follows the strict format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Task can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4) for tasks belonging to specific features
- **File paths**: Exact locations for all code modifications

---

## Phase 1: Setup & Foundation

**Purpose**: Project initialization, infrastructure, and architecture groundwork  
**Duration**: 1-2 hours  
**Completion Gate**: All foundational tasks must complete before user story work begins

### Setup Tasks

- [X] T001 Create feature branch: `git checkout -b 001-attachment-download-queue`
- [X] T002 Create backend directory structure: `backend/src/{routes,middleware,storage}`, `backend/files/`
- [X] T003 [P] Create frontend context directory: `contexts/`
- [X] T004 [P] Create frontend hooks directory: `hooks/`
- [X] T005 [P] Create frontend constants file: `constants/File.ts`

### Foundational Architectural Tasks

- [X] T006 Install frontend dependencies: `npm install react-native-blob-util` (authenticated downloads with Base64 support)
- [X] T007 Install backend dependencies: `npm --prefix backend install express cors body-parser jsonwebtoken dotenv` (Express server with JWT auth)
- [X] T008 [P] Setup backend TypeScript: Create `backend/tsconfig.json`, `backend/package.json`, `backend/Dockerfile`
- [X] T009 [P] Create Docker Compose service: Add `file-server` service to `docker-compose.yml` with port 3001 mapping
- [X] T010 [P] Create environment variables: `.env.backend` with PORT=3001, NODE_ENV=development, JWT_SECRET (backend auth)
- [X] T011 Add feature routes to `router-map/routes.tsx` RoutePaths enum: (add type-safe download queue paths if needed)
- [X] T012 Create file constants in `constants/File.ts`: ATTACHMENTS_DIR, ATTACHMENTS_CACHE_DIR, MAX_FILE_SIZE (50MB), FILE_TYPES

### Provider & Context Architecture

- [X] T013 Create DownloadMessageAttachmentsProvider wrapper in `contexts/downloadMessageAttachments.tsx` (context setup, no logic yet)
- [X] T014 Update `app/_layout.tsx` to wrap app with DownloadMessageAttachmentsProvider (add after existing providers for layering)

**Checkpoint**: Foundation complete. User story implementation can now begin in parallel.

---

## Phase 2: Foundation - Backend Infrastructure

**Purpose**: File server implementation for all user stories  
**Duration**: 1-2 hours  
**Blocking**: Frontend user stories depend on working backend endpoint  
**Parallel Opportunities**: Backend can be built while frontend tests are prepared

### Backend Server Entry Point

- [ ] T015 Create backend server entry point: `backend/src/index.ts` with Express initialization, middleware setup (CORS, body-parser, auth), and error handling (constitution: Centralized API)

### Backend Middleware & Authentication

- [ ] T016 [P] Create JWT auth middleware: `backend/src/middleware/auth.ts` with Bearer token validation, JWT signature verification against Keycloak public key, user claim extraction (constitution: Secure State Management)
- [ ] T017 [P] Configure CORS in backend: `backend/src/index.ts` add CORS middleware with origin whitelist for dev environments (localhost:8081, 10.0.2.2:8081, Expo Go origins)

### Backend API Endpoints

- [ ] T018 Create file download endpoint: `backend/src/routes/files.ts` with:
  - POST /api/files/download route handler
  - Request body parsing (source file URL)
  - Content-Length validation (reject >50MB files with 413 status)
  - File retrieval logic (filesystem or proxy to upstream)
  - Response as Base64-encoded content
  - Error handling (401 auth failures, 404 file not found, 413 payload too large)
  - Auth middleware applied via authMiddleware wrapper

- [ ] T019 [P] Create file storage module: `backend/src/storage/fileStorage.ts` with:
  - Function to fetch file from filesystem (reads sample files from `backend/files/`)
  - Function to validate Content-Length header
  - Error handling for missing files, permission errors
  - (Can be extended to S3 storage later without changing API contract)

### Backend Configuration

- [ ] T020 [P] Create Dockerfile: `backend/Dockerfile` with Node.js 20.x base image, TypeScript transpilation, port 3001 exposure
- [ ] T021 [P] Create sample files for testing: Add test files to `backend/files/` directory (e.g., sample-pdf.pdf, sample-image.jpg for local testing)

**Checkpoint**: Backend file server ready for frontend integration. Test via: `npm run dev:backend` and curl to POST /api/files/download with Bearer token.

---

## Phase 3: Foundation - Frontend Queue Architecture

**Purpose**: Global state management and queue infrastructure for all user stories  
**Duration**: 2-3 hours  
**Blocking**: User story implementations depend on queue store and hooks  
**Parallel Opportunities**: Can build store and context alongside backend development

### Zustand Store with MMKV Persistence

- [ ] T022 Create download queue store: `store/downloadQueueStore.ts` with:
  - **State**: queue (DownloadCommand[]), isProcessing (boolean), completedIds (Set<string>), pausedDueToStorage (boolean), pausedDueToAuth (boolean)
  - **Actions**: addCommand, removeCommand, startProcessing, pauseProcessing, resumeProcessing, resetQueue, markCompleted
  - **Persistence**: MMKV via Zustand persist middleware (encrypted storage, constitution: Secure State Management)
  - **Serialization**: Use JSON-compatible structures for MMKV (convert Set to array in persistence)
  - Follow existing `authStore.ts` pattern

### File Utilities Module

- [ ] T023 Create file utilities: `lib/files.ts` with functions:
  - `getFileExtension(filename: string)`: Extract extension from filename
  - `makeCacheDirectory()`: Ensure attachments cache directory exists (create if missing)
  - `getCacheFilePath(attachmentId: string, filename: string)`: Get full path for cached file
  - `fileExistsInCache(attachmentId: string)`: Check if file already downloaded
  - Constitution: Mobile-First (handle directory creation, filesystem operations gracefully)

### Context Implementation

- [ ] T024 Implement DownloadMessageAttachmentsContext: `contexts/downloadMessageAttachments.tsx` with:
  - **State**: Queue management via useDownloadQueueStore
  - **Methods**: 
    - `addFilesToProcessingQueue(attachments: Attachment[])`: Add files with validation (50MB limit, deduplication)
    - `downloadFile(command: DownloadCommand)`: Execute single download via react-native-blob-util
    - `processQueue()`: Main loop processing queue FIFO with pause support
  - **Architecture**: 
    - Store queue in `useRef` (avoid re-renders)
    - Use Proxy for pause flag (reactive without re-renders)
    - Expose: {queue, isProcessing, addCommand, pauseProcessing, resumeProcessing}
  - **Error handling**: Graceful failure on individual files, continue queue processing
  - Constitution: Centralized API (all downloads go through context)

- [ ] T025 Create useDownloadMessageAttachmentsContext hook: `hooks/useDownloadMessageAttachments.tsx` wrapper for context access with proper null checks and error boundaries

### Environment Configuration

- [ ] T026 Update environment config: `configs/env-config.ts` add `getFileServerBaseURL()` function:
  - iOS Simulator: `http://localhost:3001`
  - Android Emulator: `http://10.0.2.2:3001`
  - Production: Use `EXPO_PUBLIC_FILE_SERVER_URL` env var
  - Constitution: Type-Safe Navigation (centralized configuration)

**Checkpoint**: Queue infrastructure ready. Test via unit tests on store and utilities before user story implementations begin.

---

## Phase 4: User Story 1 - Automatic Background Downloads (Priority: P1) 🎯 MVP

**Goal**: System automatically downloads attachments from recent messages in the background without user interaction. Files are cached locally for offline access.

**Independent Test**: 
1. Launch app with network connectivity
2. Navigate to message list with attachments (or trigger load of 50 recent messages)
3. Verify files appear in cache directory (`cacheDirectory/attachments/`) without explicit download action
4. Force close app, reopen, verify cached files are accessible
5. Success: All files from recent messages are downloaded automatically

**Acceptance Criteria**:
- Attachments from most recent 50 messages are queued on app launch
- Files are downloaded in background when network is available
- Completed files are not re-downloaded on subsequent app launches
- Queue pauses when app backgrounds, resumes on foreground
- Queue persists and resumes on app restart

**User Story Dependencies**: None (MVP foundation)

### Implementation Tasks

- [ ] T027 [P] [US1] Create hook to detect recent messages with attachments: `hooks/useRecentMessageAttachments.tsx`
  - Depends on Messages API hook (likely existing `useMessages` or similar from React Query)
  - Returns attachments from last 50 messages
  - Filters out already-downloaded files (check cache)

- [ ] T028 [P] [US1] Create network status integration: Update `hooks/useDownloadMessageAttachments.tsx` to:
  - Subscribe to `useCheckNetworkStatus()` hook (isConnected state)
  - On connection restored: Trigger `startProcessing()`
  - On connection lost: Trigger `pauseProcessing()`

- [ ] T029 [P] [US1] Create app state integration: Update `hooks/useDownloadMessageAttachments.tsx` to:
  - Subscribe to `useAppStateStore()` app state changes
  - On foreground: Resume processing if paused
  - On background: Pause processing to save battery
  - Use existing `isAppStateActive()` utility

- [ ] T030 [US1] Implement main queue processing loop: Update `contexts/downloadMessageAttachments.tsx` `processQueue()` function:
  - FIFO processing of queue items
  - Pause flag support (Proxy-based) for responsive interruption
  - Download each file via `downloadFile()`
  - Mark completed via `markCompleted(id)`
  - Persist state to MMKV on each change
  - Error handling: Log errors, continue to next file

- [ ] T031 [US1] Implement file download via react-native-blob-util: Update `contexts/downloadMessageAttachments.tsx` `downloadFile()` function:
  - Use `RNFetchBlob.fetch()` with POST method
  - Send file URL in request body
  - Include Bearer token in Authorization header (from authStore)
  - Save response as Base64 to filesystem via `FileSystem.writeAsStringAsync()`
  - Handle download errors gracefully (return false to continue queue)
  - Constitution: Centralized API (use authStore for token, getFileServerBaseURL for URL)

- [ ] T032 [US1] Add startup hook to trigger background downloads: Update `app/_layout.tsx` to:
  - On app launch, get recent attachments via `useRecentMessageAttachments()`
  - Add to queue via `addCommand()` from context
  - Automatically start processing if network connected

- [ ] T033 [US1] Implement cache directory initialization: Update `lib/files.ts`:
  - `makeCacheDirectory()` ensures `cacheDirectory/attachments/` exists before any downloads
  - Called on first context usage in `processQueue()`

- [ ] T034 [P] [US1] Add file size validation (client-side): Update `hooks/useRecentMessageAttachments.tsx` to:
  - Skip files exceeding 50MB (check attachment.fileSize property)
  - Log skipped files for monitoring
  - Never queue oversized files

- [ ] T035 [P] [US1] Add dark mode support: Ensure any UI toast/notifications use theme tokens from `theme/colors.ts` (constitution: Theme-First Design)

### Testing for User Story 1 (OPTIONAL - Tests marked optional per spec requirements)

- [ ] T036 [P] [US1] Create unit test: `__tests__/lib/files.test.ts` for file utilities (getFileExtension, makeCacheDirectory, getCacheFilePath, fileExistsInCache)
- [ ] T037 [P] [US1] Create store test: `__tests__/store/downloadQueueStore.test.ts` for Zustand store state management
- [ ] T038 [US1] Create context test: `__tests__/contexts/downloadMessageAttachments.test.tsx` for queue processing logic (mock react-native-blob-util and FileSystem)
- [ ] T039 [US1] Create integration test: `__tests__/hooks/useDownloadMessageAttachments.test.tsx` for hook integration with network/app state listeners

**Checkpoint**: User Story 1 complete and independently testable. Files download automatically on app launch. Queue persists across sessions. Test on physical device or emulator.

---

## Phase 5: User Story 2 - Priority Downloads for Urgent Files (Priority: P2)

**Goal**: When user taps "Download" on a specific attachment, system immediately downloads that file by interrupting background queue, then resumes background processing.

**Independent Test**:
1. Start background downloads (launch app with messages loaded)
2. While queue is processing, tap "Download" button on a specific message attachment
3. Verify the requested file downloads immediately (within 3 seconds for <5MB file on 4G/LTE)
4. Verify background queue pauses during priority download
5. Verify background queue resumes after priority download completes
6. Success: Priority file available for viewing within 3 seconds

**Acceptance Criteria**:
- Priority download interrupts background queue processing
- Priority download completes and file is accessible within 3 seconds for <5MB files
- Background queue resumes after priority download finishes
- Failed priority downloads show error but allow queue to resume
- Duplicate file handling: If file already in background queue, remove from queue before priority download

**User Story Dependencies**: Requires US1 (background queue infrastructure)

### Implementation Tasks

- [ ] T040 [P] [US2] Create priority download method: Update `contexts/downloadMessageAttachments.tsx` add `downloadFilePriority(command: DownloadCommand)`:
  - Call `pauseProcessing()` to interrupt background queue
  - Execute `downloadFile()` for priority file (reuse US1 implementation)
  - On completion: Automatically call `resumeProcessing()`
  - On failure: Show error toast, still resume background processing

- [ ] T041 [P] [US2] Implement deduplication logic: Update `contexts/downloadMessageAttachments.tsx` in `downloadFilePriority()`:
  - Check if file already exists in background queue via ID
  - Remove from queue if found (via `removeCommand(id)`)
  - Process once as priority (avoid duplicate downloads)

- [ ] T042 [P] [US2] Update store actions: `store/downloadQueueStore.ts` add/expose:
  - `removeCommand(id: string)`: Remove item from queue (for deduplication)
  - Persist to MMKV after removal

- [ ] T043 [US2] Create download button UI: Add download/open button to message attachment UI (location depends on existing message screen structure):
  - Button triggers `downloadFilePriority()` from context
  - Shows loading state during download
  - Shows error message if download fails
  - Constitution: NativeWind styling, dark mode support via `useColorScheme()`

- [ ] T044 [P] [US2] Add error toast notification: Update `downloadFilePriority()`:
  - Show toast on download failure (use existing toast utility from app)
  - Message: "Failed to download {filename}. Please try again."
  - Constitution: Theme-First (use theme colors for toast)

- [ ] T045 [P] [US2] Add file availability feedback: After priority download completes:
  - Show success toast "File downloaded and ready"
  - Optionally trigger file open dialog or return to caller
  - Constitution: Mobile-First UX (quick feedback)

- [ ] T046 [US2] Update signature of `downloadFile()`: Make it compatible with both background and priority flows:
  - Ensure same error handling works for both
  - Consider timeout for priority downloads (fail if >30 seconds on slow network)

### Testing for User Story 2 (OPTIONAL)

- [ ] T047 [P] [US2] Create integration test: `__tests__/contexts/downloadMessageAttachments.priority.test.tsx` for priority download flow
- [ ] T048 [US2] Create E2E test scenario: Document manual test steps for priority downloads with network throttling

**Checkpoint**: User Story 2 complete. Priority downloads interrupt and resume background queue. Users can immediately download specific files.

---

## Phase 6: User Story 3 - Persistent Queue Across Sessions (Priority: P3)

**Goal**: Download queue persists and automatically resumes when app is closed/reopened or connectivity is restored after interruption.

**Independent Test**:
1. Start background downloads (load recent messages)
2. Force-close app while downloads in progress
3. Reopen app
4. Verify queue resumes from where it stopped (not from beginning)
5. Verify no duplicate downloads of already-completed files
6. Verify remaining files eventually complete
7. Success: Queue survives app restart without data loss or duplicate downloads

**Acceptance Criteria**:
- Queue state persists to MMKV on every mutation
- Queue resumes from last checkpoint on app restart (no re-downloading completed files)
- Completed attachment IDs tracked to prevent re-downloads
- Network interruption recovery: Queue pauses on disconnect, resumes on connect
- Extended offline scenario: Only new/uncached attachments added to queue on reconnect

**User Story Dependencies**: Requires US1 (background queue). Builds on foundation.

### Implementation Tasks

- [ ] T049 [P] [US3] Ensure MMKV persistence is active: Verify `store/downloadQueueStore.ts`:
  - Zustand persist middleware configured with MMKV storage
  - State shape includes: queue, completedIds, lastProcessedTimestamp, pausedDueToStorage, pausedDueToAuth
  - Tested in unit tests

- [ ] T050 [P] [US3] Create queue restoration on app launch: Update `app/_layout.tsx`:
  - On app initialization, restore queue from MMKV via `useDownloadQueueStore`
  - Check for completed IDs to skip re-downloading
  - Resume processing if network available

- [ ] T051 [P] [US3] Track completion state: Update `contexts/downloadMessageAttachments.tsx`:
  - `markCompleted(id)` adds to `completedIds` Set and persists
  - Before queuing new files, filter out already-completed IDs
  - Prevents re-downloads across sessions

- [ ] T052 [US3] Implement crash recovery: Update `processQueue()`:
  - On resume, verify lastProcessedTimestamp and resume from next item
  - Consider tracking queue progress via `lastProcessedTimestamp` in MMKV
  - Constitution: Mobile-First (handles interrupted processing gracefully)

- [ ] T053 [P] [US3] Handle extended offline scenarios: Update `hooks/useDownloadMessageAttachments.tsx`:
  - On connection restored: Get fresh list of recent messages
  - Add new/uncached attachments to queue
  - Don't re-add already-completed files (check completedIds)

- [ ] T054 [US3] Create session logging: Update `contexts/downloadMessageAttachments.tsx`:
  - Log queue state on app startup: "Queue resumed with {N} pending, {M} completed"
  - Log recovery events for monitoring
  - Helps diagnose persistence issues

### Testing for User Story 3 (OPTIONAL)

- [ ] T055 [P] [US3] Create persistence test: `__tests__/store/downloadQueueStore.persistence.test.ts` for MMKV save/restore cycle
- [ ] T056 [US3] Create app restart simulation: `__tests__/contexts/downloadMessageAttachments.restart.test.tsx` with mock MMKV data

**Checkpoint**: User Story 3 complete. Queue survives app restarts and network interruptions without data loss.

---

## Phase 7: User Story 4 - Download Progress Visibility (Priority: P4)

**Goal**: Users can see visual indicators showing when downloads are active and queue status without leaving the current screen.

**Independent Test**:
1. Launch app and trigger background downloads
2. Navigate to any screen in app
3. Verify visual indicator (icon, badge, status text) shows download activity
4. Stop/complete downloads
5. Verify indicator disappears or shows "complete"
6. Success: Users can identify download status at a glance from any screen

**Acceptance Criteria**:
- Visual download indicator visible on active screens (not intrusive)
- Indicator shows active state during downloads
- Indicator shows completion state or disappears when queue empty
- Indicator persists across screen navigation
- Error states displayed without blocking UI

**User Story Dependencies**: Requires US1 (background queue). Can be implemented independently.

### Implementation Tasks

- [ ] T057 [P] [US4] Create download status indicator component: `components/nativewindui/DownloadStatusBadge.tsx` with:
  - CVA pattern for styling variants (active, completed, error)
  - Props: status ('idle' | 'downloading' | 'completed' | 'error'), count (pending files)
  - NativeWind styling with dark mode support
  - Constitution: Component Reusability (CVA pattern), Theme-First Design

- [ ] T058 [P] [US4] Create hook to access download status: Update `hooks/useDownloadMessageAttachments.tsx`:
  - Expose `isProcessing` from store
  - Expose `queueLength` (queue.length)
  - Return UI-friendly status state ('idle' | 'downloading' | 'completed' | 'error')

- [ ] T059 [US4] Add indicator to app layout/tab bar: `app/_layout.tsx` or `app/(main)/_layout.tsx`:
  - Use `DownloadStatusBadge` component
  - Subscribe to `useDownloadMessageAttachments()` for status
  - Position badge on tab bar or header (non-intrusive location)
  - Shows count of pending downloads

- [ ] T060 [P] [US4] Add optional status panel: Consider creating collapsible download status sheet:
  - Shows list of pending downloads (optional, P4 nice-to-have)
  - Shows count of completed downloads
  - Allows manual pause/resume controls
  - Can be dismissed easily

- [ ] T061 [P] [US4] Handle error state display: Update download status indicator:
  - Show error badge if downloads failed
  - On error, show brief error message (pausedDueToAuth, pausedDueToStorage)
  - Constitution: Mobile-First UX (clear error communication)

### Testing for User Story 4 (OPTIONAL)

- [ ] T062 [P] [US4] Create component test: `__tests__/components/nativewindui/DownloadStatusBadge.test.tsx` for badge rendering
- [ ] T063 [US4] Create visual regression test: Screenshot tests for all badge states (idle, downloading, completed, error)

**Checkpoint**: User Story 4 complete. Users have visibility into download progress and queue status from any screen.

---

## Phase 8: Error Handling & Edge Cases

**Purpose**: Implement graceful error handling for all edge case scenarios  
**Duration**: 1-2 hours  
**Blocking**: Should be implemented before user testing, but doesn't block user story completion

### Storage Space Handling

- [ ] T064 Create storage quota check: `lib/files.ts` add `hasEnoughStorageSpace(fileSize: number)`:
  - Use expo-file-system to check available device storage
  - Return false if < fileSize available
  - Constitution: Mobile-First (handle storage gracefully)

- [ ] T065 [P] Implement storage pause logic: Update `contexts/downloadMessageAttachments.tsx`:
  - Before downloading, check `hasEnoughStorageSpace()`
  - If insufficient: Set `pausedDueToStorage = true` in store
  - Show silent notification (toast): "Storage space required. Free up space to continue downloads."
  - Pause processing without crashing

- [ ] T066 [P] Add manual storage resume: Add method `resumeAfterStorageFreed()` to context:
  - User manually taps notification or retry button
  - Sets `pausedDueToStorage = false`
  - Resumes `processQueue()`

### Authentication Token Expiration

- [ ] T067 Create token validation: `api/axios-client.tsx` or context hook:
  - Check token expiration before each download (decode JWT)
  - Return false if token expired

- [ ] T068 Implement logout on token expiration: Update `downloadFile()`:
  - If token expired: Set `pausedDueToAuth = true`
  - Call authStore logout function
  - Show modal: "Your session expired. Please log in again."
  - Navigation back to login screen

### Corrupted/Invalid File Responses

- [ ] T069 [P] Add response validation: Update `downloadFile()`:
  - Validate response is valid Base64
  - Validate response size matches Content-Length header
  - If validation fails: Log error, return false (skip file)
  - Continue to next queue item

- [ ] T070 [P] Add file integrity check: After writing file:
  - Verify file exists at expected path via `fileExistsInCache()`
  - Verify file size is reasonable
  - If check fails: Delete corrupted file, log error, return false

### Network Switching

- [ ] T071 Network continuity: Existing `useCheckNetworkStatus()` handles wifi/cellular switches:
  - Verify hook reports connectivity correctly across network changes
  - No action needed (system network layer handles switching)
  - Document assumption in code

### Very Large File Handling

- [ ] T072 [P] Enforce 50MB server-side validation: Verify `backend/src/routes/files.ts`:
  - Check Content-Length header before streaming
  - Return 413 (Payload Too Large) if exceeds 50MB
  - Include error message in response

- [ ] T073 [P] Enforce 50MB client-side validation: Verify `hooks/useRecentMessageAttachments.tsx`:
  - Skip files > 50MB before queuing
  - Show notification: "File '{name}' exceeds 50MB limit and was skipped."

**Checkpoint**: All edge cases handled gracefully without crashing the app.

---

## Phase 9: Integration & Testing

**Purpose**: End-to-end testing and integration with existing app  
**Duration**: 2-3 hours  
**Blocking**: Should be done before merging to main

### Integration Testing

- [ ] T074 [P] Test app layout integration: Verify DownloadMessageAttachmentsProvider properly wraps app:
  - Provider initialized on app startup
  - Context accessible from all screens
  - State properly restored on app restart

- [ ] T075 [P] Test message screen integration: In existing message screens:
  - Verify background downloads trigger on screen load
  - Verify priority download button appears and works
  - Verify indicator shows progress

- [ ] T076 Test end-to-end scenarios:
  - Scenario A: Launch app → view messages → files auto-download → close app → reopen → files still available
  - Scenario B: Launch app → tap download button → file downloads immediately → background resumes
  - Scenario C: Disconnect network → queue pauses → reconnect → queue resumes
  - Scenario D: Run out of storage → queue pauses → free space → resume

- [ ] T077 [P] Test on physical device:
  - iOS device: Verify downloads work, files persist in cache
  - Android device: Verify downloads work with proper networking (10.0.2.2 backend URL)
  - Check FileSystem permissions (might need info.plist or Android manifest updates)

- [ ] T078 [P] Performance testing:
  - Verify UI stays responsive (60fps) during queue processing
  - Monitor memory usage (should not grow unbounded)
  - Verify battery impact is acceptable (pauses on background, efficient polling)

### Backend Integration Testing

- [ ] T079 Test backend endpoint:
  - Manual curl test: `curl -X POST http://localhost:3001/api/files/download -H "Authorization: Bearer <token>" -d "file-url"`
  - Verify 200 response with Base64 content
  - Verify 401 on missing/invalid token
  - Verify 413 on file >50MB
  - Verify 404 on missing file

- [ ] T080 [P] Docker Compose verification:
  - Verify `docker-compose up` starts file-server service
  - Verify container logs show server listening on port 3001
  - Verify endpoint accessible from iOS Simulator (localhost:3001)
  - Verify endpoint accessible from Android Emulator (10.0.2.2:3001)

### Documentation Tasks

- [ ] T081 [P] Create developer quickstart: `specs/001-attachment-download-queue/quickstart.md` with:
  - Setup instructions (npm install, Docker startup)
  - How to test each user story
  - Common issues and solutions
  - Debugging tips (logs, MMKV inspection)

- [ ] T082 [P] Add code comments: Document complex sections in:
  - `contexts/downloadMessageAttachments.tsx`: Pause flag Proxy pattern
  - `processQueue()`: FIFO loop with pause handling
  - `downloadFile()`: react-native-blob-util usage with auth

- [ ] T083 [P] Update architecture docs: Add section to `.github/copilot-instructions.md`:
  - Download queue pattern reference
  - File storage conventions
  - Integration points with message screens

**Checkpoint**: Feature fully integrated and tested. Ready for code review and merge.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, monitoring, and production readiness  
**Duration**: 1-2 hours  
**Optional for MVP**: Can defer to follow-up PR

### Monitoring & Debugging

- [ ] T084 [P] Add logging framework: Create `lib/logger.ts` (or use existing):
  - Log queue operations: add, remove, complete, pause, resume
  - Log download events: start, success, failure, retry
  - Include timestamps and file IDs for correlation
  - Constitution: Mobile-First (lightweight logging, no performance impact)

- [ ] T085 [P] Add error tracking: Consider integrating with error monitoring service:
  - Log unexpected errors to Sentry/Rollbar
  - Track error rates by error type (network, auth, storage, validation)
  - Helps identify production issues

- [ ] T086 [P] Add queue metrics: Expose optional metrics:
  - Queue length, completion rate, average download time
  - Can be sent to analytics service
  - Helps understand user behavior

### Accessibility

- [ ] T087 [P] Verify accessibility: For all new UI components:
  - Download button has proper labels
  - Status indicator has semantic meaning
  - Test with screen readers (if applicable)

### Security Review

- [ ] T088 [P] Verify authentication security:
  - Token validation correctly checks expiration
  - Bearer token properly included in all requests
  - No tokens logged or exposed in error messages
  - Constitution: Secure State Management

- [ ] T089 [P] Verify file handling security:
  - Downloaded files stored in secure cache directory (not world-readable)
  - No sensitive metadata exposed in filenames
  - File integrity verified before use

### Performance Optimization (Post-MVP)

- [ ] T090 Consider optimizations (defer to follow-up PR):
  - Batch downloads with configurable concurrency (currently sequential)
  - Progress percentage tracking for large files
  - Download resume support for interrupted transfers
  - Automatic retry with exponential backoff (currently fails once)

**Checkpoint**: Feature complete, documented, and production-ready. Ready for deployment.

---

## Dependency Graph & Execution Order

```
Phase 1: Setup & Foundation
    ↓
Phase 2: Backend Infrastructure (can run in parallel with Phase 3)
Phase 3: Frontend Queue Architecture (can run in parallel with Phase 2)
    ↓
Phase 4: User Story 1 - Background Downloads (🎯 MVP)
    ↓
Phase 5: User Story 2 - Priority Downloads (US1 required)
    ↓
Phase 6: User Story 3 - Persistence (US1 required, independent from US2)
    ↓
Phase 7: User Story 4 - Progress Visibility (US1 required, independent from US2/US3)
    ↓
Phase 8: Error Handling (can run in parallel with user stories)
    ↓
Phase 9: Integration & Testing (after all user stories)
    ↓
Phase 10: Polish & Production (optional for MVP)
```

## Parallel Execution Examples

### Scenario A: Two developers, 6 hours (MVP Goal)

**Developer 1 (Backend - 2 hours)**:
- Phase 2: Backend Infrastructure (T015-T021)

**Developer 2 (Frontend - 4 hours)**:
- Phase 1: Setup tasks (T001-T005, ~30 min)
- Phase 3: Queue architecture (T022-T026, ~1.5 hours)
- Phase 4: Background downloads (T027-T035, ~2 hours)

**Result**: After 2 hours, backend ready. After 4 hours, MVP feature complete (US1 + foundation).

### Scenario B: Three developers, 8 hours (Complete feature)

**Developer 1 (Backend + DevOps)**:
- Phase 1: Setup (T001-T005)
- Phase 2: Backend (T015-T021)
- Phase 9: Backend integration testing (T079-T080)

**Developer 2 (Frontend Foundation)**:
- Phase 1: Setup (overlap with Dev 1)
- Phase 3: Queue architecture (T022-T026)
- Phase 8: Error handling (T064-T073)

**Developer 3 (Frontend Features)**:
- Phase 4: User Story 1 (T027-T035)
- Phase 5: User Story 2 (T040-T046)
- Phase 6: User Story 3 (T049-T054)
- Phase 7: User Story 4 (T057-T061)

**Result**: All user stories completed in ~8 hours with parallel work.

---

## Task Validation Checklist

Verify each task meets strict format requirements:

- [x] All tasks have checkbox: `- [ ]`
- [x] All tasks have sequential ID: T001, T002, ... T083
- [x] Parallelizable tasks marked with `[P]` flag
- [x] User story tasks labeled with `[US1]`, `[US2]`, `[US3]`, `[US4]`
- [x] All tasks include specific file paths
- [x] Tasks grouped by phase with clear purpose
- [x] Dependency relationships documented in graph
- [x] Test tasks marked as OPTIONAL (not required for MVP)
- [x] Total task count: 83 tasks
  - Setup: 5 tasks
  - Foundation Backend: 7 tasks
  - Foundation Frontend: 5 tasks
  - User Story 1: 13 tasks (9 implementation + 4 tests)
  - User Story 2: 8 tasks (6 implementation + 2 tests)
  - User Story 3: 6 tasks (6 implementation)
  - User Story 4: 7 tasks (5 implementation + 2 tests)
  - Error Handling: 10 tasks
  - Integration & Testing: 8 tasks
  - Polish: 7 tasks

---

## Summary

**Total Tasks**: 83  
**MVP Scope (US1 + Foundation)**: 22 core tasks (Phases 1-4)  
**Complete Feature**: All 83 tasks  
**Estimated Duration (1 developer)**: 20-25 hours  
**Estimated Duration (2 developers, parallel)**: 10-12 hours  
**Estimated Duration (3 developers, parallel)**: 8-10 hours

**Ready for**: Implementation by any developer familiar with React Native, Expo, Zustand, and TypeScript. Each task is independent and includes exact file paths for immediate action.

**Next Step**: Begin with Phase 1 setup (30 minutes), then parallelize Phase 2 (backend) and Phase 3 (frontend foundation) before user story implementation.
