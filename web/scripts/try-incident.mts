// 사고 대응 에이전트 한 번 돌려 보기: node --import tsx scripts/try-incident.mts [상황] [설명]
import { respond } from "../src/lib/responder.ts";
const situation = (process.argv[2] ?? "당일 추가요금") as "당일 추가요금";
const story = process.argv[3] ?? "기사님이 3층 계단이라 짐이 많다며 5만원 더 달래요. 안 주면 못 옮긴대요.";
const records = ["견적서(바른용달이사, 원문 확인): 총액 350,000원 · 계약금 50,000원 · 차량 1톤 1대 · 인원 2명", "업체 답변(사용자 승인) — 출발지 계단 작업: '3층 계단 작업은 총액 35만원에 포함입니다.'"];
const r = await respond({ situation, story, records });
for (const s of r.steps) console.log(`#${s.n} ${s.tool} ${s.ms}ms`, JSON.stringify(s.input).slice(0, 200), "\n  →", JSON.stringify(s.output).slice(0, 300));
console.log(r.stopped, r.note, `${(r.ms / 1000).toFixed(1)}s`);
console.log(JSON.stringify(r.plan, null, 1));
