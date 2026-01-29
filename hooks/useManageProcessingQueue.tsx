import { DownloadCommand } from "@/stores/downloadQueue";
import { useRef, useState } from "react";

const useManageProcessingQueue = () => {
  let queueRef = useRef<DownloadCommand[]>([]);
  let { current: shouldStopProxy } = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => {
          return Reflect.get(target, prop);
        },
        set: (target, prop, value) => {
          return Reflect.set(target, prop, value);
        }
      }
    )
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const addCommand = (command: DownloadCommand) => {
    queueRef.current.push(command);
  };

  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true;
    setIsProcessing(false);

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
    resetQueue,
    setIsProcessing
  };
};

export default useManageProcessingQueue;