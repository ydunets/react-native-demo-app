import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Avatar, AvatarFallback } from '@/components/nativewindui/Avatar';
import { Icon } from '@/components/nativewindui/Icon';
import { useAuthContext } from '@/contexts/auth';

export default function PatientScreen() {
  const {logout} = useAuthContext();

  const handleLogoutPress = async () => {
    await logout();
    // Don't need router.replace - the guard in (main)/_layout.tsx will handle it
  };
  
  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView className="flex-1">
      <View className="gap-4 p-4">
        <View className="items-center gap-2">
          <Avatar alt='John Doe'>
            <AvatarFallback>
              <Text>JD</Text>
            </AvatarFallback>
          </Avatar>
          <Text variant="title1">John Doe</Text>
          <Text variant="subhead" color="tertiary">
            john.doe@example.com
          </Text>
        </View>

        <View className="mt-4 gap-4">
          <View className="rounded-lg border border-border bg-card p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Icon name="person.circle.fill" size={24} className="text-primary" />
              <Text variant="heading">Patient Information</Text>
            </View>
            <Text variant="body" color="tertiary">
              View and manage your patient profile information.
            </Text>
          </View>

          <View className="rounded-lg border border-border bg-card p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Icon name="heart.fill" size={24} className="text-primary" />
              <Text variant="heading">Health Records</Text>
            </View>
            <Text variant="body" color="tertiary">
              Access your medical history and health records.
            </Text>
          </View>

          <View className="rounded-lg border border-border bg-card p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Icon name="calendar" size={24} className="text-primary" />
              <Text variant="heading">Appointments</Text>
            </View>
            <Text variant="body" color="tertiary">
              View and manage your upcoming appointments.
            </Text>
          </View>

          <View className="rounded-lg border border-border bg-card p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Icon name="doc.fill" size={24} className="text-primary" />
              <Text variant="heading">Documents</Text>
            </View>
            <Text variant="body" color="tertiary">
              Access your medical documents and files.
            </Text>
          </View>
        </View>

        <View className="mt-4 gap-2">
          <Button
            variant="plain"
            onPress={handleLogoutPress}>
            <Text>Logout</Text>
          </Button>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

