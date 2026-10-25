# 공통 컨텍스트 (모든 팀원 프롬프트 앞에 붙는다)

오늘은 2026-10-24이다. 우리는 "AI Platform Build Challenge" 예선 기획서를 준비하는 1~3인 대학생 팀이다.
- 주최: 서울특별시, 관악구, 금천청년꿈터, 서울대학교 앵커사업단 / 운영: 데이콘(DACON)
- 예선: AI 서비스·플랫폼 기획서 PDF 제출 (마감 2026-10-25 23:59). 평가 기준은 미공개.
- 본선: 11/02~11/25 온라인 교육, 11/26 오프라인 멘토링, **11/27 09:00~18:00 하루 해커톤에서 실제로 동작하는 AI 서비스를 구현·시연**.
- 기획서 권장 항목: 문제와 주요 사용자 / 핵심 기능·이용 흐름 / AI 적용 방식·활용 데이터·기술 구성 / 구현 계획·역할 분담·기대 효과 / 외부 자료·오픈소스·AI 도구 출처.
- 개인정보·권한 없는 데이터는 쓰면 안 되고, 외부 데이터는 출처·접근 방법·이용 조건을 밝혀야 한다.

## 공통 규칙
- 사실(통계·논문·데이터셋·API·경쟁 서비스)은 반드시 URL/DOI/arXiv ID와 함께 제시한다. 확인하지 못한 값은 "unknown"이라고 쓴다. 지어내지 않는다.
- 추정과 사실을 구분해 표시한다 ("추정:" 접두어).
- 한국어로 답한다. 고유명사·논문 제목은 원문 유지.
- 파일을 수정하지 말고 최종 답변만 출력한다.

# 과제 B009 · 분석 (당신: sol) — 이사 지킴이 '처음 보는' 평가셋(홀드아웃) 작성
심사위원 지적: 지금 평가셋(`web/eval/dataset.ts`)은 Sonnet이 만들고 실패를 본 뒤 코드를 고쳐 다시 쟀으므로 튜닝셋이다. 그래서 **다른 작성자(당신)**가 새 평가셋을 만든다. 공정성을 위해 다음 파일은 **열지 마라**: `web/eval/dataset.ts`, `web/eval/run.mts`, `web/eval/REPORT*.md`, `web/eval/results*.json`, `web/src/lib/{rules,verify,plain,proposals,agent,intake}.ts`(판정 코드). 읽어도 되는 것: `web/eval/README.md`(라벨 기준), `web/src/lib/types.ts`(QuoteDraft·Item·Conditions 타입), `web/src/lib/fixtures.ts`(SAMPLE_ITEMS·SAMPLE_CONDITIONS), `wiki/sources/kca2026-소규모이사-피해.md`, `runs/out/b008-data.sol.md`(표준약관).

만들 것: 견적 20건 + 업체 답변 20건. 현실적인 한국어 소규모 이사 견적 문자·카톡·앱 문구(줄바꿈, 이모티콘, 축약, 오타 약간, 띄어쓰기 섞임). 상호는 모두 '가상○○익스프레스/용달/이사' 같은 지어낸 이름(실존 업체명 금지). 기존 셋과 겹치지 않게 다양하게: 투룸·쓰리룸, 냉장고 양문형, 에어컨 이전설치, 피아노·안마의자 같은 특수품, '포장이사/반포장/일반', 보관이사, 엘베 사용료, 주차 어려움, 오후 할증, 주말 할증, '견적 외 물품 추가 시 별도', 금액 표기(380,000원 / 38만 / 삼십팔만), 계약금 비율 다양, 일부는 아주 깔끔한 견적(모두 명시). 답변 20건: 명시적 포함 / 조건부 / 제외·별도 / 금액 제시 / 무관 / 얼버무림 / 되묻기 섞기.

라벨 규칙(README 요지): 카드 id는 `item-<대표이름>`(대표이름: 침대·매트리스·책장·책상·식탁·의자·옷장·행거·냉장고·세탁기·전자레인지·소파·텔레비전·모니터·건조기·에어컨·박스·티비선반, 그 외는 이름 그대로 공백 제거·소문자), `stairs-from`/`stairs-to`(2층 이상 또는 지하이고 엘리베이터 없음/모름일 때만 생김), `ladder`(3층 이상·엘베 없음/모름이거나 사다리 언급 시), `carry-from`/`carry-to`(주차 멂=있음일 때), `truck`, `workers`, `fee`(추가비 문구 카드 전부 묶음 — 문구가 없어도 '추가 비용 조건 없음' 카드가 생겨 확인 필요), `total`(총액을 읽을 수 없을 때). explicit = 원문만으로 조건 없이 포함이 분명한 카드, need = 그 외(미기재·뭉뚱그림·협의·별도·당일 결정·수량 불일치 등). 박스·잡화류는 `item-박스` 하나.

출력 형식: 마크다운 문서 안에 **하나의 ```ts 코드 블록**으로 `web/eval/holdout.ts` 전체를 써라. 머리에:
```
import { SAMPLE_CONDITIONS, SAMPLE_ITEMS } from "../src/lib/fixtures.ts";
import type { Conditions, Item, QuoteDraft } from "../src/lib/types.ts";
import type { QuoteCase, ReplyCase } from "./dataset.ts";
export const QUOTES: QuoteCase[] = [...];
export const REPLIES: ReplyCase[] = [...];
```
QuoteCase = { id: "H01"…, trait, text, items: Item[], cond: Conditions, gold: QuoteDraft(원문에서 사람이 읽은 값 — totalAmount·deposit 원 단위 정수, workers, truck 원문, ladder "포함"|"별도"|"미기재", stairsNote 원문|null, listedItems [{name, quote(원문 그대로)}], blanketPhrases, extraFeeClauses(원문 그대로), unreadable: [], company, moveDate), explicit: string[], need: string[] }. ReplyCase = { id: "HR01"…, quoteId: "H.."(대응 견적), type: "명시적 포함"|"조건부"|"제외·별도"|"금액 제시"|"무관"|"얼버무림", text, allowed: string[](이 답변으로 '명시됨'으로 바꿔도 되는 카드 id) }. items는 각 견적마다 사용자가 실제로 옮길 짐(Item: {id, name, category: "대형가구"|"가전"|"박스·잡화", count, move: true}), cond는 출발·도착 층/엘베/주차. TS 문법 오류가 없게. 코드 블록 뒤에 라벨을 정한 근거 요약 10줄.
