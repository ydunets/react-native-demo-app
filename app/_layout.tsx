import '@/global.css';
import { useEffect, useRef } from 'react';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';
import { AuthProvider } from '@/contexts/auth';
import { DownloadMessageAttachmentsProvider } from '@/contexts/downloadMessageAttachments';
import { useDownloadMessageAttachments } from '@/hooks/useDownloadMessageAttachments';
import { useRecentMessageAttachments } from '@/hooks/useRecentMessageAttachments';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Create QueryClient once outside of component to prevent recreation on re-renders
const queryClient = new QueryClient();

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
                <DownloadMessageAttachmentsProvider>
                  <RootLayoutContent />
                </DownloadMessageAttachmentsProvider>
              </AuthProvider>
            </QueryClientProvider>
          </NavThemeProvider>
        </ActionSheetProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const { attachments, isLoading: isLoadingAttachments } = useRecentMessageAttachments({
    enabled: true,
  });
  const { addFilesToProcessingQueue, startProcessing } = useDownloadMessageAttachments();
  const queuedRef = useRef(false);

  // On app launch, queue recent message attachments for background download (T032)
  // Only queue once to prevent infinite loop
  useEffect(() => {
    if (!isLoadingAttachments && attachments.length > 0 && !queuedRef.current) {
      queuedRef.current = true;
      void addFilesToProcessingQueue(attachments);
      startProcessing();
    }
  }, [isLoadingAttachments, attachments, addFilesToProcessingQueue, startProcessing]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      {/* Root Index - Entry Point */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Auth Stack */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

      {/* Main Stack with Tabs */}
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
    </Stack>
  );
}
