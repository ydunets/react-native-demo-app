// Valtio state and actions
export {
  downloadQueueState,
  downloadQueueActions,
  downloadQueueMMKV,
  type QueueStatus,
} from './valtioState';

// Valtio hooks
export {
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
  useIsCompleted,
} from './valtioHooks';

// Types
export type { DownloadCommand } from './types';
