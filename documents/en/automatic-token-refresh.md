# Automatic Token Refresh in Application

## Overview

Implement a robust token refresh mechanism using React Query that automatically maintains valid authentication tokens throughout the application lifecycle. The system handles background states, network interruptions, and provides graceful error recovery.

---

## Core Token Refresh Function

The main refresh function exchanges an expired or existing refresh token for new tokens:

```typescript
const refreshTokens = async (refreshToken?: string) => {
  const {
    refreshToken: newRefreshToken,
    accessToken,
    idToken
  } = await refreshAsync(
    {
      clientId: envConfig.clientId,
      refreshToken: refreshToken
    },
    {
      tokenEndpoint: `${envConfig.keycloakURL}/realms/${envConfig.realm}/protocol/openid-connect/token`
    }
  );

  return {
    refreshToken: newRefreshToken,
    accessToken,
    idToken
  };
};
```

### Function Behavior:

- **Input**: Current refresh token (optional)
- **Process**: Calls Keycloak token endpoint with client credentials
- **Output**: New set of tokens (refresh + access + ID)
- **Endpoint**: `{keycloakURL}/realms/{realm}/protocol/openid-connect/token`

---

## React Query Integration

React Query handles the background refresh scheduling and retry logic:

```typescript
const { isError, isFetched, isFetching, error, refetch } = useQuery<
  AuthStorageTokens,
  CustomError
>({
  queryKey: ["refreshToken"],
  enabled, // Controlled by app state and conditions
  queryFn: async () => {
    setIsTokensFetching(true);
    const tokens = await refreshTokens(refreshToken);
    setTokens(tokens); // Store in Zustand
    setIsTokensCanUseAfterBackground(true);

    return tokens;
  },

  // AUTO-REFRESH: Every N minutes (typically 15 min access token lifespan)
  refetchInterval: ACCESS_TOKEN_LIFESPAN,

  // RETRY LOGIC: Up to 3 attempts for network failures only
  retry: (failureCount, error) =>
    error.message === ErrorMessages.NETWORK_REQUEST_FAILED && failureCount < 3
});
```

### Query Configuration Details:

| Parameter           | Purpose                          | Value                              |
| ------------------- | -------------------------------- | ---------------------------------- |
| **queryKey**        | Unique identifier for this query | `["refreshToken"]`                 |
| **enabled**         | Controls when query runs         | Dynamic based on conditions        |
| **queryFn**         | Token refresh logic              | Calls `refreshTokens()`            |
| **refetchInterval** | Auto-refresh frequency           | Access token lifespan (~15 min)    |
| **retry**           | Error recovery strategy          | 3 attempts for network errors only |

---

## Refresh Conditions

Tokens are refreshed **only when ALL conditions are met**:

```typescript
// ✅ App is in foreground (not background)
const isAppActive = !isAppStateBackground(appState);

// ✅ Network connectivity available
const hasInternet = isConnected;

// ✅ Inactivity timeout elapsed
const timeoutFinished = isTimeoutFinished;

// ✅ Returning from background state
const returnedFromBackground = hasAppBeenInBackground;

// Enable refresh query when conditions met
const enabled =
  isAppActive && hasInternet && (timeoutFinished || returnedFromBackground);
```

### Why These Conditions?

| Condition                    | Reason                                                  |
| ---------------------------- | ------------------------------------------------------- |
| **App Active**               | Prevent refresh in background (battery/resource saving) |
| **Has Internet**             | Avoid network requests when offline                     |
| **Timeout Elapsed**          | Rate-limiting (don't refresh too frequently)            |
| **Returned from Background** | Immediate refresh when user resumes app                 |

---

## App State Tracking

Monitor when app enters/exits background to control token refresh:

```typescript
useEffect(() => {
  const subscription = AppState.addEventListener("change", (nextAppState) => {
    // USER CLOSED APP: Disable token use until refresh
    if (isAppStateBackground(nextAppState)) {
      setIsTokensCanUseAfterBackground(false);
    }

    // APP MOVED TO BACKGROUND: Mark for refresh on return
    if (
      isAppStateBackground(nextAppState) ||
      isAppStateInactive(nextAppState)
    ) {
      setHasAppBeenInBackground(true);
    }
  });

  return () => subscription.remove();
}, []);
```

### State Transitions:

```
FOREGROUND
    ↓ (user minimizes app)
BACKGROUND
    ├─ hasAppBeenInBackground = true
    ├─ isTokensCanUseAfterBackground = false
    └─ Don't use tokens until refreshed

    ↓ (user reopens app)
FOREGROUND
    ├─ Trigger refresh immediately
    ├─ Set isTokensCanUseAfterBackground = true
    └─ Resume normal token usage
```

---

## Error Handling Strategy

Handle different error scenarios with appropriate responses:

```typescript
useEffect(() => {
  // SCENARIO 1: Server error (500, 502, etc.)
  if (
    isError &&
    error.statusCode === CUSTOM_ERRORS.HTTP_STATUS_INTERNAL_SERVER_ERROR
  ) {
    confirmTechnicalIssue(); // Show retry dialog to user
    // Allow retry without logging out
  }

  // SCENARIO 2: Authentication/authorization error
  // (Invalid credentials, revoked token, permission denied)
  if (isError && error.message !== ErrorMessages.NETWORK_REQUEST_FAILED) {
    clearUser(); // Clear user data
    clearAuthData(); // Clear auth state
    clearTokensState(); // Clear token storage

    // Remove stale refresh query from cache
    client.removeQueries({
      queryKey: ["refreshToken"],
      exact: true
    });

    confirm(); // Logout user and redirect to login
  }
}, [isError, error]);
```

### Error Classification:

| Error Type        | Status Code   | Example                                  | Action            |
| ----------------- | ------------- | ---------------------------------------- | ----------------- |
| **Server Error**  | 500, 502, 503 | Keycloak down                            | Show retry dialog |
| **Network Error** | N/A           | No internet                              | Retry up to 3x    |
| **Auth Error**    | 401, 403      | Expired refresh token, permission denied | Force logout      |
| **Client Error**  | 400           | Invalid client ID, malformed request     | Force logout      |

---

## Working Principle

### 1. **Background Refresh** (Automatic)

```
t=0min: App opened
  ↓ (every 15 min)
t=15min: React Query triggers refetchInterval
  └─ If enabled → refreshTokens() called
  └─ New tokens stored in Zustand
  └─ App continues with valid tokens
```

### 2. **Reactivity** (Event-Driven)

```
User minimizes app (Background) ──→ hasAppBeenInBackground = true
        ↓ (user reopens)
User returns app (Foreground) ────→ enabled = true
        ↓
React Query immediately refreshes ──→ New valid tokens obtained
```

### 3. **Retry Logic** (Smart Recovery)

```
Refresh attempt #1 ──→ Network error ──→ Wait + Retry #2
Refresh attempt #2 ──→ Network error ──→ Wait + Retry #3
Refresh attempt #3 ──→ Network error ──→ Stop (let user resume manually)
                    ↓
                    Success ──→ Store tokens + Continue
```

### 4. **Graceful Degradation** (Error Recovery)

```
Non-network error (auth/server)
    ├─ Network error? ──NO→ Clear tokens + Logout
    └─ Yes? ──→ Retry (React Query handles)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION STARTS                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
        ┌────────────────────────────┐
        │ useQuery enabled check:    │
        │ isAppActive &&             │
        │ hasInternet &&             │
        │ (timeoutElapsed ||         │
        │  returnedFromBackground)   │
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Query enabled? ────NO──→ Wait
        │                  │
        │                  YES↓
        │ refreshTokens()
        │ • Get auth token
        │ • Call Keycloak
        │ • Receive new tokens
        │ • Store in Zustand
        │ • Mark ready for use
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Schedule next refresh:     │
        │ refetchInterval = 15 min   │
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Error handling:            │
        │ • Server error?  → Retry   │
        │ • Auth error?    → Logout  │
        │ • Network error? → Retry   │
        └────────────────────────────┘

BACKGROUND LOOP:
Every refetchInterval (15 min) → Repeat process (if enabled)
User returns from background → Immediate refresh (if enabled)
```

---

## Component Integration Example

```typescript
// hooks/useTokenRefresh.tsx
export const useTokenRefresh = () => {
  const { refreshToken } = useAuthStore();
  const { appState } = useAppStateStore();
  const { isConnected } = useCheckNetworkStatus();
  const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);
  const [hasAppBeenInBackground, setHasAppBeenInBackground] = useState(false);

  // Inactivity timeout
  const { resetTimeout } = useTimeout(() => {
    setIsTimeoutFinished(true);
  }, INACTIVITY_TIMEOUT);

  // App state tracking
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (isAppStateBackground(nextAppState)) {
        setIsTokensCanUseAfterBackground(false);
      }
      if (isAppStateBackground(nextAppState) || isAppStateInactive(nextAppState)) {
        setHasAppBeenInBackground(true);
      }
    });
    return () => subscription.remove();
  }, []);

  // Calculate enabled state
  const enabled =
    !isAppStateBackground(appState) &&
    isConnected &&
    (isTimeoutFinished || hasAppBeenInBackground) &&
    !!refreshToken;

  // React Query
  const query = useQuery<AuthStorageTokens, CustomError>({
    queryKey: ["refreshToken"],
    enabled,
    queryFn: async () => {
      const tokens = await refreshTokens(refreshToken);
      setTokens(tokens);
      setIsTokensCanUseAfterBackground(true);
      return tokens;
    },
    refetchInterval: ACCESS_TOKEN_LIFESPAN,
    retry: (failureCount, error) =>
      error.message === ErrorMessages.NETWORK_REQUEST_FAILED &&
      failureCount < 3
  });

  return {
    isRefreshing: query.isFetching,
    refreshError: query.error,
    canUseTokens: isTokensCanUseAfterBackground
  };
};

// Usage in component
function AppContent() {
  const { isRefreshing, refreshError, canUseTokens } = useTokenRefresh();

  if (refreshError && refreshError.message !== NETWORK_ERROR) {
    return <LoginRequired />;
  }

  if (!canUseTokens) {
    return <LoadingSpinner />;
  }

  return <MainApp />;
}
```

---

## Result: Seamless Token Management

### User Experience:

✅ **Transparent**: Users never see token expiration  
✅ **Automatic**: Background refresh without user action  
✅ **Resilient**: Network interruptions handled gracefully  
✅ **Responsive**: Immediate refresh on app resume  
✅ **Secure**: Automatic logout on authentication failure

### Technical Benefits:

✅ **No Manual Refresh**: React Query handles scheduling  
✅ **Reduced API Calls**: Tokens refreshed on interval, not on demand  
✅ **Smart Retry**: Only retries network errors, fails fast on auth errors  
✅ **State-Aware**: Respects app lifecycle (foreground/background)  
✅ **Query Cache**: React Query caches token state

### Result:

**Users always have valid tokens without manual intervention**, ensuring seamless authentication throughout the application lifecycle.

---

## Configuration Constants

```typescript
// Token lifespan (when to trigger refresh)
const ACCESS_TOKEN_LIFESPAN = 15 * 60 * 1000; // 15 minutes in ms

// Inactivity timeout before refresh required
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in ms

// Maximum retry attempts for network errors
const MAX_RETRY_ATTEMPTS = 3;

// Error messages
const ErrorMessages = {
  NETWORK_REQUEST_FAILED: "Network request failed",
  INVALID_CREDENTIALS: "Invalid credentials",
  TOKEN_EXPIRED: "Token expired"
};

// Custom HTTP error codes
const CUSTOM_ERRORS = {
  HTTP_STATUS_INTERNAL_SERVER_ERROR: 500
};
```

---

## Testing Token Refresh

```typescript
// Test: Background to foreground transition
test("should refresh tokens when app returns from background", async () => {
  const { result } = renderHook(() => useTokenRefresh());

  // Simulate background
  act(() => {
    AppState.emit("change", "background");
  });

  // Simulate foreground
  act(() => {
    AppState.emit("change", "active");
  });

  // Wait for refresh
  await waitFor(() => {
    expect(result.current.isRefreshing).toBe(false);
  });

  expect(result.current.canUseTokens).toBe(true);
});

// Test: Network error retry
test("should retry on network error up to 3 times", async () => {
  const mockRefresh = jest.fn();
  mockRefresh.mockRejectedValueOnce(new Error("Network error"));
  mockRefresh.mockResolvedValueOnce(newTokens);

  // Query should retry automatically
  // After 3 failures, stop retrying
});

// Test: Auth error logout
test("should logout on authentication error", async () => {
  const mockRefresh = jest.fn();
  mockRefresh.mockRejectedValueOnce(
    new HttpError(401, "Invalid refresh token")
  );

  // Should trigger logout flow
  await waitFor(() => {
    expect(clearAuthData).toHaveBeenCalled();
  });
});
```

---

## Summary

This automatic token refresh system provides:

1. **Scheduled Refresh**: React Query handles interval-based refresh
2. **Event-Driven**: Responds to app state changes
3. **Smart Retry**: Network-aware with exponential backoff
4. **Graceful Handling**: Different strategies for different errors
5. **Transparent**: Users unaware of token management

The result is a robust, production-ready authentication system that maintains valid tokens throughout the application lifecycle.
