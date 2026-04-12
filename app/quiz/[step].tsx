import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { QUIZ_QUESTIONS, TOTAL_STEPS } from '@/constants/quiz-questions';
import { QuizQuestion } from '@/components/QuizQuestion';
import { useQuizStore } from '@/store/quizStore';
import { useAuth } from '@/hooks/useAuth';
import {
  generateRecommendations,
  buildAlgorithmInput,
} from '@/lib/recommendation';
import {
  courseQueries,
  universityQueries,
  scholarshipQueries,
  recommendationQueries,
} from '@/lib/supabase';

export default function QuizStepScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step: string }>();
  const step = parseInt(params.step ?? '1', 10);

  const { user, isAuthenticated, isPremium } = useAuth();
  const {
    responses,
    setResponse,
    setGenerating,
    setRecommendations,
    isGenerating,
  } = useQuizStore();

  const question = QUIZ_QUESTIONS.find((q) => q.step === step);
  const isLastStep = step === TOTAL_STEPS;
  const progress = step / TOTAL_STEPS;

  if (!question) {
    router.replace('/quiz/1');
    return null;
  }

  const currentValue = responses[question.id];

  function handleAnswer(value: string | string[] | number) {
    setResponse(question!.id, value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleNext() {
    if (question.required && !currentValue) {
      Alert.alert('Please answer this question', 'This question is required.');
      return;
    }

    if (isLastStep) {
      handleFinish();
    } else {
      router.push(`/quiz/${step + 1}`);
    }
  }

  function handleBack() {
    if (step === 1) {
      router.back();
    } else {
      router.push(`/quiz/${step - 1}`);
    }
  }

  async function handleFinish() {
    // Require sign-in to save results
    if (!isAuthenticated) {
      Alert.alert(
        'Create a free account',
        'Sign up to save your personalised recommendations and access scholarships.',
        [
          { text: 'Later', style: 'cancel', onPress: () => runRecommendations(false) },
          {
            text: 'Create Account',
            onPress: () => router.push('/(auth)/signup'),
          },
        ]
      );
      return;
    }
    await runRecommendations(true);
  }

  async function runRecommendations(saveToDb: boolean) {
    setGenerating(true);
    try {
      const [courses, universities, scholarships] = await Promise.all([
        courseQueries.getAll(),
        universityQueries.getAll(),
        scholarshipQueries.getAll(),
      ]);

      const input = buildAlgorithmInput(responses);
      const results = generateRecommendations(
        courses,
        universities,
        scholarships,
        input,
        isPremium
      );

      let recId = 'local';

      if (saveToDb && user) {
        const quizResponseId = await recommendationQueries.saveQuizResponses(
          user.id,
          responses
        );
        recId = await recommendationQueries.saveRecommendation(
          user.id,
          quizResponseId,
          results,
          isPremium
        );
      }

      setRecommendations(results, recId);
      router.replace('/results');
    } catch (error) {
      console.error('Recommendation error:', error);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Finding your matches…</Text>
        <Text style={styles.loadingSubtitle}>
          Scoring 30 universities across 6 dimensions
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          />
        </View>
        <Text style={styles.stepLabel}>{step}/{TOTAL_STEPS}</Text>
      </View>

      {/* Question */}
      <QuizQuestion
        question={question}
        value={currentValue}
        onChange={handleAnswer}
      />

      {/* Next button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            question.required && !currentValue && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? 'See my results' : 'Next question'}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? '✨ See My Results' : 'Continue →'}
          </Text>
        </TouchableOpacity>
        {!question.required && (
          <TouchableOpacity
            onPress={handleNext}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip this question"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxxl,
  },
  loadingTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 28, color: Colors.textSecondary, lineHeight: 32 },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  stepLabel: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  skipButton: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.textTertiary, fontSize: Typography.sm },
});
