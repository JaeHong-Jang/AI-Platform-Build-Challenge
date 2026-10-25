# B012 웹 변경 상호 검증 (Sonnet)

검증 일: 2026-10-25. 파일은 수정하지 않았다 (재현용 임시 스크립트는 실행 후 삭제).

## 실행 결과
- `cd web && npm test`: 83개 중 83 통과, 실패 0
- `npx tsc --noEmit`: exit 0, 오류 없음
- `curl POST /api/inspect` 빈 객체 `{}` → 400 `짐·조건·견적 형식이 올바르지 않습니다.`
- `curl POST /api/inspect` JSON 아님(`nope`) → 400 `요청 형식이 올바르지 않습니다.`
- 모델 호출은 하지 않았다. 검증기 재현은 `makeInspectTools`를 직접 불러 `add_risks`/`submit_findings`만 실행했다 (GPU 사용 없음).

## 발견

### 1. [높음] 답변 에이전트가 ai- 카드의 `kw`를 못 받는다 (zod가 제거)
- 위치: `web/src/app/api/reply/route.ts:10-21` (cardSchema), `web/src/components/InquiryPanel.tsx:60`, `web/src/lib/proposals.ts:149`
- 원인: 클라이언트는 `[...targets, ...confirmed]` 카드를 그대로 `/api/reply`로 보낸다. cardSchema는 `kw`와 `by`가 없는 `z.object`라 기본 동작(알 수 없는 키 제거)으로 `kw`가 사라진다. 서버의 `keywords(card)`는 `card.kw`가 없으면 `id`가 `ai-`로 시작하는 카드를 어느 분기에도 못 찾고 마지막 `[card.title]`로 떨어진다.
- 재현: 점검 에이전트가 '냉장고 계단 운반'(related=냉장고) 카드를 낸다. 업체가 "냉장고는 계단이어도 추가 비용 없습니다"라고 답한다. 브라우저의 `ManualReflect`(에이전트 끔 경로)는 `kw`로 수락하지만, `/api/reply` 에이전트는 제목 전체가 quote에 있어야 하므로 "답변 문구에 ... 말이 없습니다"로 거절한다. 같은 답변인데 에이전트 경로와 수동 경로의 결과가 달라진다.
- 고칠 방법: cardSchema에 `by: z.literal("agent").optional()`, `kw: z.array(z.string().max(40)).max(12).optional()`을 추가한다. 그리고 `reply` 라우트 테스트에 ai- 카드 1건을 넣어 `kw`가 서버까지 가는지 확인한다.

### 2. [중간] 새 위험 카드의 `related`·`quote` 길이 제한이 없어 `/api/reply`가 400을 낸다
- 위치: `web/src/lib/inspect.ts:49-52, 100, 107-108, 142-146`. 대상 스키마는 `reply/route.ts` (mine max 200, evidence 항목 max 300).
- 원인: `relatedOk`는 `r.includes(i.name)` 또는 COND_WORDS 포함만 보고 길이는 보지 않는다. `quote`도 길이 상한이 없다. 그런데 새 카드의 `mine = related`, `evidence = [quote]`가 reply 스키마 한도를 넘으면 reply 요청 전체가 400이 된다. 다른 카드의 답변 점검도 같이 막힌다.
- 재현: `add_risks`에 `related: "냉장고 ".repeat(100)`(약 700자)을 넣으면 `accepted: true`로 나온다. 이 값이 카드의 `mine`으로 들어간다.
- 고칠 방법: `check()`에서 `related.length <= 30`, 새 카드의 title/related/quote 길이를 스키마 한도 이하로 제한한다. 또는 reply 스키마를 느슨하게 하고 서버가 자른다. 근거 문장 quote는 `sentences()` 한 문장 이하로 제한하는 편이 낫다.

### 3. [중간] 모델 오류로 끝난 점검이 '유효한 결과'로 저장되어 재시도 경로가 막힌다
- 위치: `web/src/lib/inspector.ts:58, 49, 54`, `web/src/components/HomeView.tsx:75, 76, 213, 240`
- 원인: `stopped: "error"`이고 findings가 0건인 결과(시간 초과, 모델 호출 실패, 판정 없이 종료)도 `sig`가 맞아서 `updateQuote(id, { inspection: r })`로 저장된다. 이후 `inspected = ins.sig === curSig`가 true라서 `needInspect`가 false, `changed`가 false다. 버튼은 비활성이 되고 "입력 그대로 점검했어요"라는 문구가 뜬다. 실패 사실은 그 순간의 `notes`에만 남고 다음 `run()`이나 새로고침 뒤에는 사라진다.
- 재현: GPU가 바쁠 때 점검이 시간 초과로 끝난다. 사용자는 입력을 바꾸지 않는 한 점검을 다시 돌릴 수 없다. 에이전트 줄은 "판정을 내지 못해 기본 항목만 ..."이라고 정직하게 표시하므로 원칙 5의 표시는 지킨다. 재시도 수단이 없다는 점이 문제다.
- 고칠 방법: `stopped === "error" && !findings.length`이면 `inspection`으로 저장하지 않는다. 또는 `inspected`에 `!(ins.stopped === "error" && !ins.findings.length)` 조건을 추가해 `needInspect`가 다시 켜지게 한다.

### 4. [중간] 계단·사다리 거절 검사를 장소 낱말 없이 우회할 수 있다 (원칙 3)
- 위치: `web/src/lib/inspect.ts:94-97`
- 원인: `lifted`는 `said.includes("출발지"|"도착지")`이고 해당 집이 엘리베이터 `있음`일 때만 거절한다. 두 집 모두 엘리베이터가 있어도 장소를 말하지 않으면 통과한다. 반대로 "도착지는 엘리베이터가 있지만 출발지 계단..."처럼 두 장소를 함께 쓰면 정당한 추론도 거절될 수 있다. 문장 단위로 보지 않는다.
- 재현: cond가 출발 3층 엘베 있음, 도착 5층 엘베 있음일 때 `add_risks({title:"냉장고 계단 운반", related:"냉장고", reason:"계단으로 냉장고를 옮기면 인원이 더 필요함", question:"냉장고 계단 운반이 총액에 포함인가요? 별도면 알려 주세요."})`가 `accepted: true`로 나왔다 (실행 확인).
- 고칠 방법: 계단·사다리 위험은 두 집 중 하나라도 `elevator !== "있음"`일 때만 허용한다. 장소를 지목했으면 그 집을 기준으로 하고, 지목하지 않았다면 두 집 모두 `있음`일 때 거절한다. 장소를 `related`/title에서도 읽고, 거절 조건은 문장 단위로 평가한다.

### 5. [중간] 질문의 금액 검사가 '원/만 붙은 금액'만 본다
- 위치: `web/src/lib/inspect.ts:119`, `web/src/lib/verify.ts:11-18` (amountsIn)
- 원인: `amountsIn`은 `원`이 붙거나 쉼표가 있거나 `만`이 붙은 숫자만 금액으로 본다. 원칙 2("견적서에 없는 금액 불가")가 `reason`·`title`에는 아예 적용되지 않는다.
- 재현: 질문 "냉장고 추가 비용이 50000 정도 나오나요? 알려 주세요."가 `accepted: true`로 나왔다 (실행 확인). 단위가 없는 `50000`은 금액으로 안 잡혔다. 또 `reason`에 "5만원 추가될 수 있음"이 있어도 통과한다. `reason`은 화면(산정표 `c.why`)에 그대로 보인다.
- 고칠 방법: `title`, `reason`, `question` 세 칸 모두에 `amountsIn`을 적용한다. 단위 없는 4자리 이상 숫자도 질문에서 금지하거나 견적서 숫자 목록과 대조한다.

### 6. [중간] 새 위험 카드 id가 제목의 공백만 지워서 만든다 (id 충돌)
- 위치: `web/src/lib/inspect.ts:123` (`ai-${title.replace(/\s+/g, "")}`), `:105` (MAX_NEW 계산은 `x.title !== title`로 비교)
- 원인: 제목이 다르고 공백 위치만 다른 두 위험이 같은 key를 쓴다. 한도 검사는 제목 문자열로 세므로 둘 다 `accepted: true`를 돌려주는데 `findings` Map에는 하나만 남는다. 먼저 낸 질문이 조용히 사라진다.
- 재현: "냉장고 계단 운반"과 "냉장고계단 운반"을 연달아 `add_risks`에 넣었다. 둘 다 `accepted: true`였고 `findings` key는 `['ai-냉장고계단운반']` 하나였다 (실행 확인).
- 고칠 방법: key를 정규화한 제목으로 먼저 구한 뒤 충돌하면 거절한다 (`이미 같은 위험이 있습니다`). 또는 key와 제목을 모두 정규화해 비교한다. 제목 중복 판정(`targets.some((c) => c.title === title)`)도 공백을 제거해 비교하는 편이 낫다.

### 7. [낮음] 새 위험이 기존 항목과 사실상 같아도 통과한다 (중복 카드)
- 위치: `web/src/lib/inspect.ts:101-104`
- 원인: 중복 검사는 제목이 정확히 같을 때, 또는 사다리/추가비용 문구일 때만 본다. 짐 카드와 같은 내용의 새 카드를 막지 못한다.
- 재현: 짐 카드 '냉장고'가 있는데 새 위험 "냉장고 포함 여부"가 `accepted: true`로 나왔다 (실행 확인). 화면에 같은 짐의 카드가 둘 생기고 같은 질문이 중복된다.
- 고칠 방법: 새 카드의 title이 `canonical(짐 이름)`을 포함하고 포함 여부 문구뿐이면 해당 카드의 card_id 판정으로 돌린다. 프롬프트에도 "짐 카드와 같은 질문은 add_risks로 내지 마라"를 명시한다.

### 8. [낮음] 근거 문장(quote)이 문장의 일부 조각이어도 검증을 통과한다
- 위치: `web/src/lib/inspect.ts:107-108, 114-115`
- 원인: `src.includes(quote)`는 원문 전체의 부분 문자열이면 통과한다. 조건·별도 표현(`notPlain`)은 quote에만 적용된다. 예를 들어 원문이 "냉장고 포함, 단 계단은 별도 5만원"일 때 quote "냉장고 포함"만 내면 `notPlain`을 통과한다. 또 두 문장에 걸친 조각도 통과한다.
- 영향: covered는 규칙이 이미 명시됨으로 본 카드에만 허용되므로 원칙 1(명시됨으로 올리지 못함)은 깨지지 않는다. 다만 근거(`evidence`)가 규칙이 쓴 문장 대신 에이전트가 고른 조각으로 바뀔 수 있다.
- 고칠 방법: quote가 `lines` 중 한 문장과 같거나 그 문장의 부분 문자열인지 검사한다. 그리고 `notPlain`은 quote가 속한 문장 전체에 적용한다.

### 9. [낮음] `inspectSig`가 `JSON.stringify(cond)`의 키 순서에 의존한다
- 위치: `web/src/lib/inspect.ts:25`
- 원인: 같은 cond라도 키 순서가 다르면 sig가 달라진다. `{from, to, ladderNeeded}` 순서와 `{ladderNeeded, to, from}` 순서에서 `inspectSig`가 서로 달랐다 (실행 확인: `sig order false`). 서버는 zod 파싱 결과(스키마 순서)로 sig를 계산하고 클라이언트는 자기 객체로 계산한다.
- 현재 상태: 현재 코드의 경로(`intake.ts`, `forms.tsx`, `store.ts EMPTY_COND`)는 모두 같은 순서(`from, to, ladderNeeded` / `floor, elevator, parkingFar`)라서 실제로는 맞는다. 이 순서에 의존하는 약한 결합이다. 키가 하나 늘거나 순서가 바뀌면 점검이 항상 `!inspected`가 되어 결과가 조용히 적용되지 않는다.
- 고칠 방법: sig를 필드를 명시해 만든다 (`[from.floor, from.elevator, from.parkingFar, to..., ladderNeeded]`).

### 10. [낮음] 점검 에이전트를 끄면 승인한 답변(override)이 사라지는 것처럼 보인다
- 위치: `web/src/lib/store.ts:86-103`, `web/src/components/InquiryPanel.tsx:78`
- 원인: override의 sig에 카드의 `status`·`evidence`가 들어간다. 병합된 카드(에이전트가 판정을 바꾼 카드)에서 승인했다면 에이전트를 끄거나 재점검 결과가 달라져 `evidence`가 바뀌는 순간 sig가 어긋나 승인이 무효가 된다. `inquiryOf`는 "답변 반영"을 "재문의 필요"로 바꾼다.
- 영향: 설계상 의도된 안전 동작(승인은 입력과 판정이 같을 때만 유효)이다. 다만 재점검은 모델이 비결정적이라 같은 입력에서도 `evidence`가 달라질 수 있어, 사용자가 승인한 답변이 재점검 때 사라질 수 있다. 사용자에게 이유가 보이지 않는다.
- 고칠 방법: 승인이 무효가 되면 "점검 결과가 바뀌어 승인이 풀렸어요" 문구를 카드에 표시한다. 필요하면 재점검 시 이미 승인한 카드가 있으면 확인 대화를 넣는다.

### 11. [낮음] 점검 에이전트를 끈 뒤에도 도구 기록이 보인다
- 위치: `web/src/components/HomeView.tsx:370`
- 원인: `a.id === "inspector" && inspected && <ToolLog ...>`에 `inspectorOn` 조건이 없다. 에이전트를 끄면 카드에는 결과가 안 쓰이는데(`baseCards`의 `on` 검사) 작업 보고 탭에는 이전 도구 기록이 그대로 남는다. 상태는 "꺼짐"이다.
- 고칠 방법: `inspectorOn && inspected && ...` 조건으로 바꾼다.

### 12. [낮음] 점검이 일부만 끝나도 '판정했다'고만 말한다
- 위치: `web/src/components/HomeView.tsx:314-319`, `web/src/lib/inspector.ts:60, 69`
- 원인: 상한(`limit`)이나 오류로 중간에 멈춰 findings가 일부만 있어도 "도구를 N번 불러 M개 항목을 판정하고 ..." 한 줄만 나온다. 판정을 못 받은 카드(`not_judged_yet`)는 규칙 기준선인데 이것이 화면에 구분되지 않는다. 작업 보고(`pipeline.ts`)에는 `ins.stopped !== "finished"`일 때 note가 붙지만 에이전트 줄에는 없다.
- 고칠 방법: `ins.stopped !== "finished"`이면 에이전트 줄에 "중간에 멈춰 일부 항목만 판정" 문구를 붙인다.

### 13. [낮음] 빈 새 위험 카드가 stale 문의 id를 남긴다
- 위치: `web/src/lib/store.ts:23, 113`, `web/src/components/InquiryPanel.tsx:38, 57`, `QuotesView.tsx:113`
- 원인: 재점검으로 ai- 카드가 사라지거나 id가 바뀌어도 `q.asked`에는 예전 id가 남는다. QuotesView의 "N항목 물음" 숫자가 존재하지 않는 카드를 센다.
- 고칠 방법: `q.asked.filter((id) => cards.some((c) => c.id === id)).length`로 센다.

## 확인했는데 문제없는 항목
- 원칙 1: `check()` 112행이 규칙이 확인 필요로 본 카드의 covered를 거절한다 (재현: 규칙이 `조건 모호`로 본 `item-냉장고`에 covered를 내자 거절). 새 위험은 `add_risks`가 verdict를 `needs_check`로 고정한다. `applyInspection`에서도 `isNew`이면서 covered인 경로는 도달 불가하다.
- 원칙 4: 짐·조건·견적 원문이 바뀌면 `inspectSig`가 달라져 `baseCards`가 병합하지 않는다 (`store.ts:95`). `readQuote`가 `overrides/inquiry/asked`는 비우지만 `inspection`은 sig로 걸러지므로 문제없다. 에이전트를 끄면 `baseCards`는 규칙 기준선만 돌려주고, 결과는 지우지 않아 다시 켜면 돌아온다.
- 원칙 5: 모델 호출 실패(catch)는 저장하지 않고 안내문만 띄운다 (HomeView 203-205). findings가 0건인 `inspected` 결과는 "판정을 내지 못해 기본 항목만 ..."으로 정직하게 표시한다 (318행).
- HomeView `wantInspect` 효과와 `run()`: `setLive(null)`, `setNotes`, `setNonce`, `setWantInspect(true)`가 같은 await 뒤에서 배치되고, 그 전에 `onRead`/`update`/`updateQuote`가 끝나 있다. 그래서 효과는 갱신된 `q`·`state`로 실행된다. `setWantInspect(false)`를 먼저 하고 `live`를 막아 중복 호출이 없다. 점검 중 입력을 바꾸거나 견적을 바꿔도 결과의 sig는 보낸 입력 기준이라 낡은 결과가 카드에 병합되지 않는다. 같은 에이전트 id의 이전 요청은 `agentPost`가 취소한다. 점검 중 에이전트를 끄면 abort로 catch 경로(note)로 간다 (문구는 "호출 실패"라 약간 부정확하지만 동작은 안전하다).
- 장면 시간: `planOf`의 inspector 구간은 `signsMs + boxes.length * trip + ASK_MS`이고 `frameAt`의 `workEnd = ms.end - ASK_MS`와 정확히 맞아 `ti`는 `boxes.length`를 넘지 않는다. ai- 카드는 `rule: "작업조건"`이라 `signs`로 들어가 `signsMs`에 반영된다. `part()`는 `ms`가 없으면 null이고, HomeView가 inspector를 항상 steps에 넣으므로 null 경로는 평소 타지 않는다. `posted`는 `asks.length`가 0이어도 안전하다. ASK_MS는 700ms 고정이라 질문이 많으면 한 질문당 시간이 짧아질 뿐 오류는 없다. 점검 결과가 들어오면 `nonce`와 `sig`가 함께 바뀌어 장면이 처음부터 재생된다.
- `/api/inspect` 라우트: 잘못된 입력은 400으로 거절한다. 모델 호출 없이도 `onGpu`로 직렬화된다.
- `applyInspection`: `unread-` 카드는 판정 대상에서 빠지고 병합 때도 건드리지 않는다. 규칙이 명시됨으로 본 카드에 needs_check가 오면 상태를 `조건 모호`, 비용을 `미확인`으로 내린다. 올리는 경로는 없다.
- `sigOf`/`cardsOf`: `InquiryPanel.apply`와 `cardsOf` 둘 다 `baseCards`(병합 후 카드)를 기준으로 sig를 잡아 서로 일치한다. `QuotesView`는 견적마다 자기 `inspection`으로 `cardsOf`를 계산한다.

## 우선순위 제안
1. (높음) reply 라우트 cardSchema에 `kw`·`by` 추가 + 테스트
2. (중간) `related`/`quote`/`reason` 길이 상한 (reply 400 방지), 오류 점검 결과 미저장
3. (중간) 계단 거절 우회, 금액 검사 범위, id 충돌
4. (낮음) 나머지
