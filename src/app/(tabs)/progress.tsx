// Progress: connection score, per-area bars, weekly trend, shared moments.

import { router } from "expo-router";
import { useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Polyline, Stop, Text as SvgText } from "react-native-svg";
import { Bar, Body, Button, Card, Eyebrow, H2, H3, Header, Screen, colors, serif } from "../../components/ui";
import { DIMENSIONS } from "../../lib/content";
import { useCouple } from "../../lib/couple";
import { scoreLabel, sharedDays, streak, weeklyScores, type WeekScore } from "../../lib/logic";

function Ring({ score }: { score: number }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <View style={{ width: 110, height: 110 }}>
      <Svg width={110} height={110} viewBox="0 0 110 110">
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.rose} />
            <Stop offset="1" stopColor={colors.plum} />
          </LinearGradient>
        </Defs>
        <Circle cx={55} cy={55} r={r} fill="none" stroke={colors.track} strokeWidth={10} />
        <Circle cx={55} cy={55} r={r} fill="none" stroke="url(#g)" strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${c}`} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 55 55)" />
        <SvgText x={55} y={66} textAnchor="middle" fontSize={32} fontFamily={serif} fill={colors.ink}>{score}</SvgText>
      </Svg>
    </View>
  );
}

function Trend({ weeks, width }: { weeks: WeekScore[]; width: number }) {
  if (weeks.length < 2) return <Body muted small>Your trend appears after two weekly check-ins.</Body>;
  const pts = weeks.slice(-8), W = width, H = 150, pl = 28, pr = 10, pt = 12, pb = 24;
  const x = (i: number) => pl + (i * (W - pl - pr)) / (pts.length - 1);
  const y = (v: number) => pt + ((100 - v) * (H - pt - pb)) / 100;
  return (
    <Svg width={W} height={H} accessibilityLabel="Connection score by week">
      {[25, 50, 75, 100].map((v) => (
        <Line key={v} x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="#F1E7E2" />
      ))}
      {[25, 50, 75, 100].map((v) => (
        <SvgText key={`t${v}`} x={pl - 6} y={y(v) + 4} fontSize={10} textAnchor="end" fill="#A89AAB">{v}</SvgText>
      ))}
      <Polyline points={pts.map((p, i) => `${x(i)},${y(p.score)}`).join(" ")} fill="none" stroke={colors.plum} strokeWidth={2.5} />
      {pts.map((p, i) => <Circle key={p.week} cx={x(i)} cy={y(p.score)} r={3.5} fill={colors.plum} />)}
      {pts.map((p, i) => (
        <SvgText key={`l${p.week}`} x={x(i)} y={H - 6} fontSize={10} textAnchor="middle" fill="#A89AAB">{p.week.slice(5)}</SvgText>
      ))}
    </Svg>
  );
}

export default function Progress() {
  const c = useCouple();
  const { width } = useWindowDimensions();
  const weeks = useMemo(() => weeklyScores(c.checkins), [c.checkins]);
  const days = useMemo(() => sharedDays(c.answers, c.me!, c.partner?.user_id ?? null), [c.answers, c.me, c.partner]);
  const chartWidth = Math.min(width, 560) - 32 - 38;

  if (!weeks.length) {
    return (
      <Screen>
        <Header partnerName={c.partner?.display_name} />
        <Card>
          <H3 style={{ textAlign: "center" }}>No check-ins yet</H3>
          <Body muted style={{ textAlign: "center", marginVertical: 8 }}>Do your first weekly check-in to see your connection score.</Body>
          <Button title="Go to check-in" onPress={() => router.navigate("/checkin")} />
        </Card>
      </Screen>
    );
  }

  const cur = weeks[weeks.length - 1];
  const prev = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const delta = prev ? cur.score - prev.score : null;

  return (
    <Screen>
      <Header partnerName={c.partner?.display_name} />
      <Card>
        <Eyebrow>Connection score · {cur.week}</Eyebrow>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <Ring score={cur.score} />
          <View style={{ flex: 1 }}>
            <H3>{scoreLabel(cur.score)}</H3>
            <Body muted small>
              {delta === null ? "Your first week" : delta > 0 ? `▲ ${delta} from last week` : delta < 0 ? `▼ ${-delta} from last week` : "Same as last week"}
            </Body>
            {cur.responses < 2 ? <Body muted small>Based on one partner so far</Body> : null}
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          {DIMENSIONS.map((d) => <Bar key={d.key} label={d.name} value={cur.dims[d.key]} />)}
        </View>
      </Card>
      <Card>
        <Eyebrow>Trend</Eyebrow>
        <Trend weeks={weeks} width={chartWidth} />
      </Card>
      <Card>
        <Eyebrow>Shared moments</Eyebrow>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1 }}><H2>{days.size}</H2><Body muted small>questions answered together</Body></View>
          <View style={{ flex: 1 }}><H2>{streak(days)}</H2><Body muted small>day streak</Body></View>
        </View>
      </Card>
    </Screen>
  );
}
