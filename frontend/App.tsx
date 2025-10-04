import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {BarcodeScanScreen} from './screens/BarcodeScanScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <BarcodeScanScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
