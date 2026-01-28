# Research Document: Attachment Download Queue System

**Feature**: 001-attachment-download-queue  
**Date**: 2026-01-26  
**Purpose**: Document all technical decisions, research findings, and alternatives considered

## Research Summary

This document captures decisions made during Phase 0 research for implementing the attachment download queue system. All NEEDS CLARIFICATION items from the technical context have been resolved with rationale and alternatives documented.

---

## R001: File Download Library Selection

### Decision
**Use `react-native-blob-util` for all file download operations**

### Rationale
The feature requires authenticated downloads with custom HTTP headers (Bearer tokens) and Base64 encoding for local filesystem storage. After comparing available libraries:

| Criterion | react-native-blob-util | expo-file-system | Built-in fetch |
|-----------|------------------------|------------------|----------------|
| Custom headers (auth) | ✅ Full support | ❌ Limited | ✅ Supported |
| Base64 encoding | ✅ Built-in `.base64()` | ❌ Manual conversion | ❌ Manual |
| Streaming (large files) | ✅ Efficient | ❌ Loads into memory | ❌ Memory issues |
| Native module required | ✅ Yes (Expo compatible) | ✅ Expo SDK | ✅ Built-in |
| File write integration | ✅ Direct FileSystem API | ✅ Native | ❌ Manual |

**Winner**: `react-native-blob-util` provides the best balance of authentication support, performance, and ease of use.

### Alternatives Considered
- **expo-file-system**: Rejected due to limited header customization and no streaming support
- **Built-in fetch + manual Base64**: Rejected due to complexity and memory issues with large files
- **Axios + response interceptor**: Rejected—axios not optimized for binary downloads

### Implementation Notes
```typescript
import RNFetchBlob from 'react-native-blob-util';

const response = await RNFetchBlob.fetch(
  'POST',
  `${baseURL}/api/files/download`,
  {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'text/plain',
  },
  fileUrl // Request body
);

const base64 = await response.base64();
await FileSystem.writeAsStringAsync(path, base64, {
  encoding: FileSystem.EncodingType.Base64,
});
```

---

## R002: Queue State Persistence Strategy

### Decision
**Use MMKV encrypted storage via Zustand `persist` middleware**

### Rationale
The project constitution (Principle III: Secure State Management) mandates MMKV for all persistent state. Queue state contains sensitive metadata (file URLs, user message references) requiring encryption.

| Criterion | MMKV | AsyncStorage | Memory-only | Server-side |
|-----------|------|--------------|-------------|-------------|
| Constitution compliant | ✅ Yes | ❌ No | ✅ N/A | ✅ Yes |
| Encrypted | ✅ AES-256 | ❌ Plain text | ✅ N/A | ✅ Depends |
| Synchronous API | ✅ Yes | ❌ Async | ✅ Yes | ❌ Async |
| Performance | ✅ Fast | ⚠️ Slower | ✅ Fastest | ❌ Network latency |
| Survives app restart | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| Offline support | ✅ Yes | ✅ Yes | ❌ No | ❌ No |

**Winner**: MMKV meets all requirements and aligns with existing project architecture.

### Persistence Schema
```typescript
interface PersistedQueueState {
  queue: DownloadCommand[];           // Pending downloads (FIFO order)
  completedIds: string[];             // Deduplication cache
  lastProcessedTimestamp: number;     // Resume point for crash recovery
  pausedDueToStorage: boolean;        // Storage quota flag
  pausedDueToAuth: boolean;           // Token expiration flag
}
```

### Alternatives Considered
- **AsyncStorage**: Rejected—violates constitution (unencrypted)
- **Memory-only with rebuild from messages**: Rejected—wastes bandwidth, poor UX on slow networks
- **Server-side queue**: Rejected—adds complexity, breaks offline-first architecture

### Implementation Pattern
Follows existing `authStore.ts` pattern:
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { envConfig } from '@/configs/env-config';

const mmkvStorage = createMMKV({
  id: 'download-queue-storage',
  encryptionKey: envConfig.mmkvEncryptionKey,
});

export const useDownloadQueueStore = create<State & Actions>()(
  persist(
    (set) => ({ /* state and actions */ }),
    {
      name: 'download-queue',
      storage: createJSONStorage(() => ({
        getItem: (key) => mmkvStorage.getString(key) || null,
        setItem: (key, value) => mmkvStorage.set(key, value),
        removeItem: (key) => mmkvStorage.remove(key),
      })),
    }
  )
);
```

---

## R003: Backend Authentication Strategy

### Decision
**Validate JWT Bearer tokens using shared Keycloak public key**

### Rationale
The mobile app already uses Keycloak OAuth for authentication. Reusing existing tokens eliminates the need for separate backend auth flows and maintains single sign-on consistency.

| Approach | Pros | Cons |
|----------|------|------|
| JWT validation | ✅ Stateless, ✅ Fast, ✅ Reuses existing auth | ❌ Requires Keycloak public key |
| Proxy to main API | ✅ No auth duplication | ❌ Adds latency, ❌ Tight coupling |
| API key per user | ✅ Simple | ❌ Key management burden, ❌ Separate auth flow |
| Session-based | ✅ Traditional | ❌ Stateful, ❌ Doesn't fit mobile patterns |

**Winner**: JWT validation balances security, performance, and architectural consistency.

### Implementation Approach
1. **Obtain Keycloak public key** (from `https://keycloak.example.com/realms/{realm}/.well-known/openid-configuration`)
2. **Validate JWT signature** using `jsonwebtoken` library (RS256 algorithm)
3. **Extract user claims** (sub, email, roles) for authorization checks
4. **Reject expired tokens** (check `exp` claim)

### Backend Middleware
```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';

const KEYCLOAK_PUBLIC_KEY = fs.readFileSync('./keycloak-public.pem', 'utf8');

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, KEYCLOAK_PUBLIC_KEY, {
      algorithms: ['RS256'],
    });
    
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

### Alternatives Considered
- **Proxy to main API**: Rejected—adds unnecessary latency and coupling
- **Shared secret (HS256)**: Considered but rejected—public key (RS256) is more secure for distributed systems
- **No authentication**: Rejected—violates security requirements

---

## R004: Docker Networking for Mobile Development

### Decision
**Use environment-based URL configuration with Platform.select()**

### Rationale
Mobile app development requires different backend URLs depending on the runtime environment (iOS simulator, Android emulator, physical device). Docker containers run on the host machine, requiring special network aliases to be accessible from emulators.

| Environment | Backend URL | Rationale |
|-------------|-------------|-----------|
| iOS Simulator | `http://localhost:3001` | Simulator shares host network namespace |
| Android Emulator | `http://10.0.2.2:3001` | Special alias for host loopback (10.0.2.2 = 127.0.0.1) |
| Physical Device | `http://192.168.1.x:3001` | Use host machine's LAN IP address |
| Production | `https://api.example.com` | Environment variable |

### Implementation
**File**: `configs/env-config.ts`
```typescript
import { Platform } from 'react-native';

export const getFileServerURL = (): string => {
  if (__DEV__) {
    return Platform.select({
      ios: 'http://localhost:3001',
      android: 'http://10.0.2.2:3001',
      default: 'http://localhost:3001',
    });
  }
  
  // Production uses environment variable
  const prodURL = process.env.EXPO_PUBLIC_FILE_SERVER_URL;
  if (!prodURL) {
    throw new Error('EXPO_PUBLIC_FILE_SERVER_URL not configured for production');
  }
  return prodURL;
};
```

### Docker Compose Configuration
```yaml
services:
  file-server:
    build: ./backend
    ports:
      - "3001:3001"  # Expose to host machine
    environment:
      - PORT=3001
      - NODE_ENV=development
    volumes:
      - ./backend/files:/app/files  # Mount sample files
```

### Physical Device Setup Instructions
For testing on physical iOS/Android devices:
1. Find host machine IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Update `.env.local`: `EXPO_PUBLIC_FILE_SERVER_URL=http://192.168.1.10:3001`
3. Ensure firewall allows port 3001
4. Restart Expo dev server

### Alternatives Considered
- **ngrok/Expo tunnel**: Rejected—adds complexity, requires internet connectivity
- **Hardcoded localhost**: Rejected—breaks Android emulator testing
- **Separate config file**: Rejected—environment variables are standard practice

---

## R005: File Size Validation Strategy

### Decision
**Enforce 50MB limit on both client and server**

### Rationale
Defense in depth: client-side validation provides immediate feedback and saves bandwidth; server-side validation prevents bypass attacks and ensures authoritative enforcement.

### Client-Side Validation
**Location**: `hooks/useDownloadMessageAttachments.tsx`
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const addFilesToProcessingQueue = useCallback(
  async (attachments: Attachment[]) => {
    for (const attachment of attachments) {
      // Skip files exceeding size limit
      if (attachment.fileSize && attachment.fileSize > MAX_FILE_SIZE) {
        console.warn(`[File Processing] Skipping ${attachment.name}: exceeds 50MB limit`);
        showToast(`File "${attachment.name}" exceeds 50MB limit`);
        continue;
      }
      
      addCommand({
        id: attachment.id,
        filename: attachment.name,
        url: attachment.url,
        fileSize: attachment.fileSize,
        messageId: attachment.messageId,
        priority: 'background',
      });
    }
  },
  [addCommand]
);
```

### Server-Side Validation
**Location**: `backend/src/routes/files.ts`
```typescript
app.post('/api/files/download', authMiddleware, async (req, res) => {
  const sourceURL = req.body;
  
  try {
    // HEAD request to check file size before downloading
    const headResponse = await fetch(sourceURL, { method: 'HEAD' });
    const contentLength = parseInt(headResponse.headers.get('content-length') || '0');
    
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (contentLength > MAX_FILE_SIZE) {
      return res.status(413).json({
        error: 'File too large',
        message: 'File exceeds 50MB limit',
        fileSize: contentLength,
        maxSize: MAX_FILE_SIZE,
      });
    }
    
    // Proceed with download...
  } catch (error) {
    res.status(500).json({ error: 'Download failed', message: error.message });
  }
});
```

### Why Both?
- **Client-side**: Immediate user feedback, no wasted bandwidth
- **Server-side**: Security enforcement, prevents malicious clients
- **Consistency**: Both use same 50MB threshold (shared constant in future refactor)

### Alternatives Considered
- **Client-only**: Rejected—easily bypassed, no server protection
- **Server-only**: Rejected—poor UX (user waits for download to fail)
- **Progressive download with chunking**: Rejected—out of scope, adds complexity

---

## R006: Queue Processing Pattern

### Decision
**Event-driven pattern using React hooks and network/app state listeners**

### Rationale
Mobile apps must be battery-efficient and responsive to system events (network changes, app backgrounding). Event-driven architecture triggers queue processing only when necessary, avoiding wasteful polling.

| Pattern | Battery Efficiency | Responsiveness | Complexity |
|---------|-------------------|----------------|------------|
| Polling (setInterval) | ❌ Poor | ⚠️ Delayed (interval period) | ✅ Simple |
| Event-driven (listeners) | ✅ Excellent | ✅ Immediate | ⚠️ Moderate |
| Reactive (RxJS) | ✅ Good | ✅ Immediate | ❌ Overkill |
| WorkManager (Android) | ✅ Excellent | ⚠️ Platform-specific | ❌ Complex |

**Winner**: Event-driven pattern balances efficiency, responsiveness, and implementation complexity.

### Implementation Strategy

**Network State Listener**:
```typescript
import { useCheckNetworkStatus } from '@/hooks/useCheckNetworkStatus';

export const useDownloadMessageAttachments = () => {
  const { isConnected } = useCheckNetworkStatus(); // Custom hook using NetInfo
  const { addCommand, startProcessing, resetQueue } = useDownloadMessageAttachmentsContext();
  
  useEffect(() => {
    if (isConnected && attachments.length > 0) {
      addFilesToProcessingQueue(attachments);
      startProcessing(); // Trigger queue processing
    }
  }, [isConnected, attachments.length]);
};
```

**App State Listener**:
```typescript
import { useAppStateStore } from '@/store/appStateStore';
import { isAppStateActive } from '@/constants';

export const useDownloadMessageAttachments = () => {
  const appState = useAppStateStore((state) => state.appState);
  const { pauseProcessing, resumeProcessing } = useDownloadMessageAttachmentsContext();
  
  useEffect(() => {
    if (isAppStateActive(appState)) {
      resumeProcessing(); // Resume when app returns to foreground
    } else {
      pauseProcessing(); // Pause when app backgrounds
    }
  }, [appState]);
};
```

### Event Flow Diagram
```
Network Change → NetInfo listener → isConnected state update
                                         ↓
                            useEffect dependency triggers
                                         ↓
                              addFilesToProcessingQueue()
                                         ↓
                                  startProcessing()
                                         ↓
                                   processQueue()
                                         ↓
                          While loop processes queue items
                                         ↓
                          Queue empties or pauses on error
```

### Alternatives Considered
- **Polling with setInterval**: Rejected—drains battery, delayed response (200ms-1s interval)
- **RxJS Observables**: Rejected—adds 500KB+ library, overkill for simple event handling
- **Native WorkManager/BackgroundFetch**: Rejected—platform-specific, complex setup, out of scope

---

## R007: Proxy-Based Pause Mechanism

### Decision
**Use JavaScript Proxy for reactive pause flag instead of state variable**

### Rationale
The queue processing loop (`while (queueRef.current.length)`) must be interruptible without triggering React re-renders. Traditional state (`useState`) would cause re-renders on every flag change, degrading performance. Proxy provides reactive access without React's rendering lifecycle.

### Implementation
```typescript
const useManageProcessingQueue = () => {
  const shouldStopProxy = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => Reflect.get(target, prop),
        set: (target, prop, value) => {
          console.log(`[Queue] shouldStop set to ${value}`);
          return Reflect.set(target, prop, value);
        },
      }
    )
  ).current;
  
  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true; // Triggers Proxy setter
    setIsProcessing(false); // UI state update
    await Promise.resolve(); // Yield to React event loop
  };
  
  const processQueue = async () => {
    while (queueRef.current.length) {
      const result = await downloadFile(queueRef.current[0]);
      
      if (!result) break; // Error, stop processing
      
      queueRef.current.shift(); // Remove completed item
      
      // Check pause flag (Proxy getter)
      if (shouldStopProxy.shouldStop) {
        console.log('[Queue] Paused by external trigger');
        shouldStopProxy.shouldStop = false; // Reset flag
        break;
      }
    }
    setIsProcessing(false);
  };
};
```

### Why Proxy Over useState?
| Approach | Re-renders on change | Synchronous access | Loggable |
|----------|---------------------|-------------------|----------|
| useState | ❌ Yes (expensive) | ❌ Async (race conditions) | ⚠️ Via useEffect |
| useRef | ✅ No | ✅ Synchronous | ❌ No |
| Proxy | ✅ No | ✅ Synchronous | ✅ Via setter trap |

**Winner**: Proxy combines the benefits of `useRef` (no re-renders, synchronous) with observability (logged setter calls for debugging).

### Alternatives Considered
- **useState for pause flag**: Rejected—causes unnecessary re-renders during loop iteration
- **Plain useRef**: Considered but Proxy preferred for debugging/logging capabilities
- **External event emitter**: Rejected—adds complexity, no performance benefit

---

## R008: CORS Configuration for Development

### Decision
**Enable CORS on backend with origin whitelist for mobile emulators**

### Rationale
Mobile app development requires cross-origin requests from emulator/simulator environments. Production will use same-origin (mobile app and backend deployed together), but development needs permissive CORS for local testing.

### Backend CORS Setup
**File**: `backend/src/index.ts`
```typescript
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:8081',       // Expo dev server (default port)
  'http://localhost:19006',      // Expo web
  'http://10.0.2.2:8081',        // Android emulator
  'exp://127.0.0.1:8081',        // Expo Go (iOS)
  'exp://10.0.2.2:8081',         // Expo Go (Android)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### Production Configuration
For production, disable permissive CORS:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
}));
```

### Alternatives Considered
- **No CORS (same-origin only)**: Rejected—breaks local development workflow
- **Wildcard CORS (*)**: Rejected—security risk, allows any origin
- **Proxy through Expo dev server**: Rejected—adds complexity, not standard practice

---

## Research Completion Checklist

- [x] R001: File download library selected (`react-native-blob-util`)
- [x] R002: Queue persistence strategy (MMKV with Zustand persist)
- [x] R003: Backend authentication approach (JWT validation)
- [x] R004: Docker networking for mobile dev (Platform.select() URLs)
- [x] R005: File size validation (client + server, 50MB limit)
- [x] R006: Queue processing pattern (event-driven via React hooks)
- [x] R007: Pause mechanism (Proxy-based reactive flag)
- [x] R008: CORS configuration (origin whitelist for dev)

## Dependencies to Install

### Frontend (Mobile App)
```bash
npm install react-native-blob-util
```

*Note*: `expo-file-system` already included in Expo SDK 54.x

### Backend (File Server)
```bash
cd backend
npm install express cors body-parser jsonwebtoken
npm install -D @types/express @types/cors @types/node typescript ts-node
```

## Configuration Files Required

1. **Backend Docker**file** (`backend/Dockerfile`)
2. **Docker Compose service** (add `file-server` to `docker-compose.yml`)
3. **Keycloak public key** (`backend/keycloak-public.pem`)
4. **Environment variables** (`.env.backend` for JWT secret, port, etc.)

## Next Steps

✅ Research phase complete. Proceed to **Phase 1: Design & Contracts**:
1. Finalize `data-model.md` with entity schemas
2. Create OpenAPI contract in `contracts/download-file.openapi.yaml`
3. Write `quickstart.md` with setup instructions
4. Update agent context file (`.github/copilot-instructions.md`)

---

**Research Status**: ✅ Complete | All NEEDS CLARIFICATION items resolved | Ready for design phase
