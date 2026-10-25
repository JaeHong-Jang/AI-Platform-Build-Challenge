// 이사 지킴이 정확도 측정. 실행: node --import tsx eval/run.mts   (src/lib 는 수정하지 않는다)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compare } from "../src/lib/rules.ts";
import { extractQuote } from "../src/lib/extract.ts";
import { verifyDraft } from "../src/lib/verify.ts";
import { reviewReply } from "../src/lib/agent.ts";
import { AGENT_MODEL, READER_MODEL, ollamaUrl, warm } from "../src/lib/ollama.ts";
import type { Card, QuoteDraft } from "../src/lib/types.ts";
import * as TUNE from "./dataset.ts";
import type { QuoteCase, ReplyCase } from "./dataset.ts";
// EVAL_SET=holdout 이면 다른 작성자(Sol)가 만든 처음 보는 평가셋으로 잰다 — 결과 파일 이름도 따로 (B009 심사 지적)
const SET = process.env.EVAL_SET === "holdout" ? "holdout" : "tune";
let QUOTES: QuoteCase[] = TUNE.QUOTES, REPLIES: ReplyCase[] = TUNE.REPLIES;

process.env.OLLAMA_URL ??= "http://172.20.32.1:11434";
const dir = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");
const nid = (id: string) => (id.startsWith("fee-") ? "fee" : id === "unread-총액" ? "total" : id);
const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

interface Cell { status: string; ask: boolean; evidence: string[]; why: string }
function cellMap(cards: Card[]): Map<string, Cell> {
  const m = new Map<string, Cell>();
  for (const c of cards) {
    const k = nid(c.id);
    const cur = m.get(k);
    const cell = { status: c.status, ask: !!c.ask.trim(), evidence: c.evidence, why: c.why };
    if (!cur || (cur.status === "명시됨" && c.status !== "명시됨")) m.set(k, cell); // 같은 묶음은 가장 나쁜 쪽
  }
  return m;
}

// 카드 판정 채점: 정답(q.explicit / q.need) 대비
function scoreCards(q: QuoteCase, cards: Card[]) {
  const m = cellMap(cards);
  const misReflect: { card: string; evidence: string[]; why: string }[] = [];
  const missedAsk: string[] = [];
  const overAsk: string[] = [];
  let needHit = 0;
  for (const id of q.need) {
    const c = m.get(id);
    if (c && c.status === "명시됨") misReflect.push({ card: id, evidence: c.evidence, why: c.why });
    else if (c && c.ask) needHit++;
    else missedAsk.push(id);
  }
  for (const id of q.explicit) { const c = m.get(id); if (c && c.status !== "명시됨") overAsk.push(id); }
  return { need: q.need.length, needHit, misReflect, missedAsk, overAsk, explicit: q.explicit.length };
}

// 값 채움: 총액·계약금·인원이 정답과 다르고 null도 아닌 경우. 누락: 정답이 있는데 null.
function scoreValues(d: QuoteDraft, g: QuoteDraft, text: string) {
  const fill: string[] = [], miss: string[] = [];
  for (const k of ["totalAmount", "deposit", "workers"] as const) {
    if (d[k] !== null && d[k] !== g[k]) fill.push(`${k}=${d[k]} (정답 ${g[k]})`);
    if (g[k] !== null && d[k] === null) miss.push(`${k} (정답 ${g[k]})`);
  }
  if (d.truck !== null && g.truck === null) fill.push(`truck="${d.truck}" (정답 null)`);
  const t = norm(text);
  const fake = d.listedItems.filter((l) => l.quote.trim() && !t.includes(norm(l.quote))).map((l) => l.quote);
  return { fill, miss, fake };
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
function aggregate(rows: { s: ReturnType<typeof scoreCards>; v?: ReturnType<typeof scoreValues>; ms?: number }[]) {
  const need = sum(rows.map((r) => r.s.need)), hit = sum(rows.map((r) => r.s.needHit));
  return {
    cases: rows.length,
    misReflect: sum(rows.map((r) => r.s.misReflect.length)),
    needTotal: need, needAsked: hit, recall: need ? +(hit / need).toFixed(3) : null,
    overAsk: sum(rows.map((r) => r.s.overAsk.length)), explicitTotal: sum(rows.map((r) => r.s.explicit)),
    valueFill: sum(rows.map((r) => r.v?.fill.length ?? 0)),
    valueMiss: sum(rows.map((r) => r.v?.miss.length ?? 0)),
    fakeQuotes: sum(rows.map((r) => r.v?.fake.length ?? 0)),
    avgMs: avg(rows.map((r) => r.ms ?? 0).filter((x) => x > 0)),
  };
}

(async () => {
  if (SET === "holdout") { const H = await import("./holdout.ts"); QUOTES = H.QUOTES; REPLIES = H.REPLIES; }
  const conditions: Record<string, unknown> = { ollama: ollamaUrl(), reader: READER_MODEL(), agent: AGENT_MODEL(), quotes: QUOTES.length, replies: REPLIES.length, repeats: 1, temperature: 0, num_ctx: 8192, date: new Date().toISOString() };

  // (a) 규칙 단독 — 정답 초안
  const ruleRows = QUOTES.map((q) => ({ id: q.id, s: scoreCards(q, compare(q.items, q.gold, q.cond, q.text)) }));
  const ruleAgg = aggregate(ruleRows);
  // (a') 정답 초안을 검증기에 통과시켰을 때 정답 값이 지워지는지
  const verifyOnGold = QUOTES.map((q) => {
    const v = verifyDraft(q.text, q.gold);
    const s = scoreCards(q, compare(q.items, v.draft, q.cond, q.text));
    return { id: q.id, dropped: v.dropped, s, v: scoreValues(v.draft, q.gold, q.text) };
  });
  const verifyGoldAgg = aggregate(verifyOnGold);

  // (b) LLM 파이프라인: 기준선(raw, 원문 대조 없음) vs 검증기 포함
  console.log("warm reader…", READER_MODEL(), await warm(READER_MODEL()).catch((e) => String(e)));
  const quoteRuns: any[] = [];
  for (const q of QUOTES) {
    const t0 = Date.now();
    try {
      const r = await extractQuote(q.text);
      const base = scoreCards(q, compare(q.items, r.raw, q.cond)); // 검증기 없음: src 인자도 없음
      const full = scoreCards(q, compare(q.items, r.draft, q.cond, q.text));
      const bv = scoreValues(r.raw, q.gold, q.text), fv = scoreValues(r.draft, q.gold, q.text);
      quoteRuns.push({ id: q.id, ms: r.ms, wall: Date.now() - t0, dropped: r.dropped, raw: r.raw, draft: r.draft, base, baseV: bv, full, fullV: fv });
      console.log(q.id, `${r.ms}ms`, "기준선 오반영", base.misReflect.length, "검증 후", full.misReflect.length, "dropped", r.dropped.length);
    } catch (e) {
      quoteRuns.push({ id: q.id, error: String(e), wall: Date.now() - t0 });
      console.log(q.id, "ERROR", String(e));
    }
  }
  const okQ = quoteRuns.filter((r) => !r.error);
  const baseAgg = aggregate(okQ.map((r) => ({ s: r.base, v: r.baseV, ms: r.ms })));
  const fullAgg = aggregate(okQ.map((r) => ({ s: r.full, v: r.fullV, ms: r.ms })));
  const droppedTotal = sum(okQ.map((r) => r.dropped.length));

  // (c) 답변 점검 — 카드는 정답 초안으로 만든 것(추출 오류와 분리)
  console.log("warm agent…", AGENT_MODEL(), await warm(AGENT_MODEL()).catch((e) => String(e)));
  const replyRuns: any[] = [];
  for (const rc of REPLIES) {
    const q = QUOTES.find((x) => x.id === rc.quoteId)!;
    const cards = compare(q.items, q.gold, q.cond, q.text);
    const openIds = new Set(cards.filter((c) => c.status !== "명시됨").map((c) => c.id));
    const notOpen = rc.allowed.filter((a) => !openIds.has(a));
    const t0 = Date.now();
    try {
      const run = await reviewReply(cards, rc.text, undefined, q.gold.totalAmount);
      // 모델이 propose_updates로 낸 모든 후보(코드가 거절한 것 포함)
      const offers: { card: string; relation: string; accepted: boolean; reason: string }[] = [];
      for (const st of run.steps) {
        if (st.tool !== "propose_updates") continue;
        const ups = ((st.input as any)?.updates ?? []) as any[];
        const res = ((st.output as any)?.results ?? []) as any[];
        ups.forEach((u, i) => offers.push({ card: String(u?.card_id ?? "").replace(/\s*\(.*\)$/, ""), relation: String(u?.relation), accepted: !!res[i]?.accepted, reason: String(res[i]?.reason ?? "") }));
      }
      const explicitOffered = new Set(offers.filter((o) => o.relation === "explicit_answer" && openIds.has(o.card)).map((o) => o.card));
      const modelBad = [...explicitOffered].filter((c) => !rc.allowed.includes(c));
      const after = run.proposals.filter((p) => p.to === "명시됨").map((p) => p.cardId);
      const afterBad = after.filter((c) => !rc.allowed.includes(c));
      const rejectedBad = modelBad.filter((c) => !after.includes(c));
      const lostGood = rc.allowed.filter((c) => explicitOffered.has(c) && !after.includes(c));
      replyRuns.push({ id: rc.id, quoteId: rc.quoteId, type: rc.type, text: rc.text, allowed: rc.allowed, notOpen, wall: Date.now() - t0, stopped: run.stopped, steps: run.steps.length,
        offers, modelBad, afterBad, rejectedBad, lostGood, modelHit: rc.allowed.filter((c) => explicitOffered.has(c)), afterHit: rc.allowed.filter((c) => after.includes(c)),
        proposals: run.proposals });
      console.log(rc.id, rc.type, `${Date.now() - t0}ms`, "모델단독 오반영", modelBad.length, "검증후", afterBad.length, run.stopped);
    } catch (e) {
      replyRuns.push({ id: rc.id, quoteId: rc.quoteId, type: rc.type, text: rc.text, error: String(e), wall: Date.now() - t0 });
      console.log(rc.id, "ERROR", String(e));
    }
  }
  const okR = replyRuns.filter((r) => !r.error);
  const allowedTotal = sum(okR.map((r) => r.allowed.length));
  const replyAgg = {
    cases: okR.length, errors: replyRuns.length - okR.length, stoppedNotFinished: okR.filter((r) => r.stopped !== "finished").length,
    modelOnly: { misReflect: sum(okR.map((r) => r.modelBad.length)), recall: allowedTotal ? +(sum(okR.map((r) => r.modelHit.length)) / allowedTotal).toFixed(3) : null },
    verified: { misReflect: sum(okR.map((r) => r.afterBad.length)), recall: allowedTotal ? +(sum(okR.map((r) => r.afterHit.length)) / allowedTotal).toFixed(3) : null },
    rejectedBad: sum(okR.map((r) => r.rejectedBad.length)), lostGood: sum(okR.map((r) => r.lostGood.length)),
    allowedTotal, avgMs: avg(okR.map((r) => r.wall)),
  };

  const results = { conditions, rule: { agg: ruleAgg, rows: ruleRows }, verifyOnGold: { agg: verifyGoldAgg, rows: verifyOnGold }, quote: { baseAgg, fullAgg, droppedTotal, runs: quoteRuns }, reply: { agg: replyAgg, runs: replyRuns } };
  const suffix = SET === "holdout" ? "-holdout" : "";
  writeFileSync(`${dir}/results${suffix}.json`, JSON.stringify(results, null, 2));
  writeFileSync(`${dir}/REPORT${suffix}.md`, report(results));
  console.log(JSON.stringify({ rule: ruleAgg, verifyGold: verifyGoldAgg, baseAgg, fullAgg, droppedTotal, replyAgg }, null, 1));
})();

function pct(x: number | null) { return x === null ? "-" : `${(x * 100).toFixed(0)}%`; }
function report(r: any): string {
  const c = r.conditions, b = r.quote.baseAgg, f = r.quote.fullAgg, ra = r.reply.agg, ru = r.rule.agg, vg = r.verifyOnGold.agg;
  const L: string[] = [];
  L.push("# 이사 지킴이 정확도 측정 (B009 분석)", "", "> 합성 평가셋 20+20건. **정답 라벨은 Sonnet이 표준약관·D006 기준으로 작성했고 사람 검수 전이다.** 실제 소비자 견적이 아니라 합성이므로 일반화 주장은 하지 않는다.", "");
  L.push("## 1. 모델 단독 vs 검증기 포함", "");
  L.push("### 측정 조건", "", "| 항목 | 값 |", "|---|---|", `| 견적 읽기 모델 | ${c.reader} (Ollama, ${c.ollama}) |`, `| 답변 점검 모델 | ${c.agent} |`, "| GPU | 로컬 GPU 1대(8GB급, 모델 교대 시 재적재) — 호출은 순차 실행 |", "| 웜/콜드 | 각 모델 시작 전 `warm()`으로 미리 적재 후 측정(콜드 시간 제외). 견적 20건을 모두 마친 뒤 답변 20건을 돌려 모델 교대 1회 |", `| 건수 | 견적 ${c.quotes}건, 답변 ${c.replies}건 |`, `| 반복 | ${c.repeats}회 (temperature ${c.temperature}, num_ctx ${c.num_ctx}) — 분산 미측정 |`, `| 실행 시각 | ${c.date} |`, "");
  L.push("### 견적 읽기 (정답 대비, 총 확인 필요 정답 카드 " + b.needTotal + "개 / 명시됨 정답 카드 " + b.explicitTotal + "개)", "",
    "| 지표 | 모델 단독 (raw, 원문 대조 없음) | 검증기 포함 (현재 파이프라인) |", "|---|---|---|",
    `| 오반영 (정답 확인 필요인데 '명시됨') | ${b.misReflect}건 | ${f.misReflect}건 |`,
    `| 질문 재현율 (정답 확인 필요 카드 중 질문으로 뽑힘) | ${pct(b.recall)} (${b.needAsked}/${b.needTotal}) | ${pct(f.recall)} (${f.needAsked}/${f.needTotal}) |`,
    `| 원문에 없는 값 채움 (총액·계약금·인원·차량) | ${b.valueFill}건 | ${f.valueFill}건 |`,
    `| 허위 발췌 (품목 quote가 원문에 없음) | ${b.fakeQuotes}건 | ${f.fakeQuotes}건 (코드가 제거) |`,
    `| 값 누락 (정답이 있는데 null) | ${b.valueMiss}건 | ${f.valueMiss}건 |`,
    `| 과잉 질문 (정답 명시됨인데 질문) | ${b.overAsk}건 | ${f.overAsk}건 |`,
    `| 검증기가 걸러낸 항목 | - | ${r.quote.droppedTotal}개 |`,
    `| 평균 소요(모델 응답) | ${b.avgMs}ms (같은 호출) | ${f.avgMs}ms (검증 비용은 무시할 수준) |`, "");
  L.push("### 답변 점검 (정답 명시 카드 " + ra.allowedTotal + "개)", "",
    "| 지표 | 모델 단독 (거절된 후보 포함 전부) | 코드 검증 통과 후 |", "|---|---|---|",
    `| 오반영 (정답에 없는 카드를 명시됨으로 제안) | ${ra.modelOnly.misReflect}건 | ${ra.verified.misReflect}건 |`,
    `| 정답 명시 카드 재현율 | ${pct(ra.modelOnly.recall)} | ${pct(ra.verified.recall)} |`,
    `| 모델이 냈지만 코드가 거절한 오반영 | - | ${ra.rejectedBad}건 |`,
    `| 코드가 거절해 잃은 정답 후보 | - | ${ra.lostGood}건 |`,
    `| 평균 소요 | ${ra.avgMs}ms (한 건 전체) | 동일 |`, `| 비정상 종료(error/limit) | ${ra.stoppedNotFinished}건, 호출 실패 ${ra.errors}건 | |`, "");
  L.push("## 2. 규칙 단독 (정답 초안 입력)", "", "LLM 없이 사람이 읽은 값(정답 초안)을 `compare(items, gold, cond, text)`에 넣은 결과. 규칙 자체의 정확도.", "",
    "| 지표 | 값 |", "|---|---|", `| 오반영 | ${ru.misReflect}건 |`, `| 질문 재현율 | ${pct(ru.recall)} (${ru.needAsked}/${ru.needTotal}) |`, `| 과잉 질문 | ${ru.overAsk}건 / 정답 명시 ${ru.explicitTotal}개 |`, `| 값 채움 | 0건 (정답 초안 그대로 사용) |`, "",
    `정답 초안을 검증기(verifyDraft)에 먼저 통과시키면 오반영 ${vg.misReflect}건, 재현율 ${pct(vg.recall)}, 과잉 질문 ${vg.overAsk}건, **정답 값이 잘못 지워진 건 ${vg.valueMiss}건**.`, "");

  L.push("## 3. 실패 사례", "");
  const qtext = (id: string) => QUOTES.find((x) => x.id === id)!.text;
  L.push("### 3-1. 규칙 단독 오반영·과잉 질문", "");
  for (const row of r.rule.rows) {
    if (row.s.misReflect.length) for (const m of row.s.misReflect) L.push(`- **${row.id} 오반영** \`${m.card}\` — 근거 ${JSON.stringify(m.evidence)}`, "");
    if (row.s.overAsk.length) L.push(`- ${row.id} 과잉 질문: ${row.s.overAsk.join(", ")}`, "");
  }
  L.push("### 3-2. LLM 파이프라인 (검증기 포함) 오반영·값 채움", "");
  for (const x of r.quote.runs) {
    if (x.error) { L.push(`- ${x.id} 호출 실패: ${x.error}`, ""); continue; }
    const items = [...x.full.misReflect.map((m: any) => `오반영 \`${m.card}\` 근거 ${JSON.stringify(m.evidence)}`), ...x.fullV.fill.map((v: string) => `값 채움 ${v}`)];
    if (items.length) L.push(`#### ${x.id}`, "", ...items.map((i: string) => `- ${i}`), "", "원문:", "```", qtext(x.id), "```", "");
  }
  L.push("### 3-3. 검증기 없을 때(raw) 나온 오반영·값 채움 (검증기가 막은 사례)", "");
  for (const x of r.quote.runs) {
    if (x.error) continue;
    const items = [...x.base.misReflect.map((m: any) => `오반영 \`${m.card}\``), ...x.baseV.fill.map((v: string) => `값 채움 ${v}`), ...x.baseV.fake.map((v: string) => `허위 발췌 "${v}"`)];
    if (items.length) L.push(`- ${x.id}: ${items.join(" / ")}${x.dropped.length ? ` — 검증기가 버림: ${x.dropped.join("; ")}` : ""}`, "");
  }
  L.push("### 3-3b. 검증기가 정답 값을 잘못 지운 사례 (값 누락 → '판독 불가' 질문으로 바뀜. 오반영은 아니고 사용자 부담 증가)", "");
  for (const x of r.quote.runs) if (!x.error && x.fullV.miss.length) L.push(`- ${x.id}: ${x.fullV.miss.join(", ")} — 검증기 메시지: ${x.dropped.filter((d: string) => /총액|계약금|인원/.test(d)).join("; ")}`);
  for (const x of r.verifyOnGold.rows) if (x.v.miss.length) L.push(`- (정답 초안에 검증기만 적용) ${x.id}: ${x.v.miss.join(", ")}`);
  L.push("", "### 3-4. 질문 놓침 (검증기 포함)", "");
  for (const x of r.quote.runs) if (!x.error && x.full.missedAsk.length) L.push(`- ${x.id}: ${x.full.missedAsk.join(", ")}`);
  L.push("", "### 3-5. 답변 점검 실패", "");
  for (const x of r.reply.runs) {
    if (x.error) { L.push(`- ${x.id} 호출 실패: ${x.error}`, ""); continue; }
    if (x.afterBad.length || x.modelBad.length || x.lostGood.length || x.stopped !== "finished") {
      L.push(`#### ${x.id} (${x.type}, ${x.quoteId}) — 종료 ${x.stopped}`, "", `답변 원문: "${x.text}"`, "", `- 정답 명시 카드: ${JSON.stringify(x.allowed)}`, `- 모델 단독 오반영: ${JSON.stringify(x.modelBad)} / 검증 후 오반영: ${JSON.stringify(x.afterBad)} / 코드가 거절한 오반영: ${JSON.stringify(x.rejectedBad)} / 코드가 거절해 잃은 정답: ${JSON.stringify(x.lostGood)}`, `- 모델 후보 전부: ${JSON.stringify(x.offers)}`, "");
    }
  }
  L.push("## 4. 건별 소요 시간", "", "| 견적 | 모델 응답 ms | | 답변 | 전체 ms | 종료 |", "|---|---|---|---|---|---|");
  for (let i = 0; i < 20; i++) { const q = r.quote.runs[i], a = r.reply.runs[i]; L.push(`| ${q?.id} | ${q?.ms ?? "-"} | | ${a?.id} | ${a?.wall ?? "-"} | ${a?.stopped ?? "-"} |`); }
  return L.join("\n") + "\n";
}
