// 사고 대응 에이전트 측정 (B013): 4개 상황 × 반복 N회 — 검증기를 통과한 계획을 만든 비율, 도구 호출, 거절 횟수, 시간.
// 실행: node --import tsx eval/incident.mts [반복=3]. 결과 eval/results-incident.json
import { writeFileSync } from "node:fs";
import { respond } from "../src/lib/responder.ts";
import { AGENT_MODEL } from "../src/lib/ollama.ts";
process.env.OLLAMA_URL ??= "http://172.20.32.1:11434";
const N = Number(process.argv[2] ?? 3);
const records = ["견적서(가상바른용달, 원문 확인): 총액 350,000원 · 계약금 50,000원 · 차량 1톤 1대 · 인원 2명", "업체 답변(사용자 승인) — 출발지 계단 작업: '3층 계단 작업은 총액 35만원에 포함입니다.'"];
const cases = [
  ["당일 추가요금", "기사님이 3층 계단이라 짐이 많다며 5만원 더 달래요. 안 주면 못 옮긴대요."],
  ["이사 거부·계약금", "추가 비용을 못 드린다고 하니 짐을 안 싣고 가 버렸어요. 계약금은 못 돌려준대요."],
  ["파손", "어제 이사했는데 새 집에서 짐을 풀어 보니 TV 화면이 깨져 있어요."],
  ["분실", "이삿짐 박스 하나가 안 왔어요. 업체는 다 실었다고 해요."],
] as const;
const rows = [];
for (let k = 0; k < N; k++) for (const [situation, story] of cases) {
  const r = await respond({ situation, story, records });
  const rejected = r.steps.filter((s) => (s.output as { accepted?: boolean })?.accepted === false).length;
  rows.push({ situation, run: k + 1, ok: !!r.plan, stopped: r.stopped, ms: r.ms, tools: r.steps.length, rejected, bases: r.plan ? [...new Set(r.plan.steps.flatMap((s) => s.basis))] : [] });
  console.log(situation, k + 1, r.plan ? "계획" : "근거만", `${(r.ms / 1000).toFixed(1)}s`, `도구 ${r.steps.length}`, `거절 ${rejected}`);
}
const by = Object.fromEntries(cases.map(([s]) => [s, `${rows.filter((r) => r.situation === s && r.ok).length}/${N}`]));
const agg = { model: AGENT_MODEL(), date: new Date().toISOString(), runs: rows.length, ok: rows.filter((r) => r.ok).length, bySituation: by, avgSec: +(rows.reduce((n, r) => n + r.ms, 0) / rows.length / 1000).toFixed(1), rejectedTotal: rows.reduce((n, r) => n + r.rejected, 0) };
writeFileSync(new URL("./results-incident.json", import.meta.url), JSON.stringify({ agg, rows }, null, 1));
console.log(JSON.stringify(agg, null, 1));
