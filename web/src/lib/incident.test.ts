import { test } from "node:test";
import assert from "node:assert/strict";
import { BASES, basesFor, makeIncidentTools, SITUATIONS } from "./incident.ts";
import { respond } from "./responder.ts";
import type { ChatReply } from "./ollama.ts";

const input = { situation: "파손" as const, story: "어제 이사했는데 TV 화면이 깨져 있어요.", records: ["견적서(바른용달이사, 원문 확인): 총액 350,000원 · 계약금 50,000원"] };
const good = {
  summary: "이사 다음 날 TV 화면 파손을 발견했습니다.",
  steps: [
    { action: "파손 사진을 찍고 업체에 바로 알린다", basis_ids: ["t18", "k-evidence"], when: "인도받은 날부터 30일 이내" },
    { action: "업체에 수선 또는 배상 방법을 묻고 사고증명서를 요청한다", basis_ids: ["t14", "t19"], when: "바로" },
    { action: "해결되지 않으면 1372에 상담한다", basis_ids: ["k-1372"], when: "업체 답이 없을 때" },
  ],
  evidence: ["TV 파손 사진", "견적서", "업체와 주고받은 문자"],
  message: "안녕하세요, 어제 이사한 고객입니다. TV 화면이 깨진 것을 발견해 사진을 보내 드립니다. 표준약관 제14조와 제18조에 따라 파손 사실을 알려 드리며, 수선 또는 배상 방법과 사고증명서 발급을 요청드립니다.",
  escalate: "1372 소비자상담센터 상담 후 한국소비자원 피해구제 신청",
};

test("근거 목록: 상황마다 근거가 있고 id가 겹치지 않으며 모두 공식 출처", () => {
  for (const s of SITUATIONS) assert.ok(basesFor(s).length >= 2, s);
  assert.equal(new Set(BASES.map((b) => b.id)).size, BASES.length);
  assert.ok(BASES.every((b) => /easylaw\.go\.kr|kca\.go\.kr|law\.go\.kr/.test(b.url)));
});

test("사고 대응 검증기: 올바른 계획은 수락", () => {
  const t = makeIncidentTools(input);
  assert.equal(t.submit_plan(good).accepted, true);
  assert.equal(t.plan?.steps.length, 3);
});

test("사고 대응 검증기: 없는 근거·근거에 없는 기한·기록에 없는 금액·법률 단정 표현은 거절", () => {
  const cases: [Record<string, unknown>, RegExp][] = [
    [{ ...good, steps: [{ action: "알린다", basis_ids: ["t99"], when: "바로" }, good.steps[1]] }, /근거가 아닙니다/],
    [{ ...good, steps: [{ action: "업체에 알린다", basis_ids: ["k-evidence"], when: "7일 이내" }, good.steps[1]] }, /7일/],
    [{ ...good, message: good.message + " 수리비 20만원을 보내 주세요." }, /20/],
    [{ ...good, message: "이건 명백한 불법입니다. 반드시 배상하세요. TV가 깨졌습니다." }, /불법|법률 판단/],
    [{ ...good, steps: [good.steps[0]] }, /2~7/],
    [{ ...good, steps: [{ action: "업체에 알린다", basis_ids: ["k-evidence"], when: "바로" }, { action: "1372에 상담한다", basis_ids: ["k-1372"], when: "바로" }] }, /핵심 근거/],
    [{ ...good, escalate: "소비자분쟁해결센터" }, /1372/],
  ];
  for (const [p, re] of cases) {
    const r = makeIncidentTools(input).submit_plan(p);
    assert.equal(r.accepted, false);
    assert.match((r as { reasons: string[] }).reasons.join(" "), re);
  }
});

test("사고 대응 루프: 도구를 부르고 계획을 내며, 모델이 실패하면 계획 없이 근거만", async () => {
  const script: ChatReply[] = [
    { ms: 1, message: { role: "assistant", content: "", tool_calls: [{ function: { name: "get_situation", arguments: {} } }] } },
    { ms: 1, message: { role: "assistant", content: "", tool_calls: [{ function: { name: "find_basis", arguments: { keywords: ["파손"] } } }] } },
    { ms: 1, message: { role: "assistant", content: "", tool_calls: [{ function: { name: "submit_plan", arguments: good } }] } },
    { ms: 1, message: { role: "assistant", content: "", tool_calls: [{ function: { name: "finish", arguments: {} } }] } },
  ];
  const run = await respond(input, async () => script.shift()!);
  assert.equal(run.stopped, "finished");
  assert.deepEqual(run.steps.map((s) => s.tool), ["get_situation", "find_basis", "submit_plan", "finish"]);
  assert.ok(run.plan);
  const fail = await respond(input, async () => { throw new Error("연결 안 됨"); });
  assert.equal(fail.plan, null);
  assert.match(fail.note, /공식 근거만/);
});

test("Sonnet B013 리뷰 재현: 기한 변형·단정 변형·금액 변형·다른 상황 근거는 거절, 정상 문장은 통과", () => {
  const bad: [Record<string, unknown>, RegExp][] = [
    [{ ...good, steps: [{ ...good.steps[0], when: "한 달 이내" }, ...good.steps.slice(1)] }, /1개월/],
    [{ ...good, message: good.message + " 7일 이내에 답변 부탁드립니다." }, /7일/],
    [{ ...good, message: good.message + " 배상하셔야 합니다." }, /하셔야/],
    [{ ...good, message: good.message + " 이는 약관 위반입니다." }, /위반/],
    [{ ...good, summary: "TV가 파손됐고, 업체가 배상 책임을 진다고 인정해야 합니다." }, /책임을|인정해야/],
    [{ ...good, message: good.message + " 표준약관에 따라 추가요금을 청구할 수 없습니다." }, /청구할/],
    [{ ...good, evidence: [...good.evidence, "불 법 청구 기록"] }, /불\s*법/],
    [{ ...good, message: good.message + " 수리비 오만원을 보내 주세요." }, /오만원/],
    [{ ...good, steps: [...good.steps, { action: "계약금 배액 배상을 요청한다", basis_ids: ["t9-2"], when: "바로" }] }, /이 상황의 근거가 아닙니다/],
  ];
  for (const [p, re] of bad) {
    const r = makeIncidentTools(input).submit_plan(p);
    assert.equal(r.accepted, false, JSON.stringify(p).slice(0, 80));
    assert.match((r as { reasons: string[] }).reasons.join(" "), re);
  }
  const ok = makeIncidentTools(input).submit_plan({ ...good, message: good.message + " 11월 14일에 이사했고, 30일 이내에 통지해야 한다고 알고 있어 연락드립니다." });
  assert.equal(ok.accepted, true, JSON.stringify(ok));
});

test("계약 전 파손 카드: 면책 문구는 '명시됨'이 아니라 조건 모호", async () => {
  const { compare } = await import("./rules.ts");
  const { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS } = await import("./fixtures.ts");
  for (const t of ["파손·분실 시 책임지지 않습니다", "파손 배상하지 않음", "파손 책임 없음", "파손 시 사진으로 증명해야 배상"]) {
    const c = compare(SAMPLE_ITEMS, QUOTE_DRAFT, SAMPLE_CONDITIONS, `총 35만원\n${t}`).find((x) => x.id === "damage")!;
    assert.equal(c.status, "조건 모호", t);
  }
});

test("1372 근거만 들고 '30일'을 쓰면 통지 기한 근거(t18)로 인용이 바로잡힌다 — 처리 기간 30일은 기한 근거가 아니다", () => {
  const t = makeIncidentTools(input);
  const r = t.submit_plan({ ...good, steps: [{ action: "업체에 30일 안에 알린다", basis_ids: ["k-1372"], when: "30일 이내" }, ...good.steps] }) as { accepted: boolean; fixes: string[] };
  assert.equal(r.accepted, true);
  assert.ok(t.plan!.steps[0].basis.includes("t18"));
  assert.match(r.fixes.join(" "), /t18/);
  // 상황에 그 기한의 근거가 없으면(당일 추가요금에는 30일 기한 근거가 없다) 거절
  const t2 = makeIncidentTools({ ...input, situation: "당일 추가요금" });
  const r2 = t2.submit_plan({ ...good, steps: [{ action: "업체에 30일 안에 답하라고 한다", basis_ids: ["k-1372"], when: "30일 이내" }, { action: "추가 금액의 근거를 묻는다", basis_ids: ["t8-2"], when: "바로" }, { action: "사실확인서를 받는다", basis_ids: ["k-evidence"], when: "바로" }] }) as { accepted: boolean; reasons: string[] };
  assert.equal(r2.accepted, false);
  assert.match(r2.reasons.join(" "), /30일/);
});
