당신은 실무팀 Sonnet이다. 과제 B009 상호 검증 — 웹 '이사 지킴이 v0.3'의 기능 구분·누락, UI 대칭·위치, 사용자 불편 전수 점검. 한국어. 코드는 고치지 말고 결과 문서 하나만 쓴다.

앱: http://127.0.0.1:3100 (이미 실행 중, Next 16). 코드 `/mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/web/src`. 설계 `../decisions/D006-이사-지킴이-에이전트-관제.md`. playwright-core `/tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/pw/node_modules`, 크롬 `~/.cache/ms-playwright/chromium_headless_shell-1248/` 아래 `chrome-headless-shell`. 기존 흐름 스크립트 `scratchpad/pw/v3.js` 참고. 캡처는 scratchpad `b009-audit/`. 새 브라우저 컨텍스트는 sessionStorage가 비어 시작 화면부터 나온다. '가상 사례로 해 보기'로 빠르게 채울 수 있다(로컬 Ollama 사용, 몇 초~수십 초).

사용자 불만(원문): "대기만 뜨고 동작이 안돼", "기능들 잘 구분이 되어있고 해당 기능에 필요한 기능들이 잘 나와있는지", "UI 부분적으로 별로인 것들 대칭이 안 맞거나 위치가 이상한 것들", "아직도 사용자가 불편할 부분들", "너무 오래 걸려".

할 일 (1440×900과 390×844, 라이트·다크 모두 캡처하고 Read로 직접 본다):
1. 화면별(시작·홈·짐·조건·견적·업체·계약·서류·근거 그래프·참고 조항·실행 기록·레일) **기능 지도**: 그 화면의 목적, 있는 기능, 목적상 빠진 하위 기능, 다른 화면과 겹치거나 섞인 기능.
2. **시각 결함 목록**: 대칭·정렬·간격·잘림·겹침·넘침·높이 불일치·빈 공간·글자 크기 불균형·버튼 위치 이상 — 캡처 파일명과 좌표/요소(CSS 선택자)로. 심각도 상/중/하.
3. **사용자 불편**: 클릭 수, 막히는 지점, 뜻이 불분명한 문구, 기다림(실제 걸린 초를 재라 — 장면 공개 연출 900ms×카드 수 포함), 되돌리기 어려움, 모바일 조작.
4. "대기만 뜨고 동작이 안 된다"의 원인을 코드로 설명(`src/components/HomeView.tsx`의 agents 상태 계산, `src/lib/agents.ts`, `src/components/scene/*`) — 어떤 조건에서 '작동 중'이 되는지, 왜 사용자는 대기만 보는지.
5. 우선순위 표(P0 시연 전 필수 / P1 / P2) — 각 항목에 고칠 파일과 구체 수정 방향.
결과: `/mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/runs/out/b009-audit.sonnet.md`. 최종 응답: P0 목록과 '대기만 뜸' 원인 요약 20줄 이내. 비밀 파일(.env*) 읽지 마라.