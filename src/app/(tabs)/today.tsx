// Today: the daily question, the answer reveal, the coach and the streak.

import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Body, Button, Card, ErrorText, Eyebrow, Field, H2, Header, Screen, colors, serif } from "../../components/ui";
import { CATEGORY_LABELS } from "../../lib/content";
import { useCouple } from "../../lib/couple";
import { dayKey, daysAgo, questionFor, sharedDays, streak } from "../../lib/logic";

function AnswerBubble({ who, text, mine }: { who: string; text: string; mine?: boolean }) {
  return (
    <View style={{ backgroundColor: mine ? colors.lilac : colors.roseSoft, borderRadius: 14, padding: 12, marginTop: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.plum, marginBottom: 3 }}>{who}</Text>
      <Body>{text}</Body>
    </View>
  );
}

function Note({ children }: { children: string }) {
  return (
    <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: "#F6C9D9", borderRadius: 14, padding: 12, marginTop: 10 }}>
      <Text style={{ color: colors.heroMuted, fontSize: 14 }}>{children}</Text>
    </View>
  );
}

export default function Today() {
  const c = useCouple();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"answer" | "reflect" | null>(null);
  const [error, setError] = useState("");

  const today = dayKey();
  const me = c.me!;
  const partner = c.partner;
  const question = questionFor(c.coupleId!, today);
  const mine = c.answers.find((a) => a.day === today && a.user_id === me);
  const theirs = partner ? c.answers.find((a) => a.day === today && a.user_id === partner.user_id) : undefined;
  const reflection = c.reflections.find((r) => r.day === today);
  const days = useMemo(() => sharedDays(c.answers, me, partner?.user_id ?? null), [c.answers, me, partner]);
  const st = streak(days);

  async function share() {
    if (!draft.trim()) return;
    setBusy("answer"); setError("");
    try { await c.saveAnswer(question.id, draft.trim()); setDraft(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save your answer."); }
    finally { setBusy(null); }
  }

  async function reflect() {
    setBusy("reflect"); setError("");
    try { await c.requestReflection(today, question.text); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't create a reflection."); }
    finally { setBusy(null); }
  }

  const partnerName = partner?.display_name ?? "Your partner";

  return (
    <Screen>
      <Header partnerName={partner?.display_name} />
      <Card hero>
        <Eyebrow light>Today's question · {CATEGORY_LABELS[question.category]}</Eyebrow>
        <Text style={{ fontFamily: serif, fontSize: 21, lineHeight: 28, color: "#fff" }}>{question.text}</Text>
        <View style={{ marginTop: 12 }}>
          {!mine ? (
            <>
              <Field multiline value={draft} onChangeText={setDraft} maxLength={4000}
                placeholder={`Take your time. Be honest. Only ${partnerName} will see this.`} />
              <Button title="Share my answer" variant="light" onPress={share} busy={busy === "answer"} disabled={!draft.trim()} style={{ marginTop: 10 }} />
              <Note>{`${partnerName}'s answer unlocks when you share yours.`}</Note>
            </>
          ) : (
            <>
              <AnswerBubble who="You" text={mine.body} mine />
              {theirs ? <AnswerBubble who={partnerName} text={theirs.body} />
                : <Note>{`Waiting for ${partnerName}. Their answer appears here when they share it.`}</Note>}
            </>
          )}
        </View>
      </Card>

      {mine && theirs ? (
        <Card>
          <Eyebrow>Coach reflection</Eyebrow>
          {reflection ? <Body>{reflection.body}</Body> : (
            <>
              <Body muted small style={{ marginBottom: 10 }}>
                Get a short reflection on your answers and one question to explore together tonight.
              </Body>
              <Button title="Reflect on our answers" variant="ghost" onPress={reflect} busy={busy === "reflect"} />
            </>
          )}
        </Card>
      ) : null}
      <ErrorText>{error}</ErrorText>

      <Card>
        <Eyebrow>Streak</Eyebrow>
        <H2>{st} day{st === 1 ? "" : "s"}</H2>
        <Body muted small>Days you both answered</Body>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = daysAgo(6 - i);
            const on = days.has(dayKey(d));
            return (
              <View key={i} style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center",
                backgroundColor: on ? colors.plum : colors.track }}>
                <Text style={{ fontSize: 10, color: on ? "#fff" : colors.muted }}>{"MTWTFSS"[(d.getDay() + 6) % 7]}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}
