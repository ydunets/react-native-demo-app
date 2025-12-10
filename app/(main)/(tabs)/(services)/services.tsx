import { router } from 'expo-router';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/nativewindui/Text';

const PILLARS = [
  { id: '1', name: 'Mental Health', description: 'Mental health services and support' },
  { id: '2', name: 'Physical Health', description: 'Physical wellness programs' },
  { id: '3', name: 'Nutrition', description: 'Nutritional guidance and meal plans' },
];

export default function PillarsListScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView className="flex-1">
      <View className="gap-4 p-4">
        <Text variant="title2" className="mb-2">
          Services List
        </Text>
        <Text variant="body" color="tertiary" className="mb-4">
          This is the Services tab with Stack navigation inside. Each tab maintains its own state.
        </Text>

        {PILLARS.map((service) => (
          <Pressable
            key={service.id}
            onPress={() => router.push(`/(main)/(tabs)/(services)/${service.id}`)}
            className="rounded-lg border border-border bg-card p-4 active:opacity-70">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text variant="heading" className="mb-1">
                  {service.name}
                </Text>
                <Text variant="subhead" color="tertiary">
                  {service.description}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

