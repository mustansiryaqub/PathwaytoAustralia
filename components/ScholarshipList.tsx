import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import type { Scholarship } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  'Merit-based': Colors.primary,
  'Need-based': Colors.info,
  'Country-specific': Colors.accent,
  'Discipline-specific': Colors.warning,
  'Research-based': Colors.premiumGradientStart,
};

interface ScholarshipCardProps {
  scholarship: Scholarship;
  compact?: boolean;
}

function ScholarshipCard({ scholarship, compact }: ScholarshipCardProps) {
  const typeColor = TYPE_COLORS[scholarship.scholarship_type] ?? Colors.primary;

  return (
    <View
      style={[styles.card, compact && styles.cardCompact]}
      accessible
      accessibilityLabel={`${scholarship.scholarship_name} — ${scholarship.university_name} — Up to $${scholarship.award_amount_aud.toLocaleString()} AUD`}
    >
      {/* Amount badge */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {scholarship.scholarship_type}
            </Text>
          </View>
          <Text style={styles.level}>{scholarship.course_level}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountCurrency}>A$</Text>
          <Text style={styles.amountValue}>
            {(scholarship.award_amount_aud / 1000).toFixed(0)}K
          </Text>
        </View>
      </View>

      <Text style={styles.name}>{scholarship.scholarship_name}</Text>
      <Text style={styles.university}>{scholarship.university_name}</Text>

      {!compact && (
        <>
          <Text style={styles.criteria}>{scholarship.eligibility_criteria}</Text>

          <View style={styles.detailsRow}>
            {scholarship.min_gpa && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Min GPA</Text>
                <Text style={styles.detailValue}>{scholarship.min_gpa}</Text>
              </View>
            )}
            {scholarship.min_ielts && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Min IELTS</Text>
                <Text style={styles.detailValue}>{scholarship.min_ielts}</Text>
              </View>
            )}
            {scholarship.application_deadline && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Deadline</Text>
                <Text style={styles.detailValue}>{scholarship.application_deadline}</Text>
              </View>
            )}
          </View>

          {scholarship.notes && (
            <Text style={styles.notes}>{scholarship.notes}</Text>
          )}

          {scholarship.contact_url && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://${scholarship.contact_url}`)}
              style={styles.applyButton}
              accessibilityRole="link"
              accessibilityLabel={`Apply for ${scholarship.scholarship_name}`}
            >
              <Text style={styles.applyText}>Apply / Learn More →</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

interface ScholarshipListProps {
  scholarships: Scholarship[];
  compact?: boolean;
}

export function ScholarshipList({ scholarships, compact }: ScholarshipListProps) {
  return (
    <FlatList
      data={scholarships}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ScholarshipCard scholarship={item} compact={compact} />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No scholarships found</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardCompact: { padding: Spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: { flex: 1, gap: 4 },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  typeText: { fontSize: 10, fontWeight: '700' },
  level: { fontSize: Typography.xs, color: Colors.textTertiary },
  amountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    flexShrink: 0,
  },
  amountCurrency: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  amountValue: { fontSize: Typography.lg, color: Colors.textInverse, fontWeight: '800', lineHeight: 22 },
  name: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  university: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  criteria: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  detail: { alignItems: 'flex-start' },
  detailLabel: { fontSize: 9, color: Colors.textTertiary, fontWeight: '600' },
  detailValue: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '700' },
  notes: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  applyButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  applyText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '700' },
  empty: { alignItems: 'center', padding: Spacing.xxxl },
  emptyText: { color: Colors.textTertiary, fontSize: Typography.md },
});
