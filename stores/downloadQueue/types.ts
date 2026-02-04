/**
 * Download Queue Types
 * 
 * Core types for the download queue system.
 * State and actions are defined in valtioState.ts with inferred types.
 */

export interface DownloadCommand {
  id: string;
  filename: string;
}
