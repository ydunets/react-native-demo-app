# Expo App — Secure Messaging with Attachment Downloads

An **Expo (React Native)** mobile application with an **Express.js** backend, focused on secure messaging and a queue-based attachment download system.

## Tech Stack

- **Frontend:** Expo v54, React 19, React Native 0.81
- **Backend:** Express.js (Node.js)
- **Auth:** Keycloak OAuth 2.0 / OIDC with PKCE
- **State:** Zustand + MMKV (encrypted persistence), TanStack React Query
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **File I/O:** react-native-blob-util, expo-file-system

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
/spec                  - Project documentation
```

## Features

### Authentication (Keycloak)

- OAuth 2.0 / OIDC with PKCE flow and nonce validation
- Token storage in encrypted MMKV, auto-refresh via React Query
- Auto-logout on 401 responses
- Backend JWT verification middleware (RS256/HS256)

### Attachment Download Queue (Core Feature)

- Queue-based FIFO processing with MMKV-persisted state
- Smart filtering: skips completed, cached, oversized (>50MB), or URL-less attachments
- Deduplication by attachment ID, max 50 cached files enforced
- Auto pause/resume on network loss, app backgrounding, or insufficient storage
- Download stats tracking: queued, downloaded, failed, and skipped counts
- Proxy pattern for reactive pause state without re-renders

### Backend API

| Endpoint | Method | Description |
|---|---|---|
| `/api/files/download` | POST | Download file as Base64 (50MB limit) |
| `/api/files/list` | GET | List available files |
| `/api/messages/recent` | GET | Fetch recent messages with attachments |

- Directory traversal prevention and content length validation

### Screens & Navigation (Expo Router)

- **Auth stack:** Login, Register, Welcome
- **Main tabs** (authenticated):
  - **Messages** — message list (FlashList), message detail, attachment viewer
  - **Chat** — chat list and individual threads
  - **Services** — service directory with detail views
  - **Patient** — profile screen
- Additional: send message, app lock, debug sitemap

### File Cache Management

- Cache directory under app documents
- Storage space validation, file size checks, cache clearing
- Cached files inspection hook with total size

### UI Components (NativeWind)

Button, Text (semantic variants), Icon (SF Symbols / Android), Avatar, DatePicker, Slider, Toggle, Picker, ProgressIndicator, ThemeToggle

## Getting Started

### Prerequisites

- Node.js
- Expo CLI
- Keycloak instance running on `localhost:8080`

### Frontend

```bash
npm install
npx expo start
```

### Backend

```bash
cd backend
npm install
npm start
```

The backend runs on port 3001 by default.

### Environment

- **Frontend config:** `configs/env-config.ts` — Keycloak URL, realm, client ID, API base URL
- **Backend config:** `.env.backend` — port, CORS origins, max file size, storage path, Keycloak public key

## Testing

```bash
cd backend
npm test
```

Backend tested with Jest/Supertest (auth middleware, messages API, file storage).
