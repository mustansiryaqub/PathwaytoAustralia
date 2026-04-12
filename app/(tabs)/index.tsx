import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { universityQueries } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { UniversityCard } from '@/components/UniversityCard';
import type { University } from '@/types';

const STATES = ['All', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT', 'TAS'];
const STATE_FULL: Record<string, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  ACT: 'Australian Capital Territory',
  TAS: 'Tasmania',
};

export default function DiscoverScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [filtered, setFiltered] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');

  useEffect(() => {
    universityQueries.getAll()
      .then((data) => {
        setUniversities(data);
        setFiltered(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = universities;
    if (selectedState !== 'All') {
      result = result.filter(
        (u) => u.state === (STATE_FULL[selectedState] ?? selectedState)
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, selectedState, universities]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            👋 Hi, {profile?.full_name?.split(' ')[0] ?? 'there'}
          </Text>
          <Text style={styles.title}>Discover Universities</Text>
        </View>
        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => router.push('/quiz/1')}
          accessibilityRole="button"
          accessibilityLabel="Take the quiz for personalised recommendations"
        >
          <Text style={styles.quizButtonText}>✨ My Match</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search universities or cities..."
          placeholderTextColor={Colors.textDisabled}
          accessibilityLabel="Search universities"
          clearButtonMode="while-editing"
        />
      </View>

      {/* State filter chips */}
      <FlatList
        horizontal
        data={STATES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              selectedState === item && styles.chipActive,
            ]}
            onPress={() => setSelectedState(item)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${item}`}
            accessibilityState={{ selected: selectedState === item }}
          >
            <Text
              style={[
                styles.chipText,
                selectedState === item && styles.chipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* University list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading universities...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No universities found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <UniversityCard
              university={item}
              onPress={() => router.push(`/university/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  greeting: { fontSize: Typography.sm, color: Colors.textSecondary },
  title: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  quizButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  quizButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  filterRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.textInverse, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxxl,
  },
  loadingText: { color: Colors.textSecondary, marginTop: Spacing.md },
  emptyText: { color: Colors.textTertiary, fontSize: Typography.md },
});
