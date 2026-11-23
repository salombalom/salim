# Darsi (دَرْسي)

Free educational mobile app for Omani school students, grades 1–12, all subjects. No ads, no paywalls.
UI is Arabic and RTL throughout, except English-subject content, which renders LTR.

## Stack
- Expo SDK 58 (React Native 0.88, React 19), TypeScript strict, Expo Router (file-based routes in `app/`).
- State: zustand + AsyncStorage (`lib/store.ts`). Settings and progress persist locally first (offline-first).
- Backend: Supabase (`lib/supabase.ts`, configured from `.env`; when unconfigured the app runs in guest mode only).
  - Auth (`lib/auth.ts`): email/phone OTP with a 6-digit code, plus guest mode. `app/(onboarding)/verify.tsx` handles code entry.
  - Sync (`lib/sync.ts`): quiz attempts are queued and sent through the `record_attempt` RPC, which computes points and streak **server-side**. Study time goes through `add_study_time`. Guest progress is imported once via `import_guest_progress`. `pullFromServer` mirrors the server state locally.
  - Content (`lib/data/contentStore.ts`): downloads a grade's curriculum and reviewed questions and caches them. `repository.ts` overlays this on the bundled seed.
- Design: calm, luxurious and Omani in feel. Deep navy with ivory, and gold used **only for details** (thin lines, icons, numbers, the primary button). Dark mode is the default. No gradients, no emoji, no sparkle effects.
  - **All tokens live in `theme/tokens.ts`** (colours, subject jewel colours, fonts, type scale, spacing, radii, motion). Never hard-code a colour in a screen; use `useAppTheme()` from `lib/theme.ts`.
  - Fonts: El Messiri for headings and numbers; IBM Plex Sans Arabic for body text.
  - Icons: Lucide, imported per icon in `components/icons.tsx` (stroke 1.5, gold). To add one, import it there.
  - The geometric pattern (`components/GeometricPattern.tsx`, 5% opacity) appears only on the welcome screen and at the top of home.
  - Contrast: use the `*Text` colour variants for small text. `__tests__/contrast.test.ts` enforces WCAG AA.
- Tests: Jest (`jest-expo` preset), in `__tests__/`.
- Planned: Edge Functions, YouTube Data API v3, Claude API (from Edge Functions only), plus a Next.js admin in `admin/`.

## Commands
```bash
npm install
npx expo start            # dev server; scan the QR code with Expo Go
npx expo start --tunnel   # when the phone isn't on the same Wi-Fi
npm test                  # jest
npm run typecheck         # tsc --noEmit
npm run lint              # eslint
EXPO_OFFLINE=1 npx expo export --platform web   # verify the bundle builds
node tools/generate-sounds.js                    # regenerate quiz sound effects
npm run db:test       # spin up a temporary local Postgres, apply migrations + seed.sql, run supabase/tests/rls.test.sql
npm run db:seed-sql   # regenerate supabase/seed.sql from seed/ (never edit seed.sql by hand)
npm run db:login && npm run db:link -- <ref> && npm run db:push   # deploy to a hosted project
```
`npx expo install <pkg>` needs network access to api.expo.dev. If that host is blocked, use `EXPO_OFFLINE=1 npx expo install <pkg>`.

## Layout
- `app/` – routes. `(onboarding)/` covers welcome, login, role and grade. `(tabs)/` covers home, mistakes, favorites and profile. Also `subject/[id]`, `lesson/[id]`, `quiz` (params `lessonId`, or `mode=mistakes` with optional `subjectId` / `ids`), `result`, `review`, `grade-picker`, `parent`, `about`, `privacy`.
- `config/curriculum.ts` – the **single source** for grades, subjects, colours, icons and text direction. `config/privacy.ts` holds the policy text (AR/EN).
- `lib/quiz/` – `grading.ts` (answer checking), `normalize.ts` (Arabic normalisation), `mathGenerator.ts` (seeded per-grade math questions), `prepare.ts` (shuffle options and words).
- `lib/gamification.ts` – points (easy 10 / medium 15 / hard 20, +20 for a perfect score), stars (90/70/50%), and a daily streak in Asia/Muscat time.
- `lib/data/repository.ts` – content access layer. Today it reads `seed/`; Phase 2 swaps it to Supabase behind the same functions.
- `lib/bidi.ts` – wraps math expressions in Arabic text with LRI/PDI, so `36 ÷ 4` isn't shown reversed. `AppText` applies it automatically unless `ltr` is set.
- `seed/content/gradeNN.ts` – original practice content written with the `mcq/tf/fill/order/lesson/unit` helpers. IDs are derived as `g5-math-u1-l2-q3`.
- `components/ui.tsx` – design primitives (AppText, Num, Card with `accent`, Button primary/secondary/ghost, Icon, IconCircle, ProgressBar 4px, Mastery, Segmented, Toast, FadeIn…). Always use `AppText`, never a raw `Text`.
- `supabase/migrations/` – `…01_schema.sql` (all tables; content uses text ids that match the seed), `…02_functions.sql` (is_admin, record_attempt, add_study_time, import_guest_progress, delete_my_account, plus the views my_lesson_best and my_open_mistakes), `…03_rls.sql` (policies and column grants).
  - `supabase/tests/` – the local Postgres harness, with a stub of Supabase's auth schema and roles.
  - `supabase/templates/magic_link.html` – Arabic OTP email.
- `legacy/runner-game/` – an older, unrelated Vite game kept for reference.

## Rules
- Seed questions are `reviewed: false`. Students only see reviewed questions. The settings toggle `showUnreviewed` (default `__DEV__`) is for development only. Generated math questions are `reviewed: true`.
- Never copy textbook text. Textbooks are links only (`license_status` = `link_only` | `permission_granted`).
- No ads, no analytics or ad SDKs, minimal personal data (Families / Kids-category compliance).
- Secrets live only in `.env` / Supabase secrets. The Claude and YouTube keys are never shipped in the app. Only the public anon/publishable key goes in the app.
- Clients never write points, streaks, attempts or answers directly. Those columns and tables are revoked; use the RPCs. Any schema change needs a new migration file plus an update to `rls.test.sql`.
- English-subject content: pass `ltr` to `AppText` / `QuestionView`.

## Phases
1. ✅ Structure, navigation, design, quizzes from local data (no login)
2. ✅ Supabase, auth (email/phone + guest), progress sync, points/streak server-side
3. Textbook links and YouTube videos (daily Edge Function, admin approval)
4. Claude-generated summaries (draft → approved) and PDF export
5. Parent dashboard
6. Admin (Next.js in `admin/`)
7. Privacy policy, icon/splash, store readiness
