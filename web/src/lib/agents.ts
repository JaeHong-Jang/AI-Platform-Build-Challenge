// 앱 안 역할 8개 (B012 에이전트 중심): 문제를 푸는 판단은 도구를 쓰는 AI 에이전트 둘이 맡고, 코드는 도구·안전장치로 일한다.
// 점검 에이전트 — 내 조건 조합에서 추가 비용 지점을 찾아 견적이 덮는지 판정하고 질문을 쓴다.
// 답변 에이전트 — 업체 답변이 확답인지 조건부인지 가리고, 모자라면 되물을 질문을 쓴다.
// 원문 검증관(TRITON의 증거 검증관)은 끌 수 없고, '명시됨'으로 올리는 반영은 사람이 승인한다.
export type AgentId = "intake" | "itemlist" | "reader" | "verifier" | "inspector" | "replycheck" | "responder" | "picker" | "contract" | "docguide";
export type AgentKind = "AI 에이전트" | "AI" | "코드";
export type AgentState = "작동 중" | "완료" | "대기" | "꺼짐" | "입력 없음";

export interface AgentDef {
  id: AgentId;
  step: string; // 실행 흐름 번호
  name: string;
  kind: AgentKind;
  model?: "reader" | "agent"; // ollama.ts READER_MODEL(ax4-light) / AGENT_MODEL(qwen3) — 배포 모델은 Claude Sonnet 5.5
  tools?: string[]; // 에이전트가 부르는 도구 (화면 표시용)
  locked?: boolean; // 끌 수 없음
  main: boolean; // 주 흐름(장면에 나옴) / 보조 역할
  does: string;
  off: string; // 끄면 무엇이 빠지는지 한 줄
}

export const AGENTS: AgentDef[] = [
  { id: "intake", step: "01", name: "조건 해석관", kind: "AI", model: "reader", main: true, does: "한 문장에서 층·엘리베이터·짐 이름을 읽습니다 (문장에 없는 값은 '모름')", off: "조건을 짐·조건 화면에서 직접 고릅니다" },
  { id: "itemlist", step: "02", name: "짐 목록관", kind: "코드", main: true, does: "옮길 짐을 꺼내 목록에 올립니다 (수량·부피 추정 없음)", off: "짐 후보 없이 직접 추가합니다" },
  { id: "reader", step: "03", name: "견적 판독관", kind: "AI", model: "reader", main: true, does: "붙여넣은 견적서를 항목으로 읽습니다", off: "견적 항목을 직접 입력합니다 (원문 확인 전까지 명시됨 불가)" },
  { id: "verifier", step: "04", name: "원문 검증관", kind: "코드", locked: true, main: true, does: "AI가 읽은 값과 AI가 낸 근거 문장을 원문과 대조해, 원문에 없는 값을 버립니다", off: "끌 수 없습니다" },
  { id: "inspector", step: "05", name: "점검 에이전트", kind: "AI 에이전트", model: "agent", main: true, tools: ["사례 보기", "견적 문장 찾기", "판정 제출", "새 위험 추가"],
    does: "내 조건을 겹쳐 보고(층·엘리베이터·큰 짐) 당일 추가 비용이 생길 지점을 찾아, 견적이 덮는지 근거 문장으로 가리고 업체에 보낼 질문을 씁니다", off: "규칙 기준선만으로 점검합니다 (기본 항목만)" },
  { id: "replycheck", step: "06", name: "답변 에이전트", kind: "AI 에이전트", model: "agent", main: true, tools: ["남은 항목 보기", "답변 문장 찾기", "갱신 후보 제출"],
    does: "업체 답변이 확답인지 조건부인지 가려 갱신 후보를 내고, 모자란 답에는 되물을 질문을 씁니다 (사람 승인 전 반영 없음)", off: "답변 문장을 직접 골라 반영합니다 (같은 검증기 통과 필요)" },
  { id: "responder", step: "07", name: "사고 대응 에이전트", kind: "AI 에이전트", model: "agent", main: false, tools: ["상황 보기", "근거 찾기", "대응 계획 제출"],
    does: "이사 당일 추가요금 요구·이사 거부·파손·분실이 생기면 계약 전 기록과 공식 근거로 대응 순서·증거·업체에 보낼 문자를 만듭니다 (법률 판단 없음)", off: "상황별 공식 근거 목록만 봅니다" },
  { id: "picker", step: "08", name: "견적 비교관", kind: "코드", main: false, does: "견적을 같은 항목으로 나란히 놓고 허가 목록과 상호를 대조합니다 (순위 없음)", off: "비교표 없이 견적을 하나씩 봅니다" },
  { id: "contract", step: "09", name: "계약 점검관", kind: "코드", main: false, does: "계약서 기재 항목(제5조)과 계약금 비율(제6조 10%)을 봅니다", off: "계약 서류 점검이 비어 있습니다" },
  { id: "docguide", step: "10", name: "서류 안내관", kind: "코드", main: false, does: "받아야 할 견적서·계약서 기재 항목을 놓습니다 (표준약관 제4·5조)", off: "서류 점검표가 비어 있습니다" },
];

export const AGENT = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<AgentId, AgentDef>;
export const ALL_ON = Object.fromEntries(AGENTS.map((a) => [a.id, true])) as Record<AgentId, boolean>;
/** 켜져 있는가 — 잠긴 역할은 저장 값과 상관없이 늘 켜짐 */
export const isOn = (id: AgentId, on: Record<AgentId, boolean>) => !!AGENT[id].locked || on[id] !== false;
