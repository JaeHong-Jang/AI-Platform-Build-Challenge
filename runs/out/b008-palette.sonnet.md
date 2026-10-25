# B008 이사 서비스 색상 팔레트 3안 (Sonnet 분석)

기준: TRITON 구조(웜 중성 스케일 + 강조 1색 + 어두운 레일 + KPI 좌측 3px 막대 + 장면 전용색)를 유지. 현재 앱은 팔레트 A 슬레이트+티일(`web/src/app/globals.css`).
대비비는 `/tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/data.js`로 WCAG 상대휘도 직접 계산. 본문·작은 글자 ≥4.5, 큰 글자·아이콘·점·막대·포커스 ≥3. 3안 x 라이트/다크 x 28개 짝 전수 검사에서 미달 0건(초기값에서 장면색 7건이 미달이라 더 어둡게 고쳤음). 상태 칩은 기호(✓ ? △ ⌀)를 항상 함께 쓴다.
다크의 칩 배경은 투명도 대신 불투명 hex로 계산했다.

## A. 크라프트 상자 + 트럭 파랑

이사 연결: 이삿짐 상자의 크라프트 갈색이 강조색, 트럭·포커스는 파랑. 상자를 여는 따뜻한 느낌이 TRITON stone+brass와 가장 닮음.

### 기본 토큰 (대비는 오른쪽 열의 짝 기준, WCAG 상대휘도)

| 토큰 | 역할 | 라이트 hex | 라이트 대비 | 다크 hex | 다크 대비 |
|---|---|---|---|---|---|
| bg | 페이지 배경 | `#F6F1E8` | - | `#17120E` | - |
| panel | 패널·카드 | `#FFFDF9` | - | `#211A14` | - |
| line | 구분선 | `#D9CDB9` | - | `#3C3025` | - |
| ink | 본문 글자 | `#2E2720` | 14.48 (vs panel) | `#F2E8D8` | 14.16 (vs panel) |
| sub | 보조 글자(text-sub) | `#5A4F42` | 7.85 (vs panel) | `#C2B49F` | 8.44 (vs panel) |
| meta | 메타·작은 글자 | `#6A5E4F` | 6.21 (vs panel) | `#A29480` | 5.79 (vs panel) |
| railbg | 레일 배경 | `#2A2119` | - | `#0F0B08` | - |
| railtext | 레일 글자 | `#CDBFAA` | 8.74 (vs railbg) | `#BDAE98` | 9.02 (vs railbg) |
| railact | 레일 활성 배경 | `#46362A` | - | `#3A2C20` | - |
| railacttext | 레일 활성 글자 | `#FBEBD0` | 9.82 (vs railact) | `#FBE3BC` | 10.77 (vs railact) |
| brand | 브랜드 면(버튼) | `#8A5A2B` | - | `#D49A5A` | - |
| onbrand | 브랜드 면 위 글자 | `#FFFFFF` | 5.87 (vs brand) | `#1C120A` | 7.52 (vs brand) |
| brandink | 브랜드색 글자 | `#7A4C20` | 7.17 (vs panel) | `#E6B880` | 9.43 (vs panel) |
| brandsoft | 브랜드 연한 면 | `#F3E6D2` | - | `#33271B` | - |
| focus | 포커스 링 | `#1F5FA8` | 6.34 (vs panel) | `#7FB2EE` | 7.78 (vs panel) |
| kpi | KPI 좌측 3px 막대 | `#A8723A` | 4.03 (vs panel) | `#D49A5A` | 7.01 (vs panel) |

보조 확인: text-sub/bg, meta/bg, ink/bg, brand/panel(≥3)도 모두 통과(스크립트 전수 검사 결과 미달 0건).

### 상태 칩 (기호 병기, 글자 ≥4.5)

| 상태 | 라이트 배경 | 라이트 글자 | 대비 | 다크 배경 | 다크 글자 | 대비 |
|---|---|---|---|---|---|---|
| ✓ 명시됨 | `#E3F2E6` | `#1E5B35` | 6.96 | `#17301F` | `#8FDBA6` | 8.69 |
| ? 포함 여부 미확인 | `#FBF0D0` | `#7A4A00` | 6.58 | `#35280A` | `#F1CB6B` | 9.25 |
| △ 조건 모호 | `#FBE5D6` | `#8A3A12` | 6.41 | `#3A2013` | `#F5A57A` | 7.55 |
| ⌀ 판독 불가 | `#ECE6DB` | `#43474D` | 7.52 | `#2D2720` | `#CFC6B8` | 8.73 |

### 에이전트 상태 (점 색 ≥3 vs panel, 라벨 글자는 text-sub 사용)

| 상태 | 라이트 | 대비 | 다크 | 대비 |
|---|---|---|---|---|
| 작동 중 | `#2E7D4F` | 4.97 | `#5CC184` | 7.70 |
| 대기 | `#A66A00` | 4.41 | `#E0A63A` | 7.92 |
| 꺼짐 | `#7C7164` | 4.69 | `#8F8373` | 4.63 |

### 2D 장면 (글자 아님. 윤곽선 `ink`를 항상 두르고, 채움은 바닥 대비 ≥3으로 맞춤)

| 요소 | 라이트 | 대비 | 다크 | 대비 |
|---|---|---|---|---|
| 벽 | `#EFE4D2` | 윤곽선으로 구분 | `#2C241B` | 윤곽선으로 구분 |
| 바닥 | `#D9C7A8` | 윤곽선으로 구분 | `#3B3024` | 윤곽선으로 구분 |
| 트럭 | `#2F6DB5` | 3.19 vs floor | `#4F8FD6` | 3.81 vs floor |
| 상자 | `#8A5F2D` | 3.38 vs floor | `#B88A52` | 4.16 vs floor |
| 피부 밝은색 | `#E8B896` | 윤곽선으로 구분 | `#E8B896` | 윤곽선으로 구분 |
| 피부 어두운색 | `#8F5632` | 4.71 vs wall | `#B7794F` | 4.26 vs wall |
| 옷 1 | `#2F6DB5` | 3.19 vs floor | `#4F8FD6` | 3.81 vs floor |
| 옷 2 | `#B84A18` | 3.15 vs floor | `#E5793F` | 4.37 vs floor |

## B. 새 집 초록 + 웜 중성

이사 연결: 새 집·입주의 초록(안심, 계약 전 점검 통과)이 강조색. 웜 크림 중성이 TRITON 스톤 구조를 유지하고, 상태 ✓와 브랜드가 같은 계열이라 의미가 일치함.

### 기본 토큰 (대비는 오른쪽 열의 짝 기준, WCAG 상대휘도)

| 토큰 | 역할 | 라이트 hex | 라이트 대비 | 다크 hex | 다크 대비 |
|---|---|---|---|---|---|
| bg | 페이지 배경 | `#F4F3EC` | - | `#131812` | - |
| panel | 패널·카드 | `#FFFEFA` | - | `#1B2219` | - |
| line | 구분선 | `#D9D7C8` | - | `#2F392C` | - |
| ink | 본문 글자 | `#26291F` | 14.66 (vs panel) | `#E9EFE2` | 13.89 (vs panel) |
| sub | 보조 글자(text-sub) | `#53584A` | 7.27 (vs panel) | `#B6C0AA` | 8.62 (vs panel) |
| meta | 메타·작은 글자 | `#646959` | 5.61 (vs panel) | `#9AA58D` | 6.31 (vs panel) |
| railbg | 레일 배경 | `#1D2A22` | - | `#0D110C` | - |
| railtext | 레일 글자 | `#BFCDBF` | 9.03 (vs railbg) | `#B0BDA9` | 9.70 (vs railbg) |
| railact | 레일 활성 배경 | `#2F4637` | - | `#27382B` | - |
| railacttext | 레일 활성 글자 | `#E4F5E5` | 9.01 (vs railact) | `#DDF3DF` | 10.65 (vs railact) |
| brand | 브랜드 면(버튼) | `#2F7A4D` | - | `#5DB37D` | - |
| onbrand | 브랜드 면 위 글자 | `#FFFFFF` | 5.23 (vs brand) | `#08170D` | 7.21 (vs brand) |
| brandink | 브랜드색 글자 | `#25673F` | 6.73 (vs panel) | `#86D0A2` | 8.96 (vs panel) |
| brandsoft | 브랜드 연한 면 | `#E3F0E4` | - | `#1F3326` | - |
| focus | 포커스 링 | `#0F6B8C` | 5.94 (vs panel) | `#8FC9E0` | 9.00 (vs panel) |
| kpi | KPI 좌측 3px 막대 | `#3F8E5E` | 3.97 (vs panel) | `#5DB37D` | 6.37 (vs panel) |

보조 확인: text-sub/bg, meta/bg, ink/bg, brand/panel(≥3)도 모두 통과(스크립트 전수 검사 결과 미달 0건).

### 상태 칩 (기호 병기, 글자 ≥4.5)

| 상태 | 라이트 배경 | 라이트 글자 | 대비 | 다크 배경 | 다크 글자 | 대비 |
|---|---|---|---|---|---|---|
| ✓ 명시됨 | `#E3F2E6` | `#1E5B35` | 6.96 | `#17301F` | `#8FDBA6` | 8.69 |
| ? 포함 여부 미확인 | `#FBF0D0` | `#7A4A00` | 6.58 | `#35280A` | `#F1CB6B` | 9.25 |
| △ 조건 모호 | `#FBE5D6` | `#8A3A12` | 6.41 | `#3A2013` | `#F5A57A` | 7.55 |
| ⌀ 판독 불가 | `#ECEAE0` | `#43474D` | 7.75 | `#272B24` | `#C9CFC0` | 9.04 |

### 에이전트 상태 (점 색 ≥3 vs panel, 라벨 글자는 text-sub 사용)

| 상태 | 라이트 | 대비 | 다크 | 대비 |
|---|---|---|---|---|
| 작동 중 | `#2E7D4F` | 5.00 | `#5CC184` | 7.30 |
| 대기 | `#A66A00` | 4.44 | `#E0A63A` | 7.51 |
| 꺼짐 | `#78796C` | 4.38 | `#8A9080` | 4.95 |

### 2D 장면 (글자 아님. 윤곽선 `ink`를 항상 두르고, 채움은 바닥 대비 ≥3으로 맞춤)

| 요소 | 라이트 | 대비 | 다크 | 대비 |
|---|---|---|---|---|
| 벽 | `#EEF0E2` | 윤곽선으로 구분 | `#232B20` | 윤곽선으로 구분 |
| 바닥 | `#D7D9C0` | 윤곽선으로 구분 | `#2F3A2B` | 윤곽선으로 구분 |
| 트럭 | `#9C6400` | 3.44 vs floor | `#E8B84A` | 6.47 vs floor |
| 상자 | `#8F6B3A` | 3.36 vs floor | `#B8955E` | 4.26 vs floor |
| 피부 밝은색 | `#E8B896` | 윤곽선으로 구분 | `#E8B896` | 윤곽선으로 구분 |
| 피부 어두운색 | `#8F5632` | 5.13 vs wall | `#B7794F` | 4.08 vs wall |
| 옷 1 | `#B5533C` | 3.42 vs floor | `#D9735A` | 3.72 vs floor |
| 옷 2 | `#2F7A4D` | 3.63 vs floor | `#5DB37D` | 4.66 vs floor |

## C. 이삿날 안전 주황 + 차콜

이사 연결: 이삿날 현장의 안전 주황(트럭·안전조끼·경고 표지)과 차콜 레일. 눈에 띄고 행동을 부르지만 TRITON 웜 톤에서는 가장 멀다.

### 기본 토큰 (대비는 오른쪽 열의 짝 기준, WCAG 상대휘도)

| 토큰 | 역할 | 라이트 hex | 라이트 대비 | 다크 hex | 다크 대비 |
|---|---|---|---|---|---|
| bg | 페이지 배경 | `#F3F2F0` | - | `#15171A` | - |
| panel | 패널·카드 | `#FFFFFF` | - | `#1E2125` | - |
| line | 구분선 | `#D8D5D0` | - | `#34383E` | - |
| ink | 본문 글자 | `#22252A` | 15.37 (vs panel) | `#ECEDEF` | 13.80 (vs panel) |
| sub | 보조 글자(text-sub) | `#4E525A` | 7.84 (vs panel) | `#B5B9C0` | 8.21 (vs panel) |
| meta | 메타·작은 글자 | `#60646D` | 5.93 (vs panel) | `#9A9FA8` | 6.08 (vs panel) |
| railbg | 레일 배경 | `#1F2328` | - | `#0E1012` | - |
| railtext | 레일 글자 | `#C4C8CE` | 9.40 (vs railbg) | `#B8BCC3` | 10.00 (vs railbg) |
| railact | 레일 활성 배경 | `#3A3F46` | - | `#34383E` | - |
| railacttext | 레일 활성 글자 | `#FFE2CC` | 8.59 (vs railact) | `#FFD9BD` | 8.93 (vs railact) |
| brand | 브랜드 면(버튼) | `#C2410C` | - | `#F28A3D` | - |
| onbrand | 브랜드 면 위 글자 | `#FFFFFF` | 5.18 (vs brand) | `#1A0D04` | 7.68 (vs brand) |
| brandink | 브랜드색 글자 | `#A8380A` | 6.49 (vs panel) | `#FFA866` | 8.50 (vs panel) |
| brandsoft | 브랜드 연한 면 | `#FDE9DC` | - | `#3A2517` | - |
| focus | 포커스 링 | `#2563A8` | 6.12 (vs panel) | `#7DB4F0` | 7.43 (vs panel) |
| kpi | KPI 좌측 3px 막대 | `#E8590C` | 3.58 (vs panel) | `#F28A3D` | 6.52 (vs panel) |

보조 확인: text-sub/bg, meta/bg, ink/bg, brand/panel(≥3)도 모두 통과(스크립트 전수 검사 결과 미달 0건).

### 상태 칩 (기호 병기, 글자 ≥4.5)

| 상태 | 라이트 배경 | 라이트 글자 | 대비 | 다크 배경 | 다크 글자 | 대비 |
|---|---|---|---|---|---|---|
| ✓ 명시됨 | `#E3F2E6` | `#1E5B35` | 6.96 | `#17301F` | `#8FDBA6` | 8.69 |
| ? 포함 여부 미확인 | `#FBF0D0` | `#7A4A00` | 6.58 | `#35280A` | `#F1CB6B` | 9.25 |
| △ 조건 모호 | `#FBE5D6` | `#8A3A12` | 6.41 | `#3A2013` | `#F5A57A` | 7.55 |
| ⌀ 판독 불가 | `#EBEAE8` | `#43474D` | 7.77 | `#2A2D31` | `#C7CBD1` | 8.49 |

### 에이전트 상태 (점 색 ≥3 vs panel, 라벨 글자는 text-sub 사용)

| 상태 | 라이트 | 대비 | 다크 | 대비 |
|---|---|---|---|---|
| 작동 중 | `#2E7D4F` | 5.05 | `#5CC184` | 7.25 |
| 대기 | `#A66A00` | 4.48 | `#E0A63A` | 7.45 |
| 꺼짐 | `#767A82` | 4.31 | `#8A8F97` | 4.97 |

### 2D 장면 (글자 아님. 윤곽선 `ink`를 항상 두르고, 채움은 바닥 대비 ≥3으로 맞춤)

| 요소 | 라이트 | 대비 | 다크 | 대비 |
|---|---|---|---|---|
| 벽 | `#E9E7E2` | 윤곽선으로 구분 | `#25282D` | 윤곽선으로 구분 |
| 바닥 | `#CFCBC3` | 윤곽선으로 구분 | `#30343A` | 윤곽선으로 구분 |
| 트럭 | `#B05000` | 3.25 vs floor | `#F28A3D` | 5.05 vs floor |
| 상자 | `#8F6A38` | 3.03 vs floor | `#B88A52` | 4.05 vs floor |
| 피부 밝은색 | `#E8B896` | 윤곽선으로 구분 | `#E8B896` | 윤곽선으로 구분 |
| 피부 어두운색 | `#8F5632` | 4.79 vs wall | `#B7794F` | 4.13 vs wall |
| 옷 1 | `#2563A8` | 3.79 vs floor | `#5B9BE6` | 4.34 vs floor |
| 옷 2 | `#C2410C` | 3.20 vs floor | `#F28A3D` | 5.05 vs floor |

## 캡처 파일 (1440x900)

| 안 | 라이트 | 다크 | HTML |
|---|---|---|---|
| A 크라프트 | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-A-light.png | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-A-dark.png | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-A.html |
| B 새 집 초록 | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-B-light.png | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-B-dark.png | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-B.html |
| C 이삿날 주황 | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-C-light.png | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-C-dark.png | /tmp/claude-1000/-mnt-c-Users-User-Desktop-----3---AI-Platform-Build-Challenge/cc77c7df-cb0d-4ed6-8837-054ab0cd0f16/scratchpad/b008-palette/palette-C.html |

직접 본 소견: 세 안 모두 레일·KPI·표·칩·SVG 장면이 라이트·다크에서 읽힌다. C 라이트는 트럭을 대비 3 때문에 짙은 주황(#B05000)으로 눌러 "안전 주황" 느낌이 흐려지고 갈색에 가까워진다(다크는 #F28A3D로 선명). A·B 라이트의 트럭(파랑·황토)은 문제 없음. 칩의 △(주황 계열)가 C에서는 브랜드 주황과 겹쳐 기호에 더 의존한다.

## 추천: B안 (새 집 초록 + 웜 중성)

1. 가독성: 초록 브랜드가 ✓ 명시됨 칩과 같은 계열이라 "통과" 의미와 어긋나지 않고, 경고류(△ 주황, ? 노랑)가 브랜드와 섞이지 않아 구분이 가장 명확하다. A는 갈색 브랜드와 ?·△ 칩이 인접 색상, C는 주황 브랜드가 △와 겹친다.
2. 이사 연상: 새 집·입주·안심. 소비자 보호(계약 전 점검) 메시지와 맞는다. A는 상자 연상이 가장 직접적이고, C는 이삿날 현장감이 강하다.
3. TRITON 유사성: 웜 크림 중성 + 어두운 레일 + 좌측 막대 구조는 유지하되 브랜드 색이 황동에서 초록으로 바뀌어 "다른 작품"으로 읽힌다. 가장 가까운 것은 A(황동에 가장 근접).
4. 심사 시연 화면: 초록 면 위에 노란 트럭·붉은 지붕·사람 옷이 대비되어 2D 장면이 돋보이고, 다크에서도 노란 트럭이 선명하다.

차선: 시연에서 이사 상자 연상을 앞세우려면 A. 결정 시 사용자가 정할 부분은 "TRITON과 얼마나 닮게 할지(A) vs 의미 정합성(B)"이다.
