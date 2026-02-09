import { useLocalSearchParams, router } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { SERVICE_CONTENT } from '@/constants/services/services';

export default function ServiceDetailScreen() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const serviceData = SERVICE_CONTENT[service || '1'] || SERVICE_CONTENT['1'];

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <Text variant="largeTitle">{serviceData.name}</Text>
          <Text variant="body" color="tertiary">
            Service ID: {service}
          </Text>
          <View className="mt-4 rounded-lg border border-border bg-card p-4">
            <Text variant="body">{serviceData.details}</Text>
          </View>
          <View className="mt-4">
            <Button variant="secondary" onPress={() => router.back()}>
              <Text>Back to Services List</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
