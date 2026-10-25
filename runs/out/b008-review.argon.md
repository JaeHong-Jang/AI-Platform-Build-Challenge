# D006 지휘부 기술·구현 검증 (Argon)

검토 기준일: **2026-10-24** · 작성: **Argon (지휘부 — 기술·구현 관점)** · 블라인드 독립 검토  
근거: `decisions/D006-이사-지킴이-에이전트-관제.draft.md`, `briefs/B008-이사-지킴이-에이전트-관제.md`, `runs/out/b008-design.sonnet.md`, `runs/out/b008-design.sol.md`, `runs/out/b008-data.sol.md`, `runs/out/b008-data-peer.sonnet.md`, `runs/out/b008-triton.sonnet.md`, `runs/out/b008-palette.sonnet.md`, `runs/out/b007-ollama.sonnet.md`, `decisions/D005-이사-지킴이-대시보드.md`, `web/src/lib/*.ts`, `web/src/components/*.tsx`, `web/src/app/api/**/route.ts`.

---

## 1. 주장별 판정 (K1 ~ K11)

| 주장 | 판정 | 핵심 이유 (`파일:줄` / URL) |
|---|---|---|
| **K1** 에이전트 조직 (LLM 3 / 규칙 7, 조건 해석=`ax4-light`) | **찬성** | 모델 교대 횟수 최소화(`Ax4 → Qwen` 1회) 및 B007 구조화 추출 실측(`ax4-light` 9/10·인용 일치 100% vs `qwen3` 인용 일치 2/5)에 부합 (`runs/out/b007-ollama.sonnet.md:57-61`, `web/src/lib/ollama.ts:10-14`). 단, 조건 해석 검증기(`intake.ts`)의 숫자·부정어 검증 보강 필수(아래 TOP 5 #2). |
| **K2** 토글·실행 규칙 (GPU 직렬 대기열·취소 토큰·검증기 유지) | **보류** | 방향은 타당하나 ① `web/src/lib/ollama.ts:53-60`에 `req.signal` 전파가 없어 in-flight 취소 시 GPU 대기열이 멈추지 않고(`lastModel` 오염 포함), ② LLM을 껐을 때 작동하는 수동 입력/수동 반영 대체 경로가 `verifyDraft`·`NOT_PLAIN_YES` 검증기를 우회함(TOP 5 #4, #5). |
| **K3** 이삿짐 장면 (신규 SVG, F4 시각화, 1,300~1,500줄) | **보류** | 상자=카드 1:1 및 멈춤선=질문 쪽지 구조는 타당하나(`runs/out/b008-design.sonnet.md:343-352`), ① `1,300~1,500줄` 규모가 현재 앱 전체 코드(`~1,540줄`)와 맞먹어 일정 위험이 과도하고, ② `useMemo` 동기 카드(`web/src/lib/store.ts:82`)와 비동기 이벤트 큐(`useAutoReveal`) 이원화 시 React 19 클라이언트에서 상태 어긋남(Tearing)이 발생함. |
| **K4** 숫자 산정 금지 (㎥·톤수·인원·가격·적재율 제외, 서류·10% 알림) | **찬성** | 공인 산정표·표준 물량·가격 예측 모델이 모두 `unknown`이므로(`runs/out/b008-data.sol.md:16, 20, 160, 163`), 트럭 막대를 `"확인 완료 N/M"`으로 두고 표준약관 제10035호(https://ydnara.com/yakgwan.html) 제4·5·6조 점검으로 한정한 판단이 기술적·규칙적으로 정확함. |
| **K5** 업체 고르기 (다중 견적 비교 + 관악구 허가 목록 39행 대조) | **찬성** | 관악구 데이터(https://www.data.go.kr/data/15080952/fileData.do, 39행, 이용허락 제한 없음)를 **빌드 전 정제된 정적 JSON(`전화번호` 열 물리적 제거, `구분`·`영업상태명` 포함)** 으로 번들링하면 외부 API 장애·인증키 노출·개인정보 문제를 모두 차단할 수 있음(`runs/out/b008-data-peer.sonnet.md:53-56`). |
| **K6** AI 기능 F1~F11 (추가요금 분쟁 감소 기여 1줄 증명, 사고·배상 제외) | **찬성** | 모든 기능이 계약금 송금 전 질문 도출에 수렴함(`runs/out/b008-design.sonnet.md:206-233`). F8(계약서 읽기)은 기존 `quoteDraftSchema`(`web/src/lib/types.ts:5-18`)와 분리된 `contractDraftSchema`(주민등록번호 제외, `runs/out/b008-data.sol.md:125`)로 구현해야 함. |
| **K7** 입력 부담 (필수 0개, 한 문장/칩, 후보 기본 미확정) | **찬성** | 선택 부담 완화와 물량 미확정 원칙(`runs/out/b008-data.sol.md:178`)을 동시에 만족함. 단, 현재 `Item.count > 0` 필수 조건(`web/src/lib/rules.ts:39`)과 `Overview.tsx:48`의 `blocking`(층수·짐 없으면 대조 차단)을 완화해야 "필수 입력 0개 → 맞춤 홈"이 실제로 동작함. |
| **K8** 근거 온톨로지 (`ontology.yaml` + `SKILL.md` 10개 + 4열 사슬) | **찬성** | TRITON `evidenceLayout.ts`(126줄)·`graphModel.ts`(125줄)는 외부 패키지 의존성이 0인 순수 함수(`runs/out/b008-triton.sonnet.md:60-62, 123`)여서 Next 16 + React 19(`web/package.json:14-16`)에 즉시 이식 가능하며, 모바일 스크롤 충돌 위험이 있는 자유 force 그래프 제외도 타당함. |
| **K9** 디자인 (TRITON 셸 + 팔레트 A '크라프트 상자 + 트럭 파랑') | **찬성** | 팔레트 A(`runs/out/b008-palette.sonnet.md:13-62`)는 라이트/다크 28개 조합 WCAG 대비 검사를 통과함. 단, 장면의 `옷 1(#2F6DB5)`이 `트럭(#2F6DB5)`과 동일 색상이고 팀이 3개인데 옷 색이 2개뿐인 점(`runs/out/b008-design.sonnet.md:15`)은 아래 조건부 승인 방식으로 보완해야 함. |
| **K10** 성공 기준·3분 시연 (웜 30~50초 LLM, 백그라운드 선로딩) | **보류** | 성공 기준(오반영 0, 질문 누락 0, 장면-카드 불일치 0)은 타당하나, **RTX 2080 SUPER 8GB에서 `ax4-light` 직후 `qwen3`를 백그라운드 선로딩해 교대 시간을 숨긴다는 시연 계획(`runs/out/b008-design.sonnet.md:146, 497-498`)은 VRAM 한계상 불가능**하며 시연 도중 37~112초 블로킹이 발생함. |
| **K11** 구현 순서 (기획서 우선 → P0 → P1) | **찬성** | 예선 기획서(10/25 23:59) 우선 작성 후 구현 순서는 타당하나, P0 내부에서 **P0-6(다중 견적·관악구 허가 대조, 200줄)을 P0-4(SVG 장면, 축소 후 ~600줄) 앞으로 이동**해야 데이터 모델(`CaseState` v3)이 먼저 고정되고 일정 위험이 줄어듦(`runs/out/b008-design.sonnet.md:450-455`). |

---

### K1~K11 중점 기술 검토 상세

#### ① 조건 해석을 `ax4-light`로 하는 판단 (K1)
- **판단 근거**: `runs/out/b007-ollama.sonnet.md:53-61` 실측에서 `format: z.toJSONSchema(schema)`를 줬을 때 `ax4-light:q4_K_M`은 9/10 필드 정확도와 원문 인용 일치 100%(3/3, 5/5)를 기록한 반면, `qwen3:4b-instruct-2507-q4_K_M`은 모든 줄을 `blanketPhrases`에 통째로 넣거나 `"value: 1200000"`, `"2026-11-014"`처럼 원문에 없는 문자열을 지어냈다.
- 또한 조건 해석(단계 1)과 견적서·계약서 읽기(단계 2·4)를 모두 `ax4-light`로 통일하면(`runs/out/b008-design.sonnet.md:47-58, 146`), `qwen3`로 시작해 `ax4-light`로 갔다가 다시 `qwen3`로 돌아오는 Sol안(`runs/out/b008-design.sol.md:162-175`, 모델 교대 2회 = 74~224초 손실) 대비 교대 횟수가 절반 이하로 준다.
- **환각 차단 조건**: `zod` 스키마(`nullable` 필수)만으로는 숫자·부정어 환각을 막지 못하므로, `intake.ts` 검증기가 반드시 **단위 결합 정규식**(`(\d+)\s*층`, `(지하)\s*(\d+)\s*층`, `(\d+)\s*(개|대|박스|짝)`)과 **부정/빌트인 문맥 차단**(`빌트인|안\s*옮|빼고|제외|없음`)을 검사해야 한다(아래 TOP 5 #2 참조).

#### ② 로컬 Ollama(8GB GPU) 직렬 대기열·모델 교대·취소 토큰의 구현 가능성 (K2, K10)
- **VRAM 계산**: 호스트 GPU는 `RTX 2080 SUPER 8GB (8192MiB)`(`runs/out/b007-ollama.sonnet.md:4`)이다. 추정: `ax4-light:q4_K_M`(7B급 Q4, 약 4.5~5.0GB) + `qwen3:4b-instruct-2507-q4_K_M`(4B급 Q4, 약 2.5~3.0GB) + 양쪽 `num_ctx: 8192` KV 캐시(`web/src/lib/ollama.ts:58`) + OS/디스플레이 기본 점유(약 0.6~1.0GB) > 8.0GB이므로 **두 모델은 8GB VRAM에 동시 상주할 수 없다**(`web/src/lib/ollama.ts:13` 주석과 일치).
- 따라서 Sonnet안(`runs/out/b008-design.sonnet.md:146, 498`)처럼 "사용자가 업체를 고르는 몇 초 동안 `qwen3`를 빈 요청으로 미리 올린다"고 해도, 그 요청이 들어가는 순간 Ollama 내부 큐에서 `ax4-light` 언로드 + `qwen3` 디스크 로드(37~112초, `runs/out/b007-ollama.sonnet.md:27`)가 시작되어 직후의 답변 점검 요청이 그대로 그 로딩 완료를 기다리게 된다.
- **3분 시연 해법**: 3분 실시간 시연에서는 **라이브 모델 교대를 0회로 설계**해야 한다. 즉 시연 시작 전 `ax4-light`를 워밍업해 두고 **F1(조건 해석, ~10초) + F3(견적 읽기 1~2건, ~15초)만 실시간 LLM으로 실행**하고, `qwen3`가 필요한 F7(답변 점검)은 **"모델 교대 시간(실측 37~112초) 절약을 위해 사전 실행한 실제 로그 재생"** 배너를 명시하고 재생하거나(또는 반대로 견적을 사전 처리하고 `qwen3`만 워밍업해 F7을 라이브 실행, `runs/out/b008-design.sol.md:503-516`), 시연 도중 모델 교대가 일어나지 않게 해야 한다.

#### ③ 장면-카드 이벤트 동기화가 Next 16 / React 19 클라이언트에서 어긋나지 않는 구조인지 (K3)
- 현재 `web/src/lib/store.ts:82`는 `const cards = useMemo(() => cardsOf(state), [state])`로 카드를 동기 파생한다. 반면 Sonnet안(`runs/out/b008-design.sonnet.md:398-401`)은 `SceneState`에서 diff를 떠서 `useSceneEvents` 큐에 넣고 1.2초 간격(`setTimeout`)으로 `(a) 상자 이동`과 `(b) 오른쪽 표 행 추가`를 동시에 일으킨다고 설계했다.
- **어긋나는 시나리오**: React 19에서 사용자가 재생 도중(예: 카드 10개 중 4개 공개 시점)에 ① 오른쪽/위쪽에서 짐 칩 하나를 고치거나, ② 왼쪽 레일에서 에이전트를 끄거나, ③ 다른 메뉴(`#/input`)에 갔다가 돌아오면, `cards`는 즉시 새 배열이 되지만 `useSceneEvents`의 타이머 큐에는 이전 버전의 이벤트가 남아 있거나 초기화 시점이 어긋나 **상자 개수/위치와 `cards` 배열이 불일치(Tearing)** 한다.
- **어긋나지 않는 구조(단일 진실 공급원 + 커서 방식)**:
  1. 장면과 오른쪽 3탭 모두 **오직 `cardsOf(state)`와 `docsOf(state)` 동기 파생 배열 하나만 직접 렌더링**한다(별도의 이벤트 누적 배열을 두지 않음).
  2. 연출용 `useAutoReveal`은 큐가 아니라 **`revealedCount: number`(0 → `cards.length`) 정수 커서 1개와 `targetSig: string`(입력 버전 해시)** 만 갖는다.
  3. `index < revealedCount`인 카드는 최종 위치(트럭 안 `[✓]` 또는 멈춤선 `[?·△·⌀]`)에 그리고, `index >= revealedCount`인 카드는 출발 집 앞마당에 대기 상자로 그린다.
  4. `prefers-reduced-motion`, `건너뛰기` 클릭, 또는 이미 본 입력 버전(`targetSig` 일치)일 때는 `revealedCount = cards.length`로 즉시 고정한다. 이 구조에서는 어떤 상태 변경·언마운트가 일어나도 장면 상자 수와 오른쪽 카드 행 수가 수학적으로 어긋날 수 없다(`불일치 0건` 보장).

#### ④ 1,300~1,500줄 장면의 일정 위험과 줄이는 방법 (K3, K11)
- `runs/out/b008-design.sonnet.md:418-432`의 `1,300~1,500줄` 추정은 10명의 개별 애니메이션, 도구 10종 개별 SVG(`tools.tsx` 160줄), 데스크톱/모바일 이중 좌표계(`1200x480` vs `420x900`), 오른쪽 탭 재작성(`RightTabs.tsx` 160줄) 때문이다.
- **55% 감축안 (추정: 1,400줄 → 약 580줄)**:
  1. `scene/tools.tsx`(160줄) 제거 → 이미 설치된 `lucide-react`(`web/package.json:13`)의 `<Search />`, `<ClipboardCheck />`, `<Stamp />`, `<FileText />`, `<Scale />` 아이콘을 그대로 캐릭터/작업대 옆에 배치(**-140줄**).
  2. 데스크톱(`1200x480`)과 모바일(`420x900`) 이중 SVG 좌표계 제거 → 무대를 **3개의 독립 미니 SVG 패널(`출발 집 400x320`, `트럭·멈춤선 400x320`, `도착 집 400x320`)을 감싸는 CSS Grid(`grid-cols-1 lg:grid-cols-3`)** 로 구성. 이렇게 하면 모바일에서는 자동으로 세로 3단으로 쌓이고 SVG 내부 좌표 계산은 1벌만 작성하면 됨(**-200줄**).
  3. 캐릭터 10명 개별 팔다리 애니메이션 축소 → 무대 각 구역에는 **3팀 대표 작업대(채비·견적·안심) + 지휘관**만 고정 배치하고, 10명 각각의 켜짐/꺼짐/작동 중 상태 점·기호·말풍선은 무대 바로 아래의 공통 `AgentStrip` 컴포넌트로 일원화(**-220줄**).
  4. `scene/RightTabs.tsx`(160줄) 제거 → 기존 `Overview.tsx:90-109`의 대조표와 `InquiryPanel.tsx:93-118`의 질문 목록을 컴포넌트 props로 재사용(**-120줄**).

#### ⑤ 관악구 CSV를 앱에 넣는 방식 (K5)
- **정적 포함(Static JSON) 채택**: 공공데이터포털 파일데이터 `15080952`(https://www.data.go.kr/data/15080952/fileData.do)는 총 **39행**, 연간 갱신(기준일 `2026-04-24`, 차기 등록 예정 `2027-05-04`, 이용허락 제한 없음, `runs/out/b008-data-peer.sonnet.md:53-55`)이므로 런타임 외부 Open API 호출은 불필요하며 해커톤 네트워크/인증키 장애 위험만 키운다.
- **개인정보 물리적 제거 및 스키마**:
  - 원본 9개 열(`업체명·인허가일자·영업상태명·소재지주소·위도·경도·구분·전화번호·데이터기준일자`) 중 **`전화번호` 열은 개인 휴대전화가 포함될 수 있으므로(`runs/out/b008-data-peer.sonnet.md:55`) UI에서 숨기는 수준이 아니라 빌드 전 변환 스크립트에서 아예 제거한 `web/src/data/gwanak-permits.json`만 저장소에 커밋**한다(`AGENTS.md` §6 준수). `위도·경도` 역시 거리 산정을 하지 않으므로 제거하고, `소재지주소`는 상세 호수(개인 자택 가능성) 여부를 확인해 동/도로명까지만 남긴다.
  - 반면 **`영업상태명`(정상 영업 여부)과 `구분`(일반화물 vs 이사화물 여부, `runs/out/b008-data-peer.sonnet.md:56`)은 반드시 JSON에 포함하고 화면에 표시**해야 한다.
  - 업체명 대조 정규화 함수는 `s.replace(/\(주\)|주식회사|\s+/g, "")`로 비교하되, 동명이인/유사 상호 가능성이 있으므로 일치 시에도 `"관악구 허가 목록과 상호 일치 (기준일 2026-04-24) — 계약 전 사업자등록번호·허가증 사본을 직접 대조하세요"`로 표시한다.

---

## 2. 초안에 없는 치명적 문제 TOP 5 (재현 가능)

### 문제 1. `verifyDraft()`의 금액·인원 검증이 '항목 무관 전역 매칭'이라 총액↔계약금 뒤바뀜·사다리차 비용의 계약금 둔갑·'1인 가구'의 작업 인원 둔갑을 전혀 막지 못함
- **위치**: [`web/src/lib/verify.ts:7-14`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L7-L14), [`web/src/lib/verify.ts:44-55`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L44-L55)
- **원인**:
  1. `amountInText(n, text)`(`verify.ts:14`)는 숫자가 견적서 **어느 위치에든 존재하기만 하면** `totalAmount`와 `deposit` 모두 통과시킨다. 또한 `verify.ts:11`의 정규식 `/(?<![\d,])(\d{1,3}(?:,\d{3})+|\d+)(?![\d,]|만|천)/g`는 `'원'` 단위가 없어도 문장 속 모든 숫자(`11월`, `14일`, `3층`, `1톤`)를 금액 배열로 추출한다.
  2. 따라서 모델이 계약금이 없는 견적서에서 `"사다리차 별도 15만원"`을 `deposit: 150000`으로 잘못 추출하거나 총액과 계약금을 뒤바꿔도 `verifyDraft()`를 무사 통과하며, 신규 기능 **F9(계약금 10% 초과 알림, `runs/out/b008-design.sonnet.md:128, 217`)에서 `15만원 / 35만원 = 42.8% > 10%`라는 허위 경보**를 울린다.
  3. 인원 검증(`verify.ts:52`: `new RegExp(`${d.workers}\\s*(명|인)`).test(text)`)도 `"1인 가구 원룸"`이 적힌 견적서에서 모델이 `workers: 1`을 환각 추출하면 `"1인"`과 매칭되어 통과한다.
- **재현 코드**:
  ```ts
  import { verifyDraft } from "./web/src/lib/verify.ts";
  import { QUOTE_DRAFT } from "./web/src/lib/fixtures.ts";

  const text = "이사일 11월 14일 / 1인 가구 원룸 / 총 금액 35만원, 사다리차 별도 15만원 (계약금 없음)";
  const badDraft = {
    ...QUOTE_DRAFT,
    totalAmount: 150000, // 총액(35만) 대신 사다리차 별도 금액(15만) 오추출
    deposit: 350000,     // 계약금 없음인데 총액(35만)을 계약금으로 오추출
    workers: 1,          // 인원 미기재인데 '1인 가구'의 1을 작업 인원으로 오추출
  };
  const { draft, dropped } = verifyDraft(text, badDraft);
  // 결과: draft.totalAmount === 150000, draft.deposit === 350000, draft.workers === 1, dropped === [] (전부 통과!)
  ```
- **해결**: `quoteDraftSchema`에서 금액·인원 추출 시 원문 발췌 구절(`totalQuote`, `depositQuote`, `workersQuote`)을 함께 받거나, 해당 숫자 앞뒤 문맥(예: `계약금|선금` vs `총\s*금액|합계|운임` vs `별도|사다리`, `인원|기사|작업자|패커` vs `1인\s*가구|1인용`)을 분리 검증하고, `amountsIn()`(`verify.ts:11`)은 반드시 `원` 또는 금액 문맥이 붙은 숫자만 매칭하도록 수정해야 한다.

---

### 문제 2. 신규 조건 해석관(`intake.ts`, F1)의 검증 규칙이 '수량↔층수 숫자 혼동', '출발↔도착 층수 뒤바뀜', '부정어/빌트인(`안 옮겨요`, `엘베 없음`)'을 통과시킴
- **위치**: `runs/out/b008-design.sonnet.md:77`, [`web/src/lib/rules.ts:145-152`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L145-L152)
- **원인**:
  - Sonnet안(`runs/out/b008-design.sonnet.md:77`)은 "층수는 문장에 해당 숫자가 있어야, 짐 이름은 문장에 부분 문자열로 있어야 통과"로 설계했다.
  - 그러나 사용자가 `"1층 원룸이고 냉장고는 빌트인이라 안 옮겨요. 박스 3개만 2층으로 옮깁니다"`라고 입력했을 때, 모델이 `from.floor: 3`(`박스 3개`의 3 오독) 및 `냉장고(move: true)`로 추출해도 문장에 `"3"`과 `"냉장고"`가 존재하므로 검증을 통과한다. 그 결과 1층인데 3층 계단·사다리차 질문 카드(`rules.ts:145-152`)가 생기고 안 옮기는 냉장고 상자가 트럭 멈춤선에 서게 된다.
- **재현 입력 및 결과**:
  ```ts
  const userSentence = "1층 원룸입니다. 냉장고는 빌트인이라 안 옮기고요, 박스 3개만 2층으로 옮겨요.";
  // 문장 내 숫자: [1, 3, 2], 부분 문자열: "냉장고", "박스" 존재
  // 단순 숫자/부분문자열 존재 검사만 할 경우 from.floor = 3, item("냉장고", move=true) 환각이 그대로 통과됨.
  ```
- **해결**: `intake.ts` 검증기는 ① 층수 `N`은 반드시 원문에 `(지하\s*)?N\s*층` 패턴이 있을 때만 허용하고(단순 숫자 `N` 매칭 금지), ② 층수가 2개 이상일 때 원문 등장 순서(또는 `출발/에서` vs `도착/으로`)와 `from.floor`/`to.floor` 순서가 일치하는지 대조하며, ③ 짐 이름 뒤나 같은 절에 `빌트인|옵션|안\s*옮|빼고|제외|버릴|폐기`가 있으면 `move: false`(또는 `빌트인` 상태)로 강제 교정해야 한다.

---

### 문제 3. 다중 견적(`quotes[]`) 확장 시 고정 카드 ID와 `sigOf()` 서명 결함으로 인해 '업체 A의 답변 승인이 업체 B의 카드를 자동으로 `명시됨`으로 둔갑시키는' 교차 오염 발생 + 기존 22개 시험 회귀
- **위치**: [`web/src/lib/store.ts:41-52`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/store.ts#L41-L52), [`web/src/lib/rules.ts:44, 83-118`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L44), [`web/src/lib/rules.test.ts:191-202`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.test.ts#L191-L202)
- **원인**:
  1. `rules.ts`의 카드 ID(`item-책장`, `ladder`, `stairs-from`, `truck`, `workers`, `fee-0`)에는 견적 식별자(`quoteId`)가 없다.
  2. `store.ts:42`의 승인 서명 `sigOf(c, d)`는 `[c.status, c.mine, ...c.evidence, d?.totalAmount ?? "", d?.company ?? ""].join("|")`로만 계산된다.
  3. 만약 다중 견적에서 `overrides`를 견적별로 분리하지 않거나, `sigOf`에 `quoteId`·원문 해시·전체 조건 서명을 넣지 않으면: 업체명이 둘 다 미기재(`null`)이고 총액이 같은(`35만원`) 견적 1과 견적 2에서, 견적 1의 답변으로 승인한 `overrides["ladder"]`(`명시됨`)가 견적 2를 열었을 때도 `sigOf`가 일치해 **견적 2의 미확인 카드까지 `명시됨`으로 바꿔 버린다**.
  4. 또한 `truck`, `workers`, `fee-0` 카드는 `c.mine`이 `"—"`(`rules.ts:87-88, 116`)로 고정되어 있어, 사용자가 층수나 짐 수량을 변경해도 `sigOf`가 전혀 바뀌지 않아 이전 승인이 풀리지 않는다.
  5. `rules.test.ts:191-202`는 v0.2 `EMPTY_CASE`(`draft`, `overrides`, `inquiry` 단일 구조)와 `baseCards(s)`·`cardsOf(s)`·`inquiryOf(s, cards)` 시그니처를 직접 호출해 시험하므로, `CaseState` v3에서 해당 필드나 함수 시그니처를 바로 깨뜨리면 기존 22개 단위 테스트가 깨진다.
- **재현 코드**:
  ```ts
  import { baseCards, cardsOf, EMPTY_CASE, sigOf } from "./web/src/lib/store.ts";
  import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS } from "./web/src/lib/fixtures.ts";

  // 견적 A(업체 미기재, 35만원)에서 '사다리차 포함' 답변을 승인
  const quoteA = { ...QUOTE_DRAFT, company: null, totalAmount: 350000, ladder: "미기재" as const };
  const sA = { ...EMPTY_CASE, draft: quoteA, items: SAMPLE_ITEMS, cond: SAMPLE_CONDITIONS };
  const ladderA = baseCards(sA).find((c) => c.id === "ladder")!;
  const overrides = { ladder: { sig: sigOf(ladderA, quoteA), status: "명시됨" as const, cost: "총액 포함" as const, answered: { relation: "explicit_answer" as const, quote: "사다리차 포함입니다." } } };

  // 다른 업체가 보낸 견적 B(업체 미기재, 35만원, 품목 구성만 다름)로 교체했는데 overrides가 공유되면:
  const quoteB = { ...quoteA, listedItems: [] };
  const sB = { ...sA, draft: quoteB, overrides };
  const ladderB = cardsOf(sB).find((c) => c.id === "ladder")!;
  // 결과: ladderB.status === "명시됨" (견적 B에는 묻지도 않았는데 견적 A의 승인이 그대로 적용됨!)
  ```
- **해결**:
  1. `QuoteEntry` 구조체(`{ id: string, quoteText, draft, dropped, reader, asked, inquiry, overrides, reply, runs }`) 안에 견적별 `overrides`·`inquiry`·`runs`를 캡슐화해 업체 간 상태 섞임을 원천 봉쇄한다.
  2. `sigOf(c, d, cond, items, quoteId)`에 `quoteId`와 `cond`·`items` 전체 요약을 포함시켜, 층수·짐이 바뀌면 `mine: "—"`인 `truck`·`workers`·`fee-0` 카드 승인도 함께 무효화한다.
  3. 기존 22개 테스트 호환성을 위해 `store.ts`의 `baseCards`·`cardsOf`·`inquiryOf`는 현재 선택된 견적(`activeQuote(s)`) 또는 하위 호환 `s.draft`를 읽는 어댑터로 유지하고, `sessionStorage` 로드 시 `migrateV2ToV3(raw)`를 거치게 한다.

---

### 문제 4. 에이전트 토글 취소 시 `ollama.ts`가 HTTP `AbortSignal`을 전파하지 않아 GPU 대기열이 최대 180초간 교착(Head-of-Line Blocking)되고 `lastModel` 상태가 오염됨
- **위치**: [`web/src/lib/ollama.ts:11-14, 53-65`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L53-L65), [`web/src/app/api/extract/quote/route.ts:9-16`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/app/api/extract/quote/route.ts#L9-L16), [`web/src/app/api/reply/route.ts:24-31`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/app/api/reply/route.ts#L24-L31)
- **원인**:
  1. `ollama.ts:59`는 `signal: AbortSignal.timeout(lastModel === model ? WARM_TIMEOUT_MS : COLD_TIMEOUT_MS)`만 사용하고, API 라우트의 `req.signal`이나 작업 취소용 `AbortController.signal`을 받지 않는다.
  2. 사용자가 레일에서 실행 중인 LLM 에이전트(`조건 해석관`, `문서 읽기관`, `답변 점검관`)를 껐을 때 클라이언트에서만 결과를 버리면, 백엔드의 Ollama 요청(특히 `reviewReply`의 최대 6턴 루프, `web/src/lib/agent.ts:160`)은 멈추지 않고 끝까지 GPU를 점유한다.
  3. 또한 `lastModel`(`ollama.ts:14, 63`)은 응답이 정상 완료된 뒤에만 갱신되므로, 모델 교대 호출이 중간에 타임아웃/취소되면 실제 Ollama VRAM에는 새 모델이 올라가 있는데 `lastModel`은 이전 모델로 남아 이후 타임아웃 계산이 뒤집힌다.
- **재현 방법**:
  1. `POST /api/reply` 호출 직후 브라우저에서 요청을 `abort()`하거나 레일 토글을 OFF로 전환.
  2. `route.ts:28`의 `reviewReply()`와 `ollama.ts:53`의 `chat()`은 `req.signal`을 확인하지 않으므로 최대 6턴(`MAX_TURNS = 6`) 동안 Ollama 호출을 계속 수행하며 뒤이은 `POST /api/extract/quote` 요청을 대기열에서 블로킹함.
- **해결**:
  1. `ollama.ts`에 서버 단일 Promise 체인 뮤텍스(`withGpuQueue(jobId, signal, fn)`)를 두고, 대기 중(`queued`)인 작업은 토글 OFF 시 즉시 큐에서 제거하며, 실행 중(`running`)인 작업은 `AbortSignal.any([signal, AbortSignal.timeout(...)])`로 `fetch`를 중단하고 `agent.ts:160` 루프 매 턴 시작마다 `if (signal?.aborted) break`를 검사한다.
  2. `lastModel`은 요청 완료 시점이 아니라 Ollama에 `/api/chat` 요청을 **보내는 시점**에 갱신(또는 실패 시 `""`로 초기화해 보수적으로 `COLD_TIMEOUT_MS` 적용)해야 한다.

---

### 문제 5. LLM 에이전트 토글 OFF 시 작동하는 '수동 입력/수동 반영 대체 경로'가 검증기(`verifyDraft`, `NOT_PLAIN_YES`)를 우회하여 거짓 '명시됨(✓)' 카드를 생성함
- **위치**: `runs/out/b008-design.sonnet.md:97, 124, 156, 160`, [`web/src/components/InputView.tsx:46, 126-161`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InputView.tsx#L126-L161), [`web/src/lib/rules.ts:82-88`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L82-L88)
- **원인**:
  1. `문서 읽기관(LLM)`을 끄거나 읽은 뒤 사용자가 `QuoteForm`(`InputView.tsx:46, 126-161`)에서 직접 차량(`"1톤"`), 인원(`2`), 사다리차(`"포함"`), 품목을 입력하면 `verifyDraft()`(`web/src/lib/verify.ts:19`)를 거치지 않고 `state.draft`에 저장된다.
  2. 그런데 `rules.ts:82-88, 102`는 `quote.truck`, `quote.workers`, `quote.ladder === "포함"`이 있으면 원문(`quoteText`) 존재 여부와 무관하게 무조건 `status: "명시됨"`, `why: "견적서에 '...'로 적혀 있습니다."`, `ask: ""`로 판정한다.
  3. 즉 견적서 원문이 없거나 원문에 인원·사다리차가 안 적혀 있는데도, `문서 읽기관`을 끄고 직접 입력 폼에 값을 적으면 **원문에 없는 내용이 "견적서에 적혀 있습니다(✓ 명시됨)"로 둔갑하고 확인 질문이 사라진다**(K2의 "원문 대조 검증기는 토글 밖의 필수 처리" 위반).
  4. 마찬가지로 `답변 점검관(LLM)`을 껐을 때 제공하겠다는 "카드별 수동 `답변 반영`"(`runs/out/b008-design.sonnet.md:124`)이 `agent.ts:94-101`의 `notPlain(quote, total)`(`NOT_PLAIN_YES`) 및 원문 부분 문자열 검사를 거치지 않으면, 조건부 답변(`"당일 보고 추가요"`)도 수동 버튼 한 번에 `명시됨`으로 바뀐다.
- **재현 코드**:
  ```ts
  import { compare } from "./web/src/lib/rules.ts";
  import { QUOTE_DRAFT, SAMPLE_CONDITIONS, SAMPLE_ITEMS } from "./web/src/lib/fixtures.ts";

  // 견적서 원문에는 사다리차와 인원이 전혀 없지만, 문서 읽기관을 끄고 직접 입력 폼에서 입력한 상태:
  const manualDraft = { ...QUOTE_DRAFT, workers: 2, ladder: "포함" as const };
  const result = compare(SAMPLE_ITEMS, manualDraft, SAMPLE_CONDITIONS);
  const ladderCard = result.find((c) => c.id === "ladder")!;
  // 결과: ladderCard.status === "명시됨", ladderCard.why === "견적서에 '사다리차 포함'로 적혀 있습니다.", ladderCard.ask === ""
  ```
- **해결**:
  1. `QuoteForm` 직접 입력 값 중 붙여넣은 `quoteText`에서 `verifyDraft()`로 확인되지 않는 값은 출처를 `"사용자 직접 입력 (견적서 원문 미확인)"`으로 분리 기록하고, 원문 발췌(`evidence`)가 없으면 `명시됨` 대신 `포함 여부 미확인`(또는 `"직접 입력됨 · 견적서 기재 확인 필요"`)으로 유지해야 한다.
  2. `답변 점검관`이 꺼졌을 때의 수동 답변 반영 역시 반드시 선택한 답변 문장(`quote`)에 대해 `makeTools(cards, reply, total).propose_updates()`(`web/src/lib/agent.ts:81`)와 동일한 검증 함수를 통과해야만 `명시됨` 승인이 가능하도록 강제해야 한다.

---

## 3. 조건부 승인 조건 (이 조건들이 반영되면 D006 전체 승인)

1. **[검증기 보강 — K1·K2·K6]**
   - `verifyDraft()`(`web/src/lib/verify.ts:7-14, 44-55`)에서 금액(`amountsIn`)은 `'원'` 또는 금액 문맥이 있는 숫자만 추출하고, 총액·계약금·별도 비용·작업 인원이 다른 항목의 숫자(`사다리차 15만원`, `1인 가구`, `11월 14일`)와 교차 매칭되지 않도록 항목별 원문 구절(`quote`) 단위로 검증할 것.
   - `intake.ts`(조건 해석 검증기)는 층수 검증 시 반드시 `(지하\s*)?\d+\s*층` 단위를 확인하고, 부정어·빌트인(`빌트인|안\s*옮|빼고|제외`)이 붙은 품목은 `move: true`로 확정하지 말 것.
   - 에이전트 토글 OFF 시 사용하는 **직접 입력 폼(`QuoteForm`)과 수동 답변 반영 UI도 `verifyDraft()` 및 `notPlain()`(`NOT_PLAIN_YES`) 검증기를 우회하지 못하게** 강제할 것.
2. **[GPU 대기열·취소·시연 시간 예산 — K2·K10]**
   - `web/src/lib/ollama.ts`에 서버 단일 뮤텍스 큐와 `req.signal` 연동 `AbortSignal`을 구현하고, `lastModel`은 요청 시작 시점(실패 시 초기화) 기준으로 관리할 것.
   - RTX 2080 SUPER 8GB에서 `ax4-light`와 `qwen3`는 동시 상주가 불가능하므로, **3분 실시간 시연 대본에서 백그라운드 선로딩으로 모델 교대(37~112초)를 숨긴다는 가정을 삭제**하고, 라이브 시연 중에는 모델 교대 0회(교대가 필요한 단계는 사전 실행 실측 결과 재생으로 명시 분리)로 구성할 것.
3. **[장면 규모 감축 및 동기화 단일화 — K3·K9·K11]**
   - 장면 코드는 ① `lucide-react` 아이콘 재사용(`tools.tsx` 제거), ② 3분할 반응형 미니 SVG Grid(데스크톱/모바일 단일 좌표계), ③ 10명 개별 상태의 하단 `AgentStrip` 통합, ④ 기존 `Overview`/`InquiryPanel` 컴포넌트 재사용을 통해 **1,300~1,500줄에서 600줄 이하로 감축**하고, 구현 순서에서 **P0-6(다중 견적·업체 고르기)을 P0-4(장면) 앞으로 배치**할 것.
   - 장면-표 동기화는 비동기 이벤트 누적 큐를 따로 두지 않고 **`cardsOf(state)` 단일 파생 배열 + `revealedCount` 정수 커서 1개**로 구동해 React 19 리렌더/탭 전환 시 불일치를 원천 차단할 것.
   - 팔레트 A 장면에서 트럭(`#2F6DB5`)과 겹치는 `옷 1(#2F6DB5)`은 트럭에서 떨어진 채비팀에만 쓰고, 트럭 주변 견적팀은 `옷 2(#B84A18)`, 도착 집 안심팀은 팔레트 A의 검증된 초록(`#2E7D4F` / 다크 `#5CC184`) 또는 밝은 조끼(`#FFFDF9`) + 팀 기호 배지(`①/②/③`)로 구분할 것.
4. **[다중 견적 상태 격리 및 하위 호환 — K5·K7·K11]**
   - `CaseState` v3에서 견적별 `overrides`·`inquiry`·`runs`를 `QuoteEntry` 단위로 격리하고, `sigOf()`에 `quoteId`와 `cond`·`items` 서명을 포함해 타 업체 승인 오염 및 조건 변경 시 미무효화 버그를 차단할 것.
   - `sessionStorage` 로드 시 `isa-case-v2 → v3` 마이그레이션 함수를 두고, 기존 `rules.test.ts` 22개 단위 테스트가 깨지지 않도록 `store.ts` 셀렉터 호환성을 유지할 것.
   - 관악구 허가 업체 CSV(`15080952`, 39행)는 빌드 전 **`전화번호` 열을 물리적으로 삭제**하고 `업체명·인허가일자·영업상태명·구분·소재지주소(동/도로명)·데이터기준일자`만 남긴 정적 JSON으로 포함할 것.
