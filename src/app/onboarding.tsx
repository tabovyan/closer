// Create a couple space or join your partner's.

import { router } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, ErrorText, Field, H2, H3, Header, Screen } from "../components/ui";
import { useCouple } from "../lib/couple";
import { supabase } from "../lib/supabase";

export default function Onboarding() {
  const { createCouple, joinCouple } = useCouple();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");

  async function run(kind: "create" | "join") {
    if (!name.trim()) { setError("Please enter your name first."); return; }
    if (kind === "join" && code.trim().length < 8) { setError("Enter the 8-character code from your partner."); return; }
    setBusy(kind); setError("");
    try {
      if (kind === "create") await createCouple(name.trim());
      else await joinCouple(code.trim().toUpperCase(), name.trim());
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <Header />
      <H2 style={{ marginBottom: 12 }}>Welcome</H2>
      <Card>
        <Body muted small style={{ marginBottom: 8 }}>What should your partner see as your name?</Body>
        <Field value={name} onChangeText={setName} placeholder="Your first name" maxLength={30} autoComplete="given-name" />
      </Card>
      <Card>
        <H3>Start as a couple</H3>
        <Body muted small style={{ marginVertical: 6 }}>Create a private space and get an invite code for your partner.</Body>
        <Button title="Create our space" onPress={() => run("create")} busy={busy === "create"} disabled={busy !== null} />
      </Card>
      <Card>
        <H3>Join your partner</H3>
        <Field value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="Invite code" autoCapitalize="characters"
          maxLength={8} style={{ marginVertical: 8, letterSpacing: 2 }} />
        <Button title="Join" variant="ghost" onPress={() => run("join")} busy={busy === "join"} disabled={busy !== null} />
      </Card>
      <ErrorText>{error}</ErrorText>
      <Button title="Sign out" variant="ghost" onPress={() => supabase.auth.signOut()} style={{ marginTop: 16 }} />
    </Screen>
  );
}
