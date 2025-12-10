---
name: "keycloak-service-generation"
description: "Generate Keycloak service implementation based on YouTube video tutorial and existing codebase patterns. Creates comprehensive Keycloak service with OAuth 2.0 discovery document support, token management, and React Query integration."
agent: "agent"
tools: ["codebase", "fetch", "todos"]
---

# Keycloak Service Generation Prompt

## Task Overview

Generate a comprehensive Keycloak service implementation for this React Native mobile application based on the YouTube tutorial (https://www.youtube.com/watch?v=WGcgiegv0W0&t=27s) and existing codebase patterns. The service must comply with OAuth 2.0/Keycloak authentication requirements and follow project architecture.

## Reference Video

**YouTube Tutorial:** https://www.youtube.com/watch?v=WGcgiegv0W0&t=27s
- Start watching from 27 seconds for Keycloak service implementation patterns
- Extract Keycloak service architecture and best practices shown in the video

## Context and Requirements

### 1. OAuth/Keycloak Compliance

**Reference Documents:**
- `technical/en/oauth-discovery-document.md` - OAuth 2.0 Discovery Document requirements
- `technical/en/automatic-token-refresh.md` - Automatic token refresh implementation
- `.github/copilot-instructions.md` - Request optimization guidelines

**Key Requirements:**
- ✅ Use `useAutoDiscovery()` for OAuth endpoint discovery (RFC 8414 compliant)
- ✅ No hardcoded endpoints - use discovery document
- ✅ Maintain automatic token refresh using React Query (`useRefreshTokens`)
- ✅ Respect app state (foreground/background) for token refresh
- ✅ Handle network errors with retry logic (max 3 attempts)
- ✅ Implement proper error handling (server errors vs auth errors)
- ✅ Follow PKCE flow for OAuth 2.0 authorization
- ✅ Use discovery document endpoints instead of hardcoded URLs

### 2. Existing Codebase Patterns

**Current Structure:**
```
api/keyclock-integration/
├── index.ts              # Path helpers and exports
├── types.ts              # TypeScript interfaces
├── useRefreshTokens.tsx  # Token refresh hook
└── useOrganizations.tsx  # Organizations hook example
```

**Patterns to Follow:**

1. **Service Functions** (like `fetchOrganizations`):
   ```typescript
   const fetchService = async (params: ServiceParams): Promise<ServiceResult> => {
     const { data, status, statusText } = await axiosClient.get<ResponseType>(
       `${getKeycloakIntegrationPaths({ userId }).user.endpoint}`
     );
     if (!data) {
       throw new CustomError(statusText, status);
     }
     return data;
   };
   ```

2. **React Query Hooks** (like `useOrganizations`):
   ```typescript
   export const useService = (params: ServiceParams): UseQueryResult<ServiceResult, CustomError> => {
     return useQuery<ServiceResult, CustomError>({
       queryKey: ["service", params],
       queryFn: () => fetchService(params)
     });
   };
   ```

3. **Path Helpers** (in `index.ts`):
   ```typescript
   export const getKeycloakIntegrationPaths = (params: ApiPathsParams) => {
     const controller = "/keycloak-integration/v1";
     return {
       user: createControllerPaths(controller, {
         endpoint: `/user/${params.userId}/endpoint`
       })
     };
   };
   ```

### 3. Project Structure

**Technology Stack:**
- React Native 0.79.5 with Expo SDK 53
- TypeScript with strict mode
- Expo Router for file-based routing (`app/` directory)
- Zustand for state management (`store/` directory)
- React Query for server state (`api/` directory)
- NativeWind (TailwindCSS) for styling

**Key Files to Reference:**
- `api/keyclock-integration/useRefreshTokens.tsx` - Token refresh implementation
- `api/keyclock-integration/useOrganizations.tsx` - Service hook example
- `api/keyclock-integration/index.ts` - Path helpers
- `api/keyclock-integration/types.ts` - TypeScript types
- `contexts/auth.tsx` - Authentication context with `useAutoDiscovery()`
- `configs/env-config.ts` - Environment configuration
- `api/axios-client.tsx` - API client with interceptors
- `store/authStore.tsx` - Auth state management

## Implementation Plan

### Phase 1: Analysis and Planning

**TODO Steps:**

1. **Review Video Tutorial**
   - Watch YouTube video from 27 seconds
   - Extract Keycloak service patterns and architecture
   - Identify best practices shown in video
   - Note any specific implementation details

2. **Analyze Existing Codebase**
   - Review `#codebase` for Keycloak integration patterns
   - Study `api/keyclock-integration/` directory structure
   - Understand `useAutoDiscovery()` usage in `contexts/auth.tsx`
   - Review `useRefreshTokens.tsx` for token management patterns
   - Review `useOrganizations.tsx` for service hook patterns

3. **Identify Service Requirements**
   - Determine what Keycloak services are needed
   - Check if discovery document is properly used
   - Verify token refresh integration
   - Identify missing service endpoints

### Phase 2: Service Implementation

**TODO Steps:**

4. **Create Keycloak Service Module**
   - Create service file following existing patterns
   - Implement service functions using `axiosClient`
   - Use discovery document endpoints (no hardcoded URLs)
   - Add proper TypeScript types

5. **Implement React Query Hooks**
   - Create custom hooks following `useOrganizations` pattern
   - Use React Query for caching and state management
   - Implement proper error handling
   - Add loading states

6. **Update Path Helpers**
   - Add new endpoints to `getKeycloakIntegrationPaths` in `index.ts`
   - Follow existing path structure pattern
   - Add proper parameter validation

7. **Add TypeScript Types**
   - Define service request/response types in `types.ts`
   - Follow existing type patterns
   - Add proper JSDoc comments

### Phase 3: OAuth Integration

**TODO Steps:**

8. **Integrate Discovery Document**
   - Ensure `useAutoDiscovery()` is used for all endpoints
   - Replace any hardcoded endpoints with discovery document values
   - Verify discovery document caching

9. **Token Management Integration**
   - Ensure tokens are refreshed before service calls
   - Integrate with `useRefreshTokens` hook
   - Handle token expiration gracefully
   - Respect app state (foreground/background)

10. **Error Handling**
    - Implement network error retry logic (max 3 attempts)
    - Handle authentication errors with logout flow
    - Handle server errors with retry dialog
    - Follow error handling patterns from `automatic-token-refresh.md`

### Phase 4: Testing and Validation

**TODO Steps:**

11. **Code Validation**
    - Verify OAuth discovery document compliance
    - Verify no hardcoded endpoints exist
    - Verify automatic token refresh integration
    - Verify error handling for all scenarios

12. **Integration Testing**
    - Test service calls with valid tokens
    - Test token refresh during service calls
    - Test network error handling
    - Test authentication error handling
    - Test on both iOS and Android

## Technical Specifications

### Service Structure

**File Organization:**
```
api/keyclock-integration/
├── index.ts                    # Path helpers and exports
├── types.ts                    # TypeScript interfaces
├── useRefreshTokens.tsx        # Token refresh hook (existing)
├── useOrganizations.tsx        # Organizations hook (existing)
└── keycloakService.ts          # NEW: Main service module
    ├── fetchUserInfo()         # Fetch user information
    ├── fetchUserRoles()        # Fetch user roles
    ├── fetchUserProfile()      # Fetch user profile
    └── ...                     # Other service functions
```

### Discovery Document Usage

**Required Pattern:**
```typescript
import { useAutoDiscovery } from "expo-auth-session";
import { envConfig } from "@/configs/env-config";

const useKeycloakService = () => {
  // Use discovery document instead of hardcoded URLs
  const discovery = useAutoDiscovery(
    `${envConfig.keycloakURL}/realms/${envConfig.realm}`
  );

  // Use discovery endpoints
  const userInfoEndpoint = discovery?.userinfoEndpoint;
  const tokenEndpoint = discovery?.tokenEndpoint;
  
  // Service implementation using discovery endpoints
};
```

### Service Function Pattern

**Follow Existing Pattern:**
```typescript
import { axiosClient } from "@/api/axios-client";
import { CustomError } from "@/api/errors";
import { getKeycloakIntegrationPaths } from ".";

type FetchUserInfoParams = {
  userId: string;
};

type UserInfoResult = {
  // User info type
};

const fetchUserInfo = async (
  params: FetchUserInfoParams
): Promise<UserInfoResult> => {
  const { data, status, statusText } = await axiosClient.get<UserInfoResult>(
    `${getKeycloakIntegrationPaths({ userId: params.userId }).user.userInfo}`
  );

  if (!data) {
    throw new CustomError(statusText, status);
  }

  return data;
};
```

### React Query Hook Pattern

**Follow Existing Pattern:**
```typescript
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { CustomError } from "@/api/errors";

export const useUserInfo = (
  userId: string
): UseQueryResult<UserInfoResult, CustomError> => {
  return useQuery<UserInfoResult, CustomError>({
    queryKey: ["userInfo", userId],
    queryFn: () => fetchUserInfo({ userId }),
    enabled: !!userId // Only fetch if userId exists
  });
};
```

### OAuth Compliance Checklist

- [ ] Use `useAutoDiscovery()` for endpoint discovery
- [ ] No hardcoded OAuth endpoints
- [ ] Discovery document cached properly
- [ ] Token refresh integrated with `useRefreshTokens`
- [ ] App state handling (foreground/background)
- [ ] Network error retry logic (max 3 attempts)
- [ ] Authentication error handling with logout
- [ ] Server error handling with retry dialog
- [ ] PKCE flow implementation (if applicable)
- [ ] Proper TypeScript types
- [ ] Follow existing code patterns

### Code Style Requirements

- TypeScript strict mode
- Functional components with hooks
- Follow existing naming conventions (camelCase for functions, PascalCase for components)
- Use React Query for data fetching
- Use Zustand for global state (if needed)
- Prefer async/await over promises
- Add JSDoc comments for exported functions
- Follow existing error handling patterns

## Execution Instructions

### Before Starting

1. **Review Video Tutorial**
   - Access YouTube video: https://www.youtube.com/watch?v=WGcgiegv0W0&t=27s
   - Extract Keycloak service implementation patterns
   - Note architecture and best practices

2. **Review Codebase**
   - Use `#codebase` search to understand authentication flow
   - Review `api/keyclock-integration/` directory
   - Review `contexts/auth.tsx` for `useAutoDiscovery()` usage
   - Review `api/axios-client.tsx` for API client patterns
   - Review `store/authStore.tsx` for state management

3. **Check Dependencies**
   - Verify `expo-auth-session` is installed
   - Verify `@tanstack/react-query` is installed
   - Verify `axios` is installed
   - Install missing dependencies if needed

4. **Docker Setup (if needed)**
   - Start Keycloak using `docker-compose up` (if docker-compose.yml exists)
   - Verify Keycloak is accessible at configured URL
   - Test discovery document endpoint: `{keycloakURL}/realms/{realm}/.well-known/openid-configuration`

### Implementation Order

1. **Create Plan First** - Use Planning Mode to create detailed implementation plan
2. **Review Video** - Extract patterns from YouTube tutorial
3. **Create Service Module** - Build service functions following existing patterns
4. **Create React Query Hooks** - Build hooks following `useOrganizations` pattern
5. **Update Path Helpers** - Add endpoints to `index.ts`
6. **Add Types** - Define TypeScript types in `types.ts`
7. **Integrate OAuth** - Ensure discovery document usage
8. **Test** - Test all scenarios including error cases

### Optimization Guidelines

**Minimize Premium Requests:**
- Group all related tasks in single request
- Use `#codebase` for broad searches
- Reference specific files only when necessary
- Use CLI tools for file searching before AI requests
- Use `@terminal` for command-line questions (non-premium)

**Example Optimized Request:**
```
"Create Keycloak service module based on YouTube video (WGcgiegv0W0 from 27s) 
following #codebase patterns:
- Use useAutoDiscovery() from contexts/auth.tsx
- Follow service pattern from useOrganizations.tsx
- Use axiosClient from api/axios-client.tsx
- Integrate useRefreshTokens for token management
- Add proper TypeScript types following types.ts patterns
- Update index.ts with path helpers
Include all error handling, loading states, and OAuth compliance."
```

## Success Criteria

✅ Keycloak service created following video tutorial patterns  
✅ OAuth discovery document is used (no hardcoded endpoints)  
✅ Service functions follow existing codebase patterns  
✅ React Query hooks follow `useOrganizations` pattern  
✅ Token refresh integrated with `useRefreshTokens`  
✅ Error handling follows patterns from `automatic-token-refresh.md`  
✅ App state handling (foreground/background) works correctly  
✅ Network errors are retried (max 3 attempts)  
✅ Authentication errors trigger logout flow  
✅ Code follows project style guidelines  
✅ TypeScript types properly defined  
✅ Works on both iOS and Android  

## References

- **Video Tutorial:** https://www.youtube.com/watch?v=WGcgiegv0W0&t=27s
- OAuth Discovery: `docs/technical/en/oauth-discovery-document.md`
- Token Refresh: `docs/technical/en/automatic-token-refresh.md`
- Optimization: `.github/copilot-instructions.md`
- Auth Context: `contexts/auth.tsx`
- Token Refresh Hook: `api/keyclock-integration/useRefreshTokens.tsx`
- Service Example: `api/keyclock-integration/useOrganizations.tsx`
- Path Helpers: `api/keyclock-integration/index.ts`
- Types: `api/keyclock-integration/types.ts`
- Environment Config: `configs/env-config.ts`
- API Client: `api/axios-client.tsx`

---

**Note:** This prompt follows optimization guidelines from `.github/copilot-instructions.md` to minimize premium requests by grouping all requirements and using `#codebase` search effectively. The service implementation should be based on the YouTube video tutorial while following existing codebase patterns for consistency.

