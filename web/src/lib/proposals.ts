// 답변 → 카드 갱신 후보 검증. 답변 점검관(LLM)의 도구이자, 답변 점검관을 껐을 때 사용자가 직접 고른 문장도 같은 검증을 거친다 (D006 Argon#5).
// 브라우저에서도 쓰므로 Ollama·node 모듈을 import하지 않는다.
import { canonical } from "./rules.ts";
import { notPlain } from "./plain.ts";
import { amountsIn } from "./verify.ts";
import type { Card, CardStatus, Relation } from "./types.ts";

export interface Proposal { cardId: string; title: string; relation: Relation; quote: string; from: CardStatus; to: CardStatus; followUp?: string } // followUp: 조건부·상충 답에 되물을 질문 (B012)

const NEXT_STATUS: Record<Relation, CardStatus | null> = {
  explicit_answer: "명시됨",
  conditional_answer: "조건 모호",
  conflicting: "조건 모호",
  unanswered: null,
};

/** 이 카드에 대한 답이라면 답변 문구에 들어 있어야 할 낱말 */
export function keywords(card: Card): string[] {
  if (card.kw?.length) return card.kw; // 점검 에이전트가 새로 찾은 카드
  if (card.id === "item-박스") return ["박스", "상자", "잔짐"];
  if (card.id.startsWith("item-")) return [card.id.slice(5), card.title, canonical(card.title)];
  if (card.id.startsWith("stairs")) return ["계단", "층", "엘리베이터"];
  if (card.id === "ladder") return ["사다리"];
  if (card.id === "truck") return ["톤", "트럭", "차량", "용달"];
  if (card.id === "workers") return ["인원", "작업자", "기사님", "분이"];
  if (card.id.startsWith("carry")) return ["거리", "주차", "운반"];
  if (card.id === "damage") return ["파손", "분실", "배상", "보험", "보상", "변상", "깨"];
  if (card.id.startsWith("fee")) return ["추가", "비용", "별도", "요금", "금액", "만원", "천원", "더 "];
  return [card.title];
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const sentences = (text: string) => text.split(/(?<=[.!?。])\s+|\n+/).map(norm).filter(Boolean);

// ── 도구. 에이전트는 이 함수들만 부를 수 있다. 외부 전송·웹 검색 도구는 없다.
export function makeTools(cards: Card[], reply: string, total: number | null = null) {
  const open = () => cards.filter((c) => c.status !== "명시됨");
  const confirmed = () => cards.filter((c) => c.status === "명시됨");
  const proposals = new Map<string, Proposal>();
  const replyNorm = norm(reply);

  return {
    proposals,
    get_open_cards: () => ({
      cards: open().map((c) => ({ card_id: c.id, title: c.title, status: c.status, question: c.ask, evidence: c.evidence })),
      // 이미 견적서에 적힌 항목 — 답변이 이것을 뒤집으면 conflicting으로만 낼 수 있다
      confirmed: confirmed().map((c) => ({ card_id: c.id, title: c.title, evidence: c.evidence })),
    }),
    find_in_reply: ({ keywords: kws }: { keywords: string[] }) => ({
      matches: sentences(reply).filter((s) => kws.some((k) => k && s.includes(k))).slice(0, 6),
    }),
    propose_updates: ({ updates }: { updates: { card_id: string; relation: Relation; quote: string; follow_up?: string }[] }) => {
      const results = updates.map((u) => {
        const id = String(u?.card_id ?? "").replace(/\s*\(.*\)$/, ""); // 'item-책장(책장)'처럼 제목을 붙여 보내는 경우
        const card = open().find((c) => c.id === id) ?? confirmed().find((c) => c.id === id);
        if (!card) return { card_id: id, title: id, accepted: false, reason: "없는 카드입니다. get_open_cards의 card_id를 그대로 쓰세요" };
        const r = { card_id: id, title: card.title };
        if (card.status === "명시됨" && u.relation !== "conflicting" && u.relation !== "unanswered")
          return { ...r, accepted: false, reason: "이미 견적서에 적힌 항목입니다. 답변이 견적과 다를 때만 conflicting으로 내세요" };
        if (!(u.relation in NEXT_STATUS)) return { ...r, accepted: false, reason: "허용되지 않은 relation" };
        if (u.relation === "unanswered") {
          proposals.delete(card.id); // 앞 턴에 낸 후보를 정정하는 경우
          return { ...r, accepted: true, reason: "답이 없어 확인이 남은 항목으로 유지" };
        }
        const quote = norm(typeof u.quote === "string" ? u.quote : "");
        if (!quote || !replyNorm.includes(quote)) return { ...r, accepted: false, reason: "quote가 업체 답변에 그대로 있는 문장이 아닙니다" };
        if (!keywords(card).some((k) => quote.includes(k)))
          return { ...r, accepted: false, reason: `답변 문구에 '${card.title}'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered` };
        // 되묻는 문장('박스 6개 말씀하셨죠?')은 답이 아니다 (B009 평가 R20)
        if (u.relation === "explicit_answer" && /[?？]\s*$|죠\s*$|까요\s*$/.test(quote))
          return { ...r, accepted: false, reason: "질문으로 끝나는 문장은 답변이 아닙니다. 그 항목을 포함한다고 말한 문장을 내세요" };
        const blocker = u.relation === "explicit_answer" ? notPlain(quote, total) : null;
        if (blocker)
          return { ...r, accepted: false, reason: `'${blocker}' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting` };
        const to = NEXT_STATUS[u.relation]!;
        // 조건부·상충 답이면 되물을 질문을 받는다 — 업체 답변에 없는 금액은 넣지 않는다
        const fu = norm(typeof u.follow_up === "string" ? u.follow_up : "");
        const followUp = to !== "명시됨" && fu.length >= 8 && fu.length <= 160 && amountsIn(fu).every((n) => amountsIn(reply).includes(n)) ? fu : undefined;
        proposals.set(card.id, { cardId: card.id, title: card.title, relation: u.relation, quote, from: card.status, to, followUp });
        const note = to !== "명시됨" ? (followUp ? " · 되물을 질문 기록" : " · 되물을 질문(follow_up)이 없거나 형식이 맞지 않음") : "";
        return { ...r, accepted: true, reason: `${to === card.status ? `${to} 유지, 조건부 답변을 기록` : `${card.status} → ${to}`} (사용자 승인 후 반영)${note}` };
      });
      return { results };
    },
  };
}

