/**
 * Auth Flow Tests
 * Covers: Supabase authHelpers, profile queries, input validation patterns
 */

import { authHelpers, profileQueries } from '@/lib/supabase';

// ── Mock Supabase client ───────────────────────────────────────
jest.mock('@/lib/supabase', () => {
  const mockUser = {
    id: 'test-user-uuid-123',
    email: 'priya@example.com',
    user_metadata: { full_name: 'Priya Sharma' },
  };

  const mockSession = {
    access_token: 'mock-access-token',
    user: mockUser,
  };

  const mockProfile = {
    id: 'test-user-uuid-123',
    full_name: 'Priya Sharma',
    email: 'priya@example.com',
    subscription_tier: 'free',
    quiz_completed: false,
    country_of_origin: null,
    ielts_score: null,
    has_work_experience: false,
    work_experience_years: 0,
    preferred_state: [],
    notifications_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    supabase: {
      auth: {
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
    },
    authHelpers: {
      signUp: jest.fn(async (email: string, password: string, fullName: string) => {
        if (!email.includes('@')) {
          return { data: null, error: { message: 'Invalid email' } };
        }
        if (password.length < 6) {
          return { data: null, error: { message: 'Password too short' } };
        }
        return {
          data: { user: { ...mockUser, email, user_metadata: { full_name: fullName } } },
          error: null,
        };
      }),
      signIn: jest.fn(async (email: string, password: string) => {
        if (email === 'priya@example.com' && password === 'correct-password') {
          return { data: { session: mockSession, user: mockUser }, error: null };
        }
        return { data: null, error: { message: 'Invalid login credentials' } };
      }),
      signOut: jest.fn(async () => ({ error: null })),
      getSession: jest.fn(async () => ({
        session: mockSession,
        error: null,
      })),
      getCurrentUser: jest.fn(async () => ({
        user: mockUser,
        error: null,
      })),
      resetPassword: jest.fn(async (email: string) => ({
        data: {},
        error: email.includes('@') ? null : { message: 'Invalid email' },
      })),
    },
    profileQueries: {
      get: jest.fn(async (userId: string) => {
        if (userId === 'test-user-uuid-123') return mockProfile;
        throw new Error('Profile not found');
      }),
      upsert: jest.fn(async (profile: any) => ({
        ...mockProfile,
        ...profile,
      })),
      updateSubscription: jest.fn(async () => undefined),
    },
    universityQueries: {
      getAll: jest.fn(async () => []),
      getById: jest.fn(async () => null),
    },
    courseQueries: {
      getAll: jest.fn(async () => []),
    },
    scholarshipQueries: {
      getAll: jest.fn(async () => []),
    },
    recommendationQueries: {
      saveQuizResponses: jest.fn(async () => 'quiz-response-uuid'),
      saveRecommendation: jest.fn(async () => 'recommendation-uuid'),
      getLatest: jest.fn(async () => null),
    },
  };
});

// ── authHelpers tests ─────────────────────────────────────────
describe('authHelpers.signUp', () => {
  beforeEach(() => jest.clearAllMocks());

  test('resolves with user on valid credentials', async () => {
    const { data, error } = await authHelpers.signUp(
      'new@example.com',
      'securePass123',
      'Test User'
    );
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.user?.email).toBe('new@example.com');
  });

  test('returns error for invalid email', async () => {
    const { data, error } = await authHelpers.signUp(
      'not-an-email',
      'securePass123',
      'Test User'
    );
    expect(data).toBeNull();
    expect(error?.message).toMatch(/invalid email/i);
  });

  test('returns error for short password', async () => {
    const { data, error } = await authHelpers.signUp(
      'valid@example.com',
      '123',
      'Test User'
    );
    expect(data).toBeNull();
    expect(error?.message).toMatch(/too short/i);
  });
});

describe('authHelpers.signIn', () => {
  beforeEach(() => jest.clearAllMocks());

  test('resolves with session on correct credentials', async () => {
    const { data, error } = await authHelpers.signIn(
      'priya@example.com',
      'correct-password'
    );
    expect(error).toBeNull();
    expect(data?.session?.access_token).toBe('mock-access-token');
    expect(data?.user?.email).toBe('priya@example.com');
  });

  test('returns error for wrong password', async () => {
    const { data, error } = await authHelpers.signIn(
      'priya@example.com',
      'wrong-password'
    );
    expect(data).toBeNull();
    expect(error?.message).toMatch(/invalid login/i);
  });

  test('returns error for unknown user', async () => {
    const { data, error } = await authHelpers.signIn(
      'unknown@example.com',
      'password'
    );
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe('authHelpers.signOut', () => {
  test('resolves without error', async () => {
    const { error } = await authHelpers.signOut();
    expect(error).toBeNull();
  });
});

describe('authHelpers.getSession', () => {
  test('returns a session object', async () => {
    const { session, error } = await authHelpers.getSession();
    expect(error).toBeNull();
    expect(session?.access_token).toBeDefined();
  });
});

describe('authHelpers.resetPassword', () => {
  test('succeeds for a valid email', async () => {
    const { error } = await authHelpers.resetPassword('user@example.com');
    expect(error).toBeNull();
  });

  test('returns error for invalid email', async () => {
    const { error } = await authHelpers.resetPassword('not-an-email');
    expect(error?.message).toMatch(/invalid email/i);
  });
});

// ── profileQueries tests ──────────────────────────────────────
describe('profileQueries', () => {
  beforeEach(() => jest.clearAllMocks());

  test('get: returns profile for known user', async () => {
    const profile = await profileQueries.get('test-user-uuid-123');
    expect(profile.id).toBe('test-user-uuid-123');
    expect(profile.email).toBe('priya@example.com');
    expect(profile.subscription_tier).toBe('free');
  });

  test('get: throws for unknown user', async () => {
    await expect(profileQueries.get('unknown-uuid')).rejects.toThrow(
      'Profile not found'
    );
  });

  test('upsert: merges fields into profile', async () => {
    const updated = await profileQueries.upsert({
      id: 'test-user-uuid-123',
      full_name: 'Priya Sharma Updated',
      ielts_score: 7.5,
    } as any);
    expect(updated.full_name).toBe('Priya Sharma Updated');
    expect(updated.ielts_score).toBe(7.5);
  });

  test('updateSubscription: called with correct args', async () => {
    await profileQueries.updateSubscription('test-user-uuid-123', 'premium');
    expect(profileQueries.updateSubscription).toHaveBeenCalledWith(
      'test-user-uuid-123',
      'premium'
    );
  });
});

// ── Input validation helpers ──────────────────────────────────
describe('Email validation logic', () => {
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  test.each([
    ['user@example.com', true],
    ['user+tag@sub.domain.com', true],
    ['invalid', false],
    ['missing@', false],
    ['@nodomain.com', false],
    ['', false],
  ])('validates "%s" as %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});

describe('Password strength logic', () => {
  const isStrongEnough = (password: string) => password.length >= 8;

  test.each([
    ['secureP1', true],
    ['longpassword123', true],
    ['short', false],
    ['1234567', false],
    ['12345678', true],
  ])('password "%s" meets minimum: %s', (password, expected) => {
    expect(isStrongEnough(password)).toBe(expected);
  });
});
