// Tests for src/lib/logic.ts. Run with: npm test
// Transpiles the pure-logic modules with TypeScript, then checks them with node:assert.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const out = mkdtempSync(join(tmpdir(), "closer-test-"));
for (const name of ["content", "logic"]) {
  const src = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: false },
  }).outputText.replace(/from "\.\/(\w+)"/g, 'from "./$1.mjs"');
  writeFileSync(join(out, `${name}.mjs`), js);
}
const L = await import(pathToFileURL(join(out, "logic.mjs")).href);
const { QUESTIONS } = await import(pathToFileURL(join(out, "content.mjs")).href);

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`  ✓ ${name}`); };

test("dayKey formats local dates", () => {
  assert.equal(L.dayKey(new Date(2026, 0, 5)), "2026-01-05");
});

test("weekKey follows ISO weeks, including year boundaries", () => {
  assert.equal(L.weekKey(new Date(2026, 10, 15)), "2026-W46");
  assert.equal(L.weekKey(new Date(2026, 0, 1)), "2026-W01");
  assert.equal(L.weekKey(new Date(2027, 0, 1)), "2026-W53");
});

test("both partners get the same question, and it varies by day", () => {
  const a = L.questionFor("couple-1", "2026-11-15");
  assert.deepEqual(a, L.questionFor("couple-1", "2026-11-15"));
  const distinct = new Set(Array.from({ length: 30 }, (_, i) => L.questionFor("couple-1", `2026-11-${String(i + 1).padStart(2, "0")}`).id));
  assert.ok(distinct.size > 10);
});

test("question ids are unique", () => {
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
});

test("weeklyScores averages both partners into 0-100", () => {
  const s = L.weeklyScores([
    { user_id: "a", week: "2026-W46", closeness: 8, communication: 6, intimacy: 7 },
    { user_id: "b", week: "2026-W46", closeness: 6, communication: 8, intimacy: 9 },
    { user_id: "a", week: "2026-W45", closeness: 5, communication: 5, intimacy: 5 },
  ]);
  assert.equal(s.length, 2);
  assert.equal(s[0].week, "2026-W45");
  assert.equal(s[0].score, 50);
  assert.equal(s[1].score, 73);
  assert.equal(s[1].responses, 2);
  assert.equal(L.weakestDimension(s), "closeness");
});

test("streak counts consecutive shared days and tolerates an unanswered today", () => {
  const today = new Date(2026, 10, 15);
  const answers = [];
  for (const d of [1, 2, 3, 5]) {
    const day = L.dayKey(L.daysAgo(d, today));
    answers.push({ user_id: "a", day, question_id: "x", body: "." }, { user_id: "b", day, question_id: "x", body: "." });
  }
  answers.push({ user_id: "a", day: L.dayKey(today), question_id: "x", body: "." }); // only one partner today
  const days = L.sharedDays(answers, "a", "b");
  assert.equal(days.size, 4);
  assert.equal(L.streak(days, today), 3);
  assert.equal(L.sharedDays(answers, "a", null).size, 0);
});

test("weakestDimension defaults to communication with no data", () => {
  assert.equal(L.weakestDimension([]), "communication");
});

console.log(`\n${passed} tests passed`);
