# B007 조사 — 기존 웹사이트 화면 디자인 체계 (Sonnet)

조사 방식: CSS·Tailwind 설정·DESIGN.md·컴포넌트의 클래스/스타일·실제 스크린샷(masdae-pass 3장 이상, TTA qa-home, 창업 MoveValue 2장)을 확인했다. LLM 코드·프롬프트는 보지 않았다. 대비비는 WCAG 상대휘도 공식으로 직접 계산했다(스크립트 실행 결과). 경로 약칭은 아래와 같다(모두 `/mnt/c/Users/User/Desktop/대학교/3학년/` 아래).

| 약칭 | 실제 경로 |
|---|---|
| MASDAE | `AI Innovation 공모전/masdae-pass/frontend` |
| TTA | `TTA 공모전/TTA-Service` |
| TRITON | `TRITON/apps/frontend` |
| KAIST | `KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition` |
| MOVEVALUE | `창업[전세사기 및 부동산]/-Future-Value-Level-up-Challenge-/app` |
| VISTA | `VISTA 교수님 프로젝트` |
| SL | `SL 프로젝트/prototype/frontend` |

> 사실 구분: `[소스]` = 파일에 hex가 적혀 있음. `[Tailwind]` = 소스에는 클래스명만 있고 hex는 `tailwindcss@3.4.15`(MASDAE `package.json:27`)의 기본 팔레트에서 읽음(node로 `tailwindcss/colors` 출력해 확인). `[스크린샷]` = 그림에서 관찰.

---

## 0. 먼저 알아야 할 불일치 3건

1. **TTA: DESIGN.md와 실제 CSS가 다르다.** `TTA/DESIGN.md:41`은 "아이보리 `#faf9f5` + Claude Orange `#d97757`, 다크 `#1c1a17`"이라 적었다. 그러나 현재 `TTA/src/styles.css:65-98`의 라이트 토큰은 **흰 바탕 + 네이비 글자 + 파랑 강조**(`#FFFFFF`/`#0F2340`/`#2E70E5`)이고, 다크도 **네이비**(`#0F1A2E`, `styles.css:141`)다. 아이보리/오렌지가 아니다. 또 `TTA/artifacts/qa-home.png`는 이보다 오래된 **진한 네이비 다크 단일 테마** 화면이다. 따라서 "TTA 색"은 현재 `styles.css`를 정답으로 본다. (워크트리 `.claude/worktrees/ui-left-rail-redesign/src/styles.css:5-26`에는 또 다른 중성 다크 `#0b0d12`/`#6f8fff` 세트가 있으나 이전 버전.)
2. **MOVEVALUE: 스크린샷의 초록과 현재 CSS의 초록이 다르다.** 스크린샷(`deliverables/screenshots/05-*.png`)의 버튼·강조는 연한 초록(눈대중 `#5cc86a`류)이고, 현재 `styles.css:9-11`은 네이버 초록 `#03c75a`다. 스크린샷이 이전 빌드로 보인다. 정확한 hex는 CSS 기준.
3. **MASDAE 소스에는 색 hex가 거의 없다.** Tailwind 클래스(teal/slate/emerald…)만 있다. 아래 hex는 Tailwind 3.4.15 기본값으로 환산했다.

---

## 1. MASDAE — "마대 통과증" (가장 대시보드다운 구조, 에이전트 실행·근거 칩 보유)

### 1.1 색상 토큰 (라이트/다크 모두 있음, `darkMode:'class'` — `tailwind.config.js:3`)
| 역할 | 라이트 | 다크 | 근거 |
|---|---|---|---|
| 페이지 배경 | slate-50 `#f8fafc` | slate-950 `#020617` | `src/index.css:8` |
| 본문 글자 | slate-800 `#1e293b` | slate-200 `#e2e8f0` | `src/index.css:8` |
| 표면(카드) | white `#ffffff` | slate-900 `#0f172a` | `shared/ui/Card.tsx:4` |
| 카드 선 | slate-200 `#e2e8f0` | slate-800 `#1e293b` | `Card.tsx:4` |
| 사이드바 | white/80 + blur | slate-900/60 | `app/Layout.tsx:68` |
| 상단바 | slate-50/85 + blur | slate-950/80 | `Layout.tsx:74` |
| 보조 글자 | slate-500 `#64748b` / 라벨 slate-600 `#475569` | slate-400 `#94a3b8` | `index.css:39-40`, `KpiCards.tsx:14` |
| 약한 글자(메타) | slate-400 `#94a3b8` | slate-500 `#64748b` | `KpiCards.tsx:23`, `Layout.tsx:32,71` |
| 입력 선 | slate-300 `#cbd5e1` | slate-700 `#334155` | `index.css:29-31` |
| 브랜드/강조 | teal-600 `#0d9488` (버튼), teal-700 `#0f766e` hover | teal-500 `#14b8a6` 버튼(글자 slate-950), teal-400 hover | `index.css:37`; favicon `index.html:6` `#0d9488` |
| 활성 메뉴 | 배경 teal-50 `#f0fdfa` / 글자 teal-800 `#115e59` | 배경 teal-500/10 / 글자 teal-300 `#5eead4` | `Layout.tsx:43` |
| 포커스 링 | teal-500 `#14b8a6` | 동일 | `index.css:13` |
| 선택 영역 | teal-200 `#99f6e4` / teal-950 `#042f2e` | — | `index.css:14` |
| 히어로 | slate-900 `#0f172a` 배경 + 흰 글자 + teal-400 CTA | 동일 | `features/overview/index.tsx:38,52` |
| 차트 막대 | `#0d9488` [소스] | — | `shared/ui/chart.tsx:4` |
| 격자 배경 | `rgb(148 163 184 / .12)` 24px | — | `index.css:18-23` |

**상태 알약(StatusPill) — 전부 "연한 배경 50 + 진한 글자 800 + 1px inset ring"** (`shared/theme/colors.ts:29-45`, `StatusPill.tsx:10`)
| 상태 | 라벨 | 라이트(bg/글자) | 다크(bg/글자) | 점 |
|---|---|---|---|---|
| possible/ok | 가능성 있음/완료 | emerald-50 `#ecfdf5` / emerald-800 `#065f46` | emerald-500/15 / emerald-300 `#6ee7b7` | emerald-500 `#10b981` |
| check/warn | 추가 확인 필요/경고 | amber-50 `#fffbeb` / amber-800 `#92400e` | amber-500/15 / amber-300 `#fcd34d` | amber-500 `#f59e0b` |
| hard/fail | 지금은 어려움/막힘 | rose-50 `#fff1f2` / rose-800 `#9f1239` | rose-500/15 / rose-300 `#fda4af` | rose-500 `#f43f5e` |
| running | 실행 중 | sky-50 `#f0f9ff` / sky-800 `#075985` | sky-500/15 / sky-300 `#7dd3fc` | sky-500 `#0ea5e9` (+ping 애니메이션) |
| cand/wait/skipped | 후보/대기/건너뜀 | slate-100 `#f1f5f9` / slate-700 `#334155`(건너뜀은 slate-500) | slate-800 / slate-300 | slate-300/400 |

**근거 종류 칩(EVIDENCE)** — 6종, 같은 문법(50배경+800글자+ring) (`colors.ts:47-54`): 조문=indigo `#3730a3`/`#eef2ff`, 데이터=cyan, 계산=fuchsia, **가정=orange**(`#9a3412`/`#fff7ed`), LLM=violet, 입력=slate. 주장 수준 라벨 사실/추정/가정/질문(`colors.ts:56`).
**팀 색(에이전트 팀 구분)** `colors.ts:6-27`: 지휘=violet-600, 분석=sky-600, 연결=emerald-600, 검증=amber-500.
**그래프 노드 hex(cytoscape)** `colors.ts:59-73`: 마대 `#0d9488`, 재질 `#0ea5e9`, 경로 `#10b981`, 재활용 `#65a30d`, 기준 `#f59e0b`, 법조문 `#6366f1`, 폐기물코드 `#ec4899`, 처리방법 `#a855f7`, 처리업체 `#64748b`, 시멘트 `#a16207`, 지역 `#94a3b8`, 데이터셋 `#06b6d4`, 에이전트 `#8b5cf6`.
**기타 칩**: "저장된 데모 실행(실시간 아님)" amber, "LLM 켜짐" violet, "개발용 데이터" fuchsia (`app/StatusChip.tsx:11,16-24`).

### 1.2 글꼴·모양
- 글꼴: `Pretendard Variable`(1순위) → Pretendard → -apple-system … Noto Sans KR → Malgun Gothic (`tailwind.config.js:8`). 수치·ID는 `JetBrains Mono`(`tailwind.config.js:9`, `index.html` Google Fonts 400/600). 숫자 `tnum`·`ss06` (`index.css:9`), `word-break:keep-all; overflow-wrap:anywhere` (`index.css:10-11`).
- 크기 체계: 브랜드 15px/800, 그룹 라벨 11px/700, 메뉴 text-sm(14px)/500, 배지 11px/600, 칩 10~11px, KPI 숫자 28px mono 600, KPI 라벨 12px/600 (`Layout.tsx:18,32,41`, `Badge.tsx:17`, `KpiCards.tsx:14,18`). 본문 최소 11px.
- 굵기 600~800 위주(`btn` font-semibold `index.css:34`).
- 둥근 모서리: 카드 `rounded-xl`(12px), 버튼/입력 `rounded-lg`(8px), 배지 `rounded-md`(6px), 상태 알약 `rounded-full` (`Card.tsx:4`, `index.css:29,34`, `Badge.tsx:17`).
- 그림자: 카드 `shadow-sm`, 모달/메뉴 `shadow-lg`, hover 시 `-translate-y-0.5 shadow-md` (`AgentCard.tsx:20`). 장식 그림자 거의 없음.
- 간격: 카드 패딩 p-4(16px), KPI 그리드 gap-3, 섹션 gap-4, 메인 `px-4 sm:px-6 py-6 lg:py-8` (`Layout.tsx:94`).

### 1.3 레이아웃
- 왼쪽 고정 사이드바 **w-60 = 240px**, `lg`(1024px) 이상에서만 표시, 본문 `lg:pl-60` (`Layout.tsx:67-68`). 메뉴 3그룹(실행·근거·기록) + 하단 면책 문구 "법적 판정·인정서·확인서를 대신하지 않습니다" (`app/nav.ts`, `Layout.tsx:71`).
- 상단바 높이 h-14(56px) sticky, 오른쪽에 상태칩·테마 토글 (`Layout.tsx:74-86`). 모바일은 햄버거 메뉴 (`Layout.tsx:76,88`).
- 본문 최대폭 **max-w-[1280px]** 가운데 정렬 (`Layout.tsx:94`).
- 반응형: Tailwind 기본(sm 640 / lg 1024). KPI `grid-cols-2 lg:grid-cols-4` (`KpiCards.tsx:9`), 에이전트 팀 `lg:grid-cols-3` (`features/agent-team/index.tsx:59`). 390px 스크린샷 세트 있음(`docs/screenshots/*-390.png`).
- 화면 순서(스크린샷 `overview.png`): 어두운 히어로 → "이렇게 씁니다" 3단계 → KPI 4개 → 좌(막대 차트)/우(뉴스 목록) → 최근 실행 표.

### 1.4 대시보드 컴포넌트
- **KPI 타일**: 아이콘+12px 라벨 / 28px mono 숫자+단위 / 11px 출처 메모(`2024 처리현황 결과표`) / 하단 0.5 두께 teal 그라데이션 선 (`KpiCards.tsx:13-25`). 값이 없으면 `—`, 로딩은 `…`.
- **표/목록**: `.th` 12px/600 slate-500, `.td` 14px, 행 구분 얕은 선 (`index.css:40-41`). 최근 실행은 "열기 버튼 + mono 시각 + 굵은 지역 + 종류 배지 + 말줄임 요약" 한 줄 (스크린샷).
- **차트**: Recharts 막대, 단색 `#0d9488`, 오른쪽 값 라벨, 축 글자 작은 slate (`chart.tsx`, `ProblemChart.tsx`).
- **에이전트 실행 표시**: 상단 진행 레일(지휘→분석팀→연결팀→검증팀→요약, 단계마다 색 원+체크) + 지휘 카드(실행 계획 9단계, LLM 배지) + 팀 3열 카드(`AgentCard.tsx`: 이름·id mono·상태 알약·요약 3줄·소요 ms·주장/지적 수·막힘 수·LLM 표시) + 하단 "검증 게이트" 2개(조문 근거/출처/표현 검증 각각 "통과" 알약 + 경고 목록) (스크린샷 `agent-team-dark.png`). 실행 중 카드는 상단 shimmer 선+ring.
- **근거·출처 표시**: 종류별 색 칩(조문은 링크로 이동, 툴팁에 ref) `EvidenceChip.tsx:6-19`, 법 조문 칩 `LawChip.tsx:22-30`(indigo), 뉴스 목록에 출처명·날짜·원문 링크, KPI 아래 "출처·받은 날짜 기록".
- **면책/한계 문구**를 화면 곳곳에 상시 배치("문제가 실제로 있다는 2차 자료입니다. 사실관계는 원문을 확인하세요", 스크린샷).

### 1.5 규칙(문서 없음)
DESIGN.md 없음. 인쇄용 규칙만 있음(`index.css:44-48`).

---

## 2. TTA — "닿는 경보 / CAP2ALL" (토큰 체계가 가장 정교, 라이트+다크 2테마, 문서화됨)

### 2.1 색상 토큰 (현재 `src/styles.css`)
| 토큰 | 역할 | 라이트 | 다크 | 근거 |
|---|---|---|---|---|
| `--app-bg` | 앱 배경 | `#FFFFFF` | `#0F1A2E` | `styles.css:65,141` |
| `--rail` | 사이드 레일 | `#FFFFFF` | `#0C1628` | `:66,142` |
| `--panel` | 패널 | `#ffffff` | `#16233A` | `:67,143` |
| `--panel-raised` | 올라온 면/보조 면 | `#EAF1F4` | `#1A2E4A` | `:68,144` |
| `--panel-selected` | 선택 행 | `#E6EEF9` | `#1E3A5F` | `:69,145` |
| `--panel-hover` | hover 행 | `#F2F7FB` | `#1C2F4D` | `:70,146` |
| `--line` | 구분선 | `#D6E2EC` | `#24344F` | `:71,147` |
| `--line-strong` | 컨트롤 경계(3:1 목표) | `#7993AC` | `#567090` | `:72,148` |
| `--text` | 본문 | `#0F2340` | `#EAF1F4` | `:73,149` |
| `--text-soft` | 보조 | `#2B3A55` | `#C8D6E8` | `:74,150` |
| `--text-muted` | 메타 | `#5A6E8A` | `#8FA7C3` | `:75,151` |
| `--text-faint` | 가장 약한 글자 | `#68778D` | `#7A8CA6` | `:76,152` |
| `--accent` | 면·마커·보더 전용 | `#2E70E5` | `#3B82FF` | `:77,153` |
| `--accent-strong` | 보조 강조 | `#255AC1` | `#2E70E5` | `:78,154` |
| `--accent-ink` | 텍스트·솔리드 버튼 | `#1E4DB5` | `#6EA8FF` | `:79,155` |
| `--accent-soft` | 강조 배경 | `#EAF1F4` | `#1A2E4F` | `:80,156` |
| `--kraft`/`--manila` | 보조 파랑 | `#8AB0E0`/`#D6E6F7` | `#4A7094`/`#2A405C` | `:81-82,157-158` |
| `--good` / soft | 통과 | `#1E7A4C`/`#E0F0E7` | `#4ECB8A`/`#143320` | `:83-84,159-160` |
| `--warning` / `-ink` / soft | 승인 대기 | `#B07D2B`/**`#8A5F1E`**/`#F6EBD5` | `#E8B84B`/`#F0C86A`/`#3A2D14` | `:85-87,161-163` |
| `--bad` / soft / hover | 차단 | `#C0392B`/`#FDECEA`/`#A93226` | `#FF8A7A`/`#3A1E1B`/`#FF9E92` | `:88-90,164-166` |
| `--focus` | 포커스 링 | `#2E70E5` | `#6EA8FF` | `:91,167` |
| `--on-solid` | 솔리드면 위 글자 | `#ffffff` | `#0F1A2E` | `:92,168` |
| `--veil` | sticky 반투명막 | rgba(255,255,255,.97) | rgba(15,26,46,.97) | `:93,169` |
| `--phone-*` | 단말 프리뷰(테마 비추종) | ink `#0F2340`, muted `#5A6E8A`, bg `#FFFFFF` | 동일 | `:95-98` |
- 다크 전환: `<html data-theme="light|dark">`, 저장 없으면 `prefers-color-scheme`, `localStorage['cap2all-theme']`, 시스템/라이트/다크 3단 토글(`DESIGN.md:42`). 다크 블록은 `@media screen`에만(인쇄 제외) (`styles.css:139-141`).
- 주의: `--warning`(`#B07D2B`)은 글자로 쓰면 대비 미달(3.05:1)이라 글자는 `--warning-ink`를 쓰도록 규칙화(`DESIGN.md:69`).

### 2.2 글꼴·모양·간격
- `--font-sans`: Pretendard Variable → Pretendard → -apple-system → … Malgun Gothic → Noto Sans KR → Segoe UI (`styles.css:37-38`), 번들 woff2(`/fonts/PretendardVariable.woff2`, `:28-30`). `--font-mono`는 끝에 Pretendard를 둬 한글 단위("5,556건")가 깨지지 않게 함(`:39-48`). `--font-scale`(1/1.35)로 큰 글씨 모드(`:34,3072,3084`).
- 크기: rem 기반 0.66~0.82rem 다용(가장 흔함 0.68·0.72·0.73rem), 작업 본문 14~16px, 압축 메타 11px 이상(`DESIGN.md:44`). 정확한 단일 스케일은 없고 소수 rem 값이 흩어져 있음.
- 둥근 모서리 3단: 소 6px / 중 10px / 대 16px + 카드 14px + 알약 999px (`:104-117`). 패널은 DESIGN 기준 0~8px.
- 그림자 2단만: `--shadow-1: 0 1px 2px rgb(0 0 0/5%), 0 1px 3px rgb(0 0 0/7%)`, `--shadow-2: 0 4px 14px rgb(0 0 0/12%)` (`:124-125`). 장식 그림자·그라데이션·글로우 금지.
- 간격: 4/8px 배수, 행 36~52px, 패널 내부 12~20px (`DESIGN.md:45`).

### 2.3 레이아웃
- `.app-shell` 그리드: 왼쪽 **레일 232px** + 작업영역 + 하단 **28px 푸터**, 높이 100dvh, `overflow:hidden` (`styles.css:331-339`).
- 3영역(레일 / 경보 큐 / 선택 경보 작업대), 작업대는 본문 + **오른쪽 인스펙터 320px** (`:832`). 전폭 뷰는 `max-width:1280px` 가운데 (`:789`).
- 브레이크포인트: **1439px 이하** 인스펙터가 본문 아래로, **1279px**, **767px(모바일 단일 열)**, **430px** (`:3498,3508,3540,3652`). 1280 이상 관제 화면 우선(`DESIGN.md:88`). 터치 최소 44px.
- 레일 하단 알약(`.rail-pill`)이 "카드 언어"의 기준: 전체 테두리 + 14px 라운드 + 선행 점/아이콘 + 굵은 제목 + 흐린 부제 (`:711-741`, 주석 `:107-115`). 예전의 좌측 3px 색 바는 폐기(비대칭·색 단독 전달 문제).

### 2.4 대시보드 컴포넌트 (DESIGN.md:52 + src/ui/)
GlobalNav, 행형 AlertInbox, AlertWorkbench, **압축 AuditTimeline**(검증 로그), PropertiesInspector/JudgmentPanel(판단 속성·적용 표준), ReceiverCard(수신자별), EvidencePanel(인스펙터형), ApprovalGate, CapDetails; 상태 7종 idle/validating/repairing/passed/fallback/rejected/awaiting approval. 실제 화면(`artifacts/qa-home.png`, 구버전 다크): 단계 번호 라벨(`01 · 시나리오 선택`), 시나리오 카드 3열, "처리 상태 / 에이전트 결정" 2열 패널, 점선 빈 상태 상자, 상단 "검증 범위 …확인 대기입니다" 노란 안내 띠, "replay 모드 · API 키 없음" 상태 알약.
- **근거 표시**: 표준번호·조항·검증 상태·재생성 횟수·사람 승인 여부를 화면에 명시(`DESIGN.md:12`). 원문 XML과 위반 목록은 접어두는 보조 정보.
- **색만으로 상태 전달 금지**: 상태 점 옆에 항상 글자(`.tone-dot`, 주석 `:107-115`).

### 2.5 DESIGN.md 요약(금지 포함)
- 성격: "침착하고 정밀한 관제 도구", 신뢰·추적가능성 우선 (`DESIGN.md:11`).
- **금지(Avoid)**: 공포 과장 연출, 장식 애니메이션, 의미 없는 그래프, 신원·학교·팀 드러내는 브랜딩, 검증되지 않은 "AI 완료" 표현 (`:13`). 상태색은 통과·대기·차단에만 제한, 그라데이션·글로우·장식 그림자 금지 (`:41`). 떠 있는 카드 그림자 금지 (`:46`). 색 직접 기입 금지, `var(--토큰)`만 (`:58`). 새 색은 라이트+다크 둘 다 정의 후 명암비 계산 (`:78`).
- Tailwind·컴포넌트 라이브러리 추가 금지, CSS 변수만 (`:106`). WCAG 2.2 AA, 본문 4.5:1, 큰 글자·컨트롤 3:1 (`:83`). 모션은 처리 단계 강조에만, reduced-motion 지원 (`:47`).
- 레퍼런스: Linear 스타일 고밀도 master-detail **구조**만 차용, 브랜드·색은 복제 안 함 (`:8`).

---

## 3. TRITON — 석조 법정 콘솔 (웜 스톤+황동, 라이트 단일)

### 3.1 색상 토큰 [소스] (`src/index.css:11-38` — `@theme`)
- 역할색: `--color-pro #922a22`(찬성/적갈), `--color-pro-soft #f7e8e5`, `--color-con #1f3a66`(반대/남색), `--color-con-soft #e7edf6`, `--color-wood #7c4a26`, `--color-ink #302923`.
- **stone** 스케일(중성, 웜): 50 `#faf8f4`, 100 `#f0eae1`, 200 `#e2d9cb`, 300 `#cbbfae`, 400 `#a09282`, 500 `#75695e`, 600 `#625549`, 700 `#514439`, 800 `#3d332a`, 900 `#29221d`.
- **brass** 스케일(강조): 50 `#faf6ed`, 100 `#f1e7d3`, 200 `#e5d1ac`, 300 `#dfbf8b`, 400 `#c2a16b`, 500 `#a18452`, 600 `#8b7049`, 700 `#745935`, 800 `#5a4227`, 900 `#40321f`.
- 고정 hex: 페이지 배경 `#f6f2ea`, 글자 `#302923` (`index.css:48-49`), 포커스 `outline:3px solid #8b7049` (`:59-62`), 사이드바 `#241d18`/글자 `#c9bcab`, 활성 `#453628`/`#f7e8ce`, 상단바 `#fcfaf6`+선 `#ded5c8` (`src/console/console.css:3-11`), 패널 선 `#d8ccba`/면 `#faf8f4` (`features/control/control-room.css:58-64`), KPI 좌측 3px 선 `#b8955c` (`console.css:29`).
- 상태 배지(Tailwind): green=emerald-100/800, amber=amber-100/900, red=red-100/800, dark=stone-800/amber-200 (`src/ui/Badge.tsx:11-14`). 진행바 기본 amber-500 (`console/parts.tsx:21`).
- 다크 테마 없음.

### 3.2 글꼴·모양
- Pretendard Variable → Noto Sans KR → Malgun Gothic (`index.css:12`), 번들 woff2 `index.css:3-9`, `word-break:keep-all` (`index.css:51-52`). 관제 본문 13px, h2 26px/740, h3 16px/740, eyebrow 11px/740 + letter-spacing .08em (`control-room.css:8,30-35`). 굵기 700~740.
- 라운드: 패널 `rounded-lg`/8px, 버튼 5px, 입력 6px, 히어로 8px. 그림자 거의 없음(`box-shadow:none` `control-room.css:63`, 패널 `0 2px 8px #40321f05` `console.css:10`).

### 3.3 레이아웃
- 왼쪽 어두운 사이드바 **216px**(≥900px), **64px 아이콘 레일**(768~899px), 768 미만은 오버레이 메뉴 `w-[min(18rem,85vw)]` (`console/ConsoleShell.tsx:88,125`). 활성 항목은 왼쪽 3px brass 막대 (`:33`). 메뉴 항목 min-h 44px.
- 페이지 최대폭 `max-w-[1600px]` (`console/parts.tsx:43`), 관제 작업실 `max-width:1760px; padding:24px 28px 32px` (`control-room.css:2-8`).

### 3.4 대시보드 컴포넌트 / 디자인 규칙
- KPI(왼쪽 3px 황동 막대), 석조 히어로(어두운 `#2c241d` + 그라데이션 덮개 + 아트), 공용 `PANEL = rounded-lg border border-stone-200 bg-white` (`parts.tsx:5`), `Meter`(1.5 두께 진행바 + aria progressbar `:21-25`), 그래프 관제(ControlPipeline·ControlEvidence·ControlLog·GraphCanvas), 증거 상태 배지 verified/misnumbered/title/present/fabricated → 초록/노랑/회색/회색/빨강 (`Badge.tsx:28`).
- `AGENTS.md`는 코드 구조·명령만 있고 **색·디자인 규칙은 없음**(`AGENTS.md:1-26`). 제품 책임자 결정: 법정 캐릭터 1명만, 법정 위엔 기사 제목만(`AGENTS.md:26`).
- 이 프로젝트는 **세계관(법정) 테마색**이 강해 "이사 지킴이"에는 그대로 맞지 않는다. 그러나 stone+brass 중성 스케일 구조 자체는 참고할 만하다.

---

## 4. KAIST — 성남 AI 카드뉴스/3D 여행 (Apple식 중성 + 초록·파랑·보라)

### 4.1 색상 토큰 [소스] (`src/app/globals.css:2-9`, 라이트 단일)
| 토큰 | hex | 역할 |
|---|---|---|
| `--paper` | `#f5f5f7` | 페이지 배경 (Apple 회색) |
| `--ink` | `#1d1d1f` | 본문 |
| `--muted` | `#61656c` | 보조 글자 |
| `--line` | `#e3e3e7` | 선 |
| `--blue` | `#244cc5` | 링크·실행 중 |
| `--green` | `#176a59` | 승인·브랜드 포인트 |
| `--purple` | `#7854af` | 로고 3번째 막대 |
| `--white` | `#fff` | 표면 |
- 상태칩(`globals.css:450-473`): 기본 `#546377` on `#e8edf5`, running/queued `--blue` on `#e7edff`, approved/ready `--green` on `#e3f1eb`, needs_review/failed `#9c482c` on `#fff0e6`. 활동 점 7px green / 진행 중 blue pulse (`:1058-1070`). 위험 글자 `#aa513d`.
- 에이전트 센터 강조 `--agent-accent:#176a59` (`components/agent-center.css:1`), 역할 노트 배경 `#edf3ef`/선 `#d9e6e1` (`:10`), 중지 안내 `#865321` (`:35`).
- 안내 박스: 데모 안내 `#445b7f` on `#f4f7fc` 선 `#d6dfee`, 검토 경고 `#70511a` on `#fff8e8` 선 `#e3d2a8` (`components/review-trace.module.css:31-46`).
- 포커스 `outline:3px solid #8099ec` (`globals.css:46-52`).
- 3D 여행 화면(DESIGN.md)은 별도 "초록 글자·크림 건물·청록 물·금색 + 반투명 크림 패널" 팔레트를 말하나(`DESIGN.md:11,28`), 해당 hex는 `diorama*.css`에 있어 이번 범위에서 정밀 추출하지 않음(`unknown`).

### 4.2 글꼴·모양·레이아웃
- 글꼴 `"Noto Sans KR", sans-serif` (`globals.css:10`) — **Pretendard 아님**. 제목 40px/600, letter-spacing -1.4px (`:171-176`), 에이전트 h1 `clamp(30px,3.4vw,46px)`, 본문 13~16px, 라벨 11~12px, 지표 숫자 30px/600 tabular-nums (`agent-center.css:5,22-25`). 한글 자간을 음수로 조임.
- 라운드: 카드 16~22px, 알약 버튼 24~28px, 칩 4px, 코드칩 5px — 큼 (`agent-center.css:8,18,48`, `globals.css:450`). 그림자 거의 없음, 선으로 구분.
- 상단바 높이 92px, 좌우 42px 패딩, 흰 배경 + 1px 선 (`globals.css:87-96`). 사이드바 없음(상단 탐색). `.workspace` 최대 1720px(플랫폼은 1640px), 패딩 36px (`:159-163, 2116-2118`).
- 브레이크포인트: 1450 / 1250 / 1220 / 1100 / 760 / 600px (`globals.css:3043,3075,1212`, `agent-center.css:73-75`).
- DESIGN.md 규칙: 한 도시·한 캔버스, 공식 자료와 실제 사진을 신뢰 근거로, **번쩍이는 효과·정밀 측량으로 오인할 표현 금지**, 모형 표현과 사실 구분, 근거 없는 가게·외관 지어내기 금지, `그때/지금/만약` 라벨로 출처·날짜 표시 (`DESIGN.md:11,23,42,56`).

### 4.3 대시보드 컴포넌트
- 에이전트 센터(`components/agent-center.css`): 4열 지표(`dt` 12px muted / `dd` 30px) 구분선 위아래 (`:22-25`), 최신 활동 박스 `#f5f7f9` 12px 라운드(`:27`), 스킬 카드 3열 details(`:47-60`), **이벤트 타임라인** 104px 시각열 + 접히는 detail(`:61-68`).
- 검토 이력 trace(`review-trace.module.css`): 체크 개수 요약, 데모 안내/경고 박스.
- 근거: 사진·출처·날짜 표기, 장소별 출처 격리 (`DESIGN.md:53-58`).

---

## 5. MOVEVALUE — 창업(전세사기·부동산) 아파트 매칭 (**도메인이 이사 지킴이와 가장 가까움**)

### 5.1 색상 토큰 [소스] (`app/styles.css:2-22`, 라이트 단일)
| 토큰 | hex | 역할 |
|---|---|---|
| `--bg` / `--panel` | `#ffffff` | 배경/패널 |
| `--ink` | `#111827` | 본문 |
| `--muted` / `--muted-2` | `#64748b` / `#94a3b8` | 보조/더 약한 글자 |
| `--line` / `--line-soft` | `#e2e8f0` / `#eef2f7` | 선 |
| `--naver` / `--naver-strong` / `--naver-soft` | `#03c75a` / `#00b14f` / `#e8f8ef` | 브랜드 초록(주 버튼·안전) |
| `--blue` / `--bus` | `#2563eb` / `#386de8` | 링크·버스 경로 |
| `--walk` | `#64748b` | 도보 |
| `--gold` | `#b98a00` | 주의 |
| `--danger` | `#ef4444` | 위험 |
| `--purple` | `#6d5dfc` | 보조 |
| `--shadow` / `--shadow-strong` | `0 4px 12px rgba(0,0,0,.08)` / `0 18px 48px rgba(15,23,42,.16)` | 그림자 |
| `--sidebar-width` / `--subpanel-width` | `460px` / `clamp(568px,40vw,1040px)` | 레이아웃 |
- 면 색: 보조 면 `#f8fafc`(27회 사용), 주의 행 `#fffaf0` / 알약 `#fff8df`, 위험 행 `#fff7f7` / 알약 `#fff1f2` (`:2951-3066`).
- **위험 3단 알약**(`:2951-2988`): safe(선 rgba(3,199,90,.35), 배경 `#e8f8ef`, 글자 `#00b14f`), warn(선 rgba(185,138,0,.35), `#fff8df`, `#b98a00`), danger(선 rgba(239,68,68,.35), `#fff1f2`, `#ef4444`). 위험 신호 행은 `warn`=연노랑 배경, `danger`=연분홍 배경 + 같은 색 약한 선 (`:3056-3066`). 단계 타임라인 `.tenancy-step.risk-danger/-warning` 동일 문법 (`:3271-3278`).
- 주 버튼: 초록 면 + 흰 글자 (`:948-956`).

### 5.2 글꼴·모양·레이아웃
- 글꼴 `Pretendard, Inter, -apple-system, … "Apple SD Gothic Neo", "Noto Sans KR"` (`:40`). 라벨 11~12px/900, 알약 12px/900, 항목 제목 12~14px.
- 라운드: **8px가 40회로 지배적**, 알약 999px 22회, 10px 14회, 12px 6회, 원 50% 15회. 그림자는 `--shadow` 한 가지 위주(카드 선택 시 초록 테두리).
- 레이아웃: 전체 화면 지도 + **왼쪽 460px 사이드바**(`mv-sidebar`) + 선택 시 **오른쪽 서브패널**(탭 5개: 매칭 결과/아파트 정보/출퇴근 경로/주변 인프라/전세 위험 점검) + 리사이저 (`index.html:20,130-172`). 반응형 시 사이드 360px/서브 512px (`styles.css:4262-4263`).
- 구성: 슬라이더 가중치 → "매칭하기" 버튼 → 순위 카드(번호 원 + 이름 + 위치·월세·시간 + 즐겨찾기 별) → 상세 패널의 **2열 라벨/값 정보 타일**(작은 라벨 + 큰 값 + 회색 작은 설명) 섹션들 (스크린샷 05).
- **근거 표시**: 각 섹션 제목 오른쪽에 데이터 출처 문구("공개 단지정보 + 인근 전세 실거래 기반 추정", "프로토타입 데이터", "실거래 API 연계 전 추정"), 위험 점검 아래 면책문 "법적 판정이 아니며 등기부등본·건축물대장·임대인 세금 체납 여부 확인을 대체하지 않습니다" (스크린샷 08).
- 위험 점검 행: 제목+설명 / 오른쪽 굵은 결과값("-8.9% · 양호", "7.0% · 주의", "미입력 · 미확인") — 행 배경색이 곧 등급(파랑 회색=양호, 노랑=주의, 분홍=필수 확인/미확인). 체크리스트는 "필수 확인/확인 필요" 오른쪽 라벨.

### 5.3 주의: 대비 미달
원본 상태 색 쌍은 AA 미달(계산 결과 §8). 이 팔레트를 쓰려면 글자색을 진하게 보정해야 한다(보정값은 §7 안 C에 따로 표기).

---

## 6. VISTA, SL (간단)

### VISTA — 제주 길안내 앱 (대시보드 아님: 모바일 지도 + 바텀시트)
- 토큰 [소스] `front/src/styles/tokens.ts:1-14`: **hallabong**(오렌지) 100 `#FBE9D7` / 300 `#F4B888` / 500 `#E87A3E` / 700 `#B85626`; **ocean**(청록 남색) 50 `#EEF6FA` / 100 `#D5E8F1` / 200 `#A8CFDF` / 400 `#4F8FAA` / 600 `#1E5F7A` / 700 `#154A60` / 900 `#0B2A38`; **basalt**(현무암 회색) 50 `#F4F3F1` … 900 `#1F1E1B`; **cream** 50 `#FCFAF5` / 100 `#F8F3EC` / 200 `#EFE7DA`. 컨테이너 `cream-100`, 마커 hallabong-500+흰 테두리 (`MainPage.styles.ts:6-11,20,31`).
- 레이아웃: 바텀시트 높이 70%, 상단 라운드 28px, 그림자 ocean-700 (`MainPage.styles.ts:44-55`). 웹 HTML(`dashboard/index.html`, `webapp/index.html`은 동일 파일): 폭 `min(100%,430px)` 폰 프레임 라운드 32px, 배경 `#c8ddeb`, 파란 `#3182ce/#3b82f6/#2563eb` 계열, 글꼴 시스템 sans (`dashboard/index.html:10-30`). 디자인 체계가 앱·웹에서 서로 다름(앱 = 3색 토큰, 웹 = 임시 파랑).
- 이번 "대시보드 형태"에는 직접 참고 가치 낮음.

### SL — 보행부담 경로 프로토타입
- `src/styles.css:4-8`: `--green #2e7d32`, `--orange #f9a825`, `--red #c62828`, `--gray #6b7280`, `--panel-w 340px`. 본문 `#1f2430` 14px, Pretendard → Noto Sans KR (`:14-17`).
- 결과 판정 박스 3종: within=초록(`#ecfdf5` 배경 / `#166534` / 선 green), reclassified=빨강(`#fef2f2` / `#991b1b`), both_over=주황(`#fff7ed` / `#9a3412` / `#ea580c`) (`:67-74`). 안내 배지 indigo `#eef2ff`/`#3730a3` 선 `#c7d2fe` (`:75-78`).
- 레이아웃: 왼쪽 340px 패널(흰 배경, 오른쪽 선 `#e3e6ea`) + 지도 (`:21-33`). 버튼 radius 6px, 판정 박스 10px.
- 주목: 판정 박스 색 쌍(`#166534/#ecfdf5`, `#9a3412/#fff7ed`, `#991b1b/#fef2f2`)은 Tailwind 800/50 문법과 같다 — MASDAE와 동일 규칙.

---

## 7. 이사 지킴이 대시보드 — 팔레트 후보 3안

이 대시보드가 보여줄 4가지 판독 상태: **명시됨 / 포함 여부 미확인 / 조건 모호 / 판독 불가**. 모든 안에서 "색 + 아이콘/글자 라벨 + (판독 불가는) 점선 테두리"로 이중 표기한다(TTA `DESIGN.md:41,83` 규칙). 아이콘 제안: 명시됨 ✓, 미확인 ?, 조건 모호 △(또는 ≈), 판독 불가 ⌀(또는 ✕).

### 안 A — "통과증 티일" (MASDAE에서 가져옴) — 추천 1순위
출처: MASDAE `colors.ts`, `index.css`, `Layout.tsx`(구조·근거 칩·에이전트 실행 표시까지 그대로 대시보드로 이어짐). 라이트+다크 둘 다 존재.

| 토큰 | 라이트 hex | 다크 hex | 역할 |
|---|---|---|---|
| bg | `#f8fafc` | `#020617` | 페이지 배경 |
| surface | `#ffffff` | `#0f172a` | 카드 |
| border | `#e2e8f0` | `#1e293b` | 카드 선 |
| text | `#1e293b` | `#e2e8f0` | 본문 |
| text-sub | `#475569` | `#94a3b8` | 보조 |
| text-meta | `#64748b` | `#94a3b8` | 메타(11~12px는 이 값까지만) |
| brand | `#0f766e`(teal-700, 버튼 면) | `#14b8a6` | 브랜드·주 버튼 (원본은 teal-600 `#0d9488`) |
| brand-ink | `#115e59` | `#5eead4` | 활성 메뉴 글자 |
| brand-soft | `#f0fdfa` | teal-500/10 | 활성 메뉴 배경 |
| focus | `#14b8a6` | `#14b8a6` | 포커스 링 |
| hero | `#0f172a` | `#0f172a` | 상단 요약 띠(흰 글자) |
| info(진행 중) | `#075985` on `#f0f9ff` | `#7dd3fc` | 실행 중 |
| 근거-조문 | `#3730a3` on `#eef2ff` | `#a5b4fc` | 법 조문 칩 |

**4상태 매핑(라이트: 배경50 + 글자800 + ring, 다크: 색/15% + 글자300)**
| 상태 | 색족 | 라이트 배경/글자 | 대비 | 다크 글자/배경(색 15% 합성) | 대비 | 표식 |
|---|---|---|---|---|---|---|
| 명시됨 | emerald | `#ecfdf5` / `#065f46` | 7.29 | `#6ee7b7` / `#0f2f37` | 9.30 | ✓ 실선 |
| 포함 여부 미확인 | amber | `#fffbeb` / `#92400e` | 6.84 | `#fcd34d` / `#322b25` | 9.66 | ? 실선 |
| 조건 모호 | orange | `#fff7ed` / `#9a3412` | 6.88 | `#fdba74` / `#322527` | 8.71 | △ 실선 |
| 판독 불가 | slate | `#f1f5f9` / `#334155` | 9.45 | `#cbd5e1` / `#1c2539` | 10.30 | ⌀ **점선** |
- 이 매핑은 MASDAE 문법을 그대로 따르되(orange=가정, amber=추가 확인, slate=후보/건너뜀), 4상태에 orange를 가져온 것은 내 선택이다. amber와 orange는 색상이 가까우므로 아이콘·라벨 필수. 구분이 약하면 조건 모호를 violet(`#5b21b6` on `#f5f3ff`, 8.19)로 바꾸는 대안 가능.

**글자 대비(AA 4.5:1)**: 본문 slate-800/흰 14.63, slate-600/흰 7.58, slate-500/흰 4.76(통과, 11px 메타 한계선). **주의 2건**: ① 흰 글자 on teal-600(`#0d9488`) = 3.74로 **미달** — 원본 `btn-primary`(`index.css:37`)가 이 조합이라 버튼 면은 teal-700(5.47)로 올릴 것. ② slate-400(`#94a3b8`) on 흰 = 2.56 **미달** — 원본 KPI 메모(`KpiCards.tsx:23`)가 이 색이라 쓰지 말 것.

### 안 B — "관제 네이비" (TTA에서 가져옴) — 토큰 구조가 가장 완성돼 있음
출처: TTA `styles.css:65-171` 값을 **그대로** 사용. 라이트+다크, 의미 토큰, 모든 글자 쌍이 AA를 목표로 이미 설계됨.

| 토큰 | 라이트 | 다크 | 역할 |
|---|---|---|---|
| `--app-bg` | `#FFFFFF` | `#0F1A2E` | 배경 |
| `--rail` | `#FFFFFF` | `#0C1628` | 사이드 레일 |
| `--panel` | `#ffffff` | `#16233A` | 패널 |
| `--panel-raised` | `#EAF1F4` | `#1A2E4A` | 보조 면 |
| `--line` / `--line-strong` | `#D6E2EC` / `#7993AC` | `#24344F` / `#567090` | 선 / 컨트롤 경계 |
| `--text` | `#0F2340` | `#EAF1F4` | 본문 |
| `--text-soft` | `#2B3A55` | `#C8D6E8` | 보조 |
| `--text-muted` | `#5A6E8A` | `#8FA7C3` | 메타 |
| `--text-faint` | `#68778D` | `#7A8CA6` | 가장 약함 |
| `--accent` / `--accent-ink` / `--accent-soft` | `#2E70E5` / `#1E4DB5` / `#EAF1F4` | `#3B82FF` / `#6EA8FF` / `#1A2E4F` | 강조 면 / 텍스트 / 배경 |
| `--good` / soft | `#1E7A4C` / `#E0F0E7` | `#4ECB8A` / `#143320` | 통과 |
| `--warning-ink` / soft | `#8A5F1E` / `#F6EBD5` | `#F0C86A` / `#3A2D14` | 대기(글자는 `-ink`) |
| `--bad` / soft | `#C0392B` / `#FDECEA` | `#FF8A7A` / `#3A1E1B` | 차단 |
| `--on-solid` | `#ffffff` | `#0F1A2E` | 솔리드면 위 글자 |

**4상태 매핑**
| 상태 | 토큰 쌍 (라이트) | 대비 | 다크 쌍 | 대비 | 표식 |
|---|---|---|---|---|---|
| 명시됨 | `--good` `#1E7A4C` on `--good-soft` `#E0F0E7` | 4.51 | `#4ECB8A` on `#143320` | 6.71 | ✓ |
| 포함 여부 미확인 | `--warning-ink` `#8A5F1E` on `#F6EBD5` | 4.75 | `#F0C86A` on `#3A2D14` | 8.42 | ? |
| 조건 모호 | `--accent-ink` `#1E4DB5` on `--accent-soft` `#EAF1F4` | 6.60 | `#6EA8FF` on `#1A2E4F` | 5.63 | △ |
| 판독 불가 | `--text-muted` `#5A6E8A` on `--panel-raised` `#EAF1F4`, 점선 | 4.56 | `#8FA7C3` on `#1A2E4A` | 5.53 | ⌀ |
- 판독 불가에 `--bad`를 쓰는 변형도 가능(대비 4.76/6.64) — 다만 TTA는 `--bad`를 "차단"에만 한정하므로 "판독 불가=차단" 의미로 읽힌다. 이 대시보드에서 판독 불가가 위험 신호가 아니라면 중성으로 두는 쪽을 권장.
- 본문 `#0F2340` on 흰 15.73, 메타 `#5A6E8A` 5.21, faint `#68778D` 4.55(한계선). 솔리드 파랑 버튼 흰 글자 4.60(통과, 여유 작음). 라이트 `--line-strong` `#7993AC` on 흰 3.19(컨트롤 3:1 통과). 단, `--good`/soft 4.51, 경고·차단도 4.5~4.8 사이로 **여유가 작다** — 12px 이하 굵지 않은 글자에는 쓰지 말 것.

### 안 C — "안심 그린 + 위험 3단" (MOVEVALUE에서 가져옴, **글자색 보정 필요**)
출처: MOVEVALUE `styles.css:2-22,2951-3066` — 전세 위험 점검 화면과 문법이 같음(연한 면 + 같은 색 약한 선 + 오른쪽 등급 라벨). **원본 대비 미달**이라 아래 "보정" 열이 실제 사용값이며 내 제안(원본 아님)이다.

| 토큰 | 원본 hex | 보정 후 hex(제안) | 역할 |
|---|---|---|---|
| bg / panel | `#ffffff` | 동일 | 배경 |
| surface-sub | `#f8fafc` | 동일 | 보조 면(정보 타일) |
| ink | `#111827` | 동일 | 본문(17.74) |
| muted | `#64748b` | 동일 | 보조(4.76; `#94a3b8` muted-2는 2.56 미달이라 글자 금지) |
| line | `#e2e8f0` | 동일 | 선 |
| brand | `#03c75a` | `#15803d`(버튼 면, 흰 글자 5.02) | 주 버튼. 원본 흰 글자 2.25 미달 |
| brand-soft | `#e8f8ef` | 동일 | 안전 배경 |
| safe-ink | `#00b14f`(2.58 미달) | `#166534`(6.49 on `#e8f8ef`) | 명시됨 글자 |
| warn-soft / warn-ink | `#fff8df` / `#b98a00`(2.95 미달) | `#fff8df` / `#8a5f00`(5.31) | 미확인 |
| danger-soft / danger-ink | `#fff1f2` / `#ef4444`(3.43 미달) | `#fff1f2` / `#b91c1c`(5.89) | (위험 단계용) |
| info | `#2563eb` | `#1d4ed8` on `#eff6ff` 6.16 | 링크·정보 |
| 다크 | 없음 | 없음(필요 시 안 A/B 다크를 차용) | — |

**4상태 매핑(보정값)**
| 상태 | 배경/글자 | 대비 | 표식 |
|---|---|---|---|
| 명시됨 | `#e8f8ef` / `#166534` | 6.49 | ✓ |
| 포함 여부 미확인 | `#fff8df` / `#8a5f00` | 5.31 | ? |
| 조건 모호 | `#fff7ed` / `#9a3412` (MOVEVALUE에 없는 주황, 안 A에서 차용) | 6.88 | △ |
| 판독 불가 | `#f1f5f9` / `#334155`, 점선 | 9.45 | ⌀ |
- 장점: 이미 "전세 위험" 문맥(주의=노랑, 필수 확인=분홍)이 화면에 검증돼 있다. 단점: 다크 모드 없음, 원본이 AA 미달, 초록이 네이버 브랜드색과 겹쳐 오해 소지.

### 후보 비교 한눈에
| | 안 A 티일 | 안 B 네이비 | 안 C 안심 그린 |
|---|---|---|---|
| 출처 프로젝트 | MASDAE | TTA | MOVEVALUE |
| 다크 모드 | 있음 | 있음 | 없음 |
| 의미 토큰 명세 | 클래스 기반(hex는 환산) | CSS 변수 + 문서 규칙 | CSS 변수, 일부 미달 |
| AA 여유 | 큼(상태색 6.8~9.5) | 작음(4.5~4.8 구간 다수) | 보정 후 5~9 |
| 대시보드 구조 실물 | 사이드바+KPI+에이전트 실행+근거 칩 | 레일+큐+작업대+인스펙터 | 지도 중심(대시보드 아님) |
| 도메인 근접성 | 중(폐기물 규정 판정) | 중(규정 검증 로그) | **높음(전세·이사)** |
- 조사자 의견(판정 아님): 상태 4종이 "판독 결과"이므로 **안 A의 색 문법(50배경+800글자+ring+점 라벨)**에 **안 B의 토큰 구조(`--accent-ink`·`--on-solid`·`-soft` 쌍, 다크 오버라이드, `data-theme`)**를 얹는 혼합이 가장 안전하다. 색 자체는 안 A(teal 계열)를 쓰면 이사 지킴이와 "지킴이=안심=초록/청록" 연상이 맞는다. 최종 선택은 사용자·지휘부 판정.

---

## 8. 사용자 디자인 지문 (프로젝트 공통 취향)

1. **Pretendard Variable이 1순위 글꼴**(MASDAE·TTA·TRITON·MOVEVALUE·SL, KAIST만 Noto Sans KR) + 한글 `word-break:keep-all` + 숫자는 mono/tabular로 정렬. 폰트를 번들해 오프라인에서도 같게 보이게 한다(TTA `:28-30`).
2. **밝은 중성 바탕 + 흰 패널 + 1px 얕은 선**이 기본. 큰 그림자·글로우를 피하고 면 명도와 선으로 층을 만든다(TTA 그림자 2단, MOVEVALUE `--shadow` 하나, TRITON `box-shadow:none`). 모서리는 8~12px(MASDAE 12/8, MOVEVALUE 8, TTA 10/14, TRITON 8)이며 상태는 999px 알약.
3. **강조색 하나 + 의미색 3종**: 청록/초록(MASDAE teal, KAIST `#176a59`, MOVEVALUE `#03c75a`, SL `#2e7d32`) 또는 파랑(TTA, KAIST, SL)이 주 강조이고, 상태는 초록·황·적(+회색)으로 제한한다.
4. **상태 칩 문법이 동일**: 연한 틴트 배경 + 진한 글자 + 얇은 같은 계열 선, 앞에 점/아이콘, 항상 글자 라벨(MASDAE 50/800+ring, SL `#ecfdf5/#166534`, MOVEVALUE 연틴트+선, KAIST 칩). "색만으로 전달 금지"를 명시(TTA).
5. **신뢰·근거를 화면 요소로 둔다**: 근거 종류 칩(MASDAE), 표준·조항·승인 여부(TTA), 출처·날짜·그때/지금/만약(KAIST), 섹션 우측 데이터 출처 문구(MOVEVALUE). **"법적 판정이 아니다" 면책 문구**를 사이드바·본문에 상시 노출(MASDAE, MOVEVALUE, KAIST).
6. **왼쪽 내비게이션 + 상단 얇은 바 + 본문 1280px 근방**: MASDAE 240px/TTA 232px/TRITON 216px 레일, 본문 최대 1280(MASDAE·TTA)~1600/1760(TRITON·KAIST). 좁아지면 인스펙터를 본문 아래로, 모바일 단일 열, 터치 44px.
7. **KPI는 "작은 라벨 + 큰 mono 숫자 + 단위 + 한 줄 출처"**(MASDAE `KpiCards.tsx`, KAIST 지표 `dt/dd`, TRITON 좌측 막대)이고 값이 없으면 `—`/`unknown`으로 정직하게 표시.
8. **다크 모드는 라이트와 같은 의미 토큰의 오버라이드**(MASDAE `dark:`, TTA `data-theme` + `localStorage` + 첫 페인트 전 스크립트 `index.html:11-18`). 둘 다 시스템 설정을 따르고 수동 토글을 제공한다. 에이전트 실행은 단계 레일 + 팀 카드 + 게이트 "통과/막힘" 알약으로 보인다.

---

## 9. 검증되지 않은/불확실한 점 (`unknown`)
- KAIST 3D 여행(`diorama*.css`) 팔레트 hex, TTA 워크트리 이전 버전 UI의 실제 렌더는 정밀 확인 안 함.
- MASDAE의 hex는 소스가 아니라 Tailwind 3.4.15 환산값(색 정의가 클래스명뿐).
- MOVEVALUE 스크린샷(연초록)과 현재 CSS(`#03c75a`) 불일치 — 어느 쪽이 최종 제출물인지 미확인.
- TTA `DESIGN.md`(아이보리/오렌지)가 현재 CSS와 다른 이유는 확인하지 못함(문서가 낡은 것으로 추정, 증거는 `styles.css` 실제 값).
- 대비비는 단색 쌍 계산값. 반투명 배경(다크 `/15`)은 `#0f172a` 위 합성값으로 근사. 글자 크기·굵기별 AA 적용(큰 글자 3:1)은 일괄 4.5:1 기준으로 보수적으로 판정.
