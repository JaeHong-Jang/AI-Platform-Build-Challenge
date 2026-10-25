# 이사 지킴이 정확도 측정 (B009 분석)

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
| 실행 시각 | 2026-10-24T09:21:35.252Z |

### 견적 읽기 (정답 대비, 총 확인 필요 정답 카드 85개 / 명시됨 정답 카드 173개)

| 지표 | 모델 단독 (raw, 원문 대조 없음) | 검증기 포함 (현재 파이프라인) |
|---|---|---|
| 오반영 (정답 확인 필요인데 '명시됨') | 5건 | 2건 |
| 질문 재현율 (정답 확인 필요 카드 중 질문으로 뽑힘) | 94% (80/85) | 98% (83/85) |
| 원문에 없는 값 채움 (총액·계약금·인원·차량) | 1건 | 0건 |
| 허위 발췌 (품목 quote가 원문에 없음) | 0건 | 0건 (코드가 제거) |
| 값 누락 (정답이 있는데 null) | 0건 | 5건 |
| 과잉 질문 (정답 명시됨인데 질문) | 8건 | 9건 |
| 검증기가 걸러낸 항목 | - | 37개 |
| 평균 소요(모델 응답) | 3791ms (같은 호출) | 3791ms (검증 비용은 무시할 수준) |

### 답변 점검 (정답 명시 카드 14개)

| 지표 | 모델 단독 (거절된 후보 포함 전부) | 코드 검증 통과 후 |
|---|---|---|
| 오반영 (정답에 없는 카드를 명시됨으로 제안) | 36건 | 2건 |
| 정답 명시 카드 재현율 | 86% | 86% |
| 모델이 냈지만 코드가 거절한 오반영 | - | 34건 |
| 코드가 거절해 잃은 정답 후보 | - | 0건 |
| 평균 소요 | 3452ms (한 건 전체) | 동일 |
| 비정상 종료(error/limit) | 2건, 호출 실패 0건 | |

## 2. 규칙 단독 (정답 초안 입력)

LLM 없이 사람이 읽은 값(정답 초안)을 `compare(items, gold, cond, text)`에 넣은 결과. 규칙 자체의 정확도.

| 지표 | 값 |
|---|---|
| 오반영 | 2건 |
| 질문 재현율 | 98% (83/85) |
| 과잉 질문 | 3건 / 정답 명시 173개 |
| 값 채움 | 0건 (정답 초안 그대로 사용) |

정답 초안을 검증기(verifyDraft)에 먼저 통과시키면 오반영 2건, 재현율 98%, 과잉 질문 3건, **정답 값이 잘못 지워진 건 5건**.

## 3. 실패 사례

### 3-1. 규칙 단독 오반영·과잉 질문

- Q02 과잉 질문: workers

- **Q14 오반영** `item-책장` — 근거 ["책장 1개"]

- **Q14 오반영** `item-책상` — 근거 ["책상 1개"]

- Q17 과잉 질문: stairs-from, fee

### 3-2. LLM 파이프라인 (검증기 포함) 오반영·값 채움

#### Q14

- 오반영 `item-책장` 근거 ["1개"]
- 오반영 `item-책상` 근거 ["1개"]

원문:
```
[가상구름이사] 이사 견적
11월 23일 오후 / 1톤 1대 / 2명
품목: 침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
※ 책장과 책상은 분해·조립이 필요하면 별도 비용 협의
총액 35만원 / 계약금 5만원
```

### 3-3. 검증기 없을 때(raw) 나온 오반영·값 채움 (검증기가 막은 사례)

- Q11: 오반영 `ladder` — 검증기가 버림: 사다리차: '포함' (원문에 사다리 언급 없음)

- Q14: 오반영 `item-책장` / 오반영 `item-책상` — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음)

- Q17: 오반영 `ladder` — 검증기가 버림: 사다리차: '포함' (원문에 사다리 언급 없음)

- Q19: 오반영 `truck` / 값 채움 truck="별도" (정답 null) — 검증기가 버림: 사다리차: '별도' (원문에 사다리 언급 없음); 차량: "별도"; 계단 문구: "별도"

### 3-3b. 검증기가 정답 값을 잘못 지운 사례 (값 누락 → '판독 불가' 질문으로 바뀜. 오반영은 아니고 사용자 부담 증가)

- Q02: workers (정답 2) — 검증기 메시지: 작업 인원: 2명 (원문에 없는 숫자)
- Q03: totalAmount (정답 360000), deposit (정답 36000) — 검증기 메시지: 총액: 360,000원 (원문의 총액 자리에 없는 숫자); 계약금: 36,000원 (원문의 계약금 자리에 없는 숫자)
- Q06: totalAmount (정답 360000) — 검증기 메시지: 총액: 360,000원 (원문의 총액 자리에 없는 숫자)
- Q07: totalAmount (정답 400000) — 검증기 메시지: 뭉뚱그린 문구: "총액 400000"; 뭉뚱그린 문구: "계약금 50000"; 총액: 400,000원 (원문의 총액 자리에 없는 숫자)
- (정답 초안에 검증기만 적용) Q02: workers (정답 2)
- (정답 초안에 검증기만 적용) Q03: totalAmount (정답 360000), deposit (정답 36000)
- (정답 초안에 검증기만 적용) Q06: totalAmount (정답 360000)
- (정답 초안에 검증기만 적용) Q07: totalAmount (정답 400000)

### 3-4. 질문 놓침 (검증기 포함)


### 3-5. 답변 점검 실패

#### R06 (얼버무림, Q02) — 종료 finished

답변 원문: "네 다 됩니다~ 걱정 마세요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","workers","stairs-from","ladder","fee-none"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스","workers","stairs-from","ladder","fee-none"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-침대","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '싱글 침대'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책장","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책장'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책상","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책상'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-의자","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '의자'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-냉장고","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '냉장고'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-세탁기","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '세탁기'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-전자레인지","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '전자레인지'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-박스","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '박스·잡화'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"workers","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '작업 인원'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"stairs-from","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '출발지 계단 작업'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"ladder","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '사다리차'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"fee-none","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '당일 추가 비용 조건'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-침대","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-책장","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-책상","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-의자","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-냉장고","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-세탁기","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-전자레인지","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"item-박스","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"workers","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"stairs-from","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-none","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"}]

#### R07 (얼버무림, Q02) — 종료 finished

답변 원문: "다 포함이고요 필요한 건 말씀 주세요."

- 정답 명시 카드: []
- 모델 단독 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스"] / 검증 후 오반영: [] / 코드가 거절한 오반영: ["item-침대","item-책장","item-책상","item-의자","item-냉장고","item-세탁기","item-전자레인지","item-박스"] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-침대","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '싱글 침대'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책장","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책장'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-책상","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '책상'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-의자","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '의자'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-냉장고","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '냉장고'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-세탁기","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '세탁기'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-전자레인지","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '전자레인지'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"item-박스","relation":"explicit_answer","accepted":false,"reason":"답변 문구에 '박스·잡화'에 대한 말이 없습니다. 뭉뚱그린 답이면 unanswered"},{"card":"workers","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"stairs-from","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"ladder","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"},{"card":"fee-none","relation":"unanswered","accepted":true,"reason":"답이 없어 확인이 남은 항목으로 유지"}]

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
- 모델 단독 오반영: ["item-박스"] / 검증 후 오반영: ["item-박스"] / 코드가 거절한 오반영: [] / 코드가 거절해 잃은 정답: []
- 모델 후보 전부: [{"card":"item-박스","relation":"explicit_answer","accepted":true,"reason":"조건 모호 → 명시됨 (사용자 승인 후 반영)"},{"card":"stairs-from","relation":"explicit_answer","accepted":true,"reason":"포함 여부 미확인 → 명시됨 (사용자 승인 후 반영)"}]

## 4. 건별 소요 시간

| 견적 | 모델 응답 ms | | 답변 | 전체 ms | 종료 |
|---|---|---|---|---|---|
| Q01 | 4167 | | R01 | 3026 | finished |
| Q02 | 2133 | | R02 | 2081 | finished |
| Q03 | 3960 | | R03 | 1958 | finished |
| Q04 | 3915 | | R04 | 2130 | finished |
| Q05 | 4071 | | R05 | 9943 | finished |
| Q06 | 4413 | | R06 | 9441 | finished |
| Q07 | 4293 | | R07 | 4980 | finished |
| Q08 | 3540 | | R08 | 1742 | finished |
| Q09 | 4131 | | R09 | 1625 | finished |
| Q10 | 2525 | | R10 | 3116 | finished |
| Q11 | 4145 | | R11 | 3370 | finished |
| Q12 | 3727 | | R12 | 2582 | finished |
| Q13 | 4029 | | R13 | 2251 | finished |
| Q14 | 4175 | | R14 | 2153 | finished |
| Q15 | 2838 | | R15 | 3006 | finished |
| Q16 | 4689 | | R16 | 1565 | finished |
| Q17 | 3949 | | R17 | 4741 | limit |
| Q18 | 4509 | | R18 | 2322 | finished |
| Q19 | 2303 | | R19 | 4984 | limit |
| Q20 | 4311 | | R20 | 2018 | finished |

## 5. 해석 (Sonnet)

- 검증기는 기준선의 오반영 5건 중 3건과 허위 값 채움을 막았다. 남은 오반영은 Q14(품목 줄 따로, '별도 협의' 줄 따로) 2건으로, 규칙이 품목이 처음 나온 문장만 본다. 정답 초안으로도 똑같이 나오므로 모델이 아니라 규칙의 한계다.
- 검증기의 부작용: 총액·계약금이 쉼표 금액이거나 한 문장에 섞이면 맞는 값도 지운다(5건). 오반영은 아니고 '판독 불가' 질문이 늘어난다.
- 답변 점검에서 모델 단독은 얼버무림 답변에 카드를 전부 명시로 올린다(36건 중 대부분 R06·R07·R19). 코드 검증이 34건을 거절했다. 코드를 통과한 오반영 2건은 R14('다 해드립니다'를 계단 명시로 판단 — 라벨 논쟁 여지 있음)와 R20(박스 '별도 5만원' 문장을 박스 명시로 판단 — 명백한 오반영).
- R17·R19는 도구 호출 상한(limit)에 걸려 끝났다.
