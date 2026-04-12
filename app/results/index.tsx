import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import { useQuizStore } from '@/store/quizStore';
import { useAuth } from '@/hooks/useAuth';
import { RecommendationCard } from '@/components/RecommendationCard';
import { PaywallModal } from '@/components/PaywallModal';
import { useState } from 'react';
import type { RecommendationResult } from '@/types';

export default function ResultsScreen() {
  const router = useRouter();
  const { recommendations, reset } = useQuizStore();
  const { isPremium } = useAuth();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const freeResults = recommendations.filter((r) => !r.is_locked);
  const lockedCount = recommendations.filter((r) => r.is_locked).length;

  function handleCardPress(result: RecommendationResult) {
    if (result.is_locked) {
      setPaywallVisible(true);
      return;
    }
    router.push(`/university/${result.university.id}`);
  }

  if (recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🎓</Text>
        <Text style={styles.emptyTitle}>No recommendations yet</Text>
        <Text style={styles.emptyBody}>
          Complete the quiz to get your personalised university matches.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/quiz/1')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Take the Quiz →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recommendations}
        keyExtractor={(item) => String(item.rank_position)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backText}>‹ Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Your Matches</Text>
              <Text style={styles.subtitle}>
                Ranked by personalised match score
              </Text>
            </View>

            {/* Summary bar */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>{recommendations.length}</Text>
                <Text style={styles.summaryLabel}>Universities</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>
                  {Math.round(recommendations[0]?.scores.total ?? 0)}%
                </Text>
                <Text style={styles.summaryLabel}>Top Match</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>
                  {recommendations.reduce(
                    (sum, r) => sum + (r.scholarship_count ?? 0),
                    0
                  )}
                </Text>
                <Text style={styles.summaryLabel}>Scholarships</Text>
              </View>
            </View>

            {/* Locked banner for free users */}
            {!isPremium && lockedCount > 0 && (
              <TouchableOpacity
                style={styles.lockedBanner}
                onPress={() => setPaywallVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={`Unlock ${lockedCount} more results with premium`}
              >
                <Text style={styles.lockedBannerEmoji}>🔒</Text>
                <View style={styles.lockedBannerText}>
                  <Text style={styles.lockedBannerTitle}>
                    {lockedCount} more matches hidden
                  </Text>
                  <Text style={styles.lockedBannerSub}>
                    Upgrade to Premium to unlock all {recommendations.length} results
                  </Text>
                </View>
                <Text style={styles.lockedBannerCta}>Unlock →</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                reset();
                router.replace('/quiz/1');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.retakeText}>🔄 Retake Quiz</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <RecommendationCard
            result={item}
            onPress={() => handleCardPress(item)}
            onUnlock={() => setPaywallVisible(true)}
          />
        )}
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.sm },
  emptyTitle: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  list: { paddingBottom: Spacing.xxxl },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: Typography.md, fontWeight: '600' },
  title: {
    fontSize: Typography.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.md,
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryNumber: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: { width: 1, backgroundColor: Colors.border },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.premiumGradientStart,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  lockedBannerEmoji: { fontSize: 24 },
  lockedBannerText: { flex: 1 },
  lockedBannerTitle: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  lockedBannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.xs,
    marginTop: 2,
  },
  lockedBannerCta: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  footer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  retakeButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  retakeText: { color: Colors.textSecondary, fontWeight: '600' },
});
