"use client";
// 이삿짐 점검 한 페이지 (B010·B012): 입력(조건 한 줄 + 견적서) → 점검 에이전트가 짐마다 견적과 대조해 트럭에 싣는 장면 → 견적 점검 결과.
// 장면·실행 흐름·결과는 모두 같은 카드 배열에서 나온다. AI 단계는 실제 모델 호출 시간 동안 그 캐릭터가 일한다.
// 점검 에이전트는 견적을 읽은 뒤 실제로 도구를 불러 판정·질문을 만들고, 실패하면 규칙 기준선(기본 항목)이 남는다.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Bot, ClipboardCopy, Loader2, Lock, RotateCcw, SkipForward, Sparkles } from "lucide-react";
import { AGENT, AGENTS, isOn, type AgentId, type AgentState } from "@/lib/agents.ts";
import { reports } from "@/lib/pipeline.ts";
import { canonical, compare, won } from "@/lib/rules.ts";
import { composeRequest } from "@/lib/message.ts";
import { depositRatio } from "@/lib/docs.ts";
import { candidates, type IntakeResult } from "@/lib/intake.ts";
import { verifyDraft } from "@/lib/verify.ts";
import { inspectSig, type InspectRun } from "@/lib/inspect.ts";
import { NO_QUOTE, QUOTE_DRAFT, SAMPLE_QUOTE_TEXT } from "@/lib/fixtures.ts";
import { frameAt, geoOf, planOf, type Actor } from "@/lib/scene.ts";
import { newQuote, type CaseApi } from "@/lib/store.ts";
import type { Card } from "@/lib/types.ts";
import MoveScene from "./scene/MoveScene.tsx";
import { isOpen } from "./CheckTable.tsx";
import { agentPost } from "./Dashboard.tsx";
import { CostChip, StatusChip } from "./ui.tsx";

const SAMPLE_SENTENCE = "원룸, 지금 3층 엘베 없음, 새 집은 5층 엘베 있음. 싱글 침대·책장·책상·의자·냉장고·세탁기·전자레인지, 이삿짐 박스 6개 옮겨요";
const fl = (n: number | null) => (n === null ? "층 모름" : n < 0 ? `지하 ${-n}층` : `${n}층`);
type Tab = "calc" | "ask" | "report";

const SEEN = "isa-seen-v2";
const seenIs = (sig: string) => { try { return sessionStorage.getItem(SEEN) === sig; } catch { return false; } };

/** 재생 시계: requestAnimationFrame으로 t(ms)를 0 → total. 이미 본 구성·동작 줄이기면 바로 끝. hold 동안은 0에 멈춘다.
 *  replay가 바뀌면 본 구성이어도 처음부터 다시 재생한다 (다시 보기·점검 실행) */
function useClock(sig: string, total: number, hold: boolean, replay: number) {
  const [t, setT] = useState(() => (typeof window !== "undefined" && seenIs(sig) ? total : 0));
  const raf = useRef(0);
  const last = useRef(replay);
  const seenKey = SEEN;
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (hold) { setT(0); return; }
    const forced = last.current !== replay;
    last.current = replay;
    const seen = !forced && seenIs(sig);
    if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(total); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const v = Math.min(now - t0, total);
      setT(v);
      if (v < total) raf.current = requestAnimationFrame(tick);
      else try { sessionStorage.setItem(seenKey, sig); } catch { /* 무시 */ }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [sig, total, hold, replay]);
  const skip = () => { cancelAnimationFrame(raf.current); setT(total); try { sessionStorage.setItem(seenKey, sig); } catch { /* 무시 */ } };
  return { t, playing: !hold && t < total, skip };
}

export default function HomeView({ api, busy, onToggle, onRead, ollama }: { api: CaseApi; busy: AgentId[]; onToggle: (id: AgentId) => void; onRead: (id: string, text: string) => Promise<boolean>; ollama: boolean }) {
  const { state, update, updateQuote, quote: q } = api;
  const [sentence, setSentence] = useState(state.intake.sentence === "가상 사례" ? "" : state.intake.sentence);
  const [quoteText, setQuoteText] = useState(q?.quoteText ?? "");
  const [live, setLive] = useState<AgentId | null>(null);
  const [liveMs, setLiveMs] = useState(0);
  const [notes, setNotes] = useState<string[]>([]);
  const [nonce, setNonce] = useState(0);
  const [tab, setTab] = useState<Tab>("calc");
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wantInspect, setWantInspect] = useState(false);
  const hasQuote = !!q?.draft;
  const inspectorOn = isOn("inspector", state.agents);
  const curSig = q?.draft ? inspectSig(state.items, state.cond, q.quoteText) : "";
  const ins = q?.inspection;
  const inspected = !!ins && ins.sig === curSig;
  const needInspect = hasQuote && inspectorOn && !inspected;

  // 견적서 칸은 보고 있는 견적을 따라간다 (다른 화면에서 견적을 바꾸면 여기에도 보인다)
  // 점검 중 새로 만든 빈 견적이 입력 칸을 지우지 않게, 모델이 일하는 동안은 따라가지 않는다
  useEffect(() => { if (!live) setQuoteText(q?.quoteText ?? ""); }, [q?.id, q?.quoteText]); // eslint-disable-line react-hooks/exhaustive-deps
  // '새 이사 시작'으로 기록을 지우면 입력 칸도 비운다 (점검 중 started가 켜지는 것과 구분: 꺼질 때만)
  useEffect(() => { if (!state.started) { setSentence(""); setQuoteText(""); setNotes([]); } }, [state.started]);
  useEffect(() => {
    if (!live) return;
    const t0 = performance.now();
    const id = setInterval(() => setLiveMs(performance.now() - t0), 100);
    return () => { clearInterval(id); setLiveMs(0); };
  }, [live]);

  // 견적 전에는 빈 견적과 대조한다 — 그 결과가 '견적을 받을 때 적어 달라고 할 것'이다
  const cards: Card[] = useMemo(() => (hasQuote ? api.cards : compare(state.items, NO_QUOTE, state.cond).filter((c) => !c.id.startsWith("unread-"))), [hasQuote, api.cards, state.items, state.cond]);
  // 점검 에이전트를 꺼도 규칙 기준선이 짐을 나눈다 — 장면의 운반은 남기고 상태만 '꺼짐'으로 보인다
  const steps = AGENTS.filter((a) => isOn(a.id, state.agents) || a.id === "inspector").map((a) => a.id);
  const plan = useMemo(() => planOf(cards, steps), [cards, steps.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const geo = useMemo(() => geoOf(state.cond.from), [state.cond.from]);
  const sig = `${q?.id ?? "pre"}|${cards.map((c) => `${c.id}:${c.status}`).join(",")}|${steps.join(",")}|${geo.floors}${geo.lift}`;
  const clock = useClock(sig, plan.total, !!live, nonce);
  const frame = frameAt(plan, geo, clock.t, q?.dropped.length ?? 0);
  const done = !live && !clock.playing;
  const rep = useMemo(() => Object.fromEntries(reports(state, q, cards).map((r) => [r.id, r])), [state, q, cards]);

  const loaded = cards.filter((c) => c.rule === "품목" && c.status === "명시됨");
  const open = cards.filter(isOpen);
  const asks = open.filter((c) => c.ask);
  const found = cards.filter((c) => c.id.startsWith("ai-"));
  const request = !asks.length ? "" : hasQuote ? composeRequest(asks, q!.draft!) : composeRequest(asks, NO_QUOTE).replace("보내 주신 견적과 관련해 계약 전에 몇 가지 확인 부탁드립니다.", "견적을 부탁드리며, 아래 내용을 견적서에 함께 적어 주세요.");
  const ratio = hasQuote ? depositRatio(q!.draft!.totalAmount, q!.draft!.deposit) : null;
  const runs = state.quotes.flatMap((x) => x.runs);

  // 말풍선 — 실제 산출물에서 만든다 (지어낸 진행 없음)
  const sec = (ms: number) => `${(ms / 1000).toFixed(1)}초`;
  const say: Partial<Record<Actor | "end", string>> = {
    intake: live === "intake" ? `문장을 로컬 AI로 읽는 중 · ${sec(liveMs)}` : `${fl(state.cond.from.floor)} · 엘베 ${state.cond.from.elevator} → ${fl(state.cond.to.floor)} · 엘베 ${state.cond.to.elevator}`,
    itemlist: `짐 ${plan.boxes.length}개를 꺼내 현관 앞에 내놓기`,
    reader: live === "reader" ? `견적서를 로컬 AI로 읽는 중 · ${sec(liveMs)}` : hasQuote ? `${q!.draft!.company ?? q!.label} 견적서 읽음${q!.reader?.ms ? ` · ${sec(q!.reader.ms)}` : ""}` : "견적서가 없어요 — 붙여 넣으면 읽어요",
    verifier: !hasQuote ? "대조할 견적서 원문이 없음" : q!.dropped.length ? `원문에 없는 값 ${q!.dropped.length}개 버림` : "AI가 읽은 값 모두 원문에서 확인",
    inspector: live === "inspector" ? `내 조건과 견적을 겹쳐 보는 중 · 도구 호출 · ${sec(liveMs)}`
      : frame.current ? `${frame.current.card.title}: ${frame.current.card.status}${frame.current.card.by ? " (에이전트 판정)" : ""} → ${frame.current.to === "truck" ? "트럭에 싣기" : "멈춤선에 두기"}`
      : frame.posted ? `질문 ${frame.posted}개 게시${found.length ? ` · 규칙이 못 본 위험 ${found.length}개 찾음` : ""}`
      : !inspectorOn || !inspected ? "규칙 기준선으로 작업 조건·추가비 표지 점검" : "작업 조건·추가비 표지 점검",
    replycheck: runs.length ? `업체 답변 ${runs.length}회 점검 · 승인 기다림` : "업체 답변을 기다리는 중",
    human: plan.later.some(Boolean) ? `승인한 답변 ${plan.later.filter(Boolean).length}개 반영 → 트럭으로` : open.length ? "아직 승인할 답변 없음" : "확인 남은 짐 없음",
    end: !cards.length ? "옮길 짐을 적으면 점검을 시작해요" : !hasQuote ? `견적 전 · 견적 받을 때 적어 달라고 할 것 ${open.length}개` : open.length ? `실린 짐 ${loaded.length} · 확인 남음 ${open.length} — 계약금 전에 물어보세요` : "모든 항목이 견적에 명시됨",
  };

  const stateOf = (id: AgentId): AgentState => {
    if (!isOn(id, state.agents)) return "꺼짐";
    if (live === id || busy.includes(id)) return "작동 중";
    if (live) return AGENTS.findIndex((a) => a.id === id) < AGENTS.findIndex((a) => a.id === live) ? "완료" : "대기";
    const s = frame.state(id);
    return s === "완료" && rep[id]?.outcome === "입력 없음" ? "입력 없음" : s;
  };
  // 장면 속 사람은 실행 흐름 카드와 같은 상태 (입력 없음은 일 없이 서 있는 것으로)
  const figState = (id: AgentId) => { const s = stateOf(id); return s === "입력 없음" ? "대기" as const : s; };
  const humanState: AgentState = !plan.later.some(Boolean) && frame.state("human") === "완료" ? "입력 없음" : frame.state("human");

  /** 점검 실행: 바뀐 입력만 실제 모델로 읽고(조건 → 견적서), 끝나면 장면을 처음부터 재생한다 */
  async function run() {
    const msgs: string[] = [];
    setNotes([]);
    const text = sentence.trim();
    if (text.length >= 2 && (text !== state.intake.sentence || !state.started)) {
      if (state.agents.intake) {
        setLive("intake");
        try {
          const r = await agentPost<IntakeResult & { model: string; ms: number }>("intake", "/api/intake", { text });
          update((s) => ({
            started: true,
            intake: { ...s.intake, sentence: text, houseType: r.houseType !== "모름" ? r.houseType : s.intake.houseType, parsed: { model: r.model, ms: r.ms, dropped: r.dropped, at: new Date().toISOString() } },
            cond: r.cond,
            // 문장에서 읽은 짐 + '짐·조건'에서 직접 넣은 짐(같은 이름 제외). 후보는 새로 놓는다
            items: [...r.items, ...s.items.filter((i) => !i.pending && !r.items.some((x) => canonical(x.name) === canonical(i.name))), ...(s.agents.itemlist ? candidates(r.houseType, [...r.items, ...s.items.filter((i) => !i.pending)]) : [])],
          }));
          if (r.dropped.length) msgs.push(`문장에서 확인되지 않아 비운 값: ${r.dropped.join(" · ")}`);
        } catch (e) { msgs.push(`조건 해석 실패 — ${(e as Error).message} '짐·조건'에서 직접 고를 수 있어요.`); update({ started: true, intake: { ...state.intake, sentence: text } }); }
      } else { update({ started: true, intake: { ...state.intake, sentence: text } }); msgs.push("조건 해석관이 꺼져 있어 문장을 읽지 않았어요. '짐·조건'에서 고르세요."); }
    } else if (!state.started) update({ started: true });

    const qt = quoteText.trim();
    if (qt.length >= 10 && (!q || !q.draft || qt !== q.quoteText.trim())) {
      // 이미 읽은 견적과 다른 글이면 새 견적으로 추가한다 — 앞 견적의 읽은 값·승인한 답변을 덮어쓰지 않는다
      let id = q && !q.draft ? q.id : undefined;
      if (!id) {
        if (state.quotes.length >= 5) { msgs.push("견적은 5건까지 담을 수 있어요. '견적·업체'에서 하나를 지운 뒤 다시 해 주세요."); setLive(null); setNotes(msgs); setNonce((n) => n + 1); return; }
        const used = new Set(state.quotes.map((x) => x.label));
        const n = newQuote([0, 1, 2, 3, 4].find((i) => !used.has(`견적 ${"ABCDE"[i]}`)) ?? state.quotes.length);
        id = n.id;
        update((s) => ({ quotes: [...s.quotes, n], active: n.id }));
        if (q?.draft) msgs.push(`다른 견적서라 ${n.label}로 새로 담았어요. 앞 견적과는 '견적·업체'에서 나란히 볼 수 있어요.`);
      }
      if (state.agents.reader) {
        setLive("reader");
        const ok = await onRead(id, qt);
        // 가상 사례 견적은 모델 연결이 없어도 미리 만든 초안을 같은 원문 대조에 통과시켜 보여 준다 (그 사실을 표시)
        if (!ok && qt === SAMPLE_QUOTE_TEXT.trim()) {
          const v = verifyDraft(SAMPLE_QUOTE_TEXT, QUOTE_DRAFT);
          updateQuote(id, { quoteText: SAMPLE_QUOTE_TEXT, draft: v.draft, dropped: v.dropped, reader: { model: "미리 만든 초안 (모델 읽기 실패)", ms: 0 } });
          msgs.push("로컬 모델로 읽지 못해 미리 만든 초안을 원문 대조에 통과시켜 썼어요.");
        } else if (!ok) msgs.push("견적서 읽기에 실패했어요. '견적·업체'에서 다시 읽거나 직접 적을 수 있어요.");
      } else {
        updateQuote(id, { quoteText: qt, draft: q?.draft ?? NO_QUOTE, reader: { model: "직접 입력", ms: 0 } });
        msgs.push("견적 판독관이 꺼져 있어 '견적·업체'에서 항목을 직접 적어 주세요.");
      }
    }
    setLive(null);
    setNotes(msgs);
    setNonce((n) => n + 1); // 같은 결과여도 처음부터 다시 재생
    if (isOn("inspector", state.agents)) setWantInspect(true); // 읽은 결과가 상태에 들어간 뒤 점검 에이전트를 부른다 (아래 효과)
  }

  // 점검 에이전트 — 견적을 읽은 뒤, 지금 상태의 짐·조건·견적으로 부른다. 같은 입력이면 다시 부르지 않는다
  useEffect(() => {
    if (!wantInspect || live) return;
    setWantInspect(false);
    if (!q?.draft || !needInspect) return;
    const id = q.id;
    (async () => {
      setLive("inspector");
      try {
        const r = await agentPost<InspectRun>("inspector", "/api/inspect", { items: state.items, cond: state.cond, draft: q.draft, quoteText: q.quoteText });
        // 판정 없이 실패한 점검은 저장하지 않는다 — 다시 시도할 수 있게 (Sonnet B012 리뷰 #3)
        if (r.findings.length) updateQuote(id, { inspection: r });
        if (r.stopped !== "finished") setNotes((n) => [...n, `점검 에이전트: ${r.note}${r.findings.length ? "" : " '에이전트 점검 시작'으로 다시 시도할 수 있어요."}`]);
      } catch (e) {
        setNotes((n) => [...n, `점검 에이전트 호출 실패 — ${(e as Error).message} 규칙 기준선(기본 항목)으로 보여 줍니다.`]);
      }
      setLive(null);
      setNonce((n) => n + 1);
    })();
  }, [wantInspect, live, q?.draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const fillSample = () => { setSentence(SAMPLE_SENTENCE); setQuoteText(SAMPLE_QUOTE_TEXT); };
  async function copy() { try { await navigator.clipboard.writeText(request); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* 무시 */ } }
  const changed = sentence.trim() !== state.intake.sentence || quoteText.trim() !== (q?.quoteText ?? "").trim() || !state.started || needInspect;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">이삿짐 점검</div>
          <h1>조건과 견적서를 넣으면, 점검 에이전트가 내 짐을 하나씩 견적과 맞대어 봅니다</h1>
          <p>에이전트가 내 집 조건(층·엘리베이터·큰 짐)을 겹쳐 보고 당일 추가 비용이 생길 지점을 찾습니다. 견적서가 덮는 짐만 트럭에 실리고, 나머지는 멈춤선에서 업체에 보낼 질문을 받습니다.</p>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-body inputbar">
          <div className="form-stack">
            <label className="field-label" htmlFor="in-sentence">이사 조건 한 줄 <span className="hint">· 01 조건 해석관(AI)</span></label>
            <textarea id="in-sentence" value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder={`예) ${SAMPLE_SENTENCE}`} />
          </div>
          <div className="form-stack">
            <label className="field-label" htmlFor="in-quote">받은 견적서 <span className="hint">· 03 견적 판독관(AI) · 없으면 비워 두기</span></label>
            <textarea id="in-quote" value={quoteText} onChange={(e) => setQuoteText(e.target.value)} placeholder="문자·카톡·앱 화면의 견적 글을 그대로 붙여 넣기" />
          </div>
          <div className="form-stack run-col">
            <button className="btn" onClick={run} disabled={!!live || !changed || (!sentence.trim() && !quoteText.trim())}>
              {live ? <><Loader2 size={14} className="spin" />{AGENT[live].name} 작업 중…</> : <><Sparkles size={14} />에이전트 점검 시작</>}
            </button>
            {!sentence && !quoteText && <button className="btn ghost" onClick={fillSample}>가상 사례 넣기</button>}
            {!changed && !live && <span className="hint">입력 그대로 점검했어요. 고치면 바뀐 부분만 다시 읽습니다.</span>}
            {needInspect && !live && state.started && <span className="hint">{ins ? "짐·조건이 바뀌어 점검 에이전트가 다시 봐야 해요." : "견적은 읽었고, 점검 에이전트가 아직 보지 않았어요."}</span>}
            <span className="hint">입력은 이 브라우저 탭에만 저장됩니다.</span>
            {!ollama && <span className="hint">로컬 AI(Ollama)에 연결되지 않았어요. 가상 사례 견적은 미리 만든 초안으로 보여 줍니다.</span>}
          </div>
        </div>
        {((state.intake.parsed && !live) || notes.length > 0) && (
          <div className="panel-body" style={{ borderTop: "1px solid var(--line)", paddingTop: 10, paddingBottom: 10 }}>
            {state.intake.parsed && !live && (
              <div className="chips-line" style={{ margin: 0, alignItems: "center" }}>
                <span className="hint">조건 해석 결과</span>
                <span className="chip st-plain">출발 {fl(state.cond.from.floor)} · 엘베 {state.cond.from.elevator}</span>
                <span className="chip st-plain">도착 {fl(state.cond.to.floor)} · 엘베 {state.cond.to.elevator}</span>
                <span className="chip st-plain">짐 {state.items.filter((i) => !i.pending && i.move).length}종</span>
                <a className="hint" href="#/items">고치기</a>
              </div>
            )}
            {notes.map((n) => <div key={n} className="warn">{n}</div>)}
          </div>
        )}
      </section>

      <section className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-head"><h2>이삿짐 운반 장면</h2><span className="sub">상자 1개 = 짐 1종 · 위쪽 표지 = 작업 조건·추가비</span>
          <div className="right">
            {clock.playing ? <button className="btn ghost sm" onClick={clock.skip}><SkipForward size={13} />건너뛰기</button>
              : !live && cards.length > 0 && <button className="btn ghost sm" onClick={() => setNonce((n) => n + 1)}><RotateCcw size={13} />다시 보기</button>}
            <span className="sr-only" aria-live="polite">{live ? `${AGENT[live].name} 작업 중` : frame.active && frame.active !== "human" ? `${AGENT[frame.active].name} 작업 중` : clock.playing ? "" : "점검 끝"}</span>
          </div>
        </div>
        <div className="panel-body" style={{ padding: 12 }}>
          <div className="ms-wrap">
            <MoveScene plan={plan} geo={geo} frame={frame} stateOf={figState} live={live} say={say}
              fromLabel={state.intake.parsed || state.cond.from.floor !== null ? `${geo.label} · 엘베 ${state.cond.from.elevator}` : ""}
              selectedId={selected} onSelect={(id) => { setSelected(id); setTab("calc"); }} />
          </div>
          <div className="legend" style={{ marginTop: 10 }}>
            <span><b>✓ 명시됨</b> 트럭에 실림</span><span><b>? 미확인</b> 견적서에 없음</span>
            <span><b>△ 모호</b> "현장 협의"·"별도"</span><span><b>⌀ 판독 불가</b></span>
            <span><b className="dot-ai">●</b> AI <b className="dot-code">●</b> 코드 · 안테나 = 도구를 쓰는 AI 에이전트 · 머리 위 숫자 = 실행 순서</span>
          </div>
        </div>
      </section>
      <section className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-head"><h2>실행 흐름</h2><span className="sub">판단은 도구를 쓰는 AI 에이전트가, 원문 대조는 코드가, 반영 승인은 사람이 · 상자의 스위치로 끄고 켭니다</span></div>
        <div className="panel-body flow">
          <div className="flow-row">
            {AGENTS.filter((a) => a.main).map((a) => <Step key={a.id} id={a.id} state={stateOf(a.id)} out={stateOf(a.id) === "대기" ? "차례를 기다림" : rep[a.id]?.output ?? ""} onToggle={onToggle} on={isOn(a.id, state.agents)} />)}
            <div className="step human" data-state={humanState}>
              <div className="step-meta"><span>끝 · 사람</span><span className="st">{humanState === "입력 없음" ? "답변 없음" : humanState}</span></div>
              <b>나 (승인)</b>
              <span className="out">답변 반영·계약금 송금은 사람만 합니다{plan.later.some(Boolean) ? ` · 승인 ${plan.later.filter(Boolean).length}건` : ""}</span>
            </div>
          </div>
          <div className="flow-label">보조 역할</div>
          <div className="flow-row side">
            {AGENTS.filter((a) => !a.main).map((a) => <Step key={a.id} id={a.id} state={stateOf(a.id)} out={stateOf(a.id) === "대기" ? "차례를 기다림" : rep[a.id]?.output ?? ""} onToggle={onToggle} on={isOn(a.id, state.agents)} />)}
          </div>
        </div>
      </section>

      <div className="resultgrid">
        <section className="panel result">
          <div className="panel-head"><h2>견적 점검 결과</h2><span className="sub">{hasQuote ? `${q!.label} · ${q!.draft!.company ?? "업체명 없음"}` : "아직 견적서 없음 — 견적을 받을 때 적어 달라고 할 것"}</span></div>
          {!done ? <div className="panel-body hint">{live ? `${AGENT[live].name}가 로컬 모델로 읽는 중이에요…` : "에이전트들이 짐을 옮기는 중이에요. 끝나면 결과가 나옵니다."}</div> : (
            <div className="panel-body">
              {hasQuote && (
                <div className="result-tiles">
                  <div><span>견적 총액</span><b>{q!.draft!.totalAmount !== null ? won(q!.draft!.totalAmount) : "적혀 있지 않음"}</b><small>견적서 원문에서 확인된 값</small></div>
                  <div><span>계약금</span><b>{q!.draft!.deposit !== null ? won(q!.draft!.deposit) : "적혀 있지 않음"}</b><small>{ratio ? `총액의 ${Math.round(ratio.ratio * 100)}%${ratio.over ? " · 표준약관 10% 초과" : ""}` : "비율 계산 불가"}</small></div>
                  <div className={open.length ? "warn-tile" : ""}><span>확인 남음</span><b>{open.length}개</b><small>멈춤선의 짐·조건</small></div>
                </div>
              )}
              {hasQuote && (
                <div className={`agent-line${inspected && ins!.findings.length ? "" : " base"}`}>
                  <Bot size={15} />
                  {!inspectorOn ? <span>점검 에이전트가 꺼져 있어 <b>기본 항목만</b> 규칙 기준선으로 점검했어요.</span>
                    : !inspected ? <span>점검 에이전트 결과가 아직 없어 <b>기본 항목만</b> 규칙 기준선으로 보여 줘요.</span>
                    : !ins!.findings.length ? <span>점검 에이전트가 판정을 내지 못해 <b>기본 항목만</b> 규칙 기준선으로 보여 줘요. ({ins!.note})</span>
                    : <span>점검 에이전트가 도구를 {ins!.steps.length}번 불러 <b>{ins!.findings.filter((f) => !f.isNew).length}개 항목을 판정</b>하고{found.length ? <>, 규칙이 못 본 위험 <b>{found.length}개</b>를 찾았어요 ({found.map((c) => c.title).join(" · ")} — AI 추론 · 확인 필요)</> : " 새 위험은 찾지 못했어요"}. 모든 근거 문장은 원문 검증관을 통과했습니다.</span>}
                </div>
              )}
              <div className="result-row"><span className="lbl">트럭에 실린 짐 {loaded.length}</span>
                <span className="chips-line">{loaded.length ? loaded.map((c) => <button key={c.id} className="chip st-ok" onClick={() => setSelected(c.id)}>✓ {c.title}{c.answered ? " (승인한 답변)" : ""}</button>) : <span className="hint">아직 없음</span>}</span></div>
              <div className="result-row"><span className="lbl">멈춤선 {open.length}</span>
                <span className="chips-line">{open.length ? open.map((c) => <button key={c.id} className={`chip ${c.status === "조건 모호" ? "st-vague" : c.status === "판독 불가" ? "st-unread" : "st-unknown"}`} onClick={() => { setSelected(c.id); setTab("calc"); }}>{c.status === "조건 모호" ? "△" : c.status === "판독 불가" ? "⌀" : "?"} {c.title}</button>) : <span className="hint">없음</span>}</span></div>
              <p className="next">{!cards.length ? "옮길 짐을 적거나 '짐·조건'에서 고르면 점검이 시작돼요."
                : !hasQuote ? `업체 2~3곳에 견적을 받을 때 아래 질문 ${asks.length}개를 함께 보내 견적서에 적어 달라고 하세요.`
                : open.length ? `계약금을 보내기 전에 ${q!.draft!.company ?? "업체"}에 ${asks.length}가지를 물어보세요. 답을 받으면 '견적·업체'에 붙여 넣어 점검합니다.`
                : "견적서에 모두 명시됐어요. 이 내용이 계약서에도 적혔는지 '계약·서류'에서 확인하세요."}</p>
              <div className="row wrap" style={{ gap: 8 }}>
                {request && <button className="btn" onClick={copy}><ClipboardCopy size={14} />{copied ? "복사했어요" : hasQuote ? "업체에 보낼 질문 복사" : "견적 요청 문장 복사"}</button>}
                {hasQuote && <a className="btn ghost" href="#/quotes">답변 점검하러 가기<ArrowRight size={14} /></a>}
                <a className="btn ghost" href="#/graph">근거 그래프</a>
              </div>
              <p className="hint" style={{ margin: "10px 0 0" }}>가격을 새로 계산하지 않습니다. 금액은 견적서 원문에서 확인된 값만 보여 줍니다.</p>
            </div>
          )}
        </section>

        <aside className="panel">
          <div className="panel-head">
            <div className="tabs">
              <button className={`tab ${tab === "calc" ? "on" : ""}`} onClick={() => setTab("calc")}>산정표 {cards.length}</button>
              <button className={`tab ${tab === "ask" ? "on" : ""}`} onClick={() => setTab("ask")}>물을 질문 {asks.length}</button>
              <button className={`tab ${tab === "report" ? "on" : ""}`} onClick={() => setTab("report")}>작업 보고</button>
            </div>
          </div>
          <div className="panel-body">
            {tab === "calc" && (
              <ul className="mini-list">
                {cards.map((c) => (
                  <li key={c.id} className={selected === c.id ? "on" : ""} onClick={() => setSelected(selected === c.id ? null : c.id)} style={{ cursor: "pointer" }}>
                    <span className="grow"><b>{c.title}</b>{c.by && <span className={`by-chip${c.id.startsWith("ai-") ? " new" : ""}`}>{c.id.startsWith("ai-") ? "AI 추론" : "에이전트"}</span>}<br /><span className="hint">{selected === c.id ? c.why : c.mine !== "—" ? c.mine : c.why.slice(0, 40)}</span>
                      {selected === c.id && c.evidence[0] && <><br /><q className="src-of">{c.evidence[0]}</q></>}</span>
                    <span className="calc-row"><StatusChip s={c.status} /><CostChip c={c.cost} /></span>
                  </li>
                ))}
                {!cards.length && <li className="hint">짐이나 조건을 입력하면 확인 항목이 생깁니다.</li>}
              </ul>
            )}
            {tab === "ask" && (
              <ol style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>{asks.map((c) => <li key={c.id} style={{ marginBottom: 6 }}>{c.ask} <span className="hint">— {c.by ? "점검 에이전트" : "규칙 기준선"}</span></li>)}{!asks.length && <li className="hint">물을 질문이 없어요.</li>}</ol>
            )}
            {tab === "report" && (
              <ol className="mini-list report">
                {AGENTS.map((a) => (
                  <li key={a.id}>
                    <span className="grow"><b>{a.step} {a.name}</b> <span className="kind-chip">{a.kind}</span><br /><span className="hint">{rep[a.id]?.output}</span>
                      {rep[a.id]?.source !== "—" && <><br /><span className="src-of">근거·출처: {rep[a.id]?.source}</span></>}
                      {a.id === "inspector" && inspectorOn && inspected && <ToolLog steps={ins!.steps} />}</span>
                    <span className="hint">{stateOf(a.id)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function Step({ id, state, out, on, onToggle }: { id: AgentId; state: AgentState; out: string; on: boolean; onToggle: (id: AgentId) => void }) {
  const a = AGENT[id];
  return (
    <div className="step" data-state={state} title={`${a.does}\n끄면: ${a.off}`}>
      <div className="step-meta"><span>{a.step} · <span className={`actor ${a.kind !== "코드" ? "ai" : ""}`}>{a.kind === "AI 에이전트" ? "에이전트" : a.kind}</span></span><span className="st">{state}</span></div>
      <b>{a.name}</b>
      {a.tools && <span className="tools">도구: {a.tools.join(" · ")}</span>}
      <span className="out" style={{ paddingRight: 34 }}>{out}</span>
      {a.locked ? <Lock size={13} className="lock" aria-label="끌 수 없음" />
        : <button className="switch" role="switch" aria-checked={on} aria-label={`${a.name} ${on ? "끄기" : "켜기"}`} onClick={() => onToggle(id)} />}
    </div>
  );
}

// 점검 에이전트의 실제 도구 호출 기록 (모델이 부른 순서 그대로)
const TOOL_NAME: Record<string, string> = { get_case: "사례 보기", find_in_quote: "견적 문장 찾기", submit_findings: "판정 제출", add_risks: "새 위험 추가", finish: "마침" };
function ToolLog({ steps }: { steps: InspectRun["steps"] }) {
  const res = (o: unknown) => {
    const r = (o as { results?: { accepted: boolean }[] })?.results;
    return r ? ` · 수락 ${r.filter((x) => x.accepted).length} / 거절 ${r.filter((x) => !x.accepted).length}` : "";
  };
  return (
    <ol className="tool-log">
      {steps.map((s) => <li key={s.n}><code>{TOOL_NAME[s.tool] ?? s.tool}</code>{res(s.output)}{s.ms ? <span className="hint"> · {(s.ms / 1000).toFixed(1)}초</span> : null}</li>)}
    </ol>
  );
}
