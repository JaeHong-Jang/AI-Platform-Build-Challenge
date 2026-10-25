"use client";
// 한 건의 이사를 브라우저 세션에 보관한다. 서버에는 저장하지 않는다.
// v3 (D006): 업체를 정하지 않은 채 시작하고, 견적은 여러 건 — 승인·문의·기록은 견적마다 따로 둔다 (Argon#3: 업체 간 승인 섞임 차단).
// 저장소 접근은 실패할 수 있다 (사생활 보호 모드 등) — TRITON store.ts 방식으로 감싼다.
import { useEffect, useMemo, useState } from "react";
import { compare } from "./rules.ts";
import { ALL_ON, isOn, type AgentId } from "./agents.ts";
import type { AgentRun } from "./agent.ts";
import type { IncidentRun } from "./incident.ts";
import { applyInspection, inspectSig, type InspectRun } from "./inspect.ts";
import type { Card, CardStatus, Conditions, Cost, Inquiry, Item, QuoteDraft, Relation } from "./types.ts";

export interface Override { sig: string; status: CardStatus; cost: Cost; answered: { relation: Relation; quote: string; followUp?: string } }

export interface QuoteEntry {
  id: string;
  label: string; // '견적 A' — 업체 이름은 견적서에서 읽는다
  firm?: string; // 허가 목록에서 골라 견적을 요청한 업체 (견적이 오기 전 표시용)
  quoteText: string;
  draft: QuoteDraft | null;
  raw?: QuoteDraft; // 검증 전 모델 출력 — 근거 장부에서 무엇을 걸러냈는지 보여 준다
  dropped: string[];
  reader: { model: string; ms: number } | null;
  asked: string[]; // 문의에 넣은 카드 id
  inquiry: Record<string, Inquiry>;
  overrides: Record<string, Override>; // 사용자가 승인한 답변 반영
  reply: string;
  runs: AgentRun[];
  inspection?: InspectRun; // 점검 에이전트 결과 — 짐·조건·견적 원문이 같을 때만 카드에 합친다 (B012)
}

export type HouseType = "원룸" | "투룸" | "쓰리룸 이상" | "모름";
export type Gu = "관악구" | "그 외" | "모름";
export interface Intake { sentence: string; houseType: HouseType; gu: Gu; parsed: { model: string; ms: number; dropped: string[]; at?: string } | null }

export interface CaseState {
  version: 3;
  started: boolean; // 조건을 정해 맞춤 홈을 만들었는지
  intake: Intake;
  items: Item[];
  cond: Conditions;
  quotes: QuoteEntry[];
  active: string | null; // 보고 있는 견적
  chosen: string | null; // 사용자가 고른 견적 (앱이 대신 고르지 않는다)
  agents: Record<AgentId, boolean>;
  docs: Record<string, boolean>; // 받은 서류 체크
  contractText: string; // 계약서 글 (계약 점검관)
  incidents: IncidentRun[]; // 사고 대응 에이전트 실행 기록 (B013)
}

export const EMPTY_COND: Conditions = { from: { floor: null, elevator: "모름", parkingFar: "모름" }, to: { floor: null, elevator: "모름", parkingFar: "모름" }, ladderNeeded: "모름" };

export const EMPTY_CASE: CaseState = {
  version: 3,
  started: false,
  intake: { sentence: "", houseType: "모름", gu: "모름", parsed: null },
  items: [],
  cond: EMPTY_COND,
  quotes: [],
  active: null,
  chosen: null,
  agents: ALL_ON,
  docs: {},
  contractText: "",
  incidents: [],
};

export const newQuote = (n: number, patch: Partial<QuoteEntry> = {}): QuoteEntry => ({
  id: `q${Date.now().toString(36)}${n}`, label: `견적 ${"ABCDEFGH"[n] ?? n + 1}`,
  quoteText: "", draft: null, dropped: [], reader: null, asked: [], inquiry: {}, overrides: {}, reply: "", runs: [], ...patch,
});

const KEY = "isa-case-v3";
const OLD_KEY = "isa-case-v2";

/** v2(견적 1건) 세션을 v3로 옮긴다 */
export function migrate(raw: Record<string, unknown> | null): CaseState {
  if (!raw) return EMPTY_CASE;
  if (raw.version === 3) return { ...EMPTY_CASE, ...(raw as Partial<CaseState>), agents: { ...ALL_ON, ...(raw.agents as object) } };
  const v2 = raw as Partial<Pick<QuoteEntry, "quoteText" | "draft" | "dropped" | "reader" | "asked" | "inquiry" | "overrides" | "reply" | "runs">> & { items?: Item[]; cond?: Conditions };
  const q = v2.draft ? newQuote(0, { quoteText: v2.quoteText ?? "", draft: v2.draft, dropped: v2.dropped ?? [], reader: v2.reader ?? null, asked: v2.asked ?? [], inquiry: v2.inquiry ?? {}, overrides: v2.overrides ?? {}, reply: v2.reply ?? "", runs: v2.runs ?? [] }) : null;
  return { ...EMPTY_CASE, started: !!q || !!v2.items?.length, items: v2.items ?? [], cond: v2.cond ?? EMPTY_COND, quotes: q ? [q] : [], active: q?.id ?? null };
}

const condSig = (c: Conditions) => JSON.stringify(c);
const itemsSig = (items: Item[]) => items.filter((i) => i.move).map((i) => `${i.name}:${i.count ?? "?"}`).sort().join(",");

/** 승인이 유효한 조건: 같은 견적 · 같은 카드 판정 · 같은 총액·업체 · 같은 짐·조건. 하나라도 바뀌면 다시 묻는다 (Argon#3) */
export const sigOf = (c: Card, q: QuoteEntry, s: Pick<CaseState, "items" | "cond">) =>
  [q.id, c.status, c.mine, ...c.evidence, q.draft?.totalAmount ?? "", q.draft?.company ?? "", condSig(s.cond), itemsSig(s.items)].join("|");

/** 승인 반영 전, 입력만으로 만든 카드 — 승인할 때 sig는 이걸로 잡는다. 원문을 함께 넘겨 직접 입력 값은 명시됨이 되지 않는다 */
export function baseCards(s: Pick<CaseState, "items" | "cond"> & Partial<Pick<CaseState, "agents">>, q: QuoteEntry): Card[] {
  if (!q.draft) return [];
  const rule = compare(s.items, q.draft, s.cond, q.quoteText);
  // 점검 에이전트를 끄면 규칙 기준선만 (결과는 지우지 않고 다시 켜면 돌아온다)
  const on = !s.agents || isOn("inspector", s.agents);
  return on && q.inspection && q.inspection.sig === inspectSig(s.items, s.cond, q.quoteText) ? applyInspection(rule, q.inspection) : rule;
}

export function cardsOf(s: Pick<CaseState, "items" | "cond"> & Partial<Pick<CaseState, "agents">>, q: QuoteEntry): Card[] {
  return baseCards(s, q).map((c) => {
    const o = q.overrides[c.id];
    return o && o.sig === sigOf(c, q, s) ? { ...c, status: o.status, cost: o.cost ?? c.cost, answered: o.answered } : c;
  });
}

/** 문의 상태는 승인과 함께 움직인다: 승인이 무효가 되면 '답변 반영'은 '재문의 필요'로 본다 */
export function inquiryOf(q: QuoteEntry, cards: Card[]): Record<string, Inquiry> {
  const out: Record<string, Inquiry> = {};
  for (const c of cards) {
    const v = q.inquiry[c.id];
    if (!v) continue;
    out[c.id] = v === "답변 반영" && !c.answered ? "재문의 필요" : v;
  }
  return out;
}

export const activeQuote = (s: CaseState): QuoteEntry | null => s.quotes.find((q) => q.id === s.active) ?? s.quotes[0] ?? null;

export function useCase() {
  const [state, setState] = useState<CaseState>(EMPTY_CASE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY) ?? sessionStorage.getItem(OLD_KEY);
      if (raw) setState(migrate(JSON.parse(raw)));
    } catch { /* 저장소를 못 쓰면 새로 시작 */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 무시 */ }
  }, [state, loaded]);

  const quote = activeQuote(state);
  const cards = useMemo(() => (quote ? cardsOf(state, quote) : []), [state, quote]);
  const inquiry = useMemo(() => (quote ? inquiryOf(quote, cards) : {}), [quote, cards]);
  const update = (patch: Partial<CaseState> | ((s: CaseState) => Partial<CaseState>)) =>
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  const updateQuote = (id: string, patch: Partial<QuoteEntry> | ((q: QuoteEntry) => Partial<QuoteEntry>)) =>
    setState((s) => ({ ...s, quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...(typeof patch === "function" ? patch(q) : patch) } : q)) }));
  return { state, quote, cards, inquiry, update, updateQuote, reset: () => setState(EMPTY_CASE), loaded };
}

export type CaseApi = ReturnType<typeof useCase>;
