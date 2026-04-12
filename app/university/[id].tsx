import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import { universityQueries, courseQueries, scholarshipQueries } from '@/lib/supabase';
import { ScholarshipList } from '@/components/ScholarshipList';
import type { University, Course, Scholarship } from '@/types';

function StatBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={statStyles.badge}>
      <Text style={[statStyles.value, color ? { color } : null]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  badge: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  value: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  label: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default function UniversityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [university, setUniversity] = useState<University | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'scholarships'>('courses');

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);

    Promise.all([
      universityQueries.getById(numId),
      courseQueries.getByUniversity(numId),
      scholarshipQueries.getByUniversity(numId),
    ])
      .then(([uni, c, s]) => {
        setUniversity(uni);
        setCourses(c);
        setScholarships(s);
      })
      .catch((e) => {
        console.error(e);
        Alert.alert('Error', 'Could not load university details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!university) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>University not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const qsRank = university.qs_rank_2026 !== 'N/A' ? `#${university.qs_rank_2026}` : 'Unranked';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>
            {university.name.split(' ').map((w) => w[0]).slice(0, 3).join('')}
          </Text>
        </View>
        <Text style={styles.uniName}>{university.name}</Text>
        <Text style={styles.location}>
          📍 {university.city}, {university.state}
        </Text>
        <Text style={styles.established}>Est. {university.established_year}</Text>

        <TouchableOpacity
          style={styles.websiteButton}
          onPress={() => Linking.openURL(`https://${university.website}`)}
          accessibilityRole="link"
          accessibilityLabel={`Visit ${university.name} website`}
        >
          <Text style={styles.websiteButtonText}>🌐 Visit Website</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <StatBadge label="QS Rank" value={qsRank} color={Colors.primary} />
        <View style={styles.statDivider} />
        <StatBadge label="Grad Employment" value={`${university.grad_employment_rate_pct}%`} />
        <View style={styles.statDivider} />
        <StatBadge
          label="Intl Students"
          value={`${(university.international_students_count / 1000).toFixed(0)}K`}
        />
        <View style={styles.statDivider} />
        <StatBadge
          label="Scholarships"
          value={`${university.scholarship_availability_pct}%`}
        />
      </View>

      {/* Strengths */}
      {university.top_strengths?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Strengths</Text>
          <View style={styles.strengthsRow}>
            {university.top_strengths.map((s) => (
              <View key={s} style={styles.strengthChip}>
                <Text style={styles.strengthText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Fees */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tuition Fees (International)</Text>
        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Average per year</Text>
            <Text style={styles.feeValue}>
              ${university.avg_intl_fees_aud.toLocaleString()} AUD
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Range</Text>
            <Text style={styles.feeValue}>
              ${university.avg_intl_fees_range_low.toLocaleString()} –{' '}
              ${university.avg_intl_fees_range_high.toLocaleString()}
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Median grad salary</Text>
            <Text style={[styles.feeValue, { color: Colors.success }]}>
              ${university.grad_employment_salary_median_aud.toLocaleString()} AUD
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs: Courses / Scholarships */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.tabActive]}
          onPress={() => setActiveTab('courses')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'courses' }}
        >
          <Text
            style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}
          >
            Courses ({courses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scholarships' && styles.tabActive]}
          onPress={() => setActiveTab('scholarships')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'scholarships' }}
        >
          <Text
            style={[styles.tabText, activeTab === 'scholarships' && styles.tabTextActive]}
          >
            Scholarships ({scholarships.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Courses list */}
      {activeTab === 'courses' && (
        <View style={styles.section}>
          {courses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{course.course_level}</Text>
                </View>
                <Text style={styles.courseDuration}>
                  {course.duration_years} yr{course.duration_years !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.courseName}>{course.course_name}</Text>
              <Text style={styles.courseFee}>
                ${course.intl_fee_per_year_aud.toLocaleString()} AUD / year
              </Text>
              {course.entry_score_ielts && (
                <Text style={styles.courseReq}>
                  IELTS {course.entry_score_ielts}+ required
                </Text>
              )}
              {course.grad_employment_rate_pct && (
                <Text style={styles.courseEmp}>
                  {course.grad_employment_rate_pct}% employment rate
                </Text>
              )}
              {course.specializations?.length > 0 && (
                <View style={styles.specsRow}>
                  {course.specializations.slice(0, 3).map((s) => (
                    <View key={s} style={styles.specChip}>
                      <Text style={styles.specText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Scholarships list */}
      {activeTab === 'scholarships' && (
        <View style={styles.section}>
          {scholarships.length === 0 ? (
            <Text style={styles.emptyTabText}>No scholarships listed for this university.</Text>
          ) : (
            <ScholarshipList scholarships={scholarships} compact />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  errorText: { fontSize: Typography.md, color: Colors.textSecondary },
  backLink: { color: Colors.primary, marginTop: Spacing.md },
  hero: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    paddingTop: Spacing.xxxl + Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colors.textInverse,
    fontSize: Typography.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
  uniName: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  location: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  established: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  websiteButton: {
    marginTop: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  websiteButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  strengthsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  strengthChip: {
    backgroundColor: Colors.primaryLight + '22',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  strengthText: { color: Colors.primaryDark, fontSize: Typography.xs, fontWeight: '600' },
  feeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  feeValue: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  courseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  levelBadge: {
    backgroundColor: Colors.primary + '18',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  levelText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: '700' },
  courseDuration: { fontSize: Typography.xs, color: Colors.textTertiary },
  courseName: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  courseFee: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 2 },
  courseReq: { fontSize: Typography.xs, color: Colors.warning },
  courseEmp: { fontSize: Typography.xs, color: Colors.success, marginTop: 2 },
  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  specChip: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  specText: { fontSize: Typography.xs, color: Colors.textSecondary },
  emptyTabText: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center', padding: Spacing.xl },
});
