import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { router } from 'expo-router';

export default function CustomSitemap() {
  const routes = [
    // Auth routes
    '/',
    '/(auth)/welcome',
    '/(auth)/login',
    '/(auth)/register',

    // Main routes
    '/(main)/(tabs)/patient',
    '/(main)/(tabs)/send-message',
    '/(main)/lock',
    '/(main)/debug/sitemap',

    // Special routes
    '/+not-found',
  ];

  const handleRoutePress = (route: string) => {
    try {
      router.push(route as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 p-4">
        <Text variant="largeTitle" className="mb-6 text-center">
          App Sitemap
        </Text>

        <View className="gap-3">
          <Text variant="title2" className="mb-2">
            🔐 Auth Routes
          </Text>
          {routes
            .filter((r) => r.includes('auth') || r === '/')
            .map((route) => (
              <View key={route} className="rounded-lg border border-border bg-card p-3">
                <Text variant="callout" className="mb-2">
                  {route}
                </Text>
                <Button size="sm" variant="secondary" onPress={() => handleRoutePress(route)}>
                  <Text>Navigate</Text>
                </Button>
              </View>
            ))}

          <Text variant="title2" className="mb-2 mt-4">
            📱 Main Routes
          </Text>
          {routes
            .filter((r) => r.includes('main'))
            .map((route) => (
              <View key={route} className="rounded-lg border border-border bg-card p-3">
                <Text variant="callout" className="mb-2">
                  {route}
                </Text>
                <Button size="sm" variant="secondary" onPress={() => handleRoutePress(route)}>
                  <Text>Navigate</Text>
                </Button>
              </View>
            ))}

          <Text variant="title2" className="mb-2 mt-4">
            ⚙️ Special Routes
          </Text>
          {routes
            .filter((r) => !r.includes('auth') && !r.includes('main') && r !== '/')
            .map((route) => (
              <View key={route} className="rounded-lg border border-border bg-card p-3">
                <Text variant="callout" className="mb-2">
                  {route}
                </Text>
                <Button size="sm" variant="secondary" onPress={() => handleRoutePress(route)}>
                  <Text>Navigate</Text>
                </Button>
              </View>
            ))}
        </View>

        <View className="mt-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <Text variant="caption1" color="secondary">
            💡 This is a custom sitemap since expo-router&apos;s built-in sitemap has a bug on React
            Native
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
