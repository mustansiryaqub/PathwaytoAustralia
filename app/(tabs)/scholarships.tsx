import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { scholarshipQueries } from '@/lib/supabase';
import { ScholarshipList } from '@/components/ScholarshipList';
import type { Scholarship } from '@/types';

const TYPE_FILTERS = ['All', 'Merit-based', 'Need-based', 'Country-specific', 'Discipline-specific'];

export default function ScholarshipsScreen() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [filtered, setFiltered] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    scholarshipQueries.getAll()
      .then((data) => {
        setScholarships(data);
        setFiltered(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeFilter === 'All') {
      setFiltered(scholarships);
    } else {
      setFiltered(scholarships.filter((s) => s.scholarship_type === activeFilter));
    }
  }, [activeFilter, scholarships]);

  const totalValue = filtered.reduce((sum, s) => sum + s.award_amount_aud, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scholarships</Text>
        <Text style={styles.subtitle}>
          {filtered.length} scholarships • Total value:{' '}
          <Text style={styles.highlight}>
            ${(totalValue / 1_000_000).toFixed(1)}M+ AUD
          </Text>
        </Text>
      </View>

      {/* Type filter */}
      <FlatList
        horizontal
        data={TYPE_FILTERS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeFilter === item && styles.chipActive]}
            onPress={() => setActiveFilter(item)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${item}`}
            accessibilityState={{ selected: activeFilter === item }}
          >
            <Text
              style={[styles.chipText, activeFilter === item && styles.chipTextActive]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScholarshipList scholarships={filtered} />
      )}
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
  title: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  highlight: { color: Colors.primary, fontWeight: '700' },
  filterRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 999,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.textInverse, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
