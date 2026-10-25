"use client";
// 사고 대응 (B013): 이사 당일·이후 문제가 생기면 — 상황 고르기 + 무슨 일인지 한두 문장 → 사고 대응 에이전트가
// 계약 전 기록과 공식 근거로 대응 순서·챙길 증거·업체에 보낼 문자를 만든다. 법률 판단은 하지 않는다.
import { useMemo, useState } from "react";
import { Bot, ClipboardCopy, LifeBuoy, Loader2 } from "lucide-react";
import { isOn } from "@/lib/agents.ts";
import { BASES, basesFor, SITUATIONS, type IncidentRun, type Situation } from "@/lib/incident.ts";
import { cardsOf, type CaseApi, type CaseState } from "@/lib/store.ts";
import { won } from "@/lib/rules.ts";
import { agentPost } from "./Dashboard.tsx";

const EXAMPLE: Record<Situation, string> = {
  "당일 추가요금": "기사님이 3층 계단이라 짐이 많다며 5만원 더 달래요. 안 주면 못 옮긴대요.",
  "이사 거부·계약금": "추가 비용을 못 드린다고 하니 짐을 안 싣고 가 버렸어요. 계약금은 못 돌려준대요.",
  파손: "새 집에서 짐을 풀어 보니 TV 화면이 깨져 있어요. 어제 이사했어요.",
  분실: "이삿짐 박스 하나가 안 왔어요. 업체는 다 실었다고 해요.",
};
const TOOL_NAME: Record<string, string> = { get_situation: "상황 보기", find_basis: "근거 찾기", submit_plan: "대응 계획 제출", finish: "마침" };

/** 계약 전에 이 서비스에서 확인한 기록 — 에이전트가 증거로 쓴다 (견적 원문 값, 명시된 항목, 승인한 업체 답변) */
function recordsOf(s: CaseState): string[] {
  const q = s.quotes.find((x) => x.id === s.chosen) ?? s.quotes.find((x) => x.id === s.active) ?? s.quotes.find((x) => x.draft);
  if (!q?.draft) return [];
  const d = q.draft;
  const out: string[] = [];
  const head = [d.totalAmount !== null && `총액 ${won(d.totalAmount)}`, d.deposit !== null && `계약금 ${won(d.deposit)}`, d.truck && `차량 ${d.truck}`, d.workers !== null && `인원 ${d.workers}명`].filter(Boolean).join(" · ");
  if (head) out.push(`견적서(${d.company ?? q.label}, 원문 확인): ${head}`);
  for (const c of cardsOf(s, q)) {
    if (c.answered) out.push(`업체 답변(사용자 승인) — ${c.title}: '${c.answered.quote}'`);
    else if (c.status === "명시됨" && c.evidence[0]) out.push(`견적서에 명시 — ${c.title}: '${c.evidence[0]}'`);
  }
  return out.map((r) => r.slice(0, 300)).slice(0, 30);
}

export default function IncidentView({ api, ollama }: { api: CaseApi; ollama: boolean }) {
  const { state, update } = api;
  const [situation, setSituation] = useState<Situation>("당일 추가요금");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const records = useMemo(() => recordsOf(state), [state]);
  const recq = state.quotes.find((x) => x.id === state.chosen) ?? state.quotes.find((x) => x.id === state.active) ?? state.quotes.find((x) => x.draft);
  const recordLabel = recq?.draft ? `${recq.label}(${recq.draft.company ?? "업체명 없음"}${state.chosen === recq.id ? " · 고른 견적" : ""})의` : "";
  const on = isOn("responder", state.agents);
  const last: IncidentRun | undefined = state.incidents?.[state.incidents.length - 1];

  async function run() {
    setBusy(true); setError("");
    try {
      const r = await agentPost<IncidentRun>("responder", "/api/incident", { situation, story: story.trim(), records });
      update((s) => ({ incidents: [...(s.incidents ?? []), r].slice(-10) }));
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  }
  async function copy(t: string) { try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* 무시 */ } }
  const basis = (id: string) => BASES.find((b) => b.id === id);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">이사 당일·이후</div>
          <h1>문제가 생겼다면, 사고 대응 에이전트가 지금 할 일을 정리합니다</h1>
          <p>당일 추가요금 요구, 이사 거부·계약금, 파손, 분실 — 계약 전에 확인한 기록과 표준약관·소비자분쟁해결기준 같은 공식 근거로 대응 순서, 챙길 증거, 업체에 보낼 문자를 만듭니다. 법률 판단이나 배상 결과를 장담하지 않습니다.</p>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-body form-stack">
          <span className="field-label">어떤 일인가요?</span>
          <div className="seg">{SITUATIONS.map((s) => <button key={s} className={situation === s ? "on" : ""} onClick={() => setSituation(s)}>{s}</button>)}</div>
          <label className="field-label" htmlFor="in-story">무슨 일이 있었는지 한두 문장</label>
          <textarea id="in-story" value={story} onChange={(e) => setStory(e.target.value)} placeholder={`예) ${EXAMPLE[situation]}`} />
          <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
            <button className="btn" onClick={run} disabled={busy || !on || story.trim().length < 4}>{busy ? <><Loader2 size={14} className="spin" />사고 대응 에이전트 작업 중…</> : <><LifeBuoy size={14} />사고 대응 에이전트 실행</>}</button>
            {!story && <button className="btn ghost" onClick={() => setStory(EXAMPLE[situation])}>예시 넣기</button>}
            <span className="hint">{records.length ? `${recordLabel} 계약 전 기록 ${records.length}개를 증거로 함께 넘깁니다.` : "계약 전 기록이 없어요 (견적을 점검하면 생깁니다)."}</span>
            {!on && <span className="hint">사고 대응 에이전트가 꺼져 있어요. 아래 공식 근거만 볼 수 있습니다.</span>}
            {!ollama && <span className="hint">로컬 AI(Ollama)에 연결되지 않았어요.</span>}
          </div>
          {error && <div className="warn">{error}</div>}
        </div>
      </section>

      {last && (
        <div className="resultgrid">
          <section className="panel result">
            <div className="panel-head"><h2>대응 계획</h2><span className="sub">{last.situation} · {new Date(last.at).toLocaleString("ko-KR")}</span></div>
            <div className="panel-body">
              <div className={`agent-line${last.plan ? "" : " base"}`}><Bot size={15} /><span>{last.plan
                ? <>사고 대응 에이전트가 도구를 {last.steps.length}번 불러 공식 근거 {new Set(last.plan.steps.flatMap((s) => s.basis)).size}개로 계획을 만들었어요. 근거 목록·기한·금액·표현 검사를 통과했어요. 보내기 전에 내용을 직접 확인하세요.</>
                : <>계획을 만들지 못했어요 ({last.note}). 아래 공식 근거를 직접 보세요.</>}</span></div>
              {last.plan && (
                <>
                  <p style={{ marginTop: 0 }}><b>{last.plan.summary}</b></p>
                  <ol className="plan-steps">
                    {last.plan.steps.map((s, i) => (
                      <li key={i}><b>{s.action}</b>{s.when && <span className="hint"> · {s.when}</span>}<br />
                        {s.basis.map((id) => <span key={id} className="chip st-plain wrap" title={basis(id)?.text}>{basis(id)?.source ?? id}</span>)}</li>
                    ))}
                  </ol>
                  <div className="result-row"><span className="lbl">챙길 증거</span><span className="chips-line">{last.plan.evidence.map((e) => <span key={e} className="chip st-plain wrap">{e}</span>)}</span></div>
                  <div className="src-label">업체에 보낼 문자 (보내기 전에 고쳐 쓰세요)</div>
                  <blockquote className="src reply" style={{ whiteSpace: "pre-wrap" }}>{last.plan.message}</blockquote>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <button className="btn" onClick={() => copy(last.plan!.message)}><ClipboardCopy size={14} />{copied ? "복사했어요" : "문자 복사"}</button>
                  </div>
                  <p className="next">{/^업체가/.test(last.plan.escalate) ? last.plan.escalate : `업체가 응하지 않으면: ${last.plan.escalate}`}</p>
                </>
              )}
              <p className="hint" style={{ margin: "10px 0 0" }}>공식 기준을 안내하는 참고 정보이며 법률 자문이 아닙니다. 계약서에 따로 정한 내용이 있으면 달라질 수 있습니다.</p>
            </div>
          </section>
          <aside className="panel">
            <div className="panel-head"><h2>근거와 작업 기록</h2></div>
            <div className="panel-body">
              <ul className="mini-list">
                {basesFor(last.situation).map((b) => (
                  <li key={b.id}><span className="grow"><b>{b.title}</b>{b.deadline && <span className="by-chip new">{b.deadline}</span>}<br /><span className="hint">{b.text}</span><br /><a className="src-of" href={b.url} target="_blank" rel="noreferrer">{b.source}</a></span></li>
                ))}
                {!basesFor(last.situation).length && <li className="hint">이 상황의 근거를 아직 정리하지 못했어요.</li>}
              </ul>
              <ol className="tool-log">{last.steps.map((s) => <li key={s.n}><code>{TOOL_NAME[s.tool] ?? s.tool}</code>{(s.output as { accepted?: boolean })?.accepted === false ? " · 거절 → 고쳐 다시" : (s.output as { accepted?: boolean })?.accepted ? " · 수락" : ""}{s.ms ? <span className="hint"> · {(s.ms / 1000).toFixed(1)}초</span> : null}</li>)}</ol>
              <p className="hint">근거·출처: {last.model}</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
