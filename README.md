# AustraliaPath

A freemium mobile app that helps international students find the right Australian university. Answer 20 questions, get 5 personalised university recommendations with detailed score breakdowns and scholarship matches.

**Platform:** Android (Google Play)  
**Tech stack:** Expo SDK 54 · Expo Router 6 · Supabase · RevenueCat · TypeScript

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Supabase Setup](#supabase-setup)
6. [RevenueCat Setup](#revenuecat-setup)
7. [Running Locally](#running-locally)
8. [Database Seeding](#database-seeding)
9. [Testing](#testing)
10. [EAS Build](#eas-build)
11. [Google Play Deployment](#google-play-deployment)
12. [CI/CD](#cicd)
13. [Recommendation Algorithm](#recommendation-algorithm)
14. [Freemium Model](#freemium-model)
15. [Secrets Reference](#secrets-reference)

---

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Supabase and RevenueCat keys

# 3. Run the database migration in Supabase SQL editor
# (paste supabase/migrations/001_initial_schema.sql)

# 4. Seed the database
SUPABASE_SERVICE_ROLE_KEY=<your-key> npm run seed

# 5. Start Expo
npm start
```

> **Never run `npm audit fix --force`** — it breaks peer dependencies.  
> Always use `npm install --legacy-peer-deps` for new packages.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Bundled with Node |
| Expo CLI | latest | `npm i -g expo-cli` |
| EAS CLI | 12+ | `npm i -g eas-cli` |
| Android Studio | latest | For local Android builds |

---

## Project Structure

```
australia-path/
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # Root layout (auth guard + RevenueCat init)
│   ├── index.tsx             # Root redirect (auth → tabs, guest → login)
│   ├── (auth)/               # Login & signup screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/               # Main tab navigator (requires auth)
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # Discover universities
│   │   ├── quiz.tsx          # Quiz entry point
│   │   ├── scholarships.tsx  # Scholarship browser
│   │   └── profile.tsx       # User profile
│   ├── quiz/
│   │   ├── _layout.tsx
│   │   └── [step].tsx        # Dynamic quiz step screen
│   ├── results/
│   │   └── index.tsx         # Recommendation results
│   └── university/
│       └── [id].tsx          # University detail
│
├── components/               # Shared UI components
│   ├── UniversityCard.tsx
│   ├── RecommendationCard.tsx
│   ├── QuizQuestion.tsx
│   ├── PaywallModal.tsx
│   └── ScholarshipList.tsx
│
├── lib/                      # Core logic
│   ├── supabase.ts           # Client + all DB query helpers
│   ├── recommendation.ts     # Scoring algorithm v1
│   └── revenuecat.ts         # Purchase helpers
│
├── store/                    # Zustand state
│   ├── authStore.ts
│   └── quizStore.ts
│
├── hooks/
│   ├── useAuth.ts
│   └── useSubscription.ts
│
├── types/index.ts            # All TypeScript types
├── constants/
│   ├── quiz-questions.ts     # 20 quiz questions
│   └── theme.ts              # Design system tokens
│
├── scripts/
│   └── seed-database.ts      # CSV → Supabase seeder
│
├── __tests__/
│   ├── recommendation.test.ts
│   ├── auth.test.ts
│   └── components.test.tsx
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── .github/workflows/
    ├── ci.yml                # Lint + test + typecheck
    └── eas-build.yml         # EAS build + Play Store submit
```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in:

```bash
# Supabase — Settings > API in your project dashboard
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# RevenueCat — Dashboard > Project > Apps > Android app > API keys
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your-android-key

EXPO_PUBLIC_APP_ENV=development
```

> `.env` is in `.gitignore`. Never commit it.  
> `eas.json` is also in `.gitignore` — store it locally, add secrets to GitHub Actions.

---

## Supabase Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project.

### 2. Run the migration

In **Supabase Dashboard → SQL Editor**, paste and run:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, triggers, and views.

### 3. Enable Email Auth

**Authentication → Providers → Email** — enable it.  
Optionally turn off "Confirm email" for faster local development.

### 4. Get your keys

**Settings → API:**
- `EXPO_PUBLIC_SUPABASE_URL` → Project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key (seed script only, never in app)

---

## RevenueCat Setup

### 1. Create a RevenueCat project

[app.revenuecat.com](https://app.revenuecat.com) → New Project → Add Android app.

### 2. Add products in Google Play Console

Create two subscriptions in **Google Play Console → Monetisation:**

| Product ID | Type | Price |
|------------|------|-------|
| `australiapath_premium_monthly` | Subscription | AUD 4.99/month |
| `australiapath_premium_annual` | Subscription | AUD 29.99/year |

### 3. Connect to RevenueCat

In RevenueCat dashboard:
- Add both product IDs under your Android app
- Create an **Entitlement** called `premium`
- Create a **Package** with both products
- Make it the **Default Offering**

### 4. Get your API key

Dashboard → Project → Apps → Android → API keys → Copy the **Public (Android)** key.

---

## Running Locally

```bash
# Start Metro bundler
npm start

# Run on Android emulator (requires Android Studio)
npm run android

# Run on physical device (scan QR code with Expo Go app)
npm start
```

---

## Database Seeding

The seed script reads the three CSV files in the project root and upserts all rows.

```bash
# Requires service role key (bypasses RLS)
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npm run seed
```

Expected output:
```
📚 Seeding universities…
  ✅ 30 universities seeded
📖 Seeding courses…
  ✅ 150 courses seeded
🏆 Seeding scholarships…
  ✅ 44 scholarships seeded

🎉 Database seeding complete!
```

---

## Testing

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test coverage

| File | Coverage |
|------|----------|
| `lib/recommendation.ts` | Algorithm scoring, deduplication, locking |
| `lib/supabase.ts` | Auth helpers, profile queries (mocked) |
| `components/UniversityCard.tsx` | Render, interactions |
| `components/QuizQuestion.tsx` | Single/multi-choice, limits |

---

## EAS Build

### First-time setup

```bash
# Login to Expo account
eas login

# Link project (updates app.json projectId)
eas project:init

# Configure credentials (follow prompts)
eas credentials
```

### Build commands

```bash
# Development APK (installs on device, hot reload)
npm run build:android   # eas build --platform android --profile development

# Preview APK (internal testing)
npm run build:android:preview

# Production AAB (for Play Store)
eas build --platform android --profile production
```

Build artifacts are available in your [Expo dashboard](https://expo.dev).

---

## Google Play Deployment

### Prerequisites

1. A [Google Play Console](https://play.google.com/console) developer account
2. An app created with package name `com.australiapath.app`
3. At least one APK/AAB uploaded manually (Play requires the first upload to be manual)

### Submit via EAS

```bash
# After a production build completes
npm run submit:android

# Or specify a build
eas submit --platform android --id <build-id>
```

### Required assets for Play Store listing

- App icon: 512×512 PNG
- Feature graphic: 1024×500 PNG
- At least 2 screenshots (phone)
- Short description (80 chars)
- Full description (4000 chars)
- Privacy Policy URL

---

## CI/CD

### GitHub Actions workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | Push / PR to main, develop | Type-check → Jest → Coverage |
| `eas-build.yml` | Push to main, version tags (`v*`), manual | Test → EAS build → Play submit (tags only) |

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo access token (`eas token:create`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `REVENUECAT_ANDROID_KEY` | RevenueCat Android API key |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full JSON content of service account key |
| `CODECOV_TOKEN` | (Optional) Codecov upload token |

### Setting up secrets

```bash
gh secret set EXPO_TOKEN --body "$(eas token:create --name github-actions)"
gh secret set SUPABASE_URL --body "https://your-project.supabase.co"
# etc.
```

---

## Recommendation Algorithm

The algorithm scores every (university, course) pair across 6 dimensions and returns the top 10 deduplicated results.

### Scoring formula

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Academic Match | 25% | IELTS vs requirement, GPA, GMAT |
| Course Match | 25% | Field, level, specializations |
| Budget Match | 20% | Tuition fees vs annual budget |
| Location Match | 15% | Preferred states |
| Career Match | 10% | Employment rate, salary, career pathways |
| Ranking Bonus | 5% | QS World Ranking 2026 |

**Scholarship bonus:** +1–5 pts if user needs scholarship and eligible ones exist.

**Hard exclusion:** courses where the student's IELTS is >1.0 below requirement are excluded.

### Algorithm v1 — key constants

```ts
FREE_TIER_VISIBLE = 3   // free users see top 3 results
MAX_RESULTS = 10        // algorithm returns max 10 deduplicated results
ALGORITHM_VERSION = 'v1'
```

### Running the algorithm locally

```ts
import { generateRecommendations, buildAlgorithmInput } from '@/lib/recommendation';

const input = buildAlgorithmInput(quizResponses);
const results = generateRecommendations(courses, universities, scholarships, input, isPremium);
```

---

## Freemium Model

| Feature | Free | Premium |
|---------|------|---------|
| Quiz | ✅ Full 20 questions | ✅ |
| Results | Top 3 matches | All 10 matches |
| Score breakdown | ✅ | ✅ |
| Scholarship details | ✅ per unlocked match | ✅ all matches |
| Quiz retakes | Unlimited | Unlimited |
| Save universities | ❌ | ✅ |
| Deadline alerts | ❌ | ✅ |

**Pricing:** AUD 4.99/month or AUD 29.99/year (~50% saving)

---

## Secrets Reference

| Variable | Where to find | Used in |
|----------|--------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | App (client) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | App (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Seed script only |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | RevenueCat → App → API keys | App (client) |
| `EXPO_TOKEN` | `eas token:create` | CI/CD |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play Console → Setup → API access | EAS Submit |

---

## Data Sources

| File | Rows | Description |
|------|------|-------------|
| `universities_master_data.csv` | 30 | University rankings, fees, employment stats |
| `courses_detailed_data.csv` | 150 | Course details, requirements, career pathways |
| `scholarships_data.csv` | 44 | Scholarship eligibility, amounts, deadlines |

---

*Built with [Expo](https://expo.dev) · [Supabase](https://supabase.com) · [RevenueCat](https://revenuecat.com)*
