"use client";
// 짐·조건: 왼쪽 내 짐(후보는 이름만, 확인한 것만 대조) | 오른쪽 현장 조건. 모르면 '모름' 그대로 둬도 된다.
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { missingFacts } from "@/lib/rules.ts";
import { COMMON_ITEMS } from "@/lib/fixtures.ts";
import { CANDIDATE_NOTE, candidates, categoryOf } from "@/lib/intake.ts";
import type { CaseApi } from "@/lib/store.ts";
import type { Category, Conditions, Item } from "@/lib/types.ts";
import { SiteForm, TriRow } from "./forms.tsx";
import { PageHead } from "./ui.tsx";

export default function ItemsView({ api }: { api: CaseApi }) {
  const { state, update } = api;
  const facts = missingFacts(state.cond, state.items);
  const setItems = (items: Item[]) => update({ items });
  const mine = state.items.filter((i) => !i.pending);
  const pending = state.items.filter((i) => i.pending);
  const addItem = (name: string, category: Category = categoryOf(name)) => {
    const hit = state.items.find((i) => i.name === name);
    setItems(hit ? state.items.map((i) => (i === hit ? { ...i, pending: false, move: true, count: i.pending ? i.count : (i.count ?? 0) + 1 } : i)) : [...state.items, { id: `u${Date.now()}`, name, category, count: 1, move: true }]);
  };
  const confirm = (ids: string[]) => setItems(state.items.map((i) => (ids.includes(i.id) ? { ...i, pending: false } : i)));
  const reload = () => setItems([...mine, ...candidates(state.intake.houseType, mine)]);

  return (
    <>
      <PageHead eyebrow="01 조건 해석관 · 02 짐 목록관" title="짐·조건" sub="옮길 짐과 내가 아는 현장 조건만 적습니다. 수량을 모르면 비워 두세요 — 그래도 확인 항목은 만들어집니다." />
      <div className="two">
        <section className="panel">
          <div className="panel-head"><h2>내 짐</h2><span className="sub">확인한 {mine.length}종 · 후보 {pending.length}개</span></div>
          <div className="panel-body">
            {state.agents.itemlist && pending.length > 0 && (
              <div className="cand">
                <div className="src-label" style={{ marginTop: 0 }}>짐 목록관 · {CANDIDATE_NOTE}</div>
                <div className="quick">
                  {pending.map((c) => <button key={c.id} onClick={() => confirm([c.id])}><Plus size={11} /> {c.name}</button>)}
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn ghost sm" onClick={() => confirm(pending.map((c) => c.id))}><Check size={13} />후보 전부 있음</button>
                  <button className="btn ghost sm" onClick={() => setItems(mine)}>후보 지우기</button>
                  <span className="hint">수량은 정하지 않습니다(모름)</span>
                </div>
              </div>
            )}
            {state.agents.itemlist && !pending.length && <button className="btn ghost sm" onClick={reload} style={{ marginBottom: 10 }}>잊기 쉬운 짐 후보 보기</button>}
            {!state.agents.itemlist && <p className="hint">짐 목록관이 꺼져 있어 후보 없이 직접 추가합니다.</p>}

            <table className="items">
              <thead><tr><th>품목</th><th>분류</th><th>수량</th><th>옮김</th><th /></tr></thead>
              <tbody>
                {mine.map((it) => (
                  <tr key={it.id} style={{ opacity: it.move ? 1 : 0.5 }}>
                    <td><input type="text" value={it.name} onChange={(e) => setItems(state.items.map((x) => x.id === it.id ? { ...x, name: e.target.value } : x))} aria-label="품목 이름" /></td>
                    <td>
                      <select value={it.category} onChange={(e) => setItems(state.items.map((x) => x.id === it.id ? { ...x, category: e.target.value as Category } : x))} aria-label="분류">
                        <option>대형가구</option><option>가전</option><option>박스·잡화</option>
                      </select>
                    </td>
                    <td>
                      <span className="stepper">
                        <button onClick={() => setItems(state.items.map((x) => x.id === it.id ? { ...x, count: x.count === null || x.count <= 1 ? null : x.count - 1 } : x))} aria-label="줄이기"><Minus size={12} /></button>
                        <b title={it.count === null ? "수량 모름" : undefined}>{it.count ?? "?"}</b>
                        <button onClick={() => setItems(state.items.map((x) => x.id === it.id ? { ...x, count: (x.count ?? 0) + 1 } : x))} aria-label="늘리기"><Plus size={12} /></button>
                      </span>
                    </td>
                    <td><input type="checkbox" checked={it.move} onChange={(e) => setItems(state.items.map((x) => x.id === it.id ? { ...x, move: e.target.checked } : x))} aria-label="옮김" /></td>
                    <td><button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setItems(state.items.filter((x) => x.id !== it.id))} aria-label="삭제"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
                {!mine.length && <tr><td colSpan={5} className="hint">아래에서 골라 추가하거나 후보를 눌러 주세요.</td></tr>}
              </tbody>
            </table>
            <div className="quick" style={{ marginTop: 10 }}>
              {COMMON_ITEMS.filter((c) => !mine.some((m) => m.name === c.name)).map((c) => <button key={c.name} onClick={() => addItem(c.name, c.category)}>+ {c.name}</button>)}
              <button onClick={() => addItem("", "대형가구")}>+ 직접 적기</button>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>현장 조건</h2><span className="sub">내가 아는 사실만</span></div>
          <div className="panel-body">
            <SiteForm label="출발지" site={state.cond.from} onChange={(s) => update({ cond: { ...state.cond, from: s } })} />
            <SiteForm label="도착지" site={state.cond.to} onChange={(s) => update({ cond: { ...state.cond, to: s } })} />
            <TriRow label="사다리차가 필요한가요?" value={state.cond.ladderNeeded} onChange={(v) => update({ cond: { ...state.cond, ladderNeeded: v } as Conditions })} />
            {facts.length > 0 && <div className="warn">아직 모르는 것: {facts.join(" · ")} — 견적을 받을 때 함께 물어도 됩니다.</div>}
          </div>
        </section>
      </div>
    </>
  );
}
