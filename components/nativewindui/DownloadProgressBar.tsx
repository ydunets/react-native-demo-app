import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { ProgressIndicator } from '@/components/nativewindui/ProgressIndicator';
import { Text } from '@/components/nativewindui/Text';
import { cn } from '@/lib/cn';
import { useDownloadProgress } from '@/hooks/useDownloadProgress';

const containerVariants = cva('rounded-2xl border border-border bg-background/80 p-3 gap-2', {
  variants: {
    size: {
      sm: 'p-3',
      md: 'p-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface DownloadProgressBarProps
  extends ViewProps,
    VariantProps<typeof containerVariants> {}

export function DownloadProgressBar({ className, size, ...props }: DownloadProgressBarProps) {
  const {
    percent,
    total,
    processed,
    queueCount,
    downloadedCount,
    failedCount,
    hasActivity,
  } = useDownloadProgress();

  if (!hasActivity) {
    return null;
  }

  return (
    <View className={cn(containerVariants({ size }), className)} {...props}>
      <View className="flex-row items-center justify-between">
        <Text variant="subhead" color="primary" className="font-semibold">
          Downloading attachments
        </Text>
        <Text variant="caption1" color="tertiary">
          {processed}/{total} · {percent}%
        </Text>
      </View>

      <ProgressIndicator value={processed} max={total || 1} />

      <View className="mt-1 flex-row items-center justify-between">
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
