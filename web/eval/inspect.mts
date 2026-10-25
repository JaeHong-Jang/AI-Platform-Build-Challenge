// 점검 에이전트 측정 (B012): 같은 정답 초안(사람이 읽은 값)에서 규칙 기준선 vs 규칙 + 점검 에이전트.
// 읽기 오류를 빼고 '판단' 단계만 비교한다. 실행: EVAL_SET=holdout node --import tsx eval/inspect.mts
// 정답 라벨은 기존 카드(explicit/need)만 있다 — 에이전트가 새로 찾은 위험 카드는 라벨이 없어 따로 센다(사람 검수 전).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compare } from "../src/lib/rules.ts";
import { applyInspection } from "../src/lib/inspect.ts";
import { inspectQuote } from "../src/lib/inspector.ts";
import { AGENT_MODEL, warm } from "../src/lib/ollama.ts";
import type { Card } from "../src/lib/types.ts";
import * as TUNE from "./dataset.ts";
import type { QuoteCase } from "./dataset.ts";

process.env.OLLAMA_URL ??= "http://172.20.32.1:11434";
const SET = process.env.EVAL_SET === "holdout" ? "holdout" : "tune";
const QUOTES: QuoteCase[] = SET === "holdout" ? (await import("./holdout.ts")).QUOTES : TUNE.QUOTES;
const dir = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");
const nid = (id: string) => (id.startsWith("fee-") ? "fee" : id === "unread-총액" ? "total" : id);

function score(q: QuoteCase, cards: Card[]) {
  const m = new Map<string, Card>();
  for (const c of cards) { const k = nid(c.id); const cur = m.get(k); if (!cur || (cur.status === "명시됨" && c.status !== "명시됨")) m.set(k, c); }
  const mis = q.need.filter((id) => m.get(id)?.status === "명시됨");
  const hit = q.need.filter((id) => { const c = m.get(id); return c && c.status !== "명시됨" && c.ask.trim(); });
  const over = q.explicit.filter((id) => { const c = m.get(id); return c && c.status !== "명시됨"; });
  return { need: q.need.length, hit: hit.length, mis, over, explicit: q.explicit.length };
}
// 질문이 내 조건을 짚는가: 층수·짐 이름 중 하나라도 들어 있으면 '맞춤 질문'
const personal = (q: QuoteCase, ask: string) => /\d+\s*층/.test(ask) || q.items.some((i) => ask.includes(i.name));

await warm(AGENT_MODEL()).catch(() => undefined);
const rows = [];
for (const q of QUOTES) {
  const rule = compare(q.items, q.gold, q.cond, q.text);
  const run = await inspectQuote({ items: q.items, cond: q.cond, draft: q.gold, quoteText: q.text });
  const merged = applyInspection(rule, run);
  const asksRule = rule.filter((c) => c.status !== "명시됨" && c.ask), asksAgent = merged.filter((c) => c.status !== "명시됨" && c.ask);
  rows.push({
    id: q.id, trait: q.trait, stopped: run.stopped, ms: run.ms, tools: run.steps.length,
    rejected: run.steps.flatMap((s) => ((s.output as { results?: { accepted: boolean }[] })?.results ?? []).filter((r) => !r.accepted)).length,
    rule: score(q, rule), agent: score(q, merged),
    newRisks: run.findings.filter((f) => f.isNew).map((f) => `${f.title} — ${f.question}`),
    personalRule: asksRule.filter((c) => personal(q, c.ask)).length, personalAgent: asksAgent.filter((c) => personal(q, c.ask)).length, asksAgent: asksAgent.length, asksRule: asksRule.length,
  });
  const r = rows[rows.length - 1];
  console.log(q.id, r.stopped, `${(r.ms / 1000).toFixed(1)}s`, `도구 ${r.tools}`, `오반영 ${r.rule.mis.length}→${r.agent.mis.length}`, `재현 ${r.rule.hit}→${r.agent.hit}/${r.rule.need}`, `과잉 ${r.rule.over.length}→${r.agent.over.length}`, `새 위험 ${r.newRisks.length}`);
}
const S = (f: (r: (typeof rows)[number]) => number) => rows.reduce((n, r) => n + f(r), 0);
const agg = {
  model: AGENT_MODEL(), set: SET, quotes: rows.length, date: new Date().toISOString(),
  finished: rows.filter((r) => r.stopped === "finished").length, avgSec: +(S((r) => r.ms) / rows.length / 1000).toFixed(1), tools: S((r) => r.tools), rejected: S((r) => r.rejected),
  need: S((r) => r.rule.need), explicit: S((r) => r.rule.explicit),
  rule: { hit: S((r) => r.rule.hit), mis: S((r) => r.rule.mis.length), over: S((r) => r.rule.over.length), personal: S((r) => r.personalRule), asks: S((r) => r.asksRule) },
  agent: { hit: S((r) => r.agent.hit), mis: S((r) => r.agent.mis.length), over: S((r) => r.agent.over.length), personal: S((r) => r.personalAgent), asks: S((r) => r.asksAgent) },
  newRisks: S((r) => r.newRisks.length),
};
writeFileSync(`${dir}/results-inspect-${SET}.json`, JSON.stringify({ agg, rows }, null, 1));
console.log(JSON.stringify(agg, null, 1));
