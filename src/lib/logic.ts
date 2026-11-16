// Pure logic shared by the screens: dates, question choice, scoring, streaks.
// Kept free of React and Supabase so it can be tested on its own.

import { EXERCISES, QUESTIONS, type Dimension, type Exercise, type Question } from "./content";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO-8601 week as YYYY-Www. */
export function weekKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}

export function daysAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

/** FNV-1a hash: stable across devices so both partners get the same question. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function questionFor(coupleId: string, day: string): Question {
  return QUESTIONS[hash(`${coupleId}|${day}`) % QUESTIONS.length];
}

export function questionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export interface Checkin {
  user_id: string;
  week: string;
  closeness: number;
  communication: number;
  intimacy: number;
}

export interface Answer {
  user_id: string;
  day: string;
  question_id: string;
  body: string;
}

export interface WeekScore {
  week: string;
  score: number; // 0-100
  dims: Record<Dimension, number>; // 1-10 averages
  responses: number; // how many partners checked in
}

/** Average both partners' check-ins per week into a 0-100 connection score. */
export function weeklyScores(checkins: Checkin[]): WeekScore[] {
  const byWeek = new Map<string, Checkin[]>();
  for (const c of checkins) {
    const list = byWeek.get(c.week) ?? [];
    list.push(c);
    byWeek.set(c.week, list);
  }
  return [...byWeek.keys()].sort().map((week) => {
    const rows = byWeek.get(week)!;
    const avg = (k: Dimension) => rows.reduce((sum, r) => sum + r[k], 0) / rows.length;
    const dims = { closeness: avg("closeness"), communication: avg("communication"), intimacy: avg("intimacy") };
    const score = Math.round(((dims.closeness + dims.communication + dims.intimacy) / 3) * 10);
    return { week, score, dims, responses: rows.length };
  });
}

/** Days on which both partners answered. */
export function sharedDays(answers: Answer[], me: string, partner: string | null): Set<string> {
  if (!partner) return new Set();
  const byDay = new Map<string, Set<string>>();
  for (const a of answers) {
    const s = byDay.get(a.day) ?? new Set<string>();
    s.add(a.user_id);
    byDay.set(a.day, s);
  }
  return new Set([...byDay].filter(([, s]) => s.has(me) && s.has(partner)).map(([d]) => d));
}

/** Consecutive days (ending today, or yesterday if today isn't done yet) both answered. */
export function streak(days: Set<string>, today: Date = new Date()): number {
  let i = days.has(dayKey(today)) ? 0 : 1;
  let n = 0;
  while (days.has(dayKey(daysAgo(i, today)))) {
    n++;
    i++;
  }
  return n;
}

/** The dimension with the lowest score in the latest week. */
export function weakestDimension(scores: WeekScore[]): Dimension {
  if (!scores.length) return "communication";
  const d = scores[scores.length - 1].dims;
  return (Object.keys(d) as Dimension[]).sort((a, b) => d[a] - d[b])[0];
}

export function weeklyExercise(coupleId: string, dim: Dimension, week: string = weekKey()): Exercise {
  const list = EXERCISES[dim];
  return list[hash(`${week}|${coupleId}`) % list.length];
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Thriving";
  if (score >= 65) return "Growing strong";
  if (score >= 50) return "Building";
  return "Needs care";
}
