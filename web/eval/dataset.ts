// 합성 평가셋 — 견적서 20건 + 업체 답변 20건. 상호는 모두 '가상○○이사'. 라벨 기준은 README.md.
// 정답 라벨은 compare() 결과를 보고 만든 것이 아니라 견적 문장·표준약관 취지를 보고 손으로 정했다(사람 검수 전).
import { SAMPLE_CONDITIONS, SAMPLE_ITEMS } from "../src/lib/fixtures.ts";
import type { Conditions, Item, QuoteDraft } from "../src/lib/types.ts";

const it = (id: string, name: string, category: Item["category"], count: number | null): Item => ({ id, name, category, count, move: true });
const D = SAMPLE_ITEMS;
const V1: Item[] = D.map((i) => (i.id === "s2" ? { ...i, count: 2 } : i.id === "s8" ? { ...i, count: 10 } : i));
const V2: Item[] = [it("a1", "싱글 침대", "대형가구", 1), it("a2", "책상", "대형가구", 1), it("a3", "냉장고", "가전", 1), it("a4", "세탁기", "가전", 1), it("a5", "이삿짐 박스", "박스·잡화", 4)];
const V3: Item[] = [it("b1", "침대", "대형가구", 1), it("b2", "책상", "대형가구", 1), it("b3", "의자", "대형가구", 1), it("b4", "소파", "대형가구", 1), it("b5", "냉장고", "가전", 1), it("b6", "세탁기", "가전", 1), it("b7", "이삿짐 박스", "박스·잡화", 5)];
const V4: Item[] = [it("c1", "침대", "대형가구", 1), it("c2", "옷장", "대형가구", 1), it("c3", "행거", "대형가구", 1), it("c4", "소파", "대형가구", 1), it("c5", "식탁", "대형가구", 1), it("c6", "TV", "가전", 1), it("c7", "냉장고", "가전", 1), it("c8", "세탁기", "가전", 1), it("c9", "건조기", "가전", 1), it("c10", "이삿짐 박스", "박스·잡화", 20)];

const C0: Conditions = SAMPLE_CONDITIONS;
const C1: Conditions = { from: { floor: 1, elevator: "없음", parkingFar: "없음" }, to: { floor: 2, elevator: "없음", parkingFar: "없음" }, ladderNeeded: "모름" };
const C2: Conditions = { from: { floor: 4, elevator: "있음", parkingFar: "없음" }, to: { floor: 1, elevator: "없음", parkingFar: "없음" }, ladderNeeded: "모름" };
const C3: Conditions = { from: { floor: 2, elevator: "없음", parkingFar: "있음" }, to: { floor: 3, elevator: "없음", parkingFar: "없음" }, ladderNeeded: "모름" };

const li = (q: string, name?: string) => ({ name: name ?? q.replace(/\s*\d+\s*(개|대)$/, ""), quote: q });
const G = (p: Partial<QuoteDraft>): QuoteDraft => ({ company: null, totalAmount: null, deposit: null, moveDate: null, truck: null, workers: null, ladder: "미기재", stairsNote: null, listedItems: [], blanketPhrases: [], extraFeeClauses: [], unreadable: [], ...p });
const D8 = ["침대 1개", "책장 1개", "책상 1개", "의자 1개", "냉장고 1대", "세탁기 1대", "전자레인지 1대", "이삿짐 박스 6개"].map((q) => li(q));
const I7 = ["item-침대", "item-책장", "item-책상", "item-의자", "item-냉장고", "item-세탁기", "item-전자레인지"];
const BOX = "item-박스";
const without = (a: string[], ...x: string[]) => a.filter((v) => !x.includes(v));

export interface QuoteCase {
  id: string; trait: string; text: string; items: Item[]; cond: Conditions;
  gold: QuoteDraft; // 정답 초안(원문에서 사람이 읽은 값)
  explicit: string[]; // 정답: 원문만으로 '명시됨'이어야 하는 카드 id
  need: string[]; // 정답: 확인 필요(그 외 3종 묶음)여야 하는 카드 id. 추가비 카드는 'fee', 총액 판독불가 카드는 'total'로 묶는다
}

export const QUOTES: QuoteCase[] = [
  { id: "Q01", trait: "품목 전부 명시 + 계단·사다리 포함", items: D, cond: C0,
    text: `[가상한빛이사] 원룸 이사 견적
이사일 11월 8일(일) 오전 9시
차량 1톤 1대 / 작업 인원 2명
운송 품목: 침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
출발지 3층 계단 작업 포함
사다리차 포함
총액 38만원, 계약금 4만원`,
    gold: G({ company: "가상한빛이사", totalAmount: 380000, deposit: 40000, moveDate: "11월 8일(일) 오전 9시", truck: "1톤 1대", workers: 2, ladder: "포함", stairsNote: "출발지 3층 계단 작업 포함", listedItems: D8 }),
    explicit: [...I7, BOX, "truck", "workers", "stairs-from", "ladder"], need: ["fee"] },
  { id: "Q02", trait: "'짐 일체' 뭉뚱그림 + '2분' 인원 표기", items: D, cond: C0,
    text: `[가상푸른이사] 안녕하세요 견적 드립니다~
11/15 토요일 오후 / 1톤 트럭 1대
인원 2분 가시고요
원룸 짐 일체 이사 총 33만원입니다
계약금 3만원 먼저 넣어주시면 예약돼요`,
    gold: G({ company: "가상푸른이사", totalAmount: 330000, deposit: 30000, moveDate: "11/15 토요일 오후", truck: "1톤 트럭 1대", workers: 2, blanketPhrases: ["원룸 짐 일체"] }),
    explicit: ["truck", "workers"], need: [...I7, BOX, "stairs-from", "ladder", "fee"] },
  { id: "Q03", trait: "품목에 '협의 후 결정' + 쉼표 금액(360,000원)", items: D, cond: C0,
    text: `[가상다온이사] 이사 견적서
일정 12월 3일 오전 10시 / 1톤 1대 / 작업자 2명
- 침대 1개
- 책장 1개 (분해는 협의 후 결정)
- 책상 1개
- 의자 1개
- 냉장고 1대
- 세탁기 1대
- 전자레인지 1대
- 이삿짐 박스 6개
총액 360,000원 (계약금 36,000원)`,
    gold: G({ company: "가상다온이사", totalAmount: 360000, deposit: 36000, moveDate: "12월 3일 오전 10시", truck: "1톤 1대", workers: 2, listedItems: D8 }),
    explicit: [...without(I7, "item-책장"), BOX, "truck", "workers"], need: ["item-책장", "stairs-from", "ladder", "fee"] },
  { id: "Q04", trait: "박스 '별도 5만원'", items: D, cond: C0,
    text: `[가상새벽이사] 견적 안내
이사일: 11월 21일 오전 8시 / 차량: 1톤 1대 / 인원: 2명
품목: 침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대
이삿짐 박스 6개는 별도 5만원
총액 31만원, 계약금 3만원`,
    gold: G({ company: "가상새벽이사", totalAmount: 310000, deposit: 30000, moveDate: "11월 21일 오전 8시", truck: "1톤 1대", workers: 2, listedItems: [...D8.slice(0, 7), li("이삿짐 박스 6개는 별도 5만원", "이삿짐 박스")] }),
    explicit: [...I7, "truck", "workers"], need: [BOX, "stairs-from", "ladder", "fee"] },
  { id: "Q05", trait: "수량 불일치(책장 2개인데 1개만 적음) + 만·천 표기", items: V1, cond: C0,
    text: `[가상미소이사] 견적서
11월 22일 오후 2시, 1톤 1대, 작업자 2명
침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
총액 34만원 / 계약금 3만4천원
출발지 3층 계단 작업 포함
사다리차 포함`,
    gold: G({ company: "가상미소이사", totalAmount: 340000, deposit: 34000, moveDate: "11월 22일 오후 2시", truck: "1톤 1대", workers: 2, ladder: "포함", stairsNote: "출발지 3층 계단 작업 포함", listedItems: D8 }),
    explicit: [...without(I7, "item-책장"), "truck", "workers", "stairs-from", "ladder"], need: ["item-책장", BOX, "fee"] },
  { id: "Q06", trait: "총액·계약금이 한 문장 + 계단 추가금 + 사다리 별도", items: D, cond: C0,
    text: `[가상소나무이사] 원룸 이사 견적 (카톡)
날짜 11/28 오전
1톤 1대 작업자 2명
침대 책장 책상 의자 냉장고 세탁기 전자레인지 박스까지 다 싣습니다
계단 작업 있으면 층당 추가금 있어요
사다리차 필요 시 별도 7만원
총액 36만원 계약금 4만원`,
    gold: G({ company: "가상소나무이사", totalAmount: 360000, deposit: 40000, moveDate: "11/28 오전", truck: "1톤 1대", workers: 2, ladder: "별도", stairsNote: "계단 작업 있으면 층당 추가금 있어요", listedItems: ["침대", "책장", "책상", "의자", "냉장고", "세탁기", "전자레인지", "박스"].map((q) => li(q)), extraFeeClauses: ["계단 작업 있으면 층당 추가금 있어요"] }),
    explicit: [...I7, BOX, "truck", "workers"], need: ["stairs-from", "ladder", "fee"] },
  { id: "Q07", trait: "'1인 가구' 함정 + 총액·계약금·잔금 한 문장", items: D, cond: C0,
    text: `[가상별빛이사] 1인 가구 원룸 이사 전문입니다^^
11월 29일 토 오전 9시 / 1톤 1대 / 기사님 포함 2명
침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 박스 6개
총액은 40만원이고 그 중 계약금 5만원, 잔금 35만원 당일 결제`,
    gold: G({ company: "가상별빛이사", totalAmount: 400000, deposit: 50000, moveDate: "11월 29일 토 오전 9시", truck: "1톤 1대", workers: 2, listedItems: [...D8.slice(0, 7), li("박스 6개")] }),
    explicit: [...I7, BOX, "truck", "workers"], need: ["stairs-from", "ladder", "fee"] },
  { id: "Q08", trait: "소규모(짐 5종) + 도착지 2층 계단 포함 + 추가비 문구", items: V2, cond: C1,
    text: `[가상초록이사] 소형이사 견적
12월 5일(토) 오후 1시
1톤 1대, 작업자 2명
싱글침대 1, 냉장고 1, 세탁기 1, 책상 1, 박스 4개
도착지 2층 계단 작업 포함
총 25만원 / 계약금 2만5천원
현장에서 짐이 늘어나면 추가 비용이 발생합니다`,
    gold: G({ company: "가상초록이사", totalAmount: 250000, deposit: 25000, moveDate: "12월 5일(토) 오후 1시", truck: "1톤 1대", workers: 2, stairsNote: "도착지 2층 계단 작업 포함", listedItems: [li("싱글침대 1", "싱글침대"), li("냉장고 1", "냉장고"), li("세탁기 1", "세탁기"), li("책상 1", "책상"), li("박스 4개")], extraFeeClauses: ["현장에서 짐이 늘어나면 추가 비용이 발생합니다"] }),
    explicit: ["item-침대", "item-책상", "item-냉장고", "item-세탁기", BOX, "truck", "workers", "stairs-to"], need: ["fee"] },
  { id: "Q09", trait: "사다리차 '필요하면 별도 협의' + 사전협의 추가요청", items: D, cond: C0,
    text: `[가상바람결이사] 원룸 이사 견적
이사일 12월 1일 오전 / 1톤 1대, 작업 인원 2명
운송 품목: 침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
출발지 3층 계단 작업 포함
사다리차는 필요하면 현장에서 별도 협의
총액 39만원, 계약금 4만원
작업 중 추가 요청은 사전 협의 후 진행`,
    gold: G({ company: "가상바람결이사", totalAmount: 390000, deposit: 40000, moveDate: "12월 1일 오전", truck: "1톤 1대", workers: 2, ladder: "별도", stairsNote: "출발지 3층 계단 작업 포함", listedItems: D8, extraFeeClauses: ["작업 중 추가 요청은 사전 협의 후 진행"] }),
    explicit: [...I7, BOX, "truck", "workers", "stairs-from"], need: ["ladder", "fee"] },
  { id: "Q10", trait: "총액 미기재('통화로') + 일부 품목만 확실", items: D, cond: C0,
    text: `[가상노을이사] 이사 견적 문자
11월 30일 아침 8시 출발
1톤 1대 / 작업 2명
품목은 원룸 짐 전부이고 냉장고 세탁기는 확실히 갑니다
금액은 통화로 말씀드릴게요 계약금 3만원만 보내주세요`,
    gold: G({ company: "가상노을이사", totalAmount: null, deposit: 30000, moveDate: "11월 30일 아침 8시", truck: "1톤 1대", workers: 2, blanketPhrases: ["원룸 짐 전부"], listedItems: [li("냉장고"), li("세탁기")], unreadable: ["총액"] }),
    explicit: ["item-냉장고", "item-세탁기", "truck", "workers"], need: ["item-책장", "item-책상", "item-의자", "item-전자레인지", BOX, "stairs-from", "ladder", "fee", "total"] },
  { id: "Q11", trait: "계약금 50%(비율 이상) + 한 줄 나열 '모두 포함'", items: D, cond: C0,
    text: `[가상은하이사] 견적
11월 16일 / 1톤 1대 / 2명
침대, 책장, 책상, 의자, 냉장고, 세탁기, 전자레인지, 박스 모두 포함
총액 30만원
계약금 15만원 (총액의 50%)
출발지 3층이라 계단 작업 포함입니다`,
    gold: G({ company: "가상은하이사", totalAmount: 300000, deposit: 150000, moveDate: "11월 16일", truck: "1톤 1대", workers: 2, stairsNote: "출발지 3층이라 계단 작업 포함입니다", listedItems: ["침대", "책장", "책상", "의자", "냉장고", "세탁기", "전자레인지", "박스"].map((q) => li(q)) }),
    explicit: [...I7, BOX, "truck", "workers", "stairs-from"], need: ["ladder", "fee"] },
  { id: "Q12", trait: "'1인 가구'·'2인용 소파' 숫자 함정", items: V3, cond: C0,
    text: `[가상달빛이사] 1인 가구 전문 이사
12월 6일 오전 / 1톤 1대 / 작업자 2명
침대 1개, 책상 1개, 의자 1개, 2인용 소파 1개, 냉장고 1대, 세탁기 1대
박스 5개
총액 28만원 / 계약금 3만원`,
    gold: G({ company: "가상달빛이사", totalAmount: 280000, deposit: 30000, moveDate: "12월 6일 오전", truck: "1톤 1대", workers: 2, listedItems: [li("침대 1개"), li("책상 1개"), li("의자 1개"), li("2인용 소파 1개", "2인용 소파"), li("냉장고 1대"), li("세탁기 1대"), li("박스 5개")] }),
    explicit: ["item-침대", "item-책상", "item-의자", "item-소파", "item-냉장고", "item-세탁기", BOX, "truck", "workers"], need: ["stairs-from", "ladder", "fee"] },
  { id: "Q13", trait: "책장은 '당일 짐 보고 결정'(별도 문장) + 계단·사다리 포함", items: D, cond: C0,
    text: `[가상바다이사] 견적서
11월 22일 오전 9시 / 1톤 1대 / 인원 2명
침대 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 박스 6개
책장은 당일 짐 보고 결정
총액 33만원 / 계약금 3만원
출발지 3층 계단 작업 포함
사다리차 포함`,
    gold: G({ company: "가상바다이사", totalAmount: 330000, deposit: 30000, moveDate: "11월 22일 오전 9시", truck: "1톤 1대", workers: 2, ladder: "포함", stairsNote: "출발지 3층 계단 작업 포함", listedItems: ["침대 1개", "책상 1개", "의자 1개", "냉장고 1대", "세탁기 1대", "전자레인지 1대", "박스 6개"].map((q) => li(q)) }),
    explicit: [...without(I7, "item-책장"), BOX, "truck", "workers", "stairs-from", "ladder"], need: ["item-책장", "fee"] },
  { id: "Q14", trait: "책장·책상 '분해 시 별도 협의'가 품목 줄과 다른 줄에 있음(교차 문장 함정)", items: D, cond: C0,
    text: `[가상구름이사] 이사 견적
11월 23일 오후 / 1톤 1대 / 2명
품목: 침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
※ 책장과 책상은 분해·조립이 필요하면 별도 비용 협의
총액 35만원 / 계약금 5만원`,
    gold: G({ company: "가상구름이사", totalAmount: 350000, deposit: 50000, moveDate: "11월 23일 오후", truck: "1톤 1대", workers: 2, listedItems: D8, extraFeeClauses: ["책장과 책상은 분해·조립이 필요하면 별도 비용 협의"] }),
    explicit: [...without(I7, "item-책장", "item-책상"), BOX, "truck", "workers"], need: ["item-책장", "item-책상", "stairs-from", "ladder", "fee"] },
  { id: "Q15", trait: "3가지 품목만 언급, 나머지 침묵", items: D, cond: C0,
    text: `[가상모래이사] 견적 드립니다
12/2 수요일 오전 / 1톤 1대 / 인원 2명
냉장고, 세탁기, 침대 이동 가능합니다
총액 30만원 / 계약금 3만원`,
    gold: G({ company: "가상모래이사", totalAmount: 300000, deposit: 30000, moveDate: "12/2 수요일 오전", truck: "1톤 1대", workers: 2, listedItems: [li("냉장고"), li("세탁기"), li("침대")] }),
    explicit: ["item-침대", "item-냉장고", "item-세탁기", "truck", "workers"], need: ["item-책장", "item-책상", "item-의자", "item-전자레인지", BOX, "stairs-from", "ladder", "fee"] },
  { id: "Q16", trait: "엘리베이터 건물 — 사다리·계단 카드가 생기지 않는 조건", items: D, cond: C2,
    text: `[가상물결이사] 이사 견적서
이사일 11월 25일 오전 10시 / 1톤 1대 / 작업자 2명
운송 품목 침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
엘리베이터 사용 가능 건물이라 사다리차 없이 진행
총액 35만원 / 계약금 5만원`,
    gold: G({ company: "가상물결이사", totalAmount: 350000, deposit: 50000, moveDate: "11월 25일 오전 10시", truck: "1톤 1대", workers: 2, listedItems: D8 }),
    explicit: [...I7, BOX, "truck", "workers"], need: ["fee"] },
  { id: "Q17", trait: "'당일 추가 비용 없음' 명시(과잉 질문 측정) + 짧은 계단 문구", items: D, cond: C0,
    text: `[가상햇살이사] 견적 안내
11월 19일 오전 / 1톤 1대 / 2명
침대 1개, 책장 1개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 이삿짐 박스 6개
3층 계단 작업 비용 포함
총액 37만원 / 계약금 5만원
당일 추가 비용 없음 (견적 금액 그대로)`,
    gold: G({ company: "가상햇살이사", totalAmount: 370000, deposit: 50000, moveDate: "11월 19일 오전", truck: "1톤 1대", workers: 2, stairsNote: "3층 계단 작업 비용 포함", listedItems: D8 }),
    explicit: [...I7, BOX, "truck", "workers", "stairs-from", "fee"], need: ["ladder"] },
  { id: "Q18", trait: "투룸 · 큰 짐 9종 · 박스 15개 이내(실제 20개) · 양쪽 계단 · 운반거리", items: V4, cond: C3,
    text: `[가상나래이사] 투룸 이사 견적
11월 28일 오전 8시 / 2.5톤 1대 / 작업 인원 3명
침대, 옷장, 행거, 소파, 식탁, TV, 냉장고, 세탁기, 건조기 운송
박스는 15개 이내 포함, 초과 시 개당 3천원
총액 70만원 / 계약금 7만원
출발지 2층·도착지 3층 계단 작업 포함
사다리차 필요하면 비용 별도`,
    gold: G({ company: "가상나래이사", totalAmount: 700000, deposit: 70000, moveDate: "11월 28일 오전 8시", truck: "2.5톤 1대", workers: 3, ladder: "별도", stairsNote: "출발지 2층·도착지 3층 계단 작업 포함", listedItems: [...["침대", "옷장", "행거", "소파", "식탁", "TV", "냉장고", "세탁기", "건조기"].map((q) => li(q)), li("박스는 15개 이내 포함, 초과 시 개당 3천원", "박스")], extraFeeClauses: ["박스는 15개 이내 포함, 초과 시 개당 3천원"] }),
    explicit: ["item-침대", "item-옷장", "item-행거", "item-소파", "item-식탁", "item-텔레비전", "item-냉장고", "item-세탁기", "item-건조기", "truck", "workers", "stairs-from", "stairs-to"], need: [BOX, "ladder", "carry-from", "fee"] },
  { id: "Q19", trait: "정보 없는 인사말 견적 — 값 채움 유도(총액·인원·차량 전부 없음)", items: D, cond: C0,
    text: `[가상구슬이사] 견적 문의 주셔서 감사합니다 ^^
날짜는 11월 27일 쯤 가능하고요
저희가 원룸 이사 많이 해봐서 걱정 안 하셔도 됩니다
자세한 건 방문 견적 후 안내드릴게요`,
    gold: G({ company: "가상구슬이사", unreadable: ["총액"] }),
    explicit: [], need: [...I7, BOX, "truck", "workers", "total", "stairs-from", "ladder", "fee"] },
  { id: "Q20", trait: "박스 수량 부족(6개 vs 실제 10개) + '1인 가구'·'2인' + 계단 층별 추가요금", items: V1, cond: C0,
    text: `[가상바람이사] 이사 견적서
이사일 12월 12일 오전 / 1톤 1대 / 작업 2인
침대 1개, 책장 2개, 책상 1개, 의자 1개, 냉장고 1대, 세탁기 1대, 전자레인지 1대, 박스 6개
1인 가구 기준 가격입니다
총액 32만원 / 계약금 3만원
출발지 3층 계단 작업은 층별 추가요금 있음`,
    gold: G({ company: "가상바람이사", totalAmount: 320000, deposit: 30000, moveDate: "12월 12일 오전", truck: "1톤 1대", workers: 2, stairsNote: "출발지 3층 계단 작업은 층별 추가요금 있음", listedItems: ["침대 1개", "책장 2개", "책상 1개", "의자 1개", "냉장고 1대", "세탁기 1대", "전자레인지 1대", "박스 6개"].map((q) => li(q)), extraFeeClauses: ["출발지 3층 계단 작업은 층별 추가요금 있음"] }),
    explicit: [...I7, "truck", "workers"], need: [BOX, "stairs-from", "ladder", "fee"] },
];

export type ReplyType = "명시적 포함" | "조건부" | "제외·별도" | "금액 제시" | "무관" | "얼버무림";
export interface ReplyCase { id: string; quoteId: string; type: ReplyType; text: string; allowed: string[] /* 명시됨으로 바꿔도 되는 카드 id */ }

export const REPLIES: ReplyCase[] = [
  { id: "R01", quoteId: "Q02", type: "명시적 포함", text: "책장, 책상, 의자 전부 포함입니다. 전자레인지도 같이 가요.", allowed: ["item-책장", "item-책상", "item-의자", "item-전자레인지"] },
  { id: "R02", quoteId: "Q02", type: "조건부", text: "책장이랑 책상은 당일 짐 보고 말씀드릴게요. 짐 많으면 추가 나올 수 있습니다.", allowed: [] },
  { id: "R03", quoteId: "Q02", type: "제외·별도", text: "세탁기는 저희가 못 옮겨요. 냉장고는 가능합니다.", allowed: ["item-냉장고"] },
  { id: "R04", quoteId: "Q02", type: "금액 제시", text: "박스는 6개까지 포함이고 의자는 개당 1만원 추가됩니다.", allowed: ["item-박스"] },
  { id: "R05", quoteId: "Q02", type: "무관", text: "안녕하세요. 이사 당일 연락드리겠습니다. 기사님 번호는 별도로 문자 드릴게요.", allowed: [] },
  { id: "R06", quoteId: "Q02", type: "얼버무림", text: "네 다 됩니다~ 걱정 마세요.", allowed: [] },
  { id: "R07", quoteId: "Q02", type: "얼버무림", text: "다 포함이고요 필요한 건 말씀 주세요.", allowed: [] },
  { id: "R08", quoteId: "Q13", type: "조건부", text: "책장은 분해해야 하면 현장 확인 후 말씀드려요.", allowed: [] },
  { id: "R09", quoteId: "Q13", type: "명시적 포함", text: "책장 포함해서 같이 옮겨 드립니다. 추가 비용 없습니다.", allowed: ["item-책장", "fee-none"] },
  { id: "R10", quoteId: "Q14", type: "제외·별도", text: "책장 책상 분해는 저희가 안 해요. 고객님이 직접 해주셔야 합니다.", allowed: [] },
  { id: "R11", quoteId: "Q14", type: "금액 제시", text: "책장 책상 분해 조립은 개당 1만원씩 따로 받습니다. 계단은 포함입니다.", allowed: ["stairs-from"] },
  { id: "R12", quoteId: "Q03", type: "조건부", text: "3층 계단은 엘리베이터 없으면 층당 추가 있고, 사다리차는 필요 없을 것 같아요.", allowed: [] },
  { id: "R13", quoteId: "Q03", type: "명시적 포함", text: "사다리차는 이 건물이면 안 써도 돼서 비용 없습니다.", allowed: ["ladder"] },
  { id: "R14", quoteId: "Q06", type: "얼버무림", text: "계단은 걱정 마세요 다 해드립니다. 사다리차는 쓰게 되면 그때 말씀드릴게요.", allowed: [] },
  { id: "R15", quoteId: "Q18", type: "금액 제시", text: "사다리차는 필요하면 8만원 받습니다. 출발지 주차 멀면 운반비 2만원 추가돼요.", allowed: [] },
  { id: "R16", quoteId: "Q18", type: "명시적 포함", text: "주차 위치는 건물 바로 앞이라 운반 거리 추가 없습니다.", allowed: ["carry-from"] },
  { id: "R17", quoteId: "Q10", type: "금액 제시", text: "총액은 38만원입니다. 계약금 3만원 보내주세요.", allowed: [] },
  { id: "R18", quoteId: "Q10", type: "무관", text: "전자레인지랑 의자도 갑니다. 박스는 이사 전날 드립니다.", allowed: ["item-전자레인지", "item-의자"] },
  { id: "R19", quoteId: "Q19", type: "얼버무림", text: "네 가능합니다. 원룸이면 보통 다 됩니다.", allowed: [] },
  { id: "R20", quoteId: "Q04", type: "조건부", text: "박스 6개 말씀하셨죠? 6개면 별도 5만원 그대로 받고요, 계단은 포함입니다.", allowed: ["stairs-from"] },
];
