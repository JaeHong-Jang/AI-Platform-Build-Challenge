import { test } from "node:test";
import assert from "node:assert/strict";
import { compare } from "./rules.ts";
import { AGENTS } from "./agents.ts";
import { along, frameAt, G, geoOf, planOf, porchSlot, SPOT, truckSlot } from "./scene.ts";
import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS } from "./fixtures.ts";

const cards = compare(SAMPLE_ITEMS, QUOTE_DRAFT, SAMPLE_CONDITIONS);
const ALL = AGENTS.map((a) => a.id);
const geo = geoOf(SAMPLE_CONDITIONS.from);

test("상자 수 = 짐 카드 수, 표지 수 = 나머지 카드 수", () => {
  const p = planOf(cards, ALL);
  assert.equal(p.boxes.length, cards.filter((c) => c.rule === "품목").length);
  assert.equal(p.boxes.length + p.signs.length, cards.length);
});

test("흐름 순서: 주 흐름 → 사람 승인 → 보조 역할, 꺼진 역할은 빠진다", () => {
  const p = planOf(cards, ALL.filter((id) => id !== "replycheck"));
  const ids = p.segs.map((s) => s.id);
  assert.deepEqual(ids, ["intake", "itemlist", "reader", "verifier", "inspector", "human", "responder", "picker", "contract", "docguide"]);
  p.segs.slice(1).forEach((s, i) => assert.equal(s.start, p.segs[i].end));
});

test("시작(t=0)에는 짐이 모두 집 안, 아무것도 판정되지 않음", () => {
  const p = planOf(cards, ALL);
  const f = frameAt(p, geo, 0);
  assert.ok(f.boxes.every((b) => b.where === "room" && !b.checked));
  assert.ok(f.signs.every((s) => !s));
  assert.equal(f.posted, 0);
});

test("끝에는 명시됨만 트럭, 나머지는 멈춤선 — 산정표와 같다", () => {
  const p = planOf(cards, ALL);
  const f = frameAt(p, geo, p.total);
  f.boxes.forEach((b) => assert.equal(b.where, b.card.status === "명시됨" ? "truck" : "stop"));
  assert.ok(f.signs.every(Boolean));
  assert.equal(f.posted, cards.filter((c) => c.status !== "명시됨" && c.ask).length);
});

test("점검 단계가 없으면 짐은 현관 앞에 남고 판정 표시가 없다", () => {
  const p = planOf(cards, ALL.filter((id) => id !== "inspector"));
  const f = frameAt(p, geo, p.total);
  assert.ok(f.boxes.every((b) => b.where === "porch" && !b.checked));
});

test("짐 목록관이 꺼지면 처음부터 현관 앞", () => {
  const p = planOf(cards, ALL.filter((id) => id !== "itemlist"));
  const f = frameAt(p, geo, 0);
  assert.ok(f.boxes.every((b) => b.where === "porch"));
});

test("답변으로 명시됨이 된 짐은 멈춤선을 거쳐 사람 승인 단계에서 트럭으로", () => {
  const i = cards.findIndex((c) => c.rule === "품목" && c.status !== "명시됨");
  const changed = cards.map((c, n) => (n === i ? { ...c, status: "명시됨" as const, answered: { relation: "explicit_answer" as const, quote: "포함입니다" } } : c));
  const p = planOf(changed, ALL);
  const bi = p.boxes.findIndex((b) => b.id === changed[i].id);
  const human = p.segs.find((s) => s.id === "human")!;
  assert.equal(frameAt(p, geo, human.start).boxes[bi].where, "stop");
  const end = frameAt(p, geo, p.total).boxes[bi];
  assert.equal(end.where, "truck");
  assert.deepEqual([end.x, end.y], truckSlot(p.laterSlot[bi]));
});

test("대조 중에는 한 번에 한 짐만 손에 들고, 검수대에서 판정이 보인다", () => {
  const p = planOf(cards, ALL);
  const m = p.segs.find((s) => s.id === "inspector")!;
  const t = m.start + p.signsMs + p.trip * 0.25; // 첫 짐의 검수대 단계
  const f = frameAt(p, geo, t);
  assert.equal(f.boxes.filter((b) => b.where === "hands").length, 1);
  assert.equal(f.current?.card.id, p.boxes[0].id);
  assert.equal(f.carrier.x, SPOT.checkX);
});

test("현관 앞 더미는 첫 짐이 맨 위 — 집어 가도 공중에 뜬 상자가 없다", () => {
  const n = 7;
  const ys = Array.from({ length: n }, (_, i) => porchSlot(i, n)[1]);
  assert.ok(ys.every((y, i) => i === 0 || y >= ys[i - 1]));
});

test("층수·엘리베이터는 입력대로: 엘리베이터면 수직 이동, 없으면 계단 꺾은선", () => {
  const lift = geoOf({ floor: 3, elevator: "있음", parkingFar: "모름" });
  const stairs = geoOf({ floor: 3, elevator: "없음", parkingFar: "모름" });
  assert.equal(lift.floors, 3);
  assert.ok(stairs.path.length > lift.path.length);
  assert.equal(geoOf({ floor: 12, elevator: "있음", parkingFar: "모름" }).skip, true);
  assert.equal(geoOf({ floor: null, elevator: "모름", parkingFar: "모름" }).label, "층 모름");
  assert.deepEqual(along(stairs.path, 1), [SPOT.doorX, G.GROUND]);
});

test("답변으로 명시됨이 된 짐이 여럿 떠나도 멈춤선 더미에 공중에 뜬 상자가 없다", () => {
  const ids = new Set(cards.filter((c) => c.rule === "품목" && c.status !== "명시됨").slice(0, 2).map((c) => c.id));
  const changed = cards.map((c) => (ids.has(c.id) ? { ...c, status: "명시됨" as const, answered: { relation: "explicit_answer" as const, quote: "포함" } } : c));
  const p = planOf(changed, ALL);
  for (const t of [p.segs.find((s) => s.id === "human")!.start, p.total]) {
    const stops = frameAt(p, geo, t).boxes.filter((b) => b.where === "stop").map((b) => [b.x, b.y]);
    for (const [x, y] of stops) if (y < G.GROUND - G.BH) assert.ok(stops.some(([x2, y2]) => x2 === x && y2 === y + G.BH), `(${x},${y}) 아래가 비어 있음`);
  }
});
