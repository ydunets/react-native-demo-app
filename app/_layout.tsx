import '@/global.css';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';
import { AuthProvider } from '@/contexts/auth';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient()

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <SafeAreaProvider>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ActionSheetProvider>
          <NavThemeProvider value={NAV_THEME[colorScheme]}>
            <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                {/* Root Index - Entry Point */}
                <Stack.Screen name="index" options={{ headerShown: false }} />

                {/* Auth Stack */}
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />

                {/* Main Stack with Tabs */}
                <Stack.Screen name="(main)" options={{ headerShown: false }} />
              </Stack>
            </AuthProvider>
            </QueryClientProvider>
          </NavThemeProvider>
        </ActionSheetProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
