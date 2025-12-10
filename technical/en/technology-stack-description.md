# Technology Stack Kii Health Mobile — Text Description

## Introduction

Kii Health Mobile is built on modern, production-proven technologies that ensure high performance, reliability, and security. The application uses a hybrid approach, combining best practices from mobile and backend development.

---

## 1. Backend: Project Fusion Microservices

### Java 17 and Quarkus Framework

The Kii Health Mobile backend is built on Project Fusion — a set of Java microservices developed using Java 17 and the Quarkus framework.

**Java 17** is a modern version of Java that provides improved performance, better memory management, and built-in support for modern language constructs. Java was chosen for the backend because it is the most reliable and proven solution for enterprise applications in healthcare.

**Quarkus** is a cloud-native Java framework specifically designed for microservice architecture. The main advantages of Quarkus:

- Supersonic fast startup (milliseconds instead of seconds)
- Minimal memory footprint, critical for cloud environments
- Optimized for containerization in Docker and Kubernetes
- Ideal for serverless architectures

**Maven** is used as a build automation and dependency management tool. This allows the team to manage versions of all used libraries, automate the build process, and publish artifacts.

### Microservices Architecture

Project Fusion consists of several interconnected microservices:

**Keycloak Authentication Server** — a separate component responsible for authentication and authorization. Uses OAuth 2.0 and OpenID Connect standards with PKCE (Proof Key for Public Clients) support. Supports multiple realms for different environments: fusion-test for development, fusion-staging for pre-production, and fusion-prod for production.

**Messaging Service** — microservice that handles sending, receiving, and storing messages between users. Integrated with SQLite on the mobile device for local caching.

**Profile Service** — manages patient profiles and their medical data. Provides REST API for reading and updating information.

**Integration Service** — ensures integration with external healthcare systems and data sources.

**Dashboard Service** — provides aggregated data and analytics for the application's home screen.

All microservices communicate with each other through REST APIs, use shared libraries for security and data handling, and are deployed independently in a Kubernetes cluster.

---

## 2. Frontend: React Native and Expo

### React Native 0.79.5

The mobile application is developed on **React Native** — a JavaScript framework for creating native iOS and Android applications with a single codebase. React Native enables:

- Writing code once and running it on both platforms
- Achieving native performance through compilation of JavaScript code to native
- Using the JavaScript ecosystem (npm, libraries) in mobile development
- Rapid iteration with Hot Reload

### Expo SDK 53

**Expo** is a framework and platform that simplifies development with React Native:

- Provides ready-made components and APIs without needing to write native code
- Allows running the application on real devices for testing without building
- Provides Over-the-air updates (users receive updates without reinstalling from the App Store)
- Simplifies certificate and provisioning profile management

### TypeScript

All application code is written in **TypeScript** — a typed superset of JavaScript. TypeScript provides:

- Early error detection during development
- Self-documenting code through types
- Excellent IDE support with autocomplete
- Safe refactoring of large codebases

### NativeWind (TailwindCSS)

For styling, **NativeWind** is used — a utility-first CSS framework for mobile applications based on TailwindCSS. This allows:

- Quickly create interfaces using ready-made style classes
- Ensure consistent design through a constraint system (spacing, colors, etc.)
- Minimize CSS code volume and style conflicts
- Easily theme the application (light/dark theme)

### Expo Router

**Expo Router** provides file-based routing:

- Folder structure automatically determines the application's route structure
- Deep linking support out of the box
- Route groups without URL segments for code organization
- Conditional navigation based on authentication status

### State Management

**React Query** is used for server state management:

- Synchronizes data with the backend
- Automatically retries requests on failures
- Caches data and updates it in the background
- Automatically refreshes tokens before expiration

**Zustand** is used for managing local application state (client state):

- Simple API for creating state stores
- Support for persistent storage (data is saved between app runs)
- Integration with secure storage (SecureStore) for sensitive data
- Minimal weight and excellent performance

---

## 3. Data Storage

### Local SQLite Database

Each mobile device runs an **SQLite** database that provides:

- Full application functionality without internet
- Local caching of messages and attachments
- Fast access to frequently used data
- Synchronization with backend when connected

### Secure Storage

**Expo Secure Store** is used for storing sensitive data:

- JWT tokens (access and refresh tokens) are stored in the OS secure storage
- Biometric data is protected from unauthorized access
- Credentials and passwords are encrypted

**MMKV** — fast key-value storage is used for:

- Frequently updated data (sync status, feature flags)
- 10x faster than AsyncStorage
- Automatic data encryption

### REST API and Backend Databases

Main data (user profiles, medical records, messages) is stored in backend databases and accessed through REST APIs:

- User profiles and demographic data
- Healthcare records and medical history
- Messages synchronized through API
- Analytics and statistical data

---

## 4. Authentication and Authorization: Keycloak

### OAuth 2.0 with PKCE

Authentication in the application is performed through **Keycloak** using the OAuth 2.0 standard and PKCE (Proof Key for Public Clients).

**How it works:**

1. The application generates a random string (code_verifier)
2. Creates a hash of this string (code_challenge)
3. Opens a browser redirecting to Keycloak for login
4. User enters credentials in the browser
5. Keycloak returns an authorization code
6. Application exchanges the code for tokens using code_verifier for authentication
7. Keycloak validates code_verifier and issues access_token and refresh_token

**PKCE** is an additional layer of security that prevents authorization code interception by attackers.

### Multi-Environment Support

Keycloak supports multiple isolated realms for different environments:

- **fusion-test** — for development, with test users and loose policies
- **fusion-staging** — for pre-production, similar to production
- **fusion-prod** — for production, with strict security requirements

Each realm has its own set of users, OAuth clients, and certificates. The mobile application can be built for any environment without code changes.

### Role-Based Access Control

Keycloak provides role-based access control (RBAC). The JWT token contains user roles:

```
{
  "sub": "user-id",
  "email": "user@example.com",
  "roles": ["patient", "messages-access", "live-chat-access"]
}
```

The mobile application uses these roles for conditional UI rendering:

- If the user doesn't have the "messages-access" role, the messages tab is hidden
- If the user doesn't have the "live-chat-access" role, live chat is not available
- Additional features are available only to users with corresponding roles

### Token Management

The access token has a 15-minute lifetime. The refresh token has a 7-day lifetime. The application:

- Stores both tokens in secure storage
- Automatically refreshes the access token in the background before expiration
- Adds the access token to the Authorization header for every API request
- When receiving a 401 (token expired) error, automatically refreshes the token and retries the request
- On logout, clears both tokens and revokes them on the server

---

## 5. Infrastructure and Deployment

### Expo Application Services (EAS)

**EAS Build** provides cloud-based application building:

- iOS builds run on Mac machines in the cloud (required for App Store)
- Android builds run on Linux machines
- EAS manages certificates and provisioning profiles
- Creates signed APK and IPA packages ready for distribution

**EAS Submit** automates distribution to app stores:

- Sends iOS application to TestFlight for internal testing
- Sends to App Store Connect for App Store publication
- Sends Android application to Google Play
- Manages versions, changelogs, and metadata

### Backend Infrastructure (CloudMD)

Project Fusion is deployed in a **Kubernetes** cluster:

- Each microservice runs in a separate container
- Kubernetes automatically scales services based on load
- Rolling updates allow updating services without downtime
- Service discovery and load balancing are built into Kubernetes

**CloudMD Platform** provides:

- Managed infrastructure optimized for healthcare
- Compliance with HIPAA and other privacy requirements
- Geo-distributed placement for reliability and performance
- Monitoring, alerting, and log management

### CI/CD Pipeline (GitHub Actions)

On every push to the repository, a pipeline automatically runs:

1. **Lint and Format Check** — checks code for standard compliance
2. **TypeScript Compilation** — checks type safety
3. **Unit Tests** — runs unit tests
4. **Build iOS/Android** — cloud builds via EAS
5. **Integration Tests** — tests component integration
6. **Upload to TestFlight/Google Play** — sends to testing channels
7. **Deploy to Production** — deployment (requires manual approval)

### Distribution

**iOS**:

- TestFlight is used for internal testing before release
- App Store Connect manages versions and metadata
- Application is signed with Apple developer certificate

**Android**:

- Google Play Internal Testing for QA team
- Google Play for production distribution
- Application is signed using app signing key

---

## 6. Security Architecture

### Token Lifecycle Management

The application implements complete token lifecycle management:

**Obtaining tokens:**

- User logs in through OAuth 2.0 flow
- Keycloak issues access_token (15 minutes) and refresh_token (7 days)

**Secure storage:**

- Both tokens are saved in Expo Secure Store (encrypted OS storage)
- Never stored in regular storage or AsyncStorage

**Using tokens:**

- Access token is sent in the Authorization header with every API request
- If API returns 401, the application automatically refreshes the token

**Background refresh:**

- React Query automatically refreshes the access token in the background every 14 minutes (before expiration)
- When the application resumes (app resume), the token is checked and refreshed
- This ensures the user never encounters an expired token

**Logout:**

- On logout, both tokens are removed from Secure Store
- Tokens are revoked on the Keycloak server
- User is redirected to the login screen

### Inactivity Timeout

The application tracks user activity:

- If the user doesn't interact with the application for more than 15 minutes
- And the application goes to the background
- When returning to the foreground, the application automatically logs out the user
- This prevents unauthorized access if the device was stolen

### Biometric Authentication

In addition to standard authentication, the application supports biometric authentication:

- Face ID on iPhone
- Touch ID on iPhone and iPad
- Fingerprint on Android devices

Biometry does not replace OAuth but is used as fast re-authentication when resuming a session.

---

## 7. Architectural Patterns

### Service Layer Pattern

The application follows a classic architectural pattern with layer separation:

- **UI Components** — React components for rendering the interface
- **Hooks** — custom React hooks with business logic
- **Services** — classes/functions for API communication (MessageService, ProfileService, etc.)
- **Axios Client** — HTTP client with interceptors for adding tokens and handling errors
- **REST APIs** — backend endpoints

Such separation ensures separation of concerns and makes code easier to test.

### Store Pattern (Zustand)

Zustand is used for managing local application state:

```typescript
const useAuthStore = create(
  persist(
    (set) => ({
      tokens: null,
      userId: null,
      setTokens: (tokens) => set({ tokens }),
      logout: () => set({ tokens: null, userId: null })
    }),
    {
      name: "auth-storage",
      storage: secureStorage
    }
  )
);
```

Each store contains:

- **State** — data (tokens, user info, loading flags)
- **Actions** — functions for changing state
- **Persistence** — saving to local storage

### File-based Routing (Expo Router)

Routes in the application are determined by file structure:

```
app/
├── _layout.tsx              # Root layout
├── (auth)/                  # Auth route group
│   ├── login.tsx
│   └── _layout.tsx
└── (main)/                  # Authenticated routes
    ├── (tabs)/              # Bottom tab navigation
    │   ├── (pillars)/       # Home tab
    │   ├── (messages)/      # Messages tab
    │   ├── (chat)/          # Live chat tab
    │   └── patient/         # Profile tab
    └── _layout.tsx
```

This approach provides:

- Intuitive route structure reflecting file structure
- Automatic route generation
- Deep linking out of the box

---

## 8. Development Workflow

### Development Environment

Developers can run the application for different environments:

```bash
# Development (local backend)
npm run prebuild:dev && npm run ios:dev

# Staging (staging backend)
npm run prebuild:stg && npm run ios:stg

# Production-like (production backend)
npm run ios:prod
```

Each variant uses different Keycloak realms and API endpoints, but the code remains unchanged.

### Environment Configuration

Environment configuration is centralized in a single file:

```typescript
export const envConfig = {
  dev: {
    apiBaseURL: "http://localhost:8000",
    keycloakURL: "http://localhost:8080",
    realm: "fusion-test"
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

This makes it easy to switch between environments without changing application logic.

### Testing Strategy

The application uses multiple levels of testing:

- **Unit Tests (Jest)** — testing individual functions and components
- **Component Tests (React Testing Library)** — testing React components
- **E2E Tests (Cypress)** — testing complete user scenarios
- **Device Testing (EAS Device Farm)** — testing on real devices

---

## 9. Integrations and External Services

### OpenAPI Code Generation

The backend provides an OpenAPI/Swagger specification for its REST APIs. The mobile application uses `openapi-generator` to automatically generate TypeScript clients:

```bash
npm run generate:axios-client
```

This provides:

- **Typed API clients** — all API logic has types
- **Automatic documentation** — types serve as documentation
- **Backend synchronization** — if backend changes API, client updates automatically
- **Fast updates** — no need to manually write HTTP requests

### WebView Integration

Some parts of the application (live chat, rich media) embed WebView components:

- Allows using web technologies (React, WebSockets) where appropriate
- Enables updating content without rebuilding the application
- Supports two-way data exchange between mobile code and web content

### Push Notifications

Expo Notifications provide:

- **Local notifications** — triggered on the device
- **Remote notifications** — sent from backend server
- **Scheduled notifications** — notifications scheduled for specific times
- **Sound and vibration management** — customizable behavior

Users receive notifications about new messages, reminders about medical data, and other important events.

---

## 10. Key Architectural Principles

### Offline-First

The application is designed assuming the user may be offline:

- SQLite database on the device contains all necessary data
- The application works without internet
- When internet is available, changes are synchronized with the backend
- React Query manages synchronization and conflict resolution

### Security by Design

Security is built into all layers:

- OAuth 2.0 with PKCE protects against code interception
- Secure Store stores sensitive data
- Automatic token refresh prevents using old tokens
- Auto-logout on inactivity prevents unauthorized access
- HTTPS for all API requests
- Request signing and validation on backend

### Scalability

The architecture allows system scaling:

- Backend uses microservice architecture where each service scales independently
- Kubernetes automatically creates new service instances under load
- Caching at all levels (frontend, CDN, backend) reduces database load
- Database can be replaced with more powerful one without changing API

### Developer Experience

The architecture is optimized for developer convenience:

- Hot Reload allows seeing changes in real time
- TypeScript prevents an entire class of errors at development time
- Comprehensive testing setup makes it easier to maintain code quality
- OpenAPI-generated clients eliminate HTTP boilerplate writing

---

## Conclusion

Kii Health Mobile uses a modern, proven stack of technologies that provides:

✅ Cross-platform — single code for iOS and Android  
✅ Security — OAuth 2.0, PKCE, secure storage, auto-logout  
✅ Performance — native performance, efficient caching  
✅ Reliability — Java backend, microservices, Kubernetes  
✅ Scalability — independent service scaling  
✅ Maintainability — TypeScript, clean architecture, comprehensive tests  
✅ User Experience — offline work, biometrics, fast performance

Such architectural choice allows the development team to quickly add new features, safely scale the application as the user base grows, and provides excellent experience for healthcare end users.
