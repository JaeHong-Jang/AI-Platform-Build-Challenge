"use client";
// 견적 하나의 대조표(내 확인 ↔ 업체 원문) + 선택한 행의 근거. 근거는 붙여넣은 원문 안 위치까지 보여 준다 (D006 원문 추적).
import { Fragment, useMemo, useState } from "react";
import { REFERENCES, REFERENCE_NOTICE } from "@/lib/references.ts";
import type { QuoteEntry } from "@/lib/store.ts";
import type { Card, Inquiry, Rule } from "@/lib/types.ts";
import { CostChip, InquiryChip, StatusChip } from "./ui.tsx";

type Filter = "all" | Rule | "open";
const ORDER = ["판독 불가", "포함 여부 미확인", "조건 모호", "명시됨"];
export const isOpen = (c: Card) => c.status !== "명시됨";
// 비용 변동 요인: 별도 요금이 붙거나, 작업 조건·추가비의 금액이 정해지지 않은 항목
export const costOpen = (c: Card) => c.cost === "별도" || (c.rule !== "품목" && c.cost === "미확인");

export default function CheckTable({ q, cards, inquiry, selected, onSelect }: { q: QuoteEntry; cards: Card[]; inquiry: Record<string, Inquiry>; selected: string | null; onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => {
    const f = cards.filter((c) => (filter === "all" ? true : filter === "open" ? isOpen(c) : c.rule === filter));
    return [...f].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  }, [cards, filter]);
  const sel = selected === "" ? undefined : cards.find((c) => c.id === selected) ?? rows.find(isOpen) ?? rows[0];

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>대조표</h2><span className="sub">내가 확인한 것 ↔ {q.draft?.company ?? q.label}이 적어 준 것</span>
          <div className="right tabs">
            {(["all", "open", "품목", "작업조건", "추가비"] as Filter[]).map((f) => (
              <button key={f} className={`tab ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{f === "all" ? "전체" : f === "open" ? "확인 남음" : f === "품목" ? "짐" : f === "작업조건" ? "작업 조건" : f}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="cmp">
            <thead><tr><th>대상</th><th className="hide-sm">내가 확인한 내용</th><th>업체 원문</th><th>기재 상태</th><th>비용 처리</th><th className="hide-sm">문의</th></tr></thead>
            <tbody>
              {rows.map((c) => (<Fragment key={c.id}>
                <tr className={sel?.id === c.id ? "sel" : ""} onClick={() => onSelect(sel?.id === c.id ? "" : c.id)} aria-expanded={sel?.id === c.id}>
                  <td className="target">{c.title}<small>{c.rule === "품목" ? "짐" : c.rule === "작업조건" ? "작업 조건" : "추가비"}</small></td>
                  <td className="hide-sm">{c.mine}</td>
                  <td className="quote-cell">{c.evidence[0] ? <q>{c.evidence[0]}</q> : <span className="hint">—</span>}{c.answered && <><br /><span className="hint">답변 </span><q>{c.answered.quote}</q></>}</td>
                  <td><StatusChip s={c.status} /></td>
                  <td><CostChip c={c.cost} /></td>
                  <td className="hide-sm"><InquiryChip q={inquiry[c.id]} /></td>
                </tr>
                {sel?.id === c.id && <tr className="ev"><td colSpan={6}>{<Evidence sel={sel} q={q} />}</td></tr>}
              </Fragment>))}
              {!rows.length && <tr><td colSpan={6} className="hint">이 조건에 해당하는 항목이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

    </>
  );
}

/** 원문 전체를 보여 주고 근거 발췌를 표시한다 — 발췌는 원문에 있는 글만 들어오므로(verifyDraft) 위치가 항상 찾아진다 */
export function Source({ text, marks }: { text: string; marks: string[] }) {
  const parts: { t: string; m: boolean }[] = [];
  let rest = text;
  const ms = marks.filter(Boolean);
  while (rest) {
    const hits = ms.map((m) => ({ m, i: rest.indexOf(m) })).filter((h) => h.i >= 0).sort((a, b) => a.i - b.i);
    if (!hits.length) { parts.push({ t: rest, m: false }); break; }
    const h = hits[0];
    if (h.i) parts.push({ t: rest.slice(0, h.i), m: false });
    parts.push({ t: h.m, m: true });
    rest = rest.slice(h.i + h.m.length);
  }
  return <pre className="source">{parts.map((p, n) => (p.m ? <mark key={n}>{p.t}</mark> : <span key={n}>{p.t}</span>))}</pre>;
}

function Evidence({ sel, q }: { sel: Card; q: QuoteEntry }) {
  return (
    <div className="panel-body">
      <p className="why">{sel.why}</p>
      {q.quoteText && (sel.evidence.length > 0 || sel.status !== "명시됨") && (
        <><div className="src-label">견적서 원문 {sel.evidence.length ? "· 근거 위치 표시" : "· 이 항목에 해당하는 글이 없습니다"}</div><Source text={q.quoteText} marks={sel.evidence} /></>
      )}
      {sel.answered && <><div className="src-label">업체 답변 (사용자 승인)</div><blockquote className="src reply">{sel.answered.quote}</blockquote></>}
      {sel.ask && <><div className="src-label">업체에 물을 것</div><p style={{ margin: "4px 0 0" }}>{sel.ask} 확인 부탁드립니다.</p></>}
      {sel.refs.length > 0 && (
        <><div className="src-label">참고 조항</div>
          {sel.refs.map((r) => <div className="ref" key={r}><b>{REFERENCES[r].label}</b> — {REFERENCES[r].text} <a href={REFERENCES[r].url} target="_blank" rel="noreferrer">설명</a></div>)}
          <div className="notice">{REFERENCE_NOTICE}</div></>
      )}
    </div>
        
  );
}
