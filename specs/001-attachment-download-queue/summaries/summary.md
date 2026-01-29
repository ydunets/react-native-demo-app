# Project Summary

## Project Overview

**Expo (React Native)** mobile app with an **Express.js** backend, focused on secure messaging with attachment downloads.

**Stack:** Expo v54, React 19, Zustand + MMKV, TanStack React Query, NativeWind, Keycloak OAuth 2.0

---

## Implemented Functionality

### 1. Authentication (Keycloak)

- OAuth 2.0 / OIDC with PKCE flow and nonce validation
- Token storage in encrypted MMKV, auto-refresh via React Query
- Auto-logout on 401 responses
- Backend JWT verification middleware (RS256/HS256)

### 2. Attachment Download Queue (Core Feature)

- **Queue-based FIFO processing** with MMKV-persisted state (`store/downloadQueueStore.ts`)
- **Smart filtering**: skips completed, cached, oversized (>50MB), or URL-less attachments (`hooks/useMessageAttachments.tsx`)
- **Deduplication** by attachment ID, max 50 cached files enforced
- **Auto pause/resume** on network loss, app backgrounding, insufficient storage (`hooks/useDownloadMessageAttachments.tsx`)
- **Download stats tracking**: queued, downloaded, failed, skipped counts (`store/downloadStatsStore.ts`)
- Proxy pattern for reactive pause state without re-renders (`contexts/downloadMessageAttachments.tsx`)

### 3. Backend API

- `POST /api/files/download` — download file as Base64 (50MB limit)
- `GET /api/files/list` — list available files
- `GET /api/messages/recent` — fetch messages with attachments (limit/includeAttachments params)
- Directory traversal prevention, content length validation

### 4. Screens & Navigation (Expo Router)

- **Auth stack**: Login, Register, Welcome
- **Main tabs** (authenticated):
  - **Messages** — list of 50 messages (FlashList), message detail, attachment viewer
  - **Chat** — chat list and individual threads
  - **Services** — service directory with detail views
  - **Patient** — profile screen
- Additional: send message, app lock, debug sitemap

### 5. File Cache Management

- Cache directory under app documents (`lib/files.ts`)
- Utilities: existence check, storage space validation, size formatting, cache clearing
- `useCachedFiles` hook for inspecting cached files with total size

### 6. UI Components (NativeWind)

- Button, Text (semantic variants), Icon (SF Symbols / Android), Avatar, DatePicker, Slider, Toggle, Picker, ProgressIndicator, ThemeToggle

### 7. State Management

- **Zustand stores**: auth, download queue, download stats
- **React Query**: server state for attachments, token refresh

### 8. Testing

- Backend tested with Jest/Supertest (auth middleware, messages API, file storage)

---

## Project Structure

```
/app                    - Expo Router screens (file-based routing)
/backend               - Express.js backend server
/hooks                 - Custom React hooks
/components            - Reusable UI components (NativeWind)
/contexts              - React Context providers (Auth, Download)
/store                 - Zustand state management stores
/lib                   - Utility functions and helpers
/api                   - HTTP client and API integration
/constants             - Application constants
/configs               - Environment configuration
/theme                 - Design tokens and theme
/assets                - Images, icons
```

## Key Dependencies

- `expo` ^54.0.0
- `expo-router` ~6.0.10
- `expo-auth-session` ~7.0.10
- `expo-file-system` (new Directory/File/Paths API)
- `react` 19.1.0 / `react-native` 0.81.5
- `zustand` ^4.5.7
- `react-native-mmkv` ^4.1.0
- `@tanstack/react-query` ^5.90.12
- `axios` ^1.13.2
- `react-native-blob-util` ^0.24.6
- `nativewind` / `tailwindcss` ^3.4.0
- `@shopify/flash-list` 2.0.2

## Environment Configuration

**Frontend** (`configs/env-config.ts`):
- Keycloak at `localhost:8080`, realm `expo-app-realm`, client `expo-app`
- Platform-aware host resolution (iOS: Mac IP, Android: 10.0.2.2)
- API base: `http://{host}:3001/api`

**Backend** (`.env.backend`):
- Port 3001, CORS for localhost/emulator
- Max file size 50MB, storage path `./files`
- Keycloak public key for JWT verification
