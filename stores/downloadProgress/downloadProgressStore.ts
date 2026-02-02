import { create } from 'zustand';
import { DownloadProgressStore } from './types';

const initialState = {
  totalFiles: 0,
  currentFile: 0,
  remainingFiles: 0,
  currentFilename: '',
};

export const useDownloadProgressStore = create<DownloadProgressStore>((set) => ({
  ...initialState,
  actions: {
    setProgress: (current: number, total: number, filename?: string) =>
      set((state) => ({
        currentFile: current,
        totalFiles: total,
        remainingFiles: total - current,
        currentFilename: filename !== undefined ? filename : state.currentFilename,
      })),
    setCurrentFilename: (filename: string) =>
      set({ currentFilename: filename }),
    resetProgress: () => set(initialState),
  },
}));
