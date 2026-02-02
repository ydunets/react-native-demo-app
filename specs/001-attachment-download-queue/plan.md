# Implementation Plan: Attachment Download Queue System

**Branch**: `001-attachment-download-queue` | **Date**: 2026-01-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-attachment-download-queue/spec.md`

## Summary

Implement a comprehensive attachment download queue system for the Expo mobile app that automatically downloads message attachments in the background, supports priority downloads for user-initiated actions, persists queue state across app sessions using MMKV encrypted storage, and gracefully handles network interruptions, storage limitations, and authentication token expiration. The system includes a dedicated Docker-containerized backend file server for serving attachment content and a React Native frontend using `react-native-blob-util` for efficient file downloads with proper authentication.

**Technical Approach**:
- **Backend**: Node.js Express file server containerized via Docker Compose, serving files with Bearer token authentication
- **Frontend**: React Context + custom hooks pattern for queue management, `react-native-blob-util` for downloads, MMKV for persistence
- **Architecture**: Event-driven queue processing with Proxy-based state management, automatic network recovery, priority interruption

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode) | React Native 0.81.5 | Expo 54.x | Node.js 20.x (backend)  
**Primary Dependencies**: 
- Frontend: Expo Router 6.x, NativeWind, Zustand 4.5+, React Query 5.x, react-native-blob-util 0.19+, expo-file-system 17.x
- Backend: Express 4.x, cors, body-parser, jsonwebtoken (for auth validation)

**Storage**: 
- Frontend: MMKV (encrypted queue persistence), Expo FileSystem (attachment cache at `cacheDirectory/attachments/`)
- Backend: Local filesystem or S3-compatible storage for source files

**Testing**: Jest + React Native Testing Library (optional per spec - not required for MVP)  
**Target Platform**: iOS 15+ / Android 8+ (cross-platform via Expo)  
**Project Type**: mobile (React Native Expo app) + backend (Node.js Express file server)  
**Performance Goals**: 
- Priority downloads complete within 3 seconds for files <5MB on 4G/LTE
- Background processing maintains 60fps UI responsiveness
- Queue processing handles 50 concurrent files without memory issues

**Constraints**: 
- Offline-first architecture (queue persists, resumes on connectivity restoration)
- 50MB maximum file size limit (enforced on both client and server)
- Downloads pause when app backgrounds, resume on foreground
- MMKV persistence required (constitution compliance)
- No AsyncStorage for queue state (violates security principles)

**Scale/Scope**: 
- 50 messages × average 2 attachments = ~100 files in typical queue
- Attachment cache size: estimated 200MB for 50 recent messages
- Expected concurrent users per backend instance: 100-500

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with core principles from `.specify/memory/constitution.md`:

- [x] **Type-Safe Navigation**: No new routes required (feature uses existing message screens)
- [x] **Theme-First Design**: Download progress indicators will use NativeWind classes with dark mode support
- [x] **Secure State Management**: Queue state persisted via MMKV encrypted storage (FR-021)
- [x] **Centralized API**: Backend download endpoint will integrate with existing `api/axios-client.tsx` pattern
- [x] **Component Reusability**: Download status indicators (if needed) will follow CVA pattern
- [x] **File-Based Architecture**: Code organized as: `contexts/downloadMessageAttachments.tsx`, `hooks/useDownloadMessageAttachments.tsx`, `store/downloadQueueStore.ts`
- [x] **Mobile-First**: Handles offline scenarios, network switching, app backgrounding, storage limitations

*No violations. All requirements align with constitution principles.*

## Project Structure

### Documentation (this feature)

```text
specs/001-attachment-download-queue/
├── plan.md              # This file (current document)
├── research.md          # Phase 0 output: Technology decisions, patterns research
├── data-model.md        # Phase 1 output: Queue state, entities, persistence schema
├── quickstart.md        # Phase 1 output: Local dev setup, Docker commands
├── contracts/           # Phase 1 output: API contracts
│   ├── download-file.openapi.yaml
│   └── queue-state.schema.json
└── checklists/
    └── requirements.md  # Specification validation (already complete)
```

### Source Code (repository root)

```text
# Mobile App (Expo React Native)
app/
├── _layout.tsx          # Add DownloadMessageAttachmentsProvider wrapper

contexts/
└── downloadMessageAttachments.tsx  # NEW: Download queue context & provider

hooks/
└── useDownloadMessageAttachments.tsx  # NEW: Auto-download hook for message screens

store/
└── downloadQueueStore.ts  # NEW: Zustand store with MMKV persistence for queue state

lib/
└── files.ts             # NEW: File utilities (getExtension, makeDirectory, etc.)

constants/
└── File.ts              # NEW: File paths (ATTACHMENTS_DIR, FILE_TYPES)

# Backend File Server (Node.js + Docker)
backend/
├── Dockerfile           # NEW: Backend container definition
├── package.json         # NEW: Backend dependencies (express, cors, etc.)
├── tsconfig.json        # NEW: TypeScript config for backend
├── src/
│   ├── index.ts         # NEW: Express server entry point
│   ├── routes/
│   │   └── files.ts     # NEW: Download endpoint handler
│   ├── middleware/
│   │   └── auth.ts      # NEW: JWT validation middleware
│   └── storage/
│       └── fileStorage.ts  # NEW: File retrieval logic (filesystem or S3)
└── files/               # NEW: Sample attachment storage directory

# Docker Infrastructure
docker-compose.yml       # MODIFY: Add file-server service definition
.env.backend             # NEW: Backend environment variables (PORT, JWT_SECRET, etc.)
```

## Phase 0: Research & Technology Decisions

**Objective**: Research and document technical decisions for all NEEDS CLARIFICATION items from Technical Context.

### Research Tasks

#### R001: File Download Library Comparison
**Question**: Should we use `react-native-blob-util` or `expo-file-system` for downloads?

**Research**:
- **react-native-blob-util**: 
  - ✅ Supports custom headers (required for Bearer token authentication)
  - ✅ Direct Base64 encoding for FileSystem writes
  - ✅ Handles large files efficiently (streaming)
  - ❌ Requires native module (included in Expo dev client)
- **expo-file-system**:
  - ✅ Pure Expo SDK (no additional native deps)
  - ❌ Limited header customization for downloads
  - ❌ No streaming support for large files

**Decision**: Use `react-native-blob-util` (requirement from user) for authenticated downloads with Base64 encoding.

#### R002: Queue State Persistence Strategy
**Question**: How to persist queue state to survive app restarts?

**Research**:
- **MMKV** (constitution-mandated):
  - ✅ Encrypted storage (security compliant)
  - ✅ Synchronous API (no async complexity)
  - ✅ High performance for frequent writes
  - ✅ Already used in project (`authStore`)
- **Alternative rejected**: AsyncStorage (unencrypted, violates constitution)

**Decision**: MMKV encrypted storage via Zustand `persist` middleware.

**Persistence Schema**:
```typescript
interface PersistedQueueState {
  queue: DownloadCommand[];           // Pending downloads
  completedIds: string[];             // Completed attachment IDs (for deduplication)
  lastProcessedTimestamp: number;     // Resume point tracking
  pausedDueToStorage: boolean;        // Storage quota flag
}
```

#### R003: Backend Authentication Strategy
**Question**: How should backend validate download requests?

**Research**:
- **Option A**: JWT validation (decode existing Keycloak tokens)
  - ✅ Reuses existing auth infrastructure
  - ✅ Stateless validation
  - ❌ Requires JWT secret or public key from Keycloak
- **Option B**: Proxy to existing API
  - ✅ No auth logic duplication
  - ❌ Adds latency (extra hop)
  - ❌ Coupling to existing API availability

**Decision**: JWT Bearer token validation using shared secret (or Keycloak public key for signature verification).

#### R004: Docker Networking for Mobile Dev
**Question**: How should mobile app connect to local Docker backend?

**Research**:
- **iOS Simulator**: Use `http://localhost:3001` (host network accessible)
- **Android Emulator**: Use `http://10.0.2.2:3001` (special alias for host machine)
- **Physical Devices**: Use host machine's LAN IP (e.g., `http://192.168.1.x:3001`)

**Decision**: Environment-based configuration in `configs/env-config.ts`:
```typescript
const getBackendBaseURL = () => {
  if (__DEV__) {
    return Platform.select({
      ios: 'http://localhost:3001',
      android: 'http://10.0.2.2:3001',
      default: 'http://localhost:3001',
    });
  }
  return process.env.EXPO_PUBLIC_API_URL; // Production
};
```

#### R005: File Size Validation Strategy
**Question**: Where to enforce 50MB file size limit?

**Research**:
- **Client-side only**: ✅ Saves bandwidth, ❌ Can be bypassed
- **Server-side only**: ✅ Authoritative, ❌ Wastes client bandwidth
- **Both**: ✅ Best UX + security, ❌ Duplicate logic

**Decision**: Implement on both:
- **Client**: Check file size from attachment metadata before queueing
- **Server**: Validate Content-Length header before streaming response

#### R006: Queue Processing Pattern
**Question**: Should queue use polling, event-driven, or reactive pattern?

**Research**:
- **Polling** (setInterval): ❌ Battery drain, ❌ Delayed response
- **Event-driven** (network/appState listeners): ✅ Efficient, ✅ Immediate response
- **Reactive** (RxJS/Observables): ❌ Overkill for simple queue

**Decision**: Event-driven pattern with React hooks:
- `useEffect` subscribes to `isConnected` (from `useCheckNetworkStatus`)
- `useEffect` subscribes to `appState` (from `useAppStateStore`)
- Triggers `startProcessing()` when conditions met (active + connected)

### Research Deliverables

Output: `research.md` documenting all decisions above with rationale and alternatives considered.

## Phase 1: Design & Contracts

**Objective**: Define data models, API contracts, and system architecture.

### Data Model Design

**Output**: `data-model.md`

#### Entity 1: DownloadCommand
```typescript
interface DownloadCommand {
  id: string;           // Attachment UUID
  filename: string;     // "invoice.pdf"
  url: string;          // Source URL to pass to backend
  fileSize: number;     // Size in bytes (for 50MB validation)
  messageId: string;    // Parent message reference (for UI correlation)
  priority: 'background' | 'user-initiated';
}
```

**Relationships**: N DownloadCommands → 1 Message (via `messageId`)

#### Entity 2: QueueState (Zustand Store)
```typescript
interface QueueState {
  queue: DownloadCommand[];           // In-memory queue (FIFO)
  isProcessing: boolean;              // UI indicator flag
  completedIds: Set<string>;          // Deduplication cache
  pausedDueToStorage: boolean;        // Storage quota flag
  pausedDueToAuth: boolean;           // Token expiration flag
}

interface QueueActions {
  addCommand: (command: DownloadCommand) => void;
  removeCommand: (id: string) => void;
  startProcessing: () => Promise<void>;
  pauseProcessing: () => Promise<void>;
  resumeProcessing: () => Promise<void>;
  resetQueue: () => void;
  markCompleted: (id: string) => void;
}
```

#### Entity 3: PersistedQueueState (MMKV Schema)
```json
{
  "queue": [],
  "completedIds": [],
  "lastProcessedTimestamp": 0,
  "pausedDueToStorage": false,
  "pausedDueToAuth": false
}
```

**Persistence Trigger**: On every queue mutation (add, remove, complete).

#### Entity 4: FileCache (Filesystem)
**Location**: `${FileSystem.cacheDirectory}attachments/`  
**Naming Convention**: `{attachmentId}.{extension}`  
**Example**: `attachments/a1b2c3d4-e5f6-7890.pdf`

### API Contracts

**Output**: `contracts/download-file.openapi.yaml`

#### Endpoint: POST /api/files/download

**Request**:
```yaml
openapi: 3.0.0
info:
  title: File Download API
  version: 1.0.0
paths:
  /api/files/download:
    post:
      summary: Download attachment file
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          text/plain:
            schema:
              type: string
              example: "https://source-storage.example.com/files/invoice.pdf"
      responses:
        '200':
          description: File content (Base64 encoded)
          content:
            application/octet-stream:
              schema:
                type: string
                format: byte
        '400':
          description: Invalid file URL
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized (invalid/missing token)
        '403':
          description: Forbidden (valid token, no access to file)
        '413':
          description: File exceeds 50MB limit
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        timestamp:
          type: string
          format: date-time
```

**Contract Validation**:
- File size checked via `Content-Length` before streaming
- JWT signature validated (RS256 or HS256 depending on Keycloak config)
- Source URL whitelisted (prevent SSRF attacks)

### System Architecture

**Output**: Diagrams in `data-model.md`

#### Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Message Screen (app/messages/[id].tsx)                     │
│  - Displays message list with attachments                   │
│  - Calls useDownloadMessageAttachments()                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  useDownloadMessageAttachments Hook                         │
│  ├─ Listens: appState, isConnected, attachments[]          │
│  ├─ Triggers: addFilesToProcessingQueue()                  │
│  └─ Calls: startProcessing() when ready                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  DownloadMessageAttachmentsContext                          │
│  ├─ Manages: queueRef (useRef<DownloadCommand[]>)          │
│  ├─ Manages: shouldStopProxy (Proxy for pause flag)        │
│  ├─ Exposes: downloadFileFromMessage() (priority)          │
│  └─ Coordinates: processQueue() loop                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  downloadQueueStore (Zustand + MMKV)                        │
│  ├─ Persists: queue, completedIds, pause flags             │
│  ├─ Provides: isProcessing state for UI                    │
│  └─ Restores: queue on app restart                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  downloadFile() Function                                    │
│  ├─ 1. Get auth token from authStorage                     │
│  ├─ 2. Check FileSystem cache (skip if exists)             │
│  ├─ 3. POST to backend: /api/files/download                │
│  ├─ 4. Validate response status                            │
│  └─ 5. Write Base64 to FileSystem                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend File Server (Docker Container)                     │
│  ├─ Express Server (Node.js 20.x)                          │
│  ├─ POST /api/files/download endpoint                      │
│  │   ├─ Validate JWT Bearer token                          │
│  │   ├─ Parse source URL from request body                 │
│  │   ├─ Validate file size (<50MB)                         │
│  │   ├─ Stream file from storage                           │
│  │   └─ Return Base64-encoded content                      │
│  └─ Error handling middleware                              │
└─────────────────────────────────────────────────────────────┘
```

### Quickstart Guide

**Output**: `quickstart.md`

```markdown
# Attachment Download Queue - Quickstart

## Prerequisites
- Node.js 20+
- Docker Desktop
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator

## Backend Setup

1. **Start Docker Services**:
   ```bash
   docker-compose up file-server
   ```

2. **Verify Backend**:
   ```bash
   curl -X POST http://localhost:3001/api/files/download \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: text/plain" \
     -d "https://example.com/sample.pdf"
   ```

   Expected: Base64-encoded file content or 401 if token invalid.

## Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd /path/to/expo-app-presentation
   npm install react-native-blob-util
   ```

2. **Configure Backend URL**:
   Edit `configs/env-config.ts`:
   ```typescript
   export const FILE_SERVER_URL = __DEV__
     ? Platform.select({
         ios: 'http://localhost:3001',
         android: 'http://10.0.2.2:3001',
       })
     : process.env.EXPO_PUBLIC_FILE_SERVER_URL;
   ```

3. **Run App**:
   ```bash
   npm run ios    # or npm run android
   ```

4. **Test Downloads**:
   - Navigate to a message with attachments
   - Watch console logs: `[File Processing] Adding file to queue...`
   - Check downloads in DevTools → Application → FileSystem

## Troubleshooting

- **Android can't reach backend**: Use `http://10.0.2.2:3001` instead of `localhost`
- **iOS physical device**: Use your Mac's LAN IP (e.g., `http://192.168.1.10:3001`)
- **Downloads fail silently**: Check `docker-compose logs file-server` for errors
```

## Phase 2: Tasks (NOT GENERATED BY THIS COMMAND)

*Task breakdown will be generated by `/speckit.tasks` command after Phase 1 completes.*

Expected task structure preview:
- **Foundational Tasks**: Docker setup, MMKV store creation, file utilities
- **Backend Tasks**: Express server, auth middleware, download endpoint
- **Frontend Tasks**: Context provider, download hook, queue processing logic
- **Integration Tasks**: Provider wiring, message screen integration, testing

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. All design decisions comply with constitution principles.*

| Aspect | Constitution Compliance | Notes |
|--------|------------------------|-------|
| State Management | ✅ MMKV persistence | Uses `downloadQueueStore` with encrypted storage |
| API Integration | ✅ Centralized pattern | Backend endpoint follows `createControllerPaths` pattern |
| File Operations | ✅ Expo APIs | Uses `expo-file-system` for cache, `react-native-blob-util` for downloads |
| Authentication | ✅ Existing flow | Reuses `authStorage` tokens, validates via JWT middleware |
| Error Handling | ✅ Graceful degradation | Storage quota, token expiration, network errors handled per spec |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Backend auth key mismatch** | Medium | High (all downloads fail) | Document JWT secret setup in quickstart; provide test token generator |
| **CORS issues in development** | High | Medium (backend unreachable) | Enable CORS in Express with origin whitelist |
| **MMKV encryption key rotation** | Low | High (queue state lost) | Document backup/restore procedure; version persistence schema |
| **File size validation bypass** | Low | Medium (crashes on large files) | Enforce limit on both client and server; add integration test |
| **Network type switching mid-download** | Medium | Low (download fails, retries) | Handled by `react-native-blob-util` reconnection logic |
| **Concurrent priority downloads** | Medium | Low (queue thrashing) | Implement mutex lock in `downloadFileFromMessage()` |

## Success Metrics

Implementation will be validated against these criteria from `spec.md`:

- **SC-001**: Cache hit rate ≥95% for files from last 50 messages
- **SC-002**: Priority downloads <3s for files <5MB on 4G
- **SC-003**: UI maintains 60fps during queue processing (verify with Expo Performance Monitor)
- **SC-004**: Zero duplicate downloads (measure via backend logs)
- **SC-005**: Queue resumes after network restoration (integration test)
- **SC-006**: Handles 50 files without crashes (stress test with mock attachments)

## Next Steps

1. ✅ Phase 0: Complete research tasks → Output: `research.md`
2. ✅ Phase 1: Finalize data models → Output: `data-model.md`, `contracts/`, `quickstart.md`
3. ⏳ Phase 2: Generate task breakdown → Run `/speckit.tasks` command
4. ⏳ Phase 3: Implementation → Execute tasks in priority order (P1 → P2 → P3 → P4)
5. ⏳ Phase 4: Integration testing → Verify all success criteria
6. ⏳ Phase 5: Documentation → Update README, API docs

---

**Plan Status**: Phase 0-1 Complete | Ready for `/speckit.tasks` command
