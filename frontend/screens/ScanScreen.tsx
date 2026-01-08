import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BarcodeScan } from '@/components/BarcodeScan';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

export const ScanScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mode } = route.params;

  const handleComplete = () => {
    // Navigate back to home after successful update
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <BarcodeScan mode={mode} onComplete={handleComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
