/**
 * Di2 ERG Training App
 * Android app for Shimano Di2 automatic shifting during ERG workouts
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { WorkoutScreen } from './src/screens/WorkoutScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000" 
        translucent={false}
      />
      <WorkoutScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default App;
