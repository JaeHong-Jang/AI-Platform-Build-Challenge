"use client";
// 입력 부품: 현장 조건(층·엘리베이터·주차), 견적 항목 교정 폼
import { won } from "@/lib/rules.ts";
import type { QuoteDraft, Site, Tri } from "@/lib/types.ts";

export function TriRow({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
      <span className="hint" style={{ color: "var(--ink)" }}>{label}</span>
      <span className="seg">{(["있음", "없음", "모름"] as Tri[]).map((t) => <button type="button" key={t} className={value === t ? "on" : ""} onClick={() => onChange(t)}>{t}</button>)}</span>
    </div>
  );
}

export function SiteForm({ label, site, onChange }: { label: string; site: Site; onChange: (s: Site) => void }) {
  return (
    <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px dashed var(--line)" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <b style={{ fontSize: 13 }}>{label}</b>
        <span className="row" style={{ width: 130 }}>
          <input type="number" inputMode="numeric" min={-3} max={60} value={site.floor ?? ""} placeholder="층" aria-label={`${label} 층수`}
            onChange={(e) => onChange({ ...site, floor: e.target.value === "" ? null : Number(e.target.value) })} />
          <span className="hint">층</span>
        </span>
      </div>
      <TriRow label="엘리베이터를 쓸 수 있나요?" value={site.elevator} onChange={(v) => onChange({ ...site, elevator: v })} />
      <TriRow label="차 대는 곳이 집에서 먼가요?" value={site.parkingFar} onChange={(v) => onChange({ ...site, parkingFar: v })} />
    </div>
  );
}

export function QuoteForm({ quote, onChange }: { quote: QuoteDraft; onChange: (q: QuoteDraft) => void }) {
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[^\d]/g, "")) || null);
  const list = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
  const set = (p: Partial<QuoteDraft>) => onChange({ ...quote, ...p });
  return (
    <>
      <div className="row">
        <label className="field" style={{ flex: 1 }}><span>업체</span><input type="text" value={quote.company ?? ""} onChange={(e) => set({ company: e.target.value || null })} placeholder="미기재" /></label>
        <label className="field" style={{ flex: 1 }}><span>이사일</span><input type="text" value={quote.moveDate ?? ""} onChange={(e) => set({ moveDate: e.target.value || null })} placeholder="미기재" /></label>
      </div>
      <div className="row">
        <label className="field" style={{ flex: 1 }}><span>총액(원)</span><input type="text" inputMode="numeric" className="num" value={quote.totalAmount ?? ""} onChange={(e) => set({ totalAmount: num(e.target.value) })} placeholder="미확인" /></label>
        <label className="field" style={{ flex: 1 }}><span>계약금(원)</span><input type="text" inputMode="numeric" className="num" value={quote.deposit ?? ""} onChange={(e) => set({ deposit: num(e.target.value) })} placeholder="미확인" /></label>
      </div>
      <div className="row">
        <label className="field" style={{ flex: 1 }}><span>차량</span><input type="text" value={quote.truck ?? ""} onChange={(e) => set({ truck: e.target.value || null })} placeholder="적혀 있지 않음" /></label>
        <label className="field" style={{ flex: 1 }}><span>작업 인원</span><input type="text" inputMode="numeric" value={quote.workers ?? ""} onChange={(e) => set({ workers: num(e.target.value) })} placeholder="적혀 있지 않음" /></label>
        <label className="field" style={{ flex: 1 }}><span>사다리차</span>
          <select value={quote.ladder} onChange={(e) => set({ ladder: e.target.value as QuoteDraft["ladder"] })}><option>미기재</option><option>포함</option><option>별도</option></select>
        </label>
      </div>
      <label className="field"><span>이름이 적힌 품목 (한 줄에 하나, 원문 그대로)</span>
        <textarea style={{ minHeight: 64 }} value={quote.listedItems.map((l) => l.quote).join("\n")} onChange={(e) => set({ listedItems: list(e.target.value).map((q) => ({ name: q, quote: q })) })} />
      </label>
      <div className="row">
        <label className="field" style={{ flex: 1 }}><span>뭉뚱그린 문구</span>
          <textarea style={{ minHeight: 56 }} value={quote.blanketPhrases.join("\n")} onChange={(e) => set({ blanketPhrases: list(e.target.value) })} />
        </label>
        <label className="field" style={{ flex: 1 }}><span>추가 비용 문구</span>
          <textarea style={{ minHeight: 56 }} value={quote.extraFeeClauses.join("\n")} onChange={(e) => set({ extraFeeClauses: list(e.target.value) })} />
        </label>
      </div>
      <label className="field"><span>계단 작업 문구</span><input type="text" value={quote.stairsNote ?? ""} onChange={(e) => set({ stairsNote: e.target.value || null })} placeholder="적혀 있지 않음" /></label>
      {quote.totalAmount !== null && <p className="hint">총액 {won(quote.totalAmount)}{quote.deposit !== null ? ` · 계약금 ${won(quote.deposit)}` : ""}</p>}
    </>
  );
}
