import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useQuizStore } from '@/store/quizStore';

export default function QuizTabScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { isCompleted, recommendations, reset } = useQuizStore();

  const hasResults = isCompleted && recommendations.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>University Quiz</Text>
        <Text style={styles.subtitle}>
          Answer 20 questions to get your 5 personalised university matches
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEmoji}>🎯</Text>
        <Text style={styles.cardTitle}>
          {hasResults ? 'Quiz Completed!' : 'Find Your Perfect Match'}
        </Text>
        <Text style={styles.cardBody}>
          {hasResults
            ? `You have ${recommendations.length} personalised recommendations ready.`
            : 'Our algorithm analyses 30 universities, 150+ courses, and 100+ scholarships to find your best fit in Australia.'}
        </Text>

        {hasResults ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/results')}
              accessibilityRole="button"
              accessibilityLabel="View your recommendations"
            >
              <Text style={styles.primaryButtonText}>View My Recommendations →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                reset();
                router.push('/quiz/1');
              }}
              accessibilityRole="button"
              accessibilityLabel="Retake the quiz"
            >
              <Text style={styles.secondaryButtonText}>Retake Quiz</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/quiz/1')}
            accessibilityRole="button"
            accessibilityLabel="Start the university matching quiz"
          >
            <Text style={styles.primaryButtonText}>Start Quiz →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>30</Text>
          <Text style={styles.statLabel}>Universities</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>150+</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>100+</Text>
          <Text style={styles.statLabel}>Scholarships</Text>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>How it works</Text>
        {[
          { step: '1', text: 'Answer 20 quick questions about your background and goals' },
          { step: '2', text: 'Our algorithm scores every university and course for you' },
          { step: '3', text: 'Get 5 personalised matches (upgrade for 10)' },
        ].map((item) => (
          <View key={item.step} style={styles.howStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{item.step}</Text>
            </View>
            <Text style={styles.stepText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  card: {
    margin: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.md,
  },
  cardEmoji: { fontSize: 48, marginBottom: Spacing.md },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cardBody: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    ...Shadow.sm,
  },
  stat: { alignItems: 'center' },
  statNumber: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  howItWorks: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  howTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumber: { color: Colors.textInverse, fontWeight: '700', fontSize: Typography.sm },
  stepText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
