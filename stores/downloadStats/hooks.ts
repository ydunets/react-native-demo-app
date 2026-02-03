import { useDownloadStatsStore } from './downloadStatsStore';
import {
  selectDownloadStatsActions,
  selectTotalProcessed,
  selectTotalSkipped,
  selectQueuedCount,
  selectDownloadedCount,
  selectFailedCount,
} from './selectors';
import type { DownloadStatsStore } from './types';

export const useDownloadStatsActions = (): DownloadStatsStore['actions'] =>
  useDownloadStatsStore(selectDownloadStatsActions);

export const useTotalProcessed = (): number =>
  useDownloadStatsStore(selectTotalProcessed);

export const useTotalSkipped = (): number =>
  useDownloadStatsStore(selectTotalSkipped);

export const useQueuedCount = (): number =>
  useDownloadStatsStore(selectQueuedCount);

export const useDownloadedCount = (): number =>
  useDownloadStatsStore(selectDownloadedCount);

export const useFailedCount = (): number =>
  useDownloadStatsStore(selectFailedCount);
