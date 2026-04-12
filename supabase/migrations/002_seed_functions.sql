-- ============================================================
-- Migration 002: Helper functions for seed validation
-- Run after 001_initial_schema.sql and after seeding data
-- ============================================================

-- Count rows in each table (useful for validating seed)
CREATE OR REPLACE FUNCTION get_data_counts()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'universities'::TEXT, COUNT(*)::BIGINT FROM universities
  UNION ALL
  SELECT 'courses'::TEXT, COUNT(*)::BIGINT FROM courses
  UNION ALL
  SELECT 'scholarships'::TEXT, COUNT(*)::BIGINT FROM scholarships
  UNION ALL
  SELECT 'user_profiles'::TEXT, COUNT(*)::BIGINT FROM user_profiles
  UNION ALL
  SELECT 'user_recommendations'::TEXT, COUNT(*)::BIGINT FROM user_recommendations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Full-text search across universities + courses
CREATE OR REPLACE FUNCTION search_universities(query TEXT)
RETURNS TABLE(
  university_id INTEGER,
  university_name TEXT,
  city TEXT,
  state TEXT,
  qs_rank_2026 TEXT,
  course_count BIGINT,
  scholarship_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.city,
    u.state,
    u.qs_rank_2026,
    (SELECT COUNT(*) FROM courses c WHERE c.university_id = u.id),
    (SELECT COUNT(*) FROM scholarships s WHERE s.university_id = u.id)
  FROM universities u
  WHERE
    u.name ILIKE '%' || query || '%'
    OR u.city ILIKE '%' || query || '%'
    OR u.state ILIKE '%' || query || '%'
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.university_id = u.id
        AND c.course_name ILIKE '%' || query || '%'
    )
  ORDER BY
    CASE
      WHEN u.qs_rank_2026 = 'N/A' OR u.qs_rank_2026 IS NULL THEN 9999
      ELSE u.qs_rank_2026::INTEGER
    END ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get eligible scholarships for a student profile
CREATE OR REPLACE FUNCTION get_eligible_scholarships(
  p_course_level TEXT,
  p_ielts NUMERIC,
  p_gpa NUMERIC,
  p_country TEXT DEFAULT NULL
)
RETURNS SETOF scholarships AS $$
BEGIN
  RETURN QUERY
  SELECT s.*
  FROM scholarships s
  WHERE
    -- Level match
    (s.course_level = 'All' OR s.course_level = p_course_level)
    -- IELTS requirement
    AND (s.min_ielts IS NULL OR p_ielts >= s.min_ielts)
    -- GPA requirement
    AND (s.min_gpa IS NULL OR p_gpa IS NULL OR p_gpa >= s.min_gpa)
    -- Country-specific (include all non-country-specific + matching country ones)
    AND (
      s.scholarship_type != 'Country-specific'
      OR p_country IS NULL
      OR s.eligibility_criteria ILIKE '%' || p_country || '%'
    )
  ORDER BY s.award_amount_aud DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Usage: SELECT * FROM get_data_counts();
-- Usage: SELECT * FROM search_universities('Melbourne');
-- Usage: SELECT * FROM get_eligible_scholarships('Postgraduate', 7.0, 3.5, 'India');
