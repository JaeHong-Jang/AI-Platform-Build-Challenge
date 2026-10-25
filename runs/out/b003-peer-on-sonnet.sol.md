검증 대상 `runs/out/b003-analysis.sonnet.md`만 읽었으며, Sol 분석과 비교하지 않았다. 파일은 수정하지 않았다.

**검증 의견: 1·5번은 조건부 유지, 2·3·4·6번은 차별점 수정 필요.** 특히 상가 서비스의 기존 기능 누락과 청년월세 시연의 예외조건 누락이 확인됐다. 아래 의견은 상호 검증 결과이며 최종 선정 판정은 아니다.

판정에서 **‘확인’은 공개 설명에 해당 기능·수치가 있다는 뜻**이다. 실제 정확도나 서비스 품질을 검증했다는 뜻은 아니다. 공식 페이지의 미언급·접속 실패는 기능 부재로 판정하지 않았다.

**1. 헬스장 해지 환급 증거 정리**

| 주장 | 판정 | 근거 URL | 메모 |
|---|---|---|---|
| 2021~2024년 3분기 피해구제 신청 10,746건 | 확인 | [한국소비자원](https://www.kca.go.kr/home/sub.do?menukey=4005&mode=view&no=1003802911&page=3) | 공식 검색 색인에서 수치·기간 확인. 게시일은 **2024-12-11**이다. 이 자료를 2025년 주의보로 표현하면 잘못이다. |
| 2024년 3,412건으로 전년보다 증가 | 확인 | [원인용 매일경제](https://www.mk.co.kr/news/economy/11317938) | 본문에 2023년 3,165건, 2024년 3,412건 명시. 대학생 비중·증거 정리 실패율은 여전히 unknown. |
| ODR은 피해구제·분쟁 기준·내용증명 작성을 지원한다 | 확인 | [한국소비자원 ODR](https://www.kca.go.kr/odr/) | 표의 관련 ✓는 타당하다. |
| 공공 서비스에서 파일 자동 추출·충돌 타임라인이 확인되지 않았다 | 확인 불가 유지 | [ODR](https://www.kca.go.kr/odr/) | 공개 메뉴에서는 확인되지 않는다. F1·F2의 `?`를 ✗로 바꿀 근거는 없다. |
| 누락된 국내 민간 대안 | 확인 | [헬쓱](https://www.helssg.com/index.html) | 미사용 헬스·PT·필라테스 이용권의 개인 간 양도 플랫폼. 환급 분쟁 분석과는 다르지만, 남은 이용권 비용을 회수하는 대안이다. |
| 누락된 해외 대안 | 부분 확인 | [Resolver 헬스클럽 민원](https://www.resolver.co.uk/service_types/gym-health-clubs-complaints), [첨부자료 안내](https://www.resolver.co.uk/our-code-of-conduct) | 공식 검색 색인에서 헬스클럽 민원과 문서·사진 첨부 기능 확인. 본문 접속은 차단됐다. AI 추출·환급 계산·모순 탐지는 unknown. |
| 하루 MVP와 데이터 확보 | 추정: 가능 | [분쟁 기준 제공 경로](https://www.kca.go.kr/odr/) | 자체 제작 계약서·영수증·대화로 구현 가능하다. 단, 기간형 헬스권과 횟수형 PT를 함께 처리하지 말고 **한 계약 유형·한 계산 시나리오**로 제한해야 한다. 샘플·정답표의 실제 준비 여부는 대상 문서에서 unknown. |

**최종 의견: 유지.** 차별점은 ‘환불 계산’보다 **문서별 날짜·이용 내역의 충돌을 보여 주고 사용자가 기준일을 확정하는 과정**에 둔다. ‘민간 경쟁 없음’은 주장할 수 없다.

**2. 아르바이트 임금 근거표**

| 주장 | 판정 | 근거 URL | 메모 |
|---|---|---|---|
| 2024년 임금체불액 2조 448억 원·피해자 약 28.3만 명 | 확인, 출처 보완 | [노동포털](https://labor.moel.go.kr/arrstat/arrstat_list.do?edScleYear=2024&edToidYear=2024&edYrYear=2024&stScleYear=2022&stToidYear=2020&stYrYear=2020&tabArea=tab04), [피해자 수 보도](https://www.hankyung.com/article/2025021298567) | 노동포털 표에서 20,448억 원 확인. 피해자 283,212명은 별도 보도에서 확인했다. 전국 전체 수치를 대학생 알바의 증거 정리 문제 규모로 해석하면 안 된다. |
| 진정24는 증거 업로드·AI 사실 추출을 제공한다 | 확인 | [진정24](https://jinjung24.com/) | 계약서·명세서·카톡 분석, 추가 질문, 증거목록 포함 진정서 생성까지 명시한다. |
| 우리는 진정24보다 ‘앞 단계’인 사실 정리를 한다 | 부분 반박 | [진정24](https://jinjung24.com/) | 기존 서비스도 추가 질문으로 사실관계를 정리한다. ‘진정서 작성 이전’이라는 위치만으로는 차별성이 성립하지 않는다. 사건별 모순 대조·원문 좌표 연결의 제공 여부는 unknown. |
| 시프티 F1·F2는 구조상 불가하며 자체 기록만 사용한다 | **근거 반박·✗→?** | [시프티](https://shiftee.io/ko) | 공식적으로 출입기록·ERP 연동과 Open API를 제공한다. ‘자체 기록만 사용’은 틀리다. 다만 카톡 OCR·증거 모순 분석이 있다는 뜻도 아니다. |
| 시프티는 근태 기반 급여정산을 제공한다 | 확인 | [시프티](https://shiftee.io/ko) | F3 ✓는 타당하다. 계산 자체는 차별점이 약하다. |
| 누락된 국내 민간 대안 | 확인 | [알바온](https://albaoni.co.kr/) | 출퇴근 기록, 급여·수당 계산, 직원의 급여명세서 확인을 제공한다. 근로자가 확인할 수 있는 급여 도구도 비교해야 한다. |
| 해외 대표 대안 | 확인 | [WorkWise Timesheet 공식 앱](https://play.google.com/store/apps/details?id=gov.dol.doltimesheet_android) | 미국 노동부 앱. 근로시간·휴게시간 기록과 급여 계산 제공. 미국 규칙 기반이므로 한국 수당 계산의 직접 대체재는 아니다. |
| 공공 대안·하루 MVP | 확인 / 추정: 조건부 가능 | [노동포털](https://labor.moel.go.kr/) | 공공 상담·신고 경로는 이미 비교했다. 합성 근무표·카톡·명세서는 자체 제작 가능하다. 하루에는 날짜별 시간 대조와 기본급 차이로 제한하고, 주휴·연장 계산은 적용 조건과 가정 입력을 먼저 구현해야 한다. |

**최종 의견: 차별점 수정 필요.** **‘같은 날짜의 근무표·대화·명세서가 서로 다른 부분을 원문과 나란히 보여 주는 검토 화면’**으로 좁힌다. 진정24와 동일 입력을 처리한 결과 비교 없이는 차별성 점수 3의 근거가 부족하다.

**3. 청년월세 증빙 프리체크**

| 주장 | 판정 | 근거 URL | 메모 |
|---|---|---|---|
| 필수서류 미제출 시 심사 탈락·이의신청 때 추가 제출 불가 | 확인 | [서울주거포털](https://housing.seoul.go.kr/site/main/content/sh01_060513) | 공식 안내에 명시돼 있다. 서류 미비 탈락 건수는 unknown이므로 피해 규모 수치로 확대하면 안 된다. |
| 온통청년은 자가진단만 제공하고 요건별 결과표는 미확인 | 보완 필요 | [온통청년 신청자격진단](https://www.youthcenter.go.kr/myPage/myApplyCheck) | 공식 검색 색인에 적격·부적격·확인 불가·기타와 전체조건 결과표가 명시돼 있다. 다만 문서 내용 대조표와는 구분해야 한다. |
| 마이데이터 방식이므로 업로드 서류 대조 F2는 ✗ | **확인 불가·✗→?** | [온통청년 마이데이터 안내](https://www.youthcenter.go.kr/myPage/myPackage) | 한 데이터 연계 방식이 다른 기능의 부재를 증명하지 않는다. 이미지 대조 기능은 공개 자료에서 확인하지 못했다. |
| 정부24는 자동 제출 구조이므로 업로드 대조 F2는 ✗ | **근거 반박·✗→?** | [행정안전부 공식 보도자료](https://www.mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128488) | 정부24의 다른 민원에는 첨부 서류와 마이데이터를 연계한 검증 절차가 있다. 청년월세 이미지 대조 지원은 unknown이지만, ‘구조상 불가’ 논리는 성립하지 않는다. |
| 시연에서 ‘이체 기간 2개월 부족’을 표시한다 | **조건 누락** | [서울주거포털 제출서류·예외](https://housing.seoul.go.kr/site/main/content/sh01_060513) | 최근 3개월이 원칙이지만 **최근 1개월분만 있으면 1개월 자료 제출**, 차임 지급기일 미도래 시 보증금 잔금 내역 등 예외가 있다. 계약 시작일·납부 상황 확인 없이 부족 판정하면 오탐이다. |
| 누락된 국내 민간 대안 | 확인 | [웰로](https://www.welfarehello.com/) | 개인 맞춤 정책·복지 안내 서비스. 서류 이미지 교차검증 기능은 unknown. 추천·신청 안내와의 비교 대상으로 추가할 수 있다. |
| 해외 대표 대안 | 확인 | [Turn2us Benefits Calculator](https://www.turn2us.org.uk/get-support/information-about-benefits/what-benefits-does-the-benefits-calculator-calculate) | Housing Benefit 등을 포함한 영국 급여 자격·금액 계산 도구. 한국 월세 서류 검토의 직접 경쟁자는 아니며, 자가진단 기능의 비교 사례다. |
| 하루 MVP 데이터가 확보 가능한가 | 추정: 가능 | [서울주거포털](https://housing.seoul.go.kr/site/main/content/sh01_060513) | 공고·필수 항목·예외조건은 공개돼 있다. 합성 계약서·이체증으로 구현 가능하다. 공고 한 버전을 고정하고, 정상·누락·예외 사례를 모두 정답표에 포함해야 한다. |

**최종 의견: 차별점 수정 필요.** **‘업로드 문서의 항목을 공고 조항에 연결하고, 예외조건까지 설명하는 증빙 점검’**으로 수정한다. 세 후보 중 규칙 근거는 구체적이지만, 현재 시연 예시는 그대로 사용하면 안 된다.

**4. 상가 원상회복 기록 연결**

| 주장 | 판정 | 근거 URL | 메모 |
|---|---|---|---|
| 2025년 서울시 수리비·누수 분쟁 52건, 원상회복 24건 | 확인 | [서울시 발표](https://mediahub.seoul.go.kr/archives/2016793) | 2026-01-14 발표가 전년도 실적을 설명한다. 전국 피해 규모나 기록 정리 실패 건수는 아니다. |
| 2024년 원상회복 24건, 2023년 8건 | 확인 | [원인용 아이뉴스24](https://www.inews24.com/view/1810202) | 본문에 두 수치와 3배 증가가 명시돼 있다. 2024·2025년 각각 24건인 점을 구분해야 한다. |
| RentCheck·zInspector는 새 점검보고서를 만드는 서비스다 | **불완전한 설명·반박** | [RentCheck 비교 기능](https://help.getrentcheck.com/en/articles/15636531-side-by-side-inspection-comparison-is-now-even-better), [zInspector 타임라인](https://support.zinspector.com/article/new-timeline-with-media-stream/) | RentCheck는 과거·현재 점검의 사진·메모·답변 비교와 보고서 출력을 제공한다. zInspector는 시설별 과거 사진 검색과 수동 이미지·파일 업로드를 지원한다. |
| 과거 사진을 시설별로 연결하는 것이 차별점이다 | **단독 차별점 반박** | [zInspector 점검 비교](https://support.zinspector.com/article/appcomparison/) | 이전 점검 결과와 시설별 과거 사진을 조회할 수 있다. 단, 제각각인 외부 사진의 AI 자동 연결·한국어 특약 매칭까지 제공하는지는 unknown. |
| 공공 서비스는 현장조사 중심이다 | 보완 필요 | [서울시 발표](https://mediahub.seoul.go.kr/archives/2016793) | 전문상담위원의 **신청서 작성·구비서류 준비를 돕는 조정신청 대행서비스**도 있다. ‘서류 정리 이전 단계가 공백’이라고 일반화하면 안 된다. |
| 누락된 국내 민간 대안 | 확인 | [로시컴 상가 원상복구 상담](https://www.lawsee.com/case_detail?id=202501022173209&source=auction) | 원상복구 특약과 입점 당시 상태를 다루는 전문가 상담 플랫폼. 자동 증거 연결 앱과는 다르지만 직접적인 상담 대안이다. |
| 누락된 해외 대안 | 확인 | [HappyCo Comparison Reports](https://support.happy.co/hc/en-us/articles/4404620723348-Comparison-Reports-iOS) | 과거 입점 점검과 퇴거 점검을 비교하는 보고서 제공. 해외 비교 서비스 범위를 넓혀야 한다. |
| 하루 MVP와 데이터 확보 | 추정: 조건부 가능 | [서울시의 현장 사실확인 절차](https://mediahub.seoul.go.kr/archives/2016793) | 직접 촬영한 공간 사진·자작 특약으로 가능하다. 시설 5개는 사용자가 먼저 지정하고 AI는 후보 연결을 제안하는 수준이 현실적이다. 사진에 안 보인다는 사실만으로 ‘입점 당시 없었음’을 판정하면 안 된다. |

**최종 의견: 차별점 수정 필요.** **‘기존 앱 밖에 흩어진 사진을 가져와 한국 상가 특약·시설 인수 메모의 해당 문장과 연결하고, 근거가 없는 항목을 표시’**하는 데 집중한다. ‘과거 사진 연결’만으로는 차별성 점수를 방어하기 어렵다.

**5. 강의 지시어 화면 연결**

| 주장 | 판정 | 근거 URL | 메모 |
|---|---|---|---|
| 대학 장애학생 지원에 자막·속기·문자통역·화면해설이 포함된다 | 확인 | [장애인고등교육지원센터 사업안내 PDF](https://www.kcue.or.kr/_upload/pds/2024/12/12/application_cb03d61cc734939d604082224c7e9f43.pdf) | PDF 2쪽에 명시. 지시어 이해 실패의 빈도나 손실을 측정한 자료는 아니다. 해당 심각도는 unknown 유지가 맞다. |
| 소보로·Tkita의 자막 기능 ✓ | 확인 | [소보로 공식 앱 설명](https://apps.apple.com/kr/app/id6504184352), [TkitaCaption](https://www.tkita.ai/ko/product/caption) | 실시간 자막·음성 기록 제공 확인. 화면 지시 대상 자동 연결은 unknown. |
| Genio는 슬라이드 삽입 정도만 확인됐다 | 보완 필요 | [Genio Notes](https://genio.co/notes) | 현재 공식 설명에는 슬라이드·이미지 OCR, 영상 녹화·재생, 슬라이드 주석 등도 있다. 수식·도표의 의미적 레이아웃 이해와 지시어 자동 연결은 여전히 unknown. |
| 기존 서비스는 음성을 문자로 옮기는 단계까지다 | **일반화 반박** | [Otter 교육용 기능](https://otter.ai/education), [자동 슬라이드 캡처](https://help.otter.ai/hc/en-us/articles/5093321813911-Automated-Slide-Capture-Overview) | 누락된 해외 대안 Otter는 강의 화면·슬라이드를 자동 캡처해 기록에 넣는다. 다만 포인터 추적·지시어 대상 영역 강조까지 확인된 것은 아니다. |
| 누락된 국내 민간·공공 대안 | 확인 | [다글로 공식 안내](https://daglo.ai/d/ko/guide/billing/credits), [공공 지원사업](https://www.kcue.or.kr/_upload/pds/2024/12/12/application_cb03d61cc734939d604082224c7e9f43.pdf) | 다글로는 음성·영상 받아쓰기와 요약 등을 제공한다. 공공 지원에는 화면해설 전문인력도 포함되므로 자막 앱만 비교하면 대체 수단을 좁게 본다. |
| Qwen2.5-VL이 구현 가능성을 뒷받침한다 | 확인하되 범위 제한 | [Qwen2.5-VL Technical Report — arXiv:2502.13923](https://arxiv.org/abs/2502.13923) | 문서 해석·객체 위치 지정·영상 이해는 근거가 있다. 한국어 수학 강의 지시어 연결 정확도·실시간 속도는 입증하지 않는다. |
| 하루 MVP와 데이터 확보 | 추정: 축소 시 가능 | [기술 근거](https://arxiv.org/abs/2502.13923) | 자작 영상·정답 영역은 직접 만들 수 있다. 고정 영상·미리 구획한 후보 영역·준비된 타임스탬프로 제한해야 한다. 실시간 음성인식·포인터 추적·수식 해석을 동시에 구현한다는 계획은 위험하다. |

**최종 의견: 유지.** 차별점은 **‘슬라이드와 자막의 동시 제공’이 아니라 ‘지시어가 가리킨 세부 영역의 후보 제시·불명 처리·사용자 수정’**이다. 하루에는 비실시간 복습 도구로 제한한다. 청각장애 학생에게 효과가 있다는 주장은 당사자 검증 전까지 가설이다.

**6. 이주노동자 작업 지시 이해 확인**

| 주장 | 판정 | 근거 URL | 메모 |
|---|---|---|---|
| 2024년 외국인 취업자 101만 명, 전년 대비 8.7만 명 증가 | 확인 | [통계청 공식 브리핑](https://www.korea.kr/briefing/policyBriefingView.do?newsId=156666055) | 정확히는 **2024년 5월 기준**이다. 전체 취업자 규모이며 언어로 인한 사고·이해 실패 규모는 아니다. |
| Papago·Google Translate 이미지 번역 ✓ | 확인 | [Papago](https://help.naver.com/service/16448/contents/5911?lang=ko&osType=MOBILE), [Google Translate](https://support.google.com/translate/answer/6142483?hl=ko) | 번역 기능은 확인된다. 자유 재설명 비교 기능의 부재까지 증명하지는 않는다. |
| 안전지키미는 다국어 번역·TBM 공유를 제공한다 | 확인, 숫자는 보류 | [개발사 공식 앱 설명](https://play.google.com/store/apps/details?hl=ko&id=com.clab.safety4worker) | Google AI 다국어 번역·TBM 공유·안전교육은 명시. **11개 로케일은 이번 공식 설명에서 확인하지 못했으므로 unknown.** |
| 자이보이스 등은 번역 도구이므로 F3·F4가 구조상 ✗ | **확인 불가·✗→?** | [대상 문서 인용 보도](https://www.heraldk.com/article/2026011118141404446), [GS건설 공식 사이트](https://www.gsenc.com/) | 해당 기능의 부재를 확인하는 공식 문서를 확보하지 못했다. 번역 중심이라는 설명만으로 확인 질문·재설명 기능 불가능을 도출할 수 없다. |
| 번역 뒤 이해 확인이 기존 공공 절차의 빈 곳이다 | **반박** | [안전보건공단 TBM 활동 가이드 PDF](https://oshri.kosha.or.kr/kosha/intro/goyangPajuBranch_A.do?articleNo=453106&attachNo=259089&mode=download) | PDF 3쪽은 작업자의 위험요인·대책 숙지 확인과 외국인 통·번역 방안을 명시한다. 이해 확인 자체는 기존 절차다. |
| 누락된 국내 민간 대안 | 확인 | [TkitaCaption](https://www.tkita.ai/ko/product/caption) | 여러 기기에서 원하는 언어로 실시간 자막을 공유한다. 안전 특화 여부는 unknown이지만 현장 지시 전달의 범용 대안이다. |
| 누락된 해외 대안 | 부분 확인 | [SafetyCulture Training 번역](https://training.safetyculture.com/ai-translation/), [퀴즈](https://training.safetyculture.com/quiz/) | 공식 검색 색인에서 교육 번역·퀴즈 기반 이해 확인을 확인했다. 일부 본문은 접속 제한. 자유 발화 재설명의 조건별 비교까지 지원하는지는 unknown. |
| 하루 MVP와 데이터 확보 | 추정: 텍스트형은 가능 | [공개 TBM 가이드](https://oshri.kosha.or.kr/kosha/intro/goyangPajuBranch_A.do?articleNo=453106&attachNo=259089&mode=download) | 공개 안전 절차를 참고해 지시문·정답조건을 자체 제작할 수 있다. 단, 대상 언어의 원어민 검수자·현장 검수자 확보는 unknown. 음성까지 넣기보다 문장 입력으로 제한하는 편이 현실적이다. |

**최종 의견: 차별점 수정 필요.** **‘관리자가 확정한 안전조건과 작업자의 모국어 재설명을 조건별로 대조하고, 누락된 조건을 근거 문장과 보여 주는 기록 도구’**로 좁힌다. AI가 모호한 지시에서 빠진 안전조건을 임의로 채워 넣어서는 안 된다.

**가장 위험한 주장 3개**

1. **“RentCheck·zInspector는 새 보고서를 만들고, 우리는 과거 사진을 연결한다.”**  
   기존 서비스에도 과거 점검 비교·시설별 사진 조회·수동 파일 업로드가 있다. 핵심 차별점 설명을 직접 약화하는 누락이다. [RentCheck](https://help.getrentcheck.com/en/articles/15636531-side-by-side-inspection-comparison-is-now-even-better), [zInspector](https://support.zinspector.com/article/new-timeline-with-media-stream/)

2. **“청년월세 이체증이 1개월분이면 2개월 부족이다.”**  
   공식 안내에 1개월분 제출 등 예외가 있다. 예외 확인 없는 시연은 정상 신청자를 잘못 경고하는 사례가 된다. [서울주거포털](https://housing.seoul.go.kr/site/main/content/sh01_060513)

3. **“시프티는 자체 기록만 쓰므로 외부 증거 처리가 구조상 불가능하다.”**  
   공식 외부 연동·Open API 설명과 충돌한다. 카톡 OCR·모순 분석 여부는 **unknown**이며, 해당 ✗ 두 칸은 ?로 수정해야 한다. [시프티](https://shiftee.io/ko)