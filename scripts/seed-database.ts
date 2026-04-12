/**
 * AustraliaPath — Database seeding script
 * Reads the three CSV files and upserts all rows into Supabase
 * using the service-role key (bypasses RLS).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx ts-node --project tsconfig.scripts.json scripts/seed-database.ts
 *
 * Or after configuring .env:
 *   npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ── Parse CSV helper ─────────────────────────────────────────
function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim() !== '');
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim();
    });
    return row;
  });
}

// ── Parse pipe-delimited arrays ───────────────────────────────
function parseArray(value: string): string[] {
  if (!value || value === 'N/A') return [];
  return value.split('|').map((s) => s.trim()).filter(Boolean);
}

// ── Parse nullable number ────────────────────────────────────
function parseNum(value: string): number | null {
  if (!value || value === 'N/A') return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

function parseInt2(value: string): number | null {
  if (!value || value === 'N/A') return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

// ── Derive course category from name/code ────────────────────
function deriveCategory(courseName: string, courseCode: string): string {
  const name = courseName.toLowerCase();
  if (name.includes('engineer')) return 'Engineering';
  if (name.includes('computer science') || name.includes('cs')) return 'IT';
  if (name.includes('information technology') || name.includes(' it')) return 'IT';
  if (name.includes('data science')) return 'IT';
  if (name.includes('business analytics')) return 'Business';
  if (name.includes('business') || name.includes('commerce') || name.includes('mba') || name.includes('finance')) return 'Business';
  if (name.includes('medicine') || name.includes('medical')) return 'Medicine';
  if (name.includes('nursing')) return 'Health';
  if (name.includes('health')) return 'Health';
  if (name.includes('agriculture')) return 'Agriculture';
  if (name.includes('law')) return 'Law';
  if (name.includes('design')) return 'Design';
  if (name.includes('science') || name.includes('research')) return 'Science';
  if (name.includes('education') || name.includes('teaching')) return 'Education';
  if (name.includes('theology') || name.includes('ministry') || name.includes('religion') || name.includes('philosophy')) return 'Humanities';
  if (name.includes('public policy')) return 'Policy';
  return 'Other';
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      '❌ Missing environment variables:\n' +
      '   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n' +
      '   (Service role key bypasses RLS — never expose it client-side)'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const ROOT = path.resolve(__dirname, '..');

  // ── 1. Seed universities ────────────────────────────────────
  console.log('📚 Seeding universities…');
 const uniRows = parseCSV(path.join(ROOT, 'data', 'universities_master_data.csv'));

  const universities = uniRows
    .filter((r) => r.university_id && !isNaN(Number(r.university_id)))
    .map((r) => ({
      id: parseInt(r.university_id, 10),
      name: r.university_name,
      state: r.state,
      city: r.city,
      qs_rank_2026: r.qs_rank_2026 || null,
      afr_rank_2024: r.afr_rank_2024 || null,
      international_students_count: parseInt2(r.international_students_count),
      avg_intl_fees_aud: parseInt2(r.avg_intl_fees_aud),
      avg_intl_fees_range_low: parseInt2(r.avg_intl_fees_range_low),
      avg_intl_fees_range_high: parseInt2(r.avg_intl_fees_range_high),
      undergrad_entry_atar_equiv: parseInt2(r.undergrad_entry_atar_equiv),
      postgrad_entry_requirement: r.postgrad_entry_requirement || null,
      scholarship_availability_pct: parseInt2(r.scholarship_availability_pct),
      grad_employment_rate_pct: parseInt2(r.grad_employment_rate_pct),
      grad_employment_salary_median_aud: parseInt2(r.grad_employment_salary_median_aud),
      top_strengths: parseArray(r.top_strengths),
      established_year: parseInt2(r.established_year),
      website: r.website || null,
      logo_url: null,
    }));

  const { error: uniError } = await supabase
    .from('universities')
    .upsert(universities, { onConflict: 'id' });

  if (uniError) {
    console.error('❌ Universities seed failed:', uniError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${universities.length} universities seeded`);

  // ── 2. Seed courses ────────────────────────────────────────
  console.log('📖 Seeding courses…');
const courseRows = parseCSV(path.join(ROOT, 'data', 'courses_detailed_data.csv'));

  const courses = courseRows
    .filter((r) => r.course_id && !isNaN(Number(r.course_id)))
    .map((r) => ({
      id: parseInt(r.course_id, 10),
      university_id: parseInt(r.university_id, 10),
      university_name: r.university_name,
      course_code: r.course_code,
      course_name: r.course_name,
      course_level: r.course_level as 'Undergraduate' | 'Postgraduate',
      course_category: deriveCategory(r.course_name, r.course_code),
      duration_years: parseNum(r.duration_years),
      intl_fee_per_year_aud: parseInt2(r.intl_fee_per_year_aud),
      entry_requirement: r.entry_requirement || null,
      entry_score_ielts: parseNum(r.entry_score_ielts),
      entry_score_gmat: parseInt2(r.entry_score_gmat),
      undergrad_prerequisites: r.undergrad_prerequisites || null,
      grad_employment_rate_pct: parseInt2(r.grad_employment_rate_pct),
      grad_salary_median_aud: parseInt2(r.grad_salary_median_aud),
      career_pathways: parseArray(r.career_pathways),
      anzsco_code: r.anzsco_code || null,
      course_url_path: r.course_url_path || null,
      specializations: parseArray(r.specializations),
    }));

  const { error: courseError } = await supabase
    .from('courses')
    .upsert(courses, { onConflict: 'id' });

  if (courseError) {
    console.error('❌ Courses seed failed:', courseError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${courses.length} courses seeded`);

  // ── 3. Seed scholarships ──────────────────────────────────
  console.log('🏆 Seeding scholarships…');
const schRows = parseCSV(path.join(ROOT, 'data', 'scholarships_data.csv'));

  const scholarships = schRows
    .filter((r) => r.scholarship_id && !isNaN(Number(r.scholarship_id)))
    .map((r) => ({
      id: parseInt(r.scholarship_id, 10),
      university_id: parseInt(r.university_id, 10),
      university_name: r.university_name,
      scholarship_name: r.scholarship_name,
      scholarship_type: r.scholarship_type,
      award_amount_aud: parseInt2(r.award_amount_aud),
      award_type: r.award_type,
      course_level: r.course_level,
      eligible_course_types: parseArray(r.eligible_course_types),
      eligibility_criteria: r.eligibility_criteria || null,
      min_gpa: parseNum(r.min_gpa),
      min_ielts: parseNum(r.min_ielts),
      key_requirements: r.key_requirements || null,
      application_deadline: r.application_deadline || null,
      contact_url: r.contact_url || null,
      open_intake: r.open_intake || null,
      notes: r.notes || null,
    }));

  const { error: schError } = await supabase
    .from('scholarships')
    .upsert(scholarships, { onConflict: 'id' });

  if (schError) {
    console.error('❌ Scholarships seed failed:', schError.message);
    process.exit(1);
  }
  console.log(`  ✅ ${scholarships.length} scholarships seeded`);

  // ── Summary ───────────────────────────────────────────────
  console.log('\n🎉 Database seeding complete!');
  console.log(`   Universities : ${universities.length}`);
  console.log(`   Courses      : ${courses.length}`);
  console.log(`   Scholarships : ${scholarships.length}`);
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
