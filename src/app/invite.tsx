// Waiting room: share the invite code until the partner joins.

import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Share, Text, View } from "react-native";
import { Body, Button, Card, ErrorText, H2, Header, Screen, colors, serif } from "../components/ui";
import { useCouple } from "../lib/couple";

export default function Invite() {
  const { inviteCode, partner, coupleId, leaveCouple } = useCouple();
  const [error, setError] = useState("");

  if (!coupleId) return <Redirect href="/" />;
  if (partner) return <Redirect href="/today" />;

  async function share() {
    try {
      await Share.share({ message: `Join me on Closer. Our invite code is ${inviteCode}` });
    } catch {
      setError("Couldn't open sharing. You can read the code out to your partner instead.");
    }
  }

  async function startOver() {
    try { await leaveCouple(); router.replace("/"); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
  }

  return (
    <Screen>
      <Header />
      <Card>
        <H2 style={{ textAlign: "center" }}>Invite your partner</H2>
        <Body muted style={{ textAlign: "center", marginTop: 6 }}>
          Share this code. When they join, your first question unlocks.
        </Body>
        <View style={{ backgroundColor: colors.roseSoft, borderRadius: 14, padding: 14, marginVertical: 14 }}>
          <Text selectable style={{ fontFamily: serif, fontSize: 30, letterSpacing: 5, textAlign: "center", color: colors.plum }}>
            {inviteCode}
          </Text>
        </View>
        <Button title="Share code" onPress={share} />
        <Body muted small style={{ textAlign: "center", marginTop: 10 }}>
          Your partner installs Closer, signs in, enters their name and taps Join.
        </Body>
      </Card>
      <ErrorText>{error}</ErrorText>
      <Button title="Start over" variant="ghost" onPress={startOver} />
    </Screen>
  );
}
