# OAuth 2.0 Discovery Document in Keycloak

## Overview

The OAuth 2.0 Discovery Document (also known as OpenID Connect Discovery) is a JSON file containing metadata about an OAuth 2.0/OpenID Connect provider. It enables automatic configuration of authentication without hardcoding endpoints.

**Key Benefit**: Zero-configuration authentication setup that automatically adapts to provider changes.

---

## 1. What is a Discovery Document?

### Definition

A Discovery Document is a standardized JSON endpoint (`.well-known/openid-configuration`) that contains all necessary information to communicate with an OAuth 2.0/OpenID Connect provider.

### RFC 8414 Standard

The discovery mechanism is defined in **RFC 8414** (OAuth 2.0 Authorization Server Metadata), ensuring compatibility across providers.

### URL Pattern

```
{provider-url}/.well-known/openid-configuration
```

### Keycloak Example

```
http://localhost:8080/realms/fusion-test/.well-known/openid-configuration
```

---

## 2. Discovery Document Structure

### Complete Example

```json
{
  "issuer": "http://localhost:8080/realms/fusion-test",
  "authorization_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/auth",
  "token_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/token",
  "userinfo_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/userinfo",
  "end_session_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/logout",
  "jwks_uri": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/certs",
  "scopes_supported": ["openid", "profile", "email"],
  "response_types_supported": ["code", "token", "id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

### Key Fields Explained

| Field                           | Purpose                          | Example                                    |
| ------------------------------- | -------------------------------- | ------------------------------------------ |
| **issuer**                      | OAuth provider identifier        | `http://localhost:8080/realms/fusion-test` |
| **authorization_endpoint**      | Where to send user for login     | `/protocol/openid-connect/auth`            |
| **token_endpoint**              | Exchange code for tokens         | `/protocol/openid-connect/token`           |
| **userinfo_endpoint**           | Get user profile information     | `/protocol/openid-connect/userinfo`        |
| **end_session_endpoint**        | Logout URL                       | `/protocol/openid-connect/logout`          |
| **jwks_uri**                    | Public keys for token validation | `/protocol/openid-connect/certs`           |
| **scopes_supported**            | Available permission scopes      | `["openid", "profile", "email"]`           |
| **response_types_supported**    | Auth flow types                  | `["code", "token", "id_token"]`            |
| **grant_types_supported**       | Token grant types                | `["authorization_code", "refresh_token"]`  |
| **token_endpoint_auth_methods** | Client authentication methods    | `["client_secret_basic"]`                  |

---

## 3. Using Discovery in React Native

### Automatic Discovery with `useAutoDiscovery`

The `expo-auth-session` library provides `useAutoDiscovery()` hook to automatically fetch and cache discovery metadata.

```typescript
import * as AuthSession from "expo-auth-session";

const useKeycloakDiscovery = () => {
  // Auto-fetch discovery document from Keycloak
  const discovery = AuthSession.useAutoDiscovery(
    `${envConfig.keycloakURL}/realms/${envConfig.realm}`
  );

  return discovery;
};
```

### Complete Implementation

```typescript
// hooks/useKeycloakAuth.ts
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";

import { envConfig } from "@/configs/env-config";

export const useKeycloakAuth = () => {
  // Step 1: Fetch discovery metadata automatically
  const discovery = AuthSession.useAutoDiscovery(
    `${envConfig.keycloakURL}/realms/${envConfig.realm}`
  );

  // Step 2: Define OAuth credentials
  const clientId = envConfig.clientId;

  // Step 3: Prepare request
  const request = new AuthSession.AuthRequest({
    clientId,
    // Discovery provides all endpoints automatically
    redirectUrl: AuthSession.makeRedirectUrl()
  });

  // Step 4: Prompt user for authentication
  const promptAsync = async () => {
    try {
      const result = await request.promptAsync(discovery);

      if (result.type === "success" && result.params.code) {
        // Exchange authorization code for tokens
        const tokens = await exchangeCodeForTokens(
          result.params.code,
          discovery.tokenEndpoint
        );

        // Save tokens securely
        await SecureStore.setItemAsync("access_token", tokens.access_token);
        await SecureStore.setItemAsync("refresh_token", tokens.refresh_token);

        return tokens;
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  return {
    discovery,
    request,
    promptAsync,
    isReady: discovery !== null
  };
};
```

---

## 4. Why Discovery Matters

### Problem Without Discovery

```typescript
// ❌ Hardcoded endpoints - fragile and error-prone
const authEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/auth";
const tokenEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/token";
const userInfoEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/userinfo";
const logoutEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/logout";
const jwksUri =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/certs";

// If Keycloak changes endpoints or structure → app breaks!
// If switching to different provider (Auth0, Azure AD) → need to rewrite all endpoints
// If Keycloak version updates → might need code changes
```

### Solution With Discovery

```typescript
// ✅ Automatic discovery - maintainable and flexible
const discovery = useAutoDiscovery(`${keycloakURL}/realms/${realm}`);

// All endpoints available automatically
const authEndpoint = discovery.authorizationEndpoint;
const tokenEndpoint = discovery.tokenEndpoint;
const userInfoEndpoint = discovery.userinfoEndpoint;
const logoutEndpoint = discovery.endSessionEndpoint;
const jwksUri = discovery.jwksUri;

// If Keycloak changes → automatically detected
// Switch to different provider → just change discovery URL
// App always works with correct endpoints
```

---

## 5. Advantages of Discovery

### ✅ Automatic Configuration

**No Hardcoding Required**

```typescript
// Instead of manually specifying endpoints
const config = {
  authorizationEndpoint: "http://...",
  tokenEndpoint: "http://..."
  // ... 5+ more endpoints
};

// Discovery provides all at once
const discovery = useAutoDiscovery(providerUrl);
// Everything available in discovery object
```

**Provider Capability Detection**

```typescript
// Check what the provider supports
if (discovery.scopes_supported.includes("email")) {
  // Request email scope
}

if (discovery.response_types_supported.includes("id_token")) {
  // Use ID token flow
}
```

### ✅ Flexibility

**Easy Environment Switching**

```typescript
// Same code works for all environments
const getDiscovery = (env: "dev" | "staging" | "prod") => {
  const keycloakUrl = envConfig[env].keycloakURL;
  const realm = envConfig[env].realm;

  return useAutoDiscovery(`${keycloakUrl}/realms/${realm}`);
};

// dev: http://localhost:8080/realms/fusion-test
// staging: https://staging-auth.example.com/realms/fusion-staging
// prod: https://auth.example.com/realms/fusion-prod
// All work without code changes!
```

**Provider Agnostic**

```typescript
// Works with any OAuth 2.0/OIDC provider
const keycloakDiscovery = useAutoDiscovery(
  "http://localhost:8080/realms/fusion-test"
);

const auth0Discovery = useAutoDiscovery("https://your-tenant.auth0.com");

const azureDiscovery = useAutoDiscovery(
  "https://login.microsoftonline.com/your-tenant/v2.0"
);

// Same authentication code works for all!
```

### ✅ Standardization

**RFC 8414 Compliance**

```
Every OAuth 2.0/OIDC server following RFC 8414 has:
/{issuer}/.well-known/openid-configuration

This standardized endpoint ensures:
✓ Consistency across providers
✓ Future-proof design
✓ Interoperability
```

**Predictable Structure**

```typescript
// You know the exact fields that will be returned
interface DiscoveryMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  scopes_supported: string[];
  response_types_supported: string[];
  // ... more fields
}
```

### ✅ Security

**Automatic JWKS Refresh**

```typescript
// Discovery provides JWKS URI for token validation
const jwksUri = discovery.jwksUri;
// http://localhost:8080/realms/fusion-test/protocol/openid-connect/certs

// Use this to validate token signatures
const publicKeys = await fetchJWKS(jwksUri);
const isValidToken = verifyToken(token, publicKeys);

// Keys are automatically updated by Keycloak
// No manual key rotation needed
```

**Algorithm Verification**

```typescript
// Discovery lists supported algorithms
const supportedAlgorithms = discovery.id_token_signing_alg_values_supported;
// ["RS256", "ES256", ...]

// Verify token uses supported algorithm
if (!supportedAlgorithms.includes(tokenHeader.alg)) {
  throw new Error("Unsupported algorithm");
}

// Protection against algorithm substitution attacks
```

---

## 6. Discovery in Multi-Environment Setup

### Environment-Specific Discovery

```typescript
// configs/env-config.ts
export const envConfig = {
  dev: {
    keycloakURL: "http://localhost:8080",
    realm: "fusion-test",
    clientId: "fusion-mobile-dev"
  },
  staging: {
    keycloakURL: "https://staging-auth.example.com",
    realm: "fusion-staging",
    clientId: "fusion-mobile-stg"
  },
  production: {
    keycloakURL: "https://auth.example.com",
    realm: "fusion-prod",
    clientId: "fusion-mobile-prod"
  }
};

// hooks/useDiscovery.ts
export const useDiscovery = () => {
  const environment = process.env.APP_VARIANT || "dev";
  const config = envConfig[environment];

  return useAutoDiscovery(`${config.keycloakURL}/realms/${config.realm}`);
};
```

### Testing with Separate Realm

**Benefits of Test Realm**

```
┌──────────────────────────────────────────────────────┐
│                 Keycloak Server                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │  dev Realm       │      │  test Realm      │    │
│  │  (development)   │      │  (isolated)      │    │
│  ├──────────────────┤      ├──────────────────┤    │
│  │ Users: dev-team  │      │ Users: test-users│    │
│  │ Policies: loose  │      │ Policies: strict │    │
│  │ Data: shared     │      │ Data: isolated   │    │
│  └──────────────────┘      └──────────────────┘    │
│                                                      │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │ staging Realm    │      │ prod Realm       │    │
│  │ (pre-production) │      │ (production)     │    │
│  └──────────────────┘      └──────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘

Each realm has its own:
✓ Users and roles
✓ OAuth clients
✓ Certificates
✓ Discovery metadata
✓ Isolated configuration
```

**Discovery URLs Per Realm**

```typescript
// Dev
const devDiscovery = useAutoDiscovery(
  "http://localhost:8080/realms/fusion-test"
);

// Staging
const stagingDiscovery = useAutoDiscovery(
  "https://staging-auth.example.com/realms/fusion-staging"
);

// Production
const prodDiscovery = useAutoDiscovery(
  "https://auth.example.com/realms/fusion-prod"
);

// Each has completely separate metadata
// Users can't leak between environments
// Testing doesn't affect production
```

---

## 7. Discovery Caching

### How `useAutoDiscovery` Works

```typescript
// expo-auth-session automatically caches discovery metadata

const discovery = useAutoDiscovery(discoveryUrl);

// First call: Fetches from Keycloak
// Subsequent calls: Returns cached version
// Prevents excessive network requests
```

### Manual Caching Pattern

```typescript
// store/discoveryStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DiscoveryState {
  discovery: AuthSession.DiscoveryDocument | null;
  setDiscovery: (discovery: AuthSession.DiscoveryDocument) => void;
}

export const useDiscoveryStore = create(
  persist<DiscoveryState>(
    (set) => ({
      discovery: null,
      setDiscovery: (discovery) => set({ discovery })
    }),
    {
      name: "discovery-storage"
    }
  )
);

// Usage
const discovery = await fetchDiscoveryDocument();
useDiscoveryStore.getState().setDiscovery(discovery);
```

---

## 8. Real-world Flow with Discovery

### Complete Authentication Flow

```
1. APP STARTS
   ↓
2. useAutoDiscovery(keycloakURL/realms/{realm})
   ├─ Fetches .well-known/openid-configuration
   ├─ Receives all endpoint URLs
   └─ Caches for future use
   ↓
3. USER TAPS LOGIN
   ↓
4. useAuthRequest with discovery
   ├─ authorizationEndpoint: discovery.authorization_endpoint
   ├─ tokenEndpoint: discovery.token_endpoint
   └─ Ready to authenticate
   ↓
5. BROWSER OPENS
   └─ Navigates to discovery.authorization_endpoint
   ↓
6. USER ENTERS CREDENTIALS
   └─ Keycloak validates
   ↓
7. AUTHORIZATION CODE RETURNED
   ↓
8. EXCHANGE CODE FOR TOKENS
   └─ POST to discovery.token_endpoint
   ├─ Send: code + client_id + redirect_uri
   └─ Receive: access_token + refresh_token + id_token
   ↓
9. TOKEN VALIDATION (optional)
   └─ Fetch public keys from discovery.jwks_uri
   ├─ Verify token signature
   ├─ Check expiration
   └─ Confirm issuer matches discovery.issuer
   ↓
10. USER AUTHENTICATED ✓
    ├─ Tokens saved securely
    ├─ User logged in
    └─ App data accessible
```

---

## 9. Troubleshooting Discovery

### Common Issues

#### Issue 1: Discovery Endpoint Not Found

```
Error: Failed to fetch discovery document
Cause: Incorrect realm or Keycloak URL

Solution:
const correctUrl = `${keycloakURL}/realms/${realm}`;
// Verify .well-known/openid-configuration is accessible
// curl http://localhost:8080/realms/fusion-test/.well-known/openid-configuration
```

#### Issue 2: CORS Errors

```
Error: CORS policy blocked request

Solution:
// Configure Keycloak CORS in realm settings
// Or use proxy for development

// In development
const proxyUrl = "/api/keycloak";
const discovery = useAutoDiscovery(
  `${proxyUrl}/realms/${realm}`
);
```

#### Issue 3: Discovery Returns Null

```typescript
const discovery = useAutoDiscovery(url);

// Wait for discovery to load
if (discovery === null) {
  return <LoadingSpinner />;
}

// Now safe to use
const tokenEndpoint = discovery.tokenEndpoint;
```

---

## 10. Summary: Discovery Benefits

### Problems Solved ✅

| Problem                 | Solution                          |
| ----------------------- | --------------------------------- |
| Hardcoded endpoints     | Automatic discovery               |
| Provider lock-in        | Works with any OAuth 2.0/OIDC     |
| Manual configuration    | Zero-config setup                 |
| Endpoint changes        | Automatically detected            |
| Security key rotation   | Automatic JWKS refresh            |
| Multi-environment setup | Single codebase, different realms |
| Testing isolation       | Separate test realm               |

### Key Takeaways 🎯

```
1. Discovery automatically provides all OAuth endpoints
   └─ No hardcoding needed

2. Works with any RFC 8414 compliant provider
   └─ Keycloak, Auth0, Azure AD, etc.

3. Enables multi-environment setup
   └─ dev/staging/prod with separate realms

4. Provides security benefits
   └─ Automatic key rotation and validation

5. Makes testing easier
   └─ Isolated test realm without affecting dev

6. Future-proof design
   └─ Adapts if provider changes
```

---

## References

- [RFC 8414 - OAuth 2.0 Authorization Server Metadata](https://tools.ietf.org/html/rfc8414)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Keycloak OIDC Configuration](https://www.keycloak.org/docs/latest/securing_apps/#oidc)
