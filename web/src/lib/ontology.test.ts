// D006 K8 — 근거 사슬은 입력·원문·조항·규칙 카드에서만 나온다
import { test } from "node:test";
import assert from "node:assert/strict";
import { chainOf } from "./ontology.ts";
import { compare } from "./rules.ts";
import { REFERENCES } from "./references.ts";
import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS, SAMPLE_QUOTE_TEXT } from "./fixtures.ts";

const cards = compare(SAMPLE_ITEMS, QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT);

test("모든 원문 노드는 견적서에 실제로 있는 글이고, 조항 노드는 조항 표에 있다", () => {
  for (const c of cards) {
    const ch = chainOf(c, SAMPLE_ITEMS, SAMPLE_CONDITIONS);
    for (const n of ch.cols[2]) if (n.cls === "견적서 원문") assert.ok(SAMPLE_QUOTE_TEXT.includes(n.label), n.label);
    for (const n of ch.cols[3]) if (n.cls === "참고 조항") assert.ok(Object.values(REFERENCES).some((r) => r.label === n.label));
    const ids = new Set(ch.cols.flat().map((n) => n.id));
    for (const e of ch.edges) assert.ok(ids.has(e.from) && ids.has(e.to));
  }
});

test("짐 카드는 그 짐 입력에서, 계단 카드는 그 집 조건에서 출발하고, 확인이 남으면 질문으로 끝난다", () => {
  const book = chainOf(cards.find((c) => c.id === "item-책장")!, SAMPLE_ITEMS, SAMPLE_CONDITIONS);
  assert.deepEqual(book.cols[0].map((n) => n.label), ["책장"]);
  assert.ok(book.cols[3].some((n) => n.cls === "업체에 물을 것"));
  const stairs = chainOf(cards.find((c) => c.id === "stairs-from")!, SAMPLE_ITEMS, SAMPLE_CONDITIONS);
  assert.equal(stairs.cols[0][0].label, "출발지");
  assert.equal(stairs.cols[2][0].cls, "원문 없음");
  const fridge = chainOf(cards.find((c) => c.id === "item-냉장고")!, SAMPLE_ITEMS, SAMPLE_CONDITIONS);
  assert.ok(!fridge.cols[3].some((n) => n.cls === "업체에 물을 것")); // 명시됨이면 질문 없음
});
