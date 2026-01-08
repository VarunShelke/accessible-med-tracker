import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/styles/colors';
import { spacing, fontSize } from '@/styles/spacing';
import { CheckCircle } from 'lucide-react-native';

export const InfoScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScreenHeader title="About CodeRx" subtitle="Empowering independence by smarter solutions" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

      <View style={styles.section}>
        <Text style={styles.bodyText}>
          CodeRx helps you keep track of your medical supplies without the hassle. Whether you're
          managing medications, bandages, or mobility aids, staying organized shouldn't add to
          your stress.
        </Text>

        <Text style={styles.bodyText}>
          We built this app for people who want to stay independent at home. You can quickly scan
          barcodes, use your voice to log supplies, and get alerts before anything runs out. No
          complicated steps. Just what you need, when you need it.
        </Text>

        <View style={styles.missionBox}>
          <Text style={styles.missionLabel}>What we stand for:</Text>
          <Text style={styles.missionStatement}>Track Faster. Care Better.</Text>
        </View>

        <Text style={styles.bodyText}>
          Your health matters, but so does your time. CodeRx gives you the tools to manage
          supplies on your own terms. Scan with your camera, speak your updates, or browse your
          inventory. Whatever works best for you.
        </Text>

        <View style={styles.featureTag}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={styles.featureTagText}>
            Built for accessibility. Made for real life.
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* How to Use Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Getting Started</Text>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add or Use Supplies</Text>
            <Text style={styles.stepDescription}>
              On the Home screen, tap "Add Stock" when you get new supplies or "Use Supply" when
              you take something. Point your camera at the barcode and the app does the rest. You
              can adjust the quantity right there if needed.
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Try Voice Updates</Text>
            <Text style={styles.stepDescription}>
              Don't feel like scanning? Just tap the microphone and say what you used. "I took 2
              Tylenol" or "Add 3 bandages" works perfectly. The app listens for about 10 seconds,
              so take your time.
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Check Your Dashboard</Text>
            <Text style={styles.stepDescription}>
              The Dashboard tab shows everything you have. Running low on something? You'll see it
              at the top. You can search for specific items or filter by category like medications
              or mobility aids.
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Alert Your Caregiver</Text>
            <Text style={styles.stepDescription}>
              If something is running low or about to expire, you can send an alert to your
              caregiver with one tap. They'll know exactly what you need before your next visit.
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Questions? Ask your caregiver or healthcare provider. They can help you get the most out
          of CodeRx.
        </Text>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.heading + 4,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: fontSize.body,
    color: colors.text,
    lineHeight: fontSize.body * 1.6,
  },
  missionBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  missionLabel: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  missionStatement: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.primary,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  featureTagText: {
    fontSize: fontSize.body,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs,
  },
  stepTitle: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.text,
  },
  stepDescription: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    lineHeight: fontSize.body * 1.5,
  },
  footer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  footerText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.small * 1.5,
  },
});
