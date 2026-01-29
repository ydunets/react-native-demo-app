import { useCallback, useEffect } from "react";

import { AttachmentInput, useMessageAttachments } from "./useMessageAttachments";

import { useDownloadMessageAttachmentsContext } from "@/contexts/downloadMessageAttachments";

import { useAppState } from "./useAppState";
import { useNetInfo } from "./useNetInfo";
import {
  fileExistsInCache,
} from '@/lib/files';


export const useDownloadMessageAttachments = () => {
  const { addCommand, startProcessing, resetQueue } =
    useDownloadMessageAttachmentsContext();
  const { attachments } = useMessageAttachments();
  const { isAppActive } = useAppState();
  const { isConnected } = useNetInfo();

  const addFilesToProcessingQueue = useCallback(
    async (attachments: (AttachmentInput)[]) => {
      resetQueue();
      try {
        for (const attachment of attachments) {
          const filename = attachment?.name;

          if (!filename) continue;

          const exists = await fileExistsInCache(attachment.id, filename);

          if (exists) continue;
          try {
            console.log(
              "[File Processing] Adding file to queue",
              attachment.name
            );

            addCommand({
              filename: attachment.name,
              id: attachment.id
            });
          } catch (error) {
            console.error(
              `[File Processing] Error queueing download for ${attachment.name}:`,
              error
            );
          }
        }
        console.log("[File Processing] Finished adding files to queue");
      } catch (error) {
        console.error("[File Processing] Download process failed:", error);
        return false;
      }
    },
    [addCommand, resetQueue]
  );

  // Function to start downloads from the main thread
  const startDownloads = useCallback(async () => {
    if (!attachments.length) return;

    await addFilesToProcessingQueue(attachments);
    await startProcessing();
  }, [attachments, addFilesToProcessingQueue, startProcessing]);

  useEffect(() => {
    if (!attachments.length) {
      return;
    }

    console.log("[File Processing] Attachments length", attachments.length);

    if (isAppActive && isConnected) {
      startDownloads();
    }
  }, [attachments.length, isAppActive, isConnected]);
};
