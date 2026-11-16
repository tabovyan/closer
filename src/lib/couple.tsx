// Loads everything about the signed-in user's couple and keeps it live.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Dimension } from "./content";
import { dayKey, daysAgo, weekKey, type Answer, type Checkin } from "./logic";
import { useSession } from "./session";
import { friendlyError, supabase } from "./supabase";

export interface Member { user_id: string; display_name: string }
export interface Reflection { day: string; body: string }

interface CoupleState {
  loading: boolean;
  error: string | null;
  me: string | null;
  coupleId: string | null;
  inviteCode: string | null;
  members: Member[];
  partner: Member | null;
  answers: Answer[];
  checkins: Checkin[];
  reflections: Reflection[];
}

interface CoupleApi extends CoupleState {
  refresh: () => Promise<void>;
  createCouple: (name: string) => Promise<void>;
  joinCouple: (code: string, name: string) => Promise<void>;
  leaveCouple: () => Promise<void>;
  saveAnswer: (questionId: string, body: string) => Promise<void>;
  saveCheckin: (values: Record<Dimension, number>) => Promise<void>;
  requestReflection: (day: string, question: string) => Promise<void>;
  requestExercise: (focus: Dimension) => Promise<{ title: string; minutes: number; steps: string[] }>;
}

const empty: CoupleState = {
  loading: true, error: null, me: null, coupleId: null, inviteCode: null,
  members: [], partner: null, answers: [], checkins: [], reflections: [],
};

const CoupleContext = createContext<CoupleApi | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const me = session?.user.id ?? null;
  const [state, setState] = useState<CoupleState>(empty);
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    if (!me) { setState({ ...empty, loading: false }); return; }
    const seq = ++loadSeq.current;
    try {
      const { data: mine, error: e1 } = await supabase.from("couple_members").select("couple_id").eq("user_id", me).maybeSingle();
      if (e1) throw e1;
      if (!mine) { if (seq === loadSeq.current) setState({ ...empty, me, loading: false }); return; }
      const coupleId = mine.couple_id as string;
      const since = dayKey(daysAgo(90));
      const [couple, members, answers, checkins, reflections] = await Promise.all([
        supabase.from("couples").select("invite_code").eq("id", coupleId).single(),
        supabase.from("couple_members").select("user_id, display_name").eq("couple_id", coupleId),
        supabase.from("answers").select("user_id, day, question_id, body").eq("couple_id", coupleId).gte("day", since),
        supabase.from("checkins").select("user_id, week, closeness, communication, intimacy").eq("couple_id", coupleId)
          .order("week", { ascending: false }).limit(60),
        supabase.from("reflections").select("day, body").eq("couple_id", coupleId).gte("day", since),
      ]);
      for (const r of [couple, members, answers, checkins, reflections]) if (r.error) throw r.error;
      if (seq !== loadSeq.current) return;
      const memberList = (members.data ?? []) as Member[];
      setState({
        loading: false, error: null, me, coupleId,
        inviteCode: couple.data?.invite_code ?? null,
        members: memberList,
        partner: memberList.find((m) => m.user_id !== me) ?? null,
        answers: (answers.data ?? []) as Answer[],
        checkins: (checkins.data ?? []) as Checkin[],
        reflections: (reflections.data ?? []) as Reflection[],
      });
    } catch (e) {
      if (seq === loadSeq.current) setState((s) => ({ ...s, loading: false, error: friendlyError(e) }));
    }
  }, [me]);

  useEffect(() => { load(); }, [load]);

  // Live updates: any change in this couple's tables triggers a reload.
  useEffect(() => {
    if (!state.coupleId) return;
    const filter = `couple_id=eq.${state.coupleId}`;
    const channel = supabase.channel(`couple-${state.coupleId}`);
    for (const table of ["couple_members", "answers", "checkins", "reflections"]) {
      channel.on("postgres_changes", { event: "*", schema: "public", table, filter }, () => { load(); });
    }
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [state.coupleId, load]);

  const api = useMemo<CoupleApi>(() => ({
    ...state,
    refresh: load,
    async createCouple(name) {
      const { error } = await supabase.rpc("create_couple", { p_name: name });
      if (error) throw new Error(friendlyError(error));
      await load();
    },
    async joinCouple(code, name) {
      const { error } = await supabase.rpc("join_couple", { p_code: code, p_name: name });
      if (error) throw new Error(friendlyError(error));
      await load();
    },
    async leaveCouple() {
      const { error } = await supabase.rpc("leave_couple");
      if (error) throw new Error(friendlyError(error));
      await load();
    },
    async saveAnswer(questionId, body) {
      if (!state.coupleId || !me) return;
      const { error } = await supabase.from("answers").upsert({
        couple_id: state.coupleId, user_id: me, day: dayKey(), question_id: questionId, body,
      });
      if (error) throw new Error(friendlyError(error));
      await load();
    },
    async saveCheckin(values) {
      if (!state.coupleId || !me) return;
      const { error } = await supabase.from("checkins").upsert({
        couple_id: state.coupleId, user_id: me, week: weekKey(), ...values,
      });
      if (error) throw new Error(friendlyError(error));
      await load();
    },
    async requestReflection(day, question) {
      const { data, error } = await supabase.functions.invoke("coach", { body: { kind: "reflection", day, question } });
      if (error || data?.error) throw new Error(data?.error ?? "The coach isn't available right now.");
      await load();
    },
    async requestExercise(focus) {
      const { data, error } = await supabase.functions.invoke("coach", { body: { kind: "exercise", focus } });
      if (error || data?.error) throw new Error(data?.error ?? "The coach isn't available right now.");
      return data as { title: string; minutes: number; steps: string[] };
    },
  }), [state, load, me]);

  return <CoupleContext.Provider value={api}>{children}</CoupleContext.Provider>;
}

export function useCouple(): CoupleApi {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple must be used inside CoupleProvider");
  return ctx;
}
