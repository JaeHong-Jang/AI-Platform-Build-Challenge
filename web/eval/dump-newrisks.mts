// 점검 에이전트가 새로 낸 위험을 사례 조건·원문과 함께 검토용 마크다운으로 뽑는다
import { readFileSync, writeFileSync } from "node:fs";
import { QUOTES } from "./holdout.ts";
const R = JSON.parse(readFileSync(new URL("./results-inspect-holdout.json", import.meta.url), "utf8"));
const site = (s: { floor: number; elevator: string; parkingFar: string }) => `${s.floor}층·엘리베이터 ${s.elevator}·차 대는 곳 멂 ${s.parkingFar}`;
let out = "";
for (const r of R.rows) {
  const q = QUOTES.find((x) => x.id === r.id)!;
  out += `\n### ${r.id}\n- 조건: 출발 ${site(q.cond.from as never)} / 도착 ${site(q.cond.to as never)} / 사다리차 필요 ${q.cond.ladderNeeded}\n- 짐: ${q.items.map((i) => `${i.name} ${i.count}`).join(", ")}\n- 견적 원문:\n\`\`\`\n${q.text}\n\`\`\`\n- 에이전트가 새로 낸 위험:\n${r.newRisks.map((x: string, i: number) => `  ${i + 1}. ${x}`).join("\n") || "  (없음)"}\n`;
}
writeFileSync(process.argv[2], out);
console.log(out.length);
