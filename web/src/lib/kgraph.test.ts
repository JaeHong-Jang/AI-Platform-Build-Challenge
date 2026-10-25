// 근거 지식 그래프: 노드는 상태에서만 나오고, 링크는 끊기지 않으며, 원문 발췌는 실제 견적서에 있는 글이다
import { test } from "node:test";
import assert from "node:assert/strict";
import { evidenceSummary, graphOf } from "./kgraph.ts";
import { EMPTY_CASE, newQuote, type CaseState } from "./store.ts";
import { QUOTE_DRAFT, QUOTE_DRAFT_B, SAMPLE_CONDITIONS, SAMPLE_ITEMS, SAMPLE_QUOTE_TEXT, SAMPLE_QUOTE_TEXT_B, SAMPLE_REPLY } from "./fixtures.ts";
import { AGENTS } from "./agents.ts";
import type { AgentRun } from "./agent.ts";

const run: AgentRun = {
  model: "qwen-test", stopped: "finished", note: "", open: [],
  proposals: [{ cardId: "item-책장", title: "책장", relation: "explicit_answer", quote: "책장이랑 책상 의자 다 포함이에요.", from: "포함 여부 미확인", to: "명시됨" }],
  steps: [{ n: 1, tool: "propose_updates", input: {}, ms: 10, output: { results: [{ card_id: "item-책상", title: "책상", accepted: false, reason: "quote가 업체 답변에 그대로 있는 문장이 아닙니다" }] } }],
};
const qa = newQuote(0, { quoteText: SAMPLE_QUOTE_TEXT, draft: QUOTE_DRAFT, dropped: ["식기세척기 (원문에 없음)"], reader: { model: "ax4-light", ms: 4200 }, reply: SAMPLE_REPLY, runs: [run] });
const qb = newQuote(1, { quoteText: SAMPLE_QUOTE_TEXT_B, draft: QUOTE_DRAFT_B, reader: { model: "ax4-light", ms: 3100 } });
const state: CaseState = { ...EMPTY_CASE, started: true, items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS, quotes: [qa, qb], active: qa.id };
const g = graphOf(state);
const count = (grp: string) => g.nodes.filter((n) => n.group === grp).length;

test("노드 무리별 개수: 이사 1 · 에이전트 10 · 견적 2 · 짐+출발·도착 입력", () => {
  assert.equal(count("이사"), 1);
  assert.equal(count("에이전트"), AGENTS.length);
  assert.equal(count("견적"), 2);
  assert.ok(count("내 입력") >= SAMPLE_ITEMS.length + 2);
  assert.ok(count("확인 항목") > 0 && count("원문 발췌") > 0 && count("참고 조항") > 0 && count("물을 것") > 0);
  assert.equal(new Set(g.nodes.map((n) => n.id)).size, g.nodes.length); // id 유일
});

test("모든 링크의 양끝 노드가 존재한다", () => {
  const ids = new Set(g.nodes.map((n) => n.id));
  for (const l of g.links) assert.ok(ids.has(l.source) && ids.has(l.target), `${l.source} → ${l.target}`);
});

test("원문 발췌 노드의 글은 그 견적서 원문에 실제로 있다", () => {
  for (const n of g.nodes.filter((x) => x.group === "원문 발췌")) {
    const qid = n.id.split(":")[0];
    const q = state.quotes.find((x) => x.id === qid)!;
    assert.ok(q.quoteText.includes(n.label), n.label);
  }
});

test("같은 조항은 노드 하나로 합쳐진다", () => {
  const refs = g.nodes.filter((n) => n.group === "참고 조항");
  assert.equal(new Set(refs.map((n) => n.label)).size, refs.length);
});

test("버린 값은 '걸러낸 값' 노드로 원문 검증관과 연결된다", () => {
  const drop = g.nodes.find((n) => n.sub === "걸러낸 값" && n.label.includes("식기세척기"))!;
  assert.ok(drop);
  assert.ok(g.links.some((l) => l.source === "ag-verifier" && l.target === drop.id));
});

test("답변 후보와 거절은 답변 점검관과 연결되고 요약 숫자에 잡힌다", () => {
  assert.ok(g.nodes.some((n) => n.sub === "답변 후보"));
  const rej = g.nodes.find((n) => n.sub === "거절된 후보")!;
  assert.ok(g.links.some((l) => l.source === "ag-replycheck" && l.target === rej.id));
  assert.deepEqual(evidenceSummary(state), { reads: 2, dropped: 1, approved: 0, rejected: 1 });
});

test("견적이 없으면 이사·에이전트·입력만 있다", () => {
  const e = graphOf({ ...EMPTY_CASE, items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS });
  assert.equal(e.nodes.filter((n) => n.group === "견적").length, 0);
});
