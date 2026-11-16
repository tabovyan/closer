import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../components/ui";
import { CoupleProvider } from "../lib/couple";
import { SessionProvider } from "../lib/session";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CoupleProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
        </CoupleProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
