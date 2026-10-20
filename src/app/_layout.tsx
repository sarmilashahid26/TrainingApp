import { Tabs } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import { NutritionProvider } from '@/context/NutritionContext';
import { TabIcon } from '@/components/TabIcon';

export default function TabLayout() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'dark']; // Defaulting to sleek dark mode

  return (
    <NutritionProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="today" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Foods',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="search" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recipe"
          options={{
            title: 'Yield Engine',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="recipe" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="targets"
          options={{
            title: 'Targets',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="targets" focused={focused} color={color} />
            ),
          }}
        />
      </Tabs>
    </NutritionProvider>
  );
}
