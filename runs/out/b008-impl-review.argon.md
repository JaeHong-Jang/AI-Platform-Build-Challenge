# 과제 B008 · 지휘부 기술·구현 검증 2차 (Argon) — D006 구현 결과 리뷰

검토 기준일: **2026-10-24** · 작성: **Argon (지휘부 — 기술·구현 관점)**  
검토 대상: [`decisions/D006-이사-지킴이-에이전트-관제.md`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/decisions/D006-%EC%9D%B4%EC%82%AC-%EC%A7%80%ED%82%B4%EC%9D%B4-%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8-%EA%B4%80%EC%A0%9C.md), [`runs/out/b008-review.argon.md`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/runs/out/b008-review.argon.md), `web/src/lib/*.ts`, `web/src/lib/*.test.ts`, `web/src/app/api/**/route.ts`, `web/src/components/**/*.tsx`, [`web/scripts/gwanak-permits.py`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/scripts/gwanak-permits.py), [`web/src/data/gwanak-permits.json`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/data/gwanak-permits.json).

---

## 1. 1차 조건부 승인 조건 4개 충족 여부 점검

| 조건 | 세부 항목 | 판정 | 근거 (`파일:줄`) 및 검증 내용 |
|---|---|---|---|
| **조건 1. 검증기 보강**<br>(K1·K2·K6) | 1-1. 금액·인원 항목별 문맥 검증 (`verifyDraft`) | **충족** | [`verify.ts:8-22`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L8-L22), [`verify.ts:52-65`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L52-L65)에서 [`amountsIn`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L8-L15)이 단위(`만`/`천`/`원`) 또는 쉼표가 있는 숫자만 추출하고, [`amountFor`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L22)가 구절 단위로 `NOT_TOTAL`(`계약금·별도·사다리` 등)과 `DEPOSIT`(`계약금·선금` 등)을 분리 검증함. 인원도 `(?<!\d)${d.workers}\s*(명|인)(?!\s*(가구|용|분|실|승))`으로 `'1인 가구'` 오탐을 차단함([`validators.test.ts:13-41`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/validators.test.ts#L13-L41)). |
| | 1-2. 품목·답변의 조건부/제외 문구 차단 (`notPlain`) 및 수량 미확인 카드 유지 | **부분** | 공용 [`notPlain`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/plain.ts#L14-L19)([`plain.ts:4-19`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/plain.ts#L4-L19))을 [`rules.ts:68`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L68)과 [`proposals.ts:66`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/proposals.ts#L66)이 함께 쓰고 `count === null` 품목도 카드로 유지됨([`rules.ts:58, 90-98`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L58)). **단, `listed.quote`가 품목 이름뿐일 때(`verify.ts:35` 빈 발췌 폴백 또는 직접 입력) 원문 구절의 `'협의 후 결정'`·`'제외'`를 검사하지 못하는 우회 경로가 남아 있음**(아래 TOP 5 #1). |
| | 1-3. 조건 해석 검증기 (`verifyIntake`) | **부분** | [`intake.ts:33-42, 59-78`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L33-L78)에서 `(지하)?N층` 패턴, 출발/도착 순서, `NOT_MOVE`(`빌트인·안 옮김`) 교정을 구현함([`intake.test.ts:10-38`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.test.ts#L10-L38)). **단, [`checkSite`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L37-L50)의 엘리베이터 보완 규칙(`intake.ts:45-48`)에 구절 병합·전역 매칭 오탐이 존재함**(아래 TOP 5 #2). |
| | 1-4. 직접 입력(`QuoteForm`) 및 수동 답변 반영(`ManualReflect`) 검증기 우회 차단 | **부분** | 수동 답변 반영([`InquiryPanel.tsx:196-215`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx#L196-L215))은 [`makeTools().propose_updates`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/proposals.ts#L49-L74)를 통과해 우회가 차단됨. 반면 직접 입력 판정([`rules.ts:44-54`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L44-L54) [`manualOf`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L44))은 **원문에 `'사다리'` 글자만 있을 때 `ladder: "포함"` 변경을 막지 못하고, `totalAmount`·`deposit` 직접 입력값을 원문 확인 없이 통과시킴**(아래 TOP 5 #1). |
| **조건 2. GPU 대기열·취소** | 2-1. 서버 단일 GPU 대기열(`onGpu`) + `req.signal` 전파 + `lastModel` 관리 | **부분** | 서버는 [`ollama.ts:55-84`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L55-L84)의 [`onGpu`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L56)와 API 라우트 3곳([`api/intake/route.ts:14`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/app/api/intake/route.ts#L14), [`api/extract/quote/route.ts:14`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/app/api/extract/quote/route.ts#L14), [`api/reply/route.ts:29`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/app/api/reply/route.ts#L29)), [`agent.ts:74`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/agent.ts#L74)에서 `req.signal`을 받도록 구현됨. **그러나 클라이언트 [`postJSON`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L22-L27)이 `AbortController`를 쓰지 않아 에이전트 토글 OFF 시에도 요청이 취소되지 않고 결과가 반영됨**(아래 TOP 5 #4). |
| **조건 3. 장면 축소·동기화** | 3-1. 장면 코드 600줄 이하 감축 + `lucide-react` 재사용 + 3분할 미니 SVG + 팔레트 A 팀 색상 분리 | **충족** | [`scene.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/scene.ts)(74줄) + [`Stage.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx)(212줄) + [`AgentStrip.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/AgentStrip.tsx)(60줄) + [`scene.css`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/scene.css)(112줄) = **총 458줄**(TS/TSX 346줄)로 600줄 이하 달성. 팀 복장 색(`#2F6DB5`·`#B84A18`·`#2E7D4F`)과 배지(`◆/①/②/③`)도 분리됨([`scene.css:10-13`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/scene.css#L10-L13), [`AgentStrip.tsx:9-10`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/AgentStrip.tsx#L9-L10)). |
| | 3-2. `cardsOf(state)` 단일 파생 + `revealed` 정수 커서 동기화 | **부분** | 비동기 이벤트 큐 없이 [`sceneOf(cards, revealed)`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/scene.ts#L52-L74) 순수 함수와 [`useReveal`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/HomeView.tsx#L19-L37) 커서 1개로 구동됨([`scene.test.ts:10-60`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/scene.test.ts#L10-L60)). **단, 견적 대조관(`matcher`) OFF 상태에서 `Stage`가 여전히 `0/M` 완료 막대를 그리고 백그라운드에서 `isa-seen`을 소비하는 동기화 결함이 있음**(아래 TOP 5 #5). |
| **조건 4. 다중 견적 격리·관악구 JSON** | 4-1. [`QuoteEntry`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/store.ts#L13-L25) 격리 + [`sigOf`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/store.ts#L82-L83) 서명 보강 + `v2 → v3` 이전(`migrate`) | **부분** | 데이터 계층([`store.ts:13-93`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/store.ts#L13-L93))은 견적별 `overrides·inquiry·runs` 격리와 `sigOf(c, q, s)`(`q.id`, `condSig`, `itemsSig` 포함), [`migrate`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/store.ts#L70-L76)를 모두 충족함([`validators.test.ts:83-112`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/validators.test.ts#L83-L112)). **그러나 화면 계층([`QuotesView.tsx:24-31, 81`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L24-L31))에서 `InquiryPanel`의 `key={q.id}` 누락과 삭제 후 재추가 시 라벨 중복이 발생함**(아래 TOP 5 #3). |
| | 4-2. 관악구 허가 목록 정적 JSON (전화·좌표 물리적 제거, 업종·영업상태 확인) | **부분** | 공공데이터([관악구 화물자동차운송주선사업 허가업체현황](https://www.data.go.kr/data/15080952/fileData.do)) 변환 스크립트([`gwanak-permits.py:28-47`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/scripts/gwanak-permits.py#L28-L47))와 [`gwanak-permits.json`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/data/gwanak-permits.json)에서 전화번호·위도·경도·상세 호수가 물리적으로 제거됨([`permits.test.ts:8-13`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.test.ts#L8-L13)). **단, [`matchCompany`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L31-L38)가 [`candidates()`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L9-L11) 대신 전체 39행(`ROWS`)을 검색해 일반화물(`kind: "일반"`, 12행)도 이사 허가 일치로 표시함**(아래 TOP 5 #3). |

---

## 2. 새로 발견된 결함 TOP 5 (재현 가능) 및 중점 점검 항목

### 결함 1 (치명). [`verifyDraft`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L27-L67)·[`manualOf`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L44-L54) 우회 3종 — ① 원문에 `'사다리'`만 있으면 `'별도'`가 `'포함(명시됨)'`으로 둔갑, ② 빈 발췌·단어 입력 시 `'협의 후 결정'` 품목이 `'총액 포함'`으로 둔갑, ③ 직접 입력한 총액·계약금이 원문 확인 없이 10% 경고를 울림

- **위치**:
  - [`web/src/lib/verify.ts:34-38`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L34-L38)
  - [`web/src/lib/rules.ts:44-54, 68, 134, 157-168`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L44-L54)
  - [`web/src/components/forms.tsx:43-55`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/forms.tsx#L43-L55), [`web/src/components/ContractView.tsx:15, 56-58`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/ContractView.tsx#L15)
- **원인 및 재현**:
  1. **사다리차 우회**: [`verify.ts:38`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L38)은 `d.ladder !== "미기재" && !/사다리/.test(text)`만 검사한다. 따라서 원문(`src`)에 `"사다리차 필요 시 별도 7만원"`([`SAMPLE_QUOTE_TEXT_B`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/fixtures.ts#L62-L68))처럼 `'사다리'`라는 글자만 들어 있으면, 사용자가 [`QuoteForm`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/forms.tsx#L49-L51)에서 사다리차를 `"포함"`으로 바꾸거나 모델이 `"포함"`으로 오추출했을 때 `verifyDraft(src, quote).draft.ladder`가 `"포함"`을 그대로 유지한다. 그 결과 [`manualOf`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L50)에서 `manual.ladder === false`가 되고 [`rules.ts:134`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L134)가 원문과 정반대인 `status: "명시됨"`, `cost: "총액 포함"`, `evidence: ["사다리차 포함"]`(원문에 없는 문자열)으로 판정한다.
  2. **품목 `notPlain` 우회**: [`verify.ts:35`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L35)는 모델이 `quote: ""`로 비운 품목에 `quote: l.name`을 채워 넣고, [`QuoteForm`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/forms.tsx#L54)도 `{ name: q, quote: q }`로 저장한다. 원문이 `"냉장고 운송은 협의 후 결정. 책장 제외."`일 때 `l`이 `{ name: "냉장고", quote: "냉장고" }`이면 `src.includes("냉장고")`가 참이라 `verifyDraft`와 `manualOf`를 모두 통과하고, [`rules.ts:68`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L68)의 `notPlain("냉장고", null)`은 원문 구절이 아닌 `"냉장고"` 단어만 검사해 `null`을 반환한다(1차 리뷰 Astra #1의 원래 입력이 그대로 재현됨).
  3. **총액·계약금 직접 입력 우회**: [`manualOf`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L40)는 `totalAmount`·`deposit`을 검사하지 않으며, [`ContractView.tsx:58`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/ContractView.tsx#L58)은 `"총액과 계약금이 견적서 원문에서 모두 확인되어야 계산합니다"`라고 적혀 있지만 실제로는 [`ContractView.tsx:15`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/ContractView.tsx#L15)와 [`QuotesView.tsx:99`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L99)가 원문 대조를 거치지 않은 `d.totalAmount`·`d.deposit`으로 계약금 비율을 계산한다.
- **재현 입력 및 기대/실제 결과**:
  ```ts
  import { compare } from "./web/src/lib/rules.ts";
  import { QUOTE_DRAFT_B, SAMPLE_CONDITIONS, SAMPLE_ITEMS, SAMPLE_QUOTE_TEXT_B } from "./web/src/lib/fixtures.ts";

  // [재현 1-A] 원문: "사다리차 필요 시 별도 7만원" (SAMPLE_QUOTE_TEXT_B)
  // 입력: QuoteForm에서 ladder를 "포함"으로 변경, 품목 quote가 품목명만 들어온 경우
  const c1 = compare(SAMPLE_ITEMS, { ...QUOTE_DRAFT_B, ladder: "포함" }, SAMPLE_CONDITIONS, SAMPLE_QUOTE_TEXT_B);
  const ladder = c1.find((c) => c.id === "ladder")!;
  // 기대: status !== "명시됨" (원문은 '별도 7만원'이므로 '포함'이 아님)
  // 실제: ladder.status === "명시됨", ladder.cost === "총액 포함", ladder.evidence === ["사다리차 포함"]

  // [재현 1-B] 원문: "냉장고 운송은 협의 후 결정." / 모델이 quote를 비워 보낸 경우(verify.ts:35) 또는 "냉장고"만 발췌한 경우
  const src2 = "냉장고 운송은 협의 후 결정. 총액 35만원";
  const c2 = compare(SAMPLE_ITEMS, { ...QUOTE_DRAFT_B, listedItems: [{ name: "냉장고", quote: "" }] }, SAMPLE_CONDITIONS, src2);
  const fridge = c2.find((c) => c.id === "item-냉장고")!;
  // 기대: fridge.status === "조건 모호", fridge.cost === "미확인"
  // 실제: fridge.status === "명시됨", fridge.cost === "총액 포함", fridge.ask === ""
  ```
- **해결**:
  1. `verify.ts:38`에서 `d.ladder === "포함"`일 때는 원문의 `사다리`가 들어간 구절(`clauses(text)`)에 `포함`이 있고 `notPlain(clause, d.totalAmount) === null`일 때만 `"포함"`을 인정해야 한다.
  2. `verify.ts:34-36`에서 `l.quote`가 비어 있거나 단어만 있을 때는 원문에서 해당 품목 이름이 등장하는 구절(`clauses(text).find(c => c.includes(l.name))`)을 `quote`로 채우거나, `rules.ts:68`에서 `notPlain`을 `listed.quote`뿐 아니라 해당 품목이 포함된 원문 줄/구절 전체에 대해서도 검사해야 한다.
  3. `ContractView.tsx:15`와 `QuotesView.tsx:99`의 `depositRatio`는 `verifyDraft(q.quoteText, d).draft`에서 확인된 `totalAmount`·`deposit`에 대해서만 계산해야 한다.

---

### 결함 2 (높음). [`intake.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L28-L50) 엘리베이터·층수 보완 규칙의 구절 병합 및 전역 매칭 오탐

- **위치**: [`web/src/lib/intake.ts:28, 35, 45-48`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L28-L48)
- **원인**:
  1. [`clauses(t)`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L28)(`t.split(/[\n,.!?·/]|그리고|이고|이며|인데|고요|구요/)`)가 한국어 이사 문장에서 가장 흔한 연결 표현인 `'에서'`, `'→'`, `'->'`, `'부터'`를 분리하지 않는다.
  2. 따라서 `"지금 3층 엘베 없음에서 새 집 5층 엘베 있음으로 이사해요"`처럼 쉼표 없이 쓰면 문장 전체가 구절 1개가 되고, 도착지(`5층`)를 검사할 때 [`clauseWithFloor(text, 5)`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L35)가 문장 전체를 돌려주며, [`intake.ts:47`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L47)의 `.match(/(엘베|엘리베이터|승강기)\s*(이|가|는)?\s*(없|있)/)`가 문장 앞쪽(출발지 3층)의 `"엘베 없음"`을 먼저 매칭해 **도착지 엘리베이터까지 `"없음"`으로 강제 덮어쓴다**.
  3. 또한 [`intake.ts:45`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L45)(`let elevator: Tri = /엘베|엘리베이터|승강기/.test(text) ? s.elevator : "모름"`)는 해당 집의 구절(`c`)이 아니라 전체 문장(`text`)에 `'엘베'`가 있는지만 확인하므로, 출발지에만 엘베를 적었을 때 모델이 도착지 엘베를 환각해도 걸러내지 못한다(실제로 [`intake.test.ts:21`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.test.ts#L21)에서 `"도착은 5층, 지금 사는 곳은 3층 엘베 없음"` 입력 시 `to.elevator: "없음"` 환각이 그대로 남는 현상이 잠복해 있음).
  4. 출발지와 도착지가 같은 층수(예: `"지금 3층 엘베 없음, 새 집은 3층 엘베 있음"`)일 때는 [`clauseWithFloor(text, 3)`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L35)이 `find()`로 첫 번째 구절만 반환해 도착지 3층이 `"다른 집의 층으로 보임"`으로 삭제(`null`)된다.
- **재현 입력 및 기대/실제 결과**:
  ```ts
  import { verifyIntake } from "./web/src/lib/intake.ts";

  // [재현 2-A] 쉼표 없이 '에서 ~으로'로 연결한 한 문장
  const r1 = verifyIntake(
    "지금 3층 엘베 없음에서 새 집 5층 엘베 있음으로 이사해요",
    { houseType: "모름", from: { floor: 3, elevator: "없음" }, to: { floor: 5, elevator: "있음" }, items: [] }
  );
  // 기대: r1.cond.to.elevator === "있음"
  // 실제: r1.cond.to.elevator === "없음" (출발지의 '엘베 없음'이 도착지의 '엘베 있음'을 덮어씀!)

  // [재현 2-B] 한쪽 집만 엘베 언급 + 다른 집은 모델이 엘베 환각 (intake.test.ts:21 동일 입력)
  const r2 = verifyIntake(
    "도착은 5층, 지금 사는 곳은 3층 엘베 없음",
    { houseType: "모름", from: { floor: 3, elevator: "없음" }, to: { floor: 5, elevator: "없음" }, items: [] }
  );
  // 기대: r2.cond.to.elevator === "모름" (도착지 구절에는 엘베 언급이 없음)
  // 실제: r2.cond.to.elevator === "없음"

  // [재현 2-C] 출발지와 도착지 층수가 같은 경우 (3층 → 3층)
  const r3 = verifyIntake(
    "지금 3층 엘베 없음, 새 집은 3층 엘베 있음",
    { houseType: "모름", from: { floor: 3, elevator: "없음" }, to: { floor: 3, elevator: "있음" }, items: [] }
  );
  // 기대: r3.cond.to.floor === 3, r3.cond.to.elevator === "있음"
  // 실제: r3.cond.to.floor === null, r3.cond.to.elevator === "없음"
  ```
- **해결**:
  1. `clauses(t)` 분리자에 `|(?<=층)\s*에서|→|->`를 추가하고, `clauseWithFloor(text, floor, own, other)`가 동일 층수 구절이 여러 개일 때 `own` 마커가 있거나 `!other`인 구절을 우선 선택하도록 수정한다.
  2. `intake.ts:45`의 엘리베이터 존재 검사를 전체 `text`가 아니라 해당 집의 구절 `c`(`c && /엘베|엘리베이터|승강기/.test(c)`)에 한정한다.

---

### 결함 3 (높음). 견적 3건·업체 고르기 흐름의 상태 혼선 — ① [`InquiryPanel`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx#L18)에 `key={q.id}` 누락으로 견적 전환 시 후보 승인 UI 증발, ② 견적 삭제 후 추가 시 `'견적 B'` 라벨 중복, ③ 관악구 일반화물(`kind: "일반"`) 12개 업체의 이사 허가 오표시

- **위치**:
  - [`web/src/components/QuotesView.tsx:24-31, 73, 81, 108`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L24-L31)
  - [`web/src/components/InquiryPanel.tsx:24, 31-36, 161`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx#L24-L36)
  - [`web/src/lib/permits.ts:9, 31-38`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L9-L38)
- **재현 3-A (`InquiryPanel` 견적 간 로컬 상태 섞임)**:
  - **입력**: `견적 A`와 `견적 B` 모두 답변 점검(`runs`)을 마친 상태에서, `견적 A`의 답변 후보를 체크하고 `선택한 N개 반영`([`InquiryPanel.tsx:69-85`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx#L69-L85), `setApplied(true)`) 클릭 → 상단 탭에서 `견적 B` 클릭.
  - **기대 결과**: `견적 B`의 답변 후보 체크박스와 반영 버튼이 정상 표시되어야 함.
  - **실제 결과**: [`QuotesView.tsx:81`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L81)의 `<InquiryPanel api={api} q={q} />`에 `key={q.id}`가 없어 `applied === true`, `picked`, `selection`, `error` 상태가 `견적 B`에도 그대로 남고, [`InquiryPanel.tsx:161`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx#L161)(`{run.proposals.length > 0 && !applied && ...}`)에 막혀 **`견적 B`의 미승인 후보 목록이 화면에서 아예 사라진다**.
- **재현 3-B (견적 삭제 후 재추가 시 라벨 중복)**:
  - **입력**: `[견적 A, 견적 B]` 상태에서 `견적 A`의 삭제(휴지통) 클릭 → `+ 견적 추가` 클릭.
  - **기대 결과**: 기존 `견적 B`와 겹치지 않는 라벨(`견적 C` 또는 고유 번호)이 부여되어야 함.
  - **실제 결과**: [`QuotesView.tsx:25`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L25)가 `newQuote(state.quotes.length)`(`length === 1`)를 호출해 새 견적도 `label: "견적 B"`가 되어 탭과 비교표에 **`견적 B`, `견적 B` 두 개가 동시에 뜬다**.
- **재현 3-C (`permits.ts`에서 `candidates()` 미사용으로 일반화물 업체가 이사 허가로 매칭됨)**:
  - **입력**: `관악구 허가 업체 목록과 대조` 체크 후, 업체명이 `"전국화물"` 또는 `"(주)다다익스"`([`gwanak-permits.json:14, 209`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/data/gwanak-permits.json#L14)에서 `kind: "일반"`, 이사화물 아님)인 견적 입력.
  - **기대 결과**: D006(`"구분·영업상태명 확인 행만 후보"`)에 따라 일반화물(`kind: "일반"`)임을 구분해 안내하거나 후보에서 제외해야 함.
  - **실제 결과**: [`permits.ts:9`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L9)에 `candidates()`(`r.kind.includes("이사")`)를 정의해 두고도 정작 [`matchCompany`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L35)는 전체 `ROWS`(39행)를 탐색하고 화면([`QuotesView.tsx:73, 108`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L73))에도 `row.kind`를 표시하지 않아, 일반화물 업체도 이사화물 업체와 똑같이 `"관악구 허가 목록에 같은 상호 기록 있음"`으로 표시된다.
- **해결**:
  1. `QuotesView.tsx:81`을 `<InquiryPanel key={q.id} api={api} q={q} />`로 수정한다.
  2. `QuotesView.tsx:25`에서 사용 중인 라벨(`state.quotes.map(x => x.label)`)과 겹치지 않는 첫 글자(`"ABCDEFGH"`)를 선택하도록 수정한다.
  3. `permits.ts:35`에서 `row.kind`와 `row.status`를 메시지에 명시(`"구분: 이사 / 영업중"` vs `"주의: 목록상 구분이 '일반'(일반화물)이며 '이사'가 아님"`)하거나 `candidates()` 기준으로 분기한다.

---

### 결함 4 (중간~높음). 에이전트 토글 OFF 시 클라이언트 `AbortController` 미전파로 인한 백그라운드 실행 지속·꺼진 에이전트 결과 덮어쓰기 및 `onGpu` 대기열 취소 지연

- **위치**:
  - [`web/src/components/Dashboard.tsx:22-27, 62-73, 94`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L22-L27)
  - [`web/src/components/StartView.tsx:23-28`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/StartView.tsx#L23-L28), [`web/src/components/InquiryPanel.tsx:52-67`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx#L52-L67)
  - [`web/src/lib/ollama.ts:55-84`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L55-L84)
- **원인 (`onGpu` 기아 여부 포함)**:
  1. **클라이언트 취소 미구현**: [`postJSON`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L22-L27)이 `AbortSignal`을 받지 않고, [`toggleAgent`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L94)도 진행 중인 요청을 `abort()`하지 않는다. 따라서 LLM 실행 도중 사용자가 레일에서 에이전트를 꺼도 브라우저 `fetch`는 끊기지 않으며, 서버의 `req.signal`도 `aborted`가 되지 않는다.
  2. **꺼진 에이전트의 결과 덮어쓰기**: 요청 완료 시점에 에이전트가 여전히 켜져 있는지 확인하지 않으므로([`Dashboard.tsx:66`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L66), [`StartView.tsx:25`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/StartView.tsx#L25), [`InquiryPanel.tsx:62`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/InquiryPanel.tsx#L62)), **사용자가 끈 에이전트가 수 초 뒤 결과를 그대로 상태에 반영**한다.
  3. **`onGpu` 대기열에서 취소된 작업 뒤 작업이 굶는지(Starvation) 점검**:
     - [`ollama.ts:56-63`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L56-L63)은 `gpu = run.catch(() => undefined)`로 체인을 이어가므로, 앞 작업이 `AbortError`나 타임아웃으로 실패하더라도 **뒤 작업이 영구 기아(deadlock/starvation)에 빠지지는 않는다**.
     - **단, 두 가지 부작용이 있다**: ① 앞 작업(`job 1`)이 클라이언트가 `abort()`를 안 보내 끝까지 GPU를 점유하므로 뒤 작업(`job 2`)이 불필요하게 앞 작업 완료까지 기다려야 하고, ② [`ollama.ts:69, 81`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L69)에서 `lastModel = model`을 먼저 대입한 뒤 `if (name !== "AbortError") lastModel = ""`로 예외를 둬서, 콜드 모델 로딩 도중 요청이 취소되면 메모리에 모델이 아직 안 올라왔는데도 `lastModel`이 새 모델로 남아 다음 호출이 `WARM_TIMEOUT_MS`(90초)로 잘못 단축된다.
- **재현 입력 및 기대/실제 결과**:
  - **입력**: `QuotesView`에서 `항목 읽기` 클릭 직후(1초 이내) 왼쪽 레일에서 `문서 읽기관` 토글을 OFF로 전환.
  - **기대 결과**: 진행 중인 `/api/extract/quote` 요청이 즉시 취소되고 `q.draft`가 갱신되지 않아야 함.
  - **실제 결과**: 네트워크 요청이 취소되지 않고 6~9초 뒤 완료되어, `문서 읽기관`이 꺼져 있는데도 `q.draft`와 `q.reader`가 새 LLM 추출 결과로 덮어써짐.
- **해결**:
  1. `postJSON(url, body, signal)`에 `AbortController`를 연결하고, 에이전트 토글 OFF 시 해당 에이전트의 `AbortController.abort()`를 호출하며 응답 수신 후에도 실패/무시 처리한다.
  2. `ollama.ts:81`에서 `AbortError`를 포함한 모든 예외 시 `lastModel = ""`로 초기화해 콜드 타임아웃 누락을 방지한다.

---

### 결함 5 (중간). 홈 장면(`Stage`)의 `revealed` 커서와 대조관(`matcher`) 꺼짐 상태 불일치 — 대조관 OFF 시에도 `확인 완료 0/M` 막대 노출·백그라운드 `isa-seen` 소비·조각 수 불일치

- **위치**:
  - [`web/src/components/HomeView.tsx:19-37, 47-59, 101-138`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/HomeView.tsx#L19-L59)
  - [`web/src/components/scene/Stage.tsx:131-148, 153, 166, 190-193`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx#L131-L193)
- **원인 및 재현**:
  - **입력**: 가상 사례 로드 후 왼쪽 레일(또는 장면 하단 `AgentStrip`)에서 `견적 대조관`(`matcher`)을 OFF로 전환하고 `#/home` 화면 확인.
  - **기대 결과**: 대조관이 꺼지면 대조를 수행하지 않으므로 KPI처럼 장면의 트럭 진행률 막대도 `"대조 안 됨"`으로 표시되어야 하며, 대조관을 다시 켰을 때 미시청 장면이면 분류 연출이 재생되어야 함.
  - **실제 결과**:
    1. 상단 KPI([`HomeView.tsx:93-94`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/HomeView.tsx#L93-L94))는 `"—"`로 바뀌지만, [`Stage`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx#L166)에는 `cards`(11장)와 `revealed = 0`이 그대로 전달되어 트럭 캡션과 진행 막대([`Stage.tsx:166, 190-191`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx#L166))에 **`확인 완료 0/11 · 공개된 카드 0장`(0% 진행률)** 이 표시된다.
    2. 이때 출발 집 캡션([`Stage.tsx:153`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx#L153))은 품목 상자(`kind === "box"`)만 세어 `공개 전 대기 6`을 표시하고 작업조건·추가비 표지 5개는 `p.revealed === false`라 숨기므로([`Stage.tsx:134`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx#L134)), 화면의 상자 수(`6`)와 트럭 분모(`11`)가 시각적으로 어긋난다.
    3. [`useReveal`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/HomeView.tsx#L19-L37)은 `state.agents.matcher === false`일 때도 백그라운드에서 900ms 타이머를 끝까지 돌려 `sessionStorage.setItem("isa-seen", sig)`를 저장해 버리므로, 잠시 뒤 대조관을 다시 켜면 상자 이동 연출이 생략된다.
    4. 연출 재생 중(`revealed < cards.length`)에 우측 `산정표` 탭([`HomeView.tsx:122`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/HomeView.tsx#L122))은 `cards.slice(0, revealed)`로 커서를 따르지만, 바로 옆 `물을 질문 {asks.length}` 탭([`HomeView.tsx:116, 134`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/HomeView.tsx#L116))은 `revealed`와 무관하게 전체 질문을 한꺼번에 표시해 장면의 `질문 게시판` 건수(`scene.board`)와 탭의 질문 수가 재생 도중 다르게 보인다.
- **해결**:
  1. `useReveal(sig, n, enabled)`에 `enabled = state.agents.matcher`를 넘겨 대조관이 꺼져 있을 때는 타이머와 `isa-seen` 기록을 멈추고, `Stage`의 진행 막대도 `matcher` OFF 시 `"대조관 꺼짐 — 분류 대기 중"`으로 표시한다.
  2. `HomeView.tsx:51`의 `sig`에 카드 상태 요약(`cards.map(c => `${c.id}:${c.status}`).join(",")`)을 포함해 답변 승인으로 카드 상태가 바뀌었을 때도 장면 변화가 반영되게 한다.

---

### 중점 점검 항목 추가 확인 (숫자 생성 금지 · 개인정보 누출)

1. **화면에서 근거 없는 숫자가 나오는 곳 (금액·톤수·적재율 생성 금지 위반 여부)**:
   - **톤수·적재율(㎥)·예상 견적가·권장 인원 생성**: 코드 전체(`web/src/lib/*.ts`, `web/src/components/**/*.tsx`)에서 **0건(위반 없음)**. 트럭 진행 막대는 카드 개수 비율(`확인 완료 N/M`, [`Stage.tsx:147, 190`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/scene/Stage.tsx#L147))만 사용하며, 짐 점검표관 후보도 `count: null, pending: true`([`intake.ts:97`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L97))로 수량·부피 추정이 없다.參考 통계([`Records.tsx:14-16`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Records.tsx#L14-L16))는 [한국소비자원 피해예방주의보(2026-04-21)](https://www.kca.go.kr/home/sub.do?menukey=4005&mode=view&no=1004458186&page=1) 수치를 인용하고 있으며, 약관 비율(10%)은 [법제처 생활법령정보 이사화물 표준약관](https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=666) 제6조 참고치임을 명시하고 있다([`docs.ts:4`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts#L4), [`references.ts:28-33, 48-49`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/references.ts#L28-L33)).
   - **유일한 예외**: 위 **결함 1-C**에서 지적한 대로, [`ContractView.tsx:15, 56-58`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/ContractView.tsx#L15) 및 [`QuotesView.tsx:99`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L99)가 원문(`quoteText`)에서 검증되지 않은 직접 입력 `totalAmount`·`deposit`으로도 계약금 비율(`XX.X%`)을 계산해 보여 주는 부분만 수정하면 된다.
2. **개인정보(전화번호·좌표·상세주소·주민등록번호) 누출 여부**:
   - **누출 0건(안전)**. [`web/scripts/gwanak-permits.py:13-37`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/scripts/gwanak-permits.py#L13-L37)에서 원본 CSV의 `전화번호`·`위도`·`경도` 열을 아예 읽지 않고 버렸으며, `trim_address`로 `층`·`호`·`상가` 상세 주소를 제거했다. [`web/src/data/gwanak-permits.json`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/data/gwanak-permits.json) 39행 전수 확인 및 [`permits.test.ts:8-13`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.test.ts#L8-L13) 정규식 검사에서 전화번호·좌표 키와 값이 없음을 확인했다. 또한 [`docs.ts:9`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts#L9)와 [`ContractView.tsx:46`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/ContractView.tsx#L46)에서 주민등록번호 수집/요구 근거가 아님을 명시했고, 상태는 브라우저 `sessionStorage`에만 저장된다([`store.ts:2, 114`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/store.ts#L2)).

---

## 3. 해커톤 시연(11/27) 전 꼭 고칠 것 vs 미뤄도 되는 것

### A. 시연 및 평가 전 반드시 고칠 것 (P0 — 총 ~50줄 수정으로 해결 가능)

| 우선순위 | 수정 대상 (`파일:줄`) | 무엇을 왜 고쳐야 하는가 |
|---|---|---|
| **P0-1** | [`verify.ts:34-38`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/verify.ts#L34-L38), [`rules.ts:68`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/rules.ts#L68), [`ContractView.tsx:15`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/ContractView.tsx#L15) | **검증기·직접 입력 우회 차단(결함 1)**: ① `d.ladder === "포함"`일 때 원문의 `사다리` 구절이 `notPlain`을 통과하고 `포함`을 포함하는지 확인, ② 품목 `listed.quote`가 품목명뿐일 때 원문에서 해당 품목이 포함된 구절 전체에 대해 `notPlain` 검사, ③ 원문에서 확인되지 않은 직접 입력 `totalAmount`·`deposit`은 계약금 비율(`depositRatio`) 계산에서 제외. 심사위원이 직접 입력이나 모호한 문구를 넣었을 때 `'명시됨(✓)'` 오판이 나면 핵심 약속이 무너진다. |
| **P0-2** | [`intake.ts:28, 35, 45-48`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/intake.ts#L28-L48) | **조건 해석 엘리베이터·동일 층수 오탐 수리(결함 2)**: ① `clauses` 분리자에 `'에서'`·`'→'`·`'->'` 추가, ② 엘리베이터 유무(`intake.ts:45`)를 전체 문장이 아닌 해당 집 구절(`c`)에서만 검사, ③ 출발·도착 층수가 같을 때(`3층 → 3층`) 구절 매칭이 첫 번째 구절에 고정되지 않도록 수정. 시연 첫 단계(한 문장 조건 입력)에서 바로 드러나는 버그다. |
| **P0-3** | [`QuotesView.tsx:25, 73, 81, 108`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/QuotesView.tsx#L25), [`permits.ts:35`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/permits.ts#L35) | **다중 견적 전환 및 관악구 업종 표시 수리(결함 3)**: ① `<InquiryPanel key={q.id} ... />` 1줄 추가로 견적 A↔B 전환 시 후보 증발 버그 즉시 해결, ② 견적 삭제 후 재추가 시 미사용 라벨(`견적 A/B/C`) 부여, ③ `matchCompany` 결과에 `row.kind`(`이사` vs `일반`)와 `row.status`(`영업중`)를 표시하고 `kind: "일반"`(일반화물 12곳)은 이사화물 허가가 아님을 구분 안내. |
| **P0-4** | [`Dashboard.tsx:22-27, 62-73, 94`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/Dashboard.tsx#L22-L27), [`ollama.ts:81`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ollama.ts#L81) | **에이전트 토글 OFF 시 실제 요청 취소 및 결과 차단(결함 4)**: 시연 중 "에이전트를 끄면 멈춘다"를 보여 줄 때 꺼진 에이전트가 뒤늦게 결과를 덮어쓰지 않도록 `AbortController` 연동 및 수신 시 `state.agents[id]` 재확인 추가, `AbortError` 시에도 `lastModel = ""` 초기화. |

### B. 해커톤 시연 전 미뤄도 되는 것 (P1~P2 — 시연 완결성에 지장 없음)

| 구분 | 항목 | 미뤄도 되는 이유 |
|---|---|---|
| **P1 (여유 시 보완)** | [`HomeView.tsx:19-37, 51-55`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/HomeView.tsx#L19-L55) 대조관 OFF 시 장면 `0/M` 막대 문구 및 `useReveal` 일시정지 (결함 5) | 판정 데이터 자체를 오염시키지는 않는 연출/표시 동기화 문제이므로 P0-1~P0-4 수리 후 반영해도 충분함. |
| **P1 (여유 시 보완)** | 계약서 전용 LLM 추출 스키마(`contractDraftSchema`) | 현재 [`ContractView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/ContractView.tsx)와 [`docs.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/docs.ts)의 규칙 기반 기재 항목·계약금 10%·승인 답변 기재 여부 점검만으로도 D006의 계약 점검 약속을 안정적으로 시연할 수 있으며, 오히려 시연 중 불필요한 LLM 호출 시간을 아낄 수 있음. |
| **P2 (생략 가능)** | `onGpu` 대기 중(`queued`) 작업의 즉시 큐 이탈 응답, `ontology.yaml`·`SKILL.md` 별도 정적 파일 분리 | 단일 사용자 시연 환경에서는 P0-4의 클라이언트 `AbortController`만으로 즉시 취소가 체감되며, 온톨로지 4열 사슬은 [`ontology.ts`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/lib/ontology.ts)와 [`GraphView.tsx`](file:///mnt/c/Users/User/Desktop/대학교/3학년/AI%20Platform%20Build%20Challenge/web/src/components/GraphView.tsx)로 이미 완결되어 동작함. |
