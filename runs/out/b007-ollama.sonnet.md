# B007 조사: 이사 지킴이 에이전트를 로컬 Ollama로 (Sonnet, 조사 단계)

실측 스크립트: `/tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/ollama/` (t1.py 단발 도구호출, t2.py agent.ts 루프 이식, t3.py 구조화 출력, *.out 원본 로그)
환경: Ollama http://172.20.32.1:11434, GPU RTX 2080 SUPER 8GB(nvidia-smi), 모델 pull 없음. 비전 모델 없음.

## 1. 기존 Ollama 코드 패턴 (근거 `파일:줄`)

경로 약어: M = `AI Innovation 공모전/masdae-pass`, T = `TRITON`, F = `창업[전세사기 및 부동산]/-Future-Value-Level-up-Challenge-`

| 항목 | masdae-pass | TRITON | Future-Value (agent_ollama.py) |
|---|---|---|---|
| 주소 | `M/harness/harness.config.json:6` url=`http://172.20.32.1:11434`, 환경변수 `OLLAMA_URL` (`M/backend/src/harness/llm/ollama.ts:15`, `registry.ts:9`) | `T/apps/backend/court/llm.py:14-22` `OLLAMA_HOST` 우선, 없고 WSL이면 `ip route`의 default gateway로 `:11434` 자동 결정 | `agent_ollama.py:26` `OLLAMA_HOST`, 기본 localhost (WSL이면 안 맞음) |
| 모델 | `harness.config.json:7-10` model=`ax4-light:q4_K_M`, fallbackModel=`qwen3:4b-instruct-2507-q4_K_M`, readerModel=`ax4-light:q4_K_M`. `OLLAMA_MODEL` (`ollama.ts:16`, `registry.ts:10`), `OLLAMA_READER_MODEL` (`api/app.ts:50`, `snapshot.ts:24`) | `llm.py:8` DEFAULT_MODEL=`ax4-light:q4_K_M` | `agent_ollama.py:37` `gemma4:latest`(qwen2.5:7b-instruct는 62.7%를 59.0%로 지어내 탈락, 주석 `:28-36`) |
| 호출 | `/api/chat`, `format:'json'`, `stream:false`, `keep_alive:'30m'`, `temperature:0` (`ollama.ts:34-41`). 스키마 아닌 느슨한 json 모드. 응답 앞뒤 잡음은 `parseJSON`으로 `{`~`}` 추출 (`ollama.ts:51-61`) | `/api/chat`, **`format: <JSON 스키마>`**, `options={temperature:0, seed:7, num_ctx:8192, num_predict:2048}` (`llm.py:9,44-50`). 메타(prompt/eval 토큰, 초) 기록 (`llm.py:55-59`) | `/api/chat` + `tools`(function 스키마, Anthropic input_schema를 `parameters`로 변환 `:112-124`), `num_ctx=32768`, `temperature=0`, `keep_alive=30m` (`:39-53,163-173`) |
| 타임아웃 | `harness.config.json:10` timeoutMs=120000, `ollama.ts:41` AbortSignal. 가용성 점검 `/api/tags` 3초 (`ollama.ts:22`) | `llm.py:10` HTTP_TIMEOUT=120, 가용성 3초 (`:36`) | LOAD_TIMEOUT=180, PROBE_TIMEOUT=3 (`:56-57`) |
| 에이전트 루프 | 없음(단발 chatJSON) | `court/agent_loop.py:12-13` MAX_AGENT_CALLS=4, MAX_REVISIONS=2. 도구는 모델 tool-calling이 아니라 코드가 실행(`:106-121`), 모델은 스키마 JSON 계획/초안 | `agent_chat` 루프(`:137-220`), 도구결과는 `role:"tool"`+`tool_name` (`:218`), arguments가 dict/str 둘 다 오는 경우 방어 (`_tool_args` `:127-134`), MAX_TURNS 초과시 오류 |
| 폴백/가용성 | `ollama.ts:20-31` 모델 없으면 fallbackModel로 교체, 없으면 규칙(비LLM) 경로 | `llm.py:34-40` 없으면 available=False | `agent_ollama.py:88-109` availability + 컨텍스트 90% 초과 경고(`:204-209`) |

교훈(코드 주석 근거): num_ctx를 안 정하면 앞(시스템 프롬프트)부터 잘려 규칙을 잃는다(`agent_ollama.py:39-44`). 소형 모델은 숫자·판정을 바꿔 쓴다(`:28-36`, eval_agent_ollama.py 상단). 따라서 "모델 출력은 코드 검증 후에만 채택"이라는 현재 agent.ts 설계와 맞는다.

현재 이사 지킴이 코드 쪽 연결점: `web/src/lib/provider.ts`의 `messages()`는 Anthropic `/v1/messages` 고정, 타임아웃 25초(`:7`), `agent.ts`는 `tool_use`/`tool_result` 블록 형식(`:128-148`) 사용. 교체하려면 Ollama 형식(`message.tool_calls[].function.{name,arguments}`, `role:"tool"`)으로 어댑터가 필요.

## 2. 실측

### 2-1. 도구 호출 (agent.ts의 4개 도구 스키마·시스템 프롬프트·열린 카드 8개·업체 답변 그대로)

주의: **첫 실측은 GPU/호스트가 느린 구간**(디코딩 약 3~15 tok/s)이라 수십~수백 초가 나왔다. 이후 재측정에서는 78~105 tok/s. 아래 시간은 "따뜻한(warm)" 값과 "차가운(cold)" 값을 구분한다. 콜드 로드: qwen3 36.6초, qwen2.5 112.5초(첫 호출 `load_duration`, 느린 구간 포함).

**(A) 단발: "propose_updates를 호출하라" 지시 + 카드 목록을 프롬프트에 포함 (temperature 0.3, 3회, warm 재측정 `t1b.out`)**

| 모델 | 3회 시간(초) | tool_calls 형식 | propose_updates 호출 | 인자 JSON 형식 오류 | 의미 정확도(5개 기대: 책장·책상·의자=명시, 계단·추가비용=조건) | 비고 |
|---|---|---|---|---|---|---|
| qwen2.5:7b | 10.6 / 2.9 / 2.9 | arguments=dict 3/3 | 3/3 | 0/3 | 5/5 ×3 | 답 없는 `ladder`를 조건부로 제안(3/3, 일부 인용이 "당일 째 보고"처럼 글자 오염 → 원문 일치 실패). 코드 검증이 거절할 수준 |
| qwen3:4b-instruct | 6.3 / 0.2 / 0.2 | dict 3/3 | **0/3** (3회 모두 `get_open_cards`부터 호출) | 0/3 | - | 지시를 어기고 도구 흐름 순서를 지킴(에이전트 루프에서는 오히려 적합) |
| ax4-light | 20.2 / 11.2 / 0.9 | dict 3/3 | 2/3 (3번째는 find_in_reply) | 0/2 | 3/5 ×2 (책장·책상·의자만, 계단 조건부 누락) | 응답에 한국어 해설문이 같이 나옴. 인용 원문 일치 8/8 |

최초(느린 구간) 값: qwen2.5 291/98/127초, qwen3 47/9.8/0.4초, ax4 타임아웃(300초)/213/24.5초.

**(B) 실제 루프(agent.ts를 파이썬으로 이식: get_open_cards→find_in_reply→propose_updates(코드 검증)→finish, temperature 0, 상한 8회/6턴), 3회씩 (`t2.out`)**

| 모델 | 루프 결과 | 최종 제안(정답: 책장·책상·의자=명시, 계단·추가비용=조건) | 총 시간 | 형식 오류 |
|---|---|---|---|---|
| qwen3:4b-instruct | 도구 호출 4~5단계, finish까지 정상 종료 2/3 (1회는 propose 후 finish 없이 한국어 요약문으로 종료, 제안은 정상 반영) | 4/5 ×3 (추가비용 fee-0은 놓침, 오탐 0, 코드 거절 0) | warm 약 6초(104 tok/s). 첫 구간 70~93초, 마지막 반복 중 콜드 1회 173초 | 0 |
| qwen2.5:7b | **3/3 실패**: `find_in_reply` 뒤 도구 결과를 받은 다음 턴에서 `tool_calls` 대신 본문에 `{"name":"propose_updates","arguments":[...]}`를 텍스트로 출력(앞에 깨진 글자, arguments가 배열 형태) 또는 빈 응답. 파서가 못 읽어 propose 한 번도 못 함 | 0/5 | 3.4~50초 | 텍스트 도구호출 3/3 |
| ax4-light | 3/3 `get_open_cards→propose_updates→finish` (find_in_reply 생략) | 1/5 ×3: 책장·책상·의자 3건이 코드 검증에서 거절(인용 문제, 거절 3건/회), 추가비용을 `conflicting`으로 분류(오분류), 계단만 정확 | 17~27초 (78 tok/s, 출력 1,340토큰으로 장황) | 0 |

해석: 단발 도구호출은 qwen2.5가 가장 정확하지만 **도구 결과가 들어간 다음 턴에서 tool-calling 형식이 무너진다**(Qwen2.5 계열의 알려진 증상으로 보이나 이 실측 밖의 원인 규명은 하지 않음, unknown). qwen3-4b-instruct만 다중 턴 루프를 안정적으로 끝냈다.

한국어 품질(관찰): qwen3 요약문은 자연스럽고 간결. ax4-light(A.X 4.0 Light, 한국어 특화)는 한국어 어휘는 자연스러우나 출력이 길고 판정이 흔들림. qwen2.5는 가끔 한자/깨진 글자가 섞임("당일 째 보고").

### 2-2. `/api/chat`의 `format`(JSON 스키마) 구조화 출력

가상 OCR 텍스트(견적서 12행, 5톤·4명·1,350,000원·계약금 135,000원·"원룸 짐 일체"·"에어컨 이전설치 별도" 포함)를 `quoteDraftSchema`(`types.ts:15-29`)에 해당하는 JSON 스키마로 `format`에 전달 (temperature 0, num_ctx 4096, 2회씩, `t3.out`). 점수는 10개 필드 정오(회사·총액·계약금·날짜·차량·인원·사다리 포함·계단노트·뭉뚱그림 문구·추가비용 문구).

| 모델 | format=스키마: 점수 | 시간(초, warm) | 인용 원문 일치(listedItems.quote) | format="json"(스키마 없음) |
|---|---|---|---|---|
| ax4-light | **9/10** 2회 동일(틀림: 사다리 "별도" 판정. 견적서가 사다리 150,000원 줄을 합계에 포함한 구조라 정답을 "포함"으로 잡음. 라벨 해석이 갈릴 수 있어 엄격히 틀렸다고 단정은 어려움) | 15.2 / 33.0 | 3/3, 5/5 (정직하나 포장박스·에어컨은 listedItems에서 누락) | 1/10 (스키마 무시) |
| qwen3:4b-instruct | 10/10이지만 **점수 과대**: 모든 줄을 blanketPhrases에 통째로 넣어 "짐 일체" 조건이 우연히 충족. 인용 일치 2/5(`"value: 1200000"` 같은 지어낸 인용), 1회는 "2026-11-014"로 글자 오염 | 12.2 / 6.5 | 2/5 | 1/10 |
| qwen2.5:7b | 7/10 (회사명 null, 사다리 "미기재", 뭉뚱그림 문구 누락) | 11.6 / 5.8 | 1/5 | JSON 파싱 실패 |

결론: **스키마 `format`은 세 모델 모두에서 구조(필드·타입·enum) 준수가 됐다**(스키마 파싱 오류 0/6). 반대로 `format:"json"`은 쓸모없다(masdae-pass 방식은 이 용도로 부적합). 값의 정확도·원문 그대로 복사는 모델별 차이가 크고, 견적서 항목 인용은 어떤 모델도 믿을 수 없어 사용자가 원본 옆에서 확인하는 현 설계(extract.ts `verbatim` 주석)를 유지해야 한다. OCR 텍스트가 있으면 인용을 코드가 원문 부분 문자열로 대조할 수 있어 qwen3의 가짜 인용을 걸러낼 수 있다.

표본이 작다(모델당 2~3회, 1개 시나리오). temperature 0 반복은 같은 결과를 내므로 분산 추정은 의미가 약하다.

## 3. 이미지 읽기 대안 (비전 모델 없음)

현재 설치된 모델은 모두 텍스트 전용(`/api/tags` capabilities: tools/thinking/completion, 비전 표기 없음). 이미지 읽기(`extractItems` 짐 사진 → 품목)가 가장 큰 공백.

| 대안 | 방식 | 장점 | 단점 / unknown |
|---|---|---|---|
| (a) 브라우저 OCR + 텍스트 LLM | tesseract.js(`createWorker('kor')`, 브라우저에서 동작, 언어 데이터는 처음 사용 시 내려받아 캐시) → 텍스트를 위 구조화 출력에 입력 | 설치 모델 추가 없음, 사진이 서버로 안 나감(개인정보), OCR 원문이 있어 인용을 코드로 원문 대조 가능, 견적서(인쇄체 표)에 적합 | tesseract.js는 모델 정확도를 개선하지 않고 PDF 미지원(출처: https://github.com/naptha/tesseract.js). 한국어 손글씨·사진 비스듬·표 레이아웃 정확도, 한국어 데이터 파일 크기(MB), 처리 시간은 **unknown(이번에 실측 안 함)**. **방 사진(짐 인식)은 OCR로 불가능** |
| (b) 비전 모델 직접 설치(사용자가 pull) | `qwen2.5vl:3b` 3.2GB, `:7b` 6.0GB(기본 latest), `:32b` 21GB, `:72b` 49GB, 컨텍스트 125K, Ollama 0.7.0 이상 필요 (https://ollama.com/library/qwen2.5vl) | 짐 사진·견적서 사진 모두 한 모델로 가능, Anthropic 이미지 입력과 구조가 가장 가까움 | 이 PC GPU는 8GB(확인: RTX 2080 SUPER 8192MiB). 7b 6.0GB 가중치는 이미지 토큰·KV 캐시까지 합치면 8GB에 빠듯할 수 있음(3b는 여유). 실제 VRAM 사용량·속도·한국어 OCR/짐 인식 정확도는 **unknown(설치 안 해 측정 못 함)**. 한 번에 한 모델만 올리면 텍스트 에이전트 모델과 교체 로드 시간이 든다. 현재 Ollama 버전은 이번에 미확인(`/api/version` 미호출) |
| (c) 견적서는 텍스트 붙여넣기/직접 입력 | 견적서 주요 항목을 폼으로 입력하거나 문자/카톡 텍스트를 붙여넣기 | OCR 오류 0, 가장 단순·빠름, 인용이 사용자가 붙인 원문이라 대조 가능, 모델 요구 없음 | 사용자 수고 증가(체감 UX 저하), 사진만 있는 종이 견적서는 사용 불가, 짐 사진은 여전히 해결 안 됨(품목을 체크리스트/직접 입력으로 대체해야 함) |

조합 권장: 견적서 = (c)를 기본, (a)를 선택 기능, 짐 사진 = 비전 모델 없으면 "품목 직접 선택/입력"으로 대체하고 (b)는 3b로 별도 검증 후 선택. 에이전트(업체 답변 점검)는 텍스트 입력이라 비전 불필요.

## 4. 결론

### 모델 1순위: `qwen3:4b-instruct-2507-q4_K_M`
근거(실측):
- 다중 턴 도구 루프(get_open_cards→find_in_reply→propose_updates→finish)를 3/3 완주해 propose까지 도달, 형식 오류 0, 코드 검증 거절 0, 오탐 0 (정답 5개 중 4개: 책장·책상·의자 명시, 계단 조건부 정확. 추가비용 fee-0만 놓침 = 보수적 방향의 실패라 안전). 같은 조건에서 qwen2.5:7b는 3/3 루프 실패(텍스트 도구호출), ax4-light는 1/5.
- warm 속도: 루프 전체 약 6초, 104 tok/s. 모델 2.5GB로 8GB GPU에 여유.
- 구조화 출력은 스키마 준수 됨(단 인용·값 정확도는 ax4가 더 낫다).
약점: 단발 지시 "propose_updates를 바로 호출"은 무시하고 항상 get_open_cards부터 부름(루프에선 무방), 콜드 로드 37초 이상, 인용 지어내기(견적서 추출), `fee-0` 같은 암묵적 조건 누락.

2순위/보조: `ax4-light:q4_K_M`는 **견적서 구조화 추출(format 스키마)** 에서 가장 충실(9/10, 인용 원문 일치 100%)하지만 도구 루프에는 부적합(검증 거절 다수, 장황, 분류 오류). 구조화 추출 전용 reader 모델로 쓰는 것은 masdae-pass 선례(readerModel=ax4-light)와 같은 구도. `qwen2.5:7b`는 에이전트 도구 루프에 쓰지 말 것. `gemma2:9b`는 tools 미지원이라 제외.

### 권장 호출 방식
- 엔드포인트: `POST {OLLAMA_URL}/api/chat`, `OLLAMA_URL` 기본 `http://172.20.32.1:11434`. WSL이면 TRITON처럼 `ip route` 게이트웨이를 자동 감지하는 편이 이식성이 좋음(`T/apps/backend/court/llm.py:14-22`). 서버(Vercel) 배포 시에는 로컬 Ollama에 접근 불가이므로 로컬 실행 전용임을 명시.
- 본문: `{model, messages(system+user), tools:[{type:"function",function:{name,description,parameters}}], stream:false, keep_alive:"30m", options:{temperature:0, num_ctx:8192}}`. 도구 결과는 `{role:"tool", tool_name, content}`, assistant 메시지(tool_calls 포함)를 그대로 히스토리에 추가. `arguments`는 dict로 왔지만 문자열 가능성에 대비(`agent_ollama.py:127-134`). 현재 agent.ts의 `additionalProperties:false`는 Ollama `parameters`에서 불필요하면 제거 가능(미검증, 이번 실측에서는 제거한 스키마로 동작 확인).
- 구조화 출력(견적서): `format`에 JSON 스키마(zod `toJSONSchema` 결과) 사용, `format:"json"`은 쓰지 말 것. 모든 필드를 required로 하고 null 허용 타입 명시. 결과는 zod로 재검증(provider.ts 방식 유지).
- 타임아웃: 첫 호출은 콜드 로드(37~112초 관측)가 있으므로 첫 호출 180초, 이후 호출 60~120초. 현재 `DEADLINE_MS=50_000`/`TIMEOUT_MS=25_000`은 로컬 모델 콜드 시작에 부족. 시작 시 `/api/tags` 3초 점검 + 가벼운 워밍업 호출 권장.
- 재시도: 도구 호출이 없는 응답(텍스트 도구호출 의심: content에 `"name":` 포함)이거나 propose 없이 끝난 경우 1회만 재시도, 그래도 실패하면 폴백. 코드 검증(quote 원문 일치·키워드·NOT_PLAIN_YES)은 그대로 유지. 상한 8회·6턴 유지.
- num_ctx: 8192면 현 루프(프롬프트 약 800~900토큰)에 충분. 긴 답변은 `prompt_eval_count`를 모니터링.

### 실패 시 폴백
1. 같은 모델 1회 재시도 → 2. `OLLAMA_MODEL` 없으면 fallback 후보로 교체(masdae-pass `ollama.ts:20-31` 패턴) → 3. LLM 없이 규칙 경로: 현 코드의 키워드 매칭(`keywords()`)·`NOT_PLAIN_YES`·SCRIPT 예시 모드로 후보를 만들고 사용자 승인 단계는 유지, 화면에 "AI 없이 규칙으로 점검함" 표기.

### 남은 unknown
- tesseract.js 한국어 정확도·크기·속도, qwen2.5vl의 8GB GPU 실제 구동·한국어 성능, Ollama 서버 버전.
- 이 PC 속도의 편차 원인(첫 구간 3~15 tok/s vs 이후 78~105 tok/s): 원인 불명(모델 콜드 로드·호스트 부하 추정, 미확인). 발표 때는 사전 워밍업 필수.
- 표본이 작아(시나리오 1개, 모델당 3회) 정확도 수치는 방향성 근거이며 통계적 결론이 아님. 다른 답변 시나리오(상충·뭉뚱그림)로 추가 검증 권장.
