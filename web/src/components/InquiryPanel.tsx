"use client";
// 오른쪽 패널: ① 문의 문장 → ② 업체 답변 점검(로컬 Ollama 에이전트) → ③ 남은 것만 다시 묻기
// 복사는 발송이 아니다. 갱신 후보는 기본 미선택 — 원문을 보고 하나씩 승인한다 (Sol B007 분석).
import { useEffect, useMemo, useState } from "react";
import { Bot, Check, ClipboardCopy, Loader2, Send, X } from "lucide-react";
import { composeRequest, guard } from "@/lib/message.ts";
import { SAMPLE_REPLY } from "@/lib/fixtures.ts";
import { baseCards, sigOf, type CaseApi, type QuoteEntry } from "@/lib/store.ts";
import type { AgentRun } from "@/lib/agent.ts";
import { makeTools } from "@/lib/proposals.ts";
import type { Inquiry } from "@/lib/types.ts";
import { StatusChip } from "./ui.tsx";
import { agentPost, warmup } from "./Dashboard.tsx";

const RAIL = [["get_open_cards", "항목 확인"], ["find_in_reply", "근거 찾기"], ["propose_updates", "후보·검증"], ["finish", "마침"]] as const;

// 견적(업체)마다 따로 묻고 답을 점검한다 — 고르기 전에 여러 후보에 물어볼 수 있다 (Astra K5)
export default function InquiryPanel({ api, q }: { api: CaseApi; q: QuoteEntry }) {
  const { state, cards, inquiry } = api;
  const update = (patch: Partial<QuoteEntry> | ((x: QuoteEntry) => Partial<QuoteEntry>)) => api.updateQuote(q.id, patch);
  const askerOn = true, checkerOn = state.agents.replycheck; // 질문은 점검 에이전트(또는 규칙 기준선)가 카드에 써 둔다
  const open = cards.filter((c) => c.ask && c.status !== "명시됨");
  // 이번 문의에 넣을 항목 (기본: 아직 답이 반영되지 않은 열린 항목 전부). state.asked는 지금까지 물어본 항목의 누적이다.
  const [selection, setSelection] = useState<string[] | null>(null);
  const chosen = open.filter((c) => (selection ?? open.map((x) => x.id)).includes(c.id));

  const composed = useMemo(() => (askerOn ? composeRequest(chosen, q.draft!) : ""), [chosen.map((c) => c.id).join(), q.draft, askerOn]); // eslint-disable-line react-hooks/exhaustive-deps
  const [message, setMessage] = useState(composed);
  useEffect(() => setMessage(composed), [composed]);
  const [copied, setCopied] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const run: AgentRun | undefined = q.runs[q.runs.length - 1];
  const [applied, setApplied] = useState(false);

  const markSent = (ids: string[]) => update((s) => ({
    asked: [...new Set([...s.asked, ...ids])],
    inquiry: { ...s.inquiry, ...Object.fromEntries(ids.map((id) => [id, "보냄" as Inquiry])) },
  }));
  const toggle = (id: string) => { const cur = selection ?? open.map((x) => x.id); setSelection(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]); };

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); } catch { setCopied("fail"); }
  }

  // 점검 대상: 물어본 항목 중 아직 열린 것 + 이미 견적에 적힌 항목(답변이 뒤집는지 보려고)
  const openAsked = open.filter((c) => q.asked.includes(c.id));
  const targets = openAsked.length ? openAsked : chosen;

  async function review() {
    setRunning(true); setError(""); setElapsed(0); setApplied(false); setPicked(new Set());
    const t0 = Date.now(); const timer = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    const ids = targets.map((c) => c.id);
    const before = q.inquiry; // 실패하면 되돌린다
    update((s) => ({ asked: [...new Set([...s.asked, ...ids])], inquiry: { ...s.inquiry, ...Object.fromEntries(ids.map((id) => [id, "답변 검토 대기" as Inquiry])) } }));
    const confirmed = cards.filter((c) => c.status === "명시됨");
    try {
      const r = await agentPost<AgentRun>("replycheck", "/api/reply", { cards: [...targets, ...confirmed].map(({ answered: _a, ...c }) => c), reply: q.reply, total: q.draft!.totalAmount });
      if (r.stopped === "error") { setError(r.note); update({ inquiry: before }); }
      update((s) => ({ runs: [...s.runs, r] }));
    } catch (e) {
      setError((e as Error).message);
      update({ inquiry: before });
    } finally { clearInterval(timer); setRunning(false); }
  }

  function apply() {
    if (!run) return;
    const base = Object.fromEntries(baseCards(state, q).map((c) => [c.id, c]));
    const overrides = { ...q.overrides };
    const inq = { ...q.inquiry };
    const asked = new Set(q.asked);
    for (const p of run.proposals) {
      if (!picked.has(p.cardId) || !base[p.cardId]) continue;
      // 조건 없는 포함 답변만 '총액 포함'. 조건부·상충이면 비용은 여전히 미확인이다.
      overrides[p.cardId] = { sig: sigOf(base[p.cardId], q, state), status: p.to, cost: p.to === "명시됨" ? "총액 포함" : p.relation === "conflicting" ? "미확인" : base[p.cardId].cost, answered: { relation: p.relation, quote: p.quote, followUp: p.followUp } };
      inq[p.cardId] = p.to === "명시됨" ? "답변 반영" : "재문의 필요";
      asked.add(p.cardId);
    }
    for (const id of asked) if (inq[id] === "답변 검토 대기") inq[id] = "미답"; // 답이 없었거나 승인하지 않음
    update({ overrides, inquiry: inq, asked: [...asked] });
    setApplied(true); setSelection(null);
  }

  const again = cards.filter((c) => inquiry[c.id] === "재문의 필요" || inquiry[c.id] === "미답").map((c) =>
    c.answered ? { ...c, ask: c.answered.followUp ?? `${c.title}: 말씀하신 “${c.answered.quote}”와 관련해, 비용이 생긴다면 얼마인지 계약 전에 알려 주실 수 있는지` } : c);
  const followUp = composeRequest(again, q.draft!, true);
  const stepDone = (tool: string) => !!run?.steps.some((s) => s.tool === tool);

  return (
    <aside className="side">
      <section className="panel">
        <div className="panel-head"><Send size={15} /><h2>업체 문의</h2><span className="sub">{q.label} · 이번에 물어볼 {chosen.length}항목 · 지금까지 {q.asked.length}항목 문의</span></div>

        <div className="stage">
          <div className="stage-title"><span className="n">1</span>확인 요청 보내기</div>
          {open.length === 0 ? <p className="hint">물어볼 항목이 없습니다.</p> : (
            <>
              <div className="row wrap" style={{ marginBottom: 8 }}>
                {open.map((c) => {
                  const on = chosen.some((x) => x.id === c.id);
                  return (
                    <label key={c.id} className={`chip ${on ? "st-brand" : "st-plain"}`} style={{ cursor: "pointer" }}>
                      <input type="checkbox" checked={on} onChange={() => toggle(c.id)} style={{ display: "none" }} />
                      {on ? <Check size={12} /> : null}{c.title}
                    </label>
                  );
                })}
              </div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} style={{ minHeight: 170 }} aria-label="업체에 보낼 확인 요청" placeholder="업체에 보낼 문장을 직접 써 주세요" />
              {guard(message).map((g) => <div className="warn" key={g.phrase}>‘{g.phrase}’ — {g.kind}. {g.fix}</div>)}
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn ghost sm" onClick={() => copy(message, "msg")}><ClipboardCopy size={13} />{copied === "msg" ? "복사했어요" : "복사"}</button>
                <button className="btn sm" disabled={!chosen.length} onClick={() => markSent(chosen.map((c) => c.id))}><Send size={13} />보냈다고 기록</button>
              </div>
              {copied === "fail" && <div className="warn">복사가 막혀 있어요. 위 칸을 전체 선택해 복사해 주세요.</div>}
              <p className="hint" style={{ marginTop: 6 }}>복사만으로는 '보냄'으로 바뀌지 않아요. 실제로 보낸 뒤 눌러 주세요.</p>
            </>
          )}
        </div>

        <div className="stage">
          <div className="stage-title"><span className="n">2</span>업체 답변 점검 <span className="chip st-brand" style={{ marginLeft: "auto" }}><Bot size={12} />로컬 에이전트</span></div>
          <textarea value={q.reply} onChange={(e) => { if (!q.reply && e.target.value) warmup("agent"); update({ reply: e.target.value }); }} placeholder="업체가 보낸 답변 문자·카톡을 붙여 넣어 주세요" aria-label="업체 답변" />
          <div className="row" style={{ marginTop: 8 }}>
            {!q.reply && <button className="btn ghost sm" onClick={() => { warmup("agent"); update({ reply: SAMPLE_REPLY }); }}>가상 답변 넣기</button>}
            <button className="btn sm" style={{ marginLeft: "auto" }} disabled={!q.reply.trim() || !targets.length || running || !checkerOn} onClick={review}>
              {running ? <><Loader2 size={13} className="spin" />점검 중 {elapsed}초</> : <><Bot size={13} />에이전트로 점검</>}
            </button>
          </div>
          {!checkerOn && <ManualReflect api={api} q={q} targets={targets} />}
          {running && elapsed > 8 && <p className="hint">로컬 모델 실행 중입니다. 첫 실행은 모델을 메모리에 올리느라 1~2분 걸릴 수 있어요.</p>}
          {error && <div className="warn">{error} 문의 상태는 그대로 두었습니다.</div>}

          {run && !running && (
            <>
              <div className="rail-steps" style={{ marginTop: 12 }}>
                {RAIL.map(([tool, label]) => <div key={tool} className={`rail-step ${stepDone(tool) ? "done" : ""}`}><div className="ball">{stepDone(tool) && <Check size={11} />}</div>{label}</div>)}
              </div>
              <details>
                <summary>에이전트가 한 일 · 도구 {run.steps.length}회 · {run.model.split(":")[0]} · {run.stopped === "finished" ? "정상 종료" : run.stopped === "limit" ? "상한 도달" : "오류"}</summary>
                <ol className="trace">
                  {run.steps.map((s) => {
                    const out = s.output as { cards?: unknown[]; matches?: string[]; results?: { title: string; accepted: boolean; reason: string }[]; error?: string };
                    return (
                      <li key={s.n}><code>{s.tool}</code>
                        {out.cards && <span className="hint"> 남은 항목 {out.cards.length}개</span>}
                        {out.matches && <span className="hint"> 문장 {out.matches.length}개</span>}
                        {out.error && <div className="rej">{out.error}</div>}
                        {out.results?.map((r, i) => <div key={i} className={r.accepted ? "acc" : "rej"}>{r.accepted ? "✓" : "✗ 거절"} {r.title} — {r.reason}</div>)}
                      </li>
                    );
                  })}
                </ol>
              </details>
              <p className="hint" style={{ margin: "8px 0" }}>{run.note}</p>

              {run.proposals.length > 0 && !applied && (
                <>
                  <div className="src-label row" style={{ justifyContent: "space-between" }}>반영할 후보 — 원문을 보고 고르세요
                    <button className="btn ghost sm" onClick={() => setPicked(picked.size === run.proposals.length ? new Set() : new Set(run.proposals.map((p) => p.cardId)))}>{picked.size === run.proposals.length ? "모두 해제" : "모두 선택"}</button></div>
                  {run.proposals.map((p) => (
                    <label className="proposal" key={p.cardId}>
                      <input type="checkbox" checked={picked.has(p.cardId)} onChange={(e) => { const n = new Set(picked); if (e.target.checked) n.add(p.cardId); else n.delete(p.cardId); setPicked(n); }} />
                      <span><b>{p.title}</b> <StatusChip s={p.from} /> → <StatusChip s={p.to} /><blockquote className="src reply">{p.quote}</blockquote>{p.followUp && <span className="hint">되물을 질문 (답변 에이전트): {p.followUp}</span>}</span>
                    </label>
                  ))}
                  <button className="btn block" onClick={apply}>{picked.size ? `선택한 ${picked.size}개 반영` : "반영 없이 남은 항목으로 정리"}</button>
                </>
              )}
              {run.proposals.length === 0 && !applied && run.stopped !== "error" && <button className="btn ghost block" onClick={apply}><X size={13} />답이 없는 것으로 정리</button>}
            </>
          )}
        </div>

        {again.length > 0 && (
          <div className="stage">
            <div className="stage-title"><span className="n">3</span>남은 것만 다시 묻기</div>
            <textarea readOnly value={followUp} style={{ minHeight: 150 }} aria-label="다시 물어볼 문장" />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn ghost sm" onClick={() => copy(followUp, "follow")}><ClipboardCopy size={13} />{copied === "follow" ? "복사했어요" : "복사"}</button>
              <button className="btn sm" onClick={() => markSent(again.map((c) => c.id))}><Send size={13} />보냈다고 기록</button>
            </div>
            <p className="hint" style={{ marginTop: 6 }}>답변 내용은 계약서에도 적히는지 확인해 두세요.</p>
          </div>
        )}
      </section>
    </aside>
  );
}


/** 답변 점검관을 껐을 때: 사용자가 답변 문장과 항목을 직접 골라도, 에이전트와 같은 검증을 통과해야 반영된다 (Argon#5) */
function ManualReflect({ api, q, targets }: { api: CaseApi; q: QuoteEntry; targets: { id: string; title: string }[] }) {
  const { state, cards } = api;
  const sentences = q.reply.split(/(?<=[.!?。])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
  const [card, setCard] = useState(targets[0]?.id ?? "");
  const [quote, setQuote] = useState("");
  const [relation, setRelation] = useState<"explicit_answer" | "conditional_answer">("explicit_answer");
  const [msg, setMsg] = useState("");
  function submit() {
    const tools = makeTools(cards, q.reply, q.draft?.totalAmount ?? null);
    const r = tools.propose_updates({ updates: [{ card_id: card, relation, quote }] }).results[0];
    const p = tools.proposals.get(card);
    if (!r.accepted || !p) return setMsg(`반영할 수 없어요: ${r.reason}`);
    const base = baseCards(state, q).find((c) => c.id === card)!;
    api.updateQuote(q.id, (x) => ({
      overrides: { ...x.overrides, [card]: { sig: sigOf(base, x, state), status: p.to, cost: p.to === "명시됨" ? "총액 포함" : base.cost, answered: { relation: p.relation, quote: p.quote } } },
      inquiry: { ...x.inquiry, [card]: p.to === "명시됨" ? "답변 반영" : "재문의 필요" },
      asked: [...new Set([...x.asked, card])],
    }));
    setMsg(`${r.title}: ${r.reason}`);
  }
  if (!q.reply.trim() || !targets.length) return <p className="hint">답변 점검관이 꺼져 있습니다. 답변을 붙여 넣으면 문장을 직접 골라 반영할 수 있어요.</p>;
  return (
    <div style={{ marginTop: 10 }}>
      <div className="src-label">답변 점검관 꺼짐 — 직접 고르기 (같은 검증기 통과 필요)</div>
      <select value={card} onChange={(e) => setCard(e.target.value)} aria-label="항목">{targets.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      <select value={quote} onChange={(e) => setQuote(e.target.value)} aria-label="답변 문장" style={{ marginTop: 6 }}>
        <option value="">답변 문장 고르기</option>{sentences.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <div className="row" style={{ marginTop: 6 }}>
        <div className="seg">{(["explicit_answer", "conditional_answer"] as const).map((v) => <button key={v} className={relation === v ? "on" : ""} onClick={() => setRelation(v)}>{v === "explicit_answer" ? "포함이라고 답함" : "조건을 달았음"}</button>)}</div>
        <button className="btn sm" style={{ marginLeft: "auto" }} disabled={!quote} onClick={submit}>검증 후 반영</button>
      </div>
      {msg && <div className={msg.startsWith("반영할 수 없") ? "warn" : "okline"}>{msg}</div>}
    </div>
  );
}
