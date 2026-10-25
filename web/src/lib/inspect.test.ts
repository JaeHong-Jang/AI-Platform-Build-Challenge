import { test } from "node:test";
import assert from "node:assert/strict";
import { applyInspection, inspectSig, makeInspectTools } from "./inspect.ts";
import { inspectQuote } from "./inspector.ts";
import { compare } from "./rules.ts";
import { verifyDraft } from "./verify.ts";
import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS, SAMPLE_QUOTE_TEXT } from "./fixtures.ts";
import type { ChatReply } from "./ollama.ts";

const draft = verifyDraft(SAMPLE_QUOTE_TEXT, QUOTE_DRAFT).draft;
const input = { items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS, draft, quoteText: SAMPLE_QUOTE_TEXT };
const base = () => compare(input.items, draft, input.cond, input.quoteText);
const tools = () => makeInspectTools(input, base());
const Q = "출발지 3층(엘리베이터 없음) 계단 작업이 총액에 포함되나요? 별도라면 조건과 금액을 적어 주세요.";

test("covered는 원문 문장·항목 낱말·조건 없음이 모두 맞아야 수락된다", () => {
  const t = tools();
  const r = t.submit_findings({ findings: [
    { card_id: "item-책장", verdict: "covered", quote: "이사 품목: 원룸 짐 일체 (냉장고, 세탁기, 침대(싱글))", reason: "짐 일체에 포함" }, // 책장 낱말 없음
    { card_id: "fee-0", verdict: "covered", quote: "※ 현장 상황에 따라 추가 비용이 발생할 수 있음", reason: "적혀 있음" }, // 조건 표현
    { card_id: "truck", verdict: "covered", quote: "차량: 2톤 1대", reason: "지어낸 문장" }, // 원문에 없음
    { card_id: "item-냉장고", verdict: "covered", quote: "[6] 이사 품목: 원룸 짐 일체 (냉장고, 세탁기, 침대(싱글))", reason: "품목에 냉장고가 있음" },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, false, false, true]);
  assert.match(r[0].reason, /올릴 수 없습니다/); // 규칙이 확인 필요로 본 책장 — 에이전트가 올리지 못한다
  assert.match(r[1].reason, /올릴 수 없습니다/);
  // 규칙이 명시됨으로 본 항목도 근거 문장이 원문에 있고 항목 낱말이 있어야 확인된다
  const r2 = t.submit_findings({ findings: [
    { card_id: "item-세탁기", verdict: "covered", quote: "차량: 1톤 1대 / 인원 2명", reason: "적혀 있음" },
  ] }).results;
  assert.equal(r2[0].accepted, false);
});

test("needs_check는 질문이 있어야 하고, 견적서에 없는 금액·조립 가구가 아닌 짐의 분해 질문은 거절", () => {
  const t = tools();
  const r = t.submit_findings({ findings: [
    { card_id: "stairs-from", verdict: "needs_check", reason: "3층 계단", question: "" },
    { card_id: "stairs-from", verdict: "needs_check", reason: "3층 계단", question: "계단 작업은 7만원이면 되나요? 견적서에 적어 주세요." },
    { card_id: "item-전자레인지", verdict: "needs_check", reason: "짐 일체", question: "전자레인지 분해·조립이 포함되나요?" },
    { card_id: "stairs-from", verdict: "needs_check", reason: "3층인데 엘리베이터가 없다", question: Q },
  ] });
  assert.deepEqual(r.results.map((x) => x.accepted), [false, false, false, true]);
  assert.ok(!r.not_judged_yet.includes("stairs-from"));
});

test("새 위험: 내 조건과 어긋나거나(엘리베이터 있는 집의 계단) 기존 카드와 겹치면 거절", () => {
  const t = tools();
  const r = t.add_risks({ risks: [
    { title: "냉장고 계단 운반", related: "냉장고", reason: "출발지 3층 엘리베이터 없음", question: "출발지 3층 계단으로 냉장고를 옮기는 인원·비용이 총액에 포함되나요?" },
    { title: "도착지 계단 운반", related: "도착지", reason: "도착지 5층", question: "도착지 5층 계단 운반 비용이 포함되나요?" },
    { title: "사다리차 필요", related: "출발지", reason: "3층", question: "출발지에서 사다리차가 필요한가요?" },
    { title: "피아노 운반", related: "피아노", reason: "무거움", question: "피아노 운반 비용이 포함되나요?" },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [true, false, false, false]);
});

test("병합: 에이전트 판정은 카드에 반영되고, 새 위험은 카드로 추가되며, 판정 없는 카드는 규칙 그대로", () => {
  const t = tools();
  t.submit_findings({ findings: [
    { card_id: "stairs-from", verdict: "needs_check", reason: "3층인데 엘리베이터가 없다", question: Q },
    { card_id: "workers", verdict: "needs_check", reason: "3층 계단에 냉장고가 있어 2명으로 되는지 확인", question: "엘리베이터 없는 3층에서 냉장고를 2명이 옮기나요? 인원이 늘면 비용이 붙나요?" },
  ] });
  t.add_risks({ risks: [{ title: "냉장고 계단 운반", related: "냉장고", reason: "3층 엘리베이터 없음", question: "냉장고 계단 운반이 총액에 포함되나요?" }] });
  const cards = applyInspection(base(), { findings: [...t.findings.values()] });
  const by = (id: string) => cards.find((c) => c.id === id)!;
  assert.equal(by("stairs-from").ask, Q);
  assert.equal(by("stairs-from").by, "agent");
  assert.equal(by("workers").status, "조건 모호"); // 명시됨이었어도 에이전트가 확인 필요로 내리면 내려간다 (보수적 방향)
  assert.equal(by("ai-냉장고계단운반").status, "포함 여부 미확인");
  assert.ok(by("ai-냉장고계단운반").kw!.includes("냉장고"));
  assert.equal(by("truck").by, undefined);
});

test("입력 서명: 짐·조건·견적 원문이 바뀌면 달라진다", () => {
  const a = inspectSig(SAMPLE_ITEMS, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT);
  assert.equal(a, inspectSig([...SAMPLE_ITEMS].reverse(), SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT + "  "));
  assert.notEqual(a, inspectSig(SAMPLE_ITEMS, { ...SAMPLE_CONDITIONS, ladderNeeded: "있음" }, SAMPLE_QUOTE_TEXT));
  assert.notEqual(a, inspectSig(SAMPLE_ITEMS.slice(1), SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT));
});

test("에이전트 루프: 도구를 순서대로 부르고, 모델이 실패하면 판정 없이(규칙 기준선) 끝난다", async () => {
  const script: ChatReply[] = [
    { ms: 5, message: { role: "assistant", content: "", tool_calls: [{ function: { name: "get_case", arguments: {} } }] } },
    { ms: 5, message: { role: "assistant", content: "", tool_calls: [{ function: { name: "submit_findings", arguments: { findings: [{ card_id: "stairs-from", verdict: "needs_check", reason: "3층 엘리베이터 없음", question: Q }] } } }] } },
    { ms: 5, message: { role: "assistant", content: "", tool_calls: [{ function: { name: "finish", arguments: "{}" } }] } },
  ];
  const run = await inspectQuote(input, async () => script.shift()!);
  assert.equal(run.stopped, "finished");
  assert.deepEqual(run.steps.map((s) => s.tool), ["get_case", "submit_findings", "finish"]);
  assert.equal(run.findings.length, 1);
  assert.equal(run.sig, inspectSig(input.items, input.cond, input.quoteText));

  const fail = await inspectQuote(input, async () => { throw new Error("연결 안 됨"); });
  assert.equal(fail.stopped, "error");
  assert.equal(fail.findings.length, 0);
  assert.match(fail.note, /규칙 기준선/);
});

test("답변 에이전트: 조건부 답에는 되물을 질문을 받고, 답변에 없는 금액이 든 질문은 버린다", async () => {
  const { makeTools } = await import("./proposals.ts");
  const reply = "3층 계단은 당일 짐 보고 말씀드릴게요.";
  const t = makeTools(base(), reply, draft.totalAmount);
  t.propose_updates({ updates: [{ card_id: "stairs-from", relation: "conditional_answer", quote: reply, follow_up: "당일 짐을 보고 정한다고 하셨는데, 3층 계단 작업 비용을 지금 견적서에 적어 주실 수 있나요?" }] });
  assert.match(t.proposals.get("stairs-from")!.followUp!, /견적서에 적어/);
  const t2 = makeTools(base(), reply, draft.totalAmount);
  t2.propose_updates({ updates: [{ card_id: "stairs-from", relation: "conditional_answer", quote: reply, follow_up: "계단 작업은 3만원으로 해 주실 수 있나요?" }] });
  assert.equal(t2.proposals.get("stairs-from")!.followUp, undefined);
});

test("기존 카드 질문도 내 조건과 어긋나면 거절 (엘리베이터 있는 도착지의 사다리차)", () => {
  const t = tools();
  const r = t.submit_findings({ findings: [
    { card_id: "ladder", verdict: "needs_check", reason: "도착지 5층이라 사다리차가 필요할 수 있다", question: "도착지 5층에 엘리베이터가 있어도 사다리차가 필요한가요?" },
    { card_id: "ladder", verdict: "needs_check", reason: "출발지 3층에 엘리베이터가 없다", question: "출발지 3층(엘리베이터 없음)에서 사다리차가 필요한지, 필요하면 비용이 총액에 포함되는지 적어 주세요." },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, true]);
});

test("점검 에이전트를 끄면 저장된 결과가 있어도 규칙 기준선만 쓴다", async () => {
  const { baseCards, newQuote } = await import("./store.ts");
  const { ALL_ON } = await import("./agents.ts");
  const t = tools();
  t.add_risks({ risks: [{ title: "냉장고 계단 운반", related: "냉장고", reason: "3층 엘리베이터 없음", question: "출발지 3층 계단으로 냉장고를 옮기는 비용이 총액에 포함되나요?" }] });
  const q = newQuote(0, { quoteText: SAMPLE_QUOTE_TEXT, draft, inspection: { model: "목", ms: 0, steps: [], findings: [...t.findings.values()], stopped: "finished", note: "", sig: inspectSig(SAMPLE_ITEMS, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT) } });
  const s = { items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS };
  assert.ok(baseCards({ ...s, agents: ALL_ON }, q).some((c) => c.id.startsWith("ai-")));
  assert.ok(!baseCards({ ...s, agents: { ...ALL_ON, inspector: false } }, q).some((c) => c.id.startsWith("ai-")));
  assert.ok(!baseCards({ ...s, cond: { ...SAMPLE_CONDITIONS, ladderNeeded: "있음" }, agents: ALL_ON }, q).some((c) => c.id.startsWith("ai-"))); // 조건이 바뀌면 무효
});

test("1층 집의 계단 위험, 내 짐에 없는 물건을 말하는 위험은 거절", () => {
  const ground = { ...input, cond: { ...SAMPLE_CONDITIONS, from: { floor: 1, elevator: "없음" as const, parkingFar: "없음" as const } } };
  const t = makeInspectTools(ground, compare(ground.items, draft, ground.cond, ground.quoteText));
  const r = t.add_risks({ risks: [
    { title: "냉장고 계단 운반", related: "냉장고", reason: "출발지 1층 엘리베이터 없음", question: "출발지에서 냉장고를 계단으로 옮기는 비용이 포함되나요?" },
    { title: "피아노 분해", related: "책장", reason: "책장과 피아노는 무겁다", question: "책장과 피아노 운반이 포함되나요?" },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, false]);
  assert.match(r[0].reason, /1층/);
  assert.match(r[1].reason, /피아노/);
});

test("Sonnet 리뷰 재현: 단위 없는 금액, 두 집 모두 엘리베이터인 계단, 긴 related, 같은 id 다른 제목은 거절", () => {
  const both = { ...input, cond: { ...SAMPLE_CONDITIONS, from: { floor: 3, elevator: "있음" as const, parkingFar: "없음" as const } } };
  const t = makeInspectTools(both, compare(both.items, draft, both.cond, both.quoteText));
  const r = t.add_risks({ risks: [
    { title: "냉장고 계단 운반", related: "냉장고", reason: "큰 가전", question: "냉장고를 계단으로 옮기는 비용이 포함되나요?" },
    { title: "추가 인원", related: "작업 인원", reason: "짐이 많다", question: "추가 비용이 50000 정도 나오나요?" },
    { title: "책장 분해", related: "책장".repeat(30), reason: "조립 가구", question: "책장 분해·조립이 포함되나요?" },
    { title: "책장 분해 조립", related: "책장", reason: "조립 가구", question: "책장 분해·조립이 포함되나요?" },
    { title: "책장분해 조립", related: "책장", reason: "조립 가구", question: "책장 분해·조립이 총액에 포함되나요?" },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, false, false, true, false]);
});

test("답변 API 스키마는 새 위험 카드의 kw를 받는다 (Sonnet 리뷰 #1)", async () => {
  const src = (await import("node:fs")).readFileSync(new URL("../app/api/reply/route.ts", import.meta.url), "utf8");
  assert.match(src, /kw: z\.array/);
});

test("Sol 채점 틀림 유형: 가전·박스 분해, 지하층 사다리차, 없는 수량은 거절 / 조립 가구 분해는 수락", () => {
  const under = { ...input, cond: { ...SAMPLE_CONDITIONS, to: { floor: -1, elevator: "없음" as const, parkingFar: "없음" as const } } };
  const t = makeInspectTools(under, compare(under.items, draft, under.cond, under.quoteText));
  const r = t.add_risks({ risks: [
    { title: "세탁기 분해·조립", related: "세탁기", reason: "큰 가전", question: "세탁기 분해·조립이 포함되나요?" },
    { title: "박스 분해", related: "이삿짐 박스", reason: "박스 8개", question: "박스 8개 분해·조립이 포함되나요?" },
    { title: "도착지 사다리차", related: "도착지", reason: "도착지 지하 1층", question: "도착지 지하에 사다리차가 필요한가요?" },
    { title: "책장 분해·조립", related: "책장", reason: "조립 가구", question: "책장 1개 분해·조립이 총액에 포함되나요?" },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, false, false, true]);
});
