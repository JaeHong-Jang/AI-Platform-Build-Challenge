// 근거(참고 조항·통계)와 기록(에이전트 실행 이력)
import { Bot, ShieldAlert, UserCheck, XCircle } from "lucide-react";
import { REFERENCES, REFERENCE_NOTICE } from "@/lib/references.ts";
import type { CaseApi } from "@/lib/store.ts";
import type { QuoteDraft } from "@/lib/types.ts";
import { Kpi, PageHead } from "./ui.tsx";

const KCA = "https://www.kca.go.kr/home/sub.do?menukey=4005&mode=view&no=1004458186&page=1";

export function RefsView() {
  return (
    <>
      <PageHead eyebrow="근거" title="참고 조항·통계" sub="카드가 가리키는 조항과, 이 문제를 고른 근거입니다. 모델은 조항을 쓰지 않고 여기 적힌 문구만 연결됩니다." />
      <div className="stat3" style={{ marginBottom: 14 }}>
        <Kpi icon={null} label="이사 피해구제 신청 (2025)" value="961" unit="건" foot="2023년 603 → 2024년 785 · 한국소비자원" />
        <Kpi icon={null} label="소규모 이사 피해 신청자 중 20~30대" value="65.1" unit="%" foot="2025년 소규모 이사 241건 중 157건" />
        <Kpi icon={null} label="소규모 이사 피해 유형 중 추가 비용 요구" value="24.9" unit="%" foot="70건 · 유형별 중복 집계 281건 기준" />
      </div>
      <div className="two">
        <section className="panel">
          <div className="panel-head"><h2>소비자원 권고</h2><span className="sub">피해예방주의보 2026.4.21 첨부 p8</span></div>
          <div className="panel-body">
            <blockquote className="src">계약서 작성 시 이사일시, 이사화물 내역, 작업인원 수, 추가서비스 내역 및 비용 등 계약사항을 상세히 기재하여 추가요금 요구 등 향후 분쟁에 대비한다.</blockquote>
            <p className="hint" style={{ marginTop: 10 }}>추가 비용을 거부하면 업체가 이사를 거부하는 '계약불이행'으로 이어지는 사례가 많고, 방문 견적 없는 비대면 계약이 더 취약하다고 밝혔습니다(p5). 피해 유형 1위는 물품 파손·분실(47.7%)이며, 이 서비스는 계약 전에 문서로 확인할 수 있는 추가 비용 문제에 집중합니다.</p>
            <a href={KCA} target="_blank" rel="noreferrer">원문 보기</a>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>참고 조항</h2><span className="sub">이사화물 표준약관</span></div>
          <div className="panel-body">
            {Object.values(REFERENCES).map((r) => <div className="ref" key={r.id}><b>{r.label}</b> — {r.text} <a href={r.url} target="_blank" rel="noreferrer">설명</a></div>)}
            <div className="notice">{REFERENCE_NOTICE}</div>
          </div>
        </section>
      </div>
    </>
  );
}

/** 근거 장부: AI가 무엇을 읽고 냈는지, 검증기가 무엇을 걸러냈는지, 사람이 무엇을 승인했는지 — 한곳에서 (B009 신뢰성) */
export function LedgerView({ api }: { api: CaseApi }) {
  const { state } = api;
  const runs = state.quotes.flatMap((q) => q.runs.map((r) => ({ q, r })));
  const reads = state.quotes.filter((q) => q.reader);
  const dropped = reads.reduce((n, q) => n + q.dropped.length, 0) + (state.intake.parsed?.dropped.length ?? 0);
  const approved = state.quotes.flatMap((q) => Object.entries(q.overrides).map(([id, o]) => ({ q, id, o })));
  const rejected = runs.reduce((n, { r }) => n + r.steps.reduce((k, st) => k + ((st.output as { results?: { accepted: boolean }[] }).results?.filter((x) => !x.accepted).length ?? 0), 0), 0);
  const calls = reads.filter((q) => q.reader!.ms > 0).length + (state.intake.parsed ? 1 : 0) + runs.reduce((n, { r }) => n + new Set(r.steps.filter((x) => x.ms > 0).map((x) => x.n)).size, 0);

  return (
    <>
      <PageHead eyebrow="근거" title="근거 장부" sub="AI 에이전트가 무엇을 읽고 무엇을 냈는지, 원문 대조 검증기가 무엇을 걸러냈는지, 사람이 무엇을 승인했는지를 남깁니다." />
      <div className="kpis">
        <Kpi icon={<Bot size={14} />} label="로컬 모델 호출" value={String(calls)} unit="회" foot="조건 해석·견적 읽기·답변 점검 턴" />
        <Kpi icon={<ShieldAlert size={14} />} label="검증기가 걸러낸 값" value={String(dropped)} unit="개" foot="원문에 없어 비운 모델 출력" alert={dropped > 0} />
        <Kpi icon={<XCircle size={14} />} label="거절된 답변 후보" value={String(rejected)} unit="개" foot="조건·금액 표현이 있어 '명시됨' 불가 등" />
        <Kpi icon={<UserCheck size={14} />} label="사람이 승인한 반영" value={String(approved.length)} unit="개" foot="승인 없이는 상태가 바뀌지 않습니다" />
      </div>

      {state.intake.parsed && (
        <section className="panel ledger">
          <div className="panel-head"><Bot size={15} /><h2>조건 해석관</h2><span className="sub">{state.intake.parsed.model} · {(state.intake.parsed.ms / 1000).toFixed(1)}초</span></div>
          <div className="panel-body">
            <div className="src-label" style={{ marginTop: 0 }}>읽은 문장</div><blockquote className="src">{state.intake.sentence}</blockquote>
            {state.intake.parsed.dropped.length ? <ul className="drop">{state.intake.parsed.dropped.map((d) => <li key={d}>✗ {d}</li>)}</ul> : <p className="hint">문장으로 확인되지 않아 비운 값 없음</p>}
          </div>
        </section>
      )}

      {reads.map((q) => (
        <section className="panel ledger" key={q.id}>
          <div className="panel-head"><Bot size={15} /><h2>03 견적 판독관 → 04 원문 검증관 · {q.label}</h2><span className="sub">{q.reader!.model}{q.reader!.ms ? ` · ${(q.reader!.ms / 1000).toFixed(1)}초` : ""}</span></div>
          <div style={{ overflowX: "auto" }}>
            <table className="cmp">
              <thead><tr><th>항목</th><th>모델이 낸 값</th><th>원문 대조 후</th><th>판정</th></tr></thead>
              <tbody>{FIELDS.map(([k, label]) => {
                const raw = show(q.raw?.[k]), kept = show(q.draft?.[k]);
                const changed = q.raw && raw !== kept;
                return <tr key={k}><td className="target">{label}</td><td>{q.raw ? raw : <span className="hint">기록 없음</span>}</td><td>{kept}</td>
                  <td>{!q.raw ? <span className="hint">—</span> : changed ? <span className="chip st-vague">△ 검증기가 고침</span> : <span className="chip st-plain">원문 확인</span>}</td></tr>;
              })}</tbody>
            </table>
          </div>
          {q.dropped.length > 0 && <div className="panel-body"><div className="src-label" style={{ marginTop: 0 }}>걸러낸 이유</div><ul className="drop">{q.dropped.map((d) => <li key={d}>✗ {d}</li>)}</ul></div>}
        </section>
      ))}

      {runs.map(({ q, r }, n) => (
        <section className="panel ledger" key={n}>
          <div className="panel-head"><Bot size={15} /><h2>답변 점검관 · {q.label}</h2><span className="sub">{r.model} · 도구 {r.steps.length}회 · {r.stopped === "finished" ? "정상 종료" : r.stopped === "limit" ? "상한 도달" : "오류"}</span></div>
          <div className="panel-body">
            <p style={{ marginTop: 0 }}>{r.note}</p>
            <ol className="trace">
              {r.steps.map((st) => {
                const out = st.output as { results?: { title: string; accepted: boolean; reason: string }[]; error?: string };
                return (
                  <li key={st.n}><code>{st.tool}</code>{st.ms ? <span className="hint"> {(st.ms / 1000).toFixed(1)}초</span> : null}
                    {out.error && <div className="rej">{out.error}</div>}
                    {out.results?.map((x, i) => <div key={i} className={x.accepted ? "acc" : "rej"}>{x.accepted ? "✓ 후보" : "✗ 거절"} {x.title} — {x.reason}</div>)}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ))}

      {approved.length > 0 && (
        <section className="panel ledger">
          <div className="panel-head"><UserCheck size={15} /><h2>사람이 승인한 반영</h2><span className="sub">입력이 바뀌면 자동으로 풀립니다</span></div>
          <ul className="mini-list" style={{ padding: "0 18px" }}>{approved.map(({ q, id, o }) => <li key={q.id + id}><span className="grow"><b>{q.label} · {id}</b><br /><span className="hint">“{o.answered.quote}”</span></span><span className="chip st-plain">{o.status}</span></li>)}</ul>
        </section>
      )}
      {!calls && !approved.length && <div className="empty"><div className="ico"><Bot size={20} /></div><h3>아직 기록이 없습니다</h3><p>조건을 한 문장으로 읽히거나, 견적을 읽히거나, 업체 답변을 점검하면 여기에 쌓입니다.</p></div>}
    </>
  );
}

const FIELDS: [keyof QuoteDraft, string][] = [["company", "업체"], ["totalAmount", "총액"], ["deposit", "계약금"], ["truck", "차량"], ["workers", "작업 인원"], ["ladder", "사다리차"], ["stairsNote", "계단 문구"], ["listedItems", "적힌 품목"], ["blanketPhrases", "뭉뚱그린 문구"], ["extraFeeClauses", "추가비 문구"]];
function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "없음";
  if (typeof v === "number") return v.toLocaleString("ko-KR");
  if (Array.isArray(v)) return v.length ? v.map((x) => (typeof x === "string" ? x : (x as { quote: string; name: string }).quote || (x as { name: string }).name)).join(" · ") : "없음";
  return String(v);
}
