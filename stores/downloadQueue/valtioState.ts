/**
 * Valtio Download Queue State
 *
 * Replaces Zustand store with Valtio proxy-based state management.
 * Uses Actions pattern with atomic state updates and computed properties.
 *
 * Persistence: Uses MMKV via subscribe() for automatic sync.
 *
 * Benefits over Zustand + useRef:
 * - No re-renders during queue processing (direct proxy mutation)
 * - Computed properties via getters (auto-calculated)
 * - Selective reactivity with useSnapshot
 * - Simpler mental model (no selector functions needed)
 */

import { proxy, subscribe } from 'valtio';
import type { DownloadCommand } from './types';
import { createMMKV, MMKV } from 'react-native-mmkv';
import { envConfig } from '@/configs/env-config';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type QueueStatus = 'idle' | 'processing' | 'paused' | 'queued';

interface PersistedState {
  queue: DownloadCommand[];
  completedIds: string[];
}

export const downloadQueueMMKV: MMKV = createMMKV({
  id: 'download-queue-storage', 
  encryptionKey: envConfig.mmkvEncryptionKey,
});


// ═══════════════════════════════════════════════════════════════
// PERSISTENCE: MMKV Storage
// ═══════════════════════════════════════════════════════════════

const QUEUE_MMKV_KEY = 'queue-mmkv-storage';

function loadPersistedState(): PersistedState | null {
  try {
    const stored = downloadQueueMMKV.getString(QUEUE_MMKV_KEY);
    if (stored) {
      return JSON.parse(stored) as PersistedState;
    }
  } catch (error) {
    console.warn('[Queue] Failed to load persisted state:', error);
  }
  return null;
}

function persistState(state: { queue: DownloadCommand[]; completedIds: Set<string> }) {
  try {
    const toPersist: PersistedState = {
      queue: state.queue,
      completedIds: Array.from(state.completedIds),
    };
    downloadQueueMMKV.set(QUEUE_MMKV_KEY, JSON.stringify(toPersist));
  } catch (error) {
    console.warn('[Queue] Failed to persist state:', error);
  }
}

// Load initial state from storage
const persisted = loadPersistedState();

// ═══════════════════════════════════════════════════════════════
// STATE: Pure data + computed properties
// ═══════════════════════════════════════════════════════════════

export const downloadQueueState = proxy({
  // ─── Core State ─────────────────────────────────────────────
  queue: (persisted?.queue ?? []) as DownloadCommand[],
  isProcessing: false,
  completedIds: new Set<string>(persisted?.completedIds ?? []),
  
  // Pause reasons
  pausedDueToAuth: false,
  pausedDueToBackground: false,
  pausedDueToMessageDownload: false,

  // Processing control (replaces useRef pattern)
  shouldStop: false,
  totalCount: 0,

  // ─── Computed Properties ────────────────────────────────────
  get queueCount() {
    return this.queue.length;
  },

  get completedCount() {
    return this.completedIds.size;
  },

  get progressPercentage() {
    if (this.totalCount === 0) return 0;
    return Math.ceil((this.completedIds.size / this.totalCount) * 100);
  },

  get isIdle() {
    return !this.isProcessing && this.queue.length === 0;
  },

  get hasQueuedItems() {
    return this.queue.length > 0;
  },

  get currentCommand(): DownloadCommand | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  },

  get currentCommandId(): string | null {
    return this.queue.length > 0 ? this.queue[0].id : null;
  },

  get status(): QueueStatus {
    if (this.shouldStop || this.pausedDueToAuth || this.pausedDueToBackground || this.pausedDueToMessageDownload) {
      return 'paused';
    }
    if (this.isProcessing) return 'processing';
    if (this.queue.length > 0) return 'queued';
    return 'idle';
  },

  get isPaused() {
    return this.pausedDueToAuth || this.pausedDueToBackground || this.pausedDueToMessageDownload || this.shouldStop;
  },
});

// ═══════════════════════════════════════════════════════════════
// ACTIONS: Each action updates state atomically (immutable patterns)
// ═══════════════════════════════════════════════════════════════

export const downloadQueueActions = {
  /**
   * Add a command to the queue (immutable)
   */
  addCommand(command: DownloadCommand) {
    downloadQueueState.queue = [...downloadQueueState.queue, command];
  },
  /**
   * Remove a specific command by ID (immutable)
   */
  removeCommand(id: string) {
    downloadQueueState.queue = downloadQueueState.queue.filter((cmd) => cmd.id !== id);
  },

  /**
   * Start processing the queue
   */
  startProcessing() {
    // Only set totalCount if starting fresh
    if (downloadQueueState.completedIds.size === 0) {
      downloadQueueState.totalCount = downloadQueueState.queue.length;
    }
    downloadQueueState.isProcessing = true;
    downloadQueueState.shouldStop = false;
    downloadQueueState.pausedDueToAuth = false;
    downloadQueueState.pausedDueToBackground = false;
    downloadQueueState.pausedDueToMessageDownload = false;
  },

  /**
   * Pause processing (graceful stop after current file)
   */
  pauseProcessing() {
    downloadQueueState.shouldStop = true;
    downloadQueueState.isProcessing = false;
  },

  /**
   * Pause due to app going to background
   */
  pauseDueToBackground() {
    downloadQueueState.pausedDueToBackground = true;
    downloadQueueState.isProcessing = false;
  },

  /**
   * Pause due to message download in progress
   */
  pauseDueToMessageDownload() {
    downloadQueueState.pausedDueToMessageDownload = true;
    downloadQueueState.isProcessing = false;
  },

  /**
   * Pause due to authentication issues
   */
  pauseDueToAuth() {
    downloadQueueState.pausedDueToAuth = true;
    downloadQueueState.isProcessing = false;
  },

  /**
   * Resume processing after pause
   */
  resumeProcessing() {
    downloadQueueState.shouldStop = false;
    downloadQueueState.pausedDueToAuth = false;
    downloadQueueState.pausedDueToBackground = false;
    downloadQueueState.pausedDueToMessageDownload = false;
    downloadQueueState.isProcessing = true;
  },

  /**
   * Mark current file as completed and remove from queue (immutable)
   */
  completeCurrentCommand() {
    const [first, ...rest] = downloadQueueState.queue;
    if (first) {
      downloadQueueState.completedIds.add(first.id);
      downloadQueueState.queue = rest;
    }
  },

  /**
   * Mark a specific ID as completed (without removing from queue)
   */
  markCompleted(id: string) {
    downloadQueueState.completedIds.add(id);
  },

  /**
   * Complete processing (queue empty or stopped)
   */
  completeProcessing() {
    downloadQueueState.isProcessing = false;
    downloadQueueState.shouldStop = false;
  },

  /**
   * Reset entire queue to initial state
   */
  resetQueue() {
    downloadQueueState.queue = [];
    downloadQueueState.isProcessing = false;
    downloadQueueState.completedIds.clear();
    downloadQueueState.pausedDueToAuth = false;
    downloadQueueState.pausedDueToBackground = false;
    downloadQueueState.pausedDueToMessageDownload = false;
    downloadQueueState.shouldStop = false;
    downloadQueueState.totalCount = 0;
  },

  /**
   * Check if a specific ID is completed
   */
  isCompleted(id: string): boolean {
    return downloadQueueState.completedIds.has(id);
  },

  /**
   * Get completed IDs Set reference
   */
  getCompletedIds(): Set<string> {
    return downloadQueueState.completedIds;
  },

  /**
   * Clear persisted storage
   */
  clearPersistedState() {
    downloadQueueMMKV.remove(QUEUE_MMKV_KEY);
  },
};

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE: Subscribe to state changes and persist
// ═══════════════════════════════════════════════════════════════

subscribe(downloadQueueState, () => {
  // Persist only queue and completedIds
  persistState({
    queue: downloadQueueState.queue,
    completedIds: downloadQueueState.completedIds,
  });

  // Debug logging in development
  if (__DEV__) {
    console.log('[Queue State]', {
      status: downloadQueueState.status,
      progress: `${downloadQueueState.progressPercentage}%`,
      queueCount: downloadQueueState.queueCount,
      completedCount: downloadQueueState.completedCount,
    });
  }
});
