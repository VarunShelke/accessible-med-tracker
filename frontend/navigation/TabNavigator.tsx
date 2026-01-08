import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/HomeScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { InfoScreen } from '@/screens/InfoScreen';
import { Home, LayoutDashboard, Info } from 'lucide-react-native';
import { colors } from '@/styles/colors';

export type TabParamList = {
  HomeTab: undefined;
  DashboardTab: undefined;
  InfoTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="InfoTab"
        component={InfoScreen}
        options={{
          tabBarLabel: 'Info',
          tabBarIcon: ({ color, size }) => <Info color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
