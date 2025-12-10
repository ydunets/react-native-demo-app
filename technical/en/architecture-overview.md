# Kii Health Mobile: Technical Architecture Overview

## Project Summary

Kii Health Mobile is a React Native application built with Expo Router, designed for healthcare workflow management. The project implements a sophisticated architecture covering authentication, routing, file management, and state synchronization.

---

## 1. React Native Project Structure

### Directory Organization

```
kiimobile/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Welcome/initial screen
│   ├── (auth)/                  # Authentication route group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (main)/                  # Main app route group
│       ├── _layout.tsx
│       ├── (tabs)/              # Tab-based navigation
│       │   ├── messages.tsx
│       │   ├── profile.tsx
│       │   └── settings.tsx
│       └── details/[id].tsx     # Dynamic routes
│
├── api/                          # API layer
│   ├── axios-client.tsx          # Configured HTTP client
│   ├── query-client.ts           # React Query setup
│   ├── errors.ts                 # Custom error classes
│   ├── services/                 # Domain-specific services
│   │   ├── MessageService.ts
│   │   ├── UserService.ts
│   │   └── FileService.ts
│   └── dto/                      # Data transfer objects
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── messages/                 # Message-specific components
│   ├── forms/                    # Form components
│   └── live-chat/                # Chat UI components
│
├── store/                        # Global state management
│   ├── authStore.tsx             # Authentication state (Zustand)
│   ├── userStore.tsx             # User profile state
│   ├── tokensStateStore.tsx       # Token management
│   └── networkInfoStore.tsx       # Network status
│
├── hooks/                        # Custom React hooks
│   ├── useDownloadMessageAttachments.tsx
│   ├── useCheckNetworkStatus.tsx
│   ├── useAppStateManager.tsx
│   └── index.ts                  # Hook exports
│
├── contexts/                     # React Context API
│   ├── auth.tsx                  # Auth context & provider
│   └── downloadMessageAttachments.tsx
│
├── sqlite/                       # Local database
│   └── migrations/               # Schema migrations
│
├── storage/                      # Storage abstractions
│   ├── authStorage.tsx           # Auth token storage
│   └── secureStore.tsx           # Secure storage
│
├── models/                       # TypeScript data models
│   ├── Message.ts
│   ├── Attachment.ts
│   └── PatientProfile.ts
│
├── localization/                 # i18n setup
│   ├── i18.ts
│   ├── en-US/
│   └── fr-CA/
│
├── configs/                      # Environment configuration
│   ├── env-config.ts             # Dev/Staging/Production
│   └── roles.ts                  # Role-based access control
│
├── constants/                    # App constants
├── helpers/                      # Utility functions
├── utils/                        # General utilities
├── types/                        # TypeScript type definitions
│
├── ios/                          # iOS-specific code
│   ├── Podfile                   # CocoaPods dependencies
│   └── KiiHealthDev.xcodeproj/
│
├── android/                      # Android-specific code
│   ├── build.gradle
│   └── app/
│
├── app.config.ts                 # Expo app configuration
├── babel.config.js               # Babel configuration
├── tailwind.config.js            # NativeWind/Tailwind setup
└── package.json                  # Project dependencies
```

### Build Commands

```bash
# Development environment
npm run prebuild:dev              # Native build setup
npm run ios:dev                   # Run on iOS simulator
npm run android:dev               # Run on Android emulator

# Staging environment
npm run prebuild:stg
npm run ios:stg

# Production environment
npm run prebuild:prod
npm run ios:prod
```

### Key Dependencies

- **expo**: Cross-platform React Native framework
- **expo-router**: File-based routing (similar to Next.js)
- **react-native**: Core framework
- **zustand**: Lightweight state management
- **@tanstack/react-query**: Server state management
- **nativewind**: Tailwind CSS for React Native
- **expo-sqlite**: SQLite local database
- **expo-file-system**: File operations
- **expo-auth-session**: OAuth/OIDC authentication

---

## 2. Authentication Strategy and Security Approach

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                           │
└──────────────────────────────────────────────────────────────────┘

1. INITIAL STATE
   ├─ User opens app
   ├─ App checks for stored tokens
   └─ Routes to Welcome or Main screen

2. LOGIN PROCESS
   ├─ User enters credentials (email/password)
   ├─ Keycloak OIDC flow initiated
   │  ├─ Authorization endpoint call
   │  └─ PKCE code challenge generated
   ├─ User authorizes in system browser
   ├─ Authorization code returned via deep link
   └─ Token exchange: code → access/refresh tokens

3. TOKEN MANAGEMENT
   ├─ Access token (short-lived, ~15 min)
   │  └─ Used in Authorization header
   ├─ Refresh token (long-lived, days/weeks)
   │  └─ Used to obtain new access token
   └─ JWT decoded to extract roles/scopes

4. AUTOMATIC TOKEN REFRESH
   ├─ Axios interceptor checks token expiration
   ├─ If expired, uses refresh token
   ├─ Obtains new access token silently
   └─ Retries original request

5. LOGOUT PROCESS
   ├─ User taps logout
   ├─ Tokens cleared from secure storage
   ├─ Keycloak session invalidated
   └─ Router redirects to Welcome screen
```

### Security Implementation Details

#### Token Storage

```typescript
// Secure token storage using expo-secure-store
import * as SecureStore from "expo-secure-store";

const authStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  }
};
```

#### Keycloak OIDC Configuration

```typescript
// configs/env-config.ts
export const KC_CONFIG = {
  dev: {
    realm: "kiimobile-dev",
    client_id: "kiimobile-client-dev",
    redirect_uri: "com.kiihealth.kiihealthmobile.dev://oauth-callback",
    endpoint: "https://keycloak-dev.example.com"
  },
  staging: {
    realm: "kiimobile-staging",
    client_id: "kiimobile-client-stg",
    redirect_uri: "com.kiihealth.kiihealthmobile.stg://oauth-callback",
    endpoint: "https://keycloak-stg.example.com"
  },
  production: {
    realm: "kiimobile-prod",
    client_id: "kiimobile-client-prod",
    redirect_uri: "com.kiihealth.kiihealthmobile://oauth-callback",
    endpoint: "https://keycloak.example.com"
  }
};
```

#### Cookie Persistence (iOS)

```typescript
// iOS requires cookie persistence for authentication
import { CookieManager } from "@react-native-cookies/cookies";

useEffect(() => {
  CookieManager.clearAll(true); // Clear old cookies
  // Keycloak cookies now persist properly
}, []);
```

#### JWT Decoding and Role Extraction

```typescript
// authStore.tsx - Zustand store
export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      roles: [],

      setTokens: (accessToken, refreshToken) => {
        const decoded = jwtDecode(accessToken);
        set({
          accessToken,
          refreshToken,
          roles: decoded.realm_access?.roles || []
        });
      }
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => authStorage)
    }
  )
);
```

#### Authorization Header Injection

```typescript
// api/axios-client.tsx
const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor: Inject Bearer token
axiosInstance.interceptors.request.use(async (config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Interceptor: Handle 401 Unauthorized (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { refreshToken, setTokens } = useAuthStore.getState();
      const newTokens = await refreshAccessToken(refreshToken);
      setTokens(newTokens.access_token, newTokens.refresh_token);
      return axiosInstance.request(error.config); // Retry
    }
    throw error;
  }
);
```

#### Role-Based Access Control (RBAC)

```typescript
// hooks/useHasAccess.tsx
export const useHasAccess = (requiredRole: string) => {
  const { roles } = useAuthStore();
  return roles.includes(requiredRole);
};

// Usage in components
function AdminPanel() {
  const hasAccess = useHasAccess("admin");

  if (!hasAccess) {
    return <Text>Access Denied</Text>;
  }

  return <AdminDashboard />;
}
```

---

## 3. Router Structure (Expo Router)

### File-Based Routing System

Expo Router uses file paths to define routes automatically:

```
app/
├── _layout.tsx              → Root wrapper for all routes
├── index.tsx                → / (welcome screen)
├── (auth)/                  → Route group (shared layout)
│   ├── _layout.tsx          → Shared layout for auth screens
│   ├── login.tsx            → /login
│   ├── register.tsx         → /register
│   └── forgot-password.tsx  → /forgot-password
├── (main)/                  → Main app route group
│   ├── _layout.tsx          → Main layout + bottom tabs
│   ├── (tabs)/              → Nested tab group
│   │   ├── _layout.tsx      → Tab navigator setup
│   │   ├── messages.tsx     → /messages
│   │   ├── profile.tsx      → /profile
│   │   └── settings.tsx     → /settings
│   ├── message-detail/[id].tsx  → /message-detail/123
│   └── document-viewer.tsx  → /document-viewer
└── _error.tsx               → Error boundary
```

### Route Navigation Flow

```
WELCOME SCREEN
    ↓
Has Token? ──NO→ (auth) group
    ↓ YES
Token Valid? ──NO→ Refresh Token
    ↓ YES
(main) group ──→ (tabs) ──→ messages / profile / settings
    ↓
Dynamic Routes ──→ message-detail/[id]
                  document-viewer
```

### Routing Implementation

#### Root Layout (`app/_layout.tsx`)

```typescript
export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <DownloadMessageAttachmentsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: true
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" />
        ) : (
          <Stack.Screen name="(main)" />
        )}
      </Stack>
    </DownloadMessageAttachmentsProvider>
  );
}
```

#### Auth Layout (`app/(auth)/_layout.tsx`)

```typescript
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

#### Main Layout with Tabs (`app/(main)/_layout.tsx`)

```typescript
export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarLabelPosition: "below-icon"
      }}
    >
      <Tabs.Screen
        name="(tabs)"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <MessageIcon color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />
        }}
      />
    </Tabs>
  );
}
```

#### Dynamic Route (`app/(main)/message-detail/[id].tsx`)

```typescript
import { useLocalSearchParams } from "expo-router";

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch message with id
  const { data: message } = useQuery({
    queryKey: ["message", id],
    queryFn: () => MessageService.getById(id)
  });

  return <MessageDetail message={message} />;
}
```

### Deep Linking

```typescript
// app/+not-found.tsx
import { Link } from "expo-router";

export default function NotFound() {
  return (
    <View>
      <Text>This screen doesn't exist.</Text>
      <Link href="/">Go to home</Link>
    </View>
  );
}

// Custom deep link handling
const linking = {
  prefixes: ["com.kiihealth.kiihealthmobile://", "kiihealth://"],
  config: {
    screens: {
      "(main)/message-detail/[id]": "message/:id",
      "(main)/document-viewer": "document/:id",
      "(auth)/login": "auth/login"
    }
  }
};
```

---

## 4. Handling File Downloads from Messages

### Complete Download Pipeline

#### Step 1: Context Provider Setup

```typescript
// contexts/downloadMessageAttachments.tsx
export const DownloadMessageAttachmentsProvider = ({
  children
}: PropsWithChildren) => {
  // Queue management
  const {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
    setIsProcessing
  } = useManageProcessingQueue();

  // Token retrieval
  const getAuthToken = async () => {
    const { accessToken } = useAuthStore.getState();
    return accessToken;
  };

  // Single file download with caching
  const downloadFile = async (command: DownloadCommand) => {
    // Check cache, get auth token, download via API
    // See section 3.2 of download-attachment-flow.md
  };

  // Queue processing loop
  const processQueue = async () => {
    // Process all files in queue sequentially
    // See section 3.3 of download-attachment-flow.md
  };

  // Provide context to all children
  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
```

#### Step 2: Auto-Download Hook

```typescript
// hooks/useDownloadMessageAttachments.tsx
export const useDownloadMessageAttachments = () => {
  const { addCommand, startProcessing, resetQueue } =
    useDownloadMessageAttachmentsContext();

  // Fetch all message attachments
  const { attachments } = useAllMessages({ limit: "50" });

  // Monitor app state and network
  const { appState } = useAppStateStore();
  const { isConnected } = useCheckNetworkStatus();

  // Auto-start downloads when conditions met
  useEffect(() => {
    if (isAppStateActive(appState) && isConnected && attachments.length) {
      addFilesToProcessingQueue(attachments);
      startProcessing();
    }
  }, [attachments.length, appState, isConnected]);
};
```

#### Step 3: Integration in App Layout

```typescript
// app/_layout.tsx
export default function RootLayout() {
  // Auto-download attachments in background
  useDownloadMessageAttachments();

  return (
    <Stack>
      {/* App routes */}
    </Stack>
  );
}
```

#### Step 4: Manual Download from Chat

```typescript
// components/messages/AttachmentButton.tsx
export function AttachmentButton({ attachment }: Props) {
  const { downloadFileFromMessage, isProcessing } =
    useDownloadMessageAttachmentsContext();

  const handleDownload = async () => {
    const success = await downloadFileFromMessage(attachment);
    if (success) {
      Toast.show("File downloaded");
      // Open file viewer or share
    }
  };

  return (
    <Button
      loading={isProcessing}
      onPress={handleDownload}
      title="Download"
    />
  );
}
```

### Download Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│          MESSAGE RECEIVED FROM SERVER               │
└──────────────────────┬────────────────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ useDownloadMessageAttachments │ (Hook)
        │ - Checks network status       │
        │ - Checks app state (foreground)
        │ - Populates queue             │
        └──────────────┬────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ DownloadMessageAttachments    │
        │ Context                       │
        │ - Manages queue (useRef)      │
        │ - Processes sequentially      │
        │ - Handles pause/resume        │
        └──────────────┬────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ downloadFile()                │
        │ - Check cache (FileSystem)    │
        │ - GET auth token              │
        │ - POST to API                 │
        │ - Save to /Documents/files/   │
        │ - Base64 encoding             │
        └──────────────┬────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ LOCAL FILE SYSTEM             │
        │ /Documents/files/{id}.{ext}   │
        └──────────────────────────────┘
```

### Caching Strategy

```typescript
// Check local cache before downloading
const path = `${ATTACHMENTS_DIR}${id}.pdf`;
const fileInfo = await FileSystem.getInfoAsync(path);

if (fileInfo.exists) {
  return true; // ✓ Skip download
}

// Download and cache
await FileSystem.writeAsStringAsync(path, base64Data, {
  encoding: FileSystem.EncodingType.Base64
});
```

### Error Handling

```typescript
try {
  // Download attempt
  const response = await RNFetchBlob.fetch("POST", url, headers, body);

  if (response.respInfo.status >= 400) {
    throw new Error(`HTTP ${response.respInfo.status}`);
  }
} catch (error) {
  console.error("[File Processing] Download failed:", error);
  // Queue remains intact, can retry later
  break; // Stop processing on error
}
```

---

## 5. Summary: Technical Strengths

| Aspect                   | Approach                 | Benefit                                             |
| ------------------------ | ------------------------ | --------------------------------------------------- |
| **Authentication**       | Keycloak OIDC + PKCE     | Enterprise-grade security, token refresh automation |
| **Routing**              | Expo Router (file-based) | Predictable navigation, type-safe deep linking      |
| **State Management**     | Zustand + Context        | Lightweight, persisted, reactive                    |
| **File Downloads**       | Queue-based with caching | Reliable, resumable, non-blocking                   |
| **API Layer**            | Axios + React Query      | Centralized error handling, automatic retries       |
| **UI Framework**         | NativeWind/Tailwind      | Consistent styling, code reuse                      |
| **Offline Support**      | SQLite + MMKV            | Local data persistence                              |
| **Internationalization** | i18next                  | Multi-language support (EN/FR)                      |

This architecture provides a scalable, secure, and maintainable foundation for healthcare applications.
