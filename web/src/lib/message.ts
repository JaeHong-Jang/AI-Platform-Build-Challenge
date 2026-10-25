// 업체에 보낼 확인 요청 — 검토한 문장 틀에 카드의 질문만 끼운다. 자유 생성하지 않는다.
import type { Card, QuoteDraft } from "./types.ts";
import { won } from "./rules.ts";

export function composeRequest(cards: Card[], quote: QuoteDraft, followUp = false): string {
  const asks = cards.filter((c) => c.ask).map((c, n) => `${n + 1}. ${c.ask} 확인 부탁드립니다.`);
  if (!asks.length) return "";
  const head = followUp
    ? "답변 감사합니다. 아래 항목은 아직 확인이 안 되어 한 번 더 여쭙니다."
    : `안녕하세요. 보내 주신 견적${quote.totalAmount !== null ? `(총 ${won(quote.totalAmount)})` : ""}과 관련해 계약 전에 몇 가지 확인 부탁드립니다.`;
  return [
    head,
    "",
    ...asks,
    "",
    "별도 비용이 있다면 항목·발생 조건·금액(또는 산정 방식)을 계약 전에 적어 주세요.",
    "작업 중 바뀌는 내용이 생기면 작업 전에 사유와 금액을 알려 주시고, 확인받은 뒤 진행해 주시면 좋겠습니다.",
    "감사합니다.",
  ].join("\n");
}

// 사용자가 문구를 고친 뒤에도 보내기 전에 걸러낸다. (맛대패스 wording-guard 방식)
const GUARD: [RegExp, string, string][] = [
  [/위법|불법|무효/, "법적 단정", "업체와 관계가 틀어질 수 있고, 계약 조건에 따라 달라질 수 있어요. '확인 부탁드립니다'로 바꿔 보세요."],
  [/신고(하|할)|고소|소송/, "위협 표현", "확인 요청 단계에서는 중립적인 표현이 답을 받기 쉬워요."],
  [/무조건|반드시|절대/, "단정 부사", "조건을 묻는 문장으로 바꿔 보세요."],
  [/합의(했|된|완료)|확정(됐|된|입니다)/, "합의 단정", "업체 답변 전에는 합의된 것으로 쓰지 않아요."],
];

export function guard(text: string): { phrase: string; kind: string; fix: string }[] {
  return GUARD.flatMap(([re, kind, fix]) => {
    const m = text.match(re);
    return m ? [{ phrase: m[0], kind, fix }] : [];
  });
}
