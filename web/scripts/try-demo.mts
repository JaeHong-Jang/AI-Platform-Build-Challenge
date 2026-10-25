// 최종 시연 장면 확인: 계약 전에 승인한 파손·보험 답변 → 이사 후 TV 파손 → 사고 대응
import { respond } from "../src/lib/responder.ts";
const records = [
  "견적서(바른용달이사, 원문 확인): 총액 350,000원 · 계약금 50,000원 · 차량 1톤 1대 · 인원 2명",
  "업체 답변(사용자 승인) — 출발지 계단 작업: '3층 계단 작업은 총액 35만원에 포함입니다.'",
  "업체 답변(사용자 승인) — 파손·분실 배상: '이사화물배상책임보험에 가입돼 있고, 파손 시 보험으로 배상합니다.'",
];
const r = await respond({ situation: "파손", story: "어제 이사했는데 새 집에서 짐을 풀어 보니 TV 화면이 깨져 있어요.", records });
console.log(r.stopped, `${(r.ms / 1000).toFixed(1)}s`, r.steps.map((s) => s.tool).join("→"));
console.log(JSON.stringify(r.plan, null, 1));
