import React from 'react';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors } from '@/styles/colors';
import { fontSize, spacing, touchTarget } from '@/styles/spacing';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ScanSection: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.scanSection}>
      <Text style={styles.heading}>Scan Medical Supplies</Text>
      <Text style={styles.description}>Choose an action to start scanning barcodes</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.modeButton, styles.addButton]}
          onPress={() => navigation.navigate('Scan', { mode: 'add' })}
          accessible={true}
          accessibilityLabel="Add stock - scan barcodes to add supplies to inventory"
          accessibilityRole="button"
        >
          <Text style={styles.modeButtonText}>+ Add Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, styles.useButton]}
          onPress={() => navigation.navigate('Scan', { mode: 'use' })}
          accessible={true}
          accessibilityLabel="Use supply - scan barcodes to remove supplies from inventory"
          accessibilityRole="button"
        >
          <Text style={styles.modeButtonText}>- Use Supply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scanSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  heading: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  modeButton: {
    height: touchTarget.large,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.success,
  },
  useButton: {
    backgroundColor: colors.danger,
  },
  modeButtonText: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  }
});
