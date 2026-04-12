-- ============================================================
-- AustraliaPath Database Schema
-- Migration: 001_initial_schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text fuzzy search

-- ============================================================
-- UNIVERSITIES
-- ============================================================
CREATE TABLE universities (
  id                          INTEGER PRIMARY KEY,
  name                        TEXT NOT NULL,
  state                       TEXT NOT NULL,
  city                        TEXT NOT NULL,
  qs_rank_2026                TEXT,          -- "N/A" for unranked
  afr_rank_2024               TEXT,
  international_students_count INTEGER,
  avg_intl_fees_aud           INTEGER,
  avg_intl_fees_range_low     INTEGER,
  avg_intl_fees_range_high    INTEGER,
  undergrad_entry_atar_equiv  INTEGER,
  postgrad_entry_requirement  TEXT,
  scholarship_availability_pct INTEGER,
  grad_employment_rate_pct    INTEGER,
  grad_employment_salary_median_aud INTEGER,
  top_strengths               TEXT[],        -- Array: Engineering, Business, etc.
  established_year            INTEGER,
  website                     TEXT,
  logo_url                    TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_universities_state ON universities(state);
CREATE INDEX idx_universities_qs_rank ON universities(qs_rank_2026);
CREATE INDEX idx_universities_name_trgm ON universities USING gin(name gin_trgm_ops);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id                          INTEGER PRIMARY KEY,
  university_id               INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  university_name             TEXT NOT NULL,
  course_code                 TEXT NOT NULL,
  course_name                 TEXT NOT NULL,
  course_level                TEXT NOT NULL CHECK (course_level IN ('Undergraduate', 'Postgraduate')),
  course_category             TEXT,          -- Engineering, Business, IT, etc. (derived)
  duration_years              NUMERIC(3,1) NOT NULL,
  intl_fee_per_year_aud       INTEGER NOT NULL,
  entry_requirement           TEXT,
  entry_score_ielts           NUMERIC(3,1),
  entry_score_gmat            INTEGER,       -- NULL if N/A
  undergrad_prerequisites     TEXT,
  grad_employment_rate_pct    INTEGER,
  grad_salary_median_aud      INTEGER,
  career_pathways             TEXT[],        -- Array parsed from pipe-delimited
  anzsco_code                 TEXT,
  course_url_path             TEXT,
  specializations             TEXT[],        -- Array parsed from pipe-delimited
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_university ON courses(university_id);
CREATE INDEX idx_courses_level ON courses(course_level);
CREATE INDEX idx_courses_category ON courses(course_category);
CREATE INDEX idx_courses_fee ON courses(intl_fee_per_year_aud);
CREATE INDEX idx_courses_ielts ON courses(entry_score_ielts);

-- ============================================================
-- SCHOLARSHIPS
-- ============================================================
CREATE TABLE scholarships (
  id                          INTEGER PRIMARY KEY,
  university_id               INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  university_name             TEXT NOT NULL,
  scholarship_name            TEXT NOT NULL,
  scholarship_type            TEXT NOT NULL, -- Merit-based, Need-based, Country-specific, etc.
  award_amount_aud            INTEGER NOT NULL,
  award_type                  TEXT NOT NULL, -- Tuition waiver, Living allowance, etc.
  course_level                TEXT NOT NULL, -- All, Undergraduate, Postgraduate
  eligible_course_types       TEXT[],
  eligibility_criteria        TEXT,
  min_gpa                     NUMERIC(3,1),
  min_ielts                   NUMERIC(3,1),
  key_requirements            TEXT,
  application_deadline        TEXT,
  contact_url                 TEXT,
  open_intake                 TEXT,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scholarships_university ON scholarships(university_id);
CREATE INDEX idx_scholarships_type ON scholarships(scholarship_type);
CREATE INDEX idx_scholarships_level ON scholarships(course_level);
CREATE INDEX idx_scholarships_amount ON scholarships(award_amount_aud);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE user_profiles (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                   TEXT,
  email                       TEXT,
  country_of_origin           TEXT,
  current_qualification       TEXT,          -- High School, Bachelor, etc.
  gpa_score                   NUMERIC(3,2),  -- Out of 4.0
  ielts_score                 NUMERIC(3,1),
  gmat_score                  INTEGER,
  has_work_experience         BOOLEAN DEFAULT FALSE,
  work_experience_years       INTEGER DEFAULT 0,
  preferred_field             TEXT,          -- Engineering, Business, etc.
  preferred_level             TEXT,          -- Undergraduate, Postgraduate
  preferred_state             TEXT[],        -- Multiple states OK
  annual_budget_aud           INTEGER,
  subscription_tier           TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  revenuecat_customer_id      TEXT,
  quiz_completed              BOOLEAN DEFAULT FALSE,
  quiz_completed_at           TIMESTAMPTZ,
  avatar_url                  TEXT,
  notifications_enabled       BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUIZ RESPONSES
-- ============================================================
CREATE TABLE quiz_responses (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id                  UUID NOT NULL DEFAULT uuid_generate_v4(),  -- Allows retakes
  responses                   JSONB NOT NULL DEFAULT '{}',  -- {questionId: answer}
  score_weights               JSONB,         -- Computed weights used
  completed                   BOOLEAN DEFAULT FALSE,
  completed_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_responses_user ON quiz_responses(user_id);
CREATE INDEX idx_quiz_responses_session ON quiz_responses(session_id);

-- ============================================================
-- USER RECOMMENDATIONS
-- ============================================================
CREATE TABLE user_recommendations (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_response_id            UUID REFERENCES quiz_responses(id) ON DELETE SET NULL,
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  algorithm_version           TEXT NOT NULL DEFAULT 'v1',
  is_premium_result           BOOLEAN DEFAULT FALSE,  -- True = full 10, False = top 3 only
  total_universities_scored   INTEGER
);

CREATE INDEX idx_recommendations_user ON user_recommendations(user_id);

-- ============================================================
-- RECOMMENDATION RESULTS (ranked university list)
-- ============================================================
CREATE TABLE recommendation_results (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id           UUID NOT NULL REFERENCES user_recommendations(id) ON DELETE CASCADE,
  university_id               INTEGER NOT NULL REFERENCES universities(id),
  course_id                   INTEGER REFERENCES courses(id),
  rank_position               INTEGER NOT NULL CHECK (rank_position BETWEEN 1 AND 10),
  total_score                 NUMERIC(5,2) NOT NULL,  -- 0–100
  academic_score              NUMERIC(5,2),
  course_match_score          NUMERIC(5,2),
  budget_score                NUMERIC(5,2),
  location_score              NUMERIC(5,2),
  career_score                NUMERIC(5,2),
  ranking_score               NUMERIC(5,2),
  match_reasons               TEXT[],        -- Human-readable match reasons
  warnings                    TEXT[],        -- e.g. "IELTS slightly below requirement"
  is_locked                   BOOLEAN DEFAULT FALSE  -- Positions 4–10 locked for free tier
);

CREATE INDEX idx_rec_results_recommendation ON recommendation_results(recommendation_id);
CREATE INDEX idx_rec_results_rank ON recommendation_results(recommendation_id, rank_position);

-- ============================================================
-- SAVED UNIVERSITIES (bookmarks)
-- ============================================================
CREATE TABLE saved_universities (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id               INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  course_id                   INTEGER REFERENCES courses(id),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, university_id, course_id)
);

CREATE INDEX idx_saved_user ON saved_universities(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Universities, courses, scholarships: public read
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read universities" ON universities FOR SELECT USING (true);
CREATE POLICY "Public can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public can read scholarships" ON scholarships FOR SELECT USING (true);

-- Only service role can write to reference tables
CREATE POLICY "Service role can insert universities" ON universities FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update universities" ON universities FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can insert courses" ON courses FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update courses" ON courses FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can insert scholarships" ON scholarships FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update scholarships" ON scholarships FOR UPDATE USING (auth.role() = 'service_role');

-- User profiles: users manage their own
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Quiz responses: users manage their own
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz responses" ON quiz_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz responses" ON quiz_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz responses" ON quiz_responses FOR UPDATE USING (auth.uid() = user_id);

-- Recommendations: users view their own
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendations" ON user_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON user_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE recommendation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendation results"
  ON recommendation_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_recommendations ur
      WHERE ur.id = recommendation_results.recommendation_id
        AND ur.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own recommendation results"
  ON recommendation_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_recommendations ur
      WHERE ur.id = recommendation_results.recommendation_id
        AND ur.user_id = auth.uid()
    )
  );

-- Saved universities
ALTER TABLE saved_universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved universities" ON saved_universities
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER universities_updated_at BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER scholarships_updated_at BEFORE UPDATE ON scholarships
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- TRIGGER: auto-create user_profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- VIEWS: Convenience views for the app
-- ============================================================

-- Full course view with university details
CREATE VIEW courses_with_university AS
SELECT
  c.*,
  u.state,
  u.city,
  u.qs_rank_2026,
  u.afr_rank_2024,
  u.grad_employment_rate_pct AS uni_employment_rate,
  u.scholarship_availability_pct,
  u.website AS university_website,
  u.logo_url
FROM courses c
JOIN universities u ON c.university_id = u.id;

-- Scholarship view with university location
CREATE VIEW scholarships_with_university AS
SELECT
  s.*,
  u.state,
  u.city,
  u.website AS university_website,
  u.qs_rank_2026
FROM scholarships s
JOIN universities u ON s.university_id = u.id;
