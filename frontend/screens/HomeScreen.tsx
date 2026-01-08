import React from 'react';
import { ScanSection } from '@/components/ScanSection';
import { VoiceTextInput } from '@/components/VoiceTextInput';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/styles/colors';
import { spacing } from '@/styles/spacing';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

export const HomeScreen: React.FC = () => {
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenHeader title="Home" subtitle="Track your medical supplies" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VoiceTextInput />
        <View style={styles.divider} />
        <ScanSection />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
