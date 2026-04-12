/**
 * Recommendation Algorithm Tests
 * Covers: scoring components, edge cases, deduplication, free-tier locking
 */

import {
  generateRecommendations,
  buildAlgorithmInput,
  ALGORITHM_VERSION,
  FREE_TIER_VISIBLE,
} from '@/lib/recommendation';
import type { University, Course, Scholarship, AlgorithmInput } from '@/types';

// ── Test fixtures ─────────────────────────────────────────────

const mockUniversities: University[] = [
  {
    id: 1,
    name: 'University of Melbourne',
    state: 'Victoria',
    city: 'Melbourne',
    qs_rank_2026: '19',
    afr_rank_2024: '3',
    international_students_count: 16000,
    avg_intl_fees_aud: 48000,
    avg_intl_fees_range_low: 37312,
    avg_intl_fees_range_high: 75696,
    undergrad_entry_atar_equiv: 85,
    postgrad_entry_requirement: 'Masters/Bachelors equivalents',
    scholarship_availability_pct: 35,
    grad_employment_rate_pct: 89,
    grad_employment_salary_median_aud: 72000,
    top_strengths: ['Engineering', 'Computer Science', 'Business'],
    established_year: 1853,
    website: 'unimelb.edu.au',
    logo_url: null,
  },
  {
    id: 2,
    name: 'UNSW Sydney',
    state: 'New South Wales',
    city: 'Sydney',
    qs_rank_2026: '20',
    afr_rank_2024: '3',
    international_students_count: 21000,
    avg_intl_fees_aud: 52500,
    avg_intl_fees_range_low: 40000,
    avg_intl_fees_range_high: 95500,
    undergrad_entry_atar_equiv: 86,
    postgrad_entry_requirement: 'GMAT 600+',
    scholarship_availability_pct: 32,
    grad_employment_rate_pct: 88,
    grad_employment_salary_median_aud: 74000,
    top_strengths: ['Engineering', 'Business', 'IT'],
    established_year: 1949,
    website: 'unsw.edu.au',
    logo_url: null,
  },
  {
    id: 6,
    name: 'Monash University',
    state: 'Victoria',
    city: 'Melbourne',
    qs_rank_2026: '37',
    afr_rank_2024: '4',
    international_students_count: 22000,
    avg_intl_fees_aud: 44000,
    avg_intl_fees_range_low: 32000,
    avg_intl_fees_range_high: 65000,
    undergrad_entry_atar_equiv: 82,
    postgrad_entry_requirement: '3-year degree',
    scholarship_availability_pct: 35,
    grad_employment_rate_pct: 84,
    grad_employment_salary_median_aud: 68000,
    top_strengths: ['Engineering', 'Business', 'IT'],
    established_year: 1958,
    website: 'monash.edu',
    logo_url: null,
  },
  {
    id: 14,
    name: 'La Trobe University',
    state: 'Victoria',
    city: 'Melbourne',
    qs_rank_2026: '274',
    afr_rank_2024: '25',
    international_students_count: 3000,
    avg_intl_fees_aud: 32000,
    avg_intl_fees_range_low: 25000,
    avg_intl_fees_range_high: 45000,
    undergrad_entry_atar_equiv: 70,
    postgrad_entry_requirement: 'IELTS 6.0+',
    scholarship_availability_pct: 10,
    grad_employment_rate_pct: 70,
    grad_employment_salary_median_aud: 48000,
    top_strengths: ['Business', 'IT', 'Science'],
    established_year: 1964,
    website: 'latrobe.edu.au',
    logo_url: null,
  },
];

const mockCourses: Course[] = [
  {
    id: 1002,
    university_id: 1,
    university_name: 'University of Melbourne',
    course_code: 'MS-COMP',
    course_name: 'Master of Computer Science',
    course_level: 'Postgraduate',
    course_category: 'IT',
    duration_years: 2,
    intl_fee_per_year_aud: 58000,
    entry_requirement: 'Bachelor in CS/related',
    entry_score_ielts: 7.0,
    entry_score_gmat: null,
    undergrad_prerequisites: 'Programming fundamentals',
    grad_employment_rate_pct: 95,
    grad_salary_median_aud: 95000,
    career_pathways: ['Senior Developer', 'Tech Lead', 'AI Specialist'],
    anzsco_code: '2611',
    course_url_path: 'engineering/masters-cs',
    specializations: ['AI', 'Machine Learning', 'Cloud Computing'],
  },
  {
    id: 2005,
    university_id: 2,
    university_name: 'UNSW Sydney',
    course_code: 'MS-CS',
    course_name: 'Master of Computer Science',
    course_level: 'Postgraduate',
    course_category: 'IT',
    duration_years: 2,
    intl_fee_per_year_aud: 56000,
    entry_requirement: 'Bachelor in CS/related',
    entry_score_ielts: 7.0,
    entry_score_gmat: null,
    undergrad_prerequisites: 'Programming experience',
    grad_employment_rate_pct: 96,
    grad_salary_median_aud: 97000,
    career_pathways: ['AI Engineer', 'Cloud Architect', 'Research Scientist'],
    anzsco_code: '2611',
    course_url_path: 'science/cs-masters',
    specializations: ['Artificial Intelligence', 'Cybersecurity', 'Blockchain'],
  },
  {
    id: 6005,
    university_id: 6,
    university_name: 'Monash University',
    course_code: 'MS-DS',
    course_name: 'Master of Data Science',
    course_level: 'Postgraduate',
    course_category: 'IT',
    duration_years: 2,
    intl_fee_per_year_aud: 55000,
    entry_requirement: 'Bachelor+relevant exp',
    entry_score_ielts: 7.0,
    entry_score_gmat: null,
    undergrad_prerequisites: 'Statistics/coding',
    grad_employment_rate_pct: 93,
    grad_salary_median_aud: 96000,
    career_pathways: ['Data Scientist', 'Analytics Manager', 'ML Engineer'],
    anzsco_code: '2724',
    course_url_path: 'science/data-science',
    specializations: ['ML', 'AI', 'Business Analytics'],
  },
  {
    id: 14005,
    university_id: 14,
    university_name: 'La Trobe University',
    course_code: 'MS-IT',
    course_name: 'Master of IT',
    course_level: 'Postgraduate',
    course_category: 'IT',
    duration_years: 2,
    intl_fee_per_year_aud: 38000,
    entry_requirement: 'Bachelor/relevant',
    entry_score_ielts: 6.0,
    entry_score_gmat: null,
    undergrad_prerequisites: 'Tech skills',
    grad_employment_rate_pct: 83,
    grad_salary_median_aud: 71000,
    career_pathways: ['Senior Developer', 'Tech Lead'],
    anzsco_code: '2611',
    course_url_path: 'it/masters',
    specializations: ['Cybersecurity', 'Cloud'],
  },
];

const mockScholarships: Scholarship[] = [
  {
    id: 1002,
    university_id: 1,
    university_name: 'University of Melbourne',
    scholarship_name: 'Melbourne Excellence Scholarship',
    scholarship_type: 'Merit-based',
    award_amount_aud: 15000,
    award_type: 'Tuition waiver',
    course_level: 'Postgraduate',
    eligible_course_types: ['All'],
    eligibility_criteria: 'High academic performance',
    min_gpa: 3.5,
    min_ielts: 7.0,
    key_requirements: 'Academic excellence',
    application_deadline: 'November 30',
    contact_url: 'scholarships.unimelb.edu.au',
    open_intake: 'Feb/July',
    notes: 'Competitive',
  },
];

const baseInput: AlgorithmInput = {
  preferredField: 'IT',
  preferredLevel: 'Postgraduate',
  ieltsScore: 7.0,
  annualBudgetAud: 60000,
  preferredStates: ['Victoria'],
  careerGoals: ['Software Engineer', 'AI Engineer'],
  needsScholarship: false,
  rankingImportance: 'high',
  researchOrCoursework: 'coursework',
  salaryImportance: 'high',
  workExperienceYears: 2,
  currentQualification: 'Bachelor',
};

// ── Tests ─────────────────────────────────────────────────────

describe('generateRecommendations', () => {
  test('returns results in descending score order', () => {
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      baseInput,
      true
    );
    expect(results.length).toBeGreaterThan(0);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].scores.total).toBeGreaterThanOrEqual(
        results[i + 1].scores.total
      );
    }
  });

  test('rank_position is sequential starting at 1', () => {
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      baseInput,
      true
    );
    results.forEach((r, idx) => {
      expect(r.rank_position).toBe(idx + 1);
    });
  });

  test('scores are within 0–100 range', () => {
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      baseInput,
      true
    );
    results.forEach((r) => {
      expect(r.scores.total).toBeGreaterThanOrEqual(0);
      expect(r.scores.total).toBeLessThanOrEqual(105); // small scholarship bonus allowed
      expect(r.scores.academic).toBeGreaterThanOrEqual(0);
      expect(r.scores.academic).toBeLessThanOrEqual(100);
      expect(r.scores.budget).toBeGreaterThanOrEqual(0);
      expect(r.scores.budget).toBeLessThanOrEqual(100);
    });
  });

  test('deduplicates: at most one result per university', () => {
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      baseInput,
      true
    );
    const uniIds = results.map((r) => r.university.id);
    const unique = new Set(uniIds);
    expect(unique.size).toBe(uniIds.length);
  });

  test('Victoria preference scores Melbourne universities higher than NSW', () => {
    const vicInput = { ...baseInput, preferredStates: ['Victoria'] };
    const nswInput = { ...baseInput, preferredStates: ['New South Wales'] };

    const vicResults = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      vicInput,
      true
    );
    const nswResults = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      nswInput,
      true
    );

    const melbScoreVic = vicResults.find(
      (r) => r.university.state === 'Victoria'
    )?.scores.location ?? 0;
    const melbScoreNsw = nswResults.find(
      (r) => r.university.state === 'Victoria'
    )?.scores.location ?? 0;

    expect(melbScoreVic).toBeGreaterThan(melbScoreNsw);
  });

  test('free tier: locks results beyond FREE_TIER_VISIBLE', () => {
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      baseInput,
      false // not premium
    );
    results.forEach((r) => {
      if (r.rank_position <= FREE_TIER_VISIBLE) {
        expect(r.is_locked).toBe(false);
      } else {
        expect(r.is_locked).toBe(true);
      }
    });
  });

  test('premium: no results are locked', () => {
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      baseInput,
      true // premium
    );
    results.forEach((r) => {
      expect(r.is_locked).toBe(false);
    });
  });

  test('excludes courses with IELTS far below requirement', () => {
    const lowIeltsInput: AlgorithmInput = {
      ...baseInput,
      ieltsScore: 5.0, // well below 7.0 requirement on most courses
    };
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      lowIeltsInput,
      true
    );
    // La Trobe requires 6.0; 5.0 is exactly 1.0 below so it should be excluded
    // Melbourne/UNSW require 7.0; 5.0 is 2.0 below, excluded
    // Only La Trobe course might survive (6.0 - 1.0 = 5.0, which is at the hard cutoff boundary)
    results.forEach((r) => {
      const req = r.course.entry_score_ielts ?? 6.0;
      expect(lowIeltsInput.ieltsScore).toBeGreaterThanOrEqual(req - 1.0);
    });
  });

  test('budget score is 100 when fees are well within budget', () => {
    const highBudgetInput: AlgorithmInput = {
      ...baseInput,
      annualBudgetAud: 100000,
    };
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      highBudgetInput,
      true
    );
    // All course fees are well under $100K, so budget score should be 100
    results.forEach((r) => {
      expect(r.scores.budget).toBe(100);
    });
  });

  test('match_reasons array is non-empty for top results', () => {
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      baseInput,
      true
    );
    expect(results[0].match_reasons.length).toBeGreaterThan(0);
  });

  test('scholarship count is populated when user needs scholarship', () => {
    const schInput: AlgorithmInput = { ...baseInput, needsScholarship: true };
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      schInput,
      true
    );
    const melbResult = results.find((r) => r.university.id === 1);
    if (melbResult) {
      // mockScholarships has one scholarship for university 1
      expect(melbResult.scholarship_count).toBeGreaterThan(0);
    }
  });

  test('returns empty array when no courses match level', () => {
    const ugInput: AlgorithmInput = {
      ...baseInput,
      preferredLevel: 'Undergraduate',
    };
    // All mockCourses are Postgraduate
    const results = generateRecommendations(
      mockCourses,
      mockUniversities,
      mockScholarships,
      ugInput,
      true
    );
    expect(results).toHaveLength(0);
  });
});

// ── buildAlgorithmInput tests ─────────────────────────────────
describe('buildAlgorithmInput', () => {
  test('parses string values correctly', () => {
    const responses = {
      field_of_study: 'Engineering',
      study_level: 'Undergraduate',
      ielts_score: '7.5',
      annual_budget: '55000',
      preferred_state: 'Victoria',
      career_goals: ['Civil Engineer', 'Project Manager'],
      needs_scholarship: 'yes',
      ranking_importance: 'high',
      research_or_coursework: 'coursework',
      salary_importance: 'medium',
      work_experience_years: '3',
      current_qualification: 'Bachelor',
    };
    const input = buildAlgorithmInput(responses);
    expect(input.preferredField).toBe('Engineering');
    expect(input.preferredLevel).toBe('Undergraduate');
    expect(input.ieltsScore).toBe(7.5);
    expect(input.annualBudgetAud).toBe(55000);
    expect(input.needsScholarship).toBe(true);
    expect(input.rankingImportance).toBe('high');
    expect(input.workExperienceYears).toBe(3);
  });

  test('applies defaults when keys are missing', () => {
    const input = buildAlgorithmInput({});
    expect(input.preferredField).toBe('IT');
    expect(input.preferredLevel).toBe('Undergraduate');
    expect(input.ieltsScore).toBe(6.5);
    expect(input.annualBudgetAud).toBe(50000);
    expect(input.needsScholarship).toBe(false);
  });

  test('wraps single state string into array', () => {
    const input = buildAlgorithmInput({ preferred_state: 'Victoria' });
    expect(Array.isArray(input.preferredStates)).toBe(true);
    expect(input.preferredStates).toContain('Victoria');
  });

  test('passes through array state preference unchanged', () => {
    const states = ['Victoria', 'New South Wales'];
    const input = buildAlgorithmInput({ preferred_state: states });
    expect(input.preferredStates).toEqual(states);
  });

  test('omits gmatScore when not provided', () => {
    const input = buildAlgorithmInput({});
    expect(input.gmatScore).toBeUndefined();
  });
});

// ── Algorithm version ─────────────────────────────────────────
describe('Algorithm metadata', () => {
  test('ALGORITHM_VERSION is defined', () => {
    expect(ALGORITHM_VERSION).toBe('v1');
  });

  test('FREE_TIER_VISIBLE is 3', () => {
    expect(FREE_TIER_VISIBLE).toBe(3);
  });
});
