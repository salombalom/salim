# Darsi (دَرْسي)

Free educational mobile app for Omani school students, grades 1–12, all subjects. No ads, no paywalls.
UI is Arabic and RTL throughout, except English-subject content, which renders LTR.

## Stack
- Expo SDK 58 (React Native 0.88, React 19), TypeScript strict, Expo Router (file-based routes in `app/`).
- State: zustand + AsyncStorage (`lib/store.ts`). Settings and progress persist locally.
- Font: IBM Plex Sans Arabic (`@expo-google-fonts/ibm-plex-sans-arabic`, per-weight imports).
- Tests: Jest (`jest-expo` preset), in `__tests__/`.
- Planned: Supabase (auth/DB/Edge Functions), YouTube Data API v3, Claude API (from Edge Functions only), plus a Next.js admin in `admin/`.

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
- `components/ui.tsx` – design primitives (AppText, Card, Button, Segmented…). Always use `AppText`, never a raw `Text`.
- `legacy/runner-game/` – an older, unrelated Vite game kept for reference.

## Rules
- Seed questions are `reviewed: false`. Students only see reviewed questions. The settings toggle `showUnreviewed` (default `__DEV__`) is for development only. Generated math questions are `reviewed: true`.
- Never copy textbook text. Textbooks are links only (`license_status` = `link_only` | `permission_granted`).
- No ads, no analytics or ad SDKs, minimal personal data (Families / Kids-category compliance).
- Secrets live only in `.env` / Supabase secrets. The Claude and YouTube keys are never shipped in the app.
- English-subject content: pass `ltr` to `AppText` / `QuestionView`.

## Phases
1. ✅ Structure, navigation, design, quizzes from local data (no login)
2. Supabase, auth (email/phone + guest), progress sync, points/streak server-side
3. Textbook links and YouTube videos (daily Edge Function, admin approval)
4. Claude-generated summaries (draft → approved) and PDF export
5. Parent dashboard
6. Admin (Next.js in `admin/`)
7. Privacy policy, icon/splash, store readiness
