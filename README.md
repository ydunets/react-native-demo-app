# Expo App Presentation

A full-stack React Native mobile application demonstrating authenticated file attachment downloads with a queue-based processing system.

## Tech Stack

### Frontend
- **React Native** 0.81 with **Expo** 54 (Expo Router v6)
- **TypeScript** 5.9
- **State Management:** Zustand with MMKV persistence
- **Data Fetching:** TanStack React Query
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Auth:** Keycloak OAuth2/OIDC via expo-auth-session

### Backend
- **Node.js** with Express
- **JWT** authentication (Keycloak public key verification)
- **File serving** with Base64 encoding via protected endpoints

### Infrastructure
- **Keycloak** (OAuth2/OpenID Connect server)
- **PostgreSQL** (Keycloak database)
- **Docker Compose** for local development

## Project Structure

```
app/                    # Expo Router screens (file-based routing)
  (auth)/               # Authentication screens
  (main)/               # Main app screens (tabs)
backend/                # Express file server
  src/routes/           # API route handlers
  src/middleware/        # JWT auth middleware
  files/                # Sample PDF files
components/             # Shared UI components
contexts/               # React context providers
hooks/                  # Custom React hooks
store/                  # Zustand stores
lib/                    # Utility functions
configs/                # Environment configuration
constants/              # App constants
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Xcode (iOS) or Android Studio (Android)

### Setup

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```

2. Start infrastructure services:
   ```bash
   docker compose up -d
   ```

3. Start the backend file server:
   ```bash
   cd backend && npm run dev
   ```

4. Start the Expo dev server:
   ```bash
   npm start
   ```

5. Run on a platform:
   ```bash
   npm run ios      # iOS Simulator
   npm run android  # Android Emulator
   ```

## Key Features

- **OAuth2 Authentication** - Keycloak login with PKCE, automatic token refresh
- **Attachment Download Queue** - FIFO queue with pause/resume, MMKV persistence
- **Cache Management** - File cache with 50-file limit, cache clearing from profile screen
- **Download Statistics** - Tracks queued, downloaded, skipped, and failed files

## Environment Configuration

Copy the example env files and update values as needed:
- `.env.local` - Frontend environment variables
- `.env.backend` - Backend server configuration

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Keycloak database |
| Keycloak | 8080 | OAuth2/OIDC auth server |
| File Server | 3001 | Express API for file downloads |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS Simulator |
| `npm run android` | Run on Android Emulator |
| `npm run lint` | Run ESLint and Prettier checks |
| `npm run format` | Auto-fix code style |
