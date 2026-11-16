import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? "https://example.supabase.co", anonKey ?? "missing-key", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is in the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Turn a Supabase/Postgres error into a sentence for the user. */
export function friendlyError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    const m = String((e as { message: string }).message);
    return m.replace(/^.*?exception:\s*/i, "") || "Something went wrong.";
  }
  return "Something went wrong. Please try again.";
}
