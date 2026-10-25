"use client";
// 견적·업체: 업체를 미리 정하지 않는다. 받은 견적(최대 5건)을 같은 항목으로 나란히 놓고, 업체마다 묻고 답을 점검한 뒤 사용자가 고른다.
// 비교표는 입력 순서 그대로 — 점수·순위·자동 강조를 하지 않는다 (Astra#4: 짧게 뭉뚱그린 견적이 유리해지는 것을 막는다).
import { useState } from "react";
import { AlertTriangle, Bot, Check, ClipboardCopy, Loader2, MapPin, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { cardsOf, inquiryOf, newQuote, type CaseApi, type QuoteEntry } from "@/lib/store.ts";
import { won } from "@/lib/rules.ts";
import { candidates, matchCompany, PERMITS_SOURCE } from "@/lib/permits.ts";
import { depositRatio } from "@/lib/docs.ts";
import { verifyDraft } from "@/lib/verify.ts";
import { NO_QUOTE } from "@/lib/fixtures.ts";
import type { Card } from "@/lib/types.ts";
import CheckTable, { isOpen } from "./CheckTable.tsx";
import InquiryPanel from "./InquiryPanel.tsx";
import { QuoteForm } from "./forms.tsx";
import { PageHead } from "./ui.tsx";

export default function QuotesView({ api, onRead, reading, readError, onSamples }: { api: CaseApi; onRead: (id: string, text: string) => Promise<boolean>; reading: string | null; readError: string; onSamples: () => void }) {
  const { state, update, updateQuote } = api;
  const q = api.quote;
  const [text, setText] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const gwanak = state.intake.gu === "관악구";

  const add = (firm?: string) => {
    // 지운 뒤 다시 추가해도 라벨이 겹치지 않게 비어 있는 글자를 쓴다 (Argon2 #3-B)
    const used = new Set(state.quotes.map((x) => x.label));
    const n = { ...newQuote([0, 1, 2, 3, 4, 5].find((i) => !used.has(`견적 ${"ABCDEF"[i]}`)) ?? state.quotes.length), firm };
    update((s) => ({ quotes: [...s.quotes, n], active: n.id }));
  };
  const remove = (id: string) => update((s) => {
    const quotes = s.quotes.filter((x) => x.id !== id);
    return { quotes, active: quotes[0]?.id ?? null, chosen: s.chosen === id ? null : s.chosen };
  });

  return (
    <>
      <PageHead eyebrow="03 견적 판독관 · 08 견적 비교관" title="견적·업체" sub="업체를 미리 정하지 않습니다. 받은 견적을 같은 항목으로 나란히 보고, 업체마다 물어본 뒤 직접 고릅니다."
        actions={<label className="row hint" style={{ gap: 6 }}><input type="checkbox" checked={gwanak} onChange={(e) => update({ intake: { ...state.intake, gu: e.target.checked ? "관악구" : "모름" } })} />관악구 허가 업체 목록과 대조</label>} />

      <div className="qtabs">
        {state.quotes.map((x) => (
          <button key={x.id} className={`qtab ${q?.id === x.id ? "on" : ""}`} onClick={() => update({ active: x.id })}>
            {x.label} · {x.draft?.company ?? x.firm ?? (x.draft ? "업체명 없음" : "아직 안 읽음")}{!x.draft && x.firm ? " (견적 기다림)" : ""}
            {state.chosen === x.id && <span className="chosen"><Check size={11} />고름</span>}
          </button>
        ))}
        {state.quotes.length < 5 && <button className="qtab" onClick={() => add()}><Plus size={13} />견적 추가</button>}
        {!state.quotes.length && <button className="qtab" onClick={onSamples} disabled={!!reading}><Sparkles size={13} />가상 견적 2건으로 해 보기</button>}
      </div>

      {reading && <div className="progress-line" role="status"><span className="adot on pulse" />견적 판독관이 {state.quotes.find((x) => x.id === reading)?.label ?? "견적"}을 로컬 모델로 읽는 중 — 보통 3~5초</div>}
      {state.agents.picker && <FirmFinder api={api} onPick={add} />}
      {state.quotes.length > 1 && state.agents.picker && <Compare api={api} gwanak={gwanak} />}
      {state.quotes.length > 1 && !state.agents.picker && <p className="hint">견적 비교관이 꺼져 있어 비교표 없이 견적을 하나씩 봅니다.</p>}

      {q && (
        <div className="grid">
          <div>
            <section className="panel" style={{ marginBottom: 14 }}>
              <div className="panel-head"><h2>{q.label} 원문</h2><span className="sub">문자·카톡·앱 화면의 글을 그대로 붙여 넣기</span>
                <div className="right"><button className="icon-btn" onClick={() => { if (confirm(`${q.label}를 지울까요? 이 견적의 문의·답변 기록도 함께 지워집니다.`)) remove(q.id); }} aria-label="이 견적 지우기"><Trash2 size={14} /></button></div></div>
              <div className="panel-body">
                <textarea value={text[q.id] ?? q.quoteText} onChange={(e) => setText({ ...text, [q.id]: e.target.value })} style={{ minHeight: 140 }} placeholder="예) 이사일 11월 14일 / 1톤 1대 인원 2명 / 원룸 짐 일체 / 총 35만원 (계약금 5만원)" aria-label="견적서 글" />
                <div className="row" style={{ marginTop: 8 }}>
                  {state.agents.reader
                    ? <span className="hint"><Bot size={12} style={{ verticalAlign: -2 }} /> 견적 판독관이 항목으로 옮기고, 원문에 없는 값은 버립니다.</span>
                    : <span className="hint">견적 판독관이 꺼져 있어 아래 칸에 직접 적습니다. 원문에서 확인되지 않는 값은 '명시됨'이 되지 않습니다.</span>}
                  {state.agents.reader
                    ? <button className="btn" style={{ marginLeft: "auto" }} disabled={(text[q.id] ?? q.quoteText).trim().length < 10 || !!reading} onClick={() => onRead(q.id, text[q.id] ?? q.quoteText)}>
                        {reading === q.id ? <><Loader2 size={14} className="spin" />읽는 중…</> : <><Sparkles size={14} />항목 읽기</>}</button>
                    : <button className="btn" style={{ marginLeft: "auto" }} onClick={() => updateQuote(q.id, { quoteText: text[q.id] ?? q.quoteText, draft: q.draft ?? NO_QUOTE, reader: { model: "직접 입력", ms: 0 } })}>직접 적기</button>}
                </div>
                {reading === q.id && <p className="hint">첫 실행은 모델을 메모리에 올리느라 1~2분 걸릴 수 있어요.</p>}
                {readError && reading === null && <div className="warn">{readError}</div>}
                {q.reader && q.draft && <div className="okline">{q.reader.model}{q.reader.ms ? ` · ${(q.reader.ms / 1000).toFixed(1)}초` : ""} · 아래 값은 초안입니다. 원문과 비교해 고쳐 주세요.</div>}
                {q.dropped.length > 0 && <div className="warn"><AlertTriangle size={13} style={{ verticalAlign: -2 }} /> AI가 읽었지만 원문에서 확인되지 않아 비운 값 {q.dropped.length}개 (근거 장부에 기록): {q.dropped.join(" · ")}</div>}
                {gwanak && q.draft && <div className="permit">{matchCompany(q.draft.company).message} <span className="hint">({PERMITS_SOURCE.title} 기준일 {PERMITS_SOURCE.basis})</span></div>}
              </div>
              {q.draft && <details className="panel-body" style={{ borderTop: "1px solid var(--line)" }}><summary>읽은 항목 고치기</summary><QuoteForm quote={q.draft} onChange={(d) => updateQuote(q.id, { draft: d })} /></details>}
            </section>
            {q.draft && <CheckTable q={q} cards={api.cards} inquiry={api.inquiry} selected={selected} onSelect={setSelected} />}
          </div>
          {q.draft ? <InquiryPanel key={q.id} api={api} q={q} /> : <aside className="side" />}
        </div>
      )}
    </>
  );
}

/** 같은 항목으로 나란히 — 읽은 값과 확인 남은 수만. 순위·추천 없음, 고르는 것은 사용자 */
function Compare({ api, gwanak }: { api: CaseApi; gwanak: boolean }) {
  const { state, update } = api;
  const cols = state.quotes.map((q) => ({ q, cards: q.draft ? cardsOf(state, q) : [] as Card[] }));
  const openOf = (cards: Card[], rule: Card["rule"]) => cards.filter((c) => c.rule === rule && isOpen(c));
  const cell = (q: QuoteEntry, cards: Card[], key: string) => {
    const d = q.draft;
    if (!d) return <span className="hint">아직 안 읽음</span>;
    switch (key) {
      case "total": return d.totalAmount !== null ? <b className="num">{won(d.totalAmount)}</b> : <span className="hint">확인 안 됨</span>;
      case "deposit": {
        const v = verifyDraft(q.quoteText, d).draft; // 원문에서 확인된 총액·계약금으로만 비율을 낸다 (Argon2 #1-C)
        const r = depositRatio(v.totalAmount, v.deposit);
        return d.deposit === null ? <span className="hint">확인 안 됨</span> : <>{won(d.deposit)}{r && <span className={`chip ${r.over ? "st-vague" : "st-plain"}`} style={{ marginLeft: 6 }}>{r.over ? "△ " : ""}총액의 {Math.round(r.ratio * 100)}%</span>}</>;
      }
      case "truck": return d.truck ?? <span className="hint">적혀 있지 않음</span>;
      case "workers": return d.workers !== null ? `${d.workers}명` : <span className="hint">적혀 있지 않음</span>;
      case "ladder": return d.ladder;
      case "items": { const o = openOf(cards, "품목"); return o.length ? `${o.length}개 확인 남음 (${o.map((c) => c.title).join(", ")})` : "모두 적혀 있음"; }
      case "site": { const o = openOf(cards, "작업조건"); return o.length ? `${o.length}개 확인 남음 (${o.map((c) => c.title).join(", ")})` : "모두 적혀 있음"; }
      case "fee": { const f = cards.filter((c) => c.rule === "추가비"); return f.map((c) => c.evidence[0] ? `“${c.evidence[0]}”` : "추가 비용 문구 없음").join(" / "); }
      case "permit": return matchCompany(d.company).status === "match" ? "같은 상호 기록 있음 (같은 업체인지 미확인)" : matchCompany(d.company).status === "no-name" ? "업체명 없음" : "목록에서 못 찾음 (무허가 뜻 아님)";
      case "asked": { const inq = inquiryOf(q, cards); const n = Object.values(inq).filter((v) => v === "답변 반영").length; return q.asked.length ? `${q.asked.length}항목 물음 · ${n}항목 답변 반영` : "아직 묻지 않음"; }
    }
  };
  const rows: [string, string][] = [["total", "총액"], ["deposit", "계약금 (제6조 10% 참고)"], ["truck", "차량"], ["workers", "작업 인원"], ["ladder", "사다리차"], ["items", "내 짐 중 확인 남음"], ["site", "작업 조건 확인 남음"], ["fee", "추가 비용 문구"], ...(gwanak ? [["permit", "관악구 허가 목록"]] as [string, string][] : []), ["asked", "문의·답변"]];

  return (
    <section className="panel" style={{ marginBottom: 14 }}>
      <div className="panel-head"><h2>같은 항목으로 나란히</h2><span className="sub">견적 비교관 · 순위·점수 없음 · 입력한 순서</span></div>
      <div style={{ overflowX: "auto" }}>
        <table className="cmp cmp-quotes">
          <thead><tr><th>항목</th>{cols.map(({ q }) => <th key={q.id}>{q.label} · {q.draft?.company ?? "—"}</th>)}</tr></thead>
          <tbody>
            {rows.map(([k, label]) => <tr key={k}><td className="target">{label}</td>{cols.map(({ q, cards }) => <td key={q.id}>{cell(q, cards, k)}</td>)}</tr>)}
            <tr><td className="target">고르기</td>{cols.map(({ q }) => <td key={q.id}>
              {state.chosen === q.id ? <button className="btn ghost sm" onClick={() => update({ chosen: null })}><Check size={13} />고름 · 취소</button>
                : <button className="btn ghost sm" disabled={!q.draft} onClick={() => update({ chosen: q.id, active: q.id })}>이 견적으로 진행</button>}
            </td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ padding: "8px 18px 12px", margin: 0 }}>확인 남은 수가 적다고 더 좋은 업체라는 뜻은 아닙니다. 업체마다 물어보고, 답이 계약서에 적히는지 확인한 뒤 고르세요.</p>
    </section>
  );
}

/** 업체 고르기 도우미: 견적 받을 곳 찾기 — 관악구 허가 업체 공공데이터에서 '이사' 구분·영업중인 곳만, 가나다순.
 *  순위·평점·추천은 하지 않는다. 고른 곳에 같은 질문으로 견적을 요청하고, 받은 글을 붙여 넣으면 대조한다. */
function FirmFinder({ api, onPick }: { api: CaseApi; onPick: (firm: string) => void }) {
  const { state } = api;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(state.quotes.length === 0);
  const [copied, setCopied] = useState(false);
  const all = candidates().slice().sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const list = all.filter((r) => !q.trim() || r.name.includes(q.trim()) || r.address.includes(q.trim()));
  const picked = new Set(state.quotes.map((x) => x.firm).filter(Boolean));
  const request = "안녕하세요. 이사 견적을 부탁드립니다. 견적서에 아래 내용을 함께 적어 주세요.\n1. 차량 톤수·대수와 작업 인원\n2. 옮길 짐 중 총액에 포함되는 것과 별도인 것\n3. 계단·사다리차·운반 거리 같은 작업 조건별 추가 비용 여부와 금액\n4. 당일 추가 비용이 생길 수 있는 경우와 금액(또는 산정 방식)\n5. 사업자 상호·등록번호, 화물자동차운송주선사업 허가 여부\n감사합니다.";
  async function copy() { try { await navigator.clipboard.writeText(request); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* 무시 */ } }
  return (
    <section className="panel" style={{ marginBottom: 14 }}>
      <div className="panel-head"><Search size={15} /><h2>견적 받을 업체 찾기</h2><span className="sub">관악구 허가 업체 {all.length}곳 · 이사 구분·영업중 · 가나다순 (순위·추천 없음)</span>
        <div className="right"><button className="btn ghost sm" onClick={() => setOpen(!open)}>{open ? "접기" : "펼치기"}</button></div></div>
      {open && (
        <div className="panel-body">
          <div className="row" style={{ marginBottom: 8 }}>
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="업체 이름이나 동(예: 봉천동, 신림동)으로 찾기" aria-label="업체 찾기" />
            <button className="btn ghost sm" onClick={copy}><ClipboardCopy size={13} />{copied ? "복사했어요" : "견적 요청 문장 복사"}</button>
          </div>
          <ul className="mini-list firm-list">
            {list.map((r) => (
              <li key={r.name + r.licensed}>
                <MapPin size={14} style={{ marginTop: 3, color: "var(--faint)" }} />
                <span className="grow"><b>{r.name}</b> <span className="chip st-plain">{r.kind}</span><br /><span className="hint">{r.address} · 허가 {r.licensed}</span></span>
                {picked.has(r.name) ? <span className="chip st-ok">✓ 견적 요청 목록</span>
                  : <button className="btn ghost sm" disabled={state.quotes.length >= 5} onClick={() => onPick(r.name)}><Plus size={12} />견적 받을 곳</button>}
              </li>
            ))}
            {!list.length && <li className="hint">찾는 업체가 목록에 없습니다. 목록에 없다고 무허가라는 뜻은 아닙니다.</li>}
          </ul>
          <p className="notice">출처: {PERMITS_SOURCE.title} (공공데이터포털, 기준일 {PERMITS_SOURCE.basis}, {PERMITS_SOURCE.license}). 전화번호·좌표는 싣지 않습니다. 다른 지역 업체는 관할 구청이나 허가이사 사이트에서 허가를 확인하세요. 앱은 업체를 추천하지 않습니다.</p>
        </div>
      )}
    </section>
  );
}
