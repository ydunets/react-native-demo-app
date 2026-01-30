import { create } from 'zustand';
import { DownloadProgressStore } from './types';

const initialState = {
  totalFiles: 0,
  currentFile: 0,
  remainingFiles: 0,
};

export const useDownloadProgressStore = create<DownloadProgressStore>((set) => ({
  ...initialState,
  actions: {
    setProgress: (current: number, total: number) =>
      set({
        currentFile: current,
        totalFiles: total,
        remainingFiles: total - current,
      }),
    resetProgress: () => set(initialState),
  },
}));
