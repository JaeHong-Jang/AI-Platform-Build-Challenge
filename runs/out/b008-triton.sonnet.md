# B008 조사 — TRITON 프론트엔드에서 이사 지킴이로 옮길 수 있는 것 (Sonnet)

경로 약칭: `FE` = `/mnt/c/Users/User/Desktop/대학교/3학년/TRITON/apps/frontend`, `S` = `/tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-triton`

## 0. 먼저 알아둘 사실 (사용자 설명과 다른 점)

1. **기존 `dist`는 백엔드 필요 빌드**였다(`모의 시연` 문구가 번들에 0건). 그래서 `VITE_MOCK=1`로 별도 폴더(`S/dist-mock`)에 다시 빌드해 캡처했다. 원본 `dist`와 소스는 건드리지 않았다. mock 분기: `src/api/client.ts:12`, 데이터 `src/api/mock/*`.
2. **"법정 SVG 2D 캐릭터" 코드는 현재 화면에 쓰이지 않는다.** 실제 법정 화면(`CourtStage.tsx`)은 AI가 생성한 PNG 배경(`/art/stone-tribunal.png` 약 2.5MB)과 PNG 인물(`/art/judgeman-3d.png`)을 SVG `clipPath`로 오려 천칭 접시만 위아래로 움직인다(`CourtStage.tsx:34-35, 140-179, 186-221`). 벡터 사람·천칭 코드(`Person.tsx` 235줄, `Scale2d.tsx` 217줄, `Defendant2d.tsx`, `Backdrop.tsx`, `Bench.tsx`, `Judge.tsx`)는 `Bench -> Judge -> Person` 안쪽 import뿐이고 `CourtPage`/`CourtStage`에서 import하지 않는 **죽은 코드(과거 버전)**다(grep 확인). 그래도 "움직이는 캐릭터를 SVG로 그리는 방법"의 참고 자료로는 쓸 만하다.
3. **작업실(`/agents`)에는 "사무실 그림 위 에이전트"가 없다.** "그래프 관제 작업실"이라는 이름의 관제 화면이다: 실행 흐름 파이프라인 + 지식 그래프 + 상세 패널 + 로그(`AgentsPage.tsx:121-126`). 사이드바 아이콘 이름만 `office`다(`console/nav.ts`). 즉 이사 지킴이 3팀 작업실은 **TRITON에서 옮길 것이 아니라 새로 그려야 한다.** 에이전트별 상태 표시 재료로는 `RobotAvatar.tsx`(70줄, `working` 속성), `ControlPipeline`의 단계 노드 상태 클래스(`cr-step-*`), 상단바 "AI 작동 중 N" 배지(`ConsoleShell.tsx:158-166`)가 있다.

## 1. 캡처 파일 (1440x900, 모두 `S/` 아래)

| 파일 | 내용 |
|---|---|
| `S/01-dashboard.png` | 대시보드 `/` — 히어로 사진 + KPI 카드 + 최근 활동 |
| `S/02-cases.png` | 사건 접수 `/cases` |
| `S/03-court-0.png`, `S/04-court-6s.png`, `S/05-court-16s.png` | 법정 `/court/mock-001` 시작 전 (재판 시작 버튼 대기) |
| `S/11-court-started.png`, `S/12-court-20s.png`, `S/13-court-scrolled.png` | 재판 시작 후 첫인상 입력 단계 |
| `S/20-court-live-3000.png` ~ `S/20-court-live-10000.png` | 첫인상 기록 후 변론이 하나씩 자동 공개되며 천칭·무게 막대가 변하는 장면 (가장 참고가치 큼: `20-court-live-3000.png`, `20-court-live-10000.png`) |
| `S/06-agents.png`, `S/07-agents-later.png` | 작업실 상단: 실행 흐름 파이프라인 |
| `S/14-agents-knowledge.png`, `S/15-agents-lower.png` | 작업실 하단: 근거/온톨로지/연결 보기 탭과 force 그래프 |
| `S/08-rules.png`, `S/16-rules-scrolled.png`, `S/17-rules-lower.png`, `S/08b-rules-full.png` | 규칙·온톨로지: 정적 절차 카드 + 위에서 아래로 흐르는 5단 온톨로지 그래프(`16-rules-scrolled.png`이 좋음) |
| `S/09-records.png`, `S/10-stats.png` | 감사 장부 목록, 통계 |
| `S/shot*.cjs`, `S/links.txt`, `S/errs.txt` | 캡처 스크립트, 링크 목록, 페이지 오류(비어 있음 = 오류 없음) |

정적 서버(`python3` 8811 포트)는 SPA 폴백을 넣어 띄웠고 캡처 후 종료했다(포트 8811 닫힘 확인).

## 2. 화면 관찰

- **셸**: 왼쪽 어두운 레일 216px(768~900px에서는 아이콘 64px, 768 미만은 서랍), 위 58px 흰 상단바, 본문 배경 연한 베이지. 레일 = 로고 + 주 CTA 버튼 + 그룹 제목(11px 대문자 느낌) + 메뉴 항목(높이 44px, 라운드 6px, 활성 항목은 왼쪽 3px 포인트 막대). 하단에 "구현 현황" 고정. (`S/01-dashboard.png`)
- **대시보드**: 큰 히어로(라운드 8px, 사진 + 왼쪽 그라데이션 어둡게, 큰 제목 + 4줄 요약 + CTA 2개) → "진행 현황" KPI 카드 3개(왼쪽 3px 포인트 선, 큰 숫자 + 설명 문장) → 오른쪽 "최근 활동" 목록. 조건 입력으로 홈이 바뀌지는 않는다(정적 대시보드).
- **법정**: 위에 제목 + 심급 칩(1심 > 2심 > 3심) + 오른쪽 단계 칩(1 첫인상/2 변론 듣기/3 판결). 왼쪽 큰 장면(이미지), 오른쪽 "사건 기록" 패널에 "지금 일어나는 일" 서술 카드, 기사 원문, 주장 카드(채택/기각 버튼, 근거 번호, 무게 배지) 목록이 자동으로 쌓임. 장면 아래 **찬성 6 대 반대 6 가로 막대**가 근거가 공개될 때마다 변함(`20-court-live-10000.png`). 우하단 "장면 움직임 끄기" 토글.
- **작업실**: 맨 위 사건 선택 + 실행 시작/재시도/취소 + 상태 태그 줄 → "01 EXECUTION" 흐름도(박스 144x78 + 곡선 화살표 8개 노드; 현재 단계는 강조) → "02 KNOWLEDGE" 탭 3개(근거 그래프/온톨로지/연결 보기) + 검색/필터 + 어두운 force 그래프 캔버스 + 오른쪽 선택 상세 패널.
- **규칙·온톨로지**: 카드 8장(단계, 코드/AI 태그, 대기 태그) + 허용 전이 목록 + 위에서 아래로 입장 > 주장 유형 > 근거 종류 > 검증 상태(무게 배수 x1/x0) > 조치 단계 5단 DAG(곡선 간선, 간선 위에 배수 라벨). 이사 지킴이 "근거 그래프"의 가장 직접적인 원형.
- **감사 장부**: 흰 카드 목록 한 줄씩(사건 id + 제목 + 오른쪽 칩).
- **외형 규칙(색 제외)**: 패널 라운드 8px, 버튼·칩 5~6px(칩은 pill), 테두리 1px, 그림자 거의 없음(`.tribunal-panel` 2px 8px 5% 정도 — `console/console.css:83`, `.cr-panel` `box-shadow: none` `control-room.css:58-62`). 페이지 바깥 여백 16px(모바일)/28px(>=900px), 최대 너비 1600px, 섹션 간격 24px(`console/parts.tsx:43-48`). 글꼴 Pretendard Variable(`src/index.css:3-12`). 글자 크기: 페이지 제목 28px bold, 패널 제목 15px black, 본문 13~14px, 메뉴 13px, kicker/라벨 10~12px 자간 넓게(`console/parts.tsx:51-57`, `ConsoleShell.tsx:29,66`, `control-room.css:30-34`). 터치 목표 최소 높이 41~44px.

## 3. 코드 구조와 파일:줄 근거

### 3-1. 장면 (`src/scene2d/`)
| 파일 | 줄 | 핵심 |
|---|---|---|
| `CourtStage.tsx` | 305 | 실사용 무대. 배경 `<img>` + 빛/그림자 div + 인물 PNG를 SVG `clipPath`로 3조각(왼 접시·오른 접시·아래 접시) 분리 (140-179). 접시 이동량 `panShiftOf` = sign(기울기) * sqrt(\|기울기\|/MAX_TILT) * 64px (182-184). 무게 막대(249-264)는 Tailwind div. 근거 목록은 `<details>`(267-292). |
| `traditional-court.css` | 470 | 애니메이션은 **CSS keyframes만**(float 8.5s, scale-left 5.8s, scale-right 6.2s 등 `:426-449`), rAF 없음. `prefers-reduced-motion` 시 정지(`:451-`). |
| `CourtStage.tsx` | 108-137 | 화면 밖(IntersectionObserver)·탭 숨김(visibilitychange)·동작 줄이기에서 `data-motion="paused"`로 애니메이션 정지 — 성능/배터리 방어를 이미 갖춤. |
| `layout.ts` | 227 | 순수 함수 모음: 한글 폭 환산 `textUnits`/`wrapText`(22-59), 쌓기 슬롯 `stackSlots`(76-94: 아래부터 한 줄 3개, 무게에 비례해 블록 폭 `50+6w`), 말풍선 충돌 회피 `packBubbles`(184-). 좌표계 = SVG viewBox 1600x?, 천칭 받침점 `PIVOT {800,430}`(14). 테스트 있음(`layout.test.ts` 167줄). |
| `Scale2d.tsx` | 217 | (미사용) SVG 천칭. 보를 `style={{transform: rotate(-a rad)}}`로 돌리고 CSS transition 1100ms(`stage.css:3`)로 부드럽게. 근거 블록은 `c2d-drop` 낙하 애니메이션(`stage.css:29`) + 키보드 접근(`:46-51`). **"쌓이는 블록" 아이디어의 원형**. |
| `Person.tsx` | 235 | (미사용) 각진 SVG 인물: 역할 5종(`:6`), 헤어 6종·피부 8종 프리셋(`:8-23`), `speaking/working` 속성으로 `c2d-talk/c2d-type/c2d-bob` 클래스 부여. 좌표는 인물 로컬(0,0 = 발, 머리 y ≈ -160). |
| `stage.css` | 51 | 공용 애니메이션 클래스 24종(`c2d-bob/hop/sway/breathe/type/talk/gesture/bubble/scanner...`). 전부 CSS. 이사 캐릭터(들기·걷기)에 그대로 이름만 바꿔 쓸 수 있음. |

### 3-2. 작업실 / 관제 (`src/pages/AgentsPage.tsx`, `src/features/control/`)
- `AgentsPage.tsx:121-126`: URL 쿼리(`caseId`, `instance`, `view`)로 상태 유지, `usePoll`로 5초 폴링(112). 실행 제어 버튼 잠금 규칙(52-66).
- `ControlPipeline.tsx`(70줄): **고정 좌표 8개 노드**(`POINTS`, 7) + 베지어 곡선 화살표 `edgePath`(10-16). 노드 상태는 서버가 준 `status`를 `cr-step-<status>` 클래스로 표시(53). 화면 밖이면 라이브 효과 정지(24-31). -> **"이사 단계 흐름도"(견적요청 -> 짐 분류 -> 업체 비교 -> 서류 점검 -> 확정)에 거의 그대로 이식 가능**.
- `GraphCanvas.tsx`(278줄): **라이브러리 없는 직접 SVG force 그래프**. 카메라 `{x,y,k}`(11,55), 휠 줌 기준점 보존(106-111, 133-138), 드래그·노드 이동(13), 검색/그룹/종류/상태 필터(42-50), 이웃 강조(61-68), ResizeObserver(122-131), 목록 모드(접근성 대체), 전체화면.
- `lib/controlLayout.ts`(341줄): 자체 force 레이아웃 — 스프링 길이 108, 반발 2200, 감쇠 0.82(`:20-22`), 연결 성분별 중심 배치, id 해시 기반 고정 초기각(`:32-48`)으로 **같은 입력이면 같은 모양**, 위치 캐시(`layoutNodes`, 256-312), 겹침 해소 `separateOverlaps`. 외부 의존 0. 노드 수가 수백 개를 넘으면 느릴 수 있음(O(n²) 반발 추정 — 직접 측정은 안 함, `unknown`).
- `lib/controlGraph.ts`(326줄): 서버 기록을 노드/간선(`article, sentence, claim, evidence, check, concept, rule, judgment` 8종 `GraphCanvas.tsx:15`, 그룹 6종 `:14`)으로 변환. 이사 버전은 이 변환 함수만 새로 쓰면 됨.
- `ControlLog.tsx`(179줄), `ControlEvidence.tsx`(121), `ControlDetails.tsx`(167): 시간순 로그, 근거 카드, 선택 상세 패널.

### 3-3. 온톨로지 (`src/features/ontology/`)
- `graphModel.ts:55-119` `buildGraph(ont)`: **온톨로지 JSON -> 5행 계층 DAG**. 행 y 고정(`ROW` 67행: 48/168/304/432/580), 열은 균등 배치, 중간 행은 연결된 아래 노드들의 평균 x(`mid`, 70; `kx`, 84-88). 노드 `{id,kind,label,sub,x,y,w,h,tone,solid}`, 간선 `{from,to,label,dashed,tone}`(13-15). 라이브러리 없음, 순수 함수(테스트 있음).
- `evidenceLayout.ts:47-105` `layoutEvidence(rec,…)`: **4열(에이전트 -> 주장 -> 근거 -> 원문 문장)** 레이아웃. 열 x/폭/높이 상수(`COLS`, 14-19), 겹치지 않게 위에서 밀어내리는 `settle`(29-38), 평균 중심 정렬 `meanCenter`(41-44), 선택 노드의 위/아래 사슬 강조 `chainOf`(108-126). -> **"근거 사슬 보기"(견적 문구 -> 짐 -> 약관 조항 -> 원문)에 거의 그대로 재사용**.
- `OntologyGraph.tsx`(185), `EvidenceGraph.tsx`(136): 위 레이아웃을 SVG로 그림(곡선 path + 노드 rect).

### 3-4. 콘솔 셸 (`src/console/`)
- `ConsoleShell.tsx:177-217`: `flex h-dvh` + `Sidebar` + `TopBar` + `<main overflow-auto>`. 3초 폴링 대시보드(179), 작동 중 에이전트 수 배지(204, 158-166), 모바일 서랍은 포커스 가두기 + Esc(97-136). 메뉴 정의는 `nav.ts` 데이터 구조(`NAV` 그룹 배열) — **왼쪽 레일 에이전트 목록 구조로 변형하기 쉬움**.
- `parts.tsx`(70줄): `Panel`, `Meter`(얇은 진행막대 `aria-valuenow`), `PageFrame`, `ago()`. `Meter`는 트럭 적재율에 바로 사용 가능.

### 3-5. 자동 진행·서술 (`src/features/court/`)
- `useAutoReveal.ts`(25줄): 다음 공개할 항목이 있으면 `setTimeout(revealNext, revealDelay)`로 한 개씩. 간격 1200ms, 첫 공개 800ms, 건너뛰기 40ms(`lib/reveal.ts:6-18`). 중단 조건 `canAutoReveal`(busy/error/보는 중/이름 없음). **이사 장면의 "짐이 하나씩 옮겨지며 산정표가 쌓이는" 연출에 그대로 쓸 수 있는 가장 작고 가치 높은 단위.** 건너뛰기 버튼도 이미 있음.
- `narrate.ts`(63줄): 상태(phase)에서 `{title, detail}` 한국어 문장 생성. "지금 일어나는 일" 카드의 재료. 이사 버전은 단계 -> 문장 매핑만 바꾸면 됨.
- `store.ts`(zustand), `lib/trial.ts`: 사건 기록을 이벤트로 재생(replay)하는 구조 — "저장된 시나리오 재생" 개념과 맞음.

### 3-6. 에이전트·온톨로지 정의 (`TRITON/agents/`)
- `ontology.yaml`(106줄): 최상위 키 `stances / claim_types / evidence_kinds / evidence_status / relations / actions`. `claim_types[]`는 `{id,label,stance,definition,signals[],evidence_kinds[]}`, `evidence_status`는 `{label, factor(무게 배수 0~1), voids_claim}`, `actions`는 `{L0~L3: label, autonomy: ai|human_approval|human_only}`(되돌리기 쉬울수록 AI 자율). 코드가 프롬프트를 갖지 않고 이 파일을 읽는다(`agents/README.md:3`).
- `README.md`(19줄) + 역할 폴더 6개(`clerk, prosecutor, defense, cross-examination, research-officer, agent-revise`)의 `SKILL.md` = YAML 머리말(`name, version, role, description`) + 시스템 프롬프트 본문, `{{claim_types}}` 자리표시자를 온톨로지에서 채움. 프롬프트 수정 시 `version` 올림 -> 기록에 버전이 남아 추적 가능.
- 이사 지킴이에 주는 시사점: **"에이전트 = 폴더 하나 + SKILL.md, 온톨로지 = yaml 하나"** 구조를 그대로 쓰면 오케스트레이터 1 + 3팀x3명 = 10개 SKILL.md로 정의되고, 왼쪽 레일의 활성/비활성은 이 목록의 on/off 플래그가 된다. 그리고 `evidence_status.factor`(검증 실패 근거는 무게 0)와 `actions.autonomy`(위험할수록 사람 승인)는 견적·서류 검증에 그대로 대응되는 아이디어다.

## 4. 이사 지킴이로 옮길 설계 제안

| TRITON 요소 | 이사 지킴이 버전 | 재사용 단위 (라이브러리 없이 이식?) | 줄 수 | 위험 |
|---|---|---|---|---|
| 법정 장면(`CourtStage`) 이미지+clipPath | **출발 집 - 트럭 - 도착 집** 한 줄 파노라마. 짐 상자·가구가 출발 집에서 트럭으로, 트럭에서 도착 집으로 이동 | 구조(배경 + 움직이는 조각 + 일시정지 훅 `useSceneMotionPaused`, `CourtStage.tsx:108-137`)만 재사용. **AI 생성 PNG(2.5MB) 방식은 비추** — 모바일 로딩 부담. 대신 SVG 도형 + CSS transform | 새로 작성 약 250~350 (훅 30줄 이식) | 모바일에서 SVG 요소 수(짐 20~40개)와 동시 애니메이션 수. `transform`/`opacity`만 애니메이션하고 화면 밖 정지(이미 구현된 패턴)로 완화 |
| 벡터 인물(`Person.tsx` 235줄, `stage.css`) | 이사 일꾼 캐릭터(들기/걷기/지시). 에이전트 팀 색을 옷 색으로 구분 | 프리셋 + `speaking/working` 클래스 패턴 이식 가능, 코드 자체는 법복 전제라 **참고용으로 새로 그림** | 새로 작성 약 150 + CSS 클래스 이름 변경해 재사용 40 | 죽은 코드라 최신 상태 보증 없음. 인물 6~10명 동시 CSS 애니메이션은 저사양 모바일에서 확인 필요(`unknown`) |
| 천칭에 쌓이는 주장(`Scale2d`, `stackSlots` `layout.ts:76-94`) | **트럭 적재함에 쌓이는 짐 블록**(블록 폭 = 부피/비중). 블록 하나 = 견적 항목·서류 항목 한 줄 | `stackSlots`, `blockSize`, `c2d-drop` 낙하 애니메이션 순수 함수 이식 가능 | 약 60 + CSS 10 | 낮음 |
| 무게 막대(`WeightBar`, 찬성 대 반대) | **트럭 적재율 / 견적 총액 누적 막대**(`parts.tsx` `Meter` 재사용) | `Meter` 그대로 | 15~25 | 낮음 |
| 자동 공개(`useAutoReveal` + `reveal.ts`) | 짐/항목을 1.2초 간격으로 하나씩 처리하며 산정표 행이 쌓임, 건너뛰기 버튼 | 훅 + 간격 상수 그대로(zustand 대신 React state로 가능) | 약 50 | 낮음. 단 실제 LLM 지연이 있으면 "정해진 간격" 대신 "도착 즉시"로 바꿔야 함 |
| 서술 카드(`narrate.ts`) | "지금 일어나는 일" 문장: "A팀 김OO이 냉장고를 트럭에 싣는 중 · 견적 +12만원" | 구조만 이식, 문구 새로 작성 | 약 60 | 낮음 |
| 작업실 흐름도(`ControlPipeline`) | **오케스트레이터 -> 3팀 작업 단계 흐름도** (고정 좌표 + 곡선 화살표 + 단계 상태 클래스) | `POINTS`/`edgePath` 방식 이식 가능, 노드 수 8 -> 10~12 | 약 70 + CSS | 고정 좌표라 모바일에서 가로 스크롤 박스(`cr-flow-scroll`)가 필요 |
| 작업실 방 | **3팀 작업실**: 방 3개, 방마다 에이전트 3명이 책상에서 일하는 단면 그림(TRITON에는 없으므로 새로 제작) + 상태 점(대기/작업중/완료) | `RobotAvatar`(70줄) + `working` 패턴 참고. 방 레이아웃은 CSS grid | 새로 작성 약 200 | 가장 큰 신규 작업. 오케스트레이터 1이 방 위에서 선으로 3팀에 배정되는 연출은 간단한 SVG path로 가능 |
| 왼쪽 레일/`nav.ts` | **에이전트 레일**: 오케스트레이터 + 팀별 접이식 그룹 + 에이전트 토글 스위치(활성/비활성), 상단에 활성 수 배지 | `NAV` 데이터 구조 + `NavLinkItem` 스타일 + 모바일 서랍(포커스 가둠, `ConsoleShell.tsx:97-136`) 이식 | 약 120 | 비활성화 시 산정 결과가 바뀌므로 "비활성 영향" 표시 필요(설계 사항, 코드 위험 아님) |
| 상단바 "AI 작동 중 N"(`ConsoleShell.tsx:158-166`) | "에이전트 7/10 활성 · 작업 중 3" + 조건 요약 칩 | 마크업 그대로 | 20 | 낮음 |
| 대시보드 KPI(`.tribunal-kpi`) + 히어로(`.tribunal-hero`) | **조건 입력 후 생성되는 홈**: 히어로 대신 "내 조건 요약 + 예상 총액 + 해야 할 서류 N건" 카드. 선택 부담 줄이기 위해 기본 추천 1개를 크게, 나머지는 접기 | CSS 클래스(라운드 8px, 왼쪽 3px 포인트 선) 이식 | 카드 컴포넌트 약 60 | 낮음. 홈 생성 로직(조건 -> 카드)은 TRITON에 없음, 새로 작성 |
| 온톨로지(`ontology.yaml` + `graphModel.buildGraph` 55-119) | **5행 DAG**: 짐/작업조건 -> 비용항목 -> 견적문구 -> 약관조항 -> 조치(자동 안내/사람 확인). 행 y 고정 + 평균 x 정렬 | `buildGraph`의 행/열 계산, `touching`(121-125) 이식. 노드 종류(`NodeKind`)와 `STATUS_OF` 표만 교체 | 125줄 중 약 70줄 수정 | 낮음. 데이터는 yaml/JSON로 분리 |
| 근거 그래프(`layoutEvidence` 47-105, `chainOf` 108-126) | **4열 근거 사슬**: 에이전트 -> 산정 결과 -> 근거(견적 문구/업체 답변) -> 원문(약관·계약서 문장). 항목 클릭 시 위/아래 사슬 강조 | 그대로 이식에 가장 가까움. 열 상수와 노드 필드명만 변경 | 126줄 중 약 40줄 수정 | 낮음 |
| 자유 force 그래프(`GraphCanvas` + `controlLayout`) | 선택적 "전체 관계 보기"(고급 사용자용). 기본 화면에는 두지 않음 | 619줄(278+341), 의존성 없음, 이식 가능하나 **선택 부담을 줄이는 목표와 어긋남**(필터 8종 등 조작이 많음) | 619 | 노드 수백 개에서 O(n²) 계산, 모바일 휠/드래그 충돌(`wheel` 리스너 `passive:false`로 페이지 스크롤 가로챔). 초기 버전 제외 권장 |
| 감사 장부 목록 | 견적·서류 산정 기록 목록 | 카드 마크업만 | 30 | 낮음 |

### 우선순위 제안 (비용 대비 효과 순)
1. `useAutoReveal` + `reveal.ts` + `narrate.ts` 구조 (약 110줄) — 장면과 산정표를 동기화하는 엔진.
2. `layoutEvidence`/`chainOf`, `buildGraph` 변형 (약 110줄 수정) — 온톨로지 근거 그래프를 새 알고리즘 없이 확보.
3. `stackSlots` + `c2d-drop` + `Meter` — 트럭 적재와 누적 막대.
4. 셸/레일 구조(`nav.ts` 데이터화, 서랍) — 에이전트 레일.
5. 장면·방·캐릭터 SVG는 신규 제작(TRITON의 현재 법정은 PNG 기반이라 직접 이식 불가).
6. 자유 force 그래프는 제외 또는 후순위.

### 위험 요약
- **성능**: TRITON의 장면 애니메이션은 CSS transform 위주(rAF 없음)이고 화면 밖/탭 숨김/동작 줄이기에서 정지시키는 방어가 있어 좋은 출발점. 단 이사 장면은 이동 짐 20~40개 + 인물 10명이 되므로 동시 애니메이션 수 제한 필요(실측은 하지 않음).
- **모바일**: 흐름도는 고정 폭 1020px 박스를 가로 스크롤로 보여 줌(`ControlPipeline.tsx:49`, `cr-flow-scroll`). 법정 장면은 `max-width:820px`에서 근거 패널 높이 180px로 줄이는 방식(`traditional-court.css:405-`). 자유 그래프의 `wheel` preventDefault는 모바일 스크롤과 충돌 소지. 이사 장면은 세로 모드에서 "출발 -> 트럭 -> 도착"을 세로 3단으로 접는 별도 레이아웃이 필요.
- **접근성**: `Block`에 `role=button`, `tabIndex`, 한국어 `aria-label`, Enter/Space 처리가 이미 있음(`Scale2d.tsx:46-55`) — 따라 하면 이득.
- **이미지 용량**: `dist/art/*.png` 개당 1.2~2.5MB. 이사 지킴이는 SVG/CSS 위주 권장.
- **죽은 코드 주의**: `scene2d/Person·Scale2d·Defendant2d·Backdrop·Bench·Judge`는 현재 미사용이므로 최신 동작이 검증되지 않았을 수 있음(테스트 `CourtStage.test.tsx` 97줄이 어디까지 덮는지는 확인하지 않음).

## 5. 라이선스 / 의존성 (`FE/package.json`)

| 구분 | 패키지 | 버전(설치 확인) | 라이선스 |
|---|---|---|---|
| dependencies | react / react-dom | ^19.3.0 (설치 19.3.0) | MIT |
| dependencies | react-router | ^7.18.4 (7.18.4) | MIT |
| dependencies | zustand | ^5.0.15 (5.0.15) | MIT |
| devDependencies | tailwindcss, @tailwindcss/vite | ^4.3.3 (4.3.3) | MIT |
| devDependencies | vite ^8.3.2, @vitejs/plugin-react ^6.1.1, typescript ^7.0.2, vitest ^5.0.3, playwright ^1.63.0 | - | (vite 8.3.2 MIT 확인, 나머지는 라이선스 필드 미확인) |

- **그래프·애니메이션 패키지 없음**: d3, cytoscape, reactflow, framer-motion, gsap, lottie 모두 없음. 그래프(force 레이아웃, 줌/팬, 계층 DAG)와 애니메이션(CSS keyframes, SVG transform)은 전부 직접 구현이라 **의존성 추가 없이 코드만 복사해 옮길 수 있다.**
- 이사 지킴이 `web`은 이미 Next 16 + React 19이므로 TRITON 스택(React 19, Tailwind 4, zustand 5)과 호환. react-router는 Next에서 불필요(라우팅 부분만 교체).
- 코드는 같은 사용자의 이전 작품이라 별도 라이선스 문제 없음. 단 `dist/art/` 이미지(AI 생성물, 프롬프트 md 동봉)는 생성 도구의 이용약관 확인 전까지 이사 지킴이에 재사용하지 않는 것이 안전(`unknown`).

## 6. unknown / 확인하지 못한 것
- 이사 장면 규모(짐 20~40개 + 인물 10명)에서의 실제 프레임레이트: 측정하지 않음.
- `controlLayout`의 노드 수 한계: 측정하지 않음.
- 모바일 폭 캡처: 요청 범위(1440x900)만 수행.
- 상호 검증(peer)은 Sol 담당 — 이 문서는 Sonnet 단독 조사이며 파일:줄 번호는 이번 세션에서 직접 읽은 값.
