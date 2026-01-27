import { View } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { formatFileSize } from '@/lib/files';

interface CachedFileItemProps {
  name: string;
  size: number;
}

export const CachedFileItem: React.FC<CachedFileItemProps> = ({ name, size }) => {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <Icon name="doc.fill" size={20} className="text-primary" />
      <View className="flex-1">
        <Text variant="body" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption1" color="tertiary">
          {formatFileSize(size)}
        </Text>
      </View>
    </View>
  );
};
