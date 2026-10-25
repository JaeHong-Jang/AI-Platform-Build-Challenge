import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical, compare, missingFacts } from "./rules.ts";
import { composeRequest, guard } from "./message.ts";
import { verifyDraft } from "./extract.ts";
import { makeTools, reviewReply, type ChatFn } from "./agent.ts";
import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS, SAMPLE_QUOTE_TEXT, SAMPLE_REPLY } from "./fixtures.ts";
import type { Item, QuoteDraft } from "./types.ts";
import { baseCards, cardsOf, inquiryOf, newQuote, sigOf, type QuoteEntry } from "./store.ts";

const byId = (cards: ReturnType<typeof compare>) => Object.fromEntries(cards.map((c) => [c.id, c]));
const cards = () => compare(SAMPLE_ITEMS, QUOTE_DRAFT, SAMPLE_CONDITIONS);

test("이름이 달라도 같은 물건으로 본다", () => {
  assert.equal(canonical("싱글 침대"), "침대");
  assert.equal(canonical("5단 책꽂이"), "책장");
  assert.notEqual(canonical("티비선반"), "책장");
});

test("견적서에 적힌 품목은 명시됨·총액 포함, '짐 일체'뿐인 품목은 조건 모호·비용 미확인", () => {
  const c = byId(cards());
  assert.equal(c["item-침대"].status, "명시됨");
  assert.equal(c["item-침대"].cost, "총액 포함");
  assert.equal(c["item-책장"].status, "조건 모호");
  assert.equal(c["item-책장"].cost, "미확인");
  assert.equal(c["item-책장"].mine, "책장 1개 운송");
  assert.equal(c["item-박스"].status, "조건 모호");
});

test("뭉뚱그린 문구도 없으면 포함 여부 미확인", () => {
  const q: QuoteDraft = { ...QUOTE_DRAFT, blanketPhrases: [] };
  assert.equal(byId(compare(SAMPLE_ITEMS, q, SAMPLE_CONDITIONS))["item-책장"].status, "포함 여부 미확인");
});

test("다른 물건(책상·식탁)은 따로 대조하고, 같은 물건(책장·책꽂이)은 합친다", () => {
  const its: Item[] = [
    { id: "a", name: "책상", category: "대형가구", count: 1, move: true },
    { id: "b", name: "식탁", category: "대형가구", count: 1, move: true },
    { id: "c", name: "책장", category: "대형가구", count: 1, move: true },
    { id: "d", name: "5단 책꽂이", category: "대형가구", count: 1, move: true },
    { id: "e", name: "", category: "대형가구", count: 1, move: true },
  ];
  const q: QuoteDraft = { ...QUOTE_DRAFT, blanketPhrases: [], listedItems: [{ name: "책상", quote: "책상 1개" }] };
  const items = compare(its, q, SAMPLE_CONDITIONS).filter((x) => x.rule === "품목");
  const c = byId(items);
  assert.equal(c["item-책상"].status, "명시됨");
  assert.equal(c["item-식탁"].status, "포함 여부 미확인");
  assert.match(c["item-책장"].ask, /2개/);
  assert.equal(new Set(items.map((x) => x.id)).size, items.length);
});

test("3층·엘리베이터 없음이면 계단·사다리차 카드, 추가비 문구는 조건 모호", () => {
  const c = byId(cards());
  assert.equal(c["stairs-from"].status, "포함 여부 미확인");
  assert.equal(c["stairs-from"].mine, "3층 · 엘리베이터 없음");
  assert.equal(c["stairs-to"], undefined);
  assert.equal(c["ladder"].status, "포함 여부 미확인");
  assert.equal(c["fee-0"].status, "조건 모호");
  assert.deepEqual(c["fee-0"].refs, ["art5-3", "art8-2", "art8-3"]);
});

test("사다리차 '별도'는 기재돼 있어도 비용 처리는 별도·조건 모호", () => {
  const c = byId(compare(SAMPLE_ITEMS, { ...QUOTE_DRAFT, ladder: "별도" }, SAMPLE_CONDITIONS));
  assert.equal(c["ladder"].cost, "별도");
  assert.equal(c["ladder"].status, "조건 모호");
});

test("총액이 없으면 판독 불가, 사용자가 채우면 풀린다", () => {
  assert.equal(byId(compare(SAMPLE_ITEMS, { ...QUOTE_DRAFT, totalAmount: null }, SAMPLE_CONDITIONS))["unread-총액"].status, "판독 불가");
  const c = byId(compare(SAMPLE_ITEMS, { ...QUOTE_DRAFT, unreadable: ["총액", "계약금"], deposit: null }, SAMPLE_CONDITIONS));
  assert.equal(c["unread-총액"], undefined);
  assert.ok(c["unread-계약금"].ask.length > 0);
});

test("대시보드가 먼저 물을 빈 사실: 짐 목록·층수·사다리차", () => {
  assert.deepEqual(missingFacts(SAMPLE_CONDITIONS, SAMPLE_ITEMS), ["사다리차 필요 여부"]);
  assert.deepEqual(missingFacts({ ...SAMPLE_CONDITIONS, to: { floor: null, elevator: "모름", parkingFar: "모름" } }, []), ["옮길 짐 목록", "도착지 층수", "사다리차 필요 여부"]);
});

test("확인 요청 문구에는 단정·위협 표현이 없다", () => {
  const msg = composeRequest(cards(), QUOTE_DRAFT);
  assert.match(msg, /총 350,000원/);
  assert.deepEqual(guard(msg), []);
  assert.equal(guard("이건 불법입니다. 신고하겠습니다")[0].kind, "법적 단정");
});

test("견적서 추출: 원문에 없는 발췌·숫자는 버린다", () => {
  const fake: QuoteDraft = {
    ...QUOTE_DRAFT,
    totalAmount: 380000, // 원문은 35만원
    listedItems: [...QUOTE_DRAFT.listedItems, { name: "책장", quote: "책장 1개" }], // 원문에 없음
    extraFeeClauses: ["현장 상황에 따라 추가 비용이 발생할 수 있음"],
  };
  const { draft, dropped } = verifyDraft(SAMPLE_QUOTE_TEXT, fake);
  assert.equal(draft.totalAmount, null);
  assert.ok(draft.unreadable.includes("총액"));
  assert.equal(draft.listedItems.length, 3);
  assert.equal(draft.extraFeeClauses.length, 1);
  assert.equal(dropped.length, 2);
  assert.equal(verifyDraft(SAMPLE_QUOTE_TEXT, QUOTE_DRAFT).draft.totalAmount, 350000); // '35만원' 표기도 인정
  assert.equal(verifyDraft(SAMPLE_QUOTE_TEXT, QUOTE_DRAFT).draft.deposit, 50000);
});

test("견적서 추출 실측 오류: 원문에 없는 사다리차 '별도'는 미기재로, 비운 발췌는 품목 이름으로", () => {
  // 2026-10-24 ax4-light 실제 응답에서 나온 두 오류
  const real: QuoteDraft = { ...QUOTE_DRAFT, ladder: "별도", stairsNote: "별도", listedItems: [{ name: "냉장고", quote: "" }, { name: "세탁기", quote: "" }, { name: "침대(싱글)", quote: "" }, { name: "에어컨", quote: "" }] };
  const { draft, dropped } = verifyDraft(SAMPLE_QUOTE_TEXT, real);
  assert.equal(draft.ladder, "미기재");
  assert.equal(draft.stairsNote, null);
  assert.deepEqual(draft.listedItems.map((l) => l.quote), ["냉장고", "세탁기", "침대(싱글)"]);
  assert.ok(dropped.some((x) => x.startsWith("사다리차")) && dropped.some((x) => x.includes("에어컨")));
});

test("에이전트 도구: 제외·별도·조건 표현은 명시됨 불가, '추가 비용 없습니다'는 명시됨 가능", () => {
  const t = makeTools(cards(), "책장은 제외입니다. 사다리차는 별도 15만원입니다. 추가 비용 없습니다.");
  const r = t.propose_updates({ updates: [
    { card_id: "item-책장", relation: "explicit_answer", quote: "책장은 제외입니다." },
    { card_id: "ladder", relation: "explicit_answer", quote: "사다리차는 별도 15만원입니다." },
    { card_id: "fee-0", relation: "explicit_answer", quote: "추가 비용 없습니다." },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, false, true]);
  assert.equal(t.propose_updates({ updates: [{ card_id: "item-책장", relation: "conflicting", quote: "책장은 제외입니다." }] }).results[0].accepted, true);
  t.propose_updates({ updates: [{ card_id: "item-책장", relation: "unanswered", quote: "" }] });
  assert.equal(t.proposals.has("item-책장"), false);
});

test("에이전트 도구: 모델이 card_id에 제목을 붙여 보내도 알아듣고, 없는 문장은 거절", () => {
  const t = makeTools(cards(), SAMPLE_REPLY);
  const r = t.propose_updates({ updates: [
    { card_id: "item-책장(책장)", relation: "explicit_answer", quote: "책장이랑 책상 의자 다 포함이에요." },
    { card_id: "item-전자레인지", relation: "explicit_answer", quote: "다 포함이에요." },
    { card_id: "item-박스", relation: "explicit_answer", quote: "박스도 포함입니다." },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [true, false, false]);
});

// ── Argon B007 리뷰(runs/out/b007-review.argon.md) 재현 입력
test("B007 #1 명시됨 차단: 금액·부담·거절 표현과 '없으면 별도'는 막고, '추가 비용 없음'·총액 언급은 허용", () => {
  const reply = "3층 계단 추가요금은 피할 수 없습니다. 엘리베이터 없으면 사다리차 별도입니다. 책장은 2만원 받습니다. 에어컨은 안 해드려요. 추가 비용은 없습니다. 책상은 35만원에 포함이에요.";
  const t = makeTools(cards(), reply, 350000);
  const r = t.propose_updates({ updates: [
    { card_id: "stairs-from", relation: "explicit_answer", quote: "3층 계단 추가요금은 피할 수 없습니다." },
    { card_id: "ladder", relation: "explicit_answer", quote: "엘리베이터 없으면 사다리차 별도입니다." },
    { card_id: "item-책장", relation: "explicit_answer", quote: "책장은 2만원 받습니다." },
    { card_id: "fee-0", relation: "explicit_answer", quote: "추가 비용은 없습니다." },
    { card_id: "item-책상", relation: "explicit_answer", quote: "책상은 35만원에 포함이에요." },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, false, false, true, true]);
});

test("B007 #1 키워드: '3층 작업'·'짐 많으면 5만원 더'·'잔짐 상자'도 해당 카드의 답으로 인정(조건부)", () => {
  const reply = "3층 작업은 3만원 추가입니다. 짐이 많으면 5만원 더 나옵니다. 잔짐 상자는 다 실어드려요.";
  const t = makeTools(cards(), reply);
  const r = t.propose_updates({ updates: [
    { card_id: "stairs-from", relation: "conditional_answer", quote: "3층 작업은 3만원 추가입니다." },
    { card_id: "fee-0", relation: "conditional_answer", quote: "짐이 많으면 5만원 더 나옵니다." },
    { card_id: "item-박스", relation: "explicit_answer", quote: "잔짐 상자는 다 실어드려요." },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [true, true, true]);
  assert.ok((t.get_open_cards().cards.find((c) => c.card_id === "fee-0") as { evidence: string[] }).evidence.length > 0);
});

test("B007 Sol: 이미 명시된 항목을 뒤집는 답변은 conflicting으로만 받는다", () => {
  const t = makeTools(cards(), "침대는 분해 비용 별도 3만원입니다.");
  const r = t.propose_updates({ updates: [
    { card_id: "item-침대", relation: "explicit_answer", quote: "침대는 분해 비용 별도 3만원입니다." },
    { card_id: "item-침대", relation: "conflicting", quote: "침대는 분해 비용 별도 3만원입니다." },
  ] }).results;
  assert.deepEqual(r.map((x) => x.accepted), [false, true]);
  assert.equal(t.proposals.get("item-침대")?.to, "조건 모호");
});

test("B007 #4 금액 대조: 숫자 경계를 지키고 '35만 5천원'도 인정", () => {
  const text = "총 35만원 (계약금 없음)";
  assert.equal(verifyDraft(text, { ...QUOTE_DRAFT, deposit: 50000 }).draft.deposit, null);
  assert.equal(verifyDraft("총 135만원", { ...QUOTE_DRAFT, totalAmount: 350000 }).draft.totalAmount, null);
  assert.equal(verifyDraft("총 35만 5천원, 계약금 3만5천원", { ...QUOTE_DRAFT, totalAmount: 355000, deposit: 35000 }).draft.totalAmount, 355000);
  assert.equal(verifyDraft("총 35만 5천원, 계약금 3만5천원", { ...QUOTE_DRAFT, totalAmount: 355000, deposit: 35000 }).draft.deposit, 35000);
});

test("B007 #4 품목: 견적 문구에 '별도'가 있거나 수량이 다르면 명시됨이 아니다", () => {
  const its: Item[] = [{ id: "a", name: "에어컨", category: "가전", count: 1, move: true }, { id: "b", name: "책장", category: "대형가구", count: 2, move: true }];
  const q: QuoteDraft = { ...QUOTE_DRAFT, blanketPhrases: [], listedItems: [{ name: "에어컨", quote: "에어컨 이전설치 별도" }, { name: "책장", quote: "책장 1개" }] };
  const c = byId(compare(its, q, SAMPLE_CONDITIONS));
  assert.equal(c["item-에어컨"].status, "조건 모호");
  assert.equal(c["item-에어컨"].cost, "별도");
  assert.equal(c["item-책장"].status, "조건 모호");
  assert.match(c["item-책장"].why, /1개/);
});

test("B007 #2 승인 무효화: 짐 수량·견적 총액이 바뀌면 승인과 '답변 반영'이 함께 풀린다", () => {
  const q0 = newQuote(0, { quoteText: SAMPLE_QUOTE_TEXT, draft: QUOTE_DRAFT });
  const s0 = { items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS };
  const base = Object.fromEntries(baseCards(s0, q0).map((c) => [c.id, c]));
  const q1: QuoteEntry = { ...q0, asked: ["item-책장"], inquiry: { "item-책장": "답변 반영" },
    overrides: { "item-책장": { sig: sigOf(base["item-책장"], q0, s0), status: "명시됨", cost: "총액 포함", answered: { relation: "explicit_answer", quote: "책장 포함이에요." } } } };
  assert.equal(inquiryOf(q1, cardsOf(s0, q1))["item-책장"], "답변 반영");
  const s2 = { ...s0, items: s0.items.map((i) => (i.name === "책장" ? { ...i, count: 2 } : i)) };
  assert.equal(cardsOf(s2, q1).find((c) => c.id === "item-책장")!.status, "조건 모호");
  assert.equal(inquiryOf(q1, cardsOf(s2, q1))["item-책장"], "재문의 필요");
  const q3: QuoteEntry = { ...q1, draft: { ...QUOTE_DRAFT, totalAmount: 400000 } };
  assert.equal(cardsOf(s0, q3).find((c) => c.id === "item-책장")!.status, "조건 모호");
});

// 로컬 모델 대신 정해진 도구 호출을 돌려주는 목 (맛대패스 harness 테스트 방식)
const scripted = (turns: { name: string; arguments: unknown }[][]): ChatFn => {
  let i = 0;
  return async () => ({ ms: 5, message: { role: "assistant", content: "", tool_calls: (turns[i++] ?? []).map((f) => ({ function: f })) } });
};

test("에이전트 루프: 거절 → 정정 → 종료, 요약은 실제 결과로", async () => {
  const run = await reviewReply(cards(), SAMPLE_REPLY, scripted([
    [{ name: "get_open_cards", arguments: {} }],
    [{ name: "propose_updates", arguments: { updates: [
      { card_id: "item-책장", relation: "explicit_answer", quote: "책장이랑 책상 의자 다 포함이에요." },
      { card_id: "stairs-from", relation: "explicit_answer", quote: "3층 계단은 당일 짐 보고 말씀드릴게요." },
    ] } }],
    [{ name: "propose_updates", arguments: JSON.stringify({ updates: [{ card_id: "stairs-from", relation: "conditional_answer", quote: "3층 계단은 당일 짐 보고 말씀드릴게요." }] }) }],
    [{ name: "finish", arguments: {} }],
  ]));
  assert.equal(run.stopped, "finished");
  const p = Object.fromEntries(run.proposals.map((x) => [x.cardId, x.to]));
  assert.deepEqual(p, { "item-책장": "명시됨", "stairs-from": "조건 모호" });
  assert.match(run.note, /답이 없음: .*전자레인지/);
  assert.ok(run.open.includes("stairs-from") && !run.open.includes("item-책장"));
});

test("에이전트 루프: 모델이 도구를 안 부르거나 실패하면 상태를 바꾸지 않는다", async () => {
  const quiet = await reviewReply(cards(), SAMPLE_REPLY, scripted([[]]));
  assert.equal(quiet.stopped, "error");
  assert.equal(quiet.proposals.length, 0);
  const broken = await reviewReply(cards(), SAMPLE_REPLY, async () => { throw new Error("connection refused"); });
  assert.equal(broken.stopped, "error");
  assert.match(broken.note, /로컬 모델 호출 실패/);
});

test("에이전트 루프: 도구 호출 상한에서 멈춘다", async () => {
  const loop = Array.from({ length: 10 }, () => [{ name: "get_open_cards", arguments: {} }]);
  const run = await reviewReply(cards(), SAMPLE_REPLY, scripted(loop));
  assert.equal(run.stopped, "limit");
  assert.ok(run.steps.length <= 8);
});

test("파손·분실 배상 카드 (B013): 문구 없음 → 미확인+질문 / 조건 없는 보험 문구 → 명시됨 / 협의 → 조건 모호, 깨지기 쉬운 짐은 질문에 넣는다", () => {
  const items: Item[] = [...SAMPLE_ITEMS, { id: "tv", name: "TV", category: "가전", count: 1, move: true }];
  const none = compare(items, QUOTE_DRAFT, SAMPLE_CONDITIONS, "총 35만원").find((c) => c.id === "damage")!;
  assert.equal(none.status, "포함 여부 미확인");
  assert.match(none.ask, /TV/);
  assert.match(none.mine, /TV/);
  const ok = compare(items, QUOTE_DRAFT, SAMPLE_CONDITIONS, "총 35만원\n이사화물배상책임보험 가입, 파손 시 보험으로 배상합니다").find((c) => c.id === "damage")!;
  assert.equal(ok.status, "명시됨");
  const vague = compare(items, QUOTE_DRAFT, SAMPLE_CONDITIONS, "총 35만원\n파손 시 협의 후 배상").find((c) => c.id === "damage")!;
  assert.equal(vague.status, "조건 모호");
});
