/**
 * useDownloadMessageAttachments Hook
 * Provides type-safe access to download queue context from any component
 *
 * Usage:
 * ```tsx
 * const { queue, isProcessing, addCommand, startProcessing } = useDownloadMessageAttachments();
 * ```
 *
 * Error Handling:
 * - Throws error if used outside DownloadMessageAttachmentsProvider
 * - Provides clear error message for debugging
 */

import { useContext, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

import {
  DownloadMessageAttachmentsContext,
  DownloadContextType,
} from '@/contexts/downloadMessageAttachments';

export interface DownloadHookOptions {
  autoManageNetwork?: boolean;
  autoManageAppState?: boolean;
}

/**
 * Hook to access download queue context
 * Must be called inside DownloadMessageAttachmentsProvider
 *
 * @returns DownloadContextType with queue management API
 * @throws Error if used outside provider
 */
export const useDownloadMessageAttachments = (
  options?: DownloadHookOptions
): DownloadContextType => {
  const context = useContext(DownloadMessageAttachmentsContext);

  const lastAppState = useRef<AppStateStatus>(AppState.currentState);
  const lastNetworkConnected = useRef<boolean | null>(null);
  const autoManageNetwork = options?.autoManageNetwork ?? true;
  const autoManageAppState = options?.autoManageAppState ?? true;

  if (!context) {
    throw new Error(
      '[useDownloadMessageAttachments] Must be used within DownloadMessageAttachmentsProvider. ' +
        'Ensure DownloadMessageAttachmentsProvider wraps your app in _layout.tsx'
    );
  }

  // Pause/resume based on network status
  // Use ref to track last network state and avoid effect re-runs from state changes
  useEffect(() => {
    if (!autoManageNetwork) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;

      // Only update if network state actually changed
      if (lastNetworkConnected.current === isConnected) {
        return;
      }

      lastNetworkConnected.current = isConnected;

      if (isConnected) {
        context.resumeProcessing();
        context.startProcessing();
      } else {
        context.pauseProcessing();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [autoManageNetwork, context.pauseProcessing, context.resumeProcessing, context.startProcessing]);

  // Pause/resume based on app foreground/background
  useEffect(() => {
    if (!autoManageAppState) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasActive = lastAppState.current === 'active';
      const isNowActive = nextAppState === 'active';

      lastAppState.current = nextAppState;

      if (isNowActive && !wasActive) {
        context.resumeProcessing();
        context.startProcessing();
      }

      if (!isNowActive && wasActive) {
        context.pauseProcessing();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [autoManageAppState, context.pauseProcessing, context.resumeProcessing, context.startProcessing]);

  return context;
};
