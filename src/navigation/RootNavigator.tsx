import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList, TabParamList } from './types';

import ManualInputScreen from '../screens/ManualInputScreen';
import ResultScreen from '../screens/ResultScreen';
import PickupLinesScreen from '../screens/PickupLinesScreen';
import ManualResultsScreen from '../screens/ManualResultsScreen';
import UploadTabScreen from '../screens/UploadTabScreen';
import UploadScreen from '../screens/UploadScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs(): React.ReactElement {
  return (
    <Tab.Navigator
      initialRouteName="UploadTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 66, paddingTop: 6, paddingBottom: 10 },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
          if (route.name === 'UploadTab') iconName = 'camera-outline';
          if (route.name === 'TextTab') iconName = 'create-outline';
          if (route.name === 'PickupTab') iconName = 'sparkles-outline';
          return <Ionicons name={iconName} size={size ?? 24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="UploadTab" component={UploadTabScreen} />
      <Tab.Screen name="TextTab" component={ManualInputScreen} />
      <Tab.Screen name="PickupTab" component={PickupLinesScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="ReviewUpload" component={UploadScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="ManualResults" component={ManualResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


