// 사고 대응 에이전트의 근거 목록 · 도구 · 검증기 (B013). 브라우저에서도 쓰므로 Ollama·node 모듈을 import하지 않는다.
// 이사 당일 추가요금 요구, 이사 거부·계약금, 파손, 분실이 생겼을 때 — 에이전트가 상황을 읽고 근거를 골라 대응 순서·증거·업체에 보낼 문자를 만든다.
// 코드는 판단하지 않고 지킨다: 근거는 아래 목록(공식 출처로 확인한 것)에서만 고르고, 기한은 그 근거에 적힌 것만,
// 금액은 사용자의 설명·기록에 있는 것만 쓸 수 있다. 위법·배상 여부를 단정하는 표현은 받지 않는다.
import { amountsIn } from "./verify.ts";
import { BASES, type Basis } from "./incident-bases.ts";

export { BASES, type Basis };
export const SITUATIONS = ["당일 추가요금", "이사 거부·계약금", "파손", "분실"] as const;
export type Situation = (typeof SITUATIONS)[number];

export interface PlanStep { action: string; basis: string[]; when: string }
export interface IncidentPlan { summary: string; steps: PlanStep[]; evidence: string[]; message: string; escalate: string }
export interface IncidentStep { n: number; tool: string; input: unknown; output: unknown; ms: number }
export interface IncidentRun { situation: Situation; story: string; model: string; ms: number; steps: IncidentStep[]; plan: IncidentPlan | null; stopped: "finished" | "limit" | "error"; note: string; at: string }
export interface IncidentInput { situation: Situation; story: string; records: string[] }

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const KNUM: Record<string, string> = { 한: "1", 두: "2", 세: "3", 네: "4", 일: "1", 이: "2", 삼: "3", 사: "4", 오: "5", 육: "6" };
/** 글 속의 기간 표현을 '30일'·'2주'·'1개월'·'1년'으로 모은다 (달=개월, 일주=1주) */
export function periodsIn(t: string): string[] {
  const out: string[] = [];
  for (const m of t.matchAll(/(?<!월\s?)(?<![\d.])(\d+|한|두|세|네)\s*(일|주일|주|개월|달|년)(?![가-힣]*요일)/g)) {
    const n = KNUM[m[1]] ?? m[1];
    const u = m[2] === "주일" ? "주" : m[2] === "달" ? "개월" : m[2];
    if (u === "일" && /^(한|두|세|네)$/.test(m[1])) continue; // '한 일' 같은 말은 기간이 아니다
    out.push(`${n}${u}`);
  }
  return out;
}
// 상황별 핵심 근거 (묶음 안에서 하나 이상)
const REQUIRED: Record<Situation, string[][]> = {
  "당일 추가요금": [["t8-2", "t8-3", "t5-3"], ["k-evidence"]],
  "이사 거부·계약금": [["t9-2"], ["k-evidence"]],
  파손: [["t18"], ["t14"]],
  분실: [["t18"], ["t14"]],
};
// 법률 판단·결과 보장처럼 들리는 표현 — 공식 기준을 인용해 '확인·요청'하는 말로 바꿔야 한다
const VERDICT = /불\s*법|위\s*법|사기|고소|형사|처벌|소송|간주|것으로\s*보입니다|배상\s*책임이\s*있|과실이\s*있|책임을\s*(져야|진다|지십시오|지셔야)|인정해야|인정하셔야|금지됩니다|금지되어\s*있습니다|청구할\s*수\s*없|요구할\s*수\s*없|하셔야\s*합니다|부당합니다|불가능합니다|위반입니다|어긋납니다|반드시\s*(배상|보상|환불)|(배상|보상|환불|돌려)\s*받을\s*수\s*있|법적으로\s*(당연|확실)|이길\s*수/;

export function makeIncidentTools({ situation, story, records }: IncidentInput) {
  const known = [story, ...records].join("\n");
  let plan: IncidentPlan | null = null;
  const pick = (b: Basis) => ({ basis_id: b.id, title: b.title, text: b.text, deadline: b.deadline ?? null, use: b.use, source: b.source });

  const tools = {
    get plan() { return plan; },
    get_situation: () => ({
      situation, story,
      records: records.map((r, i) => `[R${i + 1}] ${r}`),
      note: "records는 계약 전에 이 서비스에서 확인한 기록이다. 증거로 쓸 수 있다.",
    }),
    find_basis: ({ keywords }: { keywords: string[] }) => {
      const kws = keywords.map(String).filter(Boolean);
      // 그 상황의 근거를 모두 준다 — 검색어에 맞는 것을 앞에 (검색어로 거르면 필수 근거를 못 보고 막힌다: B013 실측)
      const mine = BASES.filter((b) => b.situations.includes(situation));
      const hit = (b: Basis) => kws.some((k) => `${b.title} ${b.text}`.includes(k));
      return { bases: [...mine.filter(hit), ...mine.filter((b) => !hit(b))].map(pick), required: REQUIRED[situation] };
    },
    submit_plan: (p: Record<string, unknown>) => {
      const reasons: string[] = [];
      const fixes: string[] = []; // 코드가 바로잡은 인용 표기 (도구 결과로 돌려준다)
      const summary = norm(String(p?.summary ?? ""));
      const message = String(p?.message ?? "").trim();
      const escalate = norm(String(p?.escalate ?? ""));
      const evidence = (Array.isArray(p?.evidence) ? p.evidence : []).map((e) => norm(String(e))).filter(Boolean);
      const steps: PlanStep[] = (Array.isArray(p?.steps) ? p.steps : []).map((s: Record<string, unknown>) => ({
        action: norm(String(s?.action ?? "")),
        basis: (Array.isArray(s?.basis_ids) ? s.basis_ids : []).map((x) => String(x).trim()),
        when: norm(String(s?.when ?? "")),
      }));
      if (summary.length < 8 || summary.length > 200) reasons.push("summary는 상황 요약 한두 문장(200자 이내)");
      if (steps.length < 2 || steps.length > 7) reasons.push("steps는 2~7단계");
      steps.forEach((s, i) => {
        if (s.action.length < 4) reasons.push(`steps[${i}] action이 비었습니다`);
        const bad = s.basis.filter((id) => !BASES.some((b) => b.id === id && b.situations.includes(situation)));
        if (!s.basis.length) reasons.push(`steps[${i}]에 근거(basis_ids)가 없습니다. find_basis의 basis_id를 쓰세요`);
        if (bad.length) reasons.push(`steps[${i}]의 근거 ${bad.join(", ")}는 이 상황의 근거가 아닙니다 (find_basis가 준 basis_id만)`);
        // 기한은 인용한 근거에 적힌 기한만 (일·주·개월·달·년, 숫자 단위로 비교 — '3일'이 '30일'에 걸리지 않게)
        const allowed = new Set(s.basis.flatMap((id) => { const b = BASES.find((x) => x.id === id); return periodsIn(b?.deadline ?? ""); }));
        for (const d of periodsIn(`${s.when} ${s.action}`).filter((d) => !allowed.has(d))) {
          // 그 기한이 이 상황의 다른 근거의 기한으로 정확히 있으면, 인용 표기만 코드가 바로잡고 기록한다 (내용은 바꾸지 않는다)
          const owner = BASES.find((b) => b.situations.includes(situation) && periodsIn(b.deadline ?? "").includes(d));
          if (owner) { s.basis.push(owner.id); fixes.push(`steps[${i}]의 '${d}' 기한에 근거 ${owner.id}를 붙임`); continue; }
          reasons.push(`steps[${i}]의 '${d}'는 근거에 없는 기한입니다 — 기한을 빼고 '바로'로 쓰세요`);
        }
      });
      if (evidence.length < 1 || evidence.length > 8) reasons.push("evidence는 챙길 증거 1~8개");
      if (message.length < 20 || message.length > 500) reasons.push("message는 업체에 보낼 문자(20~500자)");
      if (!/1372|한국소비자원|피해구제/.test(escalate)) reasons.push("escalate에는 1372 소비자상담센터·한국소비자원 피해구제 경로를 쓰세요 (근거 k-1372)");
      // 상황마다 빠뜨리면 안 되는 근거 — 에이전트가 고르되, 핵심 조항을 빼면 다시 쓰게 한다
      const cited = new Set(steps.flatMap((s) => s.basis));
      const need = REQUIRED[situation].filter((group) => !group.some((id) => cited.has(id)));
      if (need.length) reasons.push(`이 상황의 핵심 근거가 빠졌습니다: ${need.map((g) => g.join(" 또는 ")).join(", ")} — 해당 단계를 넣으세요`);
      if (new Set(steps.map((s) => s.action)).size < steps.length) reasons.push("같은 할 일을 반복하지 마세요");
      // 문자·요약·증거·상담 칸의 기한도 인용한 근거 안의 것만
      const citedPeriods = new Set(steps.flatMap((s) => s.basis).flatMap((id) => { const b = BASES.find((x) => x.id === id); return periodsIn(b?.deadline ?? ""); }));
      const strayP = periodsIn(`${summary} ${message} ${evidence.join(" ")} ${escalate}`).filter((d) => !citedPeriods.has(d));
      if (strayP.length) reasons.push(`summary·message·evidence·escalate의 기한 ${[...new Set(strayP)].join(", ")}은(는) 인용한 근거에 없습니다 — 빼세요`);
      const said = `${summary} ${message} ${steps.map((s) => `${s.action} ${s.when}`).join(" ")} ${evidence.join(" ")} ${escalate}`;
      // 어느 칸의 어느 문장인지 짚어 준다 — 위치를 모르면 소형 모델은 같은 계획을 되풀이한다 (B013 실측)
      const fields: [string, string][] = [["summary", summary], ["message", message], ["escalate", escalate], ...evidence.map((e, i): [string, string] => [`evidence[${i}]`, e]), ...steps.map((s, i): [string, string] => [`steps[${i}]`, `${s.action} ${s.when}`])];
      for (const [name, text] of fields) {
        const sentence = text.split(/(?<=[.!?。])\s+/).find((x) => VERDICT.test(x));
        if (sentence) reasons.push(`${name}의 "${sentence.slice(0, 80)}" — '${sentence.match(VERDICT)![0]}'는 법률 판단·결과 단정으로 들립니다. 이 문장을 지우거나 "…을 확인해 주시기 바랍니다", "…을 요청드립니다"처럼 바꾸세요`);
      }
      const madeUp = amountsIn(said).filter((n) => !amountsIn(known).includes(n));
      // amountsIn이 못 읽는 금액 표기(5천원, 오만원, 1.5만원)는 사용자 설명·기록에 글자 그대로 있을 때만
      const odd = [...said.matchAll(/(\d+(?:\.\d+)?\s*천\s*원|\d+\.\d+\s*만\s*원?|[일이삼사오육칠팔구십백]+\s*[만천]\s*원)/g)].map((m) => m[0]).filter((t) => !known.replace(/\s+/g, "").includes(t.replace(/\s+/g, "")));
      if (odd.length) reasons.push(`사용자 설명·기록에 없는 금액 표기: ${odd.join(", ")}`);
      if (madeUp.length) reasons.push(`사용자 설명·기록에 없는 금액: ${madeUp.map((n) => n.toLocaleString("ko-KR")).join(", ")}원`);
      if (reasons.length) return { accepted: false, reasons, fixes };
      plan = { summary, steps, evidence, message, escalate };
      return { accepted: true, fixes, next: "finish를 부르세요" };
    },
  };
  return tools;
}

/** 모델이 실패했을 때 — 계획은 만들지 않고, 그 상황의 근거 목록만 그대로 보여 준다 */
export const basesFor = (s: Situation) => BASES.filter((b) => b.situations.includes(s));
