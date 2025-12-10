# Technology Stack - Kii Health Mobile

## Overview

Kii Health Mobile is a modern healthcare mobile application built with cutting-edge technologies using microservices architecture and cloud-native computing patterns.

---

## 1. Backend — Project Fusion Microservices

### Technologies

**Java 17** — Modern Java version with performance and security improvements

**Quarkus Framework** — Cloud-native framework for building microservices:

- ⚡ Supersonic fast startup (milliseconds)
- 💾 Minimal memory footprint
- 🐳 Optimized for containerization (Docker, Kubernetes)
- 🔧 Ideal for serverless and edge computing

**Maven** — Java build automation and dependency management tool

### Core Components

```
Project Fusion Backend
├── Keycloak Authentication Server
│   ├─ OAuth 2.0/OpenID Connect
│   ├─ Role-Based Access Control (RBAC)
│   └─ Multi-realm support (dev/staging/prod)
│
├── REST API Endpoints
│   ├─ Healthcare data processing
│   ├─ Messaging services
│   ├─ User management
│   └─ Profile management
│
├── Microservices Architecture
│   ├─ Messaging Service
│   ├─ Profile Service
│   ├─ Integration Service
│   ├─ Dashboard Service
│   └─ Other domain services
│
└── Supporting Infrastructure
    ├─ Database Layer (PostgreSQL)
    ├─ Message Queue (RabbitMQ/Kafka)
    ├─ Caching Layer (Redis)
    └─ Monitoring & Logging
```

### Benefits of Java/Quarkus

✅ **Performance** — JVM optimized for long-running applications  
✅ **Scalability** — Microservices architecture for independent scaling  
✅ **Reliability** — Mature ecosystem with production-ready libraries  
✅ **Security** — Built-in security mechanisms and encryption  
✅ **Cloud-Native** — Optimized for Kubernetes and cloud platforms

---

## 2. Frontend — React Native with Expo

### Core Technologies

**React Native 0.79.5** — JavaScript framework for cross-platform mobile development:

- 📱 Single codebase for iOS and Android
- ⚡ Hot Reload for rapid development
- 🎯 Native performance through native compilation

#### ⚡ Hot Reload for Rapid Development

**What it is:** A mechanism for instant app updates without full reload when code changes.

**How it works:**
- Code changes are automatically applied to the running app
- App state is preserved between updates
- Update time: less than 1 second (vs. 30-60 seconds for full reload)

**Benefits:**
- ✅ **Instant feedback** — see changes immediately after saving the file
- ✅ **State preservation** — don't lose form data, scroll position, component state
- ✅ **Faster development** — up to 10x faster iterations compared to native development
- ✅ **Real-time debugging** — test UI changes without restarting

**Usage example:**
```typescript
// Change button style
<Button style={{ backgroundColor: 'blue' }} /> // Save file
// → App updates instantly, state is preserved
```

#### 🎯 Native Performance Through Native Compilation

**What it is:** React Native compiles JavaScript code into native components using platform-native APIs.

**Performance Architecture:**

1. **New Architecture (React Native 0.79.5):**
   - **Fabric Renderer** — new renderer working directly with native components
   - **TurboModules** — synchronous access to native modules without bridge
   - **JSI (JavaScript Interface)** — direct connection between JS and native code

2. **Native Compilation:**
   ```
   JavaScript/TypeScript code
         ↓
   Metro Bundler (transpilation)
         ↓
   Hermes Engine (optimization)
         ↓
   Native Components (iOS/Android)
   ```

**Performance Benefits:**

- ✅ **Native speed** — apps run with performance close to native apps
- ✅ **Smooth animations** — 60 FPS thanks to direct access to native APIs
- ✅ **Fast startup** — Hermes engine ensures quick app launch
- ✅ **Memory optimization** — efficient memory management through native components
- ✅ **Direct API access** — use all platform capabilities (camera, GPS, sensors)

**Performance Comparison:**

| Metric | React Native 0.79.5 | Native Apps |
|--------|---------------------|-------------|
| Startup time | ~1-2 sec | ~1-2 sec |
| Animation FPS | 60 FPS | 60 FPS |
| Memory usage | Optimized | Optimized |
| App size | Compact | Compact |

**Technical Details:**

- **Hermes Engine** — optimized JavaScript engine for React Native
- **Code Splitting** — automatic code splitting to reduce bundle size
- **Lazy Loading** — on-demand component loading
- **Native Modules** — ability to use native libraries directly

**Expo SDK 53** — Framework simplifying React Native development:

- 📦 Pre-built components and APIs
- 🚀 EAS (Expo Application Services) for build management
- 🔄 Over-the-air updates without app rebuild

**TypeScript** — Typed superset of JavaScript:

- 🛡️ Early error detection at development time
- 📖 Better code documentation through types
- 🧠 Enhanced IDE support and autocomplete

**NativeWind (TailwindCSS)** — Utility-first CSS framework for mobile:

- 🎨 Rapid prototyping with utility classes
- 📐 Consistent design through constraint system
- 🎯 Less code, more functionality

**Expo Router** — File-based routing for React Native:

- 🗂️ Structured file system for routes
- 🔗 Deep linking out of the box
- ⚙️ Route groups for code organization

### State Management Architecture

**React Query** — Server state management:

- 🌐 Backend data synchronization
- 🔄 Automatic retry on failures
- 💾 Caching and background sync
- 🔄 Background token refresh

**Zustand** — Global client state management:

- 🏪 Local application state management
- 💾 Persistent storage
- ⚡ Lightweight and fast
- 🔐 Secure sensitive data storage (MMKV, SecureStore)

### Component Architecture

```
Kii Mobile App Structure
│
├── UI Components Layer
│   ├─ Custom TabBar (bottom navigation)
│   ├─ Header Components (top buttons)
│   ├─ MailTabBarIcon (icons with badges)
│   ├─ Form Components
│   └─ Reusable UI Elements
│
├── Page/Screen Layer
│   ├─ (pillars) — Home/Services
│   ├─ (messages) — Messages
│   ├─ (chat) — Live Chat
│   └─ (patient) — User Profile
│
├── Business Logic Layer
│   ├─ Hooks (usePatientProfile, useHasAccess, etc.)
│   ├─ Services (MessageService, ProfileService)
│   ├─ API Clients (Axios + interceptors)
│   └─ Error Handling
│
├── State Management Layer
│   ├─ Auth Store (tokens, user)
│   ├─ User Store (user profile)
│   ├─ Network Store (network status)
│   └─ Other domain stores
│
└── Infrastructure Layer
    ├─ SQLite Database (local storage)
    ├─ SecureStore (secure storage)
    ├─ MMKV (fast key-value storage)
    ├─ File System (downloads and cache)
    └─ WebView (specialized content)
```

---

## 3. Database — Hybrid Approach

### Local Storage (on device)

**SQLite with Expo SQLite**:

- 📱 Built-in database on each device
- 📴 Works completely offline
- 💾 Stores messages and attachments locally
- 🔄 Syncs with backend when connected

### Secure Storage

**Expo Secure Store** — Secure storage for sensitive data:

- 🔐 JWT tokens (access/refresh)
- 🗝️ Biometric data
- 🔑 Credentials

**MMKV** — Fast key-value storage:

- ⚡ 10x faster than AsyncStorage
- 📊 For frequently updated data
- 🔢 Sync status, feature flags

### External Backend Databases

**REST API access** to backend databases:

- 👤 User profiles and demographics
- 📋 Healthcare records
- 💬 Messages (synced via API)
- 📊 Analytics and medical data

---

## 4. Authentication & Authorization — Keycloak

### OAuth 2.0 with PKCE

```
┌─────────────────────────────────────────────────────┐
│           OAuth 2.0 Authorization Code Flow         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. App generates code_challenge (from code_verifier)
│  2. Opens browser to Keycloak authorization endpoint
│  3. User enters credentials
│  4. Keycloak redirects with authorization code
│  5. App exchanges code for tokens (using code_verifier)
│  6. Keycloak validates code_verifier and issues tokens
│  7. App stores tokens securely
│                                                     │
└─────────────────────────────────────────────────────┘
```

### PKCE (Proof Key for Public Clients)

🔒 **Protection against authorization code interception**:

- `code_verifier` — Random 128-character string
- `code_challenge` — SHA256 hash of code_verifier
- Only original app can exchange the code

### Multi-Environment Realms

```
Keycloak Server
├── expo-app-realm (Development)
│   ├─ Test users
│   ├─ Development settings
│   └─ Loose policies
│
├── fusion-staging (Pre-production)
│   ├─ Staging users
│   ├─ Production-like config
│   └─ Testing policies
│
└── fusion-prod (Production)
    ├─ Real users
    ├─ Strict security
    └─ Production policies
```

### Role-Based Access Control

```typescript
// JWT Token contains user roles
{
  "sub": "user-id",
  "email": "user@example.com",
  "roles": ["patient", "messages-access", "live-chat-access"],
  "realm_access": {
    "roles": ["user", "manage-account"]
  }
}

// UI renders conditionally based on roles
if (userRoles.includes("live-chat-access")) {
  // Show Live Chat tab
}
```

---

## 5. Infrastructure & Deployment

### Expo Application Services (EAS)

**EAS Build** — Cloud-based app building:

- 🏗️ iOS builds on Mac in the cloud
- 🏗️ Android builds on Linux in the cloud
- 📦 Creates APK and IPA packages
- 🔐 Manages certificates and provisioning profiles

**EAS Submit** — Automated store submission:

- 🍎 TestFlight for iOS (internal testing)
- 🍎 App Store Connect for publishing
- 🤖 Google Play for Android
- 📊 Version and release management

### Backend Infrastructure (CloudMD)

**Kubernetes** — Container orchestration:

- 🐳 Microservice deployment in containers
- 📈 Auto-scaling based on load
- 🔄 Rolling updates without downtime
- 🌐 Load balancing and service discovery

**CloudMD Platform**:

- 🏥 Managed healthcare infrastructure
- 🔐 HIPAA-compliant (standards compliance)
- 🌍 Geo-distributed for reliability
- 📊 Monitoring and alerting

### CI/CD Pipeline (GitHub Actions)

```
GitHub Push
    ↓
1. Code Lint & Format Check
    ↓
2. TypeScript Compilation Check
    ↓
3. Unit Tests Execution
    ↓
4. Build iOS/Android (EAS)
    ↓
5. Integration Tests
    ↓
6. Upload to TestFlight/Google Play
    ↓
7. Deploy to App Store (manual approval)
```

### Distribution Channels

**iOS**:

- 🧪 TestFlight — Internal & beta testing
- 📱 App Store — Production distribution
- 🔐 Signed with Apple developer certificates

**Android**:

- 🧪 Google Play Internal Testing — QA team
- 📱 Google Play — Production distribution
- 🔑 Signed with app signing key

---

## 6. Security Architecture

### Token Management

```
┌─────────────────────────────────────────┐
│         Token Lifecycle                 │
├─────────────────────────────────────────┤
│                                         │
│ 1. User Login                           │
│    └─ Get access_token (15 min)         │
│    └─ Get refresh_token (7 days)        │
│                                         │
│ 2. Store Securely                       │
│    └─ access_token → SecureStore        │
│    └─ refresh_token → SecureStore       │
│                                         │
│ 3. Background Refresh                   │
│    └─ Before expiration (14 min)        │
│    └─ On app resume                     │
│    └─ On API 401 response               │
│                                         │
│ 4. Logout                               │
│    └─ Clear tokens from SecureStore     │
│    └─ Revoke at Keycloak                │
│                                         │
└─────────────────────────────────────────┘
```

### Inactivity Timeout

⏱️ **Auto-logout** on user inactivity:

- Track last user activity
- Monitor AppState (foreground/background)
- Automatic logout on timeout

### Biometric Authentication

🔐 **Face ID / Touch ID**:

- Fast authentication
- Secure biometric comparison
- Password fallback

---

## 7. Architectural Patterns

### Service Layer Pattern

```
UI Components
    ↓
Hooks (Business Logic)
    ↓
Services (API Communication)
    ├─ MessageService
    ├─ ProfileService
    ├─ ChatService
    └─ etc.
    ↓
Axios Client (HTTP Layer)
    ├─ Request interceptors (add auth header)
    ├─ Response interceptors (handle errors)
    └─ Auto token refresh
    ↓
Backend REST APIs
```

### Store Pattern (Zustand)

```typescript
// Zustand store structure
export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      // State
      tokens: null,
      user: null,

      // Actions
      setTokens: (tokens) => set({ tokens }),
      logout: () => set({ tokens: null, user: null })
    }),
    {
      name: "auth-storage",
      storage: secureStorage // Encrypted storage
    }
  )
);
```

### File-based Routing (Expo Router)

```
app/
├── _layout.tsx         (Root layout)
├── index.tsx           (Home)
│
├── (auth)/             (Route group - no URL segment)
│   ├── login.tsx
│   ├── register.tsx
│   └── _layout.tsx     (Auth stack)
│
└── (main)/             (Authenticated routes)
    ├── (tabs)/         (Bottom tab navigation)
    │   ├── (pillars)/  (Home tab)
    │   ├── (messages)/ (Messages tab)
    │   ├── (chat)/     (Live chat tab)
    │   └── patient/    (Profile tab)
    │
    ├── send-message    (Modal)
    └── _layout.tsx     (Main stack)
```

---

## 8. Integrations and External Services

### OpenAPI Code Generation

```bash
# Auto-generate TypeScript client from OpenAPI spec
CONTROLLER=controller npm run generate:axios-client
```

✅ **Benefits**:

- 🔄 Typed API clients
- 📝 Automatic documentation
- 🔀 Sync with backend API
- ⚡ Fast updates on API changes

### WebView Integration

🌐 **Specialized content**:

- Live Chat (via WebSocket)
- Rich Media Content
- Third-party integrations
- Analytics tracking

### Push Notifications

📲 **Expo Notifications**:

- ✉️ Local notifications
- ☁️ Remote notifications from backend
- ⏰ Scheduled notifications
- 🔊 Sound and vibration management

---

## 9. Development Tools & Environment

### Development Environment Variants

```bash
# Development build
npm run prebuild:dev && npm run ios:dev

# Staging build
npm run prebuild:stg && npm run ios:stg

# Production-like build
npm run ios:prod
```

### Environment Configuration

```typescript
// configs/env-config.ts
export const envConfig = {
  dev: {
    apiBaseURL: "http://localhost:8000",
    keycloakURL: "http://localhost:8080",
    realm: "expo-app-realm"
  },
  staging: {
    apiBaseURL: "https://api-staging.example.com",
    keycloakURL: "https://auth-staging.example.com",
    realm: "fusion-staging"
  },
  production: {
    apiBaseURL: "https://api.example.com",
    keycloakURL: "https://auth.example.com",
    realm: "fusion-prod"
  }
};
```

### Testing Tools

🧪 **Quality Assurance**:

- Jest (Unit tests)
- React Testing Library (Component tests)
- Cypress (E2E tests)
- EAS Device Farm (Real device testing)

---

## 10. Summary — Technology Stack

| Layer               | Technology                       | Purpose              |
| ------------------- | -------------------------------- | -------------------- |
| **Mobile Frontend** | React Native 0.79.5, Expo SDK 53 | iOS/Android app      |
| **Navigation**      | Expo Router                      | File-based routing   |
| **Styling**         | NativeWind (TailwindCSS)         | Utility-first styles |
| **Client State**    | Zustand                          | Global app state     |
| **Server State**    | React Query                      | Backend sync         |
| **Language**        | TypeScript                       | Type safety          |
| **HTTP Client**     | Axios                            | REST API calls       |
| **Authentication**  | Keycloak OAuth 2.0               | Auth & authorization |
| **Local Storage**   | SQLite                           | Offline data         |
| **Secure Storage**  | Expo SecureStore                 | Tokens & passwords   |
| **Fast Storage**    | MMKV                             | Key-value cache      |
| **Backend**         | Java 17 + Quarkus                | Microservices        |
| **Build & Deploy**  | EAS, GitHub Actions              | CI/CD pipeline       |
| **Distribution**    | TestFlight, Google Play          | App distribution     |

---

## Architectural Principles

### 1. **Offline-First**

- 📴 App works without internet
- 🔄 Syncs when connected
- 💾 SQLite + Zustand for state

### 2. **Security by Design**

- 🔐 PKCE for OAuth
- 🛡️ Secure token storage
- 🔄 Automatic token refresh
- ⏱️ Auto-logout on inactivity

### 3. **Scalability**

- 🐳 Microservices backend
- 📈 Auto-scaling via Kubernetes
- 💾 Caching at all layers
- 🔄 Background sync

### 4. **Developer Experience**

- 🔄 Hot Reload for rapid development
- 📖 TypeScript for type safety
- 🧪 Comprehensive testing setup
- 📚 OpenAPI-generated clients

---

## Key Architecture Benefits

✅ **Cross-platform** — Single codebase for iOS and Android  
✅ **Type-safe** — TypeScript throughout the stack  
✅ **Cloud-native** — Microservices, Kubernetes, containers  
✅ **Security-first** — OAuth 2.0, PKCE, secure storage  
✅ **Offline-capable** — SQLite and background sync  
✅ **Scalable** — Automatic scaling and load balancing  
✅ **Maintainable** — Clean architecture and patterns  
✅ **Well-tested** — Comprehensive testing at all levels
