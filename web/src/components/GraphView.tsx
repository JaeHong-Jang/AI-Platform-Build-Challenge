"use client";
// 근거 그래프: 확인 항목 하나를 고르면 '내 입력 → 확인 항목 → 원문·답변 → 조항·질문' 4열 사슬로 보여 준다 (TRITON evidenceLayout 방식).
// 맨 위는 관측소처럼 어두운 힘-배치 네트워크(AI가 어떤 근거를 찾았는지), 그 아래에 기존 4열 사슬과 온톨로지 표를 둔다.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { evidenceSummary, graphOf, type Group, type KNode } from "@/lib/kgraph.ts";
import { chainOf, ONTOLOGY, type GNode } from "@/lib/ontology.ts";
import { REFERENCE_NOTICE } from "@/lib/references.ts";
import type { CaseApi } from "@/lib/store.ts";
import { isOpen } from "./CheckTable.tsx";
import { PageHead, StatusChip } from "./ui.tsx";
import "./graph.css";
import type ForceGraph from "force-graph";

type FG = InstanceType<typeof ForceGraph>;

const COLS = ["내 입력", "확인 항목", "근거 (원문·답변)", "참고 조항 · 물을 것"];
const RELS = ["대조 대상", "근거 · 답변", "참고 · 질문"];

export default function GraphView({ api }: { api: CaseApi }) {
  const { state, cards, quote: q } = api;
  const [onlyOpen, setOnlyOpen] = useState(true);
  const list = cards.filter((c) => (onlyOpen ? isOpen(c) : true));
  const [sel, setSel] = useState<string | null>(null);
  const card = cards.find((c) => c.id === sel) ?? list[0] ?? cards[0];
  const chain = card ? chainOf(card, state.items, state.cond) : null;

  return (
    <>
      <PageHead eyebrow="근거" title="근거 그래프" sub={`질문 하나가 내 입력·견적서 글·약관 조항 중 어디서 나왔는지 따라갑니다. ${q ? `${q.label} · ${q.draft?.company ?? "업체명 없음"}` : "견적을 넣으면 그려집니다"}`} />
      <EvidenceSummary api={api} />
      <KnowledgeGraph api={api} />
      {!q?.draft ? <div className="empty"><h3>아직 견적이 없습니다</h3><p>'견적·업체'에 견적을 붙여 넣으면 확인 항목마다 근거 사슬이 생깁니다.</p></div> : (
        <div className="graph-wrap">
          <section className="panel">
            <div className="panel-head"><h2>확인 항목</h2><label className="right hint" style={{ gap: 6 }}><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />확인 남은 것만</label></div>
            <ul className="mini-list" style={{ padding: "0 12px" }}>
              {list.map((c) => <li key={c.id} className={card?.id === c.id ? "on" : ""} onClick={() => setSel(c.id)} style={{ cursor: "pointer" }}><span className="grow">{c.title}</span><StatusChip s={c.status} /></li>)}
            </ul>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>{card?.title}</h2>{card && <StatusChip s={card.status} />}<span className="sub" style={{ marginLeft: "auto" }}>4열 근거 사슬</span></div>
            <div className="panel-body chain">
              {chain?.cols.map((col, i) => (
                <div className="chain-step" key={i}>
                  <div className="chain-col">
                    <div className="src-label" style={{ marginTop: 0 }}>{COLS[i]}</div>
                    {col.length ? col.map((n) => <Node key={n.id} n={n} />) : <div className="gnode g-empty">{i === 0 ? "내 입력과 무관 — 견적서 쪽 항목" : "—"}</div>}
                  </div>
                  {i < 3 && <div className="chain-rel"><ArrowRight size={14} /><span>{RELS[i]}</span></div>}
                </div>
              ))}
            </div>
            <p className="notice" style={{ padding: "0 18px 14px" }}>{REFERENCE_NOTICE}</p>
          </section>
        </div>
      )}
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head"><h2>온톨로지</h2><span className="sub">노드 종류와 출처 — 모델은 노드를 만들지 않습니다</span></div>
        <div style={{ overflowX: "auto" }}>
          <table className="cmp"><thead><tr><th>종류</th><th>만드는 곳</th><th>뜻</th></tr></thead>
            <tbody>{ONTOLOGY.map((o) => <tr key={o.cls}><td className="target"><span className={`gdot ${cls(o.cls)}`} /> {o.cls}</td><td>{o.from}</td><td>{o.desc}</td></tr>)}</tbody></table>
        </div>
      </section>
    </>
  );
}

const cls = (c: GNode["cls"]) => ({ "내 입력": "g-in", "확인 항목": "g-card", "견적서 원문": "g-src", "업체 답변": "g-ans", "원문 없음": "g-none", "참고 조항": "g-ref", "업체에 물을 것": "g-ask" })[c];

function Node({ n }: { n: GNode }) {
  return (
    <div className={`gnode ${cls(n.cls)}`}>
      <span className="gcls">{n.cls}</span>
      <b>{n.cls === "견적서 원문" || n.cls === "업체 답변" ? `“${n.label}”` : n.label}</b>
      {n.status && <StatusChip s={n.status} />}
      {n.detail && <small>{n.detail}</small>}
    </div>
  );
}

// ── 근거 네트워크 ─────────────────────────────────────────────

const GROUP_COLOR: Record<Group, string> = {
  "이사": "#ffd166", "에이전트": "#b794f6", "내 입력": "#4cc9f0", "견적": "#ff9f1c", "확인 항목": "#4ade80",
  "원문 발췌": "#2dd4bf", "업체 답변": "#f472b6", "참고 조항": "#a5b4d8", "물을 것": "#fde047", "근거 장부": "#f87171",
};
const STATUS_COLOR: Record<string, string> = { "명시됨": "#4ade80", "포함 여부 미확인": "#fbbf24", "조건 모호": "#fb923c", "판독 불가": "#94a3b8" };
const nodeColor = (n: KNode) => (n.status ? STATUS_COLOR[n.status] : n.sub === "모델 읽기" || n.sub === "답변 후보" ? "#fca5a5" : GROUP_COLOR[n.group]);
const isHub = (n: KNode) => !!n.hub || n.group === "이사" || n.group === "견적";

function EvidenceSummary({ api }: { api: CaseApi }) {
  const s = useMemo(() => evidenceSummary(api.state), [api.state]);
  return (
    <div className="kg-sum" role="status">
      <span className="lead">AI가 무엇을 근거로 했나</span>
      <span>모델 읽기 <b>{s.reads}</b>회</span>
      <span>걸러낸 값 <b>{s.dropped}</b>개</span>
      <span>승인된 답변 <b>{s.approved}</b>개</span>
      <span>거절된 후보 <b>{s.rejected}</b>개</span>
    </div>
  );
}

/** 고른 노드의 사슬: 이사·견적·에이전트 허브는 건너지 않는다 (허브를 지나면 전부 이어져 버린다). 허브를 고르면 한 단계만 */
function chainSet(start: string, adj: Map<string, string[]>, byId: Map<string, KNode>): Set<string> {
  const seen = new Set([start]);
  const hubStart = isHub(byId.get(start)!) || byId.get(start)!.group === "에이전트";
  const queue = [start];
  while (queue.length) {
    const id = queue.shift()!;
    const n = byId.get(id)!;
    if (id !== start && (isHub(n) || n.group === "에이전트")) continue;
    if (hubStart && id !== start) continue;
    for (const m of adj.get(id) ?? []) if (!seen.has(m)) { seen.add(m); queue.push(m); }
  }
  return seen;
}

function KnowledgeGraph({ api }: { api: CaseApi }) {
  const graph = useMemo(() => graphOf(api.state), [api.state]);
  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const adj = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of graph.links) { (m.get(l.source) ?? m.set(l.source, []).get(l.source)!).push(l.target); (m.get(l.target) ?? m.set(l.target, []).get(l.target)!).push(l.source); }
    return m;
  }, [graph]);
  const [selId, setSelId] = useState<string | null>(null);
  const sel = selId ? byId.get(selId) ?? null : null;
  const chain = useMemo(() => (sel ? chainSet(sel.id, adj, byId) : null), [sel, adj, byId]);

  const box = useRef<HTMLDivElement>(null);
  const fg = useRef<FG | null>(null);
  const live = useRef({ chain: null as Set<string> | null, sel: null as string | null, hover: null as string | null, adj, byId, calm: false });
  live.current.adj = adj; live.current.byId = byId; live.current.chain = chain; live.current.sel = selId;

  // 그리기 규칙은 최신 선택·강조 상태를 ref로 읽는다. 접근자를 다시 달면 force-graph가 다시 그린다
  const style = (g: FG) => {
    const L = live.current;
    const dim = (id: string) => !!L.chain && !L.chain.has(id);
    g.nodeCanvasObject((raw, ctx, scale) => {
      const n = raw as KNode & { x: number; y: number; deg: number };
      const color = nodeColor(n), hub = isHub(n) || n.group === "에이전트" && n.hub;
      const r = (hub ? 7 : 3) + Math.sqrt(n.deg) * (hub ? 1.4 : 0.9);
      const faded = dim(n.id);
      ctx.globalAlpha = faded ? 0.12 : 1;
      ctx.shadowColor = color; ctx.shadowBlur = faded ? 0 : hub ? 22 : 12; // 발광은 shadowBlur로
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2 * Math.PI); ctx.fill();
      ctx.shadowBlur = 0;
      if (L.sel === n.id) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5 / scale; ctx.beginPath(); ctx.arc(n.x, n.y, r + 3 / scale, 0, 2 * Math.PI); ctx.stroke(); }
      const showLabel = hub || L.hover === n.id || L.sel === n.id || (!!L.chain && L.chain.has(n.id)) || scale > 2.2;
      if (showLabel && !faded) {
        const size = (hub ? 15 : 11) / Math.max(scale, 0.7);
        const text = n.label.length > (hub ? 18 : 22) ? `${n.label.slice(0, hub ? 18 : 22)}…` : n.label;
        ctx.font = `${hub ? 700 : 500} ${size}px Pretendard, "Noto Sans KR", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = hub ? "#ffffff" : "#cfd9ff";
        ctx.fillText(text, n.x, n.y + r + 2 / scale);
      }
      ctx.globalAlpha = 1;
    });
    g.nodeCanvasObjectMode(() => "replace");
    g.nodePointerAreaPaint((raw, color, ctx) => {
      const n = raw as KNode & { x: number; y: number; deg: number };
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, (isHub(n) ? 9 : 5) + Math.sqrt(n.deg), 0, 2 * Math.PI); ctx.fill();
    });
    const ends = (l: { source?: unknown; target?: unknown }) => [l.source, l.target].map((e) => (typeof e === "object" ? (e as { id: string }).id : String(e)));
    g.linkColor((l) => { const [a, b] = ends(l); return !L.chain ? "rgba(140,170,255,0.28)" : L.chain.has(a) && L.chain.has(b) ? "rgba(255,255,255,0.8)" : "rgba(140,170,255,0.05)"; });
    g.linkWidth((l) => { const [a, b] = ends(l); return L.chain && L.chain.has(a) && L.chain.has(b) ? 1.8 : 0.7; });
    g.linkDirectionalParticles((l) => { const [a, b] = ends(l); return !L.calm && L.chain && L.chain.has(a) && L.chain.has(b) ? 2 : 0; });
    g.linkDirectionalParticleWidth(2.2);
  };

  // 그래프 만들기 — 브라우저에서만 불러온다 (force-graph는 canvas·window를 쓴다).
  // 선택 이유: 3d-force-graph(three.js)는 번들이 무거워 모바일에서 느리다. 2D force-graph는 가볍고 shadowBlur로 같은 발광 인상을 낸다.
  useEffect(() => {
    let dead = false, ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;
    const el = box.current;
    if (!el) return;
    const calm = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    live.current.calm = calm;
    import("force-graph").then(({ default: ForceGraph }) => {
      if (dead || !el) return;
      const g = new ForceGraph(el).backgroundColor("rgba(0,0,0,0)").nodeId("id").nodeLabel(() => "")
        .width(el.clientWidth).height(el.clientHeight)
        .d3VelocityDecay(calm ? 0.7 : 0.3)
        .warmupTicks(calm ? 150 : 0).cooldownTicks(calm ? 1 : 260)
        .onNodeClick((n) => { setSelId((n as KNode).id); })
        .onBackgroundClick(() => setSelId(null))
        .onNodeHover((n) => { live.current.hover = n ? (n as KNode).id : null; el.style.cursor = n ? "pointer" : ""; style(g); });
      g.d3Force("charge")?.strength?.((n: object) => (isHub(n as KNode) ? -260 : (n as KNode).group === "에이전트" ? -90 : -70));
      g.d3Force("link")?.distance?.(() => 38);
      fg.current = g;
      style(g);
      g.graphData(dataOf(live.current.adj, live.current.byId));
      ro = new ResizeObserver(() => { if (el.clientWidth > 0) g.width(el.clientWidth).height(el.clientHeight); });
      ro.observe(el);
      // 화면 밖이면 그리기를 멈춘다
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) g.resumeAnimation(); else g.pauseAnimation(); });
      io.observe(el);
      g.onEngineStop(() => g.zoomToFit(400, 40));
      if (calm) setTimeout(() => g.zoomToFit(0, 40), 0);
    });
    return () => { dead = true; ro?.disconnect(); io?.disconnect(); fg.current?._destructor?.(); fg.current = null; el.replaceChildren(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 상태가 바뀌면 같은 위치를 유지한 채 노드·링크만 갈아 끼운다
  const sig = useMemo(() => `${graph.nodes.map((n) => n.id).join("|")}#${graph.links.length}`, [graph]);
  useEffect(() => {
    const g = fg.current;
    if (!g) return;
    const old = new Map((g.graphData().nodes as (KNode & { x?: number; y?: number })[]).map((n) => [n.id, n]));
    const d = dataOf(adj, byId);
    for (const n of d.nodes as (KNode & { x?: number; y?: number })[]) { const o = old.get(n.id); if (o) { n.x = o.x; n.y = o.y; } }
    g.graphData(d);
  }, [sig, adj, byId]);

  useEffect(() => { if (fg.current) style(fg.current); }, [selId, chain]); // eslint-disable-line react-hooks/exhaustive-deps

  const near = sel ? [...(adj.get(sel.id) ?? [])].map((id) => byId.get(id)!).filter(Boolean) : [];
  return (
    <section className="kg" aria-label="근거 네트워크">
      <div className="kg-stage">
        <div className="kg-stars" />
        <div className="kg-canvas" ref={box} />
        <div className="kg-hint">노드를 누르면 그 근거 사슬만 밝아집니다 · 끌어서 움직이고 휠로 확대</div>
        <div className="kg-legend">
          {(Object.keys(GROUP_COLOR) as Group[]).filter((g) => g !== "확인 항목").map((g) => <span key={g} style={{ color: GROUP_COLOR[g] }}><i />{g}</span>)}
          {Object.entries(STATUS_COLOR).map(([s, c]) => <span key={s} style={{ color: c }}><i />확인 항목 · {s}</span>)}
        </div>
      </div>
      <aside className="kg-side">
        {!sel ? (
          <>
            <h3>노드를 눌러 보세요</h3>
            <p className="kg-none">모든 노드는 내 입력 · 견적서 원문 · 약관 조항 · 규칙 · 모델 실행 기록에서 나옵니다. 모델이 근거를 지어내지 않았다는 것은 '근거 장부'의 걸러낸 값·거절된 후보로 볼 수 있습니다.</p>
          </>
        ) : (
          <>
            <h3>{sel.label}</h3>
            <dl>
              <dt>종류</dt><dd>{sel.group}{sel.sub ? ` · ${sel.sub}` : ""}{sel.team ? ` · ${sel.team}` : ""}</dd>
              <dt>출처</dt><dd>{sel.by}</dd>
              {sel.status && <><dt>상태</dt><dd>{sel.status}</dd></>}
            </dl>
            {sel.detail && <blockquote>{sel.detail}</blockquote>}
            <div className="src-label" style={{ color: "#7f90c0" }}>연결된 노드 {near.length}개</div>
            <ul>{near.map((m) => <li key={m.id}><button type="button" onClick={() => setSelId(m.id)}><i style={{ background: nodeColor(m) }} />{m.label.length > 40 ? `${m.label.slice(0, 40)}…` : m.label}<small style={{ marginLeft: "auto", color: "#7f90c0" }}>{m.group}</small></button></li>)}</ul>
            <p style={{ marginTop: 10 }}><button type="button" onClick={() => setSelId(null)} style={{ all: "unset", cursor: "pointer", color: "#7ea2ff", fontSize: 12.5 }}>선택 해제</button></p>
          </>
        )}
      </aside>
    </section>
  );
}

/** force-graph에 넘길 복사본 (시뮬레이션이 x·y를 써 넣으므로 원본과 분리) */
function dataOf(adj: Map<string, string[]>, byId: Map<string, KNode>) {
  const nodes = [...byId.values()].map((n) => ({ ...n, deg: adj.get(n.id)?.length ?? 0 }));
  const links: { source: string; target: string }[] = [];
  const seen = new Set<string>();
  for (const [a, list] of adj) for (const b of list) { const k = a < b ? `${a}|${b}` : `${b}|${a}`; if (!seen.has(k)) { seen.add(k); links.push({ source: a, target: b }); } }
  return { nodes, links };
}
