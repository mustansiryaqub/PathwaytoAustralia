import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import type { University } from '@/types';

interface Props {
  university: University;
  onPress: () => void;
  matchScore?: number;
}

export function UniversityCard({ university, onPress, matchScore }: Props) {
  const qsRank =
    university.qs_rank_2026 && university.qs_rank_2026 !== 'N/A'
      ? `#${university.qs_rank_2026}`
      : null;

  const initials = university.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 3)
    .join('');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${university.name}, ${university.city}, ${university.state}`}
      accessibilityHint="Double tap to view university details"
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{initials}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {university.name}
          </Text>
          {qsRank && (
            <View style={styles.rankBadge} accessibilityLabel={`QS Rank ${qsRank}`}>
              <Text style={styles.rankText}>{qsRank}</Text>
            </View>
          )}
        </View>

        <Text style={styles.location}>
          📍 {university.city}, {university.state}
        </Text>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            💼 {university.grad_employment_rate_pct}% employed
          </Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>
            💰 ~${(university.avg_intl_fees_aud / 1000).toFixed(0)}K/yr
          </Text>
        </View>

        {/* Strengths */}
        {university.top_strengths?.length > 0 && (
          <View style={styles.strengthsRow}>
            {university.top_strengths.slice(0, 3).map((s) => (
              <View key={s} style={styles.strengthChip}>
                <Text style={styles.strengthText}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Match score (shown in recommendations context) */}
      {matchScore !== undefined && (
        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: scoreColor(matchScore) },
          ]}
          accessibilityLabel={`Match score: ${matchScore}%`}
        >
          <Text style={styles.scoreText}>{Math.round(matchScore)}%</Text>
          <Text style={styles.scoreLabel}>match</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.scoreFull;
  if (score >= 60) return Colors.scoreGood;
  if (score >= 40) return Colors.scoreOk;
  return Colors.scoreLow;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  logoContainer: { paddingTop: 2 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    color: Colors.textInverse,
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  rankBadge: {
    backgroundColor: Colors.accent + '30',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    flexShrink: 0,
  },
  rankText: {
    fontSize: Typography.xs,
    color: Colors.accentDark,
    fontWeight: '700',
  },
  location: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  stat: { fontSize: Typography.xs, color: Colors.textSecondary },
  statDot: { color: Colors.textTertiary },
  strengthsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  strengthChip: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  strengthText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    minWidth: 52,
    flexShrink: 0,
  },
  scoreText: {
    color: Colors.textInverse,
    fontSize: Typography.md,
    fontWeight: '800',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '600',
  },
});
