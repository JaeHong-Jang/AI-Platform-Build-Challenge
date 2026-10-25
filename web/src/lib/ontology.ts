// 근거 온톨로지 (D006 K8) — 무엇이 무엇의 근거인지. TRITON agents/ontology.yaml + evidenceLayout의 4열 사슬을 이사 도메인으로 옮겼다.
// 그래프의 모든 노드는 사용자 입력 · 견적서/답변 원문 · 참고 조항 표 · 규칙이 만든 카드 중 하나에서 나온다. 모델이 노드를 만들지 않는다.
import { canonical } from "./rules.ts";
import { REFERENCES } from "./references.ts";
import type { Card, CardStatus, Conditions, Item } from "./types.ts";

export type NodeClass = "내 입력" | "확인 항목" | "견적서 원문" | "업체 답변" | "원문 없음" | "참고 조항" | "업체에 물을 것";
export type Relation = "대조 대상" | "근거" | "답변" | "근거 없음" | "참고" | "질문";

/** 클래스와 관계 정의 — 화면 범례와 시험이 같은 표를 쓴다 */
export const ONTOLOGY: { cls: NodeClass; from: string; desc: string }[] = [
  { cls: "내 입력", from: "사용자", desc: "내가 확인한 짐·층·엘리베이터·주차 (추정 없음)" },
  { cls: "확인 항목", from: "견적 대조관(규칙)", desc: "짐·작업 조건·추가비마다 하나. 기재 상태 4종" },
  { cls: "견적서 원문", from: "붙여넣은 견적서", desc: "원문에 실제로 있는 글만 (원문 대조 통과)" },
  { cls: "업체 답변", from: "붙여넣은 답변 + 사용자 승인", desc: "검증기를 통과하고 사용자가 승인한 문장" },
  { cls: "원문 없음", from: "규칙", desc: "견적서에 해당하는 글이 없다는 사실 자체" },
  { cls: "참고 조항", from: "참고 조항 표 (법제처 생활법령 설명)", desc: "이사화물 표준약관 설명 (법률 자문 아님)" },
  { cls: "업체에 물을 것", from: "문의 작성관(규칙)", desc: "확인이 남은 항목의 한 문장 질문" },
];

export interface GNode { id: string; cls: NodeClass; label: string; detail?: string; status?: CardStatus }
export interface GEdge { from: string; to: string; rel: Relation }
export interface Chain { cols: GNode[][]; edges: GEdge[] }

const floorText = (n: number | null) => (n === null ? "층 모름" : n < 0 ? `지하 ${-n}층` : `${n}층`);

/** 이 카드를 만든 사용자 입력 */
export function inputsOf(card: Card, items: Item[], cond: Conditions): GNode[] {
  if (card.id.startsWith("item-")) {
    const key = card.id.slice(5);
    return items.filter((i) => i.move && !i.pending && (key === "박스" ? i.category === "박스·잡화" : canonical(i.name) === key))
      .map((i) => ({ id: `in-${i.id}`, cls: "내 입력" as const, label: i.name, detail: i.count === null ? "수량 모름" : `${i.count}개` }));
  }
  const site = (k: "from" | "to") => ({ id: `in-${k}`, cls: "내 입력" as const, label: k === "from" ? "출발지" : "도착지", detail: `${floorText(cond[k].floor)} · 엘베 ${cond[k].elevator}` });
  if (card.id === "stairs-from" || card.id === "carry-from") return [site("from")];
  if (card.id === "stairs-to" || card.id === "carry-to") return [site("to")];
  if (card.id === "ladder") return [site("from"), site("to"), { id: "in-ladder", cls: "내 입력", label: "사다리차 필요", detail: cond.ladderNeeded }];
  return []; // 차량·인원·추가비·판독 불가는 견적서 쪽 항목이다
}

/** 확인 항목 하나의 근거 사슬: 내 입력 → 확인 항목 → 원문(또는 없음)·답변 → 조항·질문 */
export function chainOf(card: Card, items: Item[], cond: Conditions): Chain {
  const c: GNode = { id: `card-${card.id}`, cls: "확인 항목", label: card.title, detail: card.mine !== "—" ? card.mine : undefined, status: card.status };
  const ins = inputsOf(card, items, cond);
  const src: GNode[] = card.evidence.map((e, n) => ({ id: `src-${n}`, cls: "견적서 원문", label: e }));
  if (!src.length) src.push({ id: "src-none", cls: "원문 없음", label: "견적서에 해당하는 글이 없음" });
  if (card.answered) src.push({ id: "ans", cls: "업체 답변", label: card.answered.quote, detail: card.answered.relation === "explicit_answer" ? "조건 없이 포함" : "조건부·상충" });
  const out: GNode[] = card.refs.filter((r) => REFERENCES[r]).map((r) => ({ id: `ref-${r}`, cls: "참고 조항", label: REFERENCES[r].label, detail: REFERENCES[r].text }));
  if (card.ask && card.status !== "명시됨") out.push({ id: "ask", cls: "업체에 물을 것", label: card.ask });
  const edges: GEdge[] = [
    ...ins.map((n) => ({ from: n.id, to: c.id, rel: "대조 대상" as const })),
    ...src.map((n) => ({ from: c.id, to: n.id, rel: (n.cls === "업체 답변" ? "답변" : n.cls === "원문 없음" ? "근거 없음" : "근거") as Relation })),
    ...out.map((n) => ({ from: c.id, to: n.id, rel: (n.cls === "참고 조항" ? "참고" : "질문") as Relation })),
  ];
  return { cols: [ins, [c], src, out], edges };
}
