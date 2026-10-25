// 원문 대조 — 모델이 낸 발췌·숫자가 붙여넣은 견적서 글에 실제로 있는지 검사한다. (서버·브라우저 공용, LLM 없음)
import type { QuoteDraft } from "./types.ts";
import { notPlain } from "./plain.ts";

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
/** 원문 문장(줄·마침표·빗금 단위) — 품목·사다리 문구가 놓인 맥락을 볼 때 쓴다 */
export const sentences = (text: string) => text.split(/\n+|(?<=[.!?。])\s+|\s\/\s/).map((c) => c.trim()).filter(Boolean);

/** 원문의 금액 표기를 모두 원 단위로 읽는다: 350,000원 / 35만원 / 35만 5천원 / 3만5천원.
 *  단위도 쉼표도 없는 숫자(11월·3층·1톤)는 금액이 아니다. */
export function amountsIn(text: string): number[] {
  const t = text.replace(/\s+/g, "");
  const out: number[] = [];
  for (const m of t.matchAll(/(?<![\d,])(\d{1,4})만(?:(\d)천)?/g)) out.push(Number(m[1]) * 10000 + (m[2] ? Number(m[2]) * 1000 : 0));
  for (const m of t.matchAll(/(?<![\d,])(\d{1,3}(?:,\d{3})+|\d+)(?![\d,]|만|천)(원)?/g))
    if (m[2] || m[1].includes(",")) out.push(Number(m[1].replace(/,/g, "")));
  return out;
}

// 숫자는 '어느 항목의 숫자인지'까지 맞아야 한다 (D006 Argon#1·Astra#2: 총액↔계약금 뒤바뀜, 사다리차 별도 금액의 둔갑)
// 쉼표 금액(360,000원)은 자르지 않고, 한 구절에 총액·계약금이 같이 있으면 계약금·잔금·별도 앞에서 다시 나눈다 (B009 평가 Q03·Q07)
const clauses = (text: string) => text.split(/[\n，/()（）·]|,(?!\d{3})|(?<=[.!?。])\s/)
  .flatMap((c) => c.split(/(?=계약금|선금|예약금|가계약|잔금|별도|추가|사다리|할증)/)).filter((c) => c.trim());
const DEPOSIT = /계약금|선금|예약금|가계약/;
const NOT_TOTAL = /계약금|선금|예약금|가계약|잔금|별도|추가|사다리|할증/;
/** 그 금액이 나오는 구절 중 하나가 해당 항목의 구절인지 */
const amountFor = (n: number, text: string, ok: (clause: string) => boolean) => clauses(text).some((c) => amountsIn(c).includes(n) && ok(c));

export interface Verified { draft: QuoteDraft; dropped: string[] }

/** 원문에 없는 발췌·숫자를 걷어낸다. 걷어낸 것은 사용자에게 보여 준다. */
export function verifyDraft(text: string, d: QuoteDraft): Verified {
  const src = norm(text);
  const has = (s: string | null) => !!s && src.includes(norm(s));
  const dropped: string[] = [];
  const keep = (label: string, s: string) => (has(s) ? true : (dropped.push(`${label}: "${s}"`), false));

  // 발췌를 비워 둔 품목은 이름이 원문에 있으면 이름을 발췌로 쓴다 (실측: ax4-light가 quote를 비우는 경우)
  const items = d.listedItems
    .map((l) => (l.quote.trim() ? l : { ...l, quote: l.name }))
    .filter((l) => l.quote.trim() && keep("품목", l.quote));
  // 사다리차 포함/별도는 원문에 '사다리'가 있을 때만 인정한다 (실측: 원문에 없는데 '별도'로 지어냄)
  let ladder = d.ladder !== "미기재" && !/사다리/.test(text) ? (dropped.push(`사다리차: '${d.ladder}' (원문에 사다리 언급 없음)`), "미기재" as const) : d.ladder;
  // '포함'은 사다리 구절이 조건 없이 포함이라고 할 때만 (Argon2 #1-A: '필요 시 별도 7만원'이 '포함'으로 둔갑)
  if (ladder === "포함") {
    const line = sentences(text).find((c) => /사다리/.test(c)) ?? "";
    if (!/포함/.test(line) || notPlain(line, d.totalAmount)) { dropped.push(`사다리차: '포함' (원문 '${line}')`); ladder = /별도|추가|제외/.test(line) ? "별도" : "미기재"; }
  }

  const draft: QuoteDraft = {
    ...d,
    company: has(d.company) ? d.company : null,
    moveDate: has(d.moveDate) ? d.moveDate : null,
    truck: d.truck && keep("차량", d.truck) ? d.truck : null,
    ladder,
    stairsNote: d.stairsNote && keep("계단 문구", d.stairsNote) ? d.stairsNote : null,
    listedItems: items,
    blanketPhrases: d.blanketPhrases.filter((b) => keep("뭉뚱그린 문구", b)),
    extraFeeClauses: d.extraFeeClauses.filter((c) => keep("추가비 문구", c)),
    unreadable: [...d.unreadable],
  };
  const fits = { totalAmount: (c: string) => !NOT_TOTAL.test(c), deposit: (c: string) => DEPOSIT.test(c) };
  for (const [key, label] of [["totalAmount", "총액"], ["deposit", "계약금"]] as const) {
    const v = d[key];
    if (v !== null && !amountFor(v, text, fits[key])) {
      dropped.push(`${label}: ${v.toLocaleString("ko-KR")}원 (원문의 ${label} 자리에 없는 숫자)`);
      draft[key] = null;
      if (!draft.unreadable.includes(label)) draft.unreadable.push(label);
    }
  }
  // '1인 가구'·'2인용'의 숫자는 작업 인원이 아니다
  // '인원 2분'처럼 인원·기사·작업자와 함께 쓴 '분'도 사람 수다 (B009 평가 Q02)
  const people = new RegExp(`(?<!\\d)${d.workers}\\s*(명|인)(?!\\s*(가구|용|분|실|승))`).test(text)
    || new RegExp(`(인원|기사|작업자|직원)[^\\n\\d]{0,6}(?<!\\d)${d.workers}\\s*분`).test(text);
  if (d.workers !== null && !people) {
    dropped.push(`작업 인원: ${d.workers}명 (원문에 없는 숫자)`);
    draft.workers = null;
  }
  return { draft, dropped };
}

