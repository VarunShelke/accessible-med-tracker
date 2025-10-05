import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BarcodeScanScreen} from './screens/BarcodeScanScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BarcodeScanScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
