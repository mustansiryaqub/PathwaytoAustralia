import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import type { RecommendationResult } from '@/types';

interface Props {
  result: RecommendationResult;
  onPress: () => void;
  onUnlock: () => void;
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${value}%`, backgroundColor: scoreColor(value) }]} />
      </View>
      <Text style={barStyles.value}>{Math.round(value)}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  label: { width: 72, fontSize: 10, color: Colors.textSecondary },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: BorderRadius.full },
  value: { width: 24, fontSize: 10, color: Colors.textSecondary, textAlign: 'right' },
});

function scoreColor(score: number): string {
  if (score >= 80) return Colors.scoreFull;
  if (score >= 60) return Colors.scoreGood;
  if (score >= 40) return Colors.scoreOk;
  return Colors.scoreLow;
}

export function RecommendationCard({ result, onPress, onUnlock }: Props) {
  const { university, course, rank_position, scores, match_reasons, warnings, is_locked, scholarship_count } = result;
  const medal = RANK_MEDALS[rank_position];
  const initials = university.name.split(' ').map((w) => w[0]).slice(0, 3).join('');

  if (is_locked) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.lockedCard]}
        onPress={onUnlock}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Result #${rank_position} is locked. Upgrade to premium to unlock.`}
      >
        <View style={styles.lockedContent}>
          <View style={styles.lockedRankBadge}>
            <Text style={styles.lockedRank}>#{rank_position}</Text>
          </View>
          <View style={styles.lockedBlur}>
            <Text style={styles.lockedName}>████████████████</Text>
            <Text style={styles.lockedSub}>████████ · ███████</Text>
          </View>
          <View style={styles.lockIcon}>
            <Text style={styles.lockEmoji}>🔒</Text>
          </View>
        </View>
        <Text style={styles.unlockCta}>Upgrade to Premium to unlock →</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${rank_position === 1 ? 'Top match: ' : ''}${university.name}, ${course.course_name}, match score ${Math.round(scores.total)}%`}
    >
      {/* Rank + header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.rank}>
            {medal ?? `#${rank_position}`}
          </Text>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.uniName} numberOfLines={1}>{university.name}</Text>
            <Text style={styles.city}>📍 {university.city}, {university.state}</Text>
          </View>
        </View>
        <View style={[styles.totalScore, { backgroundColor: scoreColor(scores.total) }]}>
          <Text style={styles.totalScoreText}>{Math.round(scores.total)}%</Text>
          <Text style={styles.totalScoreLabel}>match</Text>
        </View>
      </View>

      {/* Course */}
      <View style={styles.courseRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{course.course_level}</Text>
        </View>
        <Text style={styles.courseName} numberOfLines={1}>{course.course_name}</Text>
      </View>

      {/* Key numbers */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            ${(course.intl_fee_per_year_aud / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.statLabel}>/ year</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{course.duration_years}yr</Text>
          <Text style={styles.statLabel}>duration</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {course.grad_employment_rate_pct ?? university.grad_employment_rate_pct}%
          </Text>
          <Text style={styles.statLabel}>employed</Text>
        </View>
        {(scholarship_count ?? 0) > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                {scholarship_count}
              </Text>
              <Text style={styles.statLabel}>scholarships</Text>
            </View>
          </>
        )}
      </View>

      {/* Score breakdown */}
      <View style={styles.scoreBreakdown}>
        <ScoreBar label="Academic" value={scores.academic} />
        <ScoreBar label="Course" value={scores.courseMatch} />
        <ScoreBar label="Budget" value={scores.budget} />
        <ScoreBar label="Location" value={scores.location} />
        <ScoreBar label="Career" value={scores.career} />
      </View>

      {/* Match reasons */}
      {match_reasons.length > 0 && (
        <View style={styles.reasons}>
          {match_reasons.slice(0, 3).map((r, i) => (
            <Text key={i} style={styles.reason}>✓ {r}</Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={styles.warnings}>
          {warnings.slice(0, 2).map((w, i) => (
            <Text key={i} style={styles.warning}>⚠ {w}</Text>
          ))}
        </View>
      )}

      <Text style={styles.viewDetail}>View full details →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  lockedCard: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.8,
  },
  lockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  lockedRankBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedRank: { fontSize: Typography.sm, color: Colors.textTertiary, fontWeight: '700' },
  lockedBlur: { flex: 1 },
  lockedName: { fontSize: Typography.md, color: Colors.border, fontWeight: '700', letterSpacing: 2 },
  lockedSub: { fontSize: Typography.xs, color: Colors.border, letterSpacing: 2 },
  lockIcon: { alignItems: 'center' },
  lockEmoji: { fontSize: 24 },
  unlockCta: {
    fontSize: Typography.xs,
    color: Colors.premiumGradientStart,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.sm },
  rank: { fontSize: Typography.xl, width: 32, textAlign: 'center' },
  logo: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: { color: Colors.textInverse, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  headerInfo: { flex: 1 },
  uniName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  city: { fontSize: Typography.xs, color: Colors.textSecondary },
  totalScore: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minWidth: 52,
    flexShrink: 0,
  },
  totalScoreText: { color: Colors.textInverse, fontSize: Typography.lg, fontWeight: '800' },
  totalScoreLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '600' },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  levelBadge: {
    backgroundColor: Colors.primary + '18',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    flexShrink: 0,
  },
  levelText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  courseName: { fontSize: Typography.sm, color: Colors.textPrimary, flex: 1, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.md, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 1 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  scoreBreakdown: { marginBottom: Spacing.md },
  reasons: { gap: 3, marginBottom: Spacing.sm },
  reason: { fontSize: Typography.xs, color: Colors.success, fontWeight: '500' },
  warnings: { gap: 3, marginBottom: Spacing.sm },
  warning: { fontSize: Typography.xs, color: Colors.warning },
  viewDetail: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
});
