"use client";
// 셸: TRITON 운영 콘솔 구조 — 어두운 왼쪽 레일(메뉴 + 실행 흐름 순서의 에이전트 켜기/끄기) + 상단바 + 본문.
import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, FileCheck2, History, Home, LifeBuoy, Lock, Moon, MoreHorizontal, Network, Package, Plus, Sun, Truck } from "lucide-react";
import { useCase, newQuote } from "@/lib/store.ts";
import { AGENTS, AGENT, isOn, type AgentId } from "@/lib/agents.ts";
import { QUOTE_DRAFT, QUOTE_DRAFT_B, SAMPLE_QUOTE_TEXT, SAMPLE_QUOTE_TEXT_B } from "@/lib/fixtures.ts";
import { verifyDraft } from "@/lib/verify.ts";
import type { Health } from "@/lib/ollama.ts";
import type { QuoteDraft } from "@/lib/types.ts";
import HomeView from "./HomeView.tsx";
import ItemsView from "./ItemsView.tsx";
import QuotesView from "./QuotesView.tsx";
import ContractView from "./ContractView.tsx";
import IncidentView from "./IncidentView.tsx";
import GraphView from "./GraphView.tsx";
import { LedgerView, RefsView } from "./Records.tsx";

export type View = "start" | "home" | "items" | "quotes" | "contract" | "incident" | "graph" | "refs" | "log";
const VIEWS: View[] = ["start", "home", "items", "quotes", "contract", "incident", "graph", "refs", "log"];

export async function postJSON<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new Error("에이전트를 꺼서 멈췄습니다. 결과는 반영하지 않았어요.");
    throw e;
  }
  const data = await res.json().catch(() => ({ error: `서버 응답 오류 (${res.status})` }));
  if (!res.ok) throw new Error(data.error ?? "요청 실패");
  return data as T;
}

// 에이전트마다 진행 중인 요청 — 레일·장면에서 끄면 abort 한다. 서버는 req.signal로 GPU 줄에서 빠지거나 생성을 멈춘다.
const inflight = new Map<AgentId, AbortController>();
// 요청이 나가 있는 동안 그 에이전트는 '작동 중' — 화면 어디서 부르든 여기서 한 번에 알린다 (B009 점검 P0-2)
let busyListener: ((id: AgentId, on: boolean) => void) | null = null;
/** 에이전트 이름으로 보내는 요청. 같은 에이전트의 이전 요청은 취소한다 */
export function agentPost<T>(id: AgentId, url: string, body: unknown): Promise<T> {
  inflight.get(id)?.abort();
  const c = new AbortController();
  inflight.set(id, c);
  busyListener?.(id, true);
  return postJSON<T>(url, body, c.signal).finally(() => { if (inflight.get(id) === c) { inflight.delete(id); busyListener?.(id, false); } });
}

/** 다음에 쓸 모델을 미리 올린다. 실패해도 조용히 넘어간다 (실제 호출이 다시 시도한다) */
export function warmup(role: "reader" | "agent") {
  fetch("/api/warmup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role }) }).catch(() => {});
}

export interface ReadResult { draft: QuoteDraft; raw: QuoteDraft; dropped: string[]; model: string; ms: number }

export default function Dashboard() {
  const api = useCase();
  const { state, update, updateQuote } = api;
  const [view, setView] = useState<View>("home");
  const [health, setHealth] = useState<Health | null>(null);
  const [dark, setDark] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [readError, setReadError] = useState("");
  const [busy, setBusy] = useState<AgentId[]>([]);

  useEffect(() => {
    const sync = () => { const v = location.hash.replace("#/", "") as View; setView(VIEWS.includes(v) ? v : "home"); };
    sync(); window.addEventListener("hashchange", sync);
    setDark(document.documentElement.dataset.theme === "dark");
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // 앱을 열면 읽기 모델(조건 해석·견적 읽기)을 미리 올려 둔다 — 첫 호출의 적재 대기를 없앤다 (B009 속도)
  useEffect(() => { if (health?.ok) warmup("reader"); }, [health?.ok]);

  useEffect(() => {
    const check = () => fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => setHealth(null));
    check(); const t = setInterval(check, 15_000);
    return () => clearInterval(t);
  }, []);

  const toggleTheme = () => {
    const next = !dark; setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("isa-theme", next ? "dark" : "light"); } catch { /* 무시 */ }
  };
  const working = (id: AgentId, on: boolean) => setBusy((b) => (on ? [...new Set([...b, id])] : b.filter((x) => x !== id)));
  useEffect(() => { busyListener = working; return () => { busyListener = null; }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** 문서 읽기관: 붙여넣은 견적서 글을 로컬 모델(ax4-light)로 읽는다. 원문에 없는 값은 서버가 걷어낸다. */
  async function readQuote(id: string, text: string) {
    setReading(id); setReadError("");
    try {
      const r = await agentPost<ReadResult>("reader", "/api/extract/quote", { text });
      updateQuote(id, { quoteText: text, draft: r.draft, raw: r.raw, dropped: r.dropped, reader: { model: r.model, ms: r.ms }, overrides: {}, inquiry: {}, asked: [] });
      return true;
    } catch (e) {
      setReadError((e as Error).message);
      return false;
    } finally { setReading(null); }
  }

  /** 가상 견적 2건 — Ollama가 꺼져 있으면 미리 만든 초안을 같은 원문 대조를 거쳐 쓰고, 그 사실을 표시한다 */
  async function loadQuotes() {
    const samples: [string, QuoteDraft][] = [[SAMPLE_QUOTE_TEXT, QUOTE_DRAFT], [SAMPLE_QUOTE_TEXT_B, QUOTE_DRAFT_B]];
    const qs = samples.map(([text], n) => newQuote(n, { quoteText: text }));
    update({ quotes: qs, active: qs[0].id, chosen: null });
    for (const [n, [text, fallback]] of samples.entries()) {
      if (health?.ok && state.agents.reader && (await readQuote(qs[n].id, text))) continue;
      const v = verifyDraft(text, fallback);
      updateQuote(qs[n].id, { quoteText: text, draft: v.draft, dropped: v.dropped, reader: { model: health?.ok ? "미리 만든 초안 (읽기 실패)" : "미리 만든 초안 (Ollama 연결 안 됨)", ms: 0 } });
      setReadError("");
    }
  }

  const toggleAgent = (id: AgentId) => { if (AGENT[id].locked) return; if (state.agents[id]) inflight.get(id)?.abort(); update((s) => ({ agents: { ...s.agents, [id]: !s.agents[id] } })); };
  const onCount = AGENTS.filter((a) => isOn(a.id, state.agents)).length;
  const active = !state.started && view !== "incident" ? "start" : view === "start" ? "home" : view; // 사고 대응은 계약 점검 없이도 쓸 수 있다
  const q = api.quote;
  const nav: [View, string, React.ReactNode, string?][] = [
    ["home", "홈", <Home size={16} key="h" />],
    ["items", "짐·조건", <Package size={16} key="i" />, String(state.items.filter((i) => !i.pending && i.move).length)],
    ["quotes", "견적·업체", <Truck size={16} key="q" />, state.quotes.length ? String(state.quotes.length) : undefined],
    ["contract", "계약·서류", <FileCheck2 size={16} key="c" />],
    ["incident", "사고 대응", <LifeBuoy size={16} key="x" />, state.incidents?.length ? String(state.incidents.length) : undefined],
  ];

  return (
    <div className="shell">
      <aside className="rail">
        <div className="logo">
          <div className="logo-mark"><Truck size={18} /></div>
          <div><b>이사 지킴이</b><span>계약 전 점검 · 로컬 에이전트</span></div>
        </div>
        <button className="btn new" onClick={() => { if (!state.started || confirm("지금 이사 기록을 지우고 새로 시작할까요?")) { api.reset(); location.hash = "#/start"; } }}><Plus size={14} />새 이사 시작</button>
        <nav className="nav">
          <div className="nav-group">이사</div>
          {nav.map(([v, label, icon, count]) => (
            <a key={v} href={`#/${v}`} className={`${active === v ? "on" : ""} ${state.started || v === "incident" ? "" : "locked"}`}>{icon}{label}{count && <span className="count">{count}</span>}</a>
          ))}
          {/* 에이전트 토글은 접어 두어 아래 메뉴가 늘 보이게 한다 (B009 점검 P1-9) */}
          <details className="agents-nav">
            <summary className="nav-group">에이전트 · {onCount}/{AGENTS.length} 켜짐{busy.length ? ` · 작업 중 ${busy.length}` : ""}</summary>
            {AGENTS.map((a) => {
              const on = isOn(a.id, state.agents);
              return (
                <div key={a.id} className={`agent-row ${on ? "" : "off"}`} title={`${a.does}\n끄면: ${a.off}`}>
                  <span className={`adot ${on ? (busy.includes(a.id) ? "on pulse" : "done") : ""}`} />
                  <span className="nm">{a.step} {a.name}</span>
                  <span className="kind">{a.kind}</span>
                  {a.locked ? <Lock size={13} aria-label="끌 수 없음" />
                    : <button className="switch" role="switch" aria-checked={on} aria-label={`${a.name} ${on ? "끄기" : "켜기"}`} onClick={() => toggleAgent(a.id)} />}
                </div>
              );
            })}
          </details>
          <div className="nav-group">근거·기록</div>
          <a href="#/graph" className={`${active === "graph" ? "on" : ""} ${state.started ? "" : "locked"}`}><Network size={16} />근거 그래프</a>
          <a href="#/refs" className={active === "refs" ? "on" : ""}><BookOpen size={16} />참고 조항·통계</a>
          <a href="#/log" className={active === "log" ? "on" : ""}><History size={16} />근거 장부</a>
        </nav>
        <div className="rail-foot">위법 여부를 판정하거나 업체를 추천하지 않습니다. 계약 전에 물을 것을, 문제가 생기면 공식 근거와 할 일을 정리해 드립니다.</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="case-strip">
            {state.started ? (
              <>
                <span><b>{state.intake.houseType === "모름" ? "집 유형 모름" : state.intake.houseType}</b></span><span className="sep" />
                <span>출발 <b>{fl(state.cond.from.floor)}</b> · 엘베 {state.cond.from.elevator}</span><span className="sep" />
                <span>도착 <b>{fl(state.cond.to.floor)}</b> · 엘베 {state.cond.to.elevator}</span><span className="sep" />
                <span>견적 <b>{state.quotes.filter((x) => x.draft).length}건</b>{q?.draft?.company ? ` · 보는 중 ${q.draft.company}` : ""}</span>
              </>
            ) : <span><ClipboardList size={14} style={{ verticalAlign: -2 }} /> 조건을 정하면 맞춤 홈이 만들어집니다</span>}
          </div>
          <div className="top-right">
            <span className="pill">에이전트 {onCount}/{AGENTS.length}{busy.length ? ` · 작업 중 ${busy.length}` : ""}</span>
            <span className="pill" title={health?.url}>
              <span className={`dot ${health?.ok ? "on" : "off"}`} />
              {health?.ok ? `Ollama · ${short(health.agent.name)}${health.agent.ready ? "" : " (없음)"} · ${short(health.reader.name)}${health.reader.ready ? "" : " (없음)"}` : "Ollama 연결 안 됨"}
            </span>
            <button className="icon-btn" onClick={toggleTheme} aria-label="화면 테마 바꾸기">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </header>

        <main className="page">
          {api.loaded && (active === "home" || active === "start") && <HomeView api={api} busy={busy} onToggle={toggleAgent} onRead={readQuote} ollama={!!health?.ok} />}
          {active === "items" && <ItemsView api={api} />}
          {active === "quotes" && <QuotesView api={api} onRead={readQuote} reading={reading} readError={readError} onSamples={loadQuotes} />}
          {active === "contract" && <ContractView api={api} />}
          {active === "incident" && <IncidentView api={api} ollama={!!health?.ok} />}
          {active === "graph" && <GraphView api={api} />}
          {active === "refs" && <RefsView />}
          {active === "log" && <LedgerView api={api} />}
        </main>
        {/* 모바일: 하단 탭바 + 더보기 (B009 점검 P0-6) */}
        <nav className="tabbar" aria-label="화면 이동">
          {nav.map(([v, label, icon]) => <a key={v} href={`#/${v}`} className={active === v ? "on" : ""}>{icon}<span>{label}</span></a>)}
          <details className="more">
            <summary><MoreHorizontal size={16} /><span>더보기</span></summary>
            <div className="sheet">
              <a href="#/graph"><Network size={15} />근거 그래프</a>
              <a href="#/log"><History size={15} />근거 장부</a>
              <a href="#/refs"><BookOpen size={15} />참고 조항·통계</a>
              <button onClick={() => { if (confirm("지금 이사 기록을 지우고 새로 시작할까요?")) { api.reset(); location.hash = "#/start"; } }}><Plus size={15} />새 이사 시작</button>
              <p className="hint">에이전트 켜기·끄기는 홈의 '실행 흐름' 스위치로 합니다.</p>
            </div>
          </details>
        </nav>
      </div>
    </div>
  );
}

const short = (m: string) => m.split(":")[0];
const fl = (n: number | null) => (n === null ? "층 모름" : n < 0 ? `지하 ${-n}층` : `${n}층`);
