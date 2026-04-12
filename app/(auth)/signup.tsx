import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (fullName.trim().length < 2) newErrors.fullName = 'Enter your full name';
    if (!email.includes('@')) newErrors.email = 'Enter a valid email address';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;
    const { success, error } = await signUp(email.trim(), password, fullName.trim());
    if (!success) {
      Alert.alert('Sign Up Failed', error ?? 'Something went wrong. Please try again.');
      return;
    }
    Alert.alert(
      'Check your email',
      'We sent you a confirmation link. Please verify your email then sign in.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} accessible accessibilityRole="header">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Join AustraliaPath and get personalised university recommendations
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.fullName ? styles.inputError : null]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Priya Sharma"
            placeholderTextColor={Colors.textDisabled}
            autoCapitalize="words"
            autoComplete="name"
            accessibilityLabel="Full name"
          />
          {errors.fullName ? (
            <Text style={styles.errorText} accessibilityRole="alert">{errors.fullName}</Text>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            accessibilityLabel="Email address"
          />
          {errors.email ? (
            <Text style={styles.errorText} accessibilityRole="alert">{errors.email}</Text>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 characters"
            placeholderTextColor={Colors.textDisabled}
            secureTextEntry
            autoComplete="new-password"
            accessibilityLabel="Password"
          />
          {errors.password ? (
            <Text style={styles.errorText} accessibilityRole="alert">{errors.password}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By creating an account you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.loginLink} accessibilityRole="button">
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.linkText}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  header: { marginBottom: Spacing.xxxl },
  title: {
    fontSize: Typography.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  form: { gap: Spacing.xs },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  errorText: { fontSize: Typography.xs, color: Colors.error, marginTop: Spacing.xs },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textInverse, fontSize: Typography.lg, fontWeight: '700' },
  termsText: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.lg,
  },
  linkText: { color: Colors.primary, fontWeight: '600' },
  loginLink: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  loginLinkText: { fontSize: Typography.sm, color: Colors.textSecondary },
});
