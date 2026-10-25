# 공통 컨텍스트 (모든 팀원 프롬프트 앞에 붙는다)

오늘은 2026-10-23이다. 우리는 "AI Platform Build Challenge" 예선 기획서를 준비하는 1~3인 대학생 팀이다.
- 주최: 서울특별시, 관악구, 금천청년꿈터, 서울대학교 앵커사업단 / 운영: 데이콘(DACON)
- 예선: AI 서비스·플랫폼 기획서 PDF 제출 (마감 2026-10-25 23:59). 평가 기준은 미공개.
- 본선: 11/02~11/25 온라인 교육, 11/26 오프라인 멘토링, **11/27 09:00~18:00 하루 해커톤에서 실제로 동작하는 AI 서비스를 구현·시연**.
- 기획서 권장 항목: 문제와 주요 사용자 / 핵심 기능·이용 흐름 / AI 적용 방식·활용 데이터·기술 구성 / 구현 계획·역할 분담·기대 효과 / 외부 자료·오픈소스·AI 도구 출처.
- 개인정보·권한 없는 데이터는 쓰면 안 되고, 외부 데이터는 출처·접근 방법·이용 조건을 밝혀야 한다.

## 공통 규칙
- 사실(통계·논문·데이터셋·API·경쟁 서비스)은 반드시 URL/DOI/arXiv ID와 함께 제시한다. 확인하지 못한 값은 "unknown"이라고 쓴다. 지어내지 않는다.
- 추정과 사실을 구분해 표시한다 ("추정:" 접두어).
- 한국어로 답한다. 고유명사·논문 제목은 원문 유지.
- 파일을 수정하지 말고 최종 답변만 출력한다.

# 과제 B007 · 지휘부 검증 (당신: argon, 지휘부 — 기술·구현 관점)
**셸 명령(command)은 쓸 수 없다. 파일 읽기 도구만 쓴다.**
사용자 지시: "대시보드 형태로, AI Agent는 Ollama로, 문제를 정확하게 해결할 수 있게, 기존 공모전 사이트 디자인을 보고 색상을 정확히". 의장이 웹을 다시 만들었다.

근거 문서: `briefs/B007-이사-지킴이-대시보드.md`, `runs/out/b007-design.sonnet.md`(디자인 체계·팔레트 — 사용자가 A안 '통과증 티일' 선택), `runs/out/b007-ollama.sonnet.md`(Ollama 실측), `runs/out/b007-dashboard.sol.md`(대시보드 정보 구조), `runs/out/b006-review.argon.md`(지난 리뷰).
코드: `web/src/lib/ollama.ts`, `extract.ts`, `agent.ts`, `rules.ts`, `types.ts`, `store.ts`, `message.ts`, `rules.test.ts`, `web/src/app/api/*/route.ts`, `web/src/app/globals.css`, `web/src/components/Dashboard.tsx`, `Overview.tsx`, `InquiryPanel.tsx`, `InputView.tsx`, `Records.tsx`, `ui.tsx`.
의장 실행 결과(확인됨): 단위 테스트 16/16, tsc 통과, 빌드 성공. 실제 Ollama(ax4-light 읽기 7~13초, qwen3:4b 에이전트 11초)로 가상 사례 전체 흐름 브라우저 완주, 콘솔 오류 0. 실측에서 ax4-light가 원문에 없는 '사다리차 별도'를 지어내고 품목 발췌를 비웠고 → 원문 대조 규칙으로 막음. qwen3는 "짐 많으면 추가 나올 수 있습니다"를 놓쳐 추가비 카드가 '답 없음'으로 남음.

검토:
1. 정확성 버그 (`파일:줄` + 재현 입력): 원문 대조(verifyDraft), 에이전트 검증(NOT_PLAIN_YES·keywords), 승인·무효화(store.ts sigOf/overrides), 문의 상태 전이(InquiryPanel apply), KPI 계산.
2. Ollama 호출: 도구 호출 형식(role:"tool", tool_name), 타임아웃, 모델 없음/꺼짐 처리, WSL 호스트 자동 탐지.
3. Sol 정보 구조(b007-dashboard.sol.md)의 요구 중 빠진 것.
4. 디자인: A안 토큰(globals.css)이 b007-design.sonnet.md 값과 일치하는지, 대비·색만으로 전달 금지 준수.
출력: 심각도 표 + 반드시 고칠 것 TOP 5 + 채택 여부(찬성/반대/보류).
