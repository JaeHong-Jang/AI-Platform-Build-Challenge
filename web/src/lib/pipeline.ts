// 작업 보고 — 에이전트마다 실제로 만든 결과를 상태에서 계산한다 (LLM 없음, 지어낸 진행 없음).
// 홈 장면은 실행 흐름 순서대로 '작동 중 → 완료'를 재생한다. 판정 자체는 이미 끝나 있고 재생은 보여 주는 순서일 뿐이다.
import { AGENTS, isOn, type AgentId } from "./agents.ts";
import { DOCS } from "./docs.ts";
import { inspectSig } from "./inspect.ts";
import type { CaseState, QuoteEntry } from "./store.ts";
import type { Card } from "./types.ts";

export type Outcome = "완료" | "입력 없음" | "꺼짐";
export interface Report { id: AgentId; outcome: Outcome; output: string; source: string }

/** 실행 흐름 순서 (TRITON ControlPipeline처럼 고정) */
export const ORDER: AgentId[] = AGENTS.map((a) => a.id);

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}초`;

export function reports(s: CaseState, q: QuoteEntry | null, cards: Card[]): Report[] {
  const read = s.quotes.filter((x) => x.draft);
  const llmReads = read.filter((x) => x.reader && x.reader.ms > 0);
  const open = cards.filter((c) => c.status !== "명시됨");
  const runs = s.quotes.flatMap((x) => x.runs);
  const mine = s.items.filter((i) => !i.pending && i.move);
  const out = (id: AgentId): Report => {
    switch (id) {
      case "intake": return s.intake.parsed
        ? { id, outcome: "완료", output: `한 문장에서 조건을 읽음 · ${sec(s.intake.parsed.ms)}${s.intake.parsed.dropped.length ? ` · 문장에 없어 버린 값 ${s.intake.parsed.dropped.length}개` : ""}`, source: s.intake.parsed.model }
        : { id, outcome: "입력 없음", output: "문장 없이 칩으로 시작함", source: "—" };
      case "itemlist": return { id, outcome: "완료", output: `확인한 짐 ${mine.length}종 · 확인 대기 후보 ${s.items.filter((i) => i.pending).length}개`, source: "코드 (수량·부피 추정 없음)" };
      case "docguide": return { id, outcome: "완료", output: `받을 서류 ${DOCS.length}종 · 기재 항목 ${DOCS.reduce((n, d) => n + d.items.length, 0)}개`, source: "표준약관 제4·5조" };
      case "reader": return read.length
        ? { id, outcome: "완료", output: `견적 ${read.length}건 읽음${llmReads.length ? ` · 평균 ${sec(llmReads.reduce((n, x) => n + x.reader!.ms, 0) / llmReads.length)}` : ""} · 모델이 낸 값은 원문 검증관에게 넘김`, source: llmReads[0]?.reader?.model ?? read[0].reader?.model ?? "직접 입력" }
        : { id, outcome: "입력 없음", output: "아직 받은 견적이 없음", source: "—" };
      case "verifier": return read.length
        ? { id, outcome: "완료", output: `견적 ${read.length}건 원문 대조 · 원문에 없어 버린 값 ${read.reduce((n, x) => n + x.dropped.length, 0)}개`, source: "코드 (verify.ts 원문 대조)" }
        : { id, outcome: "입력 없음", output: "견적서를 읽으면 원문과 대조함", source: "—" };
      case "inspector": {
        const ins = q?.inspection;
        const fresh = !!ins && !!q?.draft && ins.sig === inspectSig(s.items, s.cond, q.quoteText);
        const nNew = cards.filter((c) => c.id.startsWith("ai-")).length;
        if (!q?.draft) return { id, outcome: "완료", output: `견적 전 · 규칙 기준선으로 확인 항목 ${cards.length}개 · 질문 ${open.filter((c) => c.ask).length}개`, source: "규칙 기준선" };
        if (!fresh) return { id, outcome: "완료", output: `기본 항목만 점검됨(규칙 기준선) · 확인 남음 ${open.length}${ins ? " · 짐·조건이 바뀌어 다시 점검 필요" : ""}`, source: "규칙 기준선" };
        return { id, outcome: "완료", output: `도구 ${ins!.steps.length}회 · 판정 ${ins!.findings.filter((f) => !f.isNew).length} · 새로 찾은 위험 ${nNew} · 확인 남음 ${open.length} · 질문 ${open.filter((c) => c.ask).length}개 · ${sec(ins!.ms)}${ins!.stopped !== "finished" ? ` · ${ins!.note}` : ""}`, source: ins!.model };
      }
      case "picker": return read.length > 1
        ? { id, outcome: "완료", output: `견적 ${read.length}건을 같은 항목으로 나란히 놓음 (순위 없음)`, source: "코드" }
        : { id, outcome: "입력 없음", output: "견적이 2건 이상이면 나란히 놓음", source: "—" };
      case "replycheck": return runs.length
        ? { id, outcome: "완료", output: `답변 ${runs.length}회 점검 · 후보 ${runs.reduce((n, r) => n + r.proposals.length, 0)}개 · 도구 ${runs.reduce((n, r) => n + r.steps.length, 0)}회`, source: runs[runs.length - 1].model }
        : { id, outcome: "입력 없음", output: "업체 답변을 붙여 넣으면 점검함", source: "—" };
      case "responder": return s.incidents?.length
        ? { id, outcome: "완료", output: `사고 대응 ${s.incidents.length}건 · 마지막: ${s.incidents[s.incidents.length - 1].situation}${s.incidents[s.incidents.length - 1].plan ? " · 대응 계획 작성" : " · 근거 목록만"}`, source: s.incidents[s.incidents.length - 1].model }
        : { id, outcome: "입력 없음", output: "이사 당일·이후 문제가 생기면 '사고 대응'에서 실행", source: "—" };
      case "contract": return s.chosen || s.contractText.trim()
        ? { id, outcome: "완료", output: s.contractText.trim() ? "계약서 기재 항목·계약금 비율 점검" : "고른 견적의 계약금 비율 점검", source: "표준약관 제5·6조" }
        : { id, outcome: "입력 없음", output: "견적을 고르거나 계약서를 넣으면 점검함", source: "—" };
    }
  };
  return ORDER.map((id) => (!isOn(id, s.agents) ? { id, outcome: "꺼짐" as const, output: AGENTS.find((a) => a.id === id)!.off, source: "—" } : out(id)));
}
