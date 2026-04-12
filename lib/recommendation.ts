// ============================================================
// AustraliaPath Recommendation Algorithm v1
//
// Scoring formula (100 points total):
//   Academic Match    25 pts  — IELTS, GMAT, GPA vs requirements
//   Course Match      25 pts  — Field, level, specialization
//   Budget Match      20 pts  — Fee vs annual budget
//   Location Match    15 pts  — State preference
//   Career Match      10 pts  — Employment rate, salary, pathways
//   Ranking Bonus      5 pts  — QS/AFR rank
// ============================================================

import type {
  AlgorithmInput,
  Course,
  University,
  Scholarship,
  RecommendationResult,
  ScoreBreakdown,
  StudyField,
} from '@/types';

const ALGORITHM_VERSION = 'v1';
const FREE_TIER_VISIBLE = 3;  // Free users see top 3 only
const MAX_RESULTS = 10;

// ── Field → course category mapping ─────────────────────────
const FIELD_TO_CATEGORY: Record<StudyField, string[]> = {
  Engineering: ['Engineering'],
  Business: ['Business', 'Commerce', 'Finance', 'Analytics'],
  IT: ['IT', 'Computer Science', 'Information Technology'],
  Medicine: ['Medicine', 'Medical'],
  Science: ['Science', 'Research'],
  Agriculture: ['Agriculture'],
  Law: ['Law'],
  Design: ['Design'],
  Health: ['Health', 'Nursing', 'Health Science'],
  Education: ['Education'],
  Other: [],
};

// Career pathways keyword mapping
const FIELD_CAREER_KEYWORDS: Record<StudyField, string[]> = {
  Engineering: ['Engineer', 'Technical', 'Systems', 'Project Manager', 'Architect'],
  Business: ['Manager', 'Director', 'Consultant', 'Analyst', 'Executive', 'MBA'],
  IT: ['Developer', 'Software', 'Data', 'Cloud', 'Architect', 'Tech Lead', 'AI'],
  Medicine: ['Doctor', 'Surgeon', 'Specialist', 'Medical', 'Physician'],
  Science: ['Scientist', 'Researcher', 'Analyst', 'PhD'],
  Agriculture: ['Agronomist', 'Farmer', 'Agricultural'],
  Law: ['Lawyer', 'Barrister', 'Legal', 'Solicitor'],
  Design: ['Designer', 'UX', 'Creative', 'Director'],
  Health: ['Nurse', 'Health', 'Allied Health', 'Professional'],
  Education: ['Teacher', 'Educator', 'Lecturer'],
  Other: [],
};

// Australian states normalised
const STATE_NORMALISE: Record<string, string> = {
  'Victoria': 'Victoria',
  'VIC': 'Victoria',
  'New South Wales': 'New South Wales',
  'NSW': 'New South Wales',
  'Queensland': 'Queensland',
  'QLD': 'Queensland',
  'Western Australia': 'Western Australia',
  'WA': 'Western Australia',
  'South Australia': 'South Australia',
  'SA': 'South Australia',
  'ACT': 'Australian Capital Territory',
  'Australian Capital Territory': 'Australian Capital Territory',
  'Tasmania': 'Tasmania',
  'TAS': 'Tasmania',
  'Northern Territory': 'Northern Territory',
  'NT': 'Northern Territory',
};

// ── QS rank → score helper ───────────────────────────────────
function qsRankToScore(rank: string | null | undefined): number {
  if (!rank || rank === 'N/A') return 0;
  const n = parseInt(rank, 10);
  if (isNaN(n)) return 0;
  if (n <= 30) return 100;
  if (n <= 50) return 90;
  if (n <= 100) return 75;
  if (n <= 200) return 60;
  if (n <= 300) return 45;
  if (n <= 400) return 30;
  return 15;
}

// ── Academic score (0–100) ───────────────────────────────────
function scoreAcademic(
  course: Course,
  input: AlgorithmInput
): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let points = 0;
  let maxPoints = 0;

  // IELTS (40 pts)
  maxPoints += 40;
  const requiredIelts = course.entry_score_ielts ?? 6.0;
  if (input.ieltsScore >= requiredIelts + 0.5) {
    points += 40;
    reasons.push(`IELTS ${input.ieltsScore} exceeds requirement`);
  } else if (input.ieltsScore >= requiredIelts) {
    points += 30;
    reasons.push(`IELTS ${input.ieltsScore} meets requirement`);
  } else if (input.ieltsScore >= requiredIelts - 0.5) {
    points += 15;
    warnings.push(`IELTS ${input.ieltsScore} is slightly below ${requiredIelts} required`);
  } else {
    points += 0;
    warnings.push(`IELTS ${input.ieltsScore} is below ${requiredIelts} required`);
  }

  // GMAT (30 pts — only if required)
  if (course.entry_score_gmat) {
    maxPoints += 30;
    if (input.gmatScore) {
      if (input.gmatScore >= course.entry_score_gmat + 50) {
        points += 30;
        reasons.push(`GMAT ${input.gmatScore} exceeds requirement`);
      } else if (input.gmatScore >= course.entry_score_gmat) {
        points += 22;
        reasons.push(`GMAT meets requirement`);
      } else if (input.gmatScore >= course.entry_score_gmat - 50) {
        points += 10;
        warnings.push(`GMAT slightly below requirement of ${course.entry_score_gmat}`);
      } else {
        warnings.push(`GMAT ${input.gmatScore} is below requirement of ${course.entry_score_gmat}`);
      }
    } else {
      warnings.push('GMAT score required but not provided');
    }
  }

  // GPA for postgrad (30 pts)
  if (course.course_level === 'Postgraduate') {
    maxPoints += 30;
    if (input.gpaScore) {
      if (input.gpaScore >= 3.7) {
        points += 30;
        reasons.push('Strong GPA — excellent postgrad candidate');
      } else if (input.gpaScore >= 3.0) {
        points += 22;
        reasons.push('GPA meets postgrad requirements');
      } else if (input.gpaScore >= 2.5) {
        points += 12;
        warnings.push('GPA may be below some postgrad requirements');
      } else {
        warnings.push('GPA may not meet postgrad entry requirements');
      }
    } else {
      points += 15; // Partial credit — assumed passable
    }
  }

  const normalised = maxPoints > 0 ? (points / maxPoints) * 100 : 50;
  return { score: Math.min(100, normalised), reasons, warnings };
}

// ── Course match score (0–100) ───────────────────────────────
function scoreCourseMatch(
  course: Course,
  input: AlgorithmInput
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Level match (40 pts)
  if (course.course_level === input.preferredLevel) {
    score += 40;
    reasons.push(`${course.course_level} level matches preference`);
  } else {
    // Half credit for near misses
    score += 10;
  }

  // Field/category match (40 pts)
  const targetCategories = FIELD_TO_CATEGORY[input.preferredField] ?? [];
  const courseCategory = course.course_category ?? course.course_name;
  const fieldMatch = targetCategories.some(
    (cat) =>
      courseCategory.toLowerCase().includes(cat.toLowerCase()) ||
      course.course_name.toLowerCase().includes(cat.toLowerCase())
  );
  if (fieldMatch) {
    score += 40;
    reasons.push(`${input.preferredField} aligns with course content`);
  }

  // Specialization match (20 pts)
  if (input.preferredSpecializations && input.preferredSpecializations.length > 0 && course.specializations.length > 0) {
    const overlap = input.preferredSpecializations.filter((spec) =>
      course.specializations.some((cs) =>
        cs.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(cs.toLowerCase())
      )
    );
    if (overlap.length > 0) {
      score += Math.min(20, overlap.length * 10);
      reasons.push(`Offers ${overlap.join(', ')} specialization`);
    }
  } else {
    score += 10; // No preference penalty
  }

  // Research vs coursework preference (bonus)
  if (input.researchOrCoursework === 'research' && course.course_code.includes('RES')) {
    score = Math.min(100, score + 10);
    reasons.push('Research pathway available');
  }

  return { score: Math.min(100, score), reasons };
}

// ── Budget score (0–100) ─────────────────────────────────────
function scoreBudget(
  course: Course,
  input: AlgorithmInput
): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const fee = course.intl_fee_per_year_aud;
  const budget = input.annualBudgetAud;

  let score: number;

  if (budget <= 0) {
    return { score: 50, reasons: ['No budget constraint'], warnings: [] };
  }

  const ratio = fee / budget;

  if (ratio <= 0.7) {
    score = 100;
    reasons.push(`Fees ${formatAUD(fee)}/yr is well within budget`);
  } else if (ratio <= 0.85) {
    score = 85;
    reasons.push(`Fees ${formatAUD(fee)}/yr comfortably within budget`);
  } else if (ratio <= 1.0) {
    score = 65;
    reasons.push(`Fees ${formatAUD(fee)}/yr within budget`);
  } else if (ratio <= 1.15) {
    score = 40;
    warnings.push(`Fees ${formatAUD(fee)}/yr slightly over budget`);
  } else if (ratio <= 1.3) {
    score = 20;
    warnings.push(`Fees ${formatAUD(fee)}/yr exceed budget by ${Math.round((ratio - 1) * 100)}%`);
  } else {
    score = 0;
    warnings.push(`Fees significantly exceed budget — consider scholarships`);
  }

  return { score, reasons, warnings };
}

// ── Location score (0–100) ───────────────────────────────────
function scoreLocation(
  university: University,
  input: AlgorithmInput
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  if (input.preferredStates.length === 0) {
    return { score: 70, reasons: ['No location preference'] };
  }

  const normalisedPreferred = input.preferredStates
    .map((s) => STATE_NORMALISE[s] ?? s);
  const uniState = STATE_NORMALISE[university.state] ?? university.state;

  if (normalisedPreferred.includes(uniState)) {
    reasons.push(`Located in preferred state (${university.city})`);
    return { score: 100, reasons };
  }

  // Sydney / Melbourne preference often means NSW / VIC overlap for nearby cities
  return { score: 20, reasons: [`Located in ${university.city}, ${university.state}`] };
}

// ── Career score (0–100) ─────────────────────────────────────
function scoreCareer(
  course: Course,
  university: University,
  input: AlgorithmInput
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Employment rate (40 pts)
  const empRate = course.grad_employment_rate_pct ?? university.grad_employment_rate_pct;
  if (empRate >= 90) {
    score += 40;
    reasons.push(`${empRate}% graduate employment rate`);
  } else if (empRate >= 80) {
    score += 28;
    reasons.push(`${empRate}% graduate employment rate`);
  } else if (empRate >= 70) {
    score += 16;
  } else {
    score += 5;
  }

  // Salary (30 pts) — only if important
  if (input.salaryImportance !== 'low') {
    const salary = course.grad_salary_median_aud ?? university.grad_employment_salary_median_aud;
    const weight = input.salaryImportance === 'high' ? 30 : 20;
    if (salary >= 100_000) {
      score += weight;
      reasons.push(`Median graduate salary ${formatAUD(salary)}`);
    } else if (salary >= 80_000) {
      score += weight * 0.7;
      reasons.push(`Graduate salary ${formatAUD(salary)}`);
    } else if (salary >= 60_000) {
      score += weight * 0.4;
    }
  }

  // Career pathway keyword match (30 pts)
  const keywords = FIELD_CAREER_KEYWORDS[input.preferredField] ?? [];
  if (keywords.length > 0 && course.career_pathways.length > 0) {
    const matches = keywords.filter((kw) =>
      course.career_pathways.some((cp) => cp.toLowerCase().includes(kw.toLowerCase()))
    );
    if (matches.length > 0) {
      score += Math.min(30, matches.length * 12);
      reasons.push(`Career paths include: ${course.career_pathways.slice(0, 2).join(', ')}`);
    }
  }

  return { score: Math.min(100, score), reasons };
}

// ── Ranking score (0–100) ────────────────────────────────────
function scoreRanking(
  university: University,
  input: AlgorithmInput
): { score: number; reasons: string[] } {
  if (input.rankingImportance === 'low') {
    return { score: 50, reasons: [] };
  }
  const base = qsRankToScore(university.qs_rank_2026);
  const reasons = base >= 75
    ? [`QS Ranked #${university.qs_rank_2026} globally`]
    : base >= 45
    ? [`QS Ranked #${university.qs_rank_2026}`]
    : [];
  return { score: base, reasons };
}

// ── Scholarship eligibility check ────────────────────────────
function getRelevantScholarships(
  universityId: number,
  scholarships: Scholarship[],
  input: AlgorithmInput
): Scholarship[] {
  return scholarships.filter((s) => {
    if (s.university_id !== universityId) return false;
    if (s.min_ielts && input.ieltsScore < s.min_ielts) return false;
    if (s.min_gpa && input.gpaScore && input.gpaScore < s.min_gpa) return false;
    const levelOk =
      s.course_level === 'All' || s.course_level === input.preferredLevel;
    return levelOk;
  });
}

// ── Main scoring function ─────────────────────────────────────
function scoreCourseUniversityPair(
  course: Course,
  university: University,
  scholarships: Scholarship[],
  input: AlgorithmInput
): { scores: ScoreBreakdown; reasons: string[]; warnings: string[] } {
  const academic = scoreAcademic(course, input);
  const courseMatch = scoreCourseMatch(course, input);
  const budget = scoreBudget(course, input);
  const location = scoreLocation(university, input);
  const career = scoreCareer(course, university, input);
  const ranking = scoreRanking(university, input);

  // Weighted total (25/25/20/15/10/5)
  const total =
    academic.score * 0.25 +
    courseMatch.score * 0.25 +
    budget.score * 0.20 +
    location.score * 0.15 +
    career.score * 0.10 +
    ranking.score * 0.05;

  // Scholarship bonus (up to +5 pts if student needs one)
  const relevantScholarships = getRelevantScholarships(university.id, scholarships, input);
  const scholarshipBonus =
    input.needsScholarship && relevantScholarships.length > 0
      ? Math.min(5, relevantScholarships.length * 2)
      : 0;

  const allReasons = [
    ...academic.reasons,
    ...courseMatch.reasons,
    ...budget.reasons,
    ...location.reasons,
    ...career.reasons,
    ...ranking.reasons,
  ].filter(Boolean).slice(0, 5); // Top 5 reasons

  const allWarnings = [
    ...academic.warnings,
    ...budget.warnings,
  ].filter(Boolean);

  if (relevantScholarships.length > 0 && input.needsScholarship) {
    allReasons.push(`${relevantScholarships.length} scholarship(s) available`);
  }

  return {
    scores: {
      academic: Math.round(academic.score * 10) / 10,
      courseMatch: Math.round(courseMatch.score * 10) / 10,
      budget: Math.round(budget.score * 10) / 10,
      location: Math.round(location.score * 10) / 10,
      career: Math.round(career.score * 10) / 10,
      ranking: Math.round(ranking.score * 10) / 10,
      total: Math.round((total + scholarshipBonus) * 10) / 10,
    },
    reasons: allReasons,
    warnings: allWarnings,
  };
}

// ── Main entry point ──────────────────────────────────────────
export function generateRecommendations(
  courses: Course[],
  universities: University[],
  scholarships: Scholarship[],
  input: AlgorithmInput,
  isPremium: boolean
): RecommendationResult[] {
  const universityMap = new Map<number, University>(
    universities.map((u) => [u.id, u])
  );

  // Score every course-university pair
  const scored: Array<{
    course: Course;
    university: University;
    scores: ScoreBreakdown;
    reasons: string[];
    warnings: string[];
    scholarshipCount: number;
    relevantScholarships: Scholarship[];
  }> = [];

  for (const course of courses) {
    // Skip if level doesn't match at all
    if (course.course_level !== input.preferredLevel) continue;

    const university = universityMap.get(course.university_id);
    if (!university) continue;

    // Hard cutoff: if IELTS is more than 1.0 below requirement, exclude
    const requiredIelts = course.entry_score_ielts ?? 6.0;
    if (input.ieltsScore < requiredIelts - 1.0) continue;

    const relevantScholarships = getRelevantScholarships(
      university.id,
      scholarships,
      input
    );

    const { scores, reasons, warnings } = scoreCourseUniversityPair(
      course,
      university,
      scholarships,
      input
    );

    scored.push({
      course,
      university,
      scores,
      reasons,
      warnings,
      scholarshipCount: relevantScholarships.length,
      relevantScholarships,
    });
  }

  // Sort by total score descending
  scored.sort((a, b) => b.scores.total - a.scores.total);

  // Deduplicate: only one result per university (best-matching course)
  const seenUniversities = new Set<number>();
  const deduplicated = scored.filter((r) => {
    if (seenUniversities.has(r.university.id)) return false;
    seenUniversities.add(r.university.id);
    return true;
  });

  // Take top MAX_RESULTS
  const top = deduplicated.slice(0, MAX_RESULTS);

  return top.map((r, idx) => ({
    university: r.university,
    course: r.course,
    rank_position: idx + 1,
    scores: r.scores,
    match_reasons: r.reasons,
    warnings: r.warnings,
    is_locked: !isPremium && idx >= FREE_TIER_VISIBLE,
    scholarship_count: r.scholarshipCount,
    relevant_scholarships: r.relevantScholarships,
  }));
}

// ── Build AlgorithmInput from quiz responses ──────────────────
export function buildAlgorithmInput(
  responses: Record<string, string | string[] | number>
): AlgorithmInput {
  const get = <T>(key: string, fallback: T): T =>
    (responses[key] as T) ?? fallback;

  return {
    preferredField: (get('field_of_study', 'IT') as any),
    preferredLevel: (get('study_level', 'Undergraduate') as any),
    ieltsScore: Number(get('ielts_score', 6.5)),
    annualBudgetAud: Number(get('annual_budget', 50000)),
    preferredStates: (() => {
      const v = get('preferred_state', []);
      return Array.isArray(v) ? v : [v];
    })(),
    careerGoals: (() => {
      const v = get('career_goals', []);
      return Array.isArray(v) ? v : [v];
    })(),
    gmatScore: get('gmat_score', undefined)
      ? Number(get('gmat_score', 0))
      : undefined,
    gpaScore: get('gpa_score', undefined)
      ? Number(get('gpa_score', 0))
      : undefined,
    countryOfOrigin: get('country_of_origin', undefined) as string | undefined,
    needsScholarship: get('needs_scholarship', 'no') === 'yes',
    preferredDurationYears: get('preferred_duration', undefined)
      ? Number(get('preferred_duration', 0))
      : undefined,
    rankingImportance: (get('ranking_importance', 'medium') as any),
    researchOrCoursework: (get('research_or_coursework', 'coursework') as any),
    salaryImportance: (get('salary_importance', 'medium') as any),
    workExperienceYears: Number(get('work_experience_years', 0)),
    preferredSpecializations: (() => {
      const v = get('preferred_specializations', []);
      return Array.isArray(v) ? v : v ? [v] : [];
    })(),
    currentQualification: (get('current_qualification', 'High School') as any),
  };
}

// ── Utilities ────────────────────────────────────────────────
function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export { ALGORITHM_VERSION, FREE_TIER_VISIBLE, MAX_RESULTS };
