import { DownloadCommand } from "@/stores/downloadQueue";
import { useRef } from "react";

const useManageProcessingQueue = () => {
  let queueRef = useRef<DownloadCommand[]>([]);
  let isProcessing = useRef(false);
  
  let { current: shouldStopProxy } = useRef({ shouldStop: false });

  const addCommand = (command: DownloadCommand) => {
    queueRef.current.push(command);
  };

  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true;
    isProcessing.current = false;

    await Promise.resolve();
  };

  const resetQueue = () => {
    queueRef.current = [];
    shouldStopProxy.shouldStop = false;
  };

  return {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue
  };
};

export default useManageProcessingQueue;