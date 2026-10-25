당신은 실무팀 Sonnet이다. 과제 B006 조사 단계. 한국어로 답한다. 코드 파일은 절대 수정하지 말고 읽기만 한다.

배경: 우리는 "이사 지킴이(가칭)"라는 모바일 웹을 만든다. 사용자가 방 사진 1~3장과 이사 견적서 이미지 1장을 올리면 → 멀티모달 LLM이 짐 목록·견적 항목을 JSON으로 추출(2번 병렬 호출) → 사용자가 원문 옆에서 수정 → 규칙 코드가 대조해 '포함 여부 미확인/조건 모호' 카드 → 업체에 보낼 확인 문구를 문장 틀로 만들어 복사. 서버는 사진을 저장하지 않는다. 상세: /mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/wiki/overviews/이사-지킴이-제작계획.md (§5~§8만 훑어라).

조사 대상 (사용자가 예전 공모전에서 만든 웹 코드, node_modules·dist·.next·.cache는 보지 말 것):
1. /mnt/c/Users/User/Desktop/대학교/3학년/KAIST 성남 시 공모전/-2026-2nd-Seongnam-KAIST-AI-Competition (Next.js + zod + playwright, DESIGN.md, AGENTS.md)
2. /mnt/c/Users/User/Desktop/대학교/3학년/창업[전세사기 및 부동산]/-Future-Value-Level-up-Challenge- (MoveValue: api/agent_llm.py, api/agent_ollama.py, api/jeonse_safeguard.py, api/movevalue_api.py, app/ — 전세사기 예방 에이전트. **우리 서비스와 구조가 가장 비슷할 수 있으니 가장 깊게** 봐라: 에이전트가 어떤 도구를 쓰고 규칙과 LLM을 어떻게 나눴는지, 사용자에게 결과를 어떻게 보여 주는지)
3. /mnt/c/Users/User/Desktop/대학교/3학년/VISTA 교수님 프로젝트 (webapp, api, backend, vercel.json, render.yaml)
4. /mnt/c/Users/User/Desktop/대학교/3학년/SL 프로젝트/prototype (간단히)

각 프로젝트마다 알아낼 것 (근거는 반드시 `파일경로:줄번호`):
- 스택·폴더 구조·실행/빌드 명령, 배포 방식(Vercel/Render 등), 환경변수·API 키 관리
- LLM/AI 호출 방식: 제공사·SDK, 프롬프트 위치, 구조화 출력(zod·JSON 스키마), 에이전트 루프·도구 정의·최대 반복·종료 조건, 규칙 엔진과의 분리, 재시도·타임아웃·폴백(오프라인/모의 응답)
- 파일·이미지 업로드 처리
- UI: 단계형 흐름, 근거 표시(출처·원문 인용) 방식, 디자인 토큰, 모바일 대응, 한국어 문구 톤
- 테스트·검증(playwright e2e, eval 스크립트)

마지막에 **"이사 지킴이에 그대로 가져올 것 TOP 8"**: 무엇을, 어느 파일에서, 왜, 어떻게 바꿔서. 그리고 "가져오면 안 되는 것"도 짧게.

결과 전체를 다음 파일에 작성하라: /mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/runs/out/b006-ref-b.sonnet.md
최종 답변으로는 TOP 8 요약만 짧게 돌려줘라.