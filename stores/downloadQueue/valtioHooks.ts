/**
 * Valtio Download Queue Hooks
 *
 * Reactive hooks for accessing Valtio download queue state.
 * Uses useSnapshot for automatic re-renders on state changes.
 *
 * Pattern: Each hook returns a specific slice of state,
 * similar to Zustand selectors but with Valtio's proxy-based reactivity.
 */

import { useSnapshot } from 'valtio';
import { downloadQueueState, downloadQueueActions, type QueueStatus } from './valtioState';
import type { DownloadCommand } from './types';

// ═══════════════════════════════════════════════════════════════
// REACTIVE HOOKS: Use useSnapshot for automatic re-renders
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current queue array (reactive)
 */
export const useQueue = (): readonly DownloadCommand[] => {
  const snap = useSnapshot(downloadQueueState);
  return snap.queue;
};

/**
 * Get processing status (reactive)
 */
export const useIsProcessing = (): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.isProcessing;
};

/**
 * Get queue count (reactive, computed)
 */
export const useQueueCount = (): number => {
  const snap = useSnapshot(downloadQueueState);
  return snap.queueCount;
};

/**
 * Get completed count (reactive, computed)
 */
export const useCompletedCount = (): number => {
  const snap = useSnapshot(downloadQueueState);
  return snap.completedCount;
};

/**
 * Get progress percentage (reactive, computed)
 */
export const useProgressPercentage = (): number => {
  const snap = useSnapshot(downloadQueueState);
  return snap.progressPercentage;
};

/**
 * Get current command being processed (reactive, computed)
 */
export const useCurrentCommand = (): DownloadCommand | null => {
  const snap = useSnapshot(downloadQueueState);
  return snap.currentCommand as DownloadCommand | null;
};

/**
 * Get current command ID (reactive, computed)
 */
export const useCurrentCommandId = (): string | null => {
  const snap = useSnapshot(downloadQueueState);
  return snap.currentCommandId;
};

/**
 * Get queue status (reactive, computed)
 */
export const useQueueStatus = (): QueueStatus => {
  const snap = useSnapshot(downloadQueueState);
  return snap.status;
};

/**
 * Check if queue is idle (reactive, computed)
 */
export const useIsIdle = (): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.isIdle;
};

/**
 * Check if queue has items (reactive, computed)
 */
export const useHasQueuedItems = (): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.hasQueuedItems;
};

/**
 * Check if queue is paused (reactive, computed)
 */
export const useIsPaused = (): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.isPaused;
};

// ─── Pause Reason Hooks ───────────────────────────────────────

export const usePausedDueToAuth = (): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.pausedDueToAuth;
};

export const usePausedDueToBackground = (): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.pausedDueToBackground;
};

export const usePausedDueToMessageDownload = (): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.pausedDueToMessageDownload;
};

// ═══════════════════════════════════════════════════════════════
// NON-REACTIVE ACCESS: Direct state/actions (no re-renders)
// ═══════════════════════════════════════════════════════════════

/**
 * Get actions object (stable reference, no re-renders)
 * Actions mutate proxy directly, don't need reactivity
 */
export const useQueueActions = () => {
  return downloadQueueActions;
};

/**
 * Direct access to proxy state (for imperative code)
 * WARNING: Does NOT trigger re-renders - use for event handlers only
 */
export const useQueueStateRef = () => {
  return downloadQueueState;
};

// ═══════════════════════════════════════════════════════════════
// COMBINED HOOKS: Common patterns
// ═══════════════════════════════════════════════════════════════

/**
 * Combined hook for progress UI
 * Returns all progress-related values
 */
export const useQueueProgress = () => {
  const snap = useSnapshot(downloadQueueState);
  return {
    queueCount: snap.queueCount,
    completedCount: snap.completedCount,
    progressPercentage: snap.progressPercentage,
    isProcessing: snap.isProcessing,
    status: snap.status,
  };
};

/**
 * Check if specific ID is completed
 * Uses direct state access for performance
 */
export const useIsCompleted = (id: string): boolean => {
  const snap = useSnapshot(downloadQueueState);
  return snap.completedIds.has(id);
};
