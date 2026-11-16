// Closer AI coach (Supabase Edge Function, Deno).
//
// POST { kind: "reflection", day: "YYYY-MM-DD", question: string }
//   -> writes a short reflection on both partners' answers for that day.
// POST { kind: "exercise", focus: "closeness" | "communication" | "intimacy" }
//   -> returns { title, minutes, steps[] } tailored to the couple.
//
// The function acts as the signed-in user, so row-level security guarantees it
// can only read the caller's own couple. Secrets: ANTHROPIC_API_KEY (required),
// COACH_MODEL (optional).

import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("COACH_MODEL") ?? "claude-haiku-5-5";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function askClaude(prompt: string, maxTokens = 400): Promise<string> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("Coach is not configured.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Coach request failed (${res.status}).`);
  const data = await res.json();
  return (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Not signed in" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return json({ error: "Not signed in" }, 401);

  const { data: me } = await supabase.from("couple_members").select("couple_id").eq("user_id", uid).maybeSingle();
  if (!me) return json({ error: "You are not in a couple space." }, 400);
  const coupleId = me.couple_id as string;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }

  try {
    if (body.kind === "reflection") {
      const day = String(body.day ?? "");
      const question = String(body.question ?? "").slice(0, 300);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: "Invalid day" }, 400);

      const { data: existing } = await supabase.from("reflections").select("body").eq("couple_id", coupleId).eq("day", day).maybeSingle();
      if (existing) return json({ body: existing.body });

      // RLS only returns the partner's answer if the caller has answered too.
      const { data: answers } = await supabase.from("answers").select("user_id, body").eq("couple_id", coupleId).eq("day", day);
      if (!answers || answers.length < 2) return json({ error: "Both of you need to answer first." }, 400);
      const a = answers.find((x) => x.user_id === uid)!;
      const b = answers.find((x) => x.user_id !== uid)!;

      const text = await askClaude(
        `You are a warm, wise relationship coach inside a couples app called Closer. Two partners answered today's question privately and can now see each other's answers.
Question: "${question}"
Partner A answered: "${a.body}"
Partner B answered: "${b.body}"
Write a short reflection for both of them (max 90 words, plain text, no headings, no lists):
1) One or two sentences naming what their answers share or reveal about their connection, gently and specifically.
2) Then a line starting with "Tonight, ask each other:" followed by one deeper follow-up question.
Be tasteful and non-explicit. Never diagnose, judge, or take sides. Address them as "you two".`,
      );
      await supabase.from("reflections").insert({ couple_id: coupleId, day, body: text.slice(0, 2000) });
      return json({ body: text });
    }

    if (body.kind === "exercise") {
      const focus = ["closeness", "communication", "intimacy"].includes(String(body.focus)) ? String(body.focus) : "communication";
      const { data: checkins } = await supabase.from("checkins").select("week, closeness, communication, intimacy")
        .eq("couple_id", coupleId).order("week", { ascending: false }).limit(4);
      const { data: answers } = await supabase.from("answers").select("user_id, body")
        .eq("couple_id", coupleId).order("day", { ascending: false }).limit(6);
      const recent = (answers ?? []).map((x) => `- ${x.user_id === uid ? "Partner A" : "Partner B"}: ${x.body}`).join("\n");
      const scores = (checkins ?? []).map((c) => `${c.week}: closeness ${c.closeness}, communication ${c.communication}, intimacy ${c.intimacy}`).join("\n");

      const text = await askClaude(
        `You design short connection exercises for couples in an app called Closer.
Recent weekly scores (1-10):
${scores || "(none)"}
Focus area: ${focus}.
Recent answers to daily questions:
${recent || "(none)"}
Create ONE fresh exercise for tonight that fits these two people. Tasteful and non-explicit; intimacy exercises may involve touch, presence and honest talk about desire.
Reply with JSON only: {"title": "short title", "minutes": number, "steps": ["step 1", "step 2", "step 3"]} with 3 to 4 short steps.`,
      );
      const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      return json({
        title: String(parsed.title),
        minutes: Number(parsed.minutes) || 15,
        steps: (parsed.steps ?? []).slice(0, 5).map(String),
      });
    }

    return json({ error: "Unknown request" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Coach error" }, 500);
  }
});
