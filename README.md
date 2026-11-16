# Closer

Build your connection the way training builds fitness: one honest question a day.

Closer is a couples app for iOS, Android and web. Partners answer one deep question each day privately, and each answer unlocks only once both have shared. They check in weekly on closeness, communication and intimacy, track a connection score over time, and get exercises aimed at their weakest area, plus AI-written reflections and personal exercises.

## Stack

- **App:** Expo SDK 58, React Native, Expo Router (`src/app`), TypeScript
- **Backend:** Supabase (Postgres with row-level security, email sign-in, realtime, edge functions)
- **AI coach:** Supabase Edge Function calling the Anthropic API (`supabase/functions/coach`)

## Project layout

```
src/app/              Screens (Expo Router)
  sign-in.tsx         Email code sign-in
  onboarding.tsx      Create or join a couple space
  invite.tsx          Share the invite code, wait for partner
  (tabs)/             Today, Check-in, Progress, Grow
src/lib/
  content.ts          Question and exercise library
  logic.ts            Dates, question choice, scoring, streaks (pure, tested)
  couple.tsx          Loads the couple's data and keeps it live
  session.tsx         Auth session
  supabase.ts         Supabase client
src/components/ui.tsx Shared UI in Closer's style
supabase/migrations/  Database schema and privacy rules
supabase/functions/   AI coach edge function
scripts/              Logic and database tests
prototype/            The original single-file prototype (v0.1)
```

## Privacy model

Enforced by the database, not by the app:

- Each person can belong to one couple; a couple has at most two people.
- Couples are created and joined only through `create_couple` / `join_couple`.
- Nobody outside a couple can read or write any of its data.
- Your partner's daily answer is readable **only after you have answered the same day**.
- Each person can only write their own answers and check-ins.

`npm run test:db` runs the migration in an in-process Postgres and checks every rule above.

## Setup

1. **Install:** `npm install`
2. **Create a Supabase project** at [supabase.com](https://supabase.com).
3. **Apply the schema:** with the [Supabase CLI](https://supabase.com/docs/guides/cli), `supabase link --project-ref <ref>` then `supabase db push`. Or paste `supabase/migrations/20261115000000_init.sql` into the SQL editor.
4. **Email sign-in with a code:** in Supabase, go to Authentication → Email Templates → Magic Link, and include `{{ .Token }}` in the template so the email shows the 6-digit code.
5. **AI coach:**
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy coach
   ```
   Optional: `supabase secrets set COACH_MODEL=<model id>` (defaults to `claude-haiku-5-5`).
6. **Environment:** copy `.env.example` to `.env` and fill in your project URL and anon key (Project Settings → API).
7. **Run:** `npx expo start`, then open in Expo Go, an iOS simulator, an Android emulator or the browser.

## Checks

```bash
npm run typecheck   # TypeScript
npm test            # scoring, streaks, dates, question choice
npm run test:db     # schema and privacy rules
```

## Roadmap

- [x] Prototype (v0.1)
- [x] Real app scaffold: auth, couples, daily question with server-side reveal, check-ins, score, exercises, AI coach (v0.2)
- [ ] Push notifications: daily reminder, "your partner answered"
- [ ] Partner time zones: agree on a shared day for couples in different zones
- [ ] Answer history: browse past questions and answers together
- [ ] End-to-end encryption of answers
- [ ] Larger content library and guided multi-week programs
- [ ] Subscriptions (per couple)
- [ ] Analytics: which exercises actually raise connection scores
- [ ] App Store and Google Play release via EAS
