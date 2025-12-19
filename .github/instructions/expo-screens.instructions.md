---
applyTo: "app/**/*.tsx"
description: "Instructions for creating and modifying Expo Router screens"
name: "expo-screens"
---

# Expo Router Screen Guidelines

Follow these patterns when working with screens in the `app/` directory.

## Structure & Navigation
- **Default Export**: Screens must be default exported.
- **File-Based Routing**: Follow the folder structure for routing (e.g., `(tabs)`, `(auth)`).
- **Navigation**: Use `router` from `expo-router` for imperative navigation and `Link` for declarative navigation.
- **Params**: Use `useLocalSearchParams()` to access route parameters.

## Styling & Layout
- **Safe Area**: Wrap screen content in `SafeAreaView` (from `react-native-safe-area-context`) if it's a full-screen view not covered by a layout safe area.
- **Theming**: Use `useColorScheme()` to access current theme colors if needed for logic.
- **NativeWind**: Use `className` for layout and styling.

## Screen Template

```tsx
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { useColorScheme } from '@/lib/useColorScheme';

export default function ScreenName() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text variant="title1" className="mb-4">Screen Title</Text>
        
        <Button onPress={() => router.back()}>
          <Text>Go Back</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
```

## Common Patterns
- **Headers**: For screens in `(tabs)` or stacks with `headerShown: false`, implement custom headers using `View` and `Text`.
- **Modals**: Use `presentation: 'modal'` in `_layout.tsx` for modal screens.
