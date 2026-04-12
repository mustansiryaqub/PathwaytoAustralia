import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useQuizStore } from '@/store/quizStore';

interface ProfileRowProps {
  label: string;
  value: string;
}

function ProfileRow({ label, value }: ProfileRowProps) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: { fontSize: Typography.sm, color: Colors.textSecondary },
  value: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '500' },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, isPremium } = useAuth();
  const { isCompleted, recommendations } = useQuizStore();

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>
          {profile?.full_name ?? user?.email ?? 'User'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        {/* Premium badge */}
        {isPremium ? (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>⭐ Premium Member</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeBadge}
            onPress={() => router.push('/quiz/1')}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to premium"
          >
            <Text style={styles.upgradeBadgeText}>✨ Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quiz status card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quiz Status</Text>
        <ProfileRow
          label="Quiz completed"
          value={isCompleted ? '✅ Yes' : '❌ Not yet'}
        />
        <ProfileRow
          label="Recommendations"
          value={isCompleted ? `${recommendations.length} matches` : 'None yet'}
        />
        {isCompleted && (
          <TouchableOpacity
            style={styles.viewResultsButton}
            onPress={() => router.push('/results')}
            accessibilityRole="button"
            accessibilityLabel="View your recommendations"
          >
            <Text style={styles.viewResultsText}>View Recommendations →</Text>
          </TouchableOpacity>
        )}
        {!isCompleted && (
          <TouchableOpacity
            style={styles.takeQuizButton}
            onPress={() => router.push('/quiz/1')}
            accessibilityRole="button"
            accessibilityLabel="Take the quiz"
          >
            <Text style={styles.takeQuizText}>Take the Quiz →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Account info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <ProfileRow label="Email" value={user?.email ?? '—'} />
        <ProfileRow label="Plan" value={isPremium ? 'Premium ⭐' : 'Free'} />
        <ProfileRow
          label="Member since"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-AU', {
                  month: 'long',
                  year: 'numeric',
                })
              : '—'
          }
        />
      </View>

      {/* Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Actions</Text>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/(tabs)/scholarships')}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>🏆 Browse Scholarships</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert('Coming soon', 'Saved universities will be available soon.')}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>📌 Saved Universities</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },
  header: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    paddingTop: Spacing.xxxl + Spacing.lg,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { color: Colors.textInverse, fontSize: Typography.xxl, fontWeight: '800' },
  name: { fontSize: Typography.xl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  premiumBadge: {
    marginTop: Spacing.md,
    backgroundColor: '#FFF8DC',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
  },
  premiumBadgeText: { color: '#B7791F', fontWeight: '700', fontSize: Typography.sm },
  upgradeBadge: {
    marginTop: Spacing.md,
    backgroundColor: Colors.premiumGradientStart,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
  },
  upgradeBadgeText: { color: Colors.textInverse, fontWeight: '700', fontSize: Typography.sm },
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  viewResultsButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  viewResultsText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: Typography.sm,
  },
  takeQuizButton: { marginTop: Spacing.md, alignSelf: 'flex-start' },
  takeQuizText: { color: Colors.primary, fontWeight: '600', fontSize: Typography.sm },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionText: { fontSize: Typography.sm, color: Colors.textPrimary },
  actionChevron: { fontSize: 20, color: Colors.textTertiary },
  signOutButton: {
    margin: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  signOutText: { color: Colors.error, fontWeight: '700', fontSize: Typography.md },
});
