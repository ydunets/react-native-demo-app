import { useLocalSearchParams, router } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';

const SERVICE_CONTENT: Record<string, { name: string; details: string }> = {
  '1': {
    name: 'Mental Health',
    details:
      'Comprehensive mental health services including counseling, therapy sessions, and support groups. Our team of licensed professionals is here to help you on your journey.',
  },
  '2': {
    name: 'Physical Health',
    details:
      'Physical wellness programs designed to improve your overall health. Includes fitness plans, health screenings, and personalized workout routines.',
  },
  '3': {
    name: 'Nutrition',
    details:
      'Expert nutritional guidance and personalized meal plans. Learn about healthy eating habits and get recipes tailored to your dietary needs.',
  },
};

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
