# Stack vs Tabs Navigation in Expo Router

## Overview

Understanding the difference between Stack and Tabs navigation is crucial for building intuitive mobile applications. Each serves different purposes in your information architecture.

---

## 1. Stack Navigation

### Principle: LIFO (Last In, First Out)

Stack navigation works like a pile of cards—the most recently added card is on top, and removing it reveals the card beneath.

### Characteristics

```
📱 Linear Navigation      - One screen on top of another
⬅️  Back Button          - Return to previous screen
📚 History               - Stack remembers navigation path
🎯 Single Focus          - Only one screen is active
🔄 State Management      - Each screen maintains its own state
```

### Visual Flow

```
User opens app
    ↓
Screen A (base)
    ↓
User navigates forward
    ↓
Screen A
  Screen B (on top)
    ↓
User navigates forward
    ↓
Screen A
  Screen B
    Screen C (on top - currently visible)
    ↓
User taps back
    ↓
Screen A
  Screen B (back to previous)
    ↓
User taps back
    ↓
Screen A (initial state)
```

### Implementation

```typescript
// app/(main)/_layout.tsx - Main Stack Navigation
import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true
      }}
    >
      {/* Tab-based screens */}
      <Stack.Screen name="(tabs)" />

      {/* Modal screens (presentation: "modal") */}
      <Stack.Screen
        name="send-message"
        options={{
          presentation: "modal",
          animationEnabled: true
        }}
      />

      {/* Full-screen overlay */}
      <Stack.Screen
        name="lock"
        options={{
          presentation: "fullScreenModal"
        }}
      />
    </Stack>
  );
}
```

### Presentation Options

| Option               | Use Case                 | Animation         |
| -------------------- | ------------------------ | ----------------- |
| **card**             | Normal screen transition | Slide from right  |
| **modal**            | Modal dialog             | Slide from bottom |
| **fullScreenModal**  | Full overlay             | Fade/slide        |
| **transparentModal** | Semi-transparent overlay | Fade              |

### Use Cases for Stack Navigation

✅ **Detail Screens** - List → Details (Messages → Message Details)  
✅ **Forms & Steps** - Multi-step processes (Login → Verification → Dashboard)  
✅ **Modal Dialogs** - Quick actions (Confirm → Save)  
✅ **Temporary Screens** - Overlay content (Lock screen, onboarding)  
✅ **Nested Navigation** - Deep navigation hierarchies

### Real-world Example

```typescript
// Messages Stack (inside Tabs)
<Stack>
  <Stack.Screen name="messages-list" />

  {/* Navigate to details: forward */}
  <Stack.Screen name="message-detail/[id]" />

  {/* Show compose as modal: forward */}
  <Stack.Screen
    name="compose-message"
    options={{ presentation: "modal" }}
  />

  {/* Go back: previous screen shown */}
</Stack>
```

---

## 2. Tabs Navigation

### Principle: Horizontal Switching

Tabs navigation allows switching between multiple screens that are logically grouped and equally important.

### Characteristics

```
🔄 Section Switching     - Jump between main sections
👀 Always Visible        - All tabs visible simultaneously
💾 State Persistence     - Each tab remembers its state
🏠 Primary Navigation    - Main app sections
⚡ Quick Access          - One-tap access to all major sections
```

### Visual Flow

```
┌─────────────────────────────────────┐
│    Tab 1    Tab 2    Tab 3          │
│  ┌───────┐  ┌──────┐  ┌─────────┐   │
│  │Content│  │      │  │         │   │
│  │of Tab │  │Empty │  │ Empty   │   │
│  │  1    │  │      │  │         │   │
│  └───────┘  └──────┘  └─────────┘   │
│                                     │
│  🏠Messages 📋Services 👤 Profile   │
└─────────────────────────────────────┘

User taps Tab 2
    ↓
┌─────────────────────────────────────┐
│    Tab 1    Tab 2    Tab 3          │
│  ┌───────┐  ┌──────┐  ┌─────────┐   │
│  │Content│  │Content│  │         │   │
│  │of Tab1│  │of Tab 2│  │ Empty   │   │
│  │(saved)│  │(fresh) │  │         │   │
│  └───────┘  └──────┘  └─────────┘   │
│                                     │
│  🏠Messages 📋Services 👤 Profile   │
└─────────────────────────────────────┘

User goes back to Tab 1
    ↓
Content of Tab 1 is still there (state preserved)
```

### Implementation

```typescript
// app/(main)/(tabs)/_layout.tsx - Real Kii Mobile Implementation
import { useCallback } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Tabs, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { Entypo, FontAwesome6, Ionicons } from "@expo/vector-icons";

import { HomeIcon, KiiBlackIcon } from "@/assets/icons";
import { TabBar, Text } from "@/components/ui";
import { FilesStorageButton, DownloadButton } from "@/components/ui/Buttons";
import { MailTabBarIcon } from "@/components/ui/MailTabBarIcon";
import { Colors, RoutePaths } from "@/constants";
import { useAuthContext } from "@/contexts/auth";
import { useHasAccess } from "@/hooks";

const styles = StyleSheet.create({
  headerStyle: {
    height: Platform.select({ ios: 120 }),
    backgroundColor: Colors.light.secondary["beige-1"]
  }
});

const HeaderRightButton = () => {
  const pathname = usePathname();
  const isShowUploadButton = [
    "/resource-library",
    "/stronger-minds"
  ].some((path) => pathname.includes(path));

  return isShowUploadButton ? <DownloadButton /> : <FilesStorageButton />;
};

const HeaderLeftButton = () => {
  const { logout } = useAuthContext();
  const pathname = usePathname();
  const { t } = useTranslation();
  const isHomeScreen = pathname === RoutePaths.HomeScreen;

  const handlePressBack = useCallback(async () => {
    if (isHomeScreen) {
      await logout();
    }
  }, [logout, pathname]);

  if (isHomeScreen) {
    return (
      <TouchableOpacity onPress={handlePressBack}>
        <Entypo name="chevron-left" size={24} color="black" />
        <Text>{t("header.logout")}</Text>
      </TouchableOpacity>
    );
  }
  return null;
};

export default function TabsLayout() {
  const user = usePatientProfile();
  const { isUserHasAccessToLiveChat, isUserHasAccessToMessages } = useHasAccess();
  const params = useGlobalSearchParams<{ pillar: string }>();

  useCheckInactivity();

  // Show loading state while user profile is loading
  if (!user.userId) {
    return (
      <>
        <View className="flex-1 justify-center">
          <ActivityIndicator size={"large"} />
        </View>
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <>
      <Tabs
        tabBar={TabBar}  // Custom tab bar component
        backBehavior="history"
        screenOptions={() => ({  // Function to access dynamic props
          swipeEnabled: true,
          headerTitle: (props) => (
            <View className="flex-1 justify-center">
              <KiiBlackIcon color={props.tintColor} />
            </View>
          ),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTitleAlign: "center",
          headerLeft: HeaderLeftButton,
          headerRight: HeaderRightButton
        })}
      >
        {/* Tab 1: Home/Pillars */}
        <Tabs.Screen
          name="(pillars)"
          options={{
            tabBarShowLabel: false,
            headerShadowVisible: Boolean(params.pillar),  // Dynamic shadow
            tabBarIcon: ({ focused, color }) => {
              return focused ? (
                <FontAwesome6 name="house" size={28} color={color} />
              ) : (
                <HomeIcon color={color} />
              );
            }
          }}
        />

        {/* Tab 2: Messages (conditional) */}
        <Tabs.Screen
          name="(messages)"
          redirect={!isUserHasAccessToMessages}  // Hide if no access
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color }) => (
              <MailTabBarIcon iconColor={color} focused={focused} />
            )
          }}
        />

        {/* Tab 3: Live Chat (conditional) */}
        <Tabs.Screen
          name="(chat)"
          redirect={!isUserHasAccessToLiveChat}  // Hide if no access
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "chatbox-ellipses" : "chatbox-ellipses-outline"}
                size={28}
                color={color}
              />
            )
          }}
        />

        {/* Tab 4: Profile */}
        <Tabs.Screen
          name="patient"
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={28}
                color={color}
              />
            )
          }}
        />
      </Tabs>
      <StatusBar style="dark" />
    </>
  );
}
```

### Use Cases for Tabs Navigation

✅ **Main App Sections** - Messages, Services, Profile  
✅ **Equal Priority** - All sections equally important  
✅ **Quick Switching** - Users frequently switch between tabs  
✅ **Persistent State** - Each tab remembers user's position  
✅ **Bottom Navigation** - Standard mobile pattern

### Real-world Example

```typescript
// Kii Health Mobile structure
<Tabs>
  {/* Tab 1: Messages Stack */}
  <Tabs.Screen name="(messages-stack)">
    {/* Inside this tab:
         - Messages List
         - Message Details
         - Compose (modal)
    */}
  </Tabs.Screen>

  {/* Tab 2: Services/Pillars Stack */}
  <Tabs.Screen name="(services-stack)">
    {/* Inside this tab:
         - Services List
         - Service Details
         - Filter (modal)
    */}
  </Tabs.Screen>

  {/* Tab 3: Profile Stack */}
  <Tabs.Screen name="(profile-stack)">
    {/* Inside this tab:
         - Profile Overview
         - Edit Profile
         - Settings
    */}
  </Tabs.Screen>
</Tabs>
```

---

## 3. Combined Navigation Architecture

### Hierarchy

```
┌─────────────────────────────────────────────────────┐
│              Root Stack                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ├─ (auth) Stack                                    │
│  │  ├─ login                                        │
│  │  ├─ register                                     │
│  │  └─ forgot-password                              │
│  │                                                  │
│  └─ (main) Stack                                    │
│     │                                               │
│     ├─ (tabs) - Bottom Tab Navigation               │
│     │  ├─ messages (tab 1)                          │
│     │  │   └─ Stack inside: list → detail           │
│     │  ├─ services (tab 2)                          │
│     │  │   └─ Stack inside: list → detail           │
│     │  └─ profile (tab 3)                           │
│     │      └─ Stack inside: overview → edit         │
│     │                                               │
│     ├─ send-message (modal - Stack)                 │
│     │                                               │
│     └─ lock (fullScreenModal - Stack)               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Code Structure

```typescript
// app/_layout.tsx - Root Stack
<Stack>
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(main)" />
</Stack>

// app/(main)/_layout.tsx - Main Stack with Tabs
<Stack>
  <Stack.Screen name="(tabs)" />

  {/* Modals over tabs */}
  <Stack.Screen
    name="send-message"
    options={{ presentation: "modal" }}
  />
  <Stack.Screen
    name="lock"
    options={{ presentation: "fullScreenModal" }}
  />
</Stack>

// app/(main)/(tabs)/_layout.tsx - Tabs Navigation
<Tabs>
  <Tabs.Screen name="messages" />
  <Tabs.Screen name="services" />
  <Tabs.Screen name="profile" />
</Tabs>

// app/(main)/(tabs)/messages/_layout.tsx - Stack inside Tab
<Stack>
  <Stack.Screen name="index" /> {/* List */}
  <Stack.Screen name="[id]" />  {/* Details */}
</Stack>
```

---

## 4. Comparison Table

### Navigation Patterns

| Aspect              | Stack              | Tabs                   |
| ------------------- | ------------------ | ---------------------- |
| **Navigation Type** | Vertical (deeper)  | Horizontal (switching) |
| **Back Button**     | Yes                | No                     |
| **Visibility**      | One screen visible | All tabs visible       |
| **State**           | Per screen         | Per tab (preserved)    |
| **Use Case**        | Details, flows     | Main sections          |
| **Animation**       | Slide/fade         | Tab switch             |
| **Memory**          | Linear history     | Independent state      |

### When to Use Each

#### Stack Navigation ✅

```typescript
// Showing details for an item
router.push(`/message-detail/${messageId}`);

// Multi-step form
router.push("/step-1");
router.push("/step-2");
router.push("/step-3");

// Modal dialog
router.push("/confirm-delete");

// Temporary overlay
router.push("/loading");
```

#### Tabs Navigation ✅

```typescript
// Switch between major app sections
// User can quickly toggle: Messages ↔ Services ↔ Profile

// Each section maintains its scroll position
// Switching back to "Messages" keeps scroll at same spot

// All tabs equally important
// No hierarchical relationship
```

---

## 5. Real-world Kii Mobile Example

### Complete Navigation Structure

```typescript
// Root level: Auth vs Main
<Stack>
  <Stack.Screen name="(auth)" /> // Login/Register
  <Stack.Screen name="(main)" /> // Authenticated
</Stack>

// Main app: Modals over Tabs
<Stack>
  <Stack.Screen name="(tabs)" /> // Bottom nav tabs

  {/* Send message modal */}
  <Stack.Screen
    name="send-message"
    options={{ presentation: "modal" }}
  />

  {/* Lock screen */}
  <Stack.Screen
    name="lock"
    options={{ presentation: "fullScreenModal" }}
  />
</Stack>

// Tab bar: Three main sections
<Tabs>
  {/* Messages */}
  <Tabs.Screen name="messages">
    <Stack>
      <Stack.Screen name="index" /> {/* List */}
      <Stack.Screen name="[id]" /> {/* Details */}
    </Stack>
  </Tabs.Screen>

  {/* Services/Pillars */}
  <Tabs.Screen name="services">
    <Stack>
      <Stack.Screen name="index" /> {/* Pillar list */}
      <Stack.Screen name="[id]" /> {/* Pillar details */}
    </Stack>
  </Tabs.Screen>

  {/* Profile */}
  <Tabs.Screen name="profile">
    <Stack>
      <Stack.Screen name="index" /> {/* Overview */}
      <Stack.Screen name="edit" /> {/* Edit profile */}
      <Stack.Screen name="settings" /> {/* Settings */}
    </Stack>
  </Tabs.Screen>
</Tabs>
```

### User Journey Example

```
User opens app
    ↓
Sees Auth Stack (login screen)
    ↓
Logs in successfully
    ↓
Navigated to Main Stack with Tabs
    ↓
Tabs show: Messages | Services | Profile
    ↓
User taps "Messages" tab (already selected)
    ↓
Sees message list (Stack: index)
    ↓
User taps a message
    ↓
Navigates within Stack: message details shown
    ↓
User taps back button
    ↓
Returns to message list
    ↓
User taps "Services" tab
    ↓
Tab state preserved: sees services list where they left off
    ↓
User taps a service
    ↓
Navigates within Stack: service details shown
```

---

## 6. State Management Differences

### Stack Navigation State

```typescript
// Each screen in stack has independent state
// Going back removes that state

Stack:
  Screen A (state: { counter: 1 })
  Screen B (state: { counter: 2 })
  Screen C (state: { counter: 3 })

User presses back from C
    ↓
  Screen A (state: { counter: 1 })
  Screen B (state: { counter: 2 })

// Screen C's state is gone
```

### Tabs Navigation State

```typescript
// Each tab maintains independent state
// Switching tabs doesn't lose state

Tab 1 - Messages:
  (state: { scrollPosition: 150, filter: "unread" })

Tab 2 - Services:
  (state: { scrollPosition: 200, selectedPillar: "mental-health" })

Tab 3 - Profile:
  (state: { editMode: false, notifications: true })

User switches: Tab1 → Tab2 → Tab1
    ↓
Tab 1 still has: { scrollPosition: 150, filter: "unread" }
// State preserved!
```

---

## 7. Best Practices

### Stack Navigation Best Practices

✅ Use `presentation: "modal"` for dialogs  
✅ Use back button for linear flows  
✅ Limit depth (max 3-4 screens deep)  
✅ Clear navigation history when needed with `replace()`  
✅ Provide visual feedback for current position

### Tabs Navigation Best Practices

✅ Limit to 3-5 tabs maximum  
✅ Use clear icons for each tab  
✅ Keep tab content independent  
✅ Preserve scroll position when switching  
✅ Label tabs clearly

---

## 8. Common Patterns

### Pattern 1: Master-Detail with Tabs

```typescript
<Tabs>
  <Tabs.Screen name="list"> {/* List of items */}
    <Stack>
      <Stack.Screen name="index" /> {/* Master list */}
      <Stack.Screen name="detail/[id]" /> {/* Detail view */}
    </Stack>
  </Tabs.Screen>
</Tabs>
```

### Pattern 2: Modal over Tabs

```typescript
<Stack>
  <Stack.Screen name="(tabs)" /> {/* Normal navigation */}

  {/* Modal appears on top of any tab */}
  <Stack.Screen
    name="modal"
    options={{ presentation: "modal" }}
  />
</Stack>
```

### Pattern 3: Nested Stacks in Tabs

```typescript
<Tabs>
  {/* Tab 1: Has its own stack */}
  <Tabs.Screen name="tab1">
    <Stack>
      <Stack.Screen name="screen-a" />
      <Stack.Screen name="screen-b" />
    </Stack>
  </Tabs.Screen>

  {/* Tab 2: Also has its own stack */}
  <Tabs.Screen name="tab2">
    <Stack>
      <Stack.Screen name="screen-c" />
      <Stack.Screen name="screen-d" />
    </Stack>
  </Tabs.Screen>
</Tabs>
```

---

## Summary

### Choose Stack When:

- Showing detailed information (list → details)
- Creating multi-step flows
- Displaying modal dialogs
- Building hierarchical navigation

### Choose Tabs When:

- Organizing main app sections
- All sections equally important
- Users need quick switching
- State persistence is important

**Best Result**: Combine both! Use Tabs for main navigation and Stack for details within each tab section.
