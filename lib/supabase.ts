import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type {
  University,
  Course,
  Scholarship,
  UserProfile,
  QuizResponses,
  UserRecommendation,
  RecommendationResult,
} from '@/types';

// ── Secure storage adapter for Supabase auth tokens ──────────
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fallback to AsyncStorage for large values
      return AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length < 2048) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* already gone */
    }
    await AsyncStorage.removeItem(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example → .env and fill in your values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Auth helpers ─────────────────────────────────────────────

export const authHelpers = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'australiapath://reset-password',
    });
    return { data, error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  },
};

// ── University queries ───────────────────────────────────────

export const universityQueries = {
  getAll: async (): Promise<University[]> => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('qs_rank_2026', { ascending: true });
    if (error) throw error;
    return data;
  },

  getById: async (id: number): Promise<University> => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  getByState: async (state: string): Promise<University[]> => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('state', state)
      .order('qs_rank_2026', { ascending: true });
    if (error) throw error;
    return data;
  },

  search: async (query: string): Promise<University[]> => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data;
  },
};

// ── Course queries ───────────────────────────────────────────

export const courseQueries = {
  getAll: async (): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('university_id', { ascending: true });
    if (error) throw error;
    return data;
  },

  getByUniversity: async (universityId: number): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('university_id', universityId)
      .order('course_level', { ascending: true });
    if (error) throw error;
    return data;
  },

  getByLevelAndField: async (
    level: string,
    field: string
  ): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*, universities(name, state, city, qs_rank_2026)')
      .eq('course_level', level)
      .eq('course_category', field)
      .order('intl_fee_per_year_aud', { ascending: true });
    if (error) throw error;
    return data;
  },

  getForRecommendation: async (
    level: string,
    maxFeePerYear: number
  ): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses_with_university')
      .select('*')
      .eq('course_level', level)
      .lte('intl_fee_per_year_aud', maxFeePerYear);
    if (error) throw error;
    return data;
  },
};

// ── Scholarship queries ──────────────────────────────────────

export const scholarshipQueries = {
  getAll: async (): Promise<Scholarship[]> => {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .order('award_amount_aud', { ascending: false });
    if (error) throw error;
    return data;
  },

  getByUniversity: async (universityId: number): Promise<Scholarship[]> => {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('university_id', universityId)
      .order('award_amount_aud', { ascending: false });
    if (error) throw error;
    return data;
  },

  getEligible: async (params: {
    level: string;
    gpa?: number;
    ielts?: number;
    country?: string;
  }): Promise<Scholarship[]> => {
    let query = supabase
      .from('scholarships')
      .select('*')
      .or(`course_level.eq.All,course_level.eq.${params.level}`)
      .order('award_amount_aud', { ascending: false });

    if (params.gpa) {
      query = query.lte('min_gpa', params.gpa);
    }
    if (params.ielts) {
      query = query.lte('min_ielts', params.ielts);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

// ── User profile queries ─────────────────────────────────────

export const profileQueries = {
  get: async (userId: string): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  upsert: async (profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSubscription: async (
    userId: string,
    tier: 'free' | 'premium',
    revenuecatId?: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        revenuecat_customer_id: revenuecatId,
      })
      .eq('id', userId);
    if (error) throw error;
  },
};

// ── Recommendation queries ───────────────────────────────────

export const recommendationQueries = {
  saveQuizResponses: async (
    userId: string,
    responses: QuizResponses
  ): Promise<string> => {
    const { data, error } = await supabase
      .from('quiz_responses')
      .insert({
        user_id: userId,
        responses,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  saveRecommendation: async (
    userId: string,
    quizResponseId: string,
    results: RecommendationResult[],
    isPremium: boolean
  ): Promise<string> => {
    const { data: rec, error: recError } = await supabase
      .from('user_recommendations')
      .insert({
        user_id: userId,
        quiz_response_id: quizResponseId,
        is_premium_result: isPremium,
        total_universities_scored: results.length,
      })
      .select('id')
      .single();
    if (recError) throw recError;

    const resultRows = results.map((r) => ({
      recommendation_id: rec.id,
      university_id: r.university.id,
      course_id: r.course.id,
      rank_position: r.rank_position,
      total_score: r.scores.total,
      academic_score: r.scores.academic,
      course_match_score: r.scores.courseMatch,
      budget_score: r.scores.budget,
      location_score: r.scores.location,
      career_score: r.scores.career,
      ranking_score: r.scores.ranking,
      match_reasons: r.match_reasons,
      warnings: r.warnings,
      is_locked: r.is_locked,
    }));

    const { error: resultsError } = await supabase
      .from('recommendation_results')
      .insert(resultRows);
    if (resultsError) throw resultsError;

    // Mark quiz as completed in profile
    await supabase
      .from('user_profiles')
      .update({ quiz_completed: true, quiz_completed_at: new Date().toISOString() })
      .eq('id', userId);

    return rec.id;
  },

  getLatest: async (userId: string): Promise<UserRecommendation | null> => {
    const { data, error } = await supabase
      .from('user_recommendations')
      .select(`
        *,
        recommendation_results (
          *,
          universities (*),
          courses (*)
        )
      `)
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') return null; // No rows
    if (error) throw error;
    return data;
  },
};
