import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { Icon } from '@/components/nativewindui/Icon';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { CachedFileItem } from '@/components/CachedFileItem';
import { useAuthContext } from '@/contexts/auth';
import { useUser } from '@/stores/auth';
import { useCachedFiles } from '@/hooks/useCachedFiles';
import { formatFileSize } from '@/lib/files';

export default function PatientScreen() {
  const { logout } = useAuthContext();
  const user = useUser();
  const {
    files: cachedFiles,
    totalSize,
    isLoading: isCacheLoading,
    isClearing,
    clearCache,
  } = useCachedFiles();

  const handleLogoutPress = async () => {
    await logout();
    // Don't need router.replace - the guard in (main)/_layout.tsx will handle it
  };

  // Extract user info with fallbacks
  const displayName = user?.name || user?.email || 'User';
  const displayEmail = user?.email || 'No email available';
  const initials =
    displayName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || 'U';

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View className="items-center gap-2">
            <Avatar alt={displayName}>
              <AvatarFallback>
                <Text>{initials}</Text>
              </AvatarFallback>
            </Avatar>
            <Text variant="title1">{displayName}</Text>
            <Text variant="subhead" color="tertiary">
              {displayEmail}
            </Text>
          </View>

          <View className="mt-4 gap-4">
            <View className="rounded-lg border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-3">
                <Icon name="person.circle.fill" size={24} className="text-primary" />
                <Text variant="heading">Patient Information</Text>
              </View>
              <Text variant="body" color="tertiary">
                View and manage your patient profile information.
              </Text>
            </View>

            <View className="rounded-lg border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-3">
                <Icon name="heart.fill" size={24} className="text-primary" />
                <Text variant="heading">Health Records</Text>
              </View>
              <Text variant="body" color="tertiary">
                Access your medical history and health records.
              </Text>
            </View>

            <View className="rounded-lg border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-3">
                <Icon name="calendar" size={24} className="text-primary" />
                <Text variant="heading">Appointments</Text>
              </View>
              <Text variant="body" color="tertiary">
                View and manage your upcoming appointments.
              </Text>
            </View>

            <View className="rounded-lg border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-3">
                <Icon name="doc.fill" size={24} className="text-primary" />
                <Text variant="heading">Documents</Text>
              </View>
              <Text variant="body" color="tertiary">
                Access your medical documents and files.
              </Text>
            </View>
          </View>

          <View className="mt-4 gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Icon name="arrow.down.circle.fill" size={20} className="text-primary" />
                <Text variant="heading">Cached Files</Text>
              </View>
              {!isCacheLoading && cachedFiles.length > 0 && (
                <Text variant="caption1" color="tertiary">
                  {cachedFiles.length} {cachedFiles.length === 1 ? 'file' : 'files'} &middot;{' '}
                  {formatFileSize(totalSize)}
                </Text>
              )}
            </View>

            {isCacheLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator />
              </View>
            ) : cachedFiles.length === 0 ? (
              <View className="items-center rounded-lg border border-border bg-card py-6">
                <Icon name="tray" size={32} className="mb-2 text-secondary" />
                <Text variant="subhead" color="tertiary">
                  No cached files
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {cachedFiles.map((file) => (
                  <CachedFileItem key={file.attachmentId} name={file.name} size={file.size} />
                ))}
                <Button
                  variant="plain"
                  onPress={clearCache}
                  disabled={isClearing}>
                  {isClearing ? (
                    <ActivityIndicator />
                  ) : (
                    <Text className="text-destructive">Clear Cache</Text>
                  )}
                </Button>
              </View>
            )}
          </View>

          <View className="mt-4 gap-2">
            <Button variant="plain" onPress={handleLogoutPress}>
              <Text>Logout</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
