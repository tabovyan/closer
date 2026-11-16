// Grow: an exercise for the weakest area, AI-personalized exercises, settings.

import { router } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Body, Button, Card, ErrorText, Eyebrow, Header, Screen, colors } from "../../components/ui";
import { DIMENSIONS, EXERCISES, type Exercise } from "../../lib/content";
import { useCouple } from "../../lib/couple";
import { supabase } from "../../lib/supabase";
import { weakestDimension, weeklyExercise, weeklyScores } from "../../lib/logic";

function ExerciseCard({ ex }: { ex: Exercise }) {
  return (
    <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, marginTop: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ backgroundColor: colors.lilac, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Body small style={{ color: colors.plum, fontWeight: "600", fontSize: 11 }}>{ex.minutes} min</Body>
        </View>
        <Body style={{ fontWeight: "600", flex: 1 }}>{ex.title}</Body>
      </View>
      {ex.steps.map((s, i) => <Body key={i} style={{ marginTop: 4 }}>{`${i + 1}. ${s}`}</Body>)}
    </View>
  );
}

export default function Grow() {
  const c = useCouple();
  const weeks = useMemo(() => weeklyScores(c.checkins), [c.checkins]);
  const focus = weakestDimension(weeks);
  const dim = DIMENSIONS.find((d) => d.key === focus)!;
  const pick = weeklyExercise(c.coupleId!, focus);
  const [personal, setPersonal] = useState<Exercise | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function makePersonal() {
    setBusy(true); setError("");
    try { setPersonal(await c.requestExercise(focus)); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't create an exercise."); }
    finally { setBusy(false); }
  }

  async function leave() {
    try { await c.leaveCouple(); router.replace("/"); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
  }

  return (
    <Screen>
      <Header partnerName={c.partner?.display_name} />
      <Card>
        <Eyebrow>This week's focus · {dim.name}</Eyebrow>
        <Body muted small>Chosen from your latest check-in: it's your lowest area right now.</Body>
        <ExerciseCard ex={pick} />
      </Card>
      <Card>
        <Eyebrow>Made for the two of you</Eyebrow>
        {personal ? <ExerciseCard ex={personal} /> : (
          <Body muted small>Generate a new exercise tailored to your scores and recent answers.</Body>
        )}
        <Button title={personal ? "Make another" : "Create a personal exercise"} variant="ghost" onPress={makePersonal}
          busy={busy} style={{ marginTop: 10 }} />
        <ErrorText>{error}</ErrorText>
      </Card>
      <Card>
        <Eyebrow>More for {dim.name.toLowerCase()}</Eyebrow>
        {EXERCISES[focus].filter((e) => e !== pick).map((e) => <ExerciseCard key={e.title} ex={e} />)}
      </Card>
      <Button title="Sign out" variant="ghost" onPress={() => supabase.auth.signOut()} />
      <Button title="Leave this couple space" variant="ghost" onPress={leave} style={{ marginTop: 8 }} />
    </Screen>
  );
}
