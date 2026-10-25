// 근거 지식 그래프 — 한 건의 이사 상태에서 노드와 링크를 만든다 (순수 함수, 화면·브라우저 의존 없음).
// 모든 노드는 상태에서 나온다: 사용자 입력 · 견적서/답변 원문 · 참고 조항 표 · 규칙이 만든 카드 · 모델 실행 기록(걸러낸 값·후보·거절).
import { AGENTS, type AgentId } from "./agents.ts";
import { inputsOf } from "./ontology.ts";
import { REFERENCES } from "./references.ts";
import { cardsOf, type CaseState } from "./store.ts";
import type { CardStatus } from "./types.ts";

export type Group = "이사" | "에이전트" | "내 입력" | "견적" | "확인 항목" | "원문 발췌" | "업체 답변" | "참고 조항" | "물을 것" | "근거 장부";
export type LedgerKind = "걸러낸 값" | "모델 읽기" | "답변 후보" | "거절된 후보";

export interface KNode {
  id: string;
  group: Group;
  label: string;
  detail?: string; // 상세 패널에 보일 원문·사유
  by: string; // 출처: 사용자 / 규칙 / LLM 모델명 / 검증기
  hub?: boolean; // 큰 라벨을 다는 중심 노드
  status?: CardStatus;
  sub?: LedgerKind; // 근거 장부 항목의 종류
  team?: string; // 에이전트 팀
}
export interface KLink { source: string; target: string; rel: string }
export interface KGraph { nodes: KNode[]; links: KLink[] }

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}초`;

export function graphOf(state: CaseState): KGraph {
  const nodes = new Map<string, KNode>();
  const links = new Map<string, KLink>();
  const add = (n: KNode) => { if (!nodes.has(n.id)) nodes.set(n.id, n); return n.id; };
  const link = (source: string, target: string, rel: string) => {
    if (nodes.has(source) && nodes.has(target)) links.set(`${source}>${target}`, { source, target, rel });
  };
  const ag = (id: AgentId) => `ag-${id}`;

  // ① 이사 허브 ② 에이전트
  add({ id: "move", group: "이사", label: "이사", detail: "이 사례의 중심. 모든 견적과 내 입력이 여기서 갈라집니다.", by: "사용자", hub: true });
  // 실행 흐름(TRITON 구조): 주 흐름은 앞 단계 → 다음 단계로 잇고, 보조 역할은 이사에 붙인다
  const main = AGENTS.filter((a) => a.main);
  for (const a of AGENTS) {
    add({ id: ag(a.id), group: "에이전트", label: `${a.step} ${a.name}`, detail: a.does, by: a.kind === "AI" ? "AI 에이전트" : "코드 에이전트", team: a.main ? "주 흐름" : "보조 역할", });
    const i = main.indexOf(a);
    if (i === 0) link("move", ag(a.id), "시작");
    else if (i > 0) link(ag(main[i - 1].id), ag(a.id), "다음 단계");
    else link("move", ag(a.id), "보조");
  }

  // ③ 내 입력 — 짐(점검표 후보 제외) · 출발지 · 도착지
  const floorText = (n: number | null) => (n === null ? "층 모름" : n < 0 ? `지하 ${-n}층` : `${n}층`);
  const addInput = (id: string, label: string, detail: string) => { add({ id, group: "내 입력", label, detail, by: "사용자" }); link("move", id, "입력"); };
  for (const i of state.items.filter((x) => !x.pending))
    addInput(`in-${i.id}`, i.name, `${i.category} · ${i.count === null ? "수량 모름" : `${i.count}개`}${i.move ? "" : " · 옮기지 않음"}`);
  for (const k of ["from", "to"] as const)
    addInput(`in-${k}`, k === "from" ? "출발지" : "도착지", `${floorText(state.cond[k].floor)} · 엘리베이터 ${state.cond[k].elevator} · 주차 거리 ${state.cond[k].parkingFar}`);
  const intakeRun = state.intake.parsed;
  if (state.intake.sentence.trim()) {
    addInput("in-sentence", "입력한 문장", state.intake.sentence);
    link(ag("intake"), "in-sentence", "읽음");
  }
  if (intakeRun) {
    const rid = add({ id: "read-intake", group: "근거 장부", sub: "모델 읽기", label: `문장 읽기 · ${intakeRun.model} · ${sec(intakeRun.ms)}`, detail: "한 문장에서 층·엘리베이터·짐 이름을 읽은 기록 (읽은 값은 사용자가 확인해야 입력이 됨)", by: `LLM ${intakeRun.model}` });
    link(ag("intake"), rid, "실행");
    intakeRun.dropped.forEach((d, n) => {
      const id = add({ id: `drop-intake-${n}`, group: "근거 장부", sub: "걸러낸 값", label: d, detail: `문장에 근거가 없어 검증기가 버린 값: ${d}`, by: "검증기" });
      link(ag("intake"), id, "걸러냄");
    });
  }

  // ④~⑩ 견적마다
  for (const q of state.quotes) {
    const qid = `q-${q.id}`;
    const title = `${q.label}${q.draft?.company ? ` · ${q.draft.company}` : ""}`;
    add({ id: qid, group: "견적", label: title, detail: q.draft ? `총액 ${q.draft.totalAmount ?? "미기재"}원 · 계약금 ${q.draft.deposit ?? "미기재"}원` : "아직 읽지 않은 견적", by: "사용자(붙여넣음)", hub: true });
    link("move", qid, "견적");
    if (!q.draft) continue;

    if (q.reader) {
      const rid = add({ id: `${q.id}:read`, group: "근거 장부", sub: "모델 읽기", label: `견적서 읽기 · ${q.reader.model} · ${sec(q.reader.ms)}`, detail: `${title}: 붙여넣은 견적서를 항목으로 읽은 기록`, by: `LLM ${q.reader.model}` });
      link(ag("reader"), rid, "실행"); link(qid, rid, "읽음");
    }
    q.dropped.forEach((d, n) => {
      const id = add({ id: `${q.id}:drop:${n}`, group: "근거 장부", sub: "걸러낸 값", label: d, detail: `${title}: 견적서 원문에 없어 검증기가 버린 모델 출력 — ${d}`, by: "검증기" });
      link(ag("verifier"), id, "걸러냄"); link(qid, id, "걸러낸 값");
    });

    const cards = cardsOf(state, q);
    const cardNode = (cardId: string) => `${q.id}:card-${cardId}`;
    for (const c of cards) {
      const cid = add({ id: cardNode(c.id), group: "확인 항목", label: c.title, detail: `${c.why}${c.mine !== "—" ? ` (내가 확인한 것: ${c.mine})` : ""}`, by: c.by === "agent" ? "점검 에이전트 (검증기 통과)" : "규칙 기준선", status: c.status });
      link(qid, cid, "확인");
      link(ag("inspector"), cid, c.by === "agent" ? (c.id.startsWith("ai-") ? "새로 찾음" : "판정") : "기준선");
      for (const inp of inputsOf(c, state.items, state.cond)) {
        if (!nodes.has(inp.id)) addInput(inp.id, inp.label, inp.detail ?? "");
        link(inp.id, cid, "대조 대상");
      }
      for (const e of c.evidence) {
        const sid = add({ id: `${q.id}:src:${e}`, group: "원문 발췌", label: e, detail: `${title} 견적서 원문에 실제로 있는 글`, by: "사용자(붙여넣은 견적서)" });
        link(cid, sid, "근거"); link(ag("reader"), sid, "읽음");
      }
      if (c.answered) {
        const aid = add({ id: `${cid}:ans`, group: "업체 답변", label: c.answered.quote, detail: c.answered.relation === "explicit_answer" ? "업체가 조건 없이 포함한다고 답함 (사용자 승인 반영)" : "조건부·상충 답변 (사용자 승인 반영)", by: "사용자 승인 + 검증기" });
        link(cid, aid, "답변"); link(ag("replycheck"), aid, "찾음");
      }
      for (const r of c.refs.filter((x) => REFERENCES[x])) {
        const rid = add({ id: `ref-${r}`, group: "참고 조항", label: REFERENCES[r].label, detail: REFERENCES[r].text, by: "조항 표(references.ts)" });
        link(cid, rid, "참고"); link(ag("docguide"), rid, "안내");
      }
      if (c.ask && c.status !== "명시됨") {
        const kid = add({ id: `${cid}:ask`, group: "물을 것", label: c.ask, detail: "확인이 남은 항목에 대해 업체에 물을 한 문장", by: c.by === "agent" ? "점검 에이전트" : "규칙 기준선(정해진 문장 틀)" });
        link(cid, kid, "질문"); link(ag("inspector"), kid, "작성");
      }
    }

    // 답변 점검관의 실행 기록: 제안(후보)과 검증기 거절
    q.runs.forEach((run, k) => {
      for (const p of run.proposals) {
        const id = add({ id: `${q.id}:run${k}:prop:${p.cardId}`, group: "근거 장부", sub: "답변 후보", label: p.quote, detail: `${p.title}: ${p.from} → ${p.to} (검증기 통과, 사용자 승인 전까지 반영 없음)`, by: `LLM ${run.model}` });
        link(ag("replycheck"), id, "제안"); link(cardNode(p.cardId), id, "후보");
      }
      run.steps.filter((s) => s.tool === "propose_updates").forEach((s, n) => {
        const results = (s.output as { results?: { card_id: string; title: string; accepted: boolean; reason: string }[] } | null)?.results ?? [];
        results.filter((r) => !r.accepted).forEach((r, m) => {
          const id = add({ id: `${q.id}:run${k}:rej:${s.n}:${n}:${m}`, group: "근거 장부", sub: "거절된 후보", label: `${r.title} — 거절`, detail: `검증기가 거절한 AI 후보: ${r.reason}`, by: "검증기" });
          link(ag("replycheck"), id, "거절됨"); link(cardNode(r.card_id), id, "거절");
        });
      });
    });
  }
  return { nodes: [...nodes.values()], links: [...links.values()] };
}

/** "AI가 무엇을 근거로 했나" 요약 — 모델 읽기 · 걸러낸 값 · 승인된 답변 · 거절된 후보 */
export function evidenceSummary(state: CaseState) {
  const reads = state.quotes.filter((q) => q.reader).length + (state.intake.parsed ? 1 : 0);
  const dropped = state.quotes.reduce((n, q) => n + q.dropped.length, 0) + (state.intake.parsed?.dropped.length ?? 0);
  const approved = state.quotes.reduce((n, q) => n + cardsOf(state, q).filter((c) => c.answered).length, 0);
  let rejected = 0;
  for (const q of state.quotes) for (const run of q.runs) for (const s of run.steps) if (s.tool === "propose_updates")
    rejected += ((s.output as { results?: { accepted: boolean }[] } | null)?.results ?? []).filter((r) => !r.accepted).length;
  return { reads, dropped, approved, rejected };
}
