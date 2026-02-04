// Valtio state and actions
export {
  downloadQueueState,
  downloadQueueActions,
  downloadQueueMMKV,
  type QueueStatus,
} from './valtioState';

// Valtio hooks
export {
  useQueueSnapshot,
  useQueue,
  useIsProcessing,
  useQueueCount,
  useCompletedCount,
  useProgressPercentage,
  useCurrentCommand,
  useCurrentCommandId,
  useQueueStatus,
  useIsIdle,
  useHasQueuedItems,
  useIsPaused,
  usePausedDueToAuth,
  usePausedDueToBackground,
  usePausedDueToMessageDownload,
  useQueueActions,
  useQueueStateRef,
  useQueueProgress,
  useQueueManager,
  useIsCompleted,
} from './valtioHooks';

// Types
export type { DownloadCommand } from './types';
