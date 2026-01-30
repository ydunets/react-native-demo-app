import { useDownloadProgressStore } from './downloadProgressStore';
import { selectTotalFiles, selectCurrentFile, selectRemainingFiles, selectActions } from './selectors';

export const useTotalFiles = () => useDownloadProgressStore(selectTotalFiles);
export const useCurrentFile = () => useDownloadProgressStore(selectCurrentFile);
export const useRemainingFiles = () => useDownloadProgressStore(selectRemainingFiles);
export const useDownloadProgressActions = () => useDownloadProgressStore(selectActions);
