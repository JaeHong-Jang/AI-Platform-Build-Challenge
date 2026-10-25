// D006 구현 0단계 — 지휘부(Argon·Astra)가 재현한 검증기 결함. 고치기 전에 실패하는 것을 먼저 확인했다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { amountsIn, verifyDraft } from "./verify.ts";
import { compare } from "./rules.ts";
import { makeTools } from "./agent.ts";
import { notPlain } from "./plain.ts";
import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS, SAMPLE_QUOTE_TEXT } from "./fixtures.ts";
import type { Item, QuoteDraft } from "./types.ts";

const byId = (cards: ReturnType<typeof compare>) => Object.fromEntries(cards.map((c) => [c.id, c]));

test("D006 Argon#1: 다른 항목의 숫자(사다리차 별도 15만원·'1인 가구')를 총액·계약금·인원으로 받지 않는다", () => {
  const text = "이사일 11월 14일 / 1인 가구 원룸 / 총 금액 35만원, 사다리차 별도 15만원 (계약금 없음)";
  const bad: QuoteDraft = { ...QUOTE_DRAFT, totalAmount: 150000, deposit: 350000, workers: 1 };
  const { draft, dropped } = verifyDraft(text, bad);
  assert.equal(draft.totalAmount, null);
  assert.equal(draft.deposit, null);
  assert.equal(draft.workers, null);
  assert.equal(dropped.filter((x) => /^(총액|계약금|작업 인원):/.test(x)).length, 3);
});

test("D006 Astra#2: 총액과 계약금을 뒤바꾸면 둘 다 버리고, 바르게 읽으면 둘 다 남긴다", () => {
  const text = "총액 35만원, 계약금 5만원";
  const swapped = verifyDraft(text, { ...QUOTE_DRAFT, totalAmount: 50000, deposit: 350000 }).draft;
  assert.equal(swapped.totalAmount, null);
  assert.equal(swapped.deposit, null);
  const right = verifyDraft(text, { ...QUOTE_DRAFT, totalAmount: 350000, deposit: 50000 }).draft;
  assert.equal(right.totalAmount, 350000);
  assert.equal(right.deposit, 50000);
  // 가상 사례 원문(괄호 안 계약금)도 그대로 통과
  const sample = verifyDraft(SAMPLE_QUOTE_TEXT, QUOTE_DRAFT).draft;
  assert.equal(sample.totalAmount, 350000);
  assert.equal(sample.deposit, 50000);
  assert.equal(sample.workers, 2);
});

test("D006 Argon#1: 단위 없는 날짜·층·톤 숫자는 금액이 아니다", () => {
  assert.deepEqual(amountsIn("11월 14일 3층 1톤 2명"), []);
  assert.deepEqual(amountsIn("350,000 / 120000원"), [350000, 120000]);
});

test("D006 Astra#1: 품목 이름이 원문에 있어도 '협의 후 결정'·'직접 옮기세요'는 총액 포함이 아니다", () => {
  const its: Item[] = [{ id: "a", name: "냉장고", category: "가전", count: 1, move: true }];
  const q: QuoteDraft = { ...QUOTE_DRAFT, blanketPhrases: [], listedItems: [{ name: "냉장고", quote: "냉장고 운송은 협의 후 결정." }] };
  const c = byId(compare(its, q, SAMPLE_CONDITIONS))["item-냉장고"];
  assert.equal(c.status, "조건 모호");
  assert.notEqual(c.cost, "총액 포함");
  assert.ok(c.ask);

  const reply = "냉장고는 고객님이 직접 옮기세요.";
  const tools = makeTools(compare(its, { ...q, listedItems: [] }, SAMPLE_CONDITIONS), reply);
  const r = tools.propose_updates({ updates: [{ card_id: "item-냉장고", relation: "explicit_answer", quote: reply }] }).results[0];
  assert.equal(r.accepted, false);
  assert.equal(notPlain("추가 비용은 없습니다. 냉장고 포함입니다.", null), null); // 예외는 그대로
});

test("D006 Astra#3: 수량을 모르는 짐도 확인 카드로 남는다", () => {
  const its: Item[] = [{ id: "a", name: "냉장고", category: "가전", count: null, move: true }];
  const c = byId(compare(its, { ...QUOTE_DRAFT, listedItems: [], blanketPhrases: [] }, SAMPLE_CONDITIONS))["item-냉장고"];
  assert.ok(c);
  assert.equal(c.status, "포함 여부 미확인");
  assert.match(c.mine, /수량 모름/);
});

test("D006 Argon#5: 원문에 없는 값을 직접 입력해도 '견적서에 적혀 있음(명시됨)'이 되지 않는다", () => {
  const manual: QuoteDraft = { ...QUOTE_DRAFT, workers: 3, ladder: "포함", listedItems: [...QUOTE_DRAFT.listedItems, { name: "책장", quote: "책장 1개" }] };
  const c = byId(compare(SAMPLE_ITEMS, manual, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT));
  for (const id of ["workers", "ladder", "item-책장"]) {
    assert.notEqual(c[id].status, "명시됨", id);
    assert.match(c[id].why, /직접 입력/, id);
    assert.ok(c[id].ask, id);
  }
  // 원문에 있는 값은 그대로 명시됨
  const ok = byId(compare(SAMPLE_ITEMS, QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT));
  assert.equal(ok["workers"].status, "명시됨");
  assert.equal(ok["item-냉장고"].status, "명시됨");
});

// ── G1 상태 v3
import { baseCards as base3, cardsOf as cards3, migrate, newQuote, sigOf as sig3, type QuoteEntry } from "./store.ts";

test("D006 Argon#3: 견적 A에서 승인한 답변이 같은 총액·업체 미기재인 견적 B에 번지지 않는다", () => {
  const s = { items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS };
  const draft: QuoteDraft = { ...QUOTE_DRAFT, company: null, ladder: "미기재" };
  const a = newQuote(0, { quoteText: SAMPLE_QUOTE_TEXT, draft });
  const ladderA = base3(s, a).find((c) => c.id === "ladder")!;
  const approved: QuoteEntry = { ...a, overrides: { ladder: { sig: sig3(ladderA, a, s), status: "명시됨", cost: "총액 포함", answered: { relation: "explicit_answer", quote: "사다리차 포함입니다." } } } };
  assert.equal(cards3(s, approved).find((c) => c.id === "ladder")!.status, "명시됨");
  const b = newQuote(1, { quoteText: SAMPLE_QUOTE_TEXT, draft: { ...draft, listedItems: [] }, overrides: approved.overrides }); // 잘못 복사돼도
  assert.notEqual(cards3(s, b).find((c) => c.id === "ladder")!.status, "명시됨");
});

test("D006 Argon#3: 층·짐이 바뀌면 차량·인원처럼 '내 조건'이 비어 있는 카드의 승인도 풀린다", () => {
  const s = { items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS };
  const q = newQuote(0, { quoteText: "총 금액 35만원", draft: { ...QUOTE_DRAFT, truck: null } });
  const truck = base3(s, q).find((c) => c.id === "truck")!;
  const ok: QuoteEntry = { ...q, overrides: { truck: { sig: sig3(truck, q, s), status: "명시됨", cost: "해당 없음", answered: { relation: "explicit_answer", quote: "1톤 1대입니다." } } } };
  assert.equal(cards3(s, ok).find((c) => c.id === "truck")!.status, "명시됨");
  const moved = { ...s, cond: { ...s.cond, to: { ...s.cond.to, floor: 7 } } };
  assert.notEqual(cards3(moved, ok).find((c) => c.id === "truck")!.status, "명시됨");
});

test("D006 상태 v3: 예전(v2) 세션은 견적 1건으로 옮겨진다", () => {
  const s = migrate({ quoteText: SAMPLE_QUOTE_TEXT, draft: QUOTE_DRAFT, items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS, asked: ["truck"], inquiry: { truck: "보냄" }, overrides: {}, reply: "", runs: [], dropped: [], reader: null });
  assert.equal(s.version, 3);
  assert.equal(s.quotes.length, 1);
  assert.equal(s.active, s.quotes[0].id);
  assert.equal(s.quotes[0].inquiry.truck, "보냄");
  assert.equal(s.started, true);
  assert.equal(migrate(null).quotes.length, 0);
});

// ── 서류 안내관·계약 점검관
import { checkDoc, depositRatio, DOCS } from "./docs.ts";

test("계약금 비율: 가상 사례 5만/35만은 제6조 10%를 넘고, 숫자가 하나라도 없으면 계산하지 않는다", () => {
  const r = depositRatio(350000, 50000)!;
  assert.ok(r.over && Math.abs(r.ratio - 0.142857) < 1e-4);
  assert.equal(depositRatio(350000, 35000)!.over, false);
  assert.equal(depositRatio(null, 50000), null);
  assert.equal(depositRatio(350000, null), null);
});

test("견적서 기재 항목 점검: 가상 견적에는 보관·사업자 정보가 없다", () => {
  const c = checkDoc(DOCS[0], SAMPLE_QUOTE_TEXT);
  const missing = c.filter((x) => !x.found).map((x) => x.item.id);
  assert.ok(missing.includes("storage"));
  assert.ok(missing.includes("biz"));
  assert.ok(!missing.includes("total") && !missing.includes("work"));
});

test("Astra#4: '출발지 3층 계단 작업 포함'처럼 집을 짚어 조건 없이 적은 견적은 계단이 명시됨, 직접 입력이면 아님", () => {
  const its = SAMPLE_ITEMS;
  const text = "출발지 3층 계단 작업 포함 / 총액 42만원";
  const q: QuoteDraft = { ...QUOTE_DRAFT, stairsNote: "출발지 3층 계단 작업 포함" };
  assert.equal(byId(compare(its, q, SAMPLE_CONDITIONS, text))["stairs-from"].status, "명시됨");
  assert.notEqual(byId(compare(its, q, SAMPLE_CONDITIONS, "총액 42만원"))["stairs-from"].status, "명시됨");
  assert.notEqual(byId(compare(its, { ...q, stairsNote: "계단 작업은 당일 보고 협의" }, SAMPLE_CONDITIONS))["stairs-from"].status, "명시됨");
});

// ── Argon 2차 리뷰 (runs/out/b008-impl-review.argon.md) 재현
import { QUOTE_DRAFT_B, SAMPLE_QUOTE_TEXT_B } from "./fixtures.ts";
import { matchCompany } from "./permits.ts";

test("Argon2 #1-A: 원문이 '사다리차 필요 시 별도 7만원'인데 '포함'으로 바꿔도 명시됨이 아니다", () => {
  const c = byId(compare(SAMPLE_ITEMS, { ...QUOTE_DRAFT_B, ladder: "포함" }, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT_B));
  assert.notEqual(c["ladder"].status, "명시됨");
  assert.notEqual(c["ladder"].cost, "총액 포함");
});

test("Argon2 #1-B: 발췌가 품목 이름뿐이어도 원문 문장의 '협의 후 결정'을 본다", () => {
  const src = "냉장고 운송은 협의 후 결정. 총액 35만원";
  for (const quote of ["", "냉장고"]) {
    const c = byId(compare(SAMPLE_ITEMS, { ...QUOTE_DRAFT_B, listedItems: [{ name: "냉장고", quote }] }, SAMPLE_CONDITIONS, src))["item-냉장고"];
    assert.equal(c.status, "조건 모호", quote);
    assert.notEqual(c.cost, "총액 포함");
  }
  // 가상 사례의 '(냉장고, 세탁기, 침대(싱글))'는 그대로 명시됨
  assert.equal(byId(compare(SAMPLE_ITEMS, QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT))["item-냉장고"].status, "명시됨");
});

test("Argon2 #3-C: 관악구 목록에서 일반화물로 등록된 상호는 이사 허가로 표시하지 않는다", () => {
  const m = matchCompany("(주)다다익스");
  assert.equal(m.status, "match");
  assert.match(m.message, /일반/);
});

// ── B009 합성 평가셋(web/eval) 실패 사례 재현
test("평가 Q03·Q06·Q07: 쉼표 금액과 총액·계약금이 한 문장에 있어도 각자 자리로 읽는다", () => {
  const a = verifyDraft("총액 360,000원 (계약금 36,000원)", { ...QUOTE_DRAFT, totalAmount: 360000, deposit: 36000 }).draft;
  assert.equal(a.totalAmount, 360000); assert.equal(a.deposit, 36000);
  const b = verifyDraft("총액은 40만원이고 그 중 계약금 5만원, 잔금 35만원 당일 결제", { ...QUOTE_DRAFT, totalAmount: 400000, deposit: 50000 }).draft;
  assert.equal(b.totalAmount, 400000); assert.equal(b.deposit, 50000);
  const swapped = verifyDraft("총액은 40만원이고 그 중 계약금 5만원", { ...QUOTE_DRAFT, totalAmount: 50000, deposit: 400000 }).draft;
  assert.equal(swapped.totalAmount, null); assert.equal(swapped.deposit, null);
});

test("평가 Q02: '인원 2분'은 작업 인원 2명이다 (단 '1인 가구'는 여전히 아님)", () => {
  assert.equal(verifyDraft("인원 2분 가시고요", { ...QUOTE_DRAFT, workers: 2 }).draft.workers, 2);
  assert.equal(verifyDraft("1인 가구 원룸, 10분 거리", { ...QUOTE_DRAFT, workers: 1 }).draft.workers, null);
});

test("평가 Q14: 품목 줄과 다른 줄의 '책장과 책상은 분해 시 별도 협의'도 그 품목의 조건으로 본다", () => {
  const text = "품목: 침대 1개, 책장 1개, 책상 1개\n※ 책장과 책상은 분해·조립이 필요하면 별도 비용 협의\n총액 35만원";
  const its: Item[] = [{ id: "a", name: "책장", category: "대형가구", count: 1, move: true }, { id: "b", name: "침대", category: "대형가구", count: 1, move: true }];
  const q: QuoteDraft = { ...QUOTE_DRAFT, blanketPhrases: [], listedItems: [{ name: "책장", quote: "책장 1개" }, { name: "침대", quote: "침대 1개" }] };
  const c = byId(compare(its, q, SAMPLE_CONDITIONS, text));
  assert.equal(c["item-책장"].status, "조건 모호");
  assert.equal(c["item-침대"].status, "명시됨");
});

test("평가 R20: '박스 6개 말씀하셨죠?' 같은 되묻는 문장은 포함 답변이 아니다", () => {
  const reply = "박스 6개 말씀하셨죠? 6개면 별도 5만원 그대로 받고요, 계단은 포함입니다.";
  const its: Item[] = [{ id: "a", name: "이삿짐 박스", category: "박스·잡화", count: 6, move: true }];
  const cards = compare(its, { ...QUOTE_DRAFT, blanketPhrases: ["원룸 짐 일체"], listedItems: [] }, SAMPLE_CONDITIONS);
  const t = makeTools(cards, reply);
  const r = t.propose_updates({ updates: [{ card_id: "item-박스", relation: "explicit_answer", quote: "박스 6개 말씀하셨죠?" }] }).results[0];
  assert.equal(r.accepted, false);
  const s = t.propose_updates({ updates: [{ card_id: "stairs-from", relation: "explicit_answer", quote: "계단은 포함입니다." }] }).results[0];
  assert.equal(s.accepted, true);
});
