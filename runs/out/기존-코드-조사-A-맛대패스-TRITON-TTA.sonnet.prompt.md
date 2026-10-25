당신은 실무팀 Sonnet이다. 과제 B006 조사 단계. 한국어로 답한다. 코드 파일은 절대 수정하지 말고 읽기만 한다.

배경: 우리는 "이사 지킴이(가칭)"라는 모바일 웹을 만든다. 사용자가 방 사진 1~3장과 이사 견적서 이미지 1장을 올리면 → 멀티모달 LLM이 짐 목록·견적 항목을 JSON으로 추출(2번 병렬 호출) → 사용자가 원문 옆에서 수정 → 규칙 코드가 대조해 '포함 여부 미확인/조건 모호' 카드 → 업체에 보낼 확인 문구를 문장 틀로 만들어 복사. 서버는 사진을 저장하지 않는다. 상세: /mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/wiki/overviews/이사-지킴이-제작계획.md (§5~§8만 훑어라).

조사 대상 (사용자가 예전 공모전에서 만든 웹 코드, node_modules·dist는 보지 말 것):
1. /mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-pass (frontend: Vite+React+Tailwind, backend: Fastify, harness, shared)
2. /mnt/c/Users/User/Desktop/대학교/3학년/TRITON (apps/frontend "ai-court-web" React+zustand 및 그 밖의 apps/백엔드)
3. /mnt/c/Users/User/Desktop/대학교/3학년/TTA 공모전/TTA-Service (Vite+React, DESIGN.md)

각 프로젝트마다 알아낼 것 (근거는 반드시 `파일경로:줄번호`):
- 스택·폴더 구조·실행/빌드 명령, 배포 방식
- LLM/AI 호출 방식: 어느 제공사·SDK, 프롬프트 위치, 구조화 출력(JSON 스키마·zod 등), 에이전트 루프/도구 호출 패턴이 있는지, 재시도·타임아웃·폴백, API 키 관리
- 파일·이미지 업로드 처리(있다면)
- UI 패턴: 단계형 흐름(wizard), 카드, 상태 관리, 디자인 토큰·DESIGN.md 규칙, 모바일 대응
- 테스트·검증 방식(vitest, playwright, harness)
- 사용자가 반복해서 쓰는 습관(코드 스타일, 한국어 UI 문구 톤, 폴더 규칙)

마지막에 **"이사 지킴이에 그대로 가져올 것 TOP 8"**: 무엇을, 어느 파일에서, 왜, 어떻게 바꿔서. 그리고 "가져오면 안 되는 것"도 짧게.

결과 전체를 다음 파일에 작성하라: /mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/runs/out/b006-ref-a.sonnet.md
최종 답변으로는 TOP 8 요약만 짧게 돌려줘라.