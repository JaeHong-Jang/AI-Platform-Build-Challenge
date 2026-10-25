# 이사 지킴이 정확도 측정 (B009 분석)

> 합성 평가셋 20+20건. **홀드아웃: 평가셋·정답 라벨은 Sol(GPT 6.1)이 판정 코드를 보지 않고 작성했고, 의장은 이 셋을 본 뒤 코드를 고치지 않았다.** 사람 검수 전. 실제 소비자 견적이 아니라 합성이므로 일반화 주장은 하지 않는다.

## 1. 모델 단독 vs 검증기 포함

### 측정 조건

| 항목 | 값 |
|---|---|
| 견적 읽기 모델 | ax4-light:q4_K_M (Ollama, http://172.20.32.1:11434) |
| 답변 점검 모델 | qwen3:4b-instruct-2507-q4_K_M |
| GPU | 로컬 GPU 1대(8GB급, 모델 교대 시 재적재) — 호출은 순차 실행 |
| 웜/콜드 | 각 모델 시작 전 `warm()`으로 미리 적재 후 측정(콜드 시간 제외). 견적 20건을 모두 마친 뒤 답변 20건을 돌려 모델 교대 1회 |
| 건수 | 견적 20건, 답변 20건 |
| 반복 | 1회 (temperature 0, num_ctx 8192) — 분산 미측정 |
| 실행 시각 | 2026-10-24T09:51:05.552Z |

### 견적 읽기 (정답 대비, 총 확인 필요 정답 카드 59개 / 명시됨 정답 카드 88개)

| 지표 | 모델 단독 (raw, 원문 대조 없음) | 검증기 포함 (현재 파이프라인) |
|---|---|---|
| 오반영 (정답 확인 필요인데 '명시됨') | 7건 | 4건 |
| 질문 재현율 (정답 확인 필요 카드 중 질문으로 뽑힘) | 86% (51/59) | 92% (54/59) |
| 원문에 없는 값 채움 (총액·계약금·인원·차량) | 4건 | 0건 |
| 허위 발췌 (품목 quote가 원문에 없음) | 0건 | 0건 (코드가 제거) |
| 값 누락 (정답이 있는데 null) | 1건 | 9건 |
| 과잉 질문 (정답 명시됨인데 질문) | 11건 | 12건 |
| 검증기가 걸러낸 항목 | - | 37개 |
| 평균 소요(모델 응답) | 3273ms (같은 호출) | 3273ms (검증 비용은 무시할 수준) |

### 답변 점검 (정답 명시 카드 19개)

| 지표 | 모델 단독 (거절된 후보 포함 전부) | 코드 검증 통과 후 |
|---|---|---|
| 오반영 (정답에 없는 카드를 명시됨으로 제안) | 11건 | 4건 |
| 정답 명시 카드 재현율 | 74% | 68% |
| 모델이 냈지만 코드가 거절한 오반영 | - | 7건 |
| 코드가 거절해 잃은 정답 후보 | - | 1건 |
| 평균 소요 | 3047ms (한 건 전체) | 동일 |
| 비정상 종료(error/limit) | 2건, 호출 실패 0건 | |

## 2. 규칙 단독 (정답 초안 입력)

LLM 없이 사람이 읽은 값(정답 초안)을 `compare(items, gold, cond, text)`에 넣은 결과. 규칙 자체의 정확도.

| 지표 | 값 |
|---|---|
| 오반영 | 4건 |
| 질문 재현율 | 92% (54/59) |
| 과잉 질문 | 9건 / 정답 명시 88개 |
| 값 채움 | 0건 (정답 초안 그대로 사용) |

정답 초안을 검증기(verifyDraft)에 먼저 통과시키면 오반영 4건, 재현율 92%, 과잉 질문 9건, **정답 값이 잘못 지워진 건 7건**.

## 3. 실패 사례

### 3-1. 규칙 단독 오반영·과잉 질문

- H01 과잉 질문: fee

- H05 과잉 질문: item-박스

- H07 과잉 질문: carry-from, fee

- H10 과잉 질문: carry-to, fee

- H14 과잉 질문: fee

- **H15 오반영** `item-식탁` — 근거 ["식탁 1개"]

- **H15 오반영** `item-의자` — 근거 ["의자 4개"]

- **H15 오반영** `item-모니터` — 근거 ["모니터 1대"]

- H16 과잉 질문: carry-to, fee

- **H18 오반영** `truck` — 근거 ["1톤 2대"]

### 3-2. LLM 파이프라인 (검증기 포함) 오반영·값 채움

#### H15

- 오반영 `item-식탁` 근거 ["1개"]
- 오반영 `item-의자` 근거 ["4개"]
- 오반영 `item-모니터` 근거 ["1대"]

원문:
```
가상주황돛단배용달
11/21 오후 3시 일반이사
1톤 1대 / 작업 인원 2명
운송 목록: 식탁 1개, 의자 4개, 모니터 1대
※ 위 물품 전부 고객님이 1층에 내려놓는 조건임니다.
총액 24만 / 계약금 2만4천
계단 운반 요청 시 추가요금 협의
```

#### H18

- 오반영 `truck` 근거 ["1톤 2대 예정, 배차 사정에 따라 변경"]

원문:
```
[가상분홍나뭇잎이사] 투룸 반포장
11월 24일 오전 10시
차량은 1톤 2대 예정, 배차 사정에 따라 변경
작업 인원 3명
양문형 냉장고 1대, 건조기 1대, 옷장 1개 포함
사다리차 필요 시 비용 별도
총액 53만 / 계약금 159,000원
```

### 3-3. 검증기 없을 때(raw) 나온 오반영·값 채움 (검증기가 막은 사례)

- H02: 오반영 `item-냉장고` — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음); 총액: 380,000원 (원문의 총액 자리에 없는 숫자); 계약금: 100,000원 (원문의 계약금 자리에 없는 숫자)

- H05: 값 채움 totalAmount=57000 (정답 570000) — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음); 총액: 57,000원 (원문의 총액 자리에 없는 숫자)

- H06: 오반영 `truck` / 값 채움 truck="별도" (정답 null) — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음); 차량: "별도"; 계단 문구: "별도"; 추가비 문구: "엘베 사용료: 관리실에 직접 납부"; 추가비 문구: "주차장부터 집까지 운반비: 거리 보고 협의"

- H10: 값 채움 totalAmount=72000 (정답 720000) — 검증기가 버림: 뭉뚱그린 문구: "짐 일체"; 총액: 72,000원 (원문의 총액 자리에 없는 숫자)

- H15: 오반영 `item-식탁` / 오반영 `item-의자` / 오반영 `item-모니터` — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음)

- H17: 오반영 `truck` / 값 채움 truck="포함" (정답 null) — 검증기가 버림: 사다리차: '포함' (원문에 사다리 언급 없음); 차량: "포함"

- H18: 오반영 `truck`

### 3-3b. 검증기가 정답 값을 잘못 지운 사례 (값 누락 → '판독 불가' 질문으로 바뀜. 오반영은 아니고 사용자 부담 증가)

- H02: totalAmount (정답 380000), deposit (정답 100000) — 검증기 메시지: 총액: 380,000원 (원문의 총액 자리에 없는 숫자); 계약금: 100,000원 (원문의 계약금 자리에 없는 숫자)
- H05: totalAmount (정답 570000) — 검증기 메시지: 총액: 57,000원 (원문의 총액 자리에 없는 숫자)
- H07: totalAmount (정답 380000) — 검증기 메시지: 총액: 380,000원 (원문의 총액 자리에 없는 숫자)
- H10: totalAmount (정답 720000) — 검증기 메시지: 총액: 72,000원 (원문의 총액 자리에 없는 숫자)
- H12: deposit (정답 0) — 검증기 메시지: 
- H14: totalAmount (정답 800000), deposit (정답 240000) — 검증기 메시지: 총액: 800,000원 (원문의 총액 자리에 없는 숫자); 계약금: 240,000원 (원문의 계약금 자리에 없는 숫자)
- H16: totalAmount (정답 690000) — 검증기 메시지: 총액: 690,000원 (원문의 총액 자리에 없는 숫자)
- (정답 초안에 검증기만 적용) H02: totalAmount (정답 380000), deposit (정답 100000)
- (정답 초안에 검증기만 적용) H07: totalAmount (정답 380000)
- (정답 초안에 검증기만 적용) H12: deposit (정답 0)
- (정답 초안에 검증기만 적용) H14: totalAmount (정답 800000), deposit (정답 240000)
- (정답 초안에 검증기만 적용) H16: totalAmount (정답 690000)

### 3-4. 질문 놓침 (검증기 포함)

- H04: item-안마의자

### 3-5. 답변 점검 실패

#### HR03 (조건부, H03) — 종료 finished

답변 원문: "에어컨 1대는 기존 배관 그대로 쓸 수 있을 때만 철거랑 재설치까지 포함됩니다."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-에어컨","fee-0"] / 검증 후 오반영: ["item-에어컨"] / 코드가 거절한 오반영: ["fee-0"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-에어컨","relation":"conditional_answer","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"stairs-from","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-0","relation":"conditional_answer","accepted":false,"reason":"quote가 업체 답변에 그대로 있는 문장이 아닙니다"},{"card":"item-에어컨","relation":"explicit_answer","accepted":true,"reason":"조건 모호 → 명시됨 (사용자 승인 후 반영)"},{"card":"stairs-from","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-0","relation":"explicit_answer","accepted":false,"reason":"quote가 업체 답변에 그대로 있는 문장이 아닙니다"}]

#### HR04 (금액 제시, H04) — 종료 finished

답변 원문: "안마의자는 7만원, 책장은 2만원으로 잡으시면 돼요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-의자","item-책장"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-의자","item-책장"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-의자","relation":"explicit_answer","accepted":false,"reason":"'7만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"item-책장","relation":"explicit_answer","accepted":false,"reason":"'7만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"fee-0","relation":"conditional_answer","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"fee-1","relation":"conditional_answer","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"item-의자","relation":"conflicting","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"item-책장","relation":"conflicting","accepted":true,"reason":"포함 여부 미확인 → 조건 모호 (사용자 승인 후 반영)"}]

#### HR05 (제외·별도, H05) — 종료 finished

답변 원문: "57만원에 보관료는 안 들어가요. 입고일부터 출고일까지 보관료 따로 받습니다."

- 정답 명시 카드: []
- 모델 단독 오반영: ["fee-0"] / 검증 후 오반영: ["fee-0"] / 코드가 거절한 오반영: [] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"fee-0","relation":"explicit_answer","accepted":true,"reason":"조건 모호 → 명시됨 (사용자 승인 후 반영)"}]

#### HR06 (명시적 포함, H06) — 종료 limit

답변 원문: "차량은 1톤 2대로 확정이고 총액에 포함입니다. 출발 주차장에서 집까지 운반, 도착 주차장에서 집까지 운반도 거리와 관계없이 둘 다 총액에 포함합니다. 엘베 사용료는 안내드린 대로 별도예요."

- 정답 명시 카드: ["truck","carry-from","carry-to"]
- 모델 단독 오반영: ["fee-0"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["fee-0"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"truck","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"carry-from","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"carry-to","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"fee-0","relation":"conditional_answer","accepted":false,"reason":"quote가 업체 답변에 그대로 있는 문장이 아닙니다"},{"card":"fee-0","relation":"explicit_answer","accepted":false,"reason":"'별도' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"}]

#### HR07 (무관, H07) — 종료 limit

답변 원문: "계약금 보내신 뒤 입금자 성함만 알려주세용."

- 정답 명시 카드: []
- 모델 단독 오반영: [] / 검증 후 오반영: [] / 코드가 거절한 오반영: [] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: []

#### HR10 (무관, H10) — 종료 finished

답변 원문: "도착 아파트 동 번호가 몇 동인가요?"

- 정답 명시 카드: []
- 모델 단독 오반영: ["fee-0"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["fee-0"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"carry-to","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-0","relation":"explicit_answer","accepted":false,"reason":"quote가 업체 답변에 그대로 있는 문장이 아닙니다"}]

#### HR13 (명시적 포함, H13) — 종료 finished

답변 원문: "제외라고 쓴 건 제가 잘못 적었습니다. 매트리스 1개도 운송 총액에 포함합니다. 최종 총액은 방문 후 안내드릴게요."

- 정답 명시 카드: ["item-매트리스"]
- 모델 단독 오반영: [] / 검증 후 오반영: [] / 코드가 거절한 오반영: [] / 코드가 거절해 잃은 정답: ["item-매트리스"]
- 모델 후보 전부: [{"card":"item-매트리스","relation":"explicit_answer","accepted":false,"reason":"'제외' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"unread-총액","relation":"conditional_answer","accepted":true,"reason":"판독 불가 → 조건 모호 (사용자 승인 후 반영)"},{"card":"item-매트리스","relation":"conflicting","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"unread-총액","relation":"conditional_answer","accepted":true,"reason":"판독 불가 → 조건 모호 (사용자 승인 후 반영)"}]

#### HR15 (명시적 포함, H15) — 종료 finished

답변 원문: "고객님이 1층에 내려놓는 조건은 삭제하겠습니다. 식탁 1개, 의자 4개, 모니터 1대 운송과 출발 2층 계단 작업 모두 기존 총액에 포함합니다. 추가 비용 없음으로 확정합니다."

- 정답 명시 카드: ["item-식탁","item-의자","item-모니터","stairs-from","fee"]
- 모델 단독 오반영: ["fee-0"] / 검증 후 오반영: ["fee-0"] / 코드가 거절한 오반영: [] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"stairs-from","relation":"explicit_answer","accepted":true,"reason":"조건 모호 → 명시됨 (사용자 승인 후 반영)"},{"card":"fee-0","relation":"explicit_answer","accepted":true,"reason":"조건 모호 → 명시됨 (사용자 승인 후 반영)"}]

#### HR17 (명시적 포함, H17) — 종료 finished

답변 원문: "책상 1개, 행거 1개, 박스 5개 운송 포함입니다. 차량 1톤 1대와 작업 인원 2명도 총액 38만원에 포함이에요. 추가 비용 없음입니다."

- 정답 명시 카드: ["item-책상","item-행거","item-박스","truck","workers","fee"]
- 모델 단독 오반영: ["fee-none"] / 검증 후 오반영: ["fee-none"] / 코드가 거절한 오반영: [] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-책상","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"item-행거","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"item-박스","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"truck","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"workers","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"fee-none","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"}]

#### HR20 (금액 제시, H20) — 종료 finished

답변 원문: "박스 3개 더는 2만원, 전자레인지는 1만원, 지하 계단은 4만원입니다. 출발지 장거리 운반비는 말씀드린 3만원이에요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-전자레인지","carry-from"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-전자레인지","carry-from"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-전자레인지","relation":"explicit_answer","accepted":false,"reason":"'1만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"item-박스","relation":"conditional_answer","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"stairs-to","relation":"conflicting","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"carry-from","relation":"explicit_answer","accepted":false,"reason":"'3만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"item-전자레인지","relation":"conditional_answer","accepted":true,"reason":"포함 여부 미확인 → 조건 모호 (사용자 승인 후 반영)"},{"card":"carry-from","relation":"conditional_answer","accepted":true,"reason":"포함 여부 미확인 → 조건 모호 (사용자 승인 후 반영)"}]

## 4. 건별 소요 시간

| 견적 | 모델 응답 ms | | 답변 | 전체 ms | 종료 |
|---|---|---|---|---|---|
| H01 | 3518 | | HR01 | 1548 | finished |
| H02 | 3379 | | HR02 | 2482 | finished |
| H03 | 3034 | | HR03 | 3900 | finished |
| H04 | 3619 | | HR04 | 4245 | finished |
| H05 | 3676 | | HR05 | 1619 | finished |
| H06 | 3652 | | HR06 | 3951 | limit |
| H07 | 3306 | | HR07 | 2272 | limit |
| H08 | 2404 | | HR08 | 5744 | finished |
| H09 | 3242 | | HR09 | 3046 | finished |
| H10 | 3783 | | HR10 | 2501 | finished |
| H11 | 3093 | | HR11 | 3948 | finished |
| H12 | 3618 | | HR12 | 1990 | finished |
| H13 | 2837 | | HR13 | 3178 | finished |
| H14 | 3629 | | HR14 | 2149 | finished |
| H15 | 3249 | | HR15 | 2026 | finished |
| H16 | 3493 | | HR16 | 2298 | finished |
| H17 | 2188 | | HR17 | 6748 | finished |
| H18 | 3264 | | HR18 | 1728 | finished |
| H19 | 3239 | | HR19 | 2021 | finished |
| H20 | 3238 | | HR20 | 3542 | finished |
