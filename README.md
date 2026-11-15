# Closer

Build your connection the way training builds fitness: one honest question a day.

Closer is a couples app. Partners answer one deep question each day privately (each answer unlocks when both have shared), check in weekly on closeness, communication and intimacy, track a connection score over time, and get exercises aimed at their weakest area, with AI-written reflections and personalized exercises.

## Status

**Prototype (v0.1).** A single-page app in `index.html` that runs as a Claude artifact. It uses the artifact runtime (`claude.use("db")`, `claude.use("user")`, `claude.use("sample")`) for storage, identity and AI. Opened outside that runtime, it falls back to a demo mode with a simulated partner.

## Features in the prototype

- Couple linking with an 8-character invite code
- Daily question (32 questions across Heart, Desire, Dreams, Gratitude, Repair, Soul), same for both partners each day
- Answer reveal: your partner's answer unlocks after you share yours
- Streak of days both partners answered
- Weekly check-in (closeness, communication, intimacy, 1-10)
- Connection score (0-100), per-area bars, weekly trend chart
- Adaptive exercise for the weakest area, plus AI-generated personal exercises
- AI coach reflection on both partners' daily answers

## Running it

Open `index.html` in a browser to explore demo mode. For real use, it runs as a published Claude artifact with `db`, `user` and `sample` capabilities declared.

## Roadmap to a full app

1. **Own backend:** replace the artifact runtime with a real stack (for example React Native / Expo, plus Supabase or Firebase for auth and storage).
2. **Privacy:** per-couple access control and end-to-end encryption of answers.
3. **Accounts and auth:** email or phone sign-in, partner invites by link.
4. **AI service:** server-side calls to an LLM API for reflections and exercises, with safety rules.
5. **Notifications:** daily question reminders, partner-answered alerts.
6. **Content:** larger question and exercise library, guided multi-week programs.
7. **Payments:** subscription per couple.
8. **Analytics:** measure which exercises actually raise connection scores.
9. **App store release:** iOS and Android.
