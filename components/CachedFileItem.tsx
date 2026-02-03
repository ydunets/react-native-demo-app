import { View, Pressable } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { formatFileSize } from '@/lib/files';

interface CachedFileItemProps {
  name: string;
  size: number;
  isInFlight?: boolean;
  onDelete?: () => void;
}

export const CachedFileItem: React.FC<CachedFileItemProps> = ({
  name,
  size,
  isInFlight,
  onDelete,
}) => {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      {isInFlight ? (
        <ActivityIndicator className="h-5 w-5" />
      ) : (
        <Icon name="doc.fill" size={20} className="text-primary" />
      )}
      <View className="flex-1">
        <Text variant="body" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption1" color="tertiary">
          {formatFileSize(size)}
        </Text>
      </View>
      {onDelete && !isInFlight && (
        <Pressable
          onPress={onDelete}
          className="rounded-full p-2 active:bg-destructive/10"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash" size={18} className="text-destructive" />
        </Pressable>
      )}
    </View>
  );
};
