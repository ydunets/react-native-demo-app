# Routing Structure in Expo Router

## Overview

Implement a clean, organized routing system using Expo Router's file-based routing with route groups. The structure separates authenticated and non-authenticated flows while maintaining a flat URL structure.

---

## 1. Root Layout

The root layout serves as the main navigation container that orchestrates all route groups:

```typescript
function RootNavigation() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### Root Layout Structure:

| Screen     | Purpose                                  | Header |
| ---------- | ---------------------------------------- | ------ |
| **index**  | Entry point / redirect logic             | Hidden |
| **(main)** | Authenticated user screens               | Hidden |
| **(auth)** | Authentication screens (login, register) | Hidden |

### Key Characteristics:

- **No headers**: All screens use `headerShown: false` for custom navigation
- **Stack navigation**: Linear flow between route groups
- **Modular design**: Each group manages its own navigation

---

## 2. Entry Point

The root index screen handles initial redirection logic:

```typescript
// app/index.tsx
export default function Index() {
  return <Redirect href={RoutePaths.HomeScreen} />;
}
```

### Behavior:

1. **User opens app** → Index screen renders
2. **Immediate redirect** → Redirects to `RoutePaths.HomeScreen`
3. **AuthProvider determines destination**:
   - User authenticated → Redirect to main app
   - User not authenticated → Redirect to welcome/login

---

## 3. Working Principles

### 3.1 File-Based Routing

Expo Router automatically creates routes based on file structure:

```
app/
├── index.tsx                    → Route: "/"
├── (auth)/                      → Route group (no URL segment)
│   ├── _layout.tsx             → Shared layout for auth screens
│   ├── login.tsx               → Route: "/login"
│   ├── register.tsx            → Route: "/register"
│   └── forgot-password.tsx      → Route: "/forgot-password"
├── (main)/                      → Route group (no URL segment)
│   ├── _layout.tsx             → Main app layout
│   ├── (tabs)/                 → Nested route group
│   │   ├── _layout.tsx         → Tab navigation setup
│   │   └── index.tsx           → Route: "/"
│   ├── send-message.tsx        → Route: "/send-message"
│   ├── lock.tsx                → Route: "/lock"
│   └── document-viewer/
│       └── [id].tsx            → Route: "/document-viewer/:id"
└── _layout.tsx                 → Root layout wrapper
```

### 3.2 Stack Navigation

All screens use Stack navigation without visible headers:

```typescript
// app/_layout.tsx (Root)
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}
```

**Benefits:**

- Clean, minimal UI
- Custom navigation components (headers, buttons)
- Full control over appearance

### 3.3 Redirect Logic

Conditional navigation based on authentication state:

```typescript
// app/index.tsx - Entry point
export default function Index() {
  const { isAuthenticated } = useAuthStore();

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href={RoutePaths.HomeScreen} />;
  } else {
    return <Redirect href={RoutePaths.WelcomeScreen} />;
  }
}

// app/(main)/_layout.tsx - Main app guard
export default function MainLayout() {
  const { isAuthenticatedUser } = useAuthStore();

  if (!isAuthenticatedUser) {
    return <Redirect href={RoutePaths.WelcomeScreen} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true
      }}
    >
      <Tabs.Screen name="(tabs)" />
      <Tabs.Screen name="send-message" />
      <Tabs.Screen name="lock" />
    </Tabs>
  );
}
```

---

## 4. Route Groups (Parentheses)

### What Are Route Groups?

Route groups are created using parentheses in folder names. They:

- **Organize code logically** without affecting URL structure
- **Create isolated navigation stacks** per group
- **Don't add URL segments** (clean routes)

### Route Group Examples:

#### Example 1: Authentication Group

```
app/(auth)/
├── _layout.tsx
├── login.tsx            → URL: "/login"
├── register.tsx         → URL: "/register"
└── forgot-password.tsx  → URL: "/forgot-password"
```

- **Folder name with parentheses**: `(auth)` doesn't appear in URL
- **Clean URLs**: `/login`, `/register` (not `/auth/login`)
- **Shared layout**: All auth screens use same layout/animations

#### Example 2: Main App Group

```
app/(main)/
├── _layout.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── messages.tsx     → URL: "/messages"
│   ├── profile.tsx      → URL: "/profile"
│   └── settings.tsx     → URL: "/settings"
├── send-message.tsx     → URL: "/send-message"
└── document-viewer/
    └── [id].tsx         → URL: "/document-viewer/:id"
```

- **Grouped but clean**: `/messages`, `/profile` (not `/main/messages`)
- **Nested groups**: `(tabs)` inside `(main)`
- **Tab navigation**: Shared tab bar across grouped screens

---

## 5. URL Comparison: With vs. Without Parentheses

### ❌ WITHOUT Route Groups (adds URL segments)

```
app/main/tabs/messages.tsx      → URL: /main/tabs/messages
app/main/send-message.tsx       → URL: /main/send-message
app/auth/login.tsx              → URL: /auth/login
app/auth/register.tsx           → URL: /auth/register
```

**Problems:**

- URLs expose internal structure
- Longer, harder to remember
- Difficult to refactor without breaking URLs

### ✅ WITH Route Groups (clean URLs)

```
app/(main)/(tabs)/messages.tsx  → URL: /messages
app/(main)/send-message.tsx     → URL: /send-message
app/(auth)/login.tsx            → URL: /login
app/(auth)/register.tsx         → URL: /register
```

**Benefits:**

- Clean, semantic URLs
- Internal structure hidden
- Easy to reorganize without URL changes
- Better for deep linking and bookmarking

---

## 6. Complete Application Structure

### File Organization

```
app/
├── _layout.tsx                      # Root layout wrapper
├── index.tsx                        # Entry point / redirect logic
│
├── (auth)/                          # 🔓 Authentication route group
│   ├── _layout.tsx                 # Auth screen layout
│   ├── login.tsx                   # /login
│   ├── register.tsx                # /register
│   ├── forgot-password.tsx         # /forgot-password
│   └── verify-email.tsx            # /verify-email
│
└── (main)/                          # 🔐 Authenticated route group
    ├── _layout.tsx                 # Main app layout with guard
    ├── (tabs)/                     # Tab group (no URL segment)
    │   ├── _layout.tsx            # Tab navigator
    │   ├── messages.tsx            # /messages
    │   ├── profile.tsx             # /profile
    │   └── settings.tsx            # /settings
    ├── send-message.tsx            # /send-message
    ├── message-detail/
    │   └── [id].tsx                # /message-detail/:id
    ├── document-viewer/
    │   └── [id].tsx                # /document-viewer/:id
    └── lock.tsx                    # /lock
```

### URL Routing Map

| File Path                         | URL                    | Purpose                     |
| --------------------------------- | ---------------------- | --------------------------- |
| `index.tsx`                       | `/`                    | Entry point, redirect logic |
| `(auth)/login.tsx`                | `/login`               | Login screen                |
| `(auth)/register.tsx`             | `/register`            | Registration screen         |
| `(main)/(tabs)/messages.tsx`      | `/messages`            | Message list                |
| `(main)/(tabs)/profile.tsx`       | `/profile`             | User profile                |
| `(main)/message-detail/[id].tsx`  | `/message-detail/123`  | Message details             |
| `(main)/document-viewer/[id].tsx` | `/document-viewer/abc` | File viewer                 |

---

## 7. Authentication Guard Implementation

### Root Level Guard

```typescript
// app/(main)/_layout.tsx
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";

export default function MainLayout() {
  const { accessToken, refreshToken } = useAuthStore();
  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticatedUser = !!accessToken && !!refreshToken;

  useEffect(() => {
    if (!isAuthenticatedUser) {
      // Redirect to welcome screen if not authenticated
      router.replace(RoutePaths.WelcomeScreen);
    }
  }, [isAuthenticatedUser]);

  if (!isAuthenticatedUser) {
    return <LoadingSpinner />;
  }

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

### Auth Group Layout

```typescript
// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animationEnabled: true
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          animationTypeForReplace: "pop"
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          animationTypeForReplace: "fade"
        }}
      />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

---

## 8. Navigation Examples

### Programmatic Navigation

```typescript
import { useRouter } from "expo-router";

function LoginButton() {
  const router = useRouter();

  const handleLogin = async () => {
    // Perform login
    await login(email, password);

    // Navigate to main app
    router.replace("/messages"); // Clean URL
    // or
    router.replace("/(main)/(tabs)/messages"); // Route name
  };

  return <Button onPress={handleLogin} title="Login" />;
}
```

### Navigate to Dynamic Route

```typescript
function MessageListScreen() {
  const router = useRouter();

  const handleSelectMessage = (messageId: string) => {
    // Navigate with parameter
    router.push(`/message-detail/${messageId}`);
    // Clean URL: /message-detail/123
  };

  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => (
        <MessageItem
          message={item}
          onPress={() => handleSelectMessage(item.id)}
        />
      )}
    />
  );
}
```

### Handle Deep Links

```typescript
// Automatically works with clean URLs
// Deep link: app://messages → /messages
// Deep link: app://message-detail/123 → /message-detail/123
// Deep link: app://login → /login
```

---

## 9. Route Names Reference

Define centralized route constants to avoid magic strings:

```typescript
// constants/RoutePaths.ts
export const RoutePaths = {
  // Entry point
  Index: "/",

  // Auth routes
  WelcomeScreen: "/welcome",
  LoginScreen: "/login",
  RegisterScreen: "/register",
  ForgotPasswordScreen: "/forgot-password",
  VerifyEmailScreen: "/verify-email",

  // Main app routes
  HomeScreen: "/messages",
  ProfileScreen: "/profile",
  SettingsScreen: "/settings",

  // Dynamic routes
  MessageDetailScreen: (id: string) => `/message-detail/${id}`,
  DocumentViewerScreen: (id: string) => `/document-viewer/${id}`,
  SendMessageScreen: "/send-message",
  LockScreen: "/lock"
};

// Usage
router.push(RoutePaths.MessageDetailScreen("msg-123"));
router.replace(RoutePaths.HomeScreen);
<Link href={RoutePaths.LoginScreen} />
```

---

## 10. Advantages of Route Groups

### Organization Benefits

```
✅ Logical grouping without URL pollution
✅ Separate layouts per group (auth vs. main)
✅ Isolated navigation stacks
✅ Easy to refactor without URL changes
✅ Clean, semantic URLs
```

### Developer Experience

```
✅ Self-documenting structure
✅ Clear authentication boundaries
✅ Type-safe route navigation (with proper typing)
✅ Easier code collaboration
✅ Better for onboarding new developers
```

### User Experience

```
✅ Clean, memorable URLs
✅ Shareable deep links
✅ Professional-looking routing
✅ Consistent navigation patterns
✅ Faster perceived performance
```

---

## 11. Comparison: Route Group vs. Regular Folders

### Route Group (Recommended)

```typescript
// app/(main)/messages.tsx
// URL: /messages
// Clear separation, no URL clutter
// Can have shared (main) layout
```

### Regular Folder

```typescript
// app/main/messages.tsx
// URL: /main/messages
// URL exposes structure
// Harder to refactor
```

---

## 12. Testing Routes

```typescript
// __tests__/routing.test.tsx
import { render, screen } from "@testing-library/react-native";
import Index from "@/app/index";

describe("Routing", () => {
  test("should redirect authenticated users to home screen", () => {
    // Mock auth store
    useAuthStore.setState({
      accessToken: "token123",
      refreshToken: "refresh123"
    });

    render(<Index />);
    // Should redirect to /messages
  });

  test("should redirect unauthenticated users to login", () => {
    // Mock auth store (no tokens)
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null
    });

    render(<Index />);
    // Should redirect to /login
  });

  test("should prevent access to main routes without auth", () => {
    // User tries to navigate to /messages without auth
    // Should be redirected to /login
  });
});
```

---

## 13. Summary: Key Takeaways

- **File-based routing**
  - Implementation: File names map to routes automatically
  - Benefit: Predictable, scalable

- **Route groups**
  - Implementation: Use parentheses `(name)`
  - Benefit: Clean URLs, logical organization

- **Stack navigation**
  - Implementation: All screens in Stack container
  - Benefit: Smooth animations, back navigation

- **Authentication guard**
  - Implementation: Check tokens in (main) layout
  - Benefit: Prevent unauthorized access

- **Redirect logic**
  - Implementation: Route based on auth state
  - Benefit: Seamless user experience

- **Dynamic routes**
  - Implementation: Use `[id].tsx` syntax
  - Benefit: Handle parameterized navigation

- **Deep linking**
  - Implementation: Routes automatically work as deep links
  - Benefit: Share & open URLs

---

## Complete Navigation Flow

```
┌─────────────────────────────────────────┐
│         APP STARTS (index.tsx)          │
└──────────────┬──────────────────────────┘
               ↓
       ┌───────────────────┐
       │ Check Auth State  │
       │ Token exists?     │
       └───┬───────────────┘
           │
      YES  │  NO
           ↓  ↓
    ┌──────┐ ┌──────────────────┐
    │      │ │  (auth) Group    │
    │(main)│ │  ├─ login        │
    │ Group│ │  ├─ register     │
    │ ├─tab│ │  └─ forgot-pwd   │
    │ ├─msg│ └──────────────────┘
    │ └─doc│
    └──────┘
       ↓
    Navigate
```

This routing structure provides a clean, maintainable foundation for your application's navigation while keeping URLs semantic and user-friendly.
