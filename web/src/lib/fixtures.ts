// 가상 사례 — 시연·테스트용 입력. 결과(초안·판정)는 여기 두지 않는다: 실제로 Ollama와 규칙이 만든다.
// (QUOTE_DRAFT는 규칙 단위 테스트의 입력으로만 쓴다)
import type { Conditions, Item, QuoteDraft } from "./types.ts";

export const SAMPLE_QUOTE_TEXT = `[바른용달이사] 견적 안내드립니다 (가상 사례)
이사일: 11월 14일(토) 오전 9시
출발: 관악구 ○○동 3층 → 도착: 금천구 ○○동 5층
차량: 1톤 1대 / 인원 2명
이사 품목: 원룸 짐 일체 (냉장고, 세탁기, 침대(싱글))
총 금액 35만원 (계약금 5만원 입금 시 예약 확정)
※ 현장 상황에 따라 추가 비용이 발생할 수 있음`;

export const SAMPLE_ITEMS: Item[] = [
  { id: "s1", name: "싱글 침대", category: "대형가구", count: 1, move: true },
  { id: "s2", name: "책장", category: "대형가구", count: 1, move: true },
  { id: "s3", name: "책상", category: "대형가구", count: 1, move: true },
  { id: "s4", name: "의자", category: "대형가구", count: 1, move: true },
  { id: "s5", name: "냉장고", category: "가전", count: 1, move: true },
  { id: "s6", name: "세탁기", category: "가전", count: 1, move: true },
  { id: "s7", name: "전자레인지", category: "가전", count: 1, move: true },
  { id: "s8", name: "이삿짐 박스", category: "박스·잡화", count: 6, move: true },
];

export const SAMPLE_CONDITIONS: Conditions = {
  from: { floor: 3, elevator: "없음", parkingFar: "없음" },
  to: { floor: 5, elevator: "있음", parkingFar: "없음" },
  ladderNeeded: "모름",
};

export const SAMPLE_REPLY =
  "안녕하세요 바른용달입니다. 책장이랑 책상 의자 다 포함이에요. 3층 계단은 당일 짐 보고 말씀드릴게요. 짐 많으면 추가 나올 수 있습니다.";

/** 자주 옮기는 짐 — 직접 입력을 빠르게 */
export const COMMON_ITEMS: { name: string; category: Item["category"] }[] = [
  { name: "침대", category: "대형가구" }, { name: "매트리스", category: "대형가구" }, { name: "책장", category: "대형가구" },
  { name: "책상", category: "대형가구" }, { name: "의자", category: "대형가구" }, { name: "옷장", category: "대형가구" },
  { name: "행거", category: "대형가구" }, { name: "소파", category: "대형가구" }, { name: "식탁", category: "대형가구" },
  { name: "냉장고", category: "가전" }, { name: "세탁기", category: "가전" }, { name: "전자레인지", category: "가전" },
  { name: "TV", category: "가전" }, { name: "건조기", category: "가전" }, { name: "이삿짐 박스", category: "박스·잡화" },
];

export const QUOTE_DRAFT: QuoteDraft = {
  company: "바른용달이사",
  totalAmount: 350000,
  deposit: 50000,
  moveDate: "11월 14일(토) 오전 9시",
  truck: "1톤 1대",
  workers: 2,
  ladder: "미기재",
  stairsNote: null,
  listedItems: [
    { name: "냉장고", quote: "냉장고" },
    { name: "세탁기", quote: "세탁기" },
    { name: "침대", quote: "침대(싱글)" },
  ],
  blanketPhrases: ["원룸 짐 일체"],
  extraFeeClauses: ["현장 상황에 따라 추가 비용이 발생할 수 있음"],
  unreadable: [],
};

// 두 번째 가상 견적 — 더 자세히 적었지만 사다리차는 별도. 업체 이름은 지어낸 것으로, 실존 업체와 연결하지 않는다.
export const SAMPLE_QUOTE_TEXT_B = `[가나다이사 · 가상 사례] 원룸 이사 견적
이사일 11월 14일 오전 / 1톤 1대, 작업 인원 2명
운송 품목: 침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
출발지 3층 계단 작업 포함
사다리차 필요 시 별도 7만원
총액 42만원, 계약금 4만원
작업 중 추가 요청은 사전 협의 후 진행`;

export const QUOTE_DRAFT_B: QuoteDraft = {
  company: "가나다이사",
  totalAmount: 420000,
  deposit: 40000,
  moveDate: "11월 14일 오전",
  truck: "1톤 1대",
  workers: 2,
  ladder: "별도",
  stairsNote: "출발지 3층 계단 작업 포함",
  listedItems: ["침대 1개", "책장 1개", "책상 1개", "의자 1개", "냉장고 1대", "세탁기 1대", "전자레인지 1대", "이삿짐 박스 6개"].map((q) => ({ name: q.replace(/\s*\d+\s*(개|대)$/, ""), quote: q })),
  blanketPhrases: [],
  extraFeeClauses: ["작업 중 추가 요청은 사전 협의 후 진행"],
  unreadable: [],
};

/** 견적을 받기 전의 빈 초안 — 이걸로 대조하면 '견적을 받을 때 물을 것'이 나온다 */
export const NO_QUOTE: QuoteDraft = { company: null, totalAmount: null, deposit: null, moveDate: null, truck: null, workers: null, ladder: "미기재", stairsNote: null, listedItems: [], blanketPhrases: [], extraFeeClauses: [], unreadable: [] };
