export interface DownloadCommand {
  id: string;
  filename: string;
}

export interface DownloadQueueState {
  queue: DownloadCommand[];
  isProcessing: boolean;
  completedIds: string[];
  pausedDueToStorage: boolean;
  pausedDueToAuth: boolean;
  lastProcessedTimestamp: number;
}

export interface DownloadQueueActions {
  addCommand: (command: DownloadCommand) => void;
  removeCommand: (id: string) => void;
  startProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  resetQueue: () => void;
  markCompleted: (id: string) => void;
  setQueueFromArray: (queue: DownloadCommand[]) => void;
}

export type DownloadQueueStore = DownloadQueueState & { actions: DownloadQueueActions };
