import { useDownloadQueueStore } from './downloadQueueStore';
import {
  selectDownloadQueueActions,
  selectQueue,
  selectIsProcessing,
  selectCompletedIds,
  selectQueueCount,
  selectCompletedCount,
  selectInFlightId,
} from './selectors';
import type { DownloadQueueStore } from './types';

export const useDownloadQueueActions = (): DownloadQueueStore['actions'] =>
  useDownloadQueueStore(selectDownloadQueueActions);

export const useQueue = (): DownloadQueueStore['queue'] =>
  useDownloadQueueStore(selectQueue);

export const useIsProcessing = (): boolean =>
  useDownloadQueueStore(selectIsProcessing);

export const useCompletedIds = (): string[] =>
  useDownloadQueueStore(selectCompletedIds);

export const useQueueCount = (): number =>
  useDownloadQueueStore(selectQueueCount);

export const useCompletedCount = (): number =>
  useDownloadQueueStore(selectCompletedCount);

export const useInFlightAttachmentId = (): string | null =>
  useDownloadQueueStore(selectInFlightId);
