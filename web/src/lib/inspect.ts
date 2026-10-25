// 점검 에이전트의 도구 · 결과 검증 · 카드 병합 (B012). 브라우저에서도 쓰므로 Ollama·node 모듈을 import하지 않는다.
// 에이전트가 판단한다: 내 조건 조합(층·엘리베이터·큰 짐·주차)에서 당일 추가 비용이 생길 지점을 찾고,
// 견적이 그 지점을 덮는지 근거 문장으로 가리고, 덮지 않으면 업체에 보낼 질문을 쓴다.
// 코드는 판단하지 않고 지킨다: 근거 문장은 견적 원문에 그대로 있어야 하고, 조건·금액·별도 표현이 있으면 '명시됨'이 될 수 없다.
// 규칙 판정(rules.ts compare)은 기준선이다 — 에이전트에게 참고로 주고, 모델이 실패하면 그대로 쓴다.
import { canonical } from "./rules.ts";
import { notPlain } from "./plain.ts";
import { keywords } from "./proposals.ts";
import { amountsIn, sentences } from "./verify.ts";
import type { Card, Conditions, Item, QuoteDraft, Site } from "./types.ts";

export type Verdict = "covered" | "needs_check";
export interface Finding { cardId: string; title: string; verdict: Verdict; quote: string; reason: string; question: string; isNew: boolean; related: string }
export interface InspectStep { n: number; tool: string; input: unknown; output: unknown; ms: number }
export interface InspectRun { model: string; ms: number; steps: InspectStep[]; findings: Finding[]; stopped: "finished" | "limit" | "error"; note: string; sig: string }
export interface InspectInput { items: Item[]; cond: Conditions; draft: QuoteDraft; quoteText: string }

export const MAX_NEW = 4; // 에이전트가 새로 낼 수 있는 위험 카드 수

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const moving = (items: Item[]) => items.filter((i) => i.move && !i.pending && i.count !== 0);

/** 점검 결과가 유효한 입력 — 짐·조건·견적 원문 중 하나라도 바뀌면 다시 점검한다 */
export function inspectSig(items: Item[], cond: Conditions, quoteText: string): string {
  const s = JSON.stringify([moving(items).map((i) => `${i.name}:${i.count ?? "?"}`).sort(), cond, norm(quoteText)]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}-${(h >>> 0).toString(36)}`;
}

const floorText = (s: Site) => (s.floor === null ? "층수 모름" : s.floor < 0 ? `지하 ${-s.floor}층` : `${s.floor}층`);
const siteText = (s: Site) => `${floorText(s)} · 엘리베이터 ${s.elevator} · 차 대는 곳이 멂 ${s.parkingFar}`;
// 새 위험 카드가 가리킬 수 있는 조건 낱말 (짐 이름 외)
const COND_WORDS = ["출발지", "도착지", "계단", "엘리베이터", "사다리차", "주차", "운반 거리", "차량", "작업 인원", "날짜", "시간", "분해", "조립", "포장", "파손", "보험"];

// 짐 이름 확인에 쓰는 큰 짐 낱말 — 에이전트가 내 짐에 없는 물건을 지어내는지 본다
const BIG = ["냉장고", "세탁기", "건조기", "침대", "매트리스", "책장", "책상", "식탁", "옷장", "소파", "피아노", "에어컨", "행거", "TV", "티비"];
const NOT_ASSEMBLED = ["냉장고", "세탁기", "건조기", "전자레인지", "에어컨", "TV", "티비"];
// 분해·조립을 물을 수 있는 가구 (rules.ts canonical 대표 이름)
const ASSEMBLED = ["침대", "책장", "책상", "식탁", "옷장", "행거", "티비선반", "소파"];

/** 판정 대상에서 빼는 카드: 판독 불가(값 자체가 없음)는 사용자가 채우거나 다시 물어야 한다 */
const judgeable = (c: Card) => !c.id.startsWith("unread-");

export function makeInspectTools({ items, cond, draft, quoteText }: InspectInput, baseline: Card[]) {
  const src = norm(quoteText);
  const lines = sentences(quoteText);
  const findings = new Map<string, Finding>();
  const mine = moving(items);
  const targets = baseline.filter(judgeable);

  const relatedOk = (r: string) => {
    const k = canonical(r);
    return mine.some((i) => canonical(i.name) === k || i.name.includes(r) || r.includes(i.name)) || COND_WORDS.some((w) => r.includes(w));
  };

  const tools = {
    findings,
    get_case: () => ({
      my_move: { 출발지: siteText(cond.from), 도착지: siteText(cond.to), 사다리차_필요: cond.ladderNeeded },
      my_items: mine.map((i) => `${i.name}${i.count === null ? " (수량 모름)" : ` ${i.count}개`}`),
      quote_values: { 업체: draft.company, 총액: draft.totalAmount, 계약금: draft.deposit, 차량: draft.truck, 작업인원: draft.workers },
      quote_sentences: lines.map((l, n) => `[${n + 1}] ${l}`),
      rule_checks: targets.map((c) => ({ card_id: c.id, title: c.title, rule_status: c.status === "명시됨" ? "covered" : "needs_check", rule_reason: c.why })),
    }),
    find_in_quote: ({ keywords: kws }: { keywords: string[] }) => ({
      matches: lines.filter((l) => kws.some((k) => k && l.includes(k))).slice(0, 6),
    }),
    /** 규칙 판정 카드마다: 견적이 덮는가(근거 문장) / 확인이 필요한가(질문) */
    submit_findings: ({ findings: list }: { findings: Record<string, unknown>[] }) => {
      const results = list.map((f) => {
        const id = String(f?.card_id ?? "").trim().replace(/\s*\(.*\)$/, "");
        const card = targets.find((c) => c.id === id);
        if (!card) return { card_id: id || null, accepted: false, reason: id ? "없는 card_id입니다. rule_checks의 card_id를 그대로 쓰세요" : "card_id가 비었습니다. 규칙이 못 본 새 위험은 add_risks로 내세요" };
        return check(f, card);
      });
      const left = targets.filter((c) => !findings.has(c.id)).map((c) => c.id);
      return { results, not_judged_yet: left, next: left.length ? "남은 카드를 판정하세요" : "이제 내 조건 조합에서 규칙이 못 본 위험을 add_risks로 내세요 (없으면 finish)" };
    },
    /** 규칙이 못 본 위험 — 내 조건 조합(엘리베이터 없는 층의 큰 가전, 분해·조립 가구, 사다리차, 짐 양과 차량)에서 추론한다 */
    add_risks: ({ risks }: { risks: Record<string, unknown>[] }) => ({
      results: risks.map((f) => check({ ...f, verdict: "needs_check" }, null)),
      next: "다 냈으면 finish",
    }),
  };

  function check(f: Record<string, unknown>, card: Card | null) {
    const title = norm(String(card?.title ?? f?.title ?? ""));
    const r = { card_id: card?.id ?? null, title };
    const verdict = f?.verdict;
    if (verdict !== "covered" && verdict !== "needs_check") return { ...r, accepted: false, reason: "verdict는 covered 또는 needs_check" };
    const reason = norm(String(f?.reason ?? ""));
    if (reason.length < 4 || reason.length > 200) return { ...r, accepted: false, reason: "reason을 내 조건과 연결해 한 문장(200자 이내)으로 쓰세요" };
    const related = norm(String(f?.related ?? ""));
    if (related.length > 40) return { ...r, accepted: false, reason: "related는 짐 이름이나 조건 낱말 하나(40자 이내)로 쓰세요" };
    // 내 조건과 어긋나는 추론은 받지 않는다: 계단·사다리 이야기인데 그 집에 엘리베이터가 있다고 했으면 거절 (모든 판정·질문)
    const said = `${card ? "" : title} ${reason} ${f?.question ?? ""}`;
    if (/계단|사다리/.test(said)) {
      const sites = ([["출발지", cond.from], ["도착지", cond.to]] as const).filter(([w]) => said.includes(w));
      const lifted = sites.filter(([, s]) => s.elevator === "있음").map(([w]) => w);
      if (lifted.length) return { ...r, accepted: false, reason: `내 조건과 다릅니다: ${lifted.join("·")}에는 엘리베이터가 있습니다 (get_case의 my_move). 엘리베이터가 없는 집만 짚어 다시 쓰세요` };
      const ground = sites.filter(([, s]) => s.floor !== null && s.floor >= 0 && s.floor <= 1).map(([w]) => w);
      if (!card && sites.length === 0 && [cond.from, cond.to].every((s) => s.elevator === "있음"))
        return { ...r, accepted: false, reason: "내 조건과 다릅니다: 두 집 모두 엘리베이터가 있습니다" };
      if (ground.length) return { ...r, accepted: false, reason: `내 조건과 다릅니다: ${ground.join("·")}은(는) 1층이라 계단 운반이 없습니다` };
      if (!sites.length && !card && [cond.from, cond.to].every((s) => s.floor !== null && (s.elevator === "있음" || (s.floor >= 0 && s.floor <= 1))))
        return { ...r, accepted: false, reason: "내 조건과 다릅니다: 두 집 모두 엘리베이터가 있거나 1층이라 계단 운반 위험이 없습니다" };
    }
    // 사다리차는 위층 작업 장비다 — 지하층 집에 사다리차 위험을 내면 거절 (Sol B012 채점 H11)
    if (/사다리/.test(said) && ([["출발지", cond.from], ["도착지", cond.to]] as const).some(([w, s]) => said.includes(w) && s.floor !== null && s.floor < 0))
      return { ...r, accepted: false, reason: "내 조건과 다릅니다: 지하층에는 사다리차를 쓰지 않습니다. 계단 운반으로 물으세요" };
    // 분해·조립은 조립 가구에만 — 박스·가전에 분해·조립을 묻는 새 위험은 거절 (Sol B012 채점 H05·H20)
    if (!card && /분해|조립/.test(said) && (/박스|상자/.test(said) || NOT_ASSEMBLED.some((w) => said.includes(w)) || !ASSEMBLED.includes(canonical(related))))
      return { ...r, accepted: false, reason: `분해·조립은 침대·책장·옷장 같은 조립 가구에만 묻습니다 (related: ${related || "없음"})` };
    // 수량은 내 짐 목록이나 견적서에 있는 수만 (Sol B012 채점 H05)
    const counts = new Set([...mine.map((i) => i.count), ...(quoteText.match(/\d+/g) ?? []).map(Number)]);
    const wrongN = [...said.matchAll(/(\d+)\s*(개|대|짝)/g)].map((m) => Number(m[1])).filter((n) => !counts.has(n));
    if (wrongN.length) return { ...r, accepted: false, reason: `내 짐 목록·견적서에 없는 수량입니다: ${wrongN.join(", ")}개` };
    // 내 짐에 없는 물건을 말하면 거절 (자주 나오는 큰 짐 이름만 본다)
    const ghost = BIG.filter((w) => said.includes(w) && !mine.some((i) => i.name.includes(w) || canonical(i.name) === canonical(w)));
    if (ghost.length) return { ...r, accepted: false, reason: `내 짐에 없는 물건입니다: ${ghost.join(", ")} (get_case의 my_items만 쓰세요)` };
    if (!card) {
      if (title.length < 2 || title.length > 24) return { ...r, accepted: false, reason: "새 위험의 title은 2~24자" };
      if (!relatedOk(related)) return { ...r, accepted: false, reason: `related는 내 짐 이름(${mine.map((i) => i.name).join(", ") || "없음"})이나 조건(${COND_WORDS.join("·")}) 중 하나여야 합니다` };
      if (targets.some((c) => c.title === title)) return { ...r, accepted: false, reason: `'${title}'은 rule_checks에 이미 있습니다. submit_findings로 그 card_id를 판정하세요` };
      const text = `${title} ${reason} ${f?.question ?? ""}`;
      const dup = targets.find((c) => (/사다리/.test(text) && c.id === "ladder") || (/추가\s*비용/.test(title) && c.rule === "추가비"));
      if (dup) return { ...r, accepted: false, reason: `'${dup.title}' 카드가 이미 있습니다. submit_findings로 card_id '${dup.id}'를 판정하세요` };
      if ([...findings.values()].filter((x) => x.isNew && x.title !== title).length >= MAX_NEW) return { ...r, accepted: false, reason: `새 위험은 ${MAX_NEW}개까지입니다` };
    }
    const quote = norm(typeof f?.quote === "string" ? f.quote : "").replace(/^\[\d+\]\s*/, "");
    if (quote.length > 300) return { ...r, accepted: false, reason: "quote는 견적서 문장 하나(300자 이내)" };
    // 금액·숫자는 견적서에 있는 것만: 단위가 붙은 금액과, 단위 없이 네 자리 이상인 숫자 (Sonnet B012 리뷰 #5)
    const srcDigits = new Set((quoteText.match(/\d[\d,]*/g) ?? []).map((d) => d.replace(/,/g, "")));
    const madeUp = (t: string) => amountsIn(t).some((n) => !amountsIn(quoteText).includes(n)) || (t.match(/\d[\d,]{3,}/g) ?? []).some((d) => !srcDigits.has(d.replace(/,/g, "")));
    if (madeUp(`${reason} ${f?.question ?? ""} ${card ? "" : title}`)) return { ...r, accepted: false, reason: "견적서에 없는 금액·숫자를 쓰지 마세요" };
    if (quote && !src.includes(quote)) return { ...r, accepted: false, reason: "quote가 견적서에 그대로 있는 문장이 아닙니다. quote_sentences의 글을 번호 없이 그대로 복사하세요" };
    const question = norm(String(f?.question ?? ""));
    if (verdict === "covered") {
      // '확인 필요'를 '명시됨'으로 올리는 일은 업체 답변 + 사람 승인으로만 한다 (Astra B012 리뷰 d). 에이전트는 확인하거나 내릴 수만 있다
      if (!card || card.status !== "명시됨") return { ...r, accepted: false, reason: "규칙이 확인 필요로 본 항목은 covered로 올릴 수 없습니다 (올리는 것은 업체 답변과 사용자 승인으로만). needs_check로 내고 내 조건에 맞춘 질문을 쓰세요" };
      if (!quote) return { ...r, accepted: false, reason: "covered는 견적서의 근거 문장(quote)이 있어야 합니다" };
      if (!keywords(card!).some((k) => k && quote.includes(k))) return { ...r, accepted: false, reason: `근거 문장에 '${title}'에 대한 말이 없습니다. '짐 일체'처럼 뭉뚱그린 문구는 근거가 아닙니다 — needs_check로 내세요` };
      const blocker = notPlain(quote, draft.totalAmount);
      if (blocker) return { ...r, accepted: false, reason: `'${blocker}' 같은 조건·금액·별도 표현이 있어 견적이 덮었다고 볼 수 없습니다. needs_check로 내고 질문을 쓰세요` };
    } else {
      if (question.length < 8 || question.length > 160) return { ...r, accepted: false, reason: "needs_check는 question 칸에 업체에 보낼 질문 한 문장이 있어야 합니다 (160자 이내). 예: '출발지 3층(엘리베이터 없음) 계단 작업이 총액에 포함되나요? 별도라면 조건과 금액을 견적서에 적어 주세요.'" };
      if (card?.rule === "품목" && /분해|조립/.test(question) && !ASSEMBLED.includes(canonical(card.title)))
        return { ...r, accepted: false, reason: `${card.title}은(는) 분해·조립 가구가 아닙니다. 분해·조립 이야기를 빼고 다시 쓰세요` };
    }
    const key = card ? card.id : `ai-${title.replace(/\s+/g, "")}`;
    const prev = findings.get(key);
    if (!card && prev && prev.title !== title) return { ...r, accepted: false, reason: `'${prev.title}'과 같은 위험입니다. 다른 위험이면 이름을 다르게 쓰세요` };
    findings.set(key, { cardId: key, title, verdict, quote, reason, question: verdict === "needs_check" ? question : "", isNew: !card, related: card ? "" : related });
    const from = card ? `규칙: ${card.status}` : "새로 찾은 위험";
    return { ...r, accepted: true, reason: `${from} → ${verdict === "covered" ? "견적이 덮음(근거 문장 확인)" : "확인 필요(질문 기록)"}` };
  }
  return tools;
}

/** 에이전트 결과를 기준선 카드에 합친다. 판정이 없는 카드는 규칙 그대로 둔다 */
export function applyInspection(baseline: Card[], run: Pick<InspectRun, "findings">): Card[] {
  const byId = new Map(run.findings.map((f) => [f.cardId, f]));
  const merged = baseline.map((c): Card => {
    const f = byId.get(c.id);
    if (!f || f.isNew) return c;
    if (f.verdict === "covered")
      return { ...c, status: "명시됨", cost: c.cost === "해당 없음" ? c.cost : "총액 포함", why: f.reason, evidence: [f.quote], ask: "", by: "agent" };
    const was = c.status === "명시됨";
    return { ...c, status: was ? "조건 모호" : c.status, cost: was ? "미확인" : c.cost, why: f.reason, evidence: f.quote ? [f.quote] : c.evidence, ask: f.question, by: "agent" };
  });
  const added = run.findings.filter((f) => f.isNew).map((f): Card => ({
    id: f.cardId, rule: "작업조건", title: f.title, mine: f.related,
    status: f.verdict === "covered" ? "명시됨" : "포함 여부 미확인", cost: f.verdict === "covered" ? "총액 포함" : "미확인",
    why: f.reason, evidence: f.quote ? [f.quote] : [], ask: f.question, refs: ["art4"], by: "agent",
    kw: [...new Set([f.title, f.related, ...f.title.split(/\s+/), canonical(f.related)].filter((w) => w.length >= 2))],
  }));
  return [...merged, ...added];
}
