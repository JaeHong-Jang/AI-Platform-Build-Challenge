# B006 조사 — 사용자의 기존 공모전 웹 3종에서 이사 지킴이로 가져올 것 (Sonnet 조사)

범위: 세 저장소의 소스·문서만 읽음(node_modules·dist 제외, 코드 수정 없음). 경로는 모두 `/mnt/c/Users/User/Desktop/대학교/3학년/` 아래 상대경로. 실제 실행·빌드는 하지 않았으므로 "동작한다"는 문서·코드 근거까지만 말한다. 확인 못한 것은 `unknown`.

약칭: **M** = `AI Innovation 공모전/masdae-pass`, **T** = `TRITON`, **C** = `TTA 공모전/TTA-Service`(제품명 CAP2ALL).

## 0. 먼저 알아야 할 사실 (이사 지킴이 설계에 직접 영향)

1. 세 프로젝트 모두 **이미지 업로드·멀티모달 호출 코드가 없다.** M은 Ollama 텍스트 모델만 쓰고(`M/README.md:46` "사진·성적서 읽기(비전 모델)는 아직 없다"), T도 Ollama 텍스트(`T/apps/backend/court/llm.py:8`), C는 브라우저에서 live 호출 자체를 막아 놓았다(`C/src/agent/llm.ts:52-56`). 즉 사진 → 압축 → 업로드 → 비전 호출은 **새로 짜야** 하고, 가져올 수 있는 것은 그 앞뒤(JSON 계약·검증·재시도·폴백·UI)다.
2. **Anthropic/OpenAI SDK를 쓴 곳이 없다.** C의 `scripts/record-fixtures.mjs:103-139`만 `fetch`로 Anthropic Messages API(`anthropic-version: 2023-06-01`, 기본 모델 `claude-sonnet-5`)를 직접 호출한다. 서버 런타임 LLM 호출은 M(TypeScript `fetch`→Ollama), T(Python `urllib`→Ollama) 두 방식뿐.
3. **배포 경험은 정적 호스팅뿐.** M은 `VITE_SNAPSHOT=1` 정적 빌드(`M/README.md:16`, `M/frontend/vite.config.ts:8` `base:'./'`), C도 `base:'./'`로 하위 폴더 배포 가능(`C/vite.config.ts:16`, `C/README.md:82-89`), T는 로컬 단일 FastAPI 서버(`T/ARCHITECTURE.md` 전체 흐름, `T/tools/run.sh:13-19`). **Vercel 서버리스 함수(이사 지킴이 계획의 4.5MB 한도, 위키 §7)를 쓴 코드는 없다 → unknown.**
4. 사용자의 일관된 철학이 이사 지킴이 §6 "AI는 구조화, 판정은 규칙"과 정확히 일치한다: M은 "판정은 규칙이 한다. LLM은 … 읽기·요약만"(`M/README.md:5`), C는 "LLM 판단·생성 → 표준 검증 → 실패 시 재생성 → 3회 실패하면 원문 폴백"(`C/README.md` 요약 코드블록), T는 "AI 근거는 코드로 검증"(`T/ARCHITECTURE.md` 설계 근거). 새로 발명할 게 아니라 **이미 가진 패턴을 비전 입력에 옮기면 된다.**

---

## 1. masdae-pass (M) — "마대 통과증"

### 1.1 스택·구조·명령·배포
- 스택: backend = Node ≥22 + TypeScript(tsx 실행) + Fastify 5 + Vitest(`M/backend/package.json:6-24`); frontend = Vite 5 + React 18 + Tailwind 3 + react-router 6 + lucide-react + recharts + cytoscape(`M/frontend/package.json`). 공통 타입은 `shared/contracts.ts`를 양쪽이 alias로 import(`M/backend/vitest.config.ts:5`, `M/frontend/vite.config.ts:11-14`).
- 폴더: `harness/`(선언: config.json·에이전트 카드 md·금지 표현 json) · `shared/` · `backend/src/{api,harness,agents/<팀>/<에이전트>.ts,tools,rules,ontology,store}` · `frontend/src/{app,features/<화면>,shared/{api,ui,theme}}` · `data/` · `docs/`(`M/README.md:20-28`, `M/docs/ARCHITECTURE.md` 1절). **화면 1개 = 폴더 1개, 에이전트 1명 = 파일 1개**.
- 명령: `cd backend && npm install && npm start` / `npm test`, `cd frontend && npm run dev`, 공개용 `npm run snapshot` + `VITE_SNAPSHOT=1 npm run build`(`M/README.md:11-16`).
- 배포: 정적 스냅샷 재생. `client.ts`가 `live | snapshot | fixtures` 3모드(`M/frontend/src/shared/api/client.ts:1-11`)이며 모든 fetch가 이 파일 하나를 지난다.

### 1.2 LLM/AI 호출
- 제공사·SDK: Ollama 로컬 서버, SDK 없이 `fetch`(`M/backend/src/harness/llm/ollama.ts:34-42`). 모델 `ax4-light:q4_K_M`, 대체 모델 `qwen3:4b-…`, 타임아웃 120000ms(`M/harness/harness.config.json:4-11`). 주소·모델은 env(`OLLAMA_URL`, `OLLAMA_MODEL`)가 config를 덮어씀(`ollama.ts:15-16`).
- 인터페이스: `LLMClient { isAvailable(), chatJSON(system,user) }`(`ollama.ts:5-11`) 얇은 어댑터. 테스트에서 같은 모양의 목 주입(`M/backend/test/helpers.ts:23-38`). → 이사 지킴이 "모델 1개를 얇은 어댑터로 감싼다"(위키 §7)와 같은 설계.
- 구조화 출력: 스키마 강제 없음. `format:'json'` + `temperature:0`(`ollama.ts:38`) 후 **방어적 파서** `parseJSON`(실패 시 첫 `{`~마지막 `}` 재시도, 그래도 실패하면 null, `ollama.ts:50-61`), 그다음 필드별로 enum·존재 검사하며 걸러냄(예: `identifier.ts:73-85`, `facility-reader.ts:40-44`). zod 없음.
- 프롬프트 위치: 코드 안 상수(`summarize.ts:18`, `identifier.ts:59-68`, `facility-reader.ts:77-91`). 에이전트 "카드"만 `harness/agents/*.md`로 문서화(코드가 읽지는 않음 — config `card` 필드는 화면 표시용으로 보임, 확신 낮음).
- **재시도·폴백(가장 가져올 만함)**
  - 요약: LLM이 "주장 id만 고르게" 하고 문장은 코드가 원문 그대로 이어 붙임(`summarize.ts:1-3, 79`) → 게이트 실패 시 **문제 목록을 프롬프트에 붙여 재요청**(`maxRetries=1`, `harness.config.json:34`, `summarize.ts:92-113`) → 그래도 실패하면 템플릿 요약(`summarize.ts:115-117`). LLM 호출 예외는 즉시 break 후 템플릿(`summarize.ts:99-102`).
  - LLM 꺼짐·예외·JSON 깨짐이면 항상 규칙 결과로(`identifier.ts:83` `catch { /* 규칙으로 */ }`, `facility-reader.ts:20-28`). 화면에 "LLM 추출/규칙 추출" 배지로 출처를 표시(`M/frontend/src/features/intake/FreeTextParse.tsx:151`).
  - 에이전트 하나가 던져도 런 전체는 `status:'fail'` 결과로 이어감(`M/backend/src/harness/runner.ts:29-37`).
- **LLM 출력 원문 대조(핵심 자산)**: LLM이 낸 "인용"이 원문에 글자 그대로 있어야 채택(`verifyQuote`, `provenance-checker.ts:10`; `merge()` `facility-reader.ts:37-61`). LLM은 **규칙이 찾은 것을 빼지 못하고 더하기만** 가능. 대조 실패는 `rejected`로 기록 + 경고(`provenance-checker.ts:21-24`).
- 에이전트 루프/도구 호출: 오케스트레이터가 계획 제안 → 규칙이 검증·교정(`plan.ts:1`, `rulePlan` `plan.ts:40-49`) → 에이전트를 config 순서로 순차 실행(`runner.ts:59-72`) → 검증팀 3명이 주장 검사(`runner.ts:75-87`). LLM의 function calling/tool-use는 **없다**(에이전트는 일반 함수). 이사 지킴이에는 과함.
- 키 관리: 로컬 Ollama라 키 없음. env로 주소·모델만 덮음(`ollama.ts:15-16`).

### 1.3 업로드
없음. 입력은 폼 + 자유 서술 텍스트 2000자 절단(`M/backend/src/api/app.ts:36`).

### 1.4 UI 패턴
- 입력 단계: 한 페이지에 `FactoryStep → MaterialsStep → FreeTextParse` 세로 배치 + **하단 고정 실행 바**(`M/frontend/src/features/intake/index.tsx:33-50`, `fixed inset-x-0 bottom-0 … backdrop-blur`). wizard 라우팅은 없음.
- **"AI 제안은 사람이 눌러야 반영" 패턴**: 현재 값(취소선) → 제안 값(초록) diff 목록, 항목별 '반영' 버튼, 이미 직접 입력한 칸은 경고 아이콘 + "확인 후 반영", '모름 항목만 모두 반영' 일괄 버튼(`FreeTextParse.tsx:133-188`). → 이사 지킴이 "원문 옆에서 수정"과 동일한 철학.
- 모름 보존: 입력은 yes/no/unk 3값, 모름을 없음으로 바꾸지 않음(`M/docs/ARCHITECTURE.md` 원칙, `useIntakeForm.ts:95` 양은 '있음'일 때만). → 이사 지킴이 `명시됨/미확인/모호/판독불가` 상태와 호환.
- 상태 관리: 라이브러리 없이 `useState` 커스텀 훅(`useIntakeForm.ts`, `useRun.ts`), 숫자 칸은 문자열로 들고 있다 제출 때 변환(`useIntakeForm.ts:58-59,74-87`). 진행은 SSE(`app.ts:90-103`).
- 디자인 토큰: Tailwind 유틸 + `index.css`의 `@layer components`에 `.btn .btn-primary .btn-ghost .input .label`(`M/frontend/src/index.css:42-60`), 다크 `class` 모드, 첫 페인트 전 테마 확정 인라인 스크립트(`M/frontend/index.html:11-20`), 한글 `word-break: keep-all`(`index.css:10`), Pretendard.
- 복사 버튼: `navigator.clipboard` 실패 시 `execCommand('copy')` 폴백 + 1.8초 "복사했습니다" 토글(`M/frontend/src/shared/ui/CopyButton.tsx:1-26`).
- 모바일: 반응형 Tailwind(`sm:`/`lg:`), 390px 스크린샷 확인했다고 README가 주장(`M/README.md:42`). 사이드바 레이아웃이라 **모바일 우선 설계는 아님**.

### 1.5 테스트·검증
- Vitest 파일 9개(`M/backend/test/*.test.ts`), README는 "46개 통과(LLM 목)" 주장(`M/README.md:42`; 이번에 실행하지 않음). 실제 모델은 `RUN_OLLAMA=1`일 때만 도는 `live.test.ts`(`live.test.ts:1-8`, `describe.runIf`).
- 목 LLM은 시스템 프롬프트 문자열로 호출 종류를 구분하고 시도마다 다른 답을 줌(`helpers.ts:30-35`) → "재시도 후 통과/템플릿 폴백"을 결정적으로 테스트.
- 정직한 측정 문서: LLM 켬/끔 차이 0/9, 오답 53건을 검증이 전부 걸러냄 등(`M/README.md:43`, `M/docs/judge/reader_model_compare.md`).

### 1.6 습관
한 줄 명사형 주석, 파일 첫 줄에 의도 설명 주석(예: `summarize.ts:1-3`), 상수·정규식에 "왜" 주석(`wording-guard.ts:9`, `facility-reader.ts:21-22`), 금지 표현 정책을 JSON 파일로 분리(`M/harness/policies/forbidden-phrases.json`), 한국어 종결은 "~합니다/~입니다", "모름·추가 확인 필요·단정하지 않는다" 어휘.

---

## 2. TRITON (T) — "AI 법정"

### 2.1 스택·구조·명령·배포
- 스택: backend = Python ≥3.11 + uv + FastAPI + uvicorn + PyYAML(`T/apps/backend/pyproject.toml`); frontend = `ai-court-web` React 19 + Vite 8 + Tailwind 4(`@tailwindcss/vite`) + react-router 7 + **zustand 5** + vitest + playwright(`T/apps/frontend/package.json`).
- 구조: `apps/{backend/court(도메인, HTTP 모름), backend/app(FastAPI), frontend/src/{api,lib,ui,scene2d,features,console,pages}}`, `agents/`(역할 SKILL.md + ontology.yaml), `docs/{contracts,design-docs,product-specs,exec-plans,experiments}`, `tools/{run.sh,checks/}`, `.claude/{agents,skills,settings.json}`(`T/AGENTS.md:8-17`).
- **계층 규칙을 검사기가 강제**: `api ← lib ← ui·features ← console ← pages ← App`, "fetch는 `src/api`에서만"(`T/ARCHITECTURE.md` 계층 절), `tools/checks/lint_harness.py`가 검사, Claude Code 편집 훅이 즉시 경고(`T/.claude/settings.json`, `T/tools/checks/hook_lint.py:1-30`).
- 명령: `./tools/run.sh`(프론트 빌드 + 단일 서버 :8000), `./tools/run.sh dev`(백 :8000 + Vite :5291 프록시), `./tools/checks/verify.sh [--ui]`(`T/tools/run.sh:13-27`, `T/AGENTS.md:30-35`). 배포: 로컬 단일 프로세스 전용(`T/apps/backend/AGENTS.md`의 "로컬 단일 프로세스 전용").

### 2.2 LLM/AI 호출
- Ollama `/api/chat`, `urllib`(`T/apps/backend/court/llm.py:43-60`). 옵션 `temperature 0, seed 7, num_ctx 8192, num_predict 2048`, HTTP 타임아웃 120초(`llm.py:9-10`). WSL이면 게이트웨이 IP로 Windows의 Ollama에 접속(`llm.py:13-22`, M과 같은 문제를 푼 코드).
- **구조화 출력: JSON Schema를 `format`에 직접 전달**(Ollama 구조화 출력, `llm.py:48`). 스키마는 코드에서 조립: `enum`·`minItems`·`maxItems`·`required`(`T/apps/backend/court/agents.py:53-70, 73-96`), 키워드는 "제목 단어 또는 빈 문자열만" enum으로 가둠(`agents.py:65`). 호출 메타(토큰·초)를 함께 반환(`llm.py:55-60`). → 이사 지킴이 `extract-items`/`extract-quote` 응답 스키마 정의 방식으로 그대로 쓸 수 있는 발상(단, Ollama 스키마 → 선택한 클라우드 모델의 structured output 문법으로 변환 필요).
- 프롬프트 위치: **코드에 문장을 쓰지 않고 `agents/*/SKILL.md`에서 읽음**(`T/ARCHITECTURE.md` 백엔드 계층 절, `T/AGENTS.md:12`).
- **에이전트 루프(가장 정교)**: 읽기 → 계획 → 도구 → 초안 → 검증 → 고쳐 쓰기 → 제출/사람에게 넘김(`T/apps/backend/court/agent_loop.py:1`). 도구는 "문장 원문 읽기·단어 검색·본문에 없는 핵심어"(`agent_loop.py:103-128`)로 LLM tool-use가 아니라 **계획 JSON을 코드가 해석해 실행**하는 방식. 예산: 에이전트당 호출 상한 `MAX_AGENT_CALLS=4`, 수정 `MAX_REVISIONS=2`(`agent_loop.py:12-13`).
- 재시도·폴백: `ask()`가 **파싱 실패(ValueError/KeyError)에 한해 1회 재시도**, 호출 상한 초과 시 `optional`이면 None, 아니면 사용자용 한국어 오류(`agent_loop.py:73-92`). 연결 실패/모델 없음(404)은 구분된 메시지(`agent_loop.py:84-87`).
- **증거 검증관(LLM 없이 코드로 원문 대조)**: 인용이 문장에서 이어진 비율 ≥0.8이면 통과, 다른 번호면 `misnumbered`, 제목이면 `title`, 아니면 `fabricated`(`T/apps/backend/court/evidence.py:5-36`), 공백·따옴표 정규화(`evidence.py:6-12`). 실패 항목은 실제 원문을 적어 수정 지시로 되돌림(`agent_loop.py:190-`).
- 키 관리: 없음(로컬 모델).

### 2.3 업로드
사용자 직접 입력 기사 저장(`POST /api/cases`, 텍스트)만 있고 파일·이미지 업로드는 없음(`T/apps/frontend/src/api/client.ts:43`).

### 2.4 UI 패턴
- 상태: zustand 단일 스토어(`T/apps/frontend/src/features/court/store.ts:1-54`)에 비동기 액션(`open/start/retryJob/cancelJob/...`), 순수 로직은 `src/lib/`의 상태 머신(`trial.ts`, 테스트 `trial.test.ts` 311줄)으로 분리. localStorage는 **try/catch로 감싼 `readPref/writePref`**(`store.ts:56-70`).
- 단계형 흐름: 심급(1·2·3심) × 판사 단계(H1~H5)를 `InstanceStepper`와 상태 머신으로 표현(`T/docs/product-specs/court-flow.md` 판사 단계 표). 서버가 순서·단계 위반을 검증(같은 문서 마지막 불릿).
- 막힌 버튼: `GuardedButton` — 비활성 사유를 항상 한 줄로 보여주고, 눌러 본 뒤엔 붉게(`T/apps/frontend/src/ui/Forms.tsx:44-56`, `aria-disabled`).
- 토큰: Tailwind 4 `@theme`에 색(`pro/con/stone/brass`) 정의(`T/apps/frontend/src/index.css:11-48`), 공통 클래스 상수 `PRIMARY/SECONDARY/INPUT/CARD`(`T/apps/frontend/src/ui/styles.ts`).
- API 래퍼: `request()` 한 곳에서 `fetch`, 에러 본문 `detail`을 한국어 메시지로 승격, `VITE_MOCK=1`이면 동적 import한 모의 서버로 대체(`T/apps/frontend/src/api/client.ts:11-25`).
- 모바일: 390×844 Playwright 스크린샷 5장 존재(`T/apps/frontend/scripts/shot.mjs:180-198`, 결과 `test-results/shots/30-34-mobile-*.png`). 운영 콘솔 중심이라 데스크톱 우선.

### 2.5 테스트·검증
- 백엔드 pytest 12파일, **실제 모델 호출 테스트 없음, 가짜 LLM**(`T/apps/backend/AGENTS.md` 테스트 절, `tests/`), 프론트 vitest(lib 로직·컴포넌트), `verify.sh`가 규칙→pytest→vitest→tsc→build 순(`T/tools/checks/verify.sh:13-31`), `--ui`는 임시 데이터 폴더 + 실서버 + Playwright 스크린샷(`verify.sh:33-77`).
- `tools/progress.json`을 앱 화면 "구현 현황"에 노출, 끝났다고 말하기 전 갱신(`T/AGENTS.md:37`). 작업 순서 스킬 `feature-workflow`(계획→계약→진행현황→구현→**다른 맥락의 리뷰**→검증→기록, `T/.claude/skills/feature-workflow/SKILL.md:6-12`).
- 검증 정직성: 레드팀 변형(프롬프트 주입 문장 삽입 등, `T/docs/product-specs/court-flow.md` 레드팀 절).

### 2.6 습관
- **모듈·함수·컴포넌트 위 한 줄 명사형 주석, docstring·여러 줄 주석 금지**(`T/AGENTS.md:22`; 예 `# 증거 인용 검증`, `// 천칭 기울기 계산`) — 코드로 린트.
- **계약이 코드보다 먼저**(`docs/contracts/`, `T/AGENTS.md:20`), 지도형 AGENTS.md/CLAUDE.md(짧은 CLAUDE.md가 AGENTS.md를 가리킴, `T/CLAUDE.md`), 실험 기록 "시도→관찰→판단→변경"(`docs/experiments/findings.md`).
- 한국어 UI는 "~해요/~합니다" 혼용: 버튼 사유 문구 "아직 기록할 수 없어요 · …"(`Forms.tsx:44`).

---

## 3. TTA-Service (C) — "닿는 경보 (CAP2ALL)"

### 3.1 스택·구조·명령·배포
- 스택: Vite 6 + React 19 + TypeScript 5.7 + vitest 3 + fast-xml-parser, **Tailwind·컴포넌트 라이브러리 금지, CSS 변수만**(`C/package.json`, `C/DESIGN.md:106`), Node ≥20.11(`.nvmrc`).
- 구조: `src/{agent,standards,ontology,ui,demo,evaluation,audit,data}` + `fixtures/{cap,llm,public,sign}` + `golden/cases.json` + `scripts/` + `docs/00~10-*.md`(번호 문서) + `diagrams/` + `DESIGN.md`.
- 명령: `npm run dev`, `npm run ci` = typecheck → test → verify:standards → check:blind → build(`C/package.json:23`). GitHub Actions에 **별도 "재현성" 잡**: `.env` 삭제 후 클린 설치·빌드(`C/.github/workflows/ci.yml` reproducibility). 배포: `dist` 정적(`C/README.md:82-89`, `vite.config.ts:16` `base:'./'`).

### 3.2 LLM/AI 호출
- **replay/live 어댑터(재현성 핵심)**: `LlmAdapter.complete({key,system,user})`, 기본 `replay`는 `fixtures/llm/index.json`에서 결정적 키로 응답을 꺼냄, 키가 없으면 `MissingFixtureError`(`C/src/agent/llm.ts:11-58`). 키는 `fixtureKey(parts)`로 프롬프트 단계·프로파일·시도 번호에서 생성(`llm.ts:67-70`). 브라우저에서는 항상 replay(`llm.ts:60-65`). → 이사 지킴이의 "[사전 실행 결과] 폴백 배지"(위키 §7, §12)를 구현하는 가장 직접적인 선례.
- 녹화 스크립트: 앱이 실제로 쓰는 `processAlert`를 어댑터로 가로채 녹화(하드코딩 대상 없음, `C/scripts/record-fixtures.mjs:14-24`), dry-run 기본(`:26-27`), Anthropic Messages API 직접 호출 + 호출 간격 1200ms + 429/5xx에 한해 2회 지수 백오프, 400/401은 즉시 중단(`:41-48, 103-139`), 응답 본문을 로그에 찍지 않음(`:133`), 녹화 후 비밀·개인정보 스캔을 같은 `RULES`로 재사용(`:29-30, 35`).
- **구조화 출력 계약**: `JudgmentContract` 타입 + `validateJudgment(value, alert)` 런타임 검증 — `alertId` 일치, enum, 원문 3축 인용 일치, 비어 있는 `evidence` 기각, `blockedReason` 명시(`C/src/agent/contract.ts:12-70`). zod 없이 손으로 검증. **"LLM 출력은 신뢰하지 않는다"**(`contract.ts:43`).
- **생성→검증→재생성→폴백 루프**: `runVerifyLoop`는 최대 3회, 생성 예외도 위반으로 기록하고 계속, 위반 목록을 `toRepairInstruction`으로 프롬프트에 되먹임, 실패하면 `fallback`(원문) 반환(`C/src/agent/loop.ts:48-110`). fail-safe(원문이라도 발송) vs fail-closed(사람 승인 전 중단) 구분을 주석으로 명시(`loop.ts:7-9`).
- **근거성 검사**: 생성문의 지명·시각·수치 토큰이 원문에 전부 있어야 함, 예외 없음(`C/src/standards/grounding.ts:1-12`, 정규식 `:25-45`). → 이사 지킴이 "금액·수량·층수가 업체 문구/원문에 없으면 문장 틀에 넣지 않는다"에 그대로 응용.
- 신뢰도 임계: `confidence < 0.6`이면 자동 진행 대신 사람에게(`contract.ts:31`).
- 키 관리: `.env`는 gitignore, 저장소에는 `.env.example`만(`C/.env.example:47-51`), 제출물에 키 금지, 런타임 브라우저 번들에는 키 없음(`llm.ts:53-55`). `.env` 직접 파서로 dotenv 의존 제거(`record-fixtures.mjs:68-80`). 포털 2곳의 키를 변수 분리(`.env.example:53-62`).
- 주의: `C/.claude/worktrees/ui-left-rail-redesign/.env` 파일이 존재함(경로만 확인, 내용은 열지 않음). 이사 지킴이에 옮길 때 이 디렉터리는 **복사 금지**.

### 3.3 업로드
없음(CAP XML은 `?raw` import한 픽스처, `C/src/App.test.ts:3`).

### 3.4 UI 패턴
- 구조: 단일 화면 3영역 셸(레일/큐/작업대), 라우팅 없음(`C/DESIGN.md:28`). wizard 아님. 상태는 `App.tsx`의 `useState` 다수(`App.tsx:313-332`).
- **DESIGN.md 형식이 가장 쓸모 있음**: Source of truth·Brand·Goals/Non-goals·Personas·IA·Design principles·Visual language·Components·**Color tokens 표**·Accessibility·Responsive·Interaction states·Content voice·Implementation constraints·Open questions(`C/DESIGN.md` 전체). 상태(idle/validating/repairing/passed/fallback/rejected/awaiting approval)를 정의(`:53`), Disabled는 "이유를 포함해 비활성화"(`:97`), 마이크로카피 규칙 "현재 상태와 다음 결과를 함께 말한다"(`:103`).
- 토큰: `src/styles.css`에 의미 토큰(`--app-bg --panel --text --accent --good --warning --bad --focus --on-solid …`), 라이트 기본 + `:root[data-theme='dark']` 오버라이드, 규칙 안에 색값 직접 기입 금지(`C/DESIGN.md:56-78`, `C/src/styles.css:1-20`). 첫 페인트 전 `data-theme` 확정 인라인 스크립트(`C/index.html:15-29`), 테마 순환 토글(`C/src/ui/ThemeToggle.tsx`, system/light/dark).
- 모바일: 360px 이상 지원, 44px 최소 터치 영역, 모바일은 단일 열 재배치(`C/DESIGN.md:87-90`), 미디어쿼리 다수(`C/src/styles.css:3540, 3652` 등 `max-width:767px/430px`), 접근성 미디어쿼리(`prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, `:3659-3717`). 검증 기준 "1440×900과 390×844 캡처, 모바일 가로 오버플로·콘솔 오류 0건"(`C/DESIGN.md:110`).
- 카드: `CardHead`(아이콘 칩 + kicker + 설명 + 우측 수치) 컴포넌트(`C/src/ui/CardHead.tsx:1-41`), 아이콘은 장식(`aria-hidden`), 의미는 텍스트.
- 접근성 습관: `aria-live` 낭독이 단계마다 폭주하지 않도록 "phase 당 1회" 회귀 테스트(`C/src/App.test.ts:38-60`).
- 규모 경고: `styles.css` 6104줄, `App.tsx` 931줄, `ConsoleView.tsx` 695줄 — 모바일 단일 흐름 앱에 그대로 가져오기엔 과함.

### 3.5 테스트·검증
- Vitest 다수(`src/**/*.test.ts` 20여 개), **골든셋 20건**: 케이스별로 검증기 하나씩 고립시켜 "어떤 검증기가 걸려야 하는가 + 최종 outcome"을 판정, 임계값(`verifierDetectionRate 1.0, outcomeMatchRate 0.9, forbiddenTokenLeaks 0, maxAvgAttempts 1.5, maxFallbackRate 0.15`)(`C/golden/cases.json` 앞부분, `C/src/evaluation/golden.ts:1-30`). 러너가 앱 코드와 무엇을 공유하고 안 하는지를 주석으로 정직하게 명시(`golden.ts:3-28`).
- **블라인드·비밀 스캐너**를 CI 게이트로(`C/scripts/check-blind.mjs:1-60`, 키 패턴 `sk-ant-…`·`sk-…`·GitHub 토큰 등), 개인 용어는 CI secret(`ci.yml` 주석: 변수는 마스킹 안 되므로 secrets).
- 회귀 테스트에 "★ 이 테스트가 막는 회귀 ★" 서술형 주석(`App.test.ts:30-37`).

### 3.6 습관
주석이 길고 서술적("왜 이렇게 했나, 예전에는 무엇이 문제였나", 예 `check-blind.mjs:46-51`, `record-fixtures.mjs:14-24`) — **T의 "한 줄 명사형" 규칙과 정반대**이므로 이사 지킴이에서는 둘 중 하나로 통일해야 한다(§5). 문서는 번호 파일(`docs/00-…10-…`), 한국어 행정 안내체 "짧고 침착한"(`C/DESIGN.md:101`).

---

## 4. 이사 지킴이 매핑 — 위키 §5~§8 요구별로 어디에 뭐가 있나

| 이사 지킴이 요구(위키) | 기존 자산 | 비고 |
|---|---|---|
| 두 모델 호출 병렬(§7 `Promise.all`) | 직접 선례 없음(M은 순차 `runner.ts:59-72`) | 새로 작성. 단, M의 "에이전트 하나 실패해도 나머지 계속"(`runner.ts:29-37`)을 호출별로 적용 |
| 고정 JSON 스키마 + 필수 필드 검사 | T 스키마(`agents.py:53-70`) + C 계약 검증(`contract.ts:46-70`) + M 방어 파서(`ollama.ts:50-61`) | 셋을 합치면 완성 |
| 원문 발췌 대조 | T `evidence.py:5-36`, M `provenance-checker.ts:10` | 견적서 "원문 발췌" 필드 검증에 직접 재사용 |
| 사용자 교정 화면 | M `FreeTextParse.tsx:133-188`(제안 diff + 반영) | 단, 사진/견적 이미지 옆 병렬 표시는 새로 |
| 규칙 대조 → 상태 카드 | M `wording-guard`·`law-judge` 규칙 스타일, C `contract.ts` | 카드 UI는 C `CardHead` |
| 금지 표현 차단 | M `wording-guard.ts:10-37` + `forbidden-phrases.json` | "불법/위법 단정" 차단이 §6과 일치 |
| 지연 시 사전 실행 결과 배지 | C replay 어댑터 `llm.ts:38-58` + fixtureKey | |
| 문장 틀 복사 | M `CopyButton.tsx:1-26` | |
| API 키·서버 미저장 | C `.env.example`, `llm.ts:53-55`, `record-fixtures.mjs:133` | 서버리스 환경변수는 unknown |
| 모바일 웹 | C 반응형 규칙·44px·단일 열(`DESIGN.md:87-90`) | |
| 테스트 | M 목 LLM(`helpers.ts:23-38`), C 골든셋 | |

---

## 5. 이사 지킴이에 그대로 가져올 것 TOP 8

### 1. 검증-재생성-폴백 루프 → `C/src/agent/loop.ts:48-110`
- 왜: 이사 지킴이의 "견적 숫자 오독 / 스키마 위반" 위험(위키 §12)을 코드가 통제하는 가장 작은 단위. 제네릭이라 비전 호출에도 그대로 맞다. 생성 예외도 위반으로 기록하고 계속(`loop.ts:56-74`)하는 점이 중요.
- 변경: `Violation`을 `{field, code, message, hint}`로 단순화(표준 번호 `standard/clause` 제거), `MAX_ATTEMPTS`를 **2**(시간 한도: 호출당 18초 목표)로, 폴백을 "원문 빈 값 + `판독 불가` 상태 + 직접 입력 모드(§11 12시 게이트)"로. `toRepairInstruction`(`loop.ts:100-110`)의 문구 "원문에 없는 사실을 새로 추가하지 마십시오"는 그대로.

### 2. LLM 출력 계약 + 런타임 검증 → `C/src/agent/contract.ts:46-70` (+ `T/apps/backend/court/agents.py:53-70`의 스키마 조립)
- 왜: "스키마를 만족하지 못하는 판단은 실행되지 않는다"(`contract.ts:5`). 견적 JSON(총액·계약금·차량·인원·장비·포함 문구·추가비 조항·원문 발췌)과 품목 JSON(품목·수량·크기·photoIds·낮은 확신)에 같은 방식 적용.
- 변경: `validateQuote(value)`: 금액은 정수·음수 금지·단위 포함, 필수 필드 누락은 `판독 불가`로(실패 아님), 모든 문자열 필드에 `excerpt`(원문 그대로) 요구. 모델 제공사의 structured output(JSON Schema)이 가능하면 T처럼 스키마를 `format`/`response_format`에 넘기고 C식 검증을 **이중으로** 둔다. zod 도입은 선택(사용자 코드에 zod 선례 없음 — 손 검증이 사용자 스타일). 스키마를 객체 리터럴로 한 곳에 정의하고 타입·검증·프롬프트 예시를 거기서 파생.

### 3. 원문 대조 검증관 → `T/apps/backend/court/evidence.py:5-36` + `M/backend/src/agents/verify/provenance-checker.ts:10`
- 왜: 견적서에서 "총액 35만 원", "사다리차 포함" 같은 **AI의 발췌가 실제 이미지에 있는지**를 코드로 확인하는 장치. M은 "LLM은 더하기만 가능, 빼지 못한다"(`facility-reader.ts:41`)로 안전장치 설계까지 증명.
- 변경: 이미지는 텍스트 대조가 불가하므로 **2단계**로: (a) 모델이 낸 `excerpt`가 자기 자신이 낸 `fullText`(전사 필드)에 부분 일치하는지(`coverage ≥ 0.8`, T 임계 그대로 시작) (b) 금액 숫자는 `fullText` 내 숫자 토큰과 일치하는지. 한국어 숫자 표기('35만원', '350,000') 정규화 함수 추가 필요. (a)(b)에 실패한 항목은 카드 상태 `판독 불가`로. 전사(`fullText`) 자체의 정확도는 검증할 수 없음 → 사용자 교정 화면이 마지막 방어선(위키 §12)이라는 사실을 화면에 명시.

### 4. LLM 어댑터 + replay 폴백 → `M/backend/src/harness/llm/ollama.ts:5-11`(인터페이스) + `C/src/agent/llm.ts:11-70`(replay) + `M/backend/test/helpers.ts:23-38`(목)
- 왜: §7 "모델 1개를 얇은 어댑터로 감싼다", "18초 후 [사전 실행 결과] 배지"를 한 구조로 해결. 테스트도 같은 인터페이스에서 목 주입.
- 변경: `LlmAdapter.complete({key, system, user, images})`에 `images` 추가, 구현은 `live`(선택한 제공사 REST `fetch`, 타임아웃 `AbortSignal.timeout`은 `ollama.ts:41` 방식), `replay`(`fixtures/llm/<샘플ID>.json`), `mock`(테스트). 시연 폰에서는 `?replay=1` 또는 18초 타이머 후 버튼으로 replay 전환, 결과에 `source:'replay'`를 넣어 **화면 배지 강제**(M의 `LLM 추출/규칙 추출` 배지 `FreeTextParse.tsx:151`와 같은 방식). 픽스처 키는 `fixtureKey`처럼 `샘플ID__extract-items`로 단순화. **이미지 base64를 픽스처에 넣지 말 것**(크기·개인정보).

### 5. "AI 제안은 사람이 눌러야 반영" 교정 UI → `M/frontend/src/features/intake/FreeTextParse.tsx:121-190`
- 왜: 위키 §5 ②의 "원문 옆에서 수정"과 §6 "사람: 실제 수량·중복·운송 여부 확정"을 이미 구현한 패턴. 현재값→제안값 diff, 항목별 반영, 이미 직접 입력한 칸 경고, 일괄 반영 버튼.
- 변경: 품목 행(이름·수량·운송 여부·중복 체크)과 견적 필드 행으로 도메인을 바꾸되 diff 대신 "AI 초안 / 내 수정" 두 열 + 원문 이미지 썸네일을 같은 행에 붙인다(모바일은 썸네일 탭 시 확대). 사용자가 수정하기 전에는 규칙 대조를 돌리지 않는 게이트(M의 "사람이 확인하기 전에는 판정에 쓰지 않는다", `M/README.md:6`) 유지. 모름 보존 원칙(`useIntakeForm.ts:95`)을 `미확인` 상태 3값(명시/미확인/판독 불가)으로 확장.

### 6. 금지 표현·단정 차단 가드 → `M/backend/src/agents/verify/wording-guard.ts:10-37` + `M/harness/policies/forbidden-phrases.json`
- 왜: 위키 §6 "없는 조항이나 '불법' 단정이 나올 수 없다"와 §12 "법적 표현 과장"을 **문장 틀 출력 직전 마지막 게이트**로 구현. 정책을 JSON 파일로 분리한 구조가 발표·심사에 설명하기 쉽다.
- 변경: 금지 목록을 `불법/위법/사기/무조건/반드시/위약금 부과 가능` 등 이사 도메인으로 교체(목록은 별도 확인 필요 — 내용은 B006 범위 밖). `ASSERTIVE` 정규식의 어미 처리(`wording-guard.ts:9`)는 그대로. "모름을 없음으로 표현"하는 검사(`:28-34`)는 "미확인 항목을 '포함됨'으로 표현"으로 반전. 문장 틀은 **LLM이 쓰지 않고 코드 템플릿**이므로 사실상 회귀 테스트용이고 방어선 이중화 용도.

### 7. 모바일 우선 디자인 토큰 + 상태 규칙 → `C/DESIGN.md:56-103` 구조 + `C/src/styles.css:1-60` 토큰 + `M/frontend/src/index.css:42-60` 버튼 클래스
- 왜: DESIGN.md의 "Color tokens 표 / Interaction states(Disabled는 이유 포함) / 마이크로카피 규칙 / 모바일 44px·단일 열 / 테스트 기대(390×844·가로 오버플로 0)"는 그대로 이사 지킴이 DESIGN.md의 뼈대. 카드 상태 4종(명시됨/미확인/모호/판독불가)은 C의 상태색 규칙 "색 하나로만 상태를 전달하지 않는다"(`DESIGN.md:41`)와 맞음.
- 변경: 다크/라이트 2테마·ThemeToggle은 **버린다**(9시간, 모바일 단일 흐름) — 라이트 단일 + 토큰만 유지. 강조색 Claude Orange 대신 별도 색 선택(브랜드 미정 → unknown). 폰트는 Pretendard를 **번들**(C는 `public/fonts`에 OFL 파일과 함께 번들, `C/src/styles.css:21-30`; M은 CDN이라 행사장 Wi-Fi에 취약 — 번들 방식 채택). 버튼은 `M index.css`의 `.btn/.btn-primary/.btn-ghost/.input/.label`(5개)만 가져오고 `disabled` 사유는 T `GuardedButton`(`Forms.tsx:44-56`)으로 표시. 카드 머리는 `CardHead`(`C/src/ui/CardHead.tsx`) 축소판.

### 8. 클립보드 복사 + 안전한 브라우저 저장 + 중앙 API 래퍼 → `M/frontend/src/shared/ui/CopyButton.tsx:1-26` + `T/apps/frontend/src/features/court/store.ts:56-70` + `T/apps/frontend/src/api/client.ts:11-25`
- 왜: iOS Safari/카카오 인앱(위키 §4, §14 unknown)에서 `navigator.clipboard`가 막히는 경우의 `execCommand` 폴백이 이미 있음. sessionStorage 접근 실패(사파리 프라이빗)에 대한 try/catch 패턴, `fetch`를 한 파일에 모아 한국어 오류 메시지·모의 모드를 두는 패턴.
- 변경: `CopyButton`은 그대로(다크 클래스·`no-print`만 제거). `readPref/writePref`는 `sessionStorage`로 교체하고 이미지 base64는 **저장하지 않는 규칙**(§7 "상태는 sessionStorage에만", 용량 한도 때문에 이미지는 메모리만, 새로고침 시 재업로드 안내 — 이 결정은 팀이 확정해야 함). `client.ts`는 `extractItems()/extractQuote()` 두 함수 + `VITE_REPLAY` 분기로 축소하고 413/타임아웃/HEIC를 구분한 한국어 오류 문구(`ApiError` 패턴 `T/apps/frontend/src/api/error.ts`).

> 번외(TOP 8 밖이지만 가치 있음): ① 골든셋 구조(`C/golden/cases.json` + 임계값, `C/src/evaluation/golden.ts`)를 위키 §9 평가 지표(탐지율·오탐 문서당 1개 이하·시간)의 러너 틀로. ② `check-blind.mjs`의 비밀 스캐너 `RULES`(`C/scripts/check-blind.mjs:46-60`)를 pre-push 검사로(이사 지킴이는 사용자 사진 저장 안 함이 핵심이므로 `console.log(image)`류 검사 규칙 추가 고려). ③ T의 `verify.sh` 단일 진입점(`T/tools/checks/verify.sh:13-31`) 구조.

---

## 6. 가져오면 안 되는 것

- **에이전트 팀 3팀 9명 구조**(M `runner.ts`, `harness.config.json`) — 이사 지킴이는 호출 2번 + 규칙 코드면 충분. 하네스·온톨로지·관측 대시보드·SSE 이벤트·`TraceStore`는 9시간 일정(§11)에 과함(M `app.ts:90-103`, T `execution`/`control` 화면 전체).
- **T의 계획→도구→초안→검증→고쳐 쓰기 풀 루프와 zustand 대형 스토어**(`agent_loop.py` 전체, `store.ts` 54줄 인터페이스) — 이사 지킴이 상태는 업로드·확인·카드·문장 4개면 `useState`/`useReducer`로 충분.
- **Python/FastAPI 백엔드·로컬 Ollama·WSL 게이트웨이 코드**(`T llm.py:13-22`, M `ollama.ts` 모델 대체 로직 `:26`) — 배포 대상(Vercel, 위키 §7)과 맞지 않음. 인터페이스 형태만 참고.
- **C의 `styles.css` 6104줄·`App.tsx` 931줄·다크 테마·3영역 관제 셸·온톨로지/지도 컴포넌트** — 모바일 단일 흐름에 부적합. 토큰 구조만 참고.
- **C의 `.claude/worktrees/ui-left-rail-redesign/.env`** — 열어보지 않았으나 존재 자체가 위험. 폴더째 복사 금지, 새 repo에는 `.env.example`만.
- **Tailwind 3(M) / Tailwind 4(T) / 순수 CSS(C) 혼용** — 새 프로젝트는 하나로 결정해야 한다. 권장: 사용자가 가장 최근 쓴 T의 Tailwind 4 + `@theme` 토큰(`T index.css:11-48`) 또는 C 방식 중 택일(팀 결정 필요, 본 조사가 정하지 않음).
- **주석 스타일 혼용**: T의 "한 줄 명사형 주석만" vs C의 서술형 장문 주석은 충돌. 새 저장소 AGENTS.md에 하나로 명시.
- **M의 정적 `snapshot` 재생을 "시연 폴백"으로 착각해 복제하지 말 것** — M 스냅샷은 정적 호스팅용으로 전 API를 JSON 파일로 대체하는 것(`client.ts:1-11`)이며, 이사 지킴이에 필요한 것은 "실제 호출 지연 시 결과 하나를 대신 보여주기"(C replay 어댑터)다.
- **M의 "LLM이 계획을 제안하고 규칙이 확정" 구조**(`plan.ts`) — 이사 지킴이는 계획이 고정(호출 2개)이라 불필요.

## 7. 남은 unknown / 검증하지 못한 것

- 세 프로젝트 모두 이번 조사에서 **실행·빌드·테스트를 돌리지 않았다**. README의 "46개 통과", "20/20" 등은 주장일 뿐 이 세션에서 재현하지 않음.
- 멀티모달 모델의 한국어 견적서 인식 정확도, 모델 제공사별 structured output 문법, 이미지 입력 한도, Vercel 서버리스에서의 타임아웃은 기존 코드에 근거가 없으므로 별도 조사 필요(위키 §14와 동일).
- M `harness/agents/*.md` 카드를 코드가 런타임에 읽는지 확인 못함(`registry.ts`의 `loadCards`는 `app.ts:65`에서 화면 표시용으로만 노출되는 것까지만 확인).
- T `agents/*/SKILL.md` 프롬프트 본문과 `apps/frontend/src/api/mock/` 모의 서버 세부, C `pipeline.ts`·`triage.ts`의 실제 프롬프트 문구는 읽지 않음(범위 때문). 이사 지킴이 프롬프트 작성 시 한 번 더 열어 볼 가치 있음.
