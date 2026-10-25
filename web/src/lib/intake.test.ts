// D006 G2 — 조건 해석관의 모델 출력을 문장으로 다시 확인한다 (Argon#2 재현 포함)
import { test } from "node:test";
import assert from "node:assert/strict";
import { candidates, verifyIntake, type IntakeDraft } from "./intake.ts";
import { compare } from "./rules.ts";
import { QUOTE_DRAFT, SAMPLE_CONDITIONS } from "./fixtures.ts";

const draft = (p: Partial<IntakeDraft>): IntakeDraft => ({ houseType: "모름", from: { floor: null, elevator: "모름" }, to: { floor: null, elevator: "모름" }, items: [], ...p });

test("Argon#2: '박스 3개'의 3을 층으로, 빌트인 냉장고를 옮길 짐으로 읽어도 문장으로 바로잡는다", () => {
  const text = "1층 원룸입니다. 냉장고는 빌트인이라 안 옮기고요, 박스 3개만 2층으로 옮겨요.";
  const r = verifyIntake(text, draft({ houseType: "원룸", from: { floor: 3, elevator: "모름" }, to: { floor: 2, elevator: "모름" }, items: [{ name: "냉장고", count: null, move: true }, { name: "박스", count: 3, move: true }] }));
  assert.equal(r.cond.from.floor, null);
  assert.equal(r.cond.to.floor, 2);
  assert.equal(r.items.find((i) => i.name === "냉장고")!.move, false);
  assert.equal(r.items.find((i) => i.name === "박스")!.count, 3);
  assert.ok(r.dropped.length >= 2);
});

test("자리 표시가 있으면 순서가 반대여도 받아들이고, 문장에 없는 엘리베이터·집 유형은 모름", () => {
  const r = verifyIntake("도착은 5층, 지금 사는 곳은 3층 엘베 없음", draft({ houseType: "투룸", from: { floor: 3, elevator: "없음" }, to: { floor: 5, elevator: "없음" } }));
  assert.equal(r.cond.from.floor, 3);
  assert.equal(r.cond.to.floor, 5);
  assert.equal(r.houseType, "모름");
  const n = verifyIntake("원룸, 3층에서 5층으로", draft({ from: { floor: 3, elevator: "없음" } }));
  assert.equal(n.cond.from.elevator, "모름");
});

test("자리 표시 없이 두 층이 문장 순서와 반대로 들어오면 둘 다 비운다", () => {
  const r = verifyIntake("3층, 5층", draft({ from: { floor: 5, elevator: "모름" }, to: { floor: 3, elevator: "모름" } }));
  assert.equal(r.cond.from.floor, null);
  assert.equal(r.cond.to.floor, null);
});

test("문장에 없는 짐은 버리고, 수량이 문장과 다르면 모름", () => {
  const r = verifyIntake("침대랑 책상 옮겨요", draft({ items: [{ name: "침대", count: 2, move: true }, { name: "소파", count: null, move: true }] }));
  assert.deepEqual(r.items.map((i) => [i.name, i.count]), [["침대", null]]);
});

test("짐 점검표관 후보는 사용자가 확인하기 전에는 대조 카드가 되지 않는다", () => {
  const c = candidates("원룸", []);
  assert.ok(c.length > 0 && c.every((i) => i.pending && i.count === null));
  assert.equal(compare(c, QUOTE_DRAFT, SAMPLE_CONDITIONS).filter((x) => x.rule === "품목").length, 0);
  const confirmed = c.map((i) => (i.name === "냉장고" ? { ...i, pending: false } : i));
  assert.equal(compare(confirmed, QUOTE_DRAFT, SAMPLE_CONDITIONS).filter((x) => x.rule === "품목").length, 1);
});

test("실측 2026-10-24 ax4-light: '지금 3층 엘베 없음'을 모름으로 읽어도 같은 구절의 말을 따른다", () => {
  const text = "원룸, 지금 3층 엘베 없음, 새 집은 5층 엘베 있음. 냉장고·세탁기·침대 옮겨요";
  const r = verifyIntake(text, draft({ houseType: "원룸", from: { floor: 3, elevator: "모름" }, to: { floor: 5, elevator: "있음" } }));
  assert.equal(r.cond.from.elevator, "없음");
  assert.equal(r.cond.to.elevator, "있음");
});

test("Argon2 #2: 쉼표 없이 '…에서 …으로'로 써도 두 집의 엘베가 섞이지 않고, 같은 층수도 자리 표시로 가른다", () => {
  const a = verifyIntake("지금 3층 엘베 없음에서 새 집 5층 엘베 있음으로 이사해요", draft({ from: { floor: 3, elevator: "없음" }, to: { floor: 5, elevator: "있음" } }));
  assert.equal(a.cond.from.elevator, "없음");
  assert.equal(a.cond.to.elevator, "있음");
  const b = verifyIntake("도착은 5층, 지금 사는 곳은 3층 엘베 없음", draft({ from: { floor: 3, elevator: "없음" }, to: { floor: 5, elevator: "없음" } }));
  assert.equal(b.cond.to.elevator, "모름");
  const c = verifyIntake("지금 3층 엘베 없음, 새 집은 3층 엘베 있음", draft({ from: { floor: 3, elevator: "없음" }, to: { floor: 3, elevator: "있음" } }));
  assert.equal(c.cond.from.floor, 3);
  assert.equal(c.cond.to.floor, 3);
  assert.equal(c.cond.to.elevator, "있음");
});
