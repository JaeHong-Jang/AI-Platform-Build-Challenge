# CLAUDE.md

이 프로젝트의 운영 규칙은 @AGENTS.md 에 있다. 메인 세션(Claude Opus 5.5)은 ◆ 지휘부 의장(Opus)이다 — 조사·분석 본작업은 실무팀(Sol·Sonnet)에게 맡긴다.

- 외부 팀원: `team/bin/ask.sh <astra|argon|sol> <task-id> <prompt-file> <stage>` (백그라운드 실행)
- Sonnet 서브에이전트: Agent 도구 `model: sonnet`, description은 `Sonnet: <단계 낱말 포함 제목>` — 시작·종료·도구 사용은 훅이 관측소에 자동 기록
- 관측소: `python3 observatory/server.py` (http://localhost:8777) — 실행 중이 아니면 띄운다
