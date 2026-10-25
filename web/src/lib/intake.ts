// 채비팀 ① 조건 해석관 (LLM ax4-light) — 한 문장에서 집 유형·층·엘리베이터·짐 이름을 읽는다.
// 모델이 낸 값은 문장으로 다시 확인한다 (D006 Argon#2): 층은 'N층' 표기가 있어야, 출발·도착은 자리 표시가 맞아야,
// '빌트인·안 옮겨요'가 붙은 짐은 옮길 짐이 아니다. 문장에 없는 값은 '모름'으로 둔다.
import { z } from "zod";
import type { Conditions, Item, Site, Tri } from "./types.ts";
import type { HouseType } from "./store.ts";

const site = z.object({
  floor: z.number().int().nullable().describe("층수. 지하는 음수. 문장에 없으면 null"),
  elevator: z.enum(["있음", "없음", "모름"]).describe("엘리베이터. 문장에 없으면 모름"),
});
export const intakeSchema = z.object({
  houseType: z.enum(["원룸", "투룸", "쓰리룸 이상", "모름"]),
  from: site.describe("지금 사는 집(출발지)"),
  to: site.describe("이사 갈 집(도착지)"),
  items: z.array(z.object({ name: z.string(), count: z.number().int().nullable().describe("문장에 개수가 없으면 null"), move: z.boolean().describe("옮기면 true, 빌트인·안 옮김이면 false") })),
});
export type IntakeDraft = z.infer<typeof intakeSchema>;

export const INTAKE_SYSTEM = `너는 이사 조건을 읽는 도구다. 사용자가 쓴 한 문장에서 아래만 뽑아 JSON으로 답한다.
- houseType: 원룸/투룸/쓰리룸 이상. 문장에 없으면 "모름".
- from: 지금 집(출발지)의 층수와 엘리베이터, to: 이사 갈 집(도착지)의 층수와 엘리베이터. 문장에 없으면 floor는 null, elevator는 "모름".
- items: 문장에 나온 짐 이름. 개수가 적혀 있지 않으면 count는 null. 빌트인이거나 안 옮긴다고 하면 move는 false.
문장에 없는 값을 지어내지 마라. 추측하지 마라.`;

export interface IntakeResult { houseType: HouseType; cond: Conditions; items: Item[]; dropped: string[] }

// '…없음에서 …으로', '3층 → 5층'처럼 쉼표 없이 두 집을 이어 써도 나눈다 (Argon2 #2)
const clauses = (t: string) => t.split(/[\n,.!?·/→]|->|그리고|이고|이며|인데|고요|구요|(?<=없음|있음|층)\s*에서\s/).map((c) => c.trim()).filter(Boolean);
const FROM_MARK = /출발|에서|지금|현재|사는/;
const TO_MARK = /도착|으로|로\s*이사|갈\s*집|새\s*집|이사\s*갈/;
const NOT_MOVE = /빌트인|옵션|안\s*옮|안\s*가져|빼고|제외|버릴|버려|버리|폐기|두고|놔두|놓고|팔/;

const floorText = (n: number) => (n < 0 ? `지하\\s*${-n}\\s*층` : `(?<![\\d지하])${n}\\s*층`);
/** 그 층수가 나오는 구절. 같은 층수가 두 번 나오면 그 집의 자리 표시가 있는 구절을 고른다. 없으면 null */
function clauseWithFloor(t: string, n: number, own?: RegExp, other?: RegExp): string | null {
  const hits = clauses(t).filter((c) => new RegExp(floorText(n)).test(c));
  return (own && hits.find((c) => own.test(c))) ?? (other && hits.find((c) => !other.test(c))) ?? hits[0] ?? null;
}

function checkSite(text: string, s: Pick<Site, "floor" | "elevator">, own: RegExp, other: RegExp, label: string, dropped: string[]): Site {
  let floor = s.floor;
  if (floor !== null) {
    const c = clauseWithFloor(text, floor, own, other);
    if (!c) { dropped.push(`${label} ${floor}층 (문장에 'N층'으로 적혀 있지 않음)`); floor = null; }
    else if (other.test(c) && !own.test(c)) { dropped.push(`${label} ${floor}층 (다른 집의 층으로 보임)`); floor = null; }
  }
  // 엘리베이터는 그 집의 구절에 엘베 이야기가 있을 때만 — 다른 집의 '엘베 없음'을 가져오지 않는다 (Argon2 #2)
  const mine = floor !== null ? clauseWithFloor(text, floor, own, other) : null;
  let elevator: Tri = mine && /엘베|엘리베이터|승강기/.test(mine) ? s.elevator : "모름";
  if (elevator !== s.elevator) dropped.push(`${label} 엘리베이터 ${s.elevator} (그 집 구절에 없음)`);
  const said = mine?.match(/(엘베|엘리베이터|승강기)\s*(이|가|는)?\s*(없|있)/);
  if (said) elevator = said[3] === "없" ? "없음" : "있음";
  return { floor, elevator, parkingFar: "모름" };
}

/** 모델 초안을 문장으로 다시 확인한다. 걷어낸 것은 사용자에게 보여 준다 */
export function verifyIntake(text: string, d: IntakeDraft): IntakeResult {
  const dropped: string[] = [];
  const houseType = d.houseType === "모름" || text.includes(d.houseType.replace(" 이상", "")) ? d.houseType : (dropped.push(`집 유형 ${d.houseType} (문장에 없음)`), "모름");
  let from = checkSite(text, d.from, FROM_MARK, TO_MARK, "출발지", dropped);
  let to = checkSite(text, d.to, TO_MARK, FROM_MARK, "도착지", dropped);
  // 자리 표시가 없는데 두 층이 문장 순서와 반대로 들어오면 어느 쪽인지 알 수 없다
  if (from.floor !== null && to.floor !== null) {
    const cf = clauseWithFloor(text, from.floor, FROM_MARK, TO_MARK)!, ct = clauseWithFloor(text, to.floor, TO_MARK, FROM_MARK)!;
    const marked = FROM_MARK.test(cf) || TO_MARK.test(ct);
    if (!marked && text.search(new RegExp(floorText(from.floor))) > text.search(new RegExp(floorText(to.floor)))) {
      dropped.push("출발·도착 층 (순서가 불확실해 비워 둠)");
      from = { ...from, floor: null }; to = { ...to, floor: null };
    }
  }
  const items: Item[] = [];
  d.items.forEach((it, n) => {
    const name = it.name.trim();
    const c = clauses(text).find((x) => x.includes(name));
    if (!name || !c) { if (name) dropped.push(`짐 '${name}' (문장에 없음)`); return; }
    const notMove = NOT_MOVE.test(c);
    const m = c.match(new RegExp(`${name}[^\\d]{0,6}(\\d+)\\s*(개|대|짝|박스|상자|세트)`));
    const count = it.count !== null && m && Number(m[1]) === it.count ? it.count : null;
    if (it.count !== null && count === null) dropped.push(`${name} ${it.count}개 (문장의 수량과 다름)`);
    if (it.move && notMove) dropped.push(`${name}: 옮김 → 안 옮김 ('${c.match(NOT_MOVE)![0]}')`);
    items.push({ id: `t${n}-${name}`, name, category: categoryOf(name), count, move: it.move && !notMove });
  });
  return { houseType, cond: { from, to, ladderNeeded: "모름" }, items, dropped };
}

const APPLIANCES = /냉장고|세탁기|건조기|전자레인지|티비|tv|텔레비전|에어컨|모니터|컴퓨터|김치냉장고|정수기/i;
const BOXES = /박스|상자|잡화|짐/;
export const categoryOf = (name: string): Item["category"] => (BOXES.test(name) ? "박스·잡화" : APPLIANCES.test(name) ? "가전" : "대형가구");

// 채비팀 ② 짐 점검표관 (규칙) — 집 유형별 '잊기 쉬운 짐' 이름만. 표준 목록 근거가 없어 수량·부피를 붙이지 않고, 사용자가 확인하기 전에는 대조하지 않는다.
export const CANDIDATE_NOTE = "확인용 후보 — 표준 짐 목록 근거는 없습니다. 실제로 옮길 짐만 골라 주세요.";
const BASE = ["침대", "매트리스", "냉장고", "세탁기", "책상", "의자", "행거", "전자레인지", "이삿짐 박스"];
const CANDIDATES: Record<HouseType, string[]> = {
  원룸: BASE,
  투룸: [...BASE, "옷장", "소파", "식탁", "TV"],
  "쓰리룸 이상": [...BASE, "옷장", "소파", "식탁", "TV", "책장", "건조기"],
  모름: BASE,
};
export function candidates(houseType: HouseType, have: Item[]): Item[] {
  const named = new Set(have.map((i) => i.name));
  return CANDIDATES[houseType].filter((n) => !named.has(n)).map((name) => ({ id: `c-${name}`, name, category: categoryOf(name), count: null, move: true, pending: true }));
}
