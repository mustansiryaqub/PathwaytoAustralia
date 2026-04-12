import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { QuizQuestion as QuizQuestionType } from '@/types';

interface Props {
  question: QuizQuestionType;
  value: string | string[] | number | undefined;
  onChange: (value: string | string[] | number) => void;
}

export function QuizQuestion({ question, value, onChange }: Props) {
  function handleSingleChoice(optionValue: string) {
    onChange(optionValue);
  }

  function handleMultiChoice(optionValue: string) {
    const current = Array.isArray(value) ? value : [];
    if (current.includes(optionValue)) {
      onChange(current.filter((v) => v !== optionValue));
    } else {
      // Limit to 3 for multi-choice
      if (current.length < 3) {
        onChange([...current, optionValue]);
      }
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Category label */}
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{question.category.toUpperCase()}</Text>
      </View>

      {/* Question text */}
      <Text style={styles.question} accessibilityRole="header">
        {question.question}
      </Text>
      {question.subtitle && (
        <Text style={styles.subtitle}>{question.subtitle}</Text>
      )}

      {/* Options */}
      {question.type === 'single_choice' && question.options && (
        <View style={styles.optionsGrid}>
          {question.options.map((option) => {
            const selected = value === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => handleSingleChoice(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
              >
                {option.icon && (
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                )}
                <Text
                  style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text
                    style={[
                      styles.optionDescription,
                      selected && styles.optionDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                )}
                {selected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {question.type === 'multi_choice' && question.options && (
        <>
          <Text style={styles.multiHint}>
            {Array.isArray(value) ? value.length : 0}/3 selected
          </Text>
          <View style={styles.optionsGrid}>
            {question.options.map((option) => {
              const selected = Array.isArray(value) && value.includes(option.value);
              const atLimit = Array.isArray(value) && value.length >= 3 && !selected;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    atLimit && styles.optionDisabled,
                  ]}
                  onPress={() => handleMultiChoice(option.value)}
                  disabled={atLimit}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: atLimit }}
                  accessibilityLabel={option.label}
                >
                  {option.icon && (
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && styles.optionLabelSelected,
                      atLimit && styles.optionLabelDisabled,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {question.type === 'text_input' && (
        <TextInput
          style={styles.textInput}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder={question.placeholder ?? 'Type here…'}
          placeholderTextColor={Colors.textDisabled}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel={question.question}
        />
      )}

      {question.type === 'number_input' && (
        <TextInput
          style={[styles.textInput, styles.numberInput]}
          value={value !== undefined ? String(value) : ''}
          onChangeText={(text) => {
            const n = parseFloat(text);
            if (!isNaN(n)) onChange(n);
          }}
          placeholder={question.placeholder ?? '0'}
          placeholderTextColor={Colors.textDisabled}
          keyboardType="numeric"
          accessibilityLabel={question.question}
        />
      )}

      {!question.required && (
        <Text style={styles.optionalNote}>Optional — you can skip this question</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '18',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  question: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  multiHint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  optionsGrid: { gap: Spacing.sm },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    position: 'relative',
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0D',
  },
  optionDisabled: { opacity: 0.4 },
  optionIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  optionLabel: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  optionLabelSelected: { color: Colors.primary },
  optionLabelDisabled: { color: Colors.textDisabled },
  optionDescription: {
    position: 'absolute',
    bottom: -16,
    left: Spacing.lg,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  optionDescriptionSelected: { color: Colors.primaryLight },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmarkText: { color: Colors.textInverse, fontSize: 12, fontWeight: '800' },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    minHeight: 120,
  },
  numberInput: { minHeight: 56 },
  optionalNote: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
