import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';

export default function App(): React.ReactElement {
  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
      <Toast />
    </>
  );
}

