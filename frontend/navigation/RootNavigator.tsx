import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from '@/navigation/TabNavigator';
import { ScanScreen } from '@/screens/ScanScreen';
import { LaunchScreen } from '@/screens/LaunchScreen';
import { ScanMode } from '@/types/inventory';

export type RootStackParamList = {
  Launch: undefined;
  MainTabs: undefined;
  Scan: { mode: ScanMode };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Launch"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Launch"
        component={LaunchScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};
