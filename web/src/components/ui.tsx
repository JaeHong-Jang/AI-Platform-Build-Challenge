// 작은 화면 부품 — 상태 칩은 색 + 기호 + 글자를 함께 쓴다 (색만으로 전달하지 않는다)
import type { CardStatus, Cost, Inquiry } from "@/lib/types.ts";

const STATUS: Record<CardStatus, [string, string]> = {
  "명시됨": ["st-ok", "✓"],
  "포함 여부 미확인": ["st-unknown", "?"],
  "조건 모호": ["st-vague", "△"],
  "판독 불가": ["st-unread", "⌀"],
};
export function StatusChip({ s }: { s: CardStatus }) {
  const [cls, sym] = STATUS[s];
  return <span className={`chip ${cls}`}><span className="sym">{sym}</span>{s}</span>;
}

// 비용 처리는 테두리만 있는 글자 칩 — 같은 줄의 상태 칩(채운 칩)과 구분된다
const COST: Record<Cost, string> = { "총액 포함": "st-ok", "별도": "st-vague", "미확인": "st-unknown", "해당 없음": "st-plain" };
export function CostChip({ c }: { c: Cost }) {
  return c === "해당 없음" ? <span className="hint">—</span> : <span className={`chip outline ${COST[c]}`}>{c === "총액 포함" ? "₩ " : ""}{c}</span>;
}

const INQ: Record<Inquiry, string> = { "문의 전": "st-plain", "보냄": "st-brand", "답변 검토 대기": "st-unknown", "답변 반영": "st-ok", "미답": "st-unread", "재문의 필요": "st-vague" };
export function InquiryChip({ q }: { q: Inquiry | undefined }) {
  return q ? <span className={`chip ${INQ[q]}`}>{q}</span> : <span className="hint">—</span>;
}

export function Kpi({ icon, label, value, unit, foot, alert, on, onClick }: { icon: React.ReactNode; label: string; value: string; unit?: string; foot: string; alert?: boolean; on?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <div className="label">{icon}{label}</div>
      <div className="value">{value}{unit && <small>{unit}</small>}</div>
      <div className="foot">{foot}</div>
    </>
  );
  return onClick
    ? <button type="button" className={`panel kpi ${alert ? "alert" : ""} ${on ? "on" : ""}`} onClick={onClick}>{body}</button>
    : <div className={`panel kpi ${alert ? "alert" : ""}`}>{body}</div>;
}

export function PageHead({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
