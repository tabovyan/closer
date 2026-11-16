import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../../components/ui";
import { useCouple } from "../../lib/couple";
import { useSession } from "../../lib/session";

const icon = (paths: string[], circles: [number, number][] = []) => ({ color }: { color: ColorValue }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    {paths.map((d) => <Path key={d} d={d} />)}
    {circles.map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} />)}
  </Svg>
);

export default function TabsLayout() {
  const { session, loading } = useSession();
  const couple = useCouple();
  if (!loading && !session) return <Redirect href="/sign-in" />;
  if (!couple.loading && (!couple.coupleId || !couple.partner)) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.plum,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="today" options={{ title: "Today", tabBarIcon: icon(["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"]) }} />
      <Tabs.Screen name="checkin" options={{ title: "Check-in", tabBarIcon: icon(["M4 7h10M4 12h16M4 17h7"], [[17, 7], [14, 17]]) }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: icon(["M4 19V5M4 19h16M8 15l4-4 3 3 5-6"]) }} />
      <Tabs.Screen name="grow" options={{ title: "Grow", tabBarIcon: icon(["M12 21V11M12 11c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z"]) }} />
    </Tabs>
  );
}
