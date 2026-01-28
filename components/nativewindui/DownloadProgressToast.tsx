import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { ProgressIndicator } from '@/components/nativewindui/ProgressIndicator';
import { Text } from '@/components/nativewindui/Text';
import { cn } from '@/lib/cn';
import { useDownloadProgress } from '@/hooks/useDownloadProgress';

const toastContainer = cva('w-[90%] rounded-2xl bg-background mt-6 p-4 shadow-lg border border-border', {
  variants: {
    tone: {
      default: '',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

export interface DownloadProgressToastProps
  extends ViewProps,
    VariantProps<typeof toastContainer> {
  hide?: () => void;
}

export function DownloadProgressToast({ className, hide }: DownloadProgressToastProps) {
  const { percent, total, processed, queueCount, downloadedCount, failedCount, hasActivity } =
    useDownloadProgress();

  if (!hasActivity) {
    hide?.();
    return null;
  }

  return (
    <View className={cn(toastContainer(), className)}>
      <View className="flex-row items-center justify-between">
        <Text variant="subhead" className="font-semibold">
          Downloading attachments
        </Text>
        <Text variant="caption1" color="tertiary">
          {processed}/{total} · {percent}%
        </Text>
      </View>

      <View className="mt-4">
        <ProgressIndicator value={processed} max={total || 1} />
      </View>

      <View className="mt-4 flex-row justify-between">
        <Text variant="caption2" color="tertiary">
          In queue {queueCount}
        </Text>
        <Text variant="caption2" color="tertiary">
          Downloaded {downloadedCount}
        </Text>
        <Text variant="caption2" color="tertiary">
          Failed {failedCount}
        </Text>
      </View>
    </View>
  );
}
