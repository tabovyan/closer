// Passwordless sign-in: we email a 6-digit code.

import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Body, Button, Card, ErrorText, Field, H1, Logo, Screen } from "../components/ui";
import { friendlyError, supabase } from "../lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) { setError("Please enter a valid email."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) setError(friendlyError(error)); else setSent(true);
  }

  async function verify() {
    setBusy(true); setError("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setError(friendlyError(error)); else router.replace("/");
  }

  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: 60, marginBottom: 24 }}>
        <Logo size={44} />
        <H1 style={{ marginTop: 10 }}>Closer</H1>
        <Body muted style={{ textAlign: "center", marginTop: 6 }}>
          Build your connection the way training builds fitness: one honest question a day.
        </Body>
      </View>
      <Card>
        {!sent ? (
          <>
            <Body muted small style={{ marginBottom: 8 }}>Sign in with your email. We'll send you a code.</Body>
            <Field value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none"
              keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
            <Button title="Send code" onPress={sendCode} busy={busy} style={{ marginTop: 10 }} />
          </>
        ) : (
          <>
            <Body muted small style={{ marginBottom: 8 }}>Enter the 6-digit code we sent to {email.trim()}.</Body>
            <Field value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad"
              autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} />
            <Button title="Sign in" onPress={verify} busy={busy} disabled={code.trim().length < 6} style={{ marginTop: 10 }} />
            <Button title="Use a different email" variant="ghost" onPress={() => { setSent(false); setCode(""); }} style={{ marginTop: 8 }} />
          </>
        )}
        <ErrorText>{error}</ErrorText>
      </Card>
    </Screen>
  );
}
