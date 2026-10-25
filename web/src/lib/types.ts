import { z } from "zod";

// ── 견적서 원문(붙여넣은 글)에서 모델이 뽑는 초안. 원문에 없는 글은 코드가 버린다 (extract.ts verifyDraft).

export const quoteDraftSchema = z.object({
  company: z.string().nullable().describe("업체 이름. 없으면 null"),
  totalAmount: z.number().int().nullable().describe("총액(원). '35만'은 350000. 없으면 null"),
  deposit: z.number().int().nullable().describe("계약금(원). 없으면 null"),
  moveDate: z.string().nullable().describe("이사 날짜 원문. 없으면 null"),
  truck: z.string().nullable().describe("차량 톤수·대수 원문 그대로. 없으면 null"),
  workers: z.number().int().nullable().describe("작업 인원 수. 없으면 null"),
  ladder: z.enum(["포함", "별도", "미기재"]).describe("사다리차 비용이 총액에 포함인지"),
  stairsNote: z.string().nullable().describe("계단 작업 관련 문장 원문 그대로. 없으면 null"),
  listedItems: z.array(z.object({ name: z.string(), quote: z.string().describe("원문에 적힌 그대로") })).describe("이름이 적힌 품목"),
  blanketPhrases: z.array(z.string()).describe("'원룸 짐 일체'처럼 품목을 뭉뚱그린 문구, 원문 그대로"),
  extraFeeClauses: z.array(z.string()).describe("추가 비용이 생길 수 있다는 문장, 원문 그대로"),
  unreadable: z.array(z.string()).describe("원문에 있지만 값이 불분명한 항목 이름"),
});
export type QuoteDraft = z.infer<typeof quoteDraftSchema>;

// ── 사용자가 직접 확정한 짐. 추정으로 채우지 않는다.
export type Category = "대형가구" | "가전" | "박스·잡화";
// count가 null이면 수량 모름 — 그래도 확인 카드는 만든다 (D006 Astra#3)
// pending은 짐 점검표관이 놓은 후보 — 사용자가 확인하기 전에는 대조하지 않는다
export interface Item { id: string; name: string; category: Category; count: number | null; move: boolean; pending?: boolean }

// ── 사용자가 직접 알려 주는 현장 조건. 모르면 '모름'.
export type Tri = "있음" | "없음" | "모름";
export interface Site { floor: number | null; elevator: Tri; parkingFar: Tri }
export interface Conditions { from: Site; to: Site; ladderNeeded: Tri }

// ── 규칙이 만드는 확인 카드. 기재 상태(4종)와 비용 처리를 따로 둔다 — '이름이 적힘'과 '총액에 포함'은 다르다.
export type CardStatus = "명시됨" | "포함 여부 미확인" | "조건 모호" | "판독 불가";
export type Cost = "총액 포함" | "별도" | "미확인" | "해당 없음";
export type Rule = "품목" | "작업조건" | "추가비";
export interface Card {
  id: string;
  rule: Rule;
  title: string;
  mine: string; // 내가 확인한 내용 (예: '책장 1개 운송', '3층 · 엘리베이터 없음')
  status: CardStatus;
  cost: Cost;
  why: string;
  evidence: string[]; // 견적서·답변 원문 발췌 (원문에 실제로 있는 글만)
  ask: string; // 업체에 물을 한 문장 (명시됨이면 빈 문자열)
  refs: string[]; // 참고 조항 id (references.ts)
  answered?: { relation: Relation; quote: string; followUp?: string }; // followUp: 답변 에이전트가 쓴 되물을 질문
  by?: "agent"; // 점검 에이전트가 판정·질문을 바꿨거나 새로 찾은 카드 (inspect.ts)
  kw?: string[]; // 에이전트가 새로 찾은 카드의 답변 확인 낱말
}

export type Relation = "explicit_answer" | "conditional_answer" | "unanswered" | "conflicting";

// ── 문의 상태. 복사는 발송이 아니다 — 사용자가 '보냈음'을 눌러야 바뀐다.
export type Inquiry = "문의 전" | "보냄" | "답변 검토 대기" | "답변 반영" | "미답" | "재문의 필요";
