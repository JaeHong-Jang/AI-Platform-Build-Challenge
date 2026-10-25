## p.5 AI는 어디서 무엇을 (문항 3 · AI 적용 방식·활용 데이터·기술 구성)

> **핵심 한 문장: "AI는 비정형 문장과 견적·답변을 읽고 질문 후보를 제안하며, 판정·숫자·최종 반영은 결정론적 코드 검증기와 사람 승인이 통제합니다."**

### 1. 에이전트 10명 구성 (1 + 3×3 하네스 — 10개 작업 역할 중 LLM 3 · 규칙 7)
- **설계 원칙 (`[구현됨]`)**: 모든 단계에 LLM을 쓰면 없는 약관 조항이나 부피·가격을 지어낼 위험이 크다. 이사 지킴이는 **비정형 한국어 텍스트(한 줄 조건·견적서·업체 답변)를 구조화하는 3곳에만 로컬 LLM**을 배치하고, **대조 판정·질문 문장 생성·견적 비교·서류 및 계약금 비율 계산 등 7곳은 결정론적 규칙 에이전트**로 분리했다([`agents.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/agents.ts#L19-L30)).
- **개별 제어와 격리 (`[구현됨]`)**: 지휘관을 제외한 9개 역할은 사용자가 화면 왼쪽 레일과 장면 하단에서 개별 토글(ON/OFF)할 수 있다. 특정 LLM 에이전트를 끄더라도 직접 입력 경로로 하류 규칙 에이전트가 정상 작동하며, **원문 대조 검증기와 명시 판정 규칙은 어떤 경우에도 끌 수 없다**([`Dashboard.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L36-L46), [`rules.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L44-L54)).

`[그림 4: 에이전트 10명(1+3×3) 하네스 구성도 — 상단 중앙에 '◆ 지휘관(규칙 · 상시 켜짐: 단계 순서 배정 및 산출물 보고)'을 두고, 아래에 3개 팀 열을 배치한다. ① 채비팀(파랑 #2F6DB5): 조건 해석관(LLM ax4-light, 주황 강조 테두리) · 짐 점검표관(규칙, 회색) · 서류 안내관(규칙, 회색) / ② 견적팀(황토 #B84A18): 문서 읽기관(LLM ax4-light, 주황 강조 테두리) · 견적 대조관(규칙, 회색) · 업체 고르기 도우미(규칙, 회색) / ③ 안심팀(초록 #2E7D4F): 문의 작성관(규칙, 회색) · 답변 점검관(LLM qwen3:4b, 주황 강조 테두리) · 계약 점검관(규칙, 회색). 하단 전체를 감싸는 고정 안전 띠로 '원문 대조 검증기(verify.ts) + 명시 판정 규칙(plain.ts) + 사람 승인 게이트(끌 수 없음)'를 표시한다.]`

- **◆ 지휘 (상시 작동 · 규칙 1)**
  - **지휘관 (`conductor`, 규칙 · 끌 수 없음)**: 9개 에이전트의 실행 순서를 배정하고, 각 역할이 실제로 만든 산출물과 걸러낸 건수를 집계해 홈 장면에 보고한다([`pipeline.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/pipeline.ts#L12-L47)).
- **① 채비팀 (`#2F6DB5` · LLM 1 + 규칙 2 — 내 조건과 기준 세우기)**
  - **조건 해석관 (`intake`, LLM `ax4-light:q4_K_M`)**: 사용자가 입력한 한 문장(예: *"지금 3층 엘베 없음에서 새 집 5층 엘베 있음으로 이사, 냉장고는 빌트인"*)에서 집 유형·출발/도착 층수·엘리베이터 유무·짐 이름을 JSON 스키마로 읽는다([`intake.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L8-L25)).
  - **짐 점검표관 (`itemlist`, 규칙)**: 집 유형별로 빠뜨리기 쉬운 확인용 짐 후보를 **이름만** 제시한다. 공인 표준 이사부피·적재 보정계수 근거가 없으므로(`unknown`), 부피(㎥)·차량 톤수·수량을 자동 추정하지 않으며 사용자가 확인한 짐만 대조에 넣는다([`intake.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L91-L103)).
  - **서류 안내관 (`docguide`, 규칙)**: 이사화물 표준약관(제10035호) 제4조·제5조 제2항 기준 견적서·계약서 필수 기재 항목 점검표를 제공한다 [20]([`docs.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts#L9-L37)).
- **② 견적팀 (`#B84A18` · LLM 1 + 규칙 2 — 받은 견적 읽고 빈칸 찾기)**
  - **문서 읽기관 (`reader`, LLM `ax4-light:q4_K_M`)**: 사용자가 붙여넣은 카톡·문자·앱 견적서(최대 3건)에서 업체명·총액·계약금·차량·작업 인원·사다리차·계단 문구·품목 발췌·뭉뚱그린 문구(`'원룸 짐 일체'` 등)·추가비 문구를 구조화 추출한다([`verify.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L29-L75)).
  - **견적 대조관 (`matcher`, 규칙)**: 내 짐·작업조건과 견적 초안을 3대 규칙(① 품목 포함 여부 ② 작업조건·차량·인원·장비 기재 여부 ③ 당일 추가비 조건)으로 대조해 각 항목을 **`명시됨 / 포함 여부 미확인 / 조건 모호 / 판독 불가`** 4가지 상태로만 판정한다([`rules.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L56-L192)).
  - **업체 고르기 도우미 (`picker`, 규칙)**: 후보 견적 최대 3건을 동일 점검 항목 행으로 나란히 비교하고, 관악구 허가업체 공공데이터와 상호를 대조한다. 평점·순위·자동 추천 강조는 하지 않는다([`QuotesView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L91-L135), [`permits.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L31-L40)).
- **③ 안심팀 (`#2E7D4F` · LLM 1 + 규칙 2 — 묻고 답 점검하고 계약서 확인하기)**
  - **문의 작성관 (`asker`, 규칙)**: `'명시됨'`이 아닌 카드마다 업체에 바로 복사해 보낼 확인 질문 문장과 표준약관 참고 조항(제4조·제5조 제3항·제8조 제2·3항 [20])을 연결한다([`rules.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L61-L156), [`references.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/references.ts#L9-L46)).
  - **답변 점검관 (`replycheck`, LLM `qwen3:4b-instruct-2507-q4_K_M`)**: 업체 답변 원문에서 미확인 카드에 대응하는 근거 문장을 찾아 갱신 후보(`explicit_answer / conditional_answer / conflicting / unanswered`)를 제안하는 다중 턴 도구 호출 에이전트다([`agent.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/agent.ts#L63-L128)).
  - **계약 점검관 (`contract`, 규칙 `[구현됨]` + LLM 읽기 `[계획: P1]`)**: 현재 계약서 필수 기재 항목(제5조 제2항) 대조 및 원문 확인된 총액 대비 계약금 10% 초과 여부(제6조)를 규칙으로 점검하며 [20], 본선 전 비정형 계약서 전문 LLM 읽기(`contractDraftSchema`)를 추가할 계획이다([`docs.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts#L18-L44)).

---

### 2. 로컬 Ollama 이중 모델 구성과 왜 로컬(On-Device/Local)인가
- **왜 로컬 LLM인가 — 개인 견적 정보의 외부 유출 원천 차단 (`[구현됨]`)**
  - 이사 견적서와 업체 대화에는 **출발·도착지 주소, 층수, 이사 일시, 업체명, 계약 금액, 가구 목록** 등 민감한 개인 생활 정보가 담긴다.
  - 이사 지킴이는 외부 상용 클라우드 API로 문서를 전송하지 않고, 사용자 PC/로컬 서버의 **Ollama (`127.0.0.1:11434`)** 와 브라우저 **`sessionStorage`(서버 DB 무저장)** 안에서만 처리한다([`ollama.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L27-L32), [`store.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/store.ts#L2)). 또한 계약서 점검 시에도 주민등록번호는 수집·요구 항목에서 명시적으로 제외했다([`docs.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts#L9)).
- **역할별 로컬 모델 분리와 선정 근거 (`[구현됨 · 실측 완료]`)**
  - **읽기 전용 (`ax4-light:q4_K_M`) → 조건 해석관·문서 읽기관**: 한국어 어휘 이해가 자연스러운 A.X 4.0 Light 모델을 사용하되, 느슨한 `format: "json"`이 아니라 **Zod → JSON 스키마(`format: z.toJSONSchema(schema)`, `temperature: 0`, `num_ctx: 8192`)** 를 강제했다([`ollama.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L74-L93)). 사전 실측(`b007-ollama.sonnet.md`)에서 `format: "json"`은 스키마 준수율이 1/10에 그쳤으나, JSON 스키마 강제 시 파싱 오류 0건(필드 정오 9/10, 원문 인용 일치 5/5)을 기록했다.
  - **도구 호출 전용 (`qwen3:4b-instruct-2507-q4_K_M`) → 답변 점검관**: `get_open_cards`(미확인 카드 조회) → `find_in_reply`(키워드 문장 검색) → `propose_updates`(갱신 후보 제출·검증기 피드백 수신) → `finish`(종료) 4개 도구를 최대 6턴·8회 한도로 호출한다([`agent.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/agent.ts#L10-L128)). 사전 실측에서 `qwen2.5:7b`는 2턴째 도구 결과 수신 후 호출 형식이 3회 모두 깨졌고, `ax4-light`는 코드 검증 거절(3건/회)이 발생한 반면, **`qwen3:4b-instruct`만 다중 턴 도구 루프를 형식 오류 0건·오탐 0건으로 완주**했다.
- **단일 GPU 대기열(`onGpu`)과 취소 전파 (`[구현됨]`)**: 8GB VRAM 환경에서 두 모델이 동시에 올라가 경합하는 것을 막기 위해 서버 전역 단일 작업 대기열(`onGpu`)로 직렬화하고, 사용자가 에이전트 토글을 끄면 클라이언트 `AbortController` → 서버 `req.signal`로 즉시 생성이 중단되며 결과가 상태에 덮어써지지 않는다([`ollama.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L55-L84), [`Dashboard.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L36-L46)).

---

### 3. 활용 데이터 및 출처·접근 방법·이용 조건
- **① 사용자 입력 원문 (`[구현됨]`)**: 사용자가 직접 입력·붙여넣은 한 줄 조건, 외부 견적서(최대 3건), 업체 답변, 계약서 텍스트. 브라우저 `sessionStorage`에만 머물며 외부 전송·영구 저장이 없다.
- **② 이사화물 표준약관 (공정거래위원회 표준약관 제10035호, 2014-09-19 개정 확인 판본) [20] (`[구현됨]`)**:
  - **출처·접근**: 법제처 찾기쉬운 생활법령정보(https://m.easylaw.go.kr/MOB/CsmInfoRetrieve.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=666, https://m.easylaw.go.kr/MOB/CsmInfoRetrieve.laf?ccfNo=3&cciNo=1&cnpClsNo=1&csmSeq=629) 및 표준약관 공개 전문(https://ydnara.com/yakgwan.html). 공정위 원문 게시 경로 [21](https://www.ftc.go.kr/www/selectBbsNttView.do?key=202&bordCd=201&nttSn=11148)는 조회 시점 403 응답으로 최신 개정 여부는 `unknown`이며, 화면에 `"확인 판본: 제10035호(2014-09-19 개정) · 공정위 최신 원본 대조 전 · 법률 자문 아님"`을 명시한다([`docs.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts#L4), [`references.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/references.ts#L48-L49)).
  - **활용 조문**: 제4조(견적서 기재 항목), 제5조 제2항(계약서 기재 항목), 제5조 제3항(견적 초과 계약금 원칙 금지 및 고객 요청·사전 고지 예외), 제6조(계약금 합계액 10% 한도), 제8조 제2·3항(계약 초과 청구·수고비 요구 금지). **LLM이 조문을 생성하지 않고 정적 참조표 ID(`art4`~`art8-3`)만 연결**한다.
- **③ 서울특별시 관악구 화물자동차운송주선사업 허가업체현황 (공공데이터포털 `15080952`) (`[구현됨]`)**:
  - **출처·이용 조건**: 공공데이터포털 파일데이터(https://www.data.go.kr/data/15080952/fileData.do, 기준일 2026-04-24, **무료 · 이용허락범위 제한 없음**).
  - **개인정보 비식별 전처리**: [`gwanak-permits.py`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/scripts/gwanak-permits.py)로 원본 CSV의 **전화번호·위도·경도 열과 상세 호수를 물리적으로 삭제**해 [`gwanak-permits.json`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/data/gwanak-permits.json)(총 39행: 영업중 이사화물 26건·일반/이사 1건·일반화물 12건)으로 내장했다. 상호 대조 시 `'일반'`(일반화물) 업종은 이사화물 허가가 아님을 분리 안내하며, 목록 미등재를 무허가로 단정하지 않고 허가증 사본 대조를 권고한다([`permits.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L8-L40)).
- **④ 한국소비자원 피해예방주의보 및 카드뉴스 (2026-04-21) [1][19] (`[구현됨]`)**:
  - **출처**: 한국소비자원 보도자료(https://www.kca.go.kr/home/sub.do?menukey=4005&mode=view&no=1004458186&page=1) [1] 및 카드뉴스(https://www.kca.go.kr/smartconsumer/sub.do?cate=00000051&menukey=7714&mode=view&no=1004455170) [19].
  - **활용 내용**: 이사 피해구제 신청 추이(2023년 603건 → 2024년 785건 → 2025년 961건 [1]), 2025년 소규모 이사(10만~100만 원) 241건 중 20~30대 비중 65.1%(157건) [1], 피해 유형(중복 집계 281건 기준 파손·분실 47.7%·134건, **추가비용 요구 24.9%·70건**, 이행 거부·계약불이행 13.9%·39건 [1]) 및 계약 전 상세 기재·허가·이사화물배상책임보험 확인 권고 [19]를 점검 항목의 근거로 제시한다([`Records.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Records.tsx#L13-L25)).

---

### 4. 정확도·신뢰성 장치 5종과 실측 실패 차단 기록 (D006)

`[그림 5: 데이터 → AI(LLM 3) → 코드 검증기 → 사람 승인 4단계 안전 흐름도 — 1단계(입력): 사용자 문장·견적서·답변 원문 투입 → 2단계(LLM 초안): ax4-light / qwen3:4b가 JSON 초안·도구 호출 후보 생성 → 3단계(결정론적 검증기 게이트, 끌 수 없음): verifyDraft·verifyIntake(원문 부분문자열·금액 구절·인원 정규식 대조) + notPlain('별도·협의·당일 보고' 포함 시 명시됨 차단) + manualOf(직접 입력 우회 차단), 통과 못한 값은 '근거 장부(걸러낸 값·거절된 후보)'로 분리 기록 → 4단계(사람 승인 & 온톨로지 그래프): 사용자가 원문 옆에서 최종 승인한 값만 확인 카드 상태와 4열/Force 근거 그래프에 반영됨.]`

- **5중 정확도 장치 (`[구현됨]`)**
  1. **원문 대조 검증기 (`verifyDraft` · `verifyIntake`)**: 모델이 추출한 발췌·품목·차량·계단 문구가 붙여넣은 원문에 실제로 존재하는지(`src.includes(norm(s))`) 검사한다. 금액(`amountsIn`·`amountFor`)은 단위(`만·천·원`)나 쉼표가 있는 숫자만 추출한 뒤 해당 구절이 총액 자리인지 계약금·별도·사다리 자리인지 문맥까지 대조하며, `'1인 가구'`·`'2인용'`의 숫자를 작업 인원으로 읽지 못하게 정규식(`(?<!\d)N\s*(명|인)(?!\s*(가구|용|분|실|승))`)으로 차단한다([`verify.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L11-L75)).
  2. **명시 판정 규칙 (`notPlain` · `manualOf`)**: 품목이나 업체 답변이 원문에 있더라도 `'별도·제외·당일 보고·협의·결정·직접·만원'` 등 조건·비용·고객 부담 표현이 들어 있으면 절대 `'명시됨(총액 포함)'`으로 판정하지 않고 `'조건 모호'`로 묶는다([`plain.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/plain.ts#L4-L19)). 사용자가 수동 입력한 값도 원문에서 확인되지 않으면 `'포함 여부 미확인'`으로 유지된다([`rules.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L44-L54)).
  3. **사람 승인 게이트 (Human-in-the-Loop)**: 조건 해석 초안, 견적 읽기 초안, 답변 점검관의 갱신 제안(`Proposal`) 모두 사용자가 원문과 비교해 직접 승인하기 전에는 카드 상태를 바꾸지 않는다([`InquiryPanel.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx)).
  4. **근거 장부 (`Ledger` · `evidenceSummary`)**: 모델 읽기 횟수, 원문에 없어 **걸러낸 값(`dropped`)**, 검증기가 **거절한 AI 후보(`rejected`)**와 사유, **승인된 답변(`approved`)**을 숨기지 않고 화면 상단 요약과 노드로 노출한다([`kgraph.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/kgraph.ts#L56-L136)).
  5. **온톨로지 근거 그래프 (`GraphView` · `ontology.ts`)**: 확인 항목마다 `내 입력 → 확인 항목 → 근거(견적서 원문·업체 답변·원문 없음) → 참고 조항·업체에 물을 것` 4열 사슬과 어두운 배경의 힘-배치(Force-directed) 지식 그래프로 연결한다. **모델은 그래프 노드를 생성할 수 없다**([`ontology.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ontology.ts#L1-L56), [`GraphView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/GraphView.tsx#L84-L257)).
- **실측 실패 사례와 검증기 작동 기록 (`[구현됨 · D006 실측]`)**
  - **실패 사례 1 (원문에 없는 `'사다리차 별도'` 환각 → 자동 제거)**: 가상 견적 A 원문에는 사다리차 언급이 없었으나 `ax4-light`가 `ladder: "별도"`를 지어냈다. `verifyDraft`가 원문에 `'사다리'` 글자가 없음을 감지해 즉시 `"미기재"`로 되돌리고, 화면과 근거 장부에 `사다리차: '별도' (원문에 사다리 언급 없음)`으로 표시했다([`verify.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L40-L41)).
  - **실패 사례 2 (`'지금 3층 엘베 없음'` 누락 및 `'빌트인'` 오분류 → 규칙 보완)**: 조건 해석 시 `ax4-light`가 `'지금 3층 엘베 없음'`에서 엘리베이터를 `"모름"`으로 읽거나 `'빌트인 냉장고'`를 옮길 짐(`move: true`)으로 내보낸 사례가 실측되었다. `verifyIntake`가 해당 집 구절(`clauseWithFloor`)의 `'엘베 없음'`과 부정 표현(`NOT_MOVE`)을 대조해 각각 `elevator: "없음"`, `move: false`로 교정했다([`intake.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L41-L84)).
  - **실패 사례 3 (모호한 문구의 `'포함'` 둔갑 차단)**: 원문이 `"사다리차 필요 시 별도 7만원"`이거나 `"냉장고 운송은 협의 후 결정"`일 때 모델·수동 입력이 이를 `'포함'`으로 넘기려 해도, `verifyDraft`와 `rules.ts`가 원문 문장 전체에 `notPlain`을 적용해 `'명시됨'` 승격을 차단하고 확인 질문을 유지했다([`verify.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L42-L46), [`rules.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L67-L74)).
- **실측 응답 시간 (로컬 RTX 2080 SUPER 8GB, Warm 상태 기준, D006·B009 실측)**
  - **조건 해석관 (`ax4-light`)**: **2~9초** / **문서 읽기관 (`ax4-light`)**: 단건 **약 4.4초**, 견적 2건 연속 **7~9초** / **답변 점검관 (`qwen3:4b`, 도구 호출 4~5회)**: **6~13초** (단위 루프 6초, 브라우저 전 흐름 10~13초) / **규칙 에이전트 7종**: **즉시 (수 ms 이내)** *(단, 첫 호출 Cold Load 시 모델 적재에 37~112초가 걸릴 수 있어 180초 콜드 타임아웃과 사전 적재를 적용함).*

`[표 3: AI·규칙 기능 명세 및 정확도 장치 — 열 구성: 기능 | AI/규칙 | 근거 자료 | 정확도 장치 | 추가요금 분쟁 감소 기여]`

| 기능 | AI/규칙 | 근거 자료 | 정확도 장치 | 추가요금 분쟁 감소 기여 |
|---|---|---|---|---|
| **F1. 한 문장 조건 해석** (`조건 해석관` + `짐 점검표관`) | **LLM** (`ax4-light`) + **규칙** (`[구현됨]`) | 사용자 한 줄 문장, 영구이사 원룸 안내(빌트인 구분 참고 [b008-data]) | JSON 스키마 강제, `verifyIntake`(`(지하)?N층`·출발/도착 구절 분리·`NOT_MOVE` 빌트인 제외), 수량·부피 추정 금지, 사용자 확인 후 반영 | 계약 전 누락되기 쉬운 층수·엘리베이터·대형 가전 조건을 빠짐없이 대조 기준에 등록 (효과 수치는 검증 가설) |
| **F3. 다중 견적 구조화 읽기** (`문서 읽기관`) | **LLM** (`ax4-light`) (`[구현됨]`) | 사용자가 붙여넣은 외부 견적서 원문 (최대 3건) | `verifyDraft` 원문 부분문자열 대조, 총액↔계약금·별도 구절 분리(`amountFor`), `'1인 가구'` 인원 오탐 차단, 걸러낸 값(`dropped`) 근거 장부 공개 | 구두·카톡 견적서에서 총액에 포함된 것과 빠진 것(차량·인원·사다리·뭉뚱그린 문구)을 원문 근거와 함께 분리 |
| **F4~F6. 견적 대조 · 비교표 · 업체 문의 작성** (`견적 대조관` · `업체 고르기 도우미` · `문의 작성관`) | **규칙** (`LLM 호출 0회`) (`[구현됨]`) | 내 짐·조건, 검증된 견적 초안, 표준약관 제10035호 제4조·제5조 제3항·제8조 제2·3항 [20], 관악구 허가업체 공공데이터(`15080952`), 소비자원 권고 [1][19] | 결정론적 4상태 판정(`명시됨/미확인/조건 모호/판독 불가`), `notPlain` 조건부 문구 차단, `manualOf` 수동 입력 우회 차단, 순위 없는 고정 행 비교표, 업종(`이사` vs `일반`) 구분 표시 | 이삿날 추가비용 요구의 주원인인 짐의 양·건물 구조·사다리차 미기재 항목 [1]을 계약금 송금 전에 업체 확인 질문으로 전환 |
| **F7. 후보별 업체 답변 점검** (`답변 점검관`) | **LLM 에이전트** (`qwen3:4b` 도구 호출) + **규칙 검증** (`[구현됨]`) | 붙여넣은 업체 답변 원문, 미확인·조건 모호 카드 목록 | 4개 도구 제한(`MAX_TOOL_CALLS=8`), 답변 원문 일치·품목 키워드 검사, `notPlain`으로 `'당일 보고·별도'` 답변의 `'명시됨'` 승격 거절(`rejected` 기록), **사용자 체크 승인 후에만 반영** | 업체가 구두·카톡으로 모호하게 넘긴 답변(`"당일 보고 결정"`)을 완료로 착각하지 않게 막고 재확인 유도 |
| **F8. 계약서·서류·계약금 점검** (`서류 안내관` · `계약 점검관`) | **규칙** (`[구현됨]`) + **LLM 읽기** (`[계획: P1]`) | 표준약관 제10035호 제4조·제5조 제2항·제6조(계약금 10% 한도) [20], 붙여넣은 계약서 텍스트 | 원문에서 총액·계약금이 모두 확인된 경우에만 10% 비율 계산(`depositRatio`), 주민등록번호 수집 제외, 약관 예외 요건 생략 금지 | 계약금 과다 청구 위험을 사전에 경고하고, 합의된 추가서비스·비용이 계약서 본문에 적혔는지 최종 확인 |

---

## p.7 어떻게 만들 것인가 (문항 5 · 구현 계획·역할 분담·검증 계획)

> **핵심 한 문장: "핵심 파이프라인과 코드 검증기는 이미 실제 동작하는 웹으로 구현했고, 본선 해커톤(11/27)까지는 합성 평가셋 80건 정량 검증과 계약서 AI 읽기를 완주합니다."**

### 1. 현재 구현된 범위(실제 동작) vs 본선(11/27 하루 해커톤)까지 할 것
- **정직한 구현 상태 선언**: 예선 제출일(2026-10-25) 기준 이사 지킴이 웹 프로토타입(v0.3)은 단순 화면 모형이 아니라 **Next.js 16 + 로컬 Ollama(`ax4-light`, `qwen3:4b`) + 결정론적 검증기 + 단위 시험 60개가 실제로 동작하는 상태**다(D006 구현 기록). 대회 공고상 본선 사전 기간(11/02~11/25 ‘서비스 개발 및 최종 산출물 제출’)과 본선 해커톤(11/27 09:00~18:00)이 함께 안내되어 있으며, 기존 코드 재사용 세부 규정은 `unknown`이므로 [28] 11/26 오프라인 멘토링에서 허용 범위를 확인하고 당일 현장에서도 핵심 모듈(P0)을 독립 재구축·시연할 수 있도록 설계했다.

`[표 4: 우선순위별 구현 범위 (현재 구현됨 vs 본선 계획) — 열 구성: 구분 | 모듈 및 기능 | 상태 (2026-10-24 기준) | 검증·근거 기록 | 본선(11/27)까지 추가·완성할 일]`

| 구분 | 모듈 및 기능 | 상태 (2026-10-24 기준) | 검증·근거 기록 | 본선(11/27)까지 추가·완성할 일 |
|---|---|---|---|---|
| **P0 (필수 핵심 흐름)** | **원문 대조 검증기 (`verifyDraft`, `verifyIntake`, `notPlain`, `manualOf`)** | **`[구현됨 · 실제 동작]`** | 단위 시험 60개·Playwright 전 흐름 통과([`verify.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts), [`intake.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts), [`plain.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/plain.ts)) | **`[계획]`** 합성 평가셋(견적 40·답변 40건) 기반 엣지 케이스 전수 시험 및 오반영률 측정 |
| **P0 (필수 핵심 흐름)** | **로컬 Ollama 연동 (`ax4-light` 읽기 · `qwen3:4b` 답변 에이전트) + 단일 GPU 대기열·취소** | **`[구현됨 · 실제 동작]`** | 조건 해석 2~9초, 견적 읽기 4.4~9초, 답변 점검 6~13초 실측, 토글 OFF 시 즉시 취소 확인([`ollama.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts), [`agent.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/agent.ts)) | **`[계획]`** 본선 시연용 **모델 교대 0회** 워밍업 스크립트 및 사전 실행 재생 모드 고정 |
| **P0 (필수 핵심 흐름)** | **다중 견적(3건) 대조 · 고정 행 비교표 · 업체 문의 작성 · 관악구 허가 목록(39행) 대조** | **`[구현됨 · 실제 동작]`** | 견적별 상태 격리(`QuoteEntry`), 전화·좌표 물리적 제거 완료, `이사(26)`/`일반(12)` 구분 안내([`QuotesView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx), [`permits.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts)) | **`[계획]`** 카톡 전송용 요약 문의 문장 복사 모드 및 비교표 항목 필터 UX 다듬기 |
| **P0 (설명 가능성)** | **에이전트 10명(1+3×3) 관제 · 3분할 미니 SVG 장면 · 4열 근거 사슬 · Force 온톨로지 그래프 · 근거 장부** | **`[구현됨 · 실제 동작]`** | 장면 코드 458줄, 콘솔 오류 0건, 390px 모바일 가로 넘침 0건([`Stage.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx), [`GraphView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/GraphView.tsx), [`kgraph.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/kgraph.ts)) | **`[계획]`** 홈 장면 상자 클릭 시 근거 그래프 해당 노드로 즉시 점프하는 역방향 연결 보강 |
| **P1 (본선 확장)** | **계약서 비정형 전문 LLM 추출 (`contractDraftSchema`) 및 견적서↔계약서 불일치 대조** | **`[부분 구현 — 현재 규칙 점검]`** | 현재 표준약관 제5조 기재 항목 키워드 및 제6조 계약금 10% 비율 규칙 점검 동작([`docs.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts)) | **`[계획: 11/11~11/20]`** 계약서 본문에서 특약·추가비용 조항을 `ax4-light`로 추출(주민번호 제외)하고 승인된 업체 답변과 일치하는지 대조 |
| **P1 (본선 확장)** | **공정위 표준약관 원본 대조 및 타 자치구 허가업체 정적 JSON 확장** | **`[계획]`** | 현재 생활법령 확인 판본(제10035호) 및 관악구(`15080952`) 적용 완료 [20] | **`[계획: 11/02~11/15]`** 공정위 원본 전문 최종 대조, 서울시 내 청년 밀집 자치구 공공데이터 CSV 추가 변환 |
| **P2 (선택 고도화)** | **브라우저 로컬 OCR (`tesseract.js`) 이미지 견적서 텍스트 변환** | **`[계획 — 후보]`** | 현재 텍스트 붙여넣기·직접 입력 방식으로 OCR 오류 0 보장 (`b007-ollama.sonnet.md`) | **`[계획: 11/18~11/25]`** 종이·캡처 견적서 이미지를 서버 전송 없이 브라우저에서 텍스트로 변환 후 `verifyDraft`에 연결 시험 |

---

### 2. 개발 단계 일정 (2026.10.25 ~ 11.27) 및 팀 역할 분담

`[그림 6: 개발 단계 간트 차트 (2026.10.25 ~ 11.27, 5주 타임라인) — 가로축: 1주차(10/25~11/01 예선 제출·평가셋 설계) → 2주차(11/02~11/09 온라인 교육·합성 평가셋 80건 구축·벤치마크 자동화) → 3주차(11/10~11/17 계약서 LLM 스키마 P1 구현·약관 원본 대조) → 4주차(11/18~11/25 타 자치구 허가 JSON 확장·브라우저 OCR 연동·산출물 제출) → 5주차(11/26 오프라인 멘토링 피드백 반영 → 11/27 09:00~18:00 본선 해커톤 당일 구현·80건 실측 검증·모델 교대 0회 라이브 시연). 완료된 기반(G0~G7 프로토타입·단위시험 60개)은 출발점(10/24 완료 배지)으로 표시한다.]`

- **단계별 핵심 마일스톤 (공고 일정 [28] 기준)**
  - **사전 완료 (~10/25)**: 웹 대시보드 v0.3(G0~G7), 10명 에이전트 파이프라인, 원문 대조 검증기, 관악구 허가 목록 정적 JSON, Force 근거 그래프 구현 및 예선 기획서 제출.
  - **Step 1 (11/02~11/10 · 교육 및 평가셋 구축)**: 온라인 교육 수강 [28], **합성 평가셋 80건(견적 40·답변 40)** 제작 및 자동 채점 스크립트(`eval.ts`) 작성, 공정위 표준약관 원본 대조.
  - **Step 2 (11/11~11/25 · P1 기능 확장 및 사전 산출물 제출)**: 계약서 LLM 읽기(`contractDraftSchema`) + 견적↔계약 비교 구현, 자치구 허가 데이터 추가, 80건 벤치마크 1차 측정 및 사전 산출물 제출 [28].
  - **Step 3 (11/26 멘토링 · 11/27 09:00~18:00 본선 해커톤)**: 11/26 멘토링에서 사전 구현물 활용 범위 및 심사 주안점 확인 후, 11/27 당일 현장 환경 세팅(09:00~11:00) → 핵심 검증기·계약 점검 모듈 통합 및 80건 평가셋 재측정(11:00~15:30) → 모델 교대 0회 시연 리허설 및 최종 발표(15:30~18:00).

`[표 5: 팀 구성 및 역할 분담 (1~3인 대학생 팀, 성명 빈칸) — 열 구성: 구성원 (빈칸) | 담당 역할 | 핵심 책임 모듈 (구현됨 / 본선 계획) | 검증 및 시연 중 맡는 일]`

| 구성원 (빈칸) | 담당 역할 | 핵심 책임 모듈 (구현됨 / 본선 계획) | 검증 및 시연 중 맡는 일 |
|---|---|---|---|
| **`[팀원 1: 빈칸]`** | **AI 하네스 · 검증기 리드** | 로컬 Ollama 어댑터([`ollama.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts)), 답변 점검 에이전트 루프([`agent.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/agent.ts)), 원문 대조·명시 판정 검증기([`verify.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts), [`plain.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/plain.ts)), 계약서 LLM 스키마(P1) | 합성 평가셋 80건 자동 벤치마크 실행, 현장 GPU 대기열·타임아웃 관제 |
| **`[팀원 2: 빈칸]`** | **프론트엔드 · 시각화 리드** | Next.js 대시보드([`Dashboard.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx)), 3분할 미니 SVG 장면([`Stage.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx)), Force 온톨로지 그래프([`GraphView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/GraphView.tsx)), 다중 견적 비교·승인 UI([`QuotesView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx)) | 1440px/390px 반응형·대칭 점검, Playwright 시연 동선 자동 재생 점검 |
| **`[팀원 3: 빈칸]`** *(1~2인 팀일 경우 팀원 1·2가 분담)* | **도메인 규칙 · 공공데이터 · 평가 리드** | 3대 대조 규칙([`rules.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts)), 표준약관·서류 점검표([`docs.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts), [`references.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/references.ts)), 관악구 허가업체 비식별 전처리([`gwanak-permits.py`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/scripts/gwanak-permits.py)) | 합성 평가셋(견적 40·답변 40) 라벨링, 약관·소비자원 출처 대조, 발표·질의응답 |

---

### 3. 본선 준비물 · 위험과 대응 · 정량 검증 계획
- **3대 핵심 준비물**
  1. **합성 평가셋 80건 (`[계획: 견적서 40건 + 업체 답변 40건]`)**: 실제 업체명·개인정보를 쓰지 않고 소비자원 피해 사례 [1]를 반영해 설계한 반증용 테스트셋. ① 사다리차·계단·차량·인원 미기재 견적, ② `'원룸 짐 일체'` 등 뭉뚱그린 문구, ③ `'협의 후 결정'`·`'당일 보고 추가'` 등 조건부 문구, ④ `'1인 가구'`·`'계약금 5만원'`·`'사다리 별도 7만원'` 등 숫자 귀속 함정 케이스를 포함한다.
  2. **모델 교대 0회 라이브 시연 시나리오 (`[구현됨 · D006 대본 확정]`)**: 8GB GPU에서 두 모델(`ax4-light` ↔ `qwen3:4b`)을 번갈아 부르면 모델 재적재(Cold Load 37~112초)가 발생할 수 있다(추정). 따라서 **본선 라이브 시연에서는 메모리에 상주시킨 단일 모델만 실시간 호출해 모델 교대 횟수를 0회로 유지**하고, 다른 모델 단계는 처음부터 화면에 `"사전 실행 결과 재생"` 배지를 정직하게 표시한다.
  3. **하드웨어 및 오프라인 구동 환경 (`[구현됨]`)**: RTX 2080 SUPER (8GB VRAM) 기준 로컬 Ollama(`keep_alive: "30m"`, `temperature: 0`, `num_ctx: 8192`) + Next.js 16 로컬 서버. 외부 인터넷이나 유료 API 키 없이도 해커톤 현장에서 100% 독립 동작한다.

`[표 6: 주요 위험과 기술·운영 대응 (Risk & Mitigation) — 열 구성: 위험 요인 | 발생 원인과 영향 | 코드·운영 대응책 (구현 상태)]`

| 위험 요인 | 발생 원인과 영향 | 코드·운영 대응책 (구현 상태) |
|---|---|---|
| **① 8GB GPU의 두 모델 동시 상주 불가(추정) 및 콜드 로드 지연** | `ax4-light`와 `qwen3:4b` 교대 호출 시 VRAM 재적재로 37~112초 소요 실측 | **`[구현됨]`** 서버 단일 GPU 대기열(`onGpu`), 콜드(180초)/웜(90초) 타임아웃 분리, **본선 라이브 시연 중 모델 교대 0회 대본** 및 `"사전 실행 결과 재생"` 명시 |
| **② 소형 로컬 LLM의 원문 외 환각·숫자 오귀속** | 원문에 없는 `'사다리차 별도'` 생성, `'1인 가구'`를 인원 1명으로 오독 (실측) | **`[구현됨]`** 끌 수 없는 `verifyDraft`·`verifyIntake`·`notPlain`·`manualOf` 검증기로 원문에 없는 발췌·숫자 즉시 제거 후 근거 장부(`dropped`·`rejected`)에 노출 |
| **③ 현장 Ollama 연결 단절 또는 GPU 장애** | 해커톤 발표장 전원·드라이버 문제로 로컬 LLM 응답 불가 가능성 | **`[구현됨]`** `/api/health` 3초 주기 점검, 에이전트 개별 OFF 시 직접 입력 폼(`QuoteForm`) 및 수동 문장 선택(`ManualReflect`)으로 전환되어 **LLM 없이도 같은 검증기·대조표·비교표 100% 동작** |
| **④ 공공데이터 갱신 시차 및 업종 혼재 오해** | 관악구 허가 CSV(연 1회 갱신)에 신규 업체가 없거나 일반화물 업체가 섞여 있음 | **`[구현됨]`** `kind` 필드로 이사화물(27곳)과 일반화물(12곳)을 분리 안내하고, 미등재를 무허가로 단정하지 않으며 `"동일 업체 미확인 — 허가증 사본·사업자등록번호 대조"` 문구 강제([`permits.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L25-L39)) |
| **⑤ 해커톤 사전 구현물 허용 범위 미정 (`unknown`)** | 공고에 사전 개발 기간(11/02~11/25)과 당일 해커톤(11/27)이 함께 안내됨 [28] | **`[계획]`** 11/26 멘토링에서 사전 코드 허용 범위를 확인하고, 핵심 모듈(`verify.ts`, `rules.ts`, `agent.ts`, `Stage.tsx`)을 경량화해 당일 9시간 내 현장 재구축도 가능하도록 준비 |

`[표 7: 정량 검증 계획 및 목표 지표 (측정된 값과 목표 분리) — 열 구성: 검증 지표 | 측정 방법·기준 데이터 | 현재 상태 (2026-10-24 실측) | 본선 목표치 (11/27 평가셋 80건 기준) | 반증(실패) 기준]`

| 검증 지표 | 측정 방법·기준 데이터 | 현재 상태 (2026-10-24 실측) | 본선 목표치 (11/27 평가셋 80건 기준) | 반증(실패) 기준 |
|---|---|---|---|---|
| **1. 원문 외 발췌·숫자 통과율 (환각 오반영률)** | 합성 견적 40건·답변 40건에서 원문에 없는 문구·금액이 `verifyDraft`·`propose_updates`를 통과한 비율 | 단위 시험 60개 및 가상 사례 2건에서 **0건 확인** (`'사다리차 별도'` 환각 1건 차단 실측) | **목표: 0.0% (0/80건)** *(평가셋 80건 전체 측정은 본선 전 수행)* | 원문에 없는 금액·문구가 단 1건이라도 `'명시됨'` 카드에 반영되면 검증기 결함으로 판정 |
| **2. 조건부·유보 문구의 `'명시됨'` 오판율** | `'당일 보고'`, `'협의 후 결정'`, `'별도 7만원'` 등이 포함된 항목이 `'명시됨(총액 포함)'`으로 분류된 비율 | 단위 시험 및 샘플 검증에서 **0건 확인** (`notPlain` 차단 동작) | **목표: 0.0%** *(합성 답변 40건 중 조건부·상충 케이스 전수)* | 조건부 문구가 `'명시됨'`으로 승격되어 확인 질문에서 누락되면 실패 |
| **3. 미확인·누락 항목 탐지 재현율 (Recall)** | 합성 견적 40건에 심어 둔 누락 항목(층수·엘베·사다리·차량·인원·품목)이 확인 질문 카드로 생성된 비율 | 샘플 시나리오 기준 누락 항목 전수 카드 생성 확인 (80건 전체 수치는 **미측정**) | **목표: LLM 읽기 포함 ≥ 90%, 규칙 대조 자체는 100%** | LLM이 품목을 누락하더라도 내 짐 목록(`items`)과의 규칙 대조로 미확인 카드가 생성되는지 확인 |
| **4. 단계별 로컬 추론 응답 시간 (Warm)** | RTX 2080 SUPER 8GB에서 조건 해석·견적 읽기·답변 점검 호출당 소요 시간 (`ms`) | **실측 완료**: 조건 2~9초, 견적 단건 4.4초(2건 7~9초), 답변 점검 6~13초, 규칙 7종 즉시 | **목표: 단건 호출 ≤ 15초 유지, 시연 중 콜드 로드 0회** | 시연 중 타임아웃(90초) 발생 또는 모델 교대 대기 발생 시 사전 재생 모드로 즉시 전환 |
| **5. 개인정보·근거 없는 숫자 노출 건수** | 번들 데이터(`gwanak-permits.json`) 내 전화·좌표 잔존 수 및 근거 없는 ㎥·톤수·가격 생성 수 | **실측 완료: 0건** (`permits.test.ts` 정규식 통과, 코드 전수 점검 완료) | **목표: 0건 유지** (자치구 데이터 확장 및 P1 계약서 스키마 포함) | 전화번호·좌표·주민번호 수집이나 근거 없는 가격·톤수 추정이 1건이라도 발견 시 빌드 차단 |

---

### 참고 출처 (문항 3 · 문항 5 인용 근거)
- **[1]** 한국소비자원 보도자료(피해예방주의보), 「방문 견적 없는 소규모 이사 계약, 추가 비용 요구 등 피해 많아」(2026-04-21): https://www.kca.go.kr/home/sub.do?menukey=4005&mode=view&no=1004458186&page=1 (첨부 PDF: https://www.kca.go.kr/home/board/download.do?bid=00000012&did=1004458186&fno=10054204&menukey=4005)
- **[19]** 한국소비자원 카드뉴스, 「소규모 이사 계약 시 주의사항」(2026-04-21): https://www.kca.go.kr/smartconsumer/sub.do?cate=00000051&menukey=7714&mode=view&no=1004455170
- **[20]** 법제처 찾기쉬운 생활법령정보, 「이사화물 표준약관(공정거래위원회 표준약관 제10035호, 2014-09-19 개정 확인 판본) — 이사업체 정하기(제4·5·6조) 및 이사계약의 체결·해제(제5·8·9·14·19조)」: https://m.easylaw.go.kr/MOB/CsmInfoRetrieve.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=666 / https://m.easylaw.go.kr/MOB/CsmInfoRetrieve.laf?ccfNo=3&cciNo=1&cnpClsNo=1&csmSeq=629 (공개 전문 대조: https://ydnara.com/yakgwan.html)
- **[21]** 공정거래위원회 표준약관 게시 경로 (조회 시점 403 응답으로 최신 개정 여부 `unknown`): https://www.ftc.go.kr/www/selectBbsNttView.do?key=202&bordCd=201&nttSn=11148
- **[28]** 데이콘(DAKER) 공식 공고, 「2026 AI Platform Build Challenge 예선 안내」: https://daker.ai/public/hackathons/ai-platform-build-challenge-prelims?postId=5d568379-2efc-4f2a-b3ba-b553684c7766&section=board
- **[공공데이터 15080952]** 공공데이터포털, 「서울특별시 관악구_화물자동차운송주선사업허가업체현황」(기준일 2026-04-24, 무료·이용허락범위 제한 없음): https://www.data.go.kr/data/15080952/fileData.do
