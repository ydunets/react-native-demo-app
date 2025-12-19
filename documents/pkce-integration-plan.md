# PKCE Integration Plan for Expo App

## 1. Current State Analysis
- **Login Flow (`app/(auth)/login.tsx`)**: 
  - Uses `AuthSession.AuthRequest` with `usePKCE: true`.
  - Manually handles the prompt and code exchange.
  - Passes `code_verifier` during the exchange.
  - **Status**: PKCE seems to be implemented for the initial login, but the manual handling of `AuthRequest` is slightly verbose and could be modernized using the `useAuthRequest` hook.

- **Token Refresh (`api/keycloak-integration/useRefreshTokens.tsx`)**:
  - Uses a manual `fetch` call to the token endpoint.
  - Does not use `expo-auth-session` utilities.
  - **Status**: Functional, but inconsistent with the `AuthSession` usage in login. It doesn't leverage the library's ability to handle discovery and potential future changes automatically.

## 2. Objectives
1.  **Verify & Standardize PKCE**: Ensure the PKCE implementation is robust and follows best practices.
2.  **Refactor Refresh Logic**: Update the token refresh mechanism to use `AuthSession.refreshAsync` for better reliability and consistency.
3.  **Keycloak Configuration**: Ensure the Keycloak server is configured to enforce PKCE.

## 3. Implementation Steps

### Step 1: Keycloak Server Configuration (Prerequisite)
Ensure the Keycloak client is configured correctly:
- **Client ID**: Matches `envConfig.clientId`.
- **Access Type**: `public` (since we can't store client secrets safely).
- **Standard Flow**: Enabled.
- **Implicit Flow**: Disabled (recommended for security).
- **Direct Access Grants**: Disabled (unless specifically needed).
- **PKCE Challenge Method**: `S256` (Keycloak usually defaults to this, but good to verify).

### Step 2: Refactor Login Screen (`app/(auth)/login.tsx`)
*Optional but Recommended*: Switch to the `useAuthRequest` hook for a more idiomatic Expo Router integration.

**Current:**
```typescript
const request = new AuthSession.AuthRequest({ ...usePKCE: true... });
const result = await request.promptAsync(discovery);
// ... manual exchange ...
```

**Proposed:**
```typescript
const [request, response, promptAsync] = AuthSession.useAuthRequest(
  {
    clientId: envConfig.clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: AuthSession.makeRedirectUri({ path: 'oauth2callback' }),
    usePKCE: true,
  },
  discovery
);

useEffect(() => {
  if (response?.type === 'success') {
    const { code } = response.params;
    // Exchange code...
  }
}, [response]);
```

### Step 3: Update Token Refresh (`api/keycloak-integration/useRefreshTokens.tsx`)
Replace the manual `fetch` with `AuthSession.refreshAsync`.

**Current:**
```typescript
fetch(discovery.tokenEndpoint, { body: ...grant_type: 'refresh_token'... })
```

**Proposed:**
```typescript
const tokenResult = await AuthSession.refreshAsync({
  clientId: envConfig.clientId,
  refreshToken: tokens.refreshToken,
}, discovery);
```
*Note*: `AuthSession.refreshAsync` handles the request formatting and error parsing standardly.

### Step 4: Testing & Verification
1.  **Initial Login**:
    - Use a network inspector (like React Native Debugger or Flipper).
    - Verify the `/auth` request contains `code_challenge` and `code_challenge_method=S256`.
    - Verify the `/token` request contains `code_verifier`.
2.  **Token Refresh**:
    - Wait for the token to expire (or manually trigger refresh).
    - Verify the refresh request succeeds and updates the store.

## 4. Timeline
- **Phase 1**: Refactor `useRefreshTokens` (Low risk, high consistency value).
- **Phase 2**: Refactor `login.tsx` (Medium risk, UI/UX impact).
- **Phase 3**: Full end-to-end testing.
