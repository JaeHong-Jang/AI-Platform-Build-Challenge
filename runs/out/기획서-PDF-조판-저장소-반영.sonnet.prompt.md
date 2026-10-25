당신은 실무팀 Sonnet이다. 과제 B009 저장소 반영 — 예선 기획서 PDF 조판(표·그림·화면 캡처는 Claude 담당). 한국어.

루트: `/mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge`. scratchpad: `/tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad`.

입력(먼저 모두 읽어라):
- 본문 초안: `runs/out/b009-write.astra.md`(GPT 작성: p.1·2·3·4·6·8), `runs/out/b009-write.argon.md`(Gemini 작성: p.5·7 — 너무 길다, 핵심만 남겨 각 1쪽에 맞게 줄여라. 파일 링크·코드 경로는 지우고 기능 이름으로).
- 구성·시각화 패턴: `runs/out/b009-refs.sonnet.md`(8쪽 구성안·효과적 패턴 7개).
- 사실 검증: `runs/out/b009-market-peer.sonnet.md`, `runs/out/b009-market.sol.md`.
- 설계·구현: `decisions/D006-이사-지킴이-에이전트-관제.md`, `briefs/B009-웹-보강과-기획서.md`.
- 원래 양식(다른 금융 공모전 것 — 머리만 참고): `보고서/AI Platform Build Challenge 공모전 기획서.hwpx`의 머리 표(첨부 1 / 2026 AI Platform Build Challenge 기획서 / 팀명 / 구성원 성명). 팀명·구성원은 빈칸.
- 실제 웹 화면 캡처(1440×900, 이미 최신 빌드): `scratchpad/b009-e2e/` — 00-start, 01-parsed, 03-home-done(홈: 지금 할 일·KPI·이삿짐 장면·에이전트 10명 완료 상태·작업 보고), 04-firms(견적 받을 업체 찾기), 05-quote-read(견적 읽기·대조표), 06-agent(답변 점검), 07-ledger(근거 장부), graph-top(근거 그래프 네트워크), 10-contract, 14-mobile-home(390). 필요하면 잘라서(crop) 써라(python PIL 있으면 사용, 없으면 CSS object-position).

반드시 반영할 정정(본문 초안보다 우선):
1. '내집스캔' 이름 삭제 → "서울시는 청년에게 민간 AI 전세사기 위험분석 보고서를 무료 쿠폰으로 지원한 사례가 있다[23]".
2. 소규모 이사 피해 유형은 "241건 사례를 유형별로 중복 집계한 281건 중 추가비용 요구 70건(24.9%)" 식으로.
3. 관악구 청년 비율: "국무조정실 발표, 2024년 기준 41.4%·전국 1위[5]".
4. **이미 구현됨**으로 고칠 것: 견적 받을 업체 찾기(관악구 허가 업체 공공데이터 27곳 — 이사 구분·영업중, 가나다순, 순위·추천 없음, 전화번호 미수록), 근거 장부(모델이 낸 값 → 원문 대조 후 값 → 걸러낸 이유 → 사람 승인), 근거 그래프(힘-배치 네트워크 + 4열 근거 사슬), 에이전트 작업 보고(10명이 차례로 작동→완료, 각자 산출물 한 줄과 근거·출처). 계약서 AI 읽기만 '계획'.
5. 유사 서비스(차별성 쪽): 짐싸·미소·Yembo에 더해 **DetectHiddenFees**(해외 소비자용 AI — 견적·계약서의 숨은 수수료를 분석하고 서명 전 질문을 만든다고 판매자가 소개, 이사 전용 아님)와 Agoyu(짐 촬영 AI 견적, 예상 밖 수수료 감소 표방)를 넣고, "최초·유일·경쟁 없음" 표현 금지. 차이는 '이미 받은 한국어 견적 원문 ↔ 내 조건 대조 → 확인 질문 → 답변 검증 → 원문 근거 추적 + 로컬 실행' 흐름으로만.
6. 실측 수치(2026-10-24, 로컬 RTX 2080 SUPER 8GB, Ollama): 견적 1건 읽기 3.9초, 답변 점검 4.9초(모델 미리 올림), 조건 해석 모델 계산 1.7초, 모델 교대 시 5~7초 추가·첫 적재 37~112초. 자동 시험 67개 통과. 실측 실패 사례: 모델이 원문에 없는 '사다리차 별도'를 지어냄 → 원문 대조 검증기가 걸러냄; '지금 3층 엘베 없음'을 '모름'으로 읽음 → 같은 구절 규칙으로 보완.
7. 에이전트 팀 색(현재 웹): 채비팀 #1F4FB4, 견적팀 #7C3AED, 안심팀 #0E7869, 지휘관 #334155. 문서 색은 웹 팔레트 '안심 네이비'(브랜드 #1F4FB4, 진한 남색 #12203A, 바탕 #EFF3F8, 강조 주황 #AC4E15, 상태: 명시됨 #17603A on #E2F3E8 / 미확인 #7A4A00 on #FCF0CC / 조건 모호 #9A3412 on #FDE6DA).

만들 것:
- `보고서/build/proposal.html` (단일 HTML, A4 세로, `@page { size: A4; margin: 14mm }`, 쪽마다 `section.page` + `break-after: page`, Pretendard는 `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`) — 8쪽(최대 10쪽). 대회 5문항(1 문제 정의 · 2 해결 방식 · 3 AI 활용 · 4 차별성 · 5 구현 계획)이 쪽 머리에 번호 배지로 분명히 보이게. 쪽마다 '핵심 한 문장' 상자 → 그림/표 → 짧은 본문. 그림은 **인라인 SVG로 직접 그린다**: 피해구제 추이 막대(603·785·961), 피해 유형 막대(중복 집계 281건 중), 사용자 여정 5단, 서비스 흐름도(①~⑤ + 실제 화면 캡처), 에이전트 10명 구성도(지휘관 + 3팀, LLM 3 강조, 하단 '끌 수 없는 검증기·사람 승인' 띠), 데이터→LLM→검증기→사람 승인→근거 장부 흐름도, 수익 구조도(소비자 무료 / 기관 유료 — 업체 결제와 결과 순서는 분리), 개발 간트(10/25 예선 → 11/02~11/25 교육·개발 → 11/26 멘토링 → 11/27 해커톤). 표: 한눈에 보기, 견적 빈칸 과정, AI 기능표, 작업 방식 비교, 구현됨/계획, 검증 지표, 역할(이름 빈칸). 출처는 각 쪽 하단 작은 글씨 번호 + 마지막 쪽 출처 목록(URL).
- 캡처 이미지는 `보고서/build/img/`로 복사해 상대 경로로.
- PDF: 헤드리스 크롬으로 인쇄 — playwright-core(`scratchpad/pw/node_modules`), 실행 파일 `~/.cache/ms-playwright/chromium_headless_shell-1248/` 아래 `chrome-headless-shell`, `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })` → `보고서/이사지킴이_예선기획서.pdf` (20MB 이하 — 캡처는 JPEG 품질 80 정도로 줄여라).
- **직접 확인**: PDF를 쪽마다 PNG로 렌더(같은 크롬으로 각 section을 screenshot 하거나 pdftoppm 있으면 사용)해서 Read로 전부 보고 넘침·잘림·빈 쪽·겹침·글자 깨짐을 고친다. 쪽수가 8~10이 아니면 조정.
웹 코드(`web/`)는 건드리지 마라. 최종 응답: PDF 경로·쪽수·크기, 쪽별 제목, 직접 확인한 문제와 고친 것, 남은 문제 — 15줄 이내.