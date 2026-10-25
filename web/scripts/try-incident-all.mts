// 사고 대응 에이전트 4개 상황 한 번씩: node --import tsx scripts/try-incident-all.mts
import { respond } from "../src/lib/responder.ts";
const records = ["견적서(바른용달이사, 원문 확인): 총액 350,000원 · 계약금 50,000원 · 차량 1톤 1대 · 인원 2명", "업체 답변(사용자 승인) — 출발지 계단 작업: '3층 계단 작업은 총액 35만원에 포함입니다.'"];
const cases = [
  ["당일 추가요금", "기사님이 3층 계단이라 짐이 많다며 5만원 더 달래요. 안 주면 못 옮긴대요."],
  ["이사 거부·계약금", "추가 비용을 못 드린다고 하니 짐을 안 싣고 가 버렸어요. 계약금은 못 돌려준대요."],
  ["파손", "어제 이사했는데 새 집에서 짐을 풀어 보니 TV 화면이 깨져 있어요."],
  ["분실", "이삿짐 박스 하나가 안 왔어요. 업체는 다 실었다고 해요."],
] as const;
for (const [situation, story] of cases) {
  const r = await respond({ situation, story, records });
  const rej = r.steps.filter((s) => (s.output as { accepted?: boolean })?.accepted === false).map((s) => (s.output as { reasons: string[] }).reasons.join(" / "));
  console.log(`\n=== ${situation} · ${r.stopped} · ${(r.ms / 1000).toFixed(1)}s · 도구 ${r.steps.length} (${r.steps.map((s) => s.tool).join("→")})`);
  if (rej.length) console.log("거절:", rej.map((x) => x.slice(0, 160)).join(" || "));
  if (r.plan) { console.log("요약:", r.plan.summary); r.plan.steps.forEach((s, i) => console.log(` ${i + 1}. [${s.basis.join(",")}] ${s.action} (${s.when})`)); console.log("문자:", r.plan.message); console.log("상담:", r.plan.escalate); }
  else console.log(r.note);
}
