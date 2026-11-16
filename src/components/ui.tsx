// Shared UI building blocks in Closer's visual style.

import type { ReactNode } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

export const colors = {
  bg: "#FBF6F2", card: "#FFFFFF", ink: "#2A1F2D", muted: "#7A6C7D", line: "#EEE3DD",
  plum: "#6B2E5F", plum2: "#8E4A80", rose: "#E8A4A0", roseSoft: "#FBE9E5", lilac: "#F4EEF6",
  track: "#F3EAE6", heroMuted: "#F1D9E6", warn: "#FFF5E1", warnInk: "#7A5A1E", error: "#A23B3B",
};
export const serif = "Georgia";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[styles.screen, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={12} cy={16} r={9} fill={colors.rose} opacity={0.9} />
      <Circle cx={20} cy={16} r={9} fill={colors.plum} opacity={0.85} />
    </Svg>
  );
}

export function Header({ partnerName }: { partnerName?: string | null }) {
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Logo />
        <H2>Closer</H2>
      </View>
      {partnerName ? <View style={styles.pill}><Text style={styles.pillText}>You & {partnerName}</Text></View> : null}
    </View>
  );
}

export function Card({ children, hero, style }: { children: ReactNode; hero?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, hero && styles.hero, style]}>{children}</View>;
}

export const H1 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) =>
  <Text style={[styles.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) =>
  <Text style={[styles.h2, style]}>{children}</Text>;
export const H3 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) =>
  <Text style={[styles.h3, style]}>{children}</Text>;
export const Body = ({ children, muted, small, style }: { children: ReactNode; muted?: boolean; small?: boolean; style?: StyleProp<TextStyle> }) =>
  <Text style={[styles.body, muted && { color: colors.muted }, small && { fontSize: 13 }, style]}>{children}</Text>;
export const Eyebrow = ({ children, light }: { children: ReactNode; light?: boolean }) =>
  <Text style={[styles.eyebrow, light && { color: "#F6C9D9" }]}>{children}</Text>;
export const ErrorText = ({ children }: { children: ReactNode }) =>
  children ? <Text style={styles.error}>{children}</Text> : null;

export function Button({ title, onPress, variant = "primary", busy, disabled, style }: {
  title: string; onPress: () => void; variant?: "primary" | "ghost" | "light"; busy?: boolean; disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = variant === "primary" ? styles.btnPrimary : variant === "light" ? styles.btnLight : styles.btnGhost;
  const t = variant === "primary" ? "#fff" : colors.plum;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [styles.btn, v, (disabled || busy) && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style]}
    >
      {busy ? <ActivityIndicator color={t} /> : <Text style={[styles.btnText, { color: t }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor="#A89AAB" {...props} style={[styles.field, props.multiline && { minHeight: 100, textAlignVertical: "top" }, props.style]} />;
}

export function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ marginVertical: 7 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Body small>{label}</Body>
        <Body small style={{ fontWeight: "600" }}>{value.toFixed(1)}</Body>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${value * 10}%` }]} /></View>
    </View>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return <View style={styles.banner}><Text style={{ color: colors.warnInk, fontSize: 13 }}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 40, maxWidth: 560, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  pill: { backgroundColor: colors.roseSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: colors.plum, fontSize: 12, fontWeight: "600" },
  card: { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 14 },
  hero: { backgroundColor: colors.plum, borderWidth: 0 },
  h1: { fontFamily: serif, fontSize: 30, fontWeight: "600", color: colors.ink },
  h2: { fontFamily: serif, fontSize: 22, fontWeight: "600", color: colors.ink },
  h3: { fontFamily: serif, fontSize: 17, fontWeight: "600", color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  eyebrow: { fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", fontWeight: "600", color: colors.plum2, marginBottom: 6 },
  error: { color: colors.error, fontSize: 13, marginTop: 8 },
  btn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", minHeight: 48 },
  btnPrimary: { backgroundColor: colors.plum },
  btnLight: { backgroundColor: "#fff" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.line },
  btnText: { fontSize: 15, fontWeight: "600" },
  field: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, fontSize: 15, color: colors.ink, backgroundColor: "#fff" },
  track: { height: 8, backgroundColor: colors.track, borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.plum2, borderRadius: 99 },
  banner: { backgroundColor: colors.warn, borderRadius: 12, padding: 10, marginBottom: 14 },
});
