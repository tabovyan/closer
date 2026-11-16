// Entry gate: sends people to the right place based on where they are in setup.

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Body, Button, Card, H2, Screen, colors } from "../components/ui";
import { useCouple } from "../lib/couple";
import { useSession } from "../lib/session";
import { isConfigured } from "../lib/supabase";

export default function Index() {
  const { session, loading } = useSession();
  const couple = useCouple();

  if (!isConfigured) {
    return (
      <Screen>
        <Card style={{ marginTop: 80 }}>
          <H2>Almost there</H2>
          <Body muted style={{ marginTop: 6 }}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file (see .env.example), then restart the app.
          </Body>
        </Card>
      </Screen>
    );
  }

  if (loading || (session && couple.loading)) {
    return <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.bg }}><ActivityIndicator color={colors.plum} /></View>;
  }
  if (!session) return <Redirect href="/sign-in" />;
  if (couple.error) {
    return (
      <Screen>
        <Card style={{ marginTop: 80 }}>
          <H2>Couldn't load your space</H2>
          <Body muted style={{ marginVertical: 8 }}>{couple.error}</Body>
          <Button title="Try again" onPress={couple.refresh} />
        </Card>
      </Screen>
    );
  }
  if (!couple.coupleId) return <Redirect href="/onboarding" />;
  if (!couple.partner) return <Redirect href="/invite" />;
  return <Redirect href="/today" />;
}
