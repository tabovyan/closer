// Weekly check-in: closeness, communication, intimacy on a 1-10 scale.

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Bar, Body, Button, Card, ErrorText, Eyebrow, H2, Header, Screen, colors, serif } from "../../components/ui";
import { DIMENSIONS, type Dimension } from "../../lib/content";
import { useCouple } from "../../lib/couple";
import { weekKey } from "../../lib/logic";

function Scale({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 8 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const on = n === value;
        return (
          <Pressable key={n} onPress={() => onChange(n)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={{ flex: 1, aspectRatio: 1, maxHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center",
              backgroundColor: on ? colors.plum : n < value ? colors.roseSoft : colors.track }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: on ? "#fff" : colors.muted }}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Checkin() {
  const c = useCouple();
  const week = weekKey();
  const mine = c.checkins.find((x) => x.week === week && x.user_id === c.me);
  const theirs = c.partner ? c.checkins.find((x) => x.week === week && x.user_id === c.partner!.user_id) : undefined;
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<Dimension, number>>({ closeness: 7, communication: 7, intimacy: 7 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mine) setValues({ closeness: mine.closeness, communication: mine.communication, intimacy: mine.intimacy });
  }, [mine?.closeness, mine?.communication, mine?.intimacy]);

  async function save() {
    setBusy(true); setError("");
    try { await c.saveCheckin(values); setEditing(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save your check-in."); }
    finally { setBusy(false); }
  }

  const partnerName = c.partner?.display_name ?? "your partner";

  return (
    <Screen>
      <Header partnerName={c.partner?.display_name} />
      {mine && !editing ? (
        <Card>
          <Eyebrow>This week's check-in</Eyebrow>
          <H2>Done ✓</H2>
          {DIMENSIONS.map((d) => <Bar key={d.key} label={d.name} value={mine[d.key]} />)}
          <Body muted small style={{ marginVertical: 8 }}>
            {theirs ? `${partnerName} has checked in too. See your score in Progress.` : `Waiting for ${partnerName} to check in.`}
          </Body>
          <Button title="Change my answers" variant="ghost" onPress={() => setEditing(true)} />
        </Card>
      ) : (
        <Card>
          <Eyebrow>Weekly check-in · {week}</Eyebrow>
          <H2>How are we doing?</H2>
          <Body muted small style={{ marginTop: 4 }}>Honest, 30 seconds. Your scores combine into your connection score.</Body>
          {DIMENSIONS.map((d) => (
            <View key={d.key} style={{ marginTop: 18 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Body style={{ fontWeight: "600" }}>{d.name}</Body>
                <Text style={{ fontFamily: serif, fontSize: 20, color: colors.plum }}>{values[d.key]}</Text>
              </View>
              <Body muted small>{d.prompt}</Body>
              <Scale label={d.name} value={values[d.key]} onChange={(n) => setValues((v) => ({ ...v, [d.key]: n }))} />
            </View>
          ))}
          <Button title="Save check-in" onPress={save} busy={busy} style={{ marginTop: 20 }} />
          <ErrorText>{error}</ErrorText>
        </Card>
      )}
    </Screen>
  );
}
