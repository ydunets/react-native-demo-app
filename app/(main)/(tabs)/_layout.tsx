import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';

export default function TabsLayout() {
  const { colors } = useColorScheme();
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        initialRouteName="(services)"
        backBehavior="order"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 0,
          },
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
            paddingHorizontal: 0,
          },
          tabBarIconStyle: {
            marginHorizontal: 0,
          },
        }}>
        {/* Tab 1: Home/Services */}
        <Tabs.Screen
          name="(services)"
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={28} color={color} />
            ),
          }}
        />

        {/* Tab 2: Messages */}
        <Tabs.Screen
          name="(messages)"
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'mail' : 'mail-outline'} size={28} color={color} />
            ),
          }}
        />

        {/* Tab 3: Live Chat */}
        <Tabs.Screen
          name="(chat)"
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'chatbox-ellipses' : 'chatbox-ellipses-outline'}
                size={28}
                color={color}
              />
            ),
          }}
        />
        {/* Tab 4: Profile */}
        <Tabs.Screen
          name="patient"
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
