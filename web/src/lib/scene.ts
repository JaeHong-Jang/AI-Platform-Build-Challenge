// 이삿짐 운반 장면의 시간표와 좌표 (순수 함수, B010). 장면은 독립 기능이 아니라 '견적 대조 점검'을 보여 주는 표현이다.
// 이벤트 큐 없이 (cards, 켜진 에이전트, 시간 t) 하나로 한 장면을 계산한다 — 장면과 산정표가 어긋날 수 없다.
// 상자 1개 = 짐 확인 카드 1개. 금액·톤수·적재율 같은 숫자는 만들지 않는다.
import type { AgentId } from "./agents.ts";
import type { Card, CardStatus, Site } from "./types.ts";

export type Mark = "✓" | "?" | "△" | "⌀";
export const MARK: Record<CardStatus, Mark> = { 명시됨: "✓", "포함 여부 미확인": "?", "조건 모호": "△", "판독 불가": "⌀" };
export type Actor = AgentId | "human";

// ── 무대 좌표 (viewBox 1280×470). 발 높이 = GROUND
export const G = { W: 1280, H: 470, GROUND: 380, FLOOR_H: 72, BW: 34, BH: 26, CARGO_FLOOR: 344 } as const;
export const SPOT = {
  roomX: 214, liftX: 264, doorX: 300, // 건물(24~304): 집 안 → 계단·엘리베이터 → 현관
  porchX: 316, pickX: 428, checkX: 448, // 현관 앞 짐 → 검수대 앞
  stopX: 578, rampX: 724, cargoX: 762, // 멈춤선 앞 → 경사판 → 적재함
} as const;
type P = [number, number];

// ── 재생 시간 (ms). 판정은 이미 끝나 있고, 이 시간은 보여 주는 순서일 뿐이다
const DUR: Record<Actor, number> = { intake: 600, itemlist: 1300, reader: 700, verifier: 800, inspector: 0, replycheck: 500, responder: 220, picker: 220, contract: 220, docguide: 220, human: 500 };
const ASK_MS = 700; // 점검 에이전트가 짐을 다 나른 뒤 질문 게시판에 질문을 붙이는 시간
const SIGN_MS = 90;
export const tripMs = (n: number) => Math.round(Math.max(520, Math.min(1000, 4200 / Math.max(n, 1))));

export interface Seg { id: Actor; start: number; end: number }
export interface Plan {
  segs: Seg[];
  total: number;
  boxes: Card[]; // 짐 카드
  signs: Card[]; // 작업 조건·추가비 카드 (위쪽 표지)
  trip: number;
  signsMs: number;
  dest: ("truck" | "stop")[]; // 대조 직후 행선지 (명시됨이고 답변 반영 전 → 트럭)
  later: boolean[]; // 사람 승인 단계에서 멈춤선 → 트럭으로 옮겨지는 짐 (답변으로 명시됨)
  slot: number[]; // 행선지 안 칸 번호
  laterSlot: number[];
  asks: Card[]; // 질문이 붙는 카드
}

/** steps = 켜진 에이전트 (흐름 순서). 사람 승인은 늘 마지막 주 흐름 단계다 */
export function planOf(cards: Card[], steps: AgentId[]): Plan {
  // 답변 승인으로 명시됨이 된 짐은 맨 나중에 나른다 — 멈춤선 더미 맨 위에 놓여, 트럭으로 떠나도 아래 짐이 공중에 뜨지 않는다
  const items = cards.filter((c) => c.rule === "품목");
  const isLater = (c: Card) => c.status === "명시됨" && !!c.answered;
  const boxes = [...items.filter((c) => !isLater(c)), ...items.filter(isLater)];
  const signs = cards.filter((c) => c.rule !== "품목");
  const trip = tripMs(boxes.length);
  const signsMs = Math.max(300, signs.length * SIGN_MS);
  const side = ["responder", "picker", "contract", "docguide"];
  const order: Actor[] = [...steps.filter((s) => !side.includes(s)), "human", ...steps.filter((s) => side.includes(s))];
  let t = 0;
  const segs = order.map((id) => {
    const d = id === "inspector" ? signsMs + boxes.length * trip + ASK_MS : id === "human" ? DUR.human + boxes.filter((c) => c.answered && c.status === "명시됨").length * 250 : DUR[id];
    const s = { id, start: t, end: t + d };
    t += d;
    return s;
  });
  const dest = boxes.map((c) => (c.status === "명시됨" && !c.answered ? "truck" as const : "stop" as const));
  const later = boxes.map((c, i) => dest[i] === "stop" && c.status === "명시됨");
  let nt = 0, ns = 0;
  const slot = dest.map((d) => (d === "truck" ? nt++ : ns++));
  const laterSlot = later.map((l) => (l ? nt++ : -1));
  return { segs, total: t, boxes, signs, trip, signsMs, dest, later, slot, laterSlot, asks: cards.filter((c) => c.status !== "명시됨" && c.ask) };
}

// ── 건물: 층수·엘리베이터는 내 입력대로. 5층 이상은 4층만 그리고 '중간 층 생략'으로 표시한다
export interface Geo { floors: number; label: string; lift: Site["elevator"]; room: number; skip: boolean; path: P[] }
export function geoOf(site: Site): Geo {
  const f = site.floor;
  const floors = f === null ? 2 : Math.max(1, Math.min(f, 4));
  const label = f === null ? "층 모름" : f < 0 ? `지하 ${-f}층` : `${f}층`;
  const level = (k: number) => G.GROUND - (k - 1) * G.FLOOR_H; // k층 바닥
  const room = level(floors);
  const path: P[] = [[SPOT.roomX, room], [244, room]];
  if (site.elevator === "있음") path.push([SPOT.liftX, room], [SPOT.liftX, G.GROUND]);
  else for (let k = floors; k > 1; k--) path.push([292, level(k) + G.FLOOR_H / 2], [244, level(k - 1)]);
  path.push([SPOT.doorX, G.GROUND]);
  return { floors, label, lift: site.elevator, room, skip: (f ?? 0) > 4, path };
}

/** 꺾은선 위 u(0~1) 지점 — 길이 비례 */
export function along(path: P[], u: number): P {
  const k = Math.max(0, Math.min(1, u));
  const len = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  let d = k * len.reduce((a, b) => a + b, 0);
  for (let i = 0; i < len.length; i++) {
    if (d <= len[i] || i === len.length - 1) {
      const r = len[i] ? Math.min(1, d / len[i]) : 1;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * r, path[i][1] + (path[i + 1][1] - path[i][1]) * r];
    }
    d -= len[i];
  }
  return path[path.length - 1];
}

// ── 칸 좌표 (상자 왼쪽 위)
const stack = (x0: number, floor: number, cols: number, i: number): P => [x0 + (i % cols) * (G.BW + 2), floor - G.BH * (Math.floor(i / cols) + 1)];
export const roomSlot = (geo: Geo, i: number): P => stack(44, geo.room, 4, i % 8); // 방에는 8칸까지 보인다
/** 현관 앞 더미: 첫 짐이 맨 위 — 대조관은 위에서부터 집어 간다 */
export const porchSlot = (i: number, n: number): P => stack(SPOT.porchX, G.GROUND, 3, n - 1 - i);
export const stopSlot = (i: number): P => stack(SPOT.stopX, G.GROUND, 3, i);
export const truckSlot = (i: number): P => stack(SPOT.cargoX, G.CARGO_FLOOR, 9, i);

export type Where = "room" | "dolly" | "porch" | "hands" | "truck" | "stop";
export interface BoxAt { card: Card; x: number; y: number; where: Where; checked: boolean; note: boolean }
export interface Walker { x: number; y: number; walking: boolean; carrying: boolean; face: 1 | -1 }
export interface Frame {
  active: Actor | null;
  state: (id: Actor) => "대기" | "작동 중" | "완료";
  boxes: BoxAt[];
  signs: boolean[]; // 표지가 판정됐는가
  lister: Walker;
  carrier: Walker;
  lift: number; // 엘리베이터 칸 바닥 y
  current: { card: Card; mark: Mark; to: "truck" | "stop" } | null; // 검수대에서 지금 판정 중인 짐
  posted: number; // 게시판 질문 수
  drops: number; // 원문 검증관이 버린 값 중 보여 준 수
  gate: number; // 차단봉 들림 0~1
}

const lerp = (a: P, b: P, r: number): P => [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r];
const ease = (r: number) => (r < 0.5 ? 2 * r * r : 1 - (-2 * r + 2) ** 2 / 2);
const handsOf = (w: P): P => [w[0] - G.BW / 2, w[1] - 50]; // 들고 있는 상자 위치 (가슴 앞, 사람 1.15배)

/** 점검 에이전트의 짐 한 번 나르기: 들기 → 검수대 → 트럭(경사판)·멈춤선 → 내려놓기 → 돌아오기 */
function trip(plan: Plan, i: number, r: number) {
  const home: P = [SPOT.pickX, G.GROUND], check: P = [SPOT.checkX, G.GROUND];
  const to = plan.dest[i];
  const slot = to === "truck" ? truckSlot(plan.slot[i]) : stopSlot(plan.slot[i]);
  const stand: P = [slot[0] + G.BW / 2, to === "truck" ? G.CARGO_FLOOR : G.GROUND];
  const go: P[] = to === "truck" ? [check, [SPOT.rampX, G.GROUND], [SPOT.cargoX - 6, G.CARGO_FLOOR], stand] : [check, stand];
  const back: P[] = [...go].reverse().concat([home]);
  if (r < 0.08) { const w = home; return { w, box: lerp(porchSlot(i, plan.boxes.length), handsOf(w), ease(r / 0.08)), walking: false, carrying: true, checking: false, face: 1 as const }; }
  if (r < 0.16) { const w = lerp(home, check, (r - 0.08) / 0.08); return { w, box: handsOf(w), walking: true, carrying: true, checking: false, face: 1 as const }; }
  if (r < 0.34) return { w: check, box: handsOf(check), walking: false, carrying: true, checking: true, face: 1 as const };
  if (r < 0.7) { const w = along(go, ease((r - 0.34) / 0.36)); return { w, box: handsOf(w), walking: true, carrying: true, checking: false, face: 1 as const }; }
  if (r < 0.78) return { w: stand, box: lerp(handsOf(stand), slot, ease((r - 0.7) / 0.08)), walking: false, carrying: true, checking: false, face: 1 as const };
  return { w: along(back, (r - 0.78) / 0.22), box: slot, walking: true, carrying: false, checking: false, face: -1 as const };
}

export function frameAt(plan: Plan, geo: Geo, t: number, dropped = 0): Frame {
  const seg = (id: Actor) => plan.segs.find((s) => s.id === id);
  const prog = (id: Actor) => { const s = seg(id); return !s ? null : t <= s.start ? 0 : t >= s.end ? 1 : (t - s.start) / (s.end - s.start); };
  const active = plan.segs.find((s) => t >= s.start && t < s.end)?.id ?? null;
  const state = (id: Actor) => { const s = seg(id); return !s || t >= s.end ? "완료" as const : t >= s.start ? "작동 중" as const : "대기" as const; };

  // 점검 에이전트 한 구간 = 표지 판정 → 짐 나르기 → (끝 ASK_MS) 질문 붙이기
  const ms = seg("inspector");
  const workEnd = ms ? ms.end - ASK_MS : 0;
  const part = (a: number, b: number) => (!ms ? null : t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
  const pList = prog("itemlist"), pMatch = part(ms?.start ?? 0, workEnd), pAsk = part(workEnd, ms?.end ?? 0), pHuman = prog("human") ?? 0;
  const signDone = (k: number) => pMatch !== null && (pMatch >= 1 || t - ms!.start >= (k + 1) * (plan.signsMs / Math.max(plan.signs.length, 1)));
  const tripAt = ms ? t - ms.start - plan.signsMs : -1;
  const ti = pMatch !== null && pMatch < 1 && tripAt >= 0 ? Math.floor(tripAt / plan.trip) : -1;
  const tr = ti >= 0 ? (tripAt - ti * plan.trip) / plan.trip : 0;

  // 짐 목록관: 집 안 → (손수레) 계단·엘리베이터 → 현관 앞
  const listerAt = (u: number): P => along(geo.path, u);
  const lister: Walker = pList === null ? { x: SPOT.roomX, y: geo.room, walking: false, carrying: false, face: 1 }
    : pList < 0.15 ? { x: geo.path[0][0], y: geo.room, walking: false, carrying: true, face: 1 }
    : pList < 0.85 ? (() => { const p = listerAt((pList - 0.15) / 0.7); return { x: p[0], y: p[1], walking: true, carrying: true, face: 1 as const }; })()
    : { x: SPOT.doorX, y: G.GROUND, walking: false, carrying: pList < 1, face: 1 };
  const lift = geo.lift === "있음" && pList !== null && pList >= 0.15 ? Math.max(Math.min(lister.y, G.GROUND), geo.room) : geo.room;

  let current: Frame["current"] = null;
  let carrier: Walker = { x: SPOT.pickX, y: G.GROUND, walking: false, carrying: false, face: 1 };
  const posted = pAsk === null ? 0 : Math.floor(pAsk * plan.asks.length + 1e-9);
  const noted = new Set(plan.asks.slice(0, posted).map((c) => c.id));

  const boxes = plan.boxes.map((card, i): BoxAt => {
    const n = { card, checked: false, note: noted.has(card.id) };
    // ① 짐 목록 단계: 집 안에서 손수레에 싣고(앞 15%) → 내려와(70%) → 현관 앞에 내려놓는다(뒤 15%, 아래 칸부터)
    const n0 = Math.max(plan.boxes.length, 1);
    if (pList !== null && pList < 1) {
      if (pList <= 0.15 * (i / n0)) { const [x, y] = roomSlot(geo, i); return { ...n, x, y, where: "room" }; }
      if (pList < 0.85 + 0.15 * ((plan.boxes.length - 1 - i) / n0)) return { ...n, x: lister.x + 8, y: lister.y - G.BH * (Math.min(i, 3) + 1), where: "dolly" };
    }
    // ② 점검 전: 현관 앞
    if (pMatch === null || ti < 0 && pMatch < 1 || ti >= 0 && i > ti) { const [x, y] = porchSlot(i, plan.boxes.length); return { ...n, x, y, where: "porch" }; }
    // ③ 지금 나르는 짐
    if (i === ti) {
      const m = trip(plan, i, tr);
      carrier = { x: m.w[0], y: m.w[1], walking: m.walking, carrying: m.carrying, face: m.face };
      if (tr >= 0.16) current = { card, mark: MARK[card.status], to: plan.dest[i] };
      return { ...n, x: m.box[0], y: m.box[1], where: tr < 0.78 ? "hands" : plan.dest[i], checked: tr >= 0.16 };
    }
    // ④ 내려놓은 짐 — 사람 승인 단계에서 답변으로 명시됨이 된 짐은 트럭으로 옮긴다
    const at = plan.dest[i] === "truck" ? truckSlot(plan.slot[i]) : stopSlot(plan.slot[i]);
    if (plan.later[i] && pHuman > 0) {
      const to = truckSlot(plan.laterSlot[i]);
      const r = ease(Math.min(1, pHuman * 1.2));
      const [x, y] = lerp(at, to, r);
      return { ...n, x, y: y - Math.sin(r * Math.PI) * 60, where: r >= 1 ? "truck" : "hands", checked: true };
    }
    return { ...n, x: at[0], y: at[1], where: plan.dest[i], checked: true };
  });

  const pVer = prog("verifier");
  return {
    active, state, boxes, lister, carrier, lift, current, posted,
    signs: plan.signs.map((_, k) => signDone(k)),
    drops: pVer === null ? 0 : Math.round(pVer * dropped),
    gate: plan.later.some(Boolean) ? Math.sin(pHuman * Math.PI) : 0,
  };
}
