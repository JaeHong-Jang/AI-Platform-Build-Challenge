당신은 실무팀 Sonnet이다. 과제 B007 조사 단계. 한국어로 답한다. 다른 프로젝트 파일은 읽기만 하고 절대 수정하지 않는다.

배경: "이사 지킴이"(이사 견적서·짐 사진을 대조해 계약 전 확인할 항목을 찾고, 업체 답변을 점검하는 서비스)의 AI 에이전트를 **로컬 Ollama**로 돌리라는 사용자 지시가 있다. 현재 에이전트 코드는 Anthropic API용이다: /mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/web/src/lib/agent.ts (도구 get_open_cards, find_in_reply, propose_updates, finish; 코드 검증·상한 8회) 와 provider.ts, extract.ts. 먼저 이 파일들을 읽어라.

Ollama는 WSL에서 Windows 호스트로 접속한다: http://172.20.32.1:11434 (127.0.0.1은 안 됨). 설치된 모델: qwen2.5:7b(tools), qwen3:4b-instruct-2507-q4_K_M(tools, thinking), ax4-light:q4_K_M(qwen2 7.3B, tools), gemma2:9b(tools 없음). **비전 모델은 없다.** 모델을 새로 내려받지(pull) 마라.

할 일:
1. 사용자의 기존 Ollama 코드를 읽고 패턴 정리 (근거 `파일경로:줄번호`):
   - /mnt/c/Users/User/Desktop/대학교/3학년/AI Innovation 공모전/masdae-pass/backend/src (llm/ollama.ts 등, OLLAMA_URL·OLLAMA_MODEL·OLLAMA_READER_MODEL 사용처, 어떤 모델을 썼는지, format/json 스키마, 타임아웃)
   - /mnt/c/Users/User/Desktop/대학교/3학년/TRITON (Ollama 호출부, 에이전트 루프)
   - /mnt/c/Users/User/Desktop/대학교/3학년/창업[전세사기 및 부동산]/-Future-Value-Level-up-Challenge-/api/agent_ollama.py, eval_agent_ollama.py
2. **실측** (curl 또는 짧은 node/python 스크립트, 스크립트는 /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/ollama/ 에 둔다):
   - /api/chat 에 tools 를 주고 qwen2.5:7b, qwen3:4b-instruct, ax4-light 각각에서 tool_calls가 제대로 나오는지. 테스트 과제: 업체 답변 "책장이랑 책상 의자 다 포함이에요. 3층 계단은 당일 짐 보고 말씀드릴게요. 짐 많으면 추가 나올 수 있습니다." 와 열린 카드 목록(item-책장, item-책상, item-의자, item-전자레인지, item-박스, stairs-from, ladder, fee-0)을 주고 propose_updates 도구를 올바르게 부르는지. 응답 시간(초), 한국어 품질, JSON 인자 형식 오류율을 모델별로 3회씩 기록.
   - /api/chat 의 format(JSON 스키마) 구조화 출력이 되는지: 견적서 OCR 텍스트(직접 만든 가상 텍스트)를 주고 quoteDraftSchema 비슷한 JSON을 뽑게 해서 정확도·시간 기록.
3. 이미지 읽기 대안 조사: 비전 모델이 없으므로 (a) 브라우저 OCR(tesseract.js 한국어) + 텍스트 LLM, (b) 사용자가 Ollama 비전 모델(qwen2.5vl 등)을 받는 경우의 용량·요구 사양, (c) 견적서는 텍스트 붙여넣기/직접 입력 — 각 장단점. 확인 못 한 것은 unknown. 웹 검색이 필요하면 해도 된다(출처 URL).
4. 결론: 에이전트에 쓸 모델 1순위와 이유(실측 수치로), 권장 호출 방식(엔드포인트·옵션·타임아웃·재시도), 실패 시 폴백.

결과 전체를 다음 파일에 작성하라: /mnt/c/Users/User/Desktop/대학교/3학년/AI Platform Build Challenge/runs/out/b007-ollama.sonnet.md
최종 답변으로는 결론 요약만 짧게 돌려줘라.