import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/colors';
import { spacing, fontSize } from '@/styles/spacing';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
});
