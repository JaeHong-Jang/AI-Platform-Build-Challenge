"use client";
// 계약·서류: 서류 안내관(받을 서류·기재 항목) + 계약 점검관(계약서 기재 항목, 계약금 비율, 답변이 계약서에 적혔는지). 모두 규칙 — LLM 없음.
import { FileCheck2, FileText } from "lucide-react";
import { checkDoc, depositRatio, DOCS, TERMS_EDITION } from "@/lib/docs.ts";
import { verifyDraft } from "@/lib/verify.ts";
import { canonical, won } from "@/lib/rules.ts";
import { cardsOf, type CaseApi } from "@/lib/store.ts";
import { REFERENCES, REFERENCE_NOTICE } from "@/lib/references.ts";
import { PageHead } from "./ui.tsx";

export default function ContractView({ api }: { api: CaseApi }) {
  const { state, update } = api;
  const chosen = state.quotes.find((x) => x.id === state.chosen) ?? null;
  const q = chosen ?? api.quote;
  const d = q?.draft ?? null;
  // 원문에서 확인된 총액·계약금으로만 계산한다 — 직접 입력한 숫자로 경고를 울리지 않는다 (Argon2 #1-C)
  const v = d && q ? verifyDraft(q.quoteText, d).draft : null;
  const ratio = v ? depositRatio(v.totalAmount, v.deposit) : null;
  const contract = DOCS[1];
  const checks = state.contractText.trim() ? checkDoc(contract, state.contractText) : [];
  // 업체 답변으로 확인한 항목은 계약서에도 적혀야 한다 (소비자원 권고: 계약사항을 상세히 기재)
  const answered = q ? cardsOf(state, q).filter((c) => c.answered) : [];
  const inContract = (title: string) => state.contractText.includes(title) || state.contractText.includes(canonical(title));

  return (
    <>
      <PageHead eyebrow="09 계약 점검관 · 10 서류 안내관" title="계약·서류" sub={`계약금을 보내기 전에 받아야 할 서류와 적혀 있어야 할 항목입니다. 기준: ${TERMS_EDITION}`} />
      <div className="two">
        <section className="panel">
          <div className="panel-head"><FileText size={15} /><h2>받을 서류</h2><span className="sub">서류 안내관</span></div>
          <div className="panel-body">
            {!state.agents.docguide ? <p className="hint">서류 안내관이 꺼져 있어 서류 점검표가 비어 있습니다.</p> : DOCS.map((spec) => {
              const key = `doc-${spec.id}`;
              const src = spec.id === "quote" ? q?.quoteText ?? "" : state.contractText;
              const found = src.trim() ? checkDoc(spec, src) : [];
              return (
                <div key={spec.id} style={{ marginBottom: 14 }}>
                  <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={!!state.docs[key]} onChange={(e) => update({ docs: { ...state.docs, [key]: e.target.checked } })} />
                    <b>{spec.title}</b><span className="hint">{spec.article} · {spec.when}</span></label>
                  <ul className="mini-list">
                    {spec.items.map((it) => {
                      const f = found.find((x) => x.item.id === it.id);
                      return <li key={it.id}><span className="grow">{it.label}</span>{src.trim() ? (f?.found ? <span className="chip st-plain" title={f.found}>글에 있음</span> : <span className="chip st-unknown">? 글에서 못 찾음</span>) : <span className="hint">—</span>}</li>;
                    })}
                  </ul>
                </div>
              );
            })}
            <p className="notice">'글에 있음'은 그 항목 낱말이 보인다는 뜻이지 내용이 충분하다는 뜻은 아닙니다. 고객 정보는 성명·주소·연락처면 됩니다(주민등록번호 요구 근거 아님).</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><FileCheck2 size={15} /><h2>계약서 점검</h2><span className="sub">계약 점검관 · {q ? `${q.label} · ${d?.company ?? "업체명 없음"}` : "견적 없음"}{chosen ? " (고른 견적)" : ""}</span></div>
          <div className="panel-body">
            {!state.agents.contract ? <p className="hint">계약 점검관이 꺼져 있어 계약서 점검이 비어 있습니다.</p> : (
              <>
                <div className="src-label" style={{ marginTop: 0 }}>계약금 비율 · {REFERENCES["art6"].label}</div>
                {ratio ? (
                  <div className={ratio.over ? "warn" : "okline"}>계약금 {won(v!.deposit!)} / 총액 {won(v!.totalAmount!)} = {(ratio.ratio * 100).toFixed(1)}% {ratio.over ? "— 약관상 청구 가능 비율(10%)보다 높습니다. 계약금 금액의 근거를 물어보세요." : "— 10% 이내입니다."}</div>
                ) : <p className="hint">총액과 계약금이 견적서 원문에서 모두 확인되어야 계산합니다.</p>}

                <div className="src-label">계약서 글 (받으면 붙여 넣기)</div>
                <textarea value={state.contractText} onChange={(e) => update({ contractText: e.target.value })} placeholder="계약서·계약 문자 내용을 붙여 넣어 주세요" aria-label="계약서 글" />
                {checks.length > 0 && (
                  <ul className="mini-list" style={{ marginTop: 8 }}>
                    {checks.map((c) => <li key={c.item.id}><span className="grow">{c.item.label}</span>{c.found ? <span className="chip st-plain" title={c.found}>글에 있음</span> : <span className="chip st-unknown">? 못 찾음</span>}</li>)}
                  </ul>
                )}
                {answered.length > 0 && (
                  <>
                    <div className="src-label">답변으로 확인한 것이 계약서에도 적혔나요</div>
                    <ul className="mini-list">
                      {answered.map((c) => <li key={c.id}><span className="grow">{c.title} <span className="hint">“{c.answered!.quote}”</span></span>
                        {!state.contractText.trim() ? <span className="hint">계약서 전</span> : inContract(c.title) ? <span className="chip st-plain">계약서에 이름 있음</span> : <span className="chip st-vague">△ 계약서에 없음</span>}</li>)}
                    </ul>
                  </>
                )}
                <p className="notice">{REFERENCES["art5-2"].label} — {REFERENCES["art5-2"].text} {REFERENCE_NOTICE}</p>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
