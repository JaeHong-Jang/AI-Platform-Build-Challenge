# AGENTS.md — 오케스트라 팀 운영 매뉴얼

이 저장소에서 일하는 모든 에이전트(Claude Code, Codex, Antigravity)는 이 파일을 단일 운영 매뉴얼로 따른다.

## 1. 팀 구성 — 지휘와 실무를 나눈다

| 구분 | 멤버 | 모델 / 호출 | 하는 일 | 하지 않는 일 |
|---|---|---|---|---|
| ◆ 지휘 (의장) | **Opus** | Claude Opus 5.5 — 메인 Claude Code 세션 | brief 작성, 배정, 토론 진행, 최종 판정, 위키·저장소 반영 | 조사·분석 본작업 |
| ◆ 지휘 | **Astra** | GPT 6 Astra — `team/bin/ask.sh astra` | 지휘부 검증(전략·사업성·심사 관점), 토론 | 조사·분석 본작업 |
| ◆ 지휘 | **Argon** | Gemini 4 Argon — `team/bin/ask.sh argon` | 지휘부 검증(기술·구현 관점), 토론 | 조사·분석 본작업 |
| ○ 실무 | **Sol** | GPT 6.1 Sol — `team/bin/ask.sh sol` | **조사 · 분석 · 상호 검증** | 최종 판정 |
| ○ 실무 | **Sonnet** | Claude Sonnet 5.5 — Agent 도구 `model: sonnet` | **조사 · 분석 · 상호 검증**, 위키 ingest | 최종 판정 |

실무팀(Sol·Sonnet)이 일을 하고, 지휘부(Opus·Astra·Argon)는 방향을 정하고 검증하고 판정한다.

## 2. 파이프라인 (stage)

```
brief ─▶ 조사 ─▶ 분석 ─▶ 상호 검증 ─▶ 지휘부 검증 ─▶ 토론 ─▶ 판정 ─▶ 위키 반영 ─▶ 저장소 반영 ─┐
  ▲                                                                                       │
  └──────────────────────────── 결과가 다음 brief로 되돌아간다 ──────────────────────────┘
```

| stage | 누가 | 규칙 |
|---|---|---|
| `brief` | Opus | `briefs/Bxxx-*.md` 작성: 질문, 범위, 성공 기준, 마감. status: active / waiting / done |
| `research` 조사 | Sol ∥ Sonnet | 서로 결과를 보지 않고 병렬. 사실마다 출처 URL, 못 찾으면 `unknown` |
| `analysis` 분석 | Sol ∥ Sonnet | 두 조사 결과를 모두 입력으로 받아 **각자 독립적으로** 분석 |
| `peer` 상호 검증 | Sol ↔ Sonnet | Sol의 분석은 Sonnet이, Sonnet의 분석은 Sol이 검증(출처·수치·논리). 자기 산출물 승인 금지 |
| `review` 지휘부 검증 | Astra ∥ Argon | 블라인드 독립 리뷰. Astra=전략·사업성·심사, Argon=기술·구현성. 각 주장에 찬성/반대/보류 |
| `debate` 토론 | Astra · Argon (+Opus 의장) | **판정이 갈리는 주장만**. 각자 상대 의견을 받아 1회 반박 → Opus가 정리 |
| `decision` 판정 | Opus | `decisions/Dxxx-*.md`: 결론, 근거 run, 반대 의견, 남은 unknown |
| `wiki` 위키 반영 | Sonnet · Opus | 노트·링크 갱신, `wiki/log.md` 기록 |
| `repo` 저장소 반영 | Sonnet · Opus | 코드·문서·제출물 반영 |

작은 과업은 stage를 건너뛸 수 있으나 **peer 또는 review 중 하나는 반드시** 거친다.

## 3. 실행 기록 — 관측소에 실시간으로 보인다

- 외부 모델: `team/bin/ask.sh <astra|argon|sol> <task-id> <prompt-file> <stage>` → 시작·종료가 `runs/events.jsonl`, 완료가 `runs/runs.jsonl`에 기록. 결과 `runs/out/<task-id>.<member>.md`, 진행 로그 `.log`.
- **Claude Code 세션은 훅이 자동 기록한다** (`.claude/settings.json` → `team/bin/hook.py`):
  - 사용자가 지시하면 Opus(과제 지시) 실행이 시작되고 지시 문장이 관측소에 뜬다. 응답이 끝나면(Stop) 종료.
  - Opus·서브에이전트가 쓰는 도구(명령·검색·파일 작성·팀원 호출)가 한 줄씩 진행 로그에 쌓인다.
  - `Agent` 도구를 `model: sonnet`으로 부르면 Sonnet 실행이 자동 시작되고, 끝나면(SubagentStop) 자동 종료된다.
    단계는 description의 낱말로 정한다: 조사·벤치→조사, 분석→분석, 검증·상호→상호 검증, 리뷰→지휘부 검증, 토론→토론, 위키→위키 반영.
    그래서 description은 `Sonnet: <단계 낱말이 들어간 짧은 제목>` 으로 쓴다.
- 훅이 꺼져 있을 때만 수동으로: `rid=$(team/bin/event.py start <member> <task> <stage> <out>)` → `team/bin/event.py end $rid ok|fail`.
- 프롬프트는 `team/prompts/`에 남기고 `_context.md`를 앞에 붙인다.

## 4. LLM 위키 규칙 (`wiki/`)

```
wiki/papers/<stem>.pdf          원문 (가능할 때)
wiki/sources/<stem>.md          논문 초록·요약 (원문에 충실)
wiki/notes/<type>/<이름>.md      연결된 지식 노트
wiki/overviews/<주제>.md         종합 문서
wiki/index.md, wiki/log.md      목차, 변경 기록
```
- stem: `<첫저자성><연도>-<키워드>` (예: `lewis2020-rag`)
- frontmatter: `type: hub|concept|idea|paper|system|experiment|verdict`, `tags`, `status: draft|verified|confirmed|rejected`, `source`
- 링크는 `[[노트이름]]`. 관측소 그래프가 이 링크로 그려진다.
- **4대 규칙**: ① 위키 우선, 웹검색은 조사 stage에서만 ② 불확실하면 원문 확인 ③ 확인 못한 값은 `unknown` ④ 근거가 없으면 자료 추가 요청
- 논문은 arXiv ID·DOI로 실재를 확인한 경우에만 `status: verified` (`team/bin/ingest_papers.py`)

## 5. AI Platform Build Challenge 관측소 (`observatory/`)

- **실시간**: `python3 observatory/server.py` → http://localhost:8777 (홈 · 시스템 동작 · 지식 그래프 · 실험 기록). 실행 중인 팀원, 진행 시간, 검색어·명령 로그, D-day가 1초 단위로 갱신된다.
- **정적 스냅샷**: `python3 observatory/build.py` → `observatory/index.html`

## 6. 금지

- 확인하지 않은 통계·논문·데이터셋·경쟁 부재 주장 생성 금지 (경쟁 주장은 실무팀 검증 필수)
- 개인정보·권한 없는 자료를 저장소에 넣지 않는다
- 다른 멤버의 산출물(`runs/out/`)을 덮어쓰지 않는다
