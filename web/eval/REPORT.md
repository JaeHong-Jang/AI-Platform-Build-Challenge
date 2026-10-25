# 이사 지킴이 정확도 측정 (B009 분석)

> **2차 측정(2026-10-24 저녁)**: 1차 결과(`REPORT.before.md`)의 실패 4종(쉼표 금액·한 문장 총액/계약금·'인원 2분'·다른 줄의 '분해 시 별도 협의'·되묻는 문장)을 재현 시험으로 만든 뒤 고치고 같은 평가셋으로 다시 쟀다. **같은 평가셋에 맞춰 고쳤으므로 이 수치는 과대평가일 수 있다** — 새로 만든 평가셋으로 재검증이 필요하다.
> 1차 → 2차(검증기 포함): 견적 오반영 2 → 0, 질문 재현율 98% → 100%, 값 누락 5 → 0, 과잉 질문 9 → 11 / 답변 오반영 2 → 1.

> 합성 평가셋 20+20건. **정답 라벨은 Sonnet이 표준약관·D006 기준으로 작성했고 사람 검수 전이다.** 실제 소비자 견적이 아니라 합성이므로 일반화 주장은 하지 않는다.

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
| 실행 시각 | 2026-10-24T09:26:28.624Z |

### 견적 읽기 (정답 대비, 총 확인 필요 정답 카드 85개 / 명시됨 정답 카드 173개)

| 지표 | 모델 단독 (raw, 원문 대조 없음) | 검증기 포함 (현재 파이프라인) |
|---|---|---|
| 오반영 (정답 확인 필요인데 '명시됨') | 5건 | 0건 |
| 질문 재현율 (정답 확인 필요 카드 중 질문으로 뽑힘) | 94% (80/85) | 100% (85/85) |
| 원문에 없는 값 채움 (총액·계약금·인원·차량) | 1건 | 0건 |
| 허위 발췌 (품목 quote가 원문에 없음) | 0건 | 0건 (코드가 제거) |
| 값 누락 (정답이 있는데 null) | 0건 | 0건 |
| 과잉 질문 (정답 명시됨인데 질문) | 8건 | 11건 |
| 검증기가 걸러낸 항목 | - | 32개 |
| 평균 소요(모델 응답) | 3767ms (같은 호출) | 3767ms (검증 비용은 무시할 수준) |

### 답변 점검 (정답 명시 카드 14개)

| 지표 | 모델 단독 (거절된 후보 포함 전부) | 코드 검증 통과 후 |
|---|---|---|
| 오반영 (정답에 없는 카드를 명시됨으로 제안) | 40건 | 1건 |
| 정답 명시 카드 재현율 | 86% | 86% |
| 모델이 냈지만 코드가 거절한 오반영 | - | 39건 |
| 코드가 거절해 잃은 정답 후보 | - | 0건 |
| 평균 소요 | 4088ms (한 건 전체) | 동일 |
| 비정상 종료(error/limit) | 3건, 호출 실패 0건 | |

## 2. 규칙 단독 (정답 초안 입력)

LLM 없이 사람이 읽은 값(정답 초안)을 `compare(items, gold, cond, text)`에 넣은 결과. 규칙 자체의 정확도.

| 지표 | 값 |
|---|---|
| 오반영 | 0건 |
| 질문 재현율 | 100% (85/85) |
| 과잉 질문 | 2건 / 정답 명시 173개 |
| 값 채움 | 0건 (정답 초안 그대로 사용) |

정답 초안을 검증기(verifyDraft)에 먼저 통과시키면 오반영 0건, 재현율 100%, 과잉 질문 2건, **정답 값이 잘못 지워진 건 0건**.

## 3. 실패 사례

### 3-1. 규칙 단독 오반영·과잉 질문

- Q17 과잉 질문: stairs-from, fee

### 3-2. LLM 파이프라인 (검증기 포함) 오반영·값 채움

### 3-3. 검증기 없을 때(raw) 나온 오반영·값 채움 (검증기가 막은 사례)

- Q11: 오반영 `ladder` — 검증기가 버림: 사다리차: '포함' (원문에 사다리 언급 없음)

- Q14: 오반영 `item-책장` / 오반영 `item-책상` — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음)

- Q17: 오반영 `ladder` — 검증기가 버림: 사다리차: '포함' (원문에 사다리 언급 없음)

- Q19: 오반영 `truck` / 값 채움 truck="별도" (정답 null) — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음); 차량: "별도"; 계단 문구: "별도"

### 3-3b. 검증기가 정답 값을 잘못 지운 사례 (값 누락 → '판독 불가' 질문으로 바뀜. 오반영은 아니고 사용자 부담 증가)


### 3-4. 질문 놓침 (검증기 포함)


### 3-5. 답변 점검 실패

#### R06 (얼버무림, Q02) — 종료 finished

답변 원문: "네 다 됩니다~ 걱정 마세요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","stairs-from","ladder","fee-none"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","stairs-from","ladder","fee-none"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-침대","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '싱글 침대'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책장","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책장'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책상","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책상'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-의자","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '의자'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-냉장고","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '냉장고'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-세탁기","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '세탁기'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-전자레인지","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '전자레인지'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-박스","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '박스·잡화'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"stairs-from","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '출발지 계단 작업'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"ladder","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '사다리차'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"fee-none","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '당일 추가 비용 조건'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"}]

#### R07 (얼버무림, Q02) — 종료 finished

답변 원문: "다 포함이고요 필요한 건 말씀 주세요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","stairs-from","ladder","fee-none"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","stairs-from","ladder","fee-none"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-침대","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '싱글 침대'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책장","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책장'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책상","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책상'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-의자","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '의자'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-냉장고","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '냉장고'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-세탁기","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '세탁기'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-전자레인지","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '전자레인지'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-박스","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '박스·잡화'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"stairs-from","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '출발지 계단 작업'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"ladder","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '사다리차'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"fee-none","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '당일 추가 비용 조건'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-침대","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-책장","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-책상","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-의자","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-냉장고","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-세탁기","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-전자레인지","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-박스","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"stairs-from","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-none","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"}]

#### R11 (금액 제시, Q14) — 종료 limit

답변 원문: "책장 책상 분해 조립은 개당 1만원씩 따로 받습니다. 계단은 포함입니다."

- 정답 명시 카드: ["stairs-from"]
- 모델 단독 오반영: ["item-책장","item-책상"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-책장","item-책상"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-책장","relation":"explicit_answer","accepted":false,"reason":"'1만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"item-책상","relation":"explicit_answer","accepted":false,"reason":"'1만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"stairs-from","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-0","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"}]

#### R14 (얼버무림, Q06) — 종료 finished

답변 원문: "계단은 걱정 마세요 다 해드립니다. 사다리차는 쓰게 되면 그때 말씀드릴게요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["stairs-from"] / 검증 후 오반영: ["stairs-from"] / 코드가 거절한 오반영: [] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"stairs-from","relation":"explicit_answer","accepted":true,"reason":"조건 모호 → 명시됨 (사용자 승인 후 반영)"},{"card":"ladder","relation":"conditional_answer","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"fee-0","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"}]

#### R15 (금액 제시, Q18) — 종료 finished

답변 원문: "사다리차는 필요하면 8만원 받습니다. 출발지 주차 멀면 운반비 2만원 추가돼요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["ladder","carry-from"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["ladder","carry-from"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"ladder","relation":"explicit_answer","accepted":false,"reason":"'8만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"carry-from","relation":"explicit_answer","accepted":false,"reason":"'2만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"ladder","relation":"conditional_answer","accepted":true,"reason":"조건 모호 유지, 조건부 답변을 기록 (사용자 승인 후 반영)"},{"card":"carry-from","relation":"conditional_answer","accepted":true,"reason":"포함 여부 미확인 → 조건 모호 (사용자 승인 후 반영)"}]

#### R17 (금액 제시, Q10) — 종료 limit

답변 원문: "총액은 38만원입니다. 계약금 3만원 보내주세요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["unread-총액"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["unread-총액"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"unread-총액","relation":"explicit_answer","accepted":false,"reason":"'38만' 같은 금액·제외·별도·조건 표현이 있어 '명시됨'으로 볼 수 없습니다. conditional_answer 또는 conflicting"},{"card":"item-침대","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-책장","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-책상","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-의자","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-전자레인지","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-박스","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"stairs-from","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-none","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"}]

#### R19 (얼버무림, Q19) — 종료 limit

답변 원문: "네 가능합니다. 원룸이면 보통 다 됩니다."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","stairs-from","ladder","fee-none"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","stairs-from","ladder","fee-none"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-침대","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '싱글 침대'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책장","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책장'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책상","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책상'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-의자","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '의자'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-냉장고","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '냉장고'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-세탁기","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '세탁기'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-전자레인지","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '전자레인지'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-박스","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '박스·잡화'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"stairs-from","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '출발지 계단 작업'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"ladder","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '사다리차'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"fee-none","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '당일 추가 비용 조건'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"}]

#### R20 (조건부, Q04) — 종료 finished

답변 원문: "박스 6개 말씀하셨죠? 6개면 별도 5만원 그대로 받고요, 계단은 포함입니다."

- 정답 명시 카드: ["stairs-from"]
- 모델 단독 오반영: ["item-박스"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-박스"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-박스","relation":"explicit_answer","accepted":false,"reason":"질문으로 끝나는 문장은 답변이 아닙니다. 그 항목을 포함한다고 말한 문장을 내세요"},{"card":"stairs-from","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"},{"card":"item-박스","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '박스·잡화'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-박스","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-none","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"}]

## 4. 건별 소요 시간

| 견적 | 모델 응답 ms | | 답변 | 전체 ms | 종료 |
|---|---|---|---|---|---|
| Q01 | 4141 | | R01 | 2427 | finished |
| Q02 | 2153 | | R02 | 2030 | finished |
| Q03 | 3959 | | R03 | 1901 | finished |
| Q04 | 3873 | | R04 | 4678 | finished |
| Q05 | 4013 | | R05 | 10947 | finished |
| Q06 | 4285 | | R06 | 11194 | finished |
| Q07 | 4155 | | R07 | 8840 | finished |
| Q08 | 3482 | | R08 | 1760 | finished |
| Q09 | 4080 | | R09 | 1623 | finished |
| Q10 | 2507 | | R10 | 4519 | finished |
| Q11 | 4105 | | R11 | 3785 | limit |
| Q12 | 3738 | | R12 | 2552 | finished |
| Q13 | 4027 | | R13 | 2231 | finished |
| Q14 | 4230 | | R14 | 2159 | finished |
| Q15 | 2866 | | R15 | 3023 | finished |
| Q16 | 4688 | | R16 | 1579 | finished |
| Q17 | 3912 | | R17 | 4708 | limit |
| Q18 | 4516 | | R18 | 2311 | finished |
| Q19 | 2270 | | R19 | 4962 | limit |
| Q20 | 4349 | | R20 | 4534 | finished |
