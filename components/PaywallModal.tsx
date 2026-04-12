import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEffect } from 'react';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PREMIUM_FEATURES = [
  '🎯 All 10 personalised university matches (free: top 3)',
  '🏆 Full scholarship eligibility report per match',
  '📊 Detailed score breakdown for every university',
  '🔄 Unlimited quiz retakes',
  '📌 Save & compare universities',
  '📧 Priority application deadline alerts',
];

export function PaywallModal({ visible, onClose, onSuccess }: Props) {
  const { offering, isLoading, error, loadOffering, purchase, restore } =
    useSubscription();

  useEffect(() => {
    if (visible) {
      loadOffering();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePurchase(packageType: 'monthly' | 'annual') {
    if (!offering) return;

    // Get the actual RevenueCat package object from the offering
    const Purchases = require('react-native-purchases').default;
    let offerings;
    try {
      offerings = await Purchases.getOfferings();
    } catch {
      Alert.alert('Error', 'Could not load pricing. Please try again.');
      return;
    }

    const pkg =
      packageType === 'annual'
        ? offerings.current?.annual
        : offerings.current?.monthly;

    if (!pkg) {
      Alert.alert('Error', 'Package not available. Please try again.');
      return;
    }

    const result = await purchase(pkg);
    if (result.success) {
      Alert.alert('🎉 Welcome to Premium!', 'All 10 matches are now unlocked.');
      onSuccess?.();
      onClose();
    } else if (result.error && result.error !== 'cancelled') {
      Alert.alert('Purchase Failed', result.error);
    }
  }

  async function handleRestore() {
    const result = await restore();
    if (result.success) {
      Alert.alert('Restored!', 'Your premium access has been restored.');
      onSuccess?.();
      onClose();
    } else {
      Alert.alert(
        'Nothing to restore',
        'No previous purchase found for this account.'
      );
    }
  }

  const monthlyPrice = offering?.monthly?.priceString ?? 'A$4.99';
  const annualPrice = offering?.annual?.priceString ?? 'A$29.99';
  const annualPerMonth = offering?.annual
    ? `A$${(
        offering.annual.product.priceAmountMicros /
        1_000_000 /
        12
      ).toFixed(2)}/mo`
    : 'A$2.50/mo';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.container}>
        {/* Handle */}
        <View style={styles.handle} accessibilityElementsHidden />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Hero */}
          <Text style={styles.emoji}>⭐</Text>
          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>
            Get all 10 personalised matches and detailed insights to make the
            best decision for your future.
          </Text>

          {/* Features list */}
          <View style={styles.features}>
            {PREMIUM_FEATURES.map((feature, i) => (
              <Text key={i} style={styles.feature}>
                {feature}
              </Text>
            ))}
          </View>

          {/* Pricing cards */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Loading pricing…</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>
              Could not load pricing. Please check your connection.
            </Text>
          ) : (
            <View style={styles.plans}>
              {/* Annual — featured */}
              <View style={styles.featuredPlan}>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>BEST VALUE — SAVE 50%</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>Annual</Text>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>{annualPrice}</Text>
                    <Text style={styles.planPriceSub}>{annualPerMonth} billed annually</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handlePurchase('annual')}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={`Subscribe annually for ${annualPrice}`}
                >
                  <Text style={styles.primaryButtonText}>
                    Get Annual Plan
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Monthly */}
              <TouchableOpacity
                style={styles.monthlyPlan}
                onPress={() => handlePurchase('monthly')}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={`Subscribe monthly for ${monthlyPrice}`}
              >
                <Text style={styles.monthlyText}>
                  Monthly plan · {monthlyPrice}/month
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Fine print */}
          <Text style={styles.finePrint}>
            Cancel any time. Subscriptions auto-renew unless cancelled 24 hours
            before renewal. Prices in Australian dollars.
          </Text>

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
          >
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl + Spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  closeText: { fontSize: Typography.lg, color: Colors.textTertiary },
  emoji: { fontSize: 56, marginBottom: Spacing.md },
  title: {
    fontSize: Typography.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  features: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  feature: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  loadingContainer: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.sm },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sm,
    textAlign: 'center',
    padding: Spacing.lg,
  },
  plans: { alignSelf: 'stretch', gap: Spacing.md },
  featuredPlan: {
    backgroundColor: Colors.premiumGradientStart,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  savingsBadge: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  savingsText: { fontSize: 10, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  planTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textInverse },
  planPricing: { alignItems: 'flex-end' },
  planPrice: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textInverse },
  planPriceSub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)' },
  primaryButton: {
    backgroundColor: Colors.textInverse,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.premiumGradientStart,
    fontSize: Typography.md,
    fontWeight: '800',
  },
  monthlyPlan: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  monthlyText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  finePrint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  restoreButton: { paddingVertical: Spacing.md },
  restoreText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
});
