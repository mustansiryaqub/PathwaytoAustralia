// ============================================================
// AustraliaPath — Core TypeScript Types
// ============================================================

// ── University ──────────────────────────────────────────────
export interface University {
  id: number;
  name: string;
  state: string;
  city: string;
  qs_rank_2026: string | null;
  afr_rank_2024: string | null;
  international_students_count: number;
  avg_intl_fees_aud: number;
  avg_intl_fees_range_low: number;
  avg_intl_fees_range_high: number;
  undergrad_entry_atar_equiv: number;
  postgrad_entry_requirement: string;
  scholarship_availability_pct: number;
  grad_employment_rate_pct: number;
  grad_employment_salary_median_aud: number;
  top_strengths: string[];
  established_year: number;
  website: string;
  logo_url: string | null;
}

// ── Course ───────────────────────────────────────────────────
export type CourseLevel = 'Undergraduate' | 'Postgraduate';

export interface Course {
  id: number;
  university_id: number;
  university_name: string;
  course_code: string;
  course_name: string;
  course_level: CourseLevel;
  course_category: string | null;
  duration_years: number;
  intl_fee_per_year_aud: number;
  entry_requirement: string | null;
  entry_score_ielts: number | null;
  entry_score_gmat: number | null;
  undergrad_prerequisites: string | null;
  grad_employment_rate_pct: number | null;
  grad_salary_median_aud: number | null;
  career_pathways: string[];
  anzsco_code: string | null;
  course_url_path: string | null;
  specializations: string[];
}

export interface CourseWithUniversity extends Course {
  state: string;
  city: string;
  qs_rank_2026: string | null;
  afr_rank_2024: string | null;
  uni_employment_rate: number;
  scholarship_availability_pct: number;
  university_website: string;
  logo_url: string | null;
}

// ── Scholarship ───────────────────────────────────────────────
export interface Scholarship {
  id: number;
  university_id: number;
  university_name: string;
  scholarship_name: string;
  scholarship_type: 'Merit-based' | 'Need-based' | 'Country-specific' | 'Discipline-specific' | 'Research-based';
  award_amount_aud: number;
  award_type: string;
  course_level: 'All' | 'Undergraduate' | 'Postgraduate';
  eligible_course_types: string[];
  eligibility_criteria: string | null;
  min_gpa: number | null;
  min_ielts: number | null;
  key_requirements: string | null;
  application_deadline: string | null;
  contact_url: string | null;
  open_intake: string | null;
  notes: string | null;
}

// ── User Profile ─────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'premium';
export type CurrentQualification = 'High School' | 'Diploma' | 'Bachelor' | 'Master' | 'PhD';
export type StudyField =
  | 'Engineering'
  | 'Business'
  | 'IT'
  | 'Medicine'
  | 'Science'
  | 'Agriculture'
  | 'Law'
  | 'Design'
  | 'Health'
  | 'Education'
  | 'Other';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  country_of_origin: string | null;
  current_qualification: CurrentQualification | null;
  gpa_score: number | null;
  ielts_score: number | null;
  gmat_score: number | null;
  has_work_experience: boolean;
  work_experience_years: number;
  preferred_field: StudyField | null;
  preferred_level: CourseLevel | null;
  preferred_state: string[];
  annual_budget_aud: number | null;
  subscription_tier: SubscriptionTier;
  revenuecat_customer_id: string | null;
  quiz_completed: boolean;
  quiz_completed_at: string | null;
  avatar_url: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ── Quiz ─────────────────────────────────────────────────────
export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'slider'
  | 'text_input'
  | 'number_input';

export interface QuizOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface QuizQuestion {
  id: string;
  step: number;
  type: QuestionType;
  category: 'academic' | 'preferences' | 'financial' | 'career' | 'background';
  question: string;
  subtitle?: string;
  options?: QuizOption[];
  min?: number;
  max?: number;
  step_size?: number;
  unit?: string;
  placeholder?: string;
  required: boolean;
  weight: number;  // Relative weight in recommendation scoring
}

export type QuizResponses = Record<string, string | string[] | number>;

// ── Recommendation ───────────────────────────────────────────
export interface ScoreBreakdown {
  academic: number;
  courseMatch: number;
  budget: number;
  location: number;
  career: number;
  ranking: number;
  total: number;
}

export interface RecommendationResult {
  id?: string;
  recommendation_id?: string;
  university: University;
  course: Course;
  rank_position: number;
  scores: ScoreBreakdown;
  match_reasons: string[];
  warnings: string[];
  is_locked: boolean;
  scholarship_count?: number;
  relevant_scholarships?: Scholarship[];
}

export interface UserRecommendation {
  id: string;
  user_id: string;
  quiz_response_id: string | null;
  generated_at: string;
  algorithm_version: string;
  is_premium_result: boolean;
  total_universities_scored: number | null;
  results?: RecommendationResult[];
}

// ── Algorithm Input ───────────────────────────────────────────
export interface AlgorithmInput {
  preferredField: StudyField;
  preferredLevel: CourseLevel;
  ieltsScore: number;
  annualBudgetAud: number;
  preferredStates: string[];
  careerGoals: string[];
  gmatScore?: number;
  gpaScore?: number;
  countryOfOrigin?: string;
  needsScholarship: boolean;
  preferredDurationYears?: number;
  rankingImportance: 'high' | 'medium' | 'low';
  researchOrCoursework: 'research' | 'coursework' | 'either';
  salaryImportance: 'high' | 'medium' | 'low';
  workExperienceYears: number;
  preferredSpecializations?: string[];
  currentQualification: CurrentQualification;
}

// ── RevenueCat / Subscription ────────────────────────────────
export interface SubscriptionPackage {
  identifier: string;
  packageType: string;
  priceString: string;
  product: {
    title: string;
    description: string;
    priceAmountMicros: number;
    priceCurrencyCode: string;
  };
}

export interface SubscriptionOffering {
  identifier: string;
  serverDescription: string;
  monthly: SubscriptionPackage | null;
  annual: SubscriptionPackage | null;
  availablePackages: SubscriptionPackage[];
}

// ── App State ────────────────────────────────────────────────
export interface AppError {
  code: string;
  message: string;
  details?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
