import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#0B1220',
          borderTopColor: '#1E293B',
        },
        tabBarActiveTintColor: '#E2E8F0',
        tabBarInactiveTintColor: '#64748B',
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'discover'
              ? 'compass-outline'
              : route.name === 'matches'
                ? 'heart-outline'
                : 'people-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="partners" options={{ title: 'Active Partners' }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}
