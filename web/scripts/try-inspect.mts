// 점검 에이전트 한 번 돌려 보기: node --import tsx scripts/try-inspect.mts [모델]
import { inspectQuote } from "../src/lib/inspector.ts";
import { applyInspection } from "../src/lib/inspect.ts";
import { compare } from "../src/lib/rules.ts";
import { verifyDraft } from "../src/lib/verify.ts";
import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS, SAMPLE_QUOTE_TEXT } from "../src/lib/fixtures.ts";

if (process.argv[2]) process.env.OLLAMA_AGENT_MODEL = process.argv[2];
const draft = verifyDraft(SAMPLE_QUOTE_TEXT, QUOTE_DRAFT).draft;
const input = { items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS, draft, quoteText: SAMPLE_QUOTE_TEXT };
const run = await inspectQuote(input);
for (const s of run.steps) console.log(`#${s.n} ${s.tool} ${s.ms}ms`, JSON.stringify(s.input).slice(0, 300), "\n   →", JSON.stringify(s.output).slice(0, 400));
console.log("\n", run.stopped, run.note, `${(run.ms / 1000).toFixed(1)}s`);
const base = compare(input.items, draft, input.cond, input.quoteText);
for (const c of applyInspection(base, run)) console.log(c.by ? "AI" : "규칙", c.status.padEnd(10), c.title, "|", c.why.slice(0, 80), "|", c.ask.slice(0, 90));
