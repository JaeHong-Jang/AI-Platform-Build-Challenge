// 대조 규칙 — 판정은 여기서만 한다. LLM을 부르지 않는다.
// 규칙 3개: ① 짐 품목 포함 여부 ② 작업조건·차량·인원·장비 기재 여부 ③ 추가비 발생 조건 확인
import type { Card, Conditions, Item, QuoteDraft, Site } from "./types.ts";
import { notPlain } from "./plain.ts";
import { sentences, verifyDraft } from "./verify.ts";

// 같은 물건의 다른 이름만 묶는다. 앞의 낱말이 대표 이름. (책상≠식탁, 옷장≠행거, TV≠모니터)
// 긴 이름이 먼저 걸리도록 '티비선반' 같은 복합어는 앞 그룹에 둔다.
const SYNONYMS = [
  ["티비선반", "tv선반", "티비장", "tv장", "거실장"],
  ["책장", "책꽂이", "선반장"],
  ["침대", "침대프레임"],
  ["매트리스"],
  ["책상", "데스크", "컴퓨터책상"],
  ["식탁", "테이블"],
  ["의자"],
  ["옷장"],
  ["행거"],
  ["냉장고"],
  ["세탁기"],
  ["전자레인지"],
  ["소파", "쇼파"],
  ["텔레비전", "tv", "티비"],
  ["모니터"],
  ["건조기"],
  ["에어컨"],
  ["박스", "상자", "짐박스", "이삿짐박스"],
];
const SIZE_WORDS = /(싱글|슈퍼싱글|퀸|킹|소형|중형|대형|미니|원룸용|1인용|2인용|\d+\s*(인치|단|칸|도어|kg|l|리터))/g;

export function canonical(name: string): string {
  const n = name.toLowerCase().replace(SIZE_WORDS, "").replace(/\s+/g, "");
  for (const group of SYNONYMS) if (group.some((w) => n.includes(w))) return group[0];
  return n;
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

// 원문에서 확인되지 않은 값 — 사용자가 직접 입력했거나 모델이 지어낸 값. '견적서에 적혀 있음'으로 쓰지 않는다 (D006 Argon#5)
type Manual = { truck: boolean; workers: boolean; ladder: boolean; stairs: boolean; items: Set<string> };
const NO_MANUAL: Manual = { truck: false, workers: false, ladder: false, stairs: false, items: new Set() };
const MANUAL_WHY = "직접 입력한 값입니다. 붙여넣은 견적서 원문에서는 확인되지 않습니다.";

function manualOf(quote: QuoteDraft, src: string | undefined): Manual {
  if (src === undefined) return NO_MANUAL;
  const v = verifyDraft(src, quote).draft;
  return {
    truck: quote.truck !== null && v.truck === null,
    workers: quote.workers !== null && v.workers === null,
    ladder: quote.ladder !== "미기재" && v.ladder !== quote.ladder,
    stairs: quote.stairsNote !== null && v.stairsNote === null,
    items: new Set(quote.listedItems.filter((l) => !v.listedItems.some((x) => x.name === l.name)).map((l) => canonical(l.name))),
  };
}

function itemCards(items: Item[], quote: QuoteDraft, manual: Manual, src?: string): Card[] {
  const cards: Card[] = [];
  const moving = items.filter((i) => i.move && !i.pending && (i.count === null || i.count > 0) && i.name.trim());
  const blanket = quote.blanketPhrases[0];

  const judge = (key: string, title: string, label: string, count: number | null): Card => {
    const listed = quote.listedItems.find((l) => canonical(l.name) === key);
    const base = { id: `item-${key}`, rule: "품목" as const, title, mine: `${label} 운송`, refs: ["art4"] };
    if (listed && manual.items.has(key))
      return { ...base, status: "포함 여부 미확인", cost: "미확인", why: MANUAL_WHY, evidence: [], ask: `${label}도 총액에 포함된 운송 대상인지 (견적서에 적어 주실 수 있는지)` };
    if (listed) {
      // 이름이 적혀 있어도 '별도·제외'·'협의 후 결정'·'직접 옮기세요'가 붙었거나 수량이 다르면 포함으로 보지 않는다 (D006 Astra#1)
      // 발췌가 이름뿐이어도 원문에서 그 품목이 놓인 문장의 조건을 본다 (Argon2 #1-B)
      // 그 품목 이름이 나오는 모든 문장을 본다 — 품목 줄과 다른 줄의 '분해 시 별도 협의'도 그 품목의 조건이다 (B009 평가 Q14)
      const ctx = src ? sentences(src).filter((c) => c.includes(listed.quote.trim() || listed.name) || c.includes(title) || c.includes(key)).find((c) => notPlain(c, quote.totalAmount)) : undefined;
      const cond = notPlain(listed.quote, null) ?? (ctx ? notPlain(ctx, quote.totalAmount) : null);
      if (cond) {
        const out = /별도|제외|불가|미포함|비포함|추가|직접|본인|고객/.test(cond);
        return { ...base, status: "조건 모호", cost: out ? "별도" : "미확인", why: `견적서에 '${ctx && !notPlain(listed.quote, null) ? ctx : listed.quote}'로 적혀 있어 총액에 포함된다고 볼 수 없습니다.`, evidence: [ctx && !notPlain(listed.quote, null) ? ctx : listed.quote], ask: `${label}의 운송 비용이 얼마이고 총액에 포함되는지` };
      }
      const n = listed.quote.match(/(\d+)\s*(개|대|짝|세트|ea)/i);
      if (n && count !== null && Number(n[1]) !== count)
        return { ...base, status: "조건 모호", cost: "미확인", why: `견적서에는 '${listed.quote}'(${n[1]}개)인데 옮길 짐은 ${count}개입니다.`, evidence: [listed.quote], ask: `${label} 전부가 총액에 포함되는지` };
      return { ...base, status: "명시됨", cost: "총액 포함", why: `견적서에 '${listed.quote}'로 적혀 있습니다.`, evidence: [listed.quote], ask: "" };
    }
    if (blanket)
      return { ...base, status: "조건 모호", cost: "미확인", why: `'${blanket}'처럼 뭉뚱그린 문구만 있어 ${label}가 포함되는지 문서만으로는 확인하기 어렵습니다.`, evidence: [blanket], ask: `${label}도 총액에 포함된 운송 대상인지` };
    return { ...base, status: "포함 여부 미확인", cost: "미확인", why: `견적서에 ${title}이(가) 적혀 있지 않습니다.`, evidence: [], ask: `${label}도 총액에 포함된 운송 대상인지` };
  };

  // 같은 물건(대표 이름이 같은 것)은 한 카드로 합친다 — 카드 id가 겹치지 않는다.
  const groups = new Map<string, Item[]>();
  for (const i of moving.filter((x) => x.category !== "박스·잡화")) {
    const key = canonical(i.name);
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  // 하나라도 수량을 모르면 합계도 모름
  const total = (g: Item[]) => (g.some((i) => i.count === null) ? null : g.reduce((s, i) => s + (i.count ?? 0), 0));
  for (const [key, g] of groups) {
    const count = total(g);
    const title = g.length === 1 ? g[0].name : key;
    cards.push(judge(key, title, count === null ? `${title} (수량 모름)` : `${title} ${count}개`, count));
  }
  const boxes = moving.filter((i) => i.category === "박스·잡화");
  const boxCount = total(boxes);
  if (boxes.length) cards.push(judge("박스", "박스·잡화", boxCount === null ? "박스·잡화 (수량 모름)" : `박스·잡화 약 ${boxCount}개`, boxCount));
  return cards;
}

const floorText = (s: Site) => (s.floor === null ? "층수 모름" : s.floor < 0 ? `지하 ${-s.floor}층` : `${s.floor}층`);
const siteText = (s: Site) => `${floorText(s)} · 엘리베이터 ${s.elevator}`;

function siteCards(quote: QuoteDraft, cond: Conditions, manual: Manual): Card[] {
  const cards: Card[] = [];
  const stated = (id: string, title: string, mine: string, text: string): Card =>
    ({ id, rule: "작업조건", title, mine, status: "명시됨", cost: "해당 없음", why: `견적서에 '${text}'로 적혀 있습니다.`, evidence: [text], ask: "", refs: ["art4"] });
  const missing = (id: string, title: string, mine: string, why: string, ask: string, refs = ["art4"]): Card =>
    ({ id, rule: "작업조건", title, mine, status: "포함 여부 미확인", cost: "미확인", why, evidence: [], ask, refs });

  cards.push(manual.truck ? missing("truck", "차량", `직접 입력: ${quote.truck}`, MANUAL_WHY, "배차되는 차량의 톤수와 대수를 견적서에 적어 주실 수 있는지")
    : quote.truck ? stated("truck", "차량", "—", quote.truck) : missing("truck", "차량", "—", "차량 톤수·대수가 적혀 있지 않습니다. 당일 '차가 부족하다'며 추가 차량을 요구받는 경우가 많습니다.", "배차되는 차량의 톤수와 대수"));
  cards.push(manual.workers ? missing("workers", "작업 인원", `직접 입력: ${quote.workers}명`, MANUAL_WHY, "작업 인원을 견적서에 적어 주실 수 있는지")
    : quote.workers !== null ? stated("workers", "작업 인원", "—", `${quote.workers}명`) : missing("workers", "작업 인원", "—", "작업 인원이 적혀 있지 않습니다.", "작업 인원이 몇 명인지"));

  for (const [key, label, site] of [["from", "출발지", cond.from], ["to", "도착지", cond.to]] as const) {
    if (!needsStairs(site)) continue;
    const where = `${label} ${floorText(site)}`;
    const lift = site.elevator === "없음" ? "엘리베이터 없음" : "엘리베이터 사용 여부 모름";
    // 계단 문구가 그 집(출발/도착)을 짚고 조건 없이 '포함'이라고 하면 명시됨 — 자세히 적은 견적이 불리하지 않게 (Astra#4)
    const note = quote.stairsNote;
    const plainHere = note && /포함/.test(note) && !notPlain(note, null) && (key === "from" ? /출발|현\s*집|지금/ : /도착|새\s*집/).test(note);
    if (plainHere && !manual.stairs) { cards.push({ ...stated(`stairs-${key}`, `${label} 계단 작업`, siteText(site), note), cost: "총액 포함" }); continue; }
    cards.push(
      quote.stairsNote
        ? { id: `stairs-${key}`, rule: "작업조건", title: `${label} 계단 작업`, mine: siteText(site), status: "조건 모호", cost: "미확인", why: `계단 관련 문구는 있지만, ${where}(${lift}) 계단 작업이 총액에 포함되는지는 문구만으로 확인하기 어렵습니다.`, evidence: [quote.stairsNote], ask: `${where} 계단 작업(${lift})이 총액에 포함되는지`, refs: ["art4"] }
        : missing(`stairs-${key}`, `${label} 계단 작업`, siteText(site), `${where}이고 ${lift}인데, 계단 작업에 대한 내용이 견적서에 없습니다.`, `${where} 계단 작업(${lift})이 총액에 포함되는지`),
    );
  }

  const ladderMine = `필요 여부: ${cond.ladderNeeded}`;
  if (manual.ladder) cards.push(missing("ladder", "사다리차", ladderMine, MANUAL_WHY, "사다리차 비용이 총액에 포함되는지 견적서에 적어 주실 수 있는지", ["art4", "art8-2"]));
  else if (quote.ladder === "포함") cards.push({ ...stated("ladder", "사다리차", ladderMine, "사다리차 포함"), cost: "총액 포함" });
  else if (quote.ladder === "별도")
    cards.push({ id: "ladder", rule: "작업조건", title: "사다리차", mine: ladderMine, status: "조건 모호", cost: "별도", why: "사다리차가 '별도'라고만 되어 있고 금액이나 사용 조건이 없습니다.", evidence: [], ask: "사다리차를 쓰게 되면 비용이 얼마이고 어떤 경우에 쓰는지", refs: ["art4", "art8-2"] });
  else if (cond.ladderNeeded === "있음" || (cond.ladderNeeded === "모름" && needsLadderQuestion(cond)))
    cards.push(missing("ladder", "사다리차", ladderMine, "사다리차가 필요할 수 있는 조건인데 견적서에 사다리차 내용이 없습니다.", "사다리차가 필요한지, 필요하면 비용이 총액에 포함되는지", ["art4", "art8-2"]));

  for (const [key, label, site] of [["from", "출발지", cond.from], ["to", "도착지", cond.to]] as const)
    if (site.parkingFar === "있음")
      cards.push(missing(`carry-${key}`, `${label} 운반 거리`, "차 대는 곳이 멂", `${label}에서 차를 대는 곳이 멀다고 하셨는데, 운반 거리에 대한 내용이 견적서에 없습니다.`, `${label}의 차량 정차 위치가 멀어도 추가 비용이 없는지`));
  return cards;
}

function feeCards(quote: QuoteDraft): Card[] {
  if (!quote.extraFeeClauses.length)
    return [{ id: "fee-none", rule: "추가비", title: "당일 추가 비용 조건", mine: "—", status: "포함 여부 미확인", cost: "미확인", why: "추가 비용이 생기는 경우에 대한 문구가 없습니다. 당일 짐 양·건물 구조를 이유로 추가 비용을 요구하는 사례가 가장 흔합니다.", evidence: [], ask: "당일 추가 비용이 생길 수 있는 경우가 있다면 항목과 금액", refs: ["art8-2", "art8-3"] }];
  return quote.extraFeeClauses.map((c, n) => ({
    id: `fee-${n}`, rule: "추가비" as const, title: "추가 비용 문구", mine: "—", status: "조건 모호" as const, cost: "미확인" as const,
    why: "추가 비용이 생길 수 있다는 문구는 있지만, 어떤 경우에 얼마가 붙는지는 적혀 있지 않습니다.",
    evidence: [c], ask: "어떤 경우에 얼마가 추가되는지 항목·조건·금액(또는 산정 방식)", refs: ["art5-3", "art8-2", "art8-3"],
  }));
}

// 사용자가 직접 채운 값은 더 이상 '판독 불가'가 아니다.
const FILLED: Record<string, (q: QuoteDraft) => boolean> = {
  총액: (q) => q.totalAmount !== null,
  계약금: (q) => q.deposit !== null,
  차량: (q) => q.truck !== null,
  인원: (q) => q.workers !== null,
  "작업 인원": (q) => q.workers !== null,
  이사일: (q) => q.moveDate !== null,
};

function unreadableCards(quote: QuoteDraft): Card[] {
  const fields = quote.unreadable.filter((f) => !FILLED[f]?.(quote));
  if (quote.totalAmount === null && !fields.includes("총액")) fields.unshift("총액");
  return fields.map((f) => ({
    id: `unread-${f}`, rule: "작업조건" as const, title: f, mine: "—", status: "판독 불가" as const, cost: "미확인" as const,
    why: `견적서에서 '${f}'을(를) 확인하지 못했습니다. 직접 입력하거나 업체에 다시 물어볼 수 있어요.`,
    evidence: [], ask: `견적서의 '${f}'을(를) 다시 알려 주실 수 있는지`, refs: [],
  }));
}

// 깨지기 쉬운 짐 — 이름으로만 고른다 (파손 대비 질문에 넣는다)
const FRAGILE = /TV|티비|텔레비전|모니터|컴퓨터|유리|거울|액자|도자기|화분|조명|피아노/i;
const DAMAGE_WORDS = /보험|배상|파손|분실|훼손|변상|보상/;

/** 파손·분실 대비 (B013, 피해 유형 1위 47.7%): 견적서에 배상 기준·이사화물배상책임보험이 적혔는지. 계약 전에 확인할 수 있는 몫만 본다 */
function damageCard(items: Item[], quote: QuoteDraft, src?: string): Card {
  const fragile = items.filter((i) => i.move && !i.pending && FRAGILE.test(i.name)).map((i) => i.name);
  const base = { id: "damage", rule: "작업조건" as const, title: "파손·분실 배상", mine: fragile.length ? `깨지기 쉬운 짐: ${fragile.join(", ")}` : "—", refs: ["kca-ins"] };
  const ask = `짐이 파손·분실되면 어떻게 배상하는지, 이사화물배상책임보험에 가입돼 있는지${fragile.length ? `, ${fragile.join("·")}은(는) 어떻게 포장하는지` : ""} 견적서에 적어 주실 수 있는지`;
  const line = src ? sentences(src).find((c) => DAMAGE_WORDS.test(c)) : undefined;
  // 배상하지 않는다·책임 없음 같은 면책 문구는 배상 기준이 있는 것이 아니다 (Sonnet B013 리뷰 #4)
  if (line && /않|없|면책|불가|제외|증명해야|입증해야/.test(line))
    return { ...base, status: "조건 모호", cost: "별도", why: `견적서에 '${line}'로 적혀 있어 파손·분실 때 배상받기 어려울 수 있습니다. 어떤 경우에 배상하지 않는지 확인이 필요합니다.`, evidence: [line], ask };
  if (line && !notPlain(line, quote.totalAmount))
    return { ...base, status: "명시됨", cost: "해당 없음", why: `견적서에 '${line}'로 적혀 있습니다.`, evidence: [line], ask: "" };
  if (line)
    return { ...base, status: "조건 모호", cost: "미확인", why: `파손·배상 문구('${line}')에 조건이 붙어 있어 어떤 경우에 어떻게 배상하는지 확인이 필요합니다.`, evidence: [line], ask };
  return { ...base, status: "포함 여부 미확인", cost: "미확인", why: "파손·분실 시 배상 기준이나 보험 가입 내용이 견적서에 없습니다. 이사 피해구제 신청에서 가장 많은 유형이 물품 파손·분실입니다.", evidence: [], ask };
}

/** 계단 작업이 생길 수 있는 층: 2층 이상이나 지하이고, 엘리베이터가 없거나 모를 때 */
function needsStairs(s: Site): boolean {
  return s.floor !== null && (s.floor >= 2 || s.floor < 0) && s.elevator !== "있음";
}

/** 사다리차 필요 여부를 물어야 하는 조건: 3층 이상인데 엘리베이터를 쓸 수 있는지 확실하지 않음 */
function needsLadderQuestion(cond: Conditions): boolean {
  return [cond.from, cond.to].some((s) => s.floor !== null && s.floor >= 3 && s.elevator !== "있음");
}

/** src(붙여넣은 견적서 원문)를 주면, 원문에서 확인되지 않는 값은 '명시됨'으로 판정하지 않는다 */
export function compare(items: Item[], quote: QuoteDraft, cond: Conditions, src?: string): Card[] {
  const manual = manualOf(quote, src);
  return [...unreadableCards(quote), ...itemCards(items, quote, manual, src), ...siteCards(quote, cond, manual), ...feeCards(quote), damageCard(items, quote, src)];
}

/** 사용자만 아는 사실 중 비어 있는 것 — 대시보드가 먼저 묻는다. (고정 항목이라 에이전트가 필요 없다) */
export function missingFacts(cond: Conditions, items: Item[]): string[] {
  const out: string[] = [];
  if (!items.some((i) => i.move && !i.pending && (i.count === null || i.count > 0))) out.push("옮길 짐 목록");
  for (const [label, s] of [["출발지", cond.from], ["도착지", cond.to]] as const) {
    if (s.floor === null) out.push(`${label} 층수`);
    else if (s.elevator === "모름") out.push(`${label} 엘리베이터 사용 여부`);
  }
  if (needsLadderQuestion(cond) && cond.ladderNeeded === "모름") out.push("사다리차 필요 여부");
  return out;
}

export const summary = (q: QuoteDraft) => [q.company, q.totalAmount !== null ? won(q.totalAmount) : null].filter(Boolean).join(" · ");
export { won };
