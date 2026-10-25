# L01~L24 논문 근거 (검증본)

- 작성: paper-research(Claude Sonnet 5.5), 2026-10-23.
- 검증 방법: 각 arXiv ID를 arXiv 공식 API(`export.arxiv.org/api/query?id_list=…`)로 조회해 제목·1저자·연도를 확인했고, 일부(2609.04850, 2412.15260, 2609.27014)는 WebFetch로 abs 페이지를 직접 열어 재확인했다. 열리지 않은 후보는 제외했다. 연도는 v1 게시 연도다.
- 한계(추정 포함): 관련 문장은 제목·초록 기준으로 작성했으며 본문 전체를 읽지는 않았다. 일부 아이디어(L12, L14 위험소통, L22, L23)는 도메인 직결 논문을 못 찾아 인접 도메인 논문으로 대체했고 해당 행에 표시했다. 2026년 논문은 프리프린트이며 동료 심사 여부는 확인하지 않았다.

## L01 전월세 서류 교차검증

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `westermann2024-legaldoc-mllm` | Analyzing Images of Legal Documents: Toward Multi-Modal LLMs for Access to Justice | 2024 | arXiv:2412.15260 (https://arxiv.org/abs/2412.15260) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 종이 법률 서류 사진을 멀티모달 LLM으로 구조화(품질 저하 시 한계 보고) |
| `hendrycks2021-cuad-contract` | CUAD: An Expert-Annotated NLP Dataset for Legal Contract Review | 2021 | arXiv:2103.06268 (https://arxiv.org/abs/2103.06268) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 계약서 조항 단위 검토용 전문가 주석 데이터셋(CUAD) |
| `sante2026-contravis-contradiction` | ContraVis: Evidence-Grounded Visual Analytics for Contradiction Review in Legal Contracts | 2026 | arXiv:2609.27014 (https://arxiv.org/abs/2609.27014) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 계약서 내 모순 후보를 그래프+LLM으로 근거와 함께 탐지 |
| `guha2023-legalbench-reasoning` | LegalBench: A Collaboratively Built Benchmark for Measuring Legal Reasoning in Large Language Models | 2023 | arXiv:2308.11462 (https://arxiv.org/abs/2308.11462) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 법률 추론 능력 평가(한계 인용용) |

## L02 방 상태 증거기록

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `guo2022-clip4idc-diffcap` | CLIP4IDC: CLIP for Image Difference Captioning | 2022 | arXiv:2206.00629 (https://arxiv.org/abs/2206.00629) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 두 이미지 간 변화 서술(image difference captioning) |
| `liu2025-omnidiff-diffcap` | OmniDiff: A Comprehensive Benchmark for Fine-grained Image Difference Captioning | 2025 | arXiv:2503.11093 (https://arxiv.org/abs/2503.11093) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 세밀한 이미지 차이 서술 벤치마크 |
| `zhang2025-unichange-change` | UniChange: Unifying Change Detection with Multimodal Large Language Model | 2025 | arXiv:2511.02607 (https://arxiv.org/abs/2511.02607) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 멀티모달 LLM 기반 변화 탐지 |

## L03 임금 누락 증거 복원

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `westermann2024-legaldoc-mllm` | Analyzing Images of Legal Documents: Toward Multi-Modal LLMs for Access to Justice | 2024 | arXiv:2412.15260 (https://arxiv.org/abs/2412.15260) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 종이 법률 서류 사진을 멀티모달 LLM으로 구조화(품질 저하 시 한계 보고) |
| `kim2021-donut-ocrfree` | OCR-free Document Understanding Transformer | 2021 | arXiv:2111.15664 (https://arxiv.org/abs/2111.15664) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: OCR 없는 문서 이해 트랜스포머 |
| `mathew2020-docvqa-document` | DocVQA: A Dataset for VQA on Document Images | 2020 | arXiv:2007.00398 (https://arxiv.org/abs/2007.00398) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 문서 이미지 질의응답 데이터셋 |
| `huang2022-layoutlmv3-docai` | LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking | 2022 | arXiv:2204.08387 (https://arxiv.org/abs/2204.08387) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 문서 레이아웃 기반 필드 추출 |

## L04 복지·청년정책 증빙 빈칸 찾기

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `blairstanek2023-statutory` | Can GPT-3 Perform Statutory Reasoning? | 2023 | arXiv:2302.06100 (https://arxiv.org/abs/2302.06100) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: GPT-3의 법령 요건 적용(statutory reasoning) 한계 평가 |
| `hu2024-uot-askquestions` | Uncertainty of Thoughts: Uncertainty-Aware Planning Enhances Information Seeking in Large Language Models | 2024 | arXiv:2402.03271 (https://arxiv.org/abs/2402.03271) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 정보 부족 시 최소 질문으로 불확실성 줄이는 LLM 질문 계획 |
| `jurayj2025-taxlogic` | Language Models and Logic Programs for Trustworthy Tax Reasoning | 2025 | arXiv:2508.21051 (https://arxiv.org/abs/2508.21051) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 법령 요건 추론을 LLM+논리 프로그램으로 신뢰성 확보 |
| `lewis2020-rag` | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | 2020 | arXiv:2005.11401 (https://arxiv.org/abs/2005.11401) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거(범용): 출처 기반 검색증강생성 |

## L05 화면 보고 알려주는 디지털 도우미

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `zhan2026-elderbench-mobileagent` | ElderBench: Benchmarking Autonomous Mobile Agents for Older Adults | 2026 | arXiv:2609.04850 (https://arxiv.org/abs/2609.04850) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 고령자 스마트폰 과업 249개로 GUI 에이전트 평가, 모호한 고령자 발화에서 성능 저하 |
| `lu2024-omniparser-gui` | OmniParser for Pure Vision Based GUI Agent | 2024 | arXiv:2408.00203 (https://arxiv.org/abs/2408.00203) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 화면 캡처에서 상호작용 요소 파싱(순수 비전 GUI 에이전트) |
| `cheng2024-seeclick-grounding` | SeeClick: Harnessing GUI Grounding for Advanced Visual GUI Agents | 2024 | arXiv:2401.10935 (https://arxiv.org/abs/2401.10935) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 스크린샷에서 클릭 위치 GUI grounding |
| `chen2026-voicechatbot-elders` | Bridging the Cognitive Gap: Co-Designing and Evaluating a Voice-Enabled Community Chatbot for Older Adults | 2026 | arXiv:2603.11303 (https://arxiv.org/abs/2603.11303) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 고령자용 음성 챗봇 공동설계·평가(인지 격차) |

## L06 쉬운 고지서

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `westermann2024-legaldoc-mllm` | Analyzing Images of Legal Documents: Toward Multi-Modal LLMs for Access to Justice | 2024 | arXiv:2412.15260 (https://arxiv.org/abs/2412.15260) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 종이 법률 서류 사진을 멀티모달 LLM으로 구조화(품질 저하 시 한계 보고) |
| `guo2023-appls-plainlang` | APPLS: Evaluating Evaluation Metrics for Plain Language Summarization | 2023 | arXiv:2305.14341 (https://arxiv.org/abs/2305.14341) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 쉬운 글 요약 평가 지표(APPLS) |
| `guo2025-plainsummary-understand` | Are LLM-generated plain language summaries truly understandable? A large-scale crowdsourced evaluation | 2025 | arXiv:2505.10409 (https://arxiv.org/abs/2505.10409) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: LLM 쉬운 요약의 실제 이해도 대규모 크라우드 평가 |
| `farber2025-simplifymytext` | SimplifyMyText: An LLM-Based System for Inclusive Plain Language Text Simplification | 2025 | arXiv:2504.14223 (https://arxiv.org/abs/2504.14223) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 기반 쉬운 말 변환 시스템 |
| `nllb2022-translation` | No Language Left Behind: Scaling Human-Centered Machine Translation | 2022 | arXiv:2207.04672 (https://arxiv.org/abs/2207.04672) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 저자원 포함 200개 언어 번역(다국어 안내) |

## L07 출입구 단위 휠체어 접근 확인

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `lieu2026-vlm-sidewalk` | Can VLMs Reliably Assess Sidewalk Accessibility Attributes from Pedestrian-Level Imagery? | 2026 | arXiv:2609.17882 (https://arxiv.org/abs/2609.17882) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 보행자 시점 이미지에서 VLM의 보도 접근성 속성 평가 신뢰도 |
| `wang2026-vlm-wheelchair` | Do VLMs See What Sensors Feel? A Scalable Expert-Guided Design for Wheelchair Accessibility Assessment from Street View | 2026 | arXiv:2606.07642 (https://arxiv.org/abs/2606.07642) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: VLM 휠체어 접근성 평가 vs 센서 값 |
| `hosseini2022-projectsidewalk` | Towards Global-Scale Crowd+AI Techniques to Map and Assess Sidewalks for People with Disabilities | 2022 | arXiv:2206.13677 (https://arxiv.org/abs/2206.13677) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 장애인을 위한 보도 지도화(크라우드+AI) |

## L08 과업 기반 웹 접근성 재현

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `huang2024-access-a11yfix` | ACCESS: Prompt Engineering for Automated Web Accessibility Violation Corrections | 2024 | arXiv:2401.16450 (https://arxiv.org/abs/2401.16450) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 프롬프트로 웹 접근성 위반 자동 수정 |
| `aljedaani2026-llm-a11y-slr` | Large Language Models for Web Accessibility: A Systematic Literature Review | 2026 | arXiv:2605.13873 (https://arxiv.org/abs/2605.13873) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: LLM 웹 접근성 체계적 문헌고찰 |
| `zhou2023-webarena` | WebArena: A Realistic Web Environment for Building Autonomous Agents | 2023 | arXiv:2307.13854 (https://arxiv.org/abs/2307.13854) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 웹 과업 수행 에이전트 환경·평가 |
| `kodandaram2026-cua-blind` | Are We There Yet? Assessing Computer-Use Agents for Blind Users' Accessible Interaction with Desktop Applications | 2026 | arXiv:2609.00524 (https://arxiv.org/abs/2609.00524) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 시각장애 사용자 관점의 컴퓨터 사용 에이전트 접근성 평가 |
| `ramineni2026-a11ytree-agent` | MCP-Driven Accessibility Tree Standardization for AI-Powered Screen Reader Agents | 2026 | arXiv:2608.24898 (https://arxiv.org/abs/2608.24898) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 접근성 트리(MCP)를 스크린리더 에이전트에 활용 |

## L09 지시어 연결 강의 자막

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `lee2022-lectureslides-mm` | Multimodal Lecture Presentations Dataset: Understanding Multimodality in Educational Slides | 2022 | arXiv:2208.08080 (https://arxiv.org/abs/2208.08080) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 강의 슬라이드의 멀티모달 이해 데이터셋 |
| `radford2022-whisper` | Robust Speech Recognition via Large-Scale Weak Supervision | 2022 | arXiv:2212.04356 (https://arxiv.org/abs/2212.04356) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 대규모 약지도 음성인식(STT) |
| `kuhn2024-asr-accuracy` | Measuring the Accuracy of Automatic Speech Recognition Solutions | 2024 | arXiv:2408.16287 (https://arxiv.org/abs/2408.16287) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: ASR 정확도 측정(자막 품질) |

## L10 다제약물 복약 대조

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `van2024-rxstrategist` | Rx Strategist: Prescription Verification using LLM Agents System | 2024 | arXiv:2409.03440 (https://arxiv.org/abs/2409.03440) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 에이전트 처방 검증 |
| `ong2024-medication-cds` | Development and Testing of a Novel Large Language Model-Based Clinical Decision Support Systems for Medication Safety in 12 Clinical Specialties | 2024 | arXiv:2402.01741 (https://arxiv.org/abs/2402.01741) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 기반 복약 임상의사결정지원 개발·시험 |
| `pator2026-medrecon-fhir` | Serialisation Strategy Matters: How FHIR Data Format Affects LLM Medication Reconciliation | 2026 | arXiv:2604.21076 (https://arxiv.org/abs/2604.21076) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 약물 대조(medication reconciliation) |
| `mankash2024-prescription-ocr` | MIRAGE: Multimodal Identification and Recognition of Annotations in Indian General Prescriptions | 2024 | arXiv:2410.09729 (https://arxiv.org/abs/2410.09729) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 처방전 필기/인쇄 주석 멀티모달 인식 |

## L11 송금 전 사기 흐름 탐지

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `shen2025-realtime-scam` | "It Warned Me Just at the Right Moment": Exploring LLM-based Real-time Detection of Phone Scams | 2025 | arXiv:2502.03964 (https://arxiv.org/abs/2502.03964) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: LLM 실시간 전화사기 탐지 사용자 연구 |
| `shen2024-phonescam-llm` | Combating Phone Scams with LLM-based Detection: Where Do We Stand? | 2024 | arXiv:2409.11643 (https://arxiv.org/abs/2409.11643) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 기반 전화사기 탐지 성능 평가 |
| `sun2026-prescam-progression` | PreScam: A Benchmark for Predicting Scam Progression from Early Conversations | 2026 | arXiv:2605.12243 (https://arxiv.org/abs/2605.12243) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 대화 초반으로 사기 진행 단계 예측 벤치마크 |
| `sim2025-voicephishing-slm` | Detecting Voice Phishing with Precision: Fine-Tuning Small Language Models | 2025 | arXiv:2506.06180 (https://arxiv.org/abs/2506.06180) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 보이스피싱 탐지용 소형 언어모델 미세조정 |

## L12 의료 통역 문답 카드

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `radford2022-whisper` | Robust Speech Recognition via Large-Scale Weak Supervision | 2022 | arXiv:2212.04356 (https://arxiv.org/abs/2212.04356) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 대규모 약지도 음성인식(STT) |
| `nllb2022-translation` | No Language Left Behind: Scaling Human-Centered Machine Translation | 2022 | arXiv:2207.04672 (https://arxiv.org/abs/2207.04672) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 저자원 포함 200개 언어 번역(다국어 안내) |
| `ngo2026-medinterp-vlm` | Vision-Language System using Open-Source LLMs for Gestures in Medical Interpreter Robots | 2026 | arXiv:2603.05751 (https://arxiv.org/abs/2603.05751) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거(약함): 의료 통역 로봇용 VLM 시스템 (직접적 임상 통역 LLM 논문은 못 찾음) |
| `hu2024-uot-askquestions` | Uncertainty of Thoughts: Uncertainty-Aware Planning Enhances Information Seeking in Large Language Models | 2024 | arXiv:2402.03271 (https://arxiv.org/abs/2402.03271) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 정보 부족 시 최소 질문으로 불확실성 줄이는 LLM 질문 계획 |

## L13 소규모 사업장 작업 전 위험 점검

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `adil2025-vlm-construction-hazard` | Using Vision Language Models for Safety Hazard Identification in Construction | 2025 | arXiv:2504.09083 (https://arxiv.org/abs/2504.09083) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: VLM 건설현장 위험요인 식별 |
| `naderi2025-vlmllm-siteinspect` | Autonomous Construction-Site Safety Inspection Using Mobile Robots: A Multilayer VLM-LLM Pipeline | 2025 | arXiv:2512.13974 (https://arxiv.org/abs/2512.13974) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: VLM-LLM 파이프라인 건설현장 안전점검 |
| `sahraoui2025-hazard-llm-vlm` | Automated Hazard Detection in Construction Sites Using Large Language and Vision-Language Models | 2025 | arXiv:2511.15720 (https://arxiv.org/abs/2511.15720) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM·VLM으로 건설현장 위험 자동 탐지 |
| `abdalwhab2025-openvocab-site` | Are Open-Vocabulary Models Ready for Detection of MEP Elements on Construction Sites | 2025 | arXiv:2501.09267 (https://arxiv.org/abs/2501.09267) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 오픈보캐뷸러리 검출의 건설현장 적용 한계 |

## L14 반지하 침수 개인 행동 에이전트

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `fuad2026-vlm-flooddepth` | LLM-Powered Flood Depth Estimation from Social Media Imagery: A Vision-Language Model Framework with Mechanistic Interpretability for Transportation Resilience | 2026 | arXiv:2603.17108 (https://arxiv.org/abs/2603.17108) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 사진에서 VLM으로 침수 깊이 추정 |
| `liu2025-kg-vlm-flooddepth` | Knowledge-Guided Vision-Language Inference for Image-Based Urban Flood Depth Estimation | 2025 | arXiv:2509.04772 (https://arxiv.org/abs/2509.04772) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 지식 유도 VLM 도시 침수 깊이 추정 |
| `rahnemoonfar2020-floodnet` | FloodNet: A High Resolution Aerial Imagery Dataset for Post Flood Scene Understanding | 2020 | arXiv:2012.02951 (https://arxiv.org/abs/2012.02951) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 침수 후 장면 이해 고해상도 항공 데이터셋 |

## L15 골목상권 점주 코파일럿

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `hong2024-datainterpreter` | Data Interpreter: An LLM Agent For Data Science | 2024 | arXiv:2402.18679 (https://arxiv.org/abs/2402.18679) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 데이터 분석·코드 실행 LLM 에이전트 |
| `sahu2024-insightbench` | InsightBench: Evaluating Business Analytics Agents Through Multi-Step Insight Generation | 2024 | arXiv:2407.06423 (https://arxiv.org/abs/2407.06423) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 비즈니스 분석 에이전트 인사이트 생성 벤치마크 |
| `zhang2025-data2dashboard` | Data-to-Dashboard: Multi-Agent LLM Framework for Insightful Visualization in Enterprise Analytics | 2025 | arXiv:2505.23695 (https://arxiv.org/abs/2505.23695) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 기업 분석용 다중 에이전트 시각화 |
| `ansari2024-chronos` | Chronos: Learning the Language of Time Series | 2024 | arXiv:2403.07815 (https://arxiv.org/abs/2403.07815) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 시계열 예측 파운데이션 모델 |

## L16 잔반 원가 분석

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `rokhva2025-foodwaste-cv` | Artificial Intelligence in the Food Industry: Food Waste Estimation based on Computer Vision, a Brief Case Study in a University Dining Hall | 2025 | arXiv:2507.14662 (https://arxiv.org/abs/2507.14662) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 대학 식당 잔반 컴퓨터비전 추정 사례 |
| `thames2021-nutrition5k` | Nutrition5k: Towards Automatic Nutritional Understanding of Generic Food | 2021 | arXiv:2103.03375 (https://arxiv.org/abs/2103.03375) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 음식 영양/양 자동 이해 데이터셋(무게 라벨 포함) |
| `kirillov2023-sam` | Segment Anything | 2023 | arXiv:2304.02643 (https://arxiv.org/abs/2304.02643) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 범용 분할(SAM) |

## L17 고립 청년 저부담 연결

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `shah2025-mh-safety` | Evaluating the Clinical Safety of LLMs in Response to High-Risk Mental Health Disclosures | 2025 | arXiv:2509.08839 (https://arxiv.org/abs/2509.08839) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 고위험 정신건강 호소에 대한 LLM 임상 안전성 평가 |
| `arnaizrodriguez2025-mh-crisis` | Between Help and Harm: An Evaluation of Mental Health Crisis Handling by LLMs | 2025 | arXiv:2509.24857 (https://arxiv.org/abs/2509.24857) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: LLM의 정신건강 위기 대응 평가 |
| `fang2025-chatbot-rct` | How AI and Human Behaviors Shape Psychosocial Effects of Extended Chatbot Use: A Longitudinal Randomized Controlled Study | 2025 | arXiv:2503.17473 (https://arxiv.org/abs/2503.17473) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 챗봇 장기 사용의 심리사회적 효과 RCT |
| `nelson2025-bh-safetyfilter` | An AI-Based Behavioral Health Safety Filter and Dataset for Identifying Mental Health Crises in Text-Based Conversations | 2025 | arXiv:2510.12083 (https://arxiv.org/abs/2510.12083) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 위기 신호 분류용 안전 필터·데이터셋 |

## L18 첫 오개념 진단

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `song2026-mllm-handwritten-math` | Can MLLMs Read Students' Minds? Unpacking Multimodal Error Analysis in Handwritten Math | 2026 | arXiv:2603.24961 (https://arxiv.org/abs/2603.24961) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 손글씨 수학 풀이 오류 분석 MLLM 평가 |
| `kim2025-diagnose-handwritten` | Benchmarking Large Language Models for Diagnosing Students' Cognitive Skills from Handwritten Math Work | 2025 | arXiv:2504.00843 (https://arxiv.org/abs/2504.00843) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 손글씨 풀이로 학생 인지 기술 진단 LLM 벤치마크 |
| `liu2023-misconception-math` | Novice Learner and Expert Tutor: Evaluating Math Reasoning Abilities of Large Language Models with Misconceptions | 2023 | arXiv:2310.02439 (https://arxiv.org/abs/2310.02439) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: 오개념을 가진 학습자 시뮬레이션과 튜터 평가 |
| `lightman2023-prm` | Let's Verify Step by Step | 2023 | arXiv:2305.20050 (https://arxiv.org/abs/2305.20050) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 단계별 풀이 검증(첫 오류 단계 지점화) |

## L19 복합 포장재 분리 안내

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `ali2025-wastebench` | Waste-Bench: A Comprehensive Benchmark for Evaluating VLLMs in Cluttered Environments | 2025 | arXiv:2509.00176 (https://arxiv.org/abs/2509.00176) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 혼잡 환경 폐기물에 대한 VLLM 평가 |
| `proenca2020-taco` | TACO: Trash Annotations in Context for Litter Detection | 2020 | arXiv:2003.06975 (https://arxiv.org/abs/2003.06975) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 폐기물 주석 데이터셋(TACO) |
| `kirillov2023-sam` | Segment Anything | 2023 | arXiv:2304.02643 (https://arxiv.org/abs/2304.02643) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 범용 분할(SAM) |
| `liu2023-llava` | Visual Instruction Tuning | 2023 | arXiv:2304.08485 (https://arxiv.org/abs/2304.08485) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 시각 지시 튜닝(VLM) |

## L20 응급 사전분류·병상 매칭

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `han2024-korean-triage` | Development of a Large Language Model-based Multi-Agent Clinical Decision Support System for Korean Triage and Acuity Scale (KTAS)-Based Triage and Treatment Planning in Emergency Departments | 2024 | arXiv:2408.07531 (https://arxiv.org/abs/2408.07531) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 한국 응급 분류(KTAS)용 LLM 다중에이전트 임상의사결정지원 |
| `sebastian2025-llm-triage` | LLM-Assisted Emergency Triage Benchmark: Bridging Hospital-Rich and MCI-Like Field Simulation | 2025 | arXiv:2509.26351 (https://arxiv.org/abs/2509.26351) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 응급 트리아지 벤치마크 |
| `guerraadames2025-triage-bias` | Auditing Sex/Gender Disparities in Emergency Triage with LLM-based Paired Comparisons | 2025 | arXiv:2511.17124 (https://arxiv.org/abs/2511.17124) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제 근거: LLM 트리아지의 성별 편향 감사(위험 고지) |

## L21 합성 페르소나 시장검증

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `argyle2022-simulate-humans` | Out of One, Many: Using Language Models to Simulate Human Samples | 2022 | arXiv:2209.06899 (https://arxiv.org/abs/2209.06899) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 언어모델로 인간 표본 시뮬레이션 |
| `park2023-generativeagents` | Generative Agents: Interactive Simulacra of Human Behavior | 2023 | arXiv:2304.03442 (https://arxiv.org/abs/2304.03442) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 생성형 에이전트 행동 시뮬레이션 |
| `zhang2024-focusagent` | Focus Agent: LLM-Powered Virtual Focus Group | 2024 | arXiv:2409.01907 (https://arxiv.org/abs/2409.01907) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: LLM 가상 포커스그룹 |
| `wang2025-deeppersona` | DeepPersona: A Generative Engine for Scaling Deep Synthetic Personas | 2025 | arXiv:2511.07338 (https://arxiv.org/abs/2511.07338) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 합성 페르소나 대규모 생성 |
| `lee2024-socialdesirability` | Exploring Social Desirability Response Bias in Large Language Models: Evidence from GPT-4 Simulations | 2024 | arXiv:2410.15442 (https://arxiv.org/abs/2410.15442) | arXiv API id_list 조회(제목·1저자·연도 확인) | 한계 근거: LLM 시뮬레이션의 사회적 바람직성 편향 |

## L22 고장 증상 좁히기

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `hu2024-uot-askquestions` | Uncertainty of Thoughts: Uncertainty-Aware Planning Enhances Information Seeking in Large Language Models | 2024 | arXiv:2402.03271 (https://arxiv.org/abs/2402.03271) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 정보 부족 시 최소 질문으로 불확실성 줄이는 LLM 질문 계획 |
| `yao2022-react` | ReAct: Synergizing Reasoning and Acting in Language Models | 2022 | arXiv:2210.03629 (https://arxiv.org/abs/2210.03629) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 추론+행동(도구 호출) 에이전트 |
| `wang2024-qwen2vl` | Qwen2-VL: Enhancing Vision-Language Model's Perception of the World at Any Resolution | 2024 | arXiv:2409.12191 (https://arxiv.org/abs/2409.12191) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 임의 해상도 VLM(사진 분류·OCR) |

## L23 사진 한 장 생활민원

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `perez2025-sagai-streetscape` | Streetscape Analysis with Generative AI (SAGAI): Vision-Language Assessment and Mapping of Urban Scenes | 2025 | arXiv:2504.16538 (https://arxiv.org/abs/2504.16538) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: VLM 도시 장면 평가·지도화 |
| `hu2023-upd-disorder` | UPDExplainer: an Interpretable Transformer-based Framework for Urban Physical Disorder Detection Using Street View Imagery | 2023 | arXiv:2305.02911 (https://arxiv.org/abs/2305.02911) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 거리 이미지로 도시 물리적 무질서(민원 유형) 탐지 |
| `liu2023-llava` | Visual Instruction Tuning | 2023 | arXiv:2304.08485 (https://arxiv.org/abs/2304.08485) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 시각 지시 튜닝(VLM) |

## L24 논문 수식·도표 재현

| stem | title | year | ID/URL | 확인방법 | 이 아이디어와의 관련 |
|---|---|---|---|---|---|
| `starace2025-paperbench` | PaperBench: Evaluating AI's Ability to Replicate AI Research | 2025 | arXiv:2504.01848 (https://arxiv.org/abs/2504.01848) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: AI 연구 재현 능력 평가 |
| `seo2025-paper2code` | Paper2Code: Automating Code Generation from Scientific Papers in Machine Learning | 2025 | arXiv:2504.17192 (https://arxiv.org/abs/2504.17192) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: 논문에서 코드 생성 |
| `siegel2024-corebench` | CORE-Bench: Fostering the Credibility of Published Research Through a Computational Reproducibility Agent Benchmark | 2024 | arXiv:2409.11363 (https://arxiv.org/abs/2409.11363) | arXiv API id_list 조회(제목·1저자·연도 확인) | 문제+기법 근거: 연구 계산 재현성 에이전트 벤치마크 |
| `kim2021-donut-ocrfree` | OCR-free Document Understanding Transformer | 2021 | arXiv:2111.15664 (https://arxiv.org/abs/2111.15664) | arXiv API id_list 조회(제목·1저자·연도 확인) | 기법 근거: OCR 없는 문서 이해 트랜스포머 |

## 기존 인용 검증

| ID | API 조회 결과(제목 / 1저자 / 연도) | 판정 |
|---|---|---|
| 2204.08387 | LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking / Yupan Huang / 2022 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2005.11401 | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks / Patrick Lewis / 2020 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2304.08485 | Visual Instruction Tuning / Haotian Liu / 2023 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2304.02643 | Segment Anything / Alexander Kirillov / 2023 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2507.14662 | Artificial Intelligence in the Food Industry: Food Waste Estimation based on Computer Vision, a Brief Case Study in a University Dining Hall / Shayan Rokhva / 2025 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2305.20050 | Let's Verify Step by Step / Hunter Lightman / 2023 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2212.04356 | Robust Speech Recognition via Large-Scale Weak Supervision / Alec Radford / 2022 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2307.13854 | WebArena: A Realistic Web Environment for Building Autonomous Agents / Shuyan Zhou / 2023 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2003.06975 | TACO: Trash Annotations in Context for Litter Detection / Pedro F Proença / 2020 | 일치(ID 실재). 주의: TACO는 폐기물 검출(litter) 데이터셋이므로 포장재 재질 분류용이면 근거 범위를 좁게 쓸 것. |
| 2103.06268 | CUAD: An Expert-Annotated NLP Dataset for Legal Contract Review / Dan Hendrycks / 2021 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2111.15664 | OCR-free Document Understanding Transformer / Geewook Kim / 2021 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2409.12191 | Qwen2-VL: Enhancing Vision-Language Model's Perception of the World at Any Resolution / Peng Wang / 2024 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2210.03629 | ReAct: Synergizing Reasoning and Acting in Language Models / Shunyu Yao / 2022 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2310.11511 | Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection / Akari Asai / 2023 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2307.03172 | Lost in the Middle: How Language Models Use Long Contexts / Nelson F. Liu / 2023 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2207.04672 | No Language Left Behind: Scaling Human-Centered Machine Translation /  NLLB Team / 2022 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2403.07815 | Chronos: Learning the Language of Time Series / Abdul Fatir Ansari / 2024 | 일치(Chronos) |
| 2310.10688 | A decoder-only foundation model for time-series forecasting / Abhimanyu Das / 2023 | 일치(TimesFM) |
| 2402.03216 | M3-Embedding: Multi-Linguality, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation / Jianlv Chen / 2024 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2404.16130 | From Local to Global: A Graph RAG Approach to Query-Focused Summarization / Darren Edge / 2024 | 일치(ID 실재, 널리 알려진 제목과 부합) |
| 2502.16161 | OmniParser V2: Structured-Points-of-Thought for Unified Visual Text Parsing and Its Generality to Multimodal Large Language Models / Wenwen Yu / 2025 | 일치(ID 실재). 주의: 이 ID는 OmniParser V2(Yu, 텍스트 파싱)이며, GUI 파싱 OmniParser(Lu, Microsoft)는 2408.00203이다. GUI 용도로 인용했다면 불일치. |

주: '일치'는 ID가 실제 논문으로 열리고 일반적으로 알려진 제목과 부합함을 뜻한다. 팀원이 어떤 제목으로 인용했는지는 받지 못했으므로, 인용문 속 제목과의 대조는 별도로 필요하다.

총 고유 검증 논문 수: 88편 (기존 인용 21편 포함)
