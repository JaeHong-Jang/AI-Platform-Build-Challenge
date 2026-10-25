import { SAMPLE_CONDITIONS, SAMPLE_ITEMS } from "../src/lib/fixtures.ts";
import type { Conditions, Item, QuoteDraft } from "../src/lib/types.ts";
import type { QuoteCase, ReplyCase } from "./dataset.ts";

// 모든 사례·금액·상호는 평가용 합성 데이터이며 시장가격의 근거가 아니다.
// 금지된 파일 및 기존 사례는 열지 않았다. 기존 셋과의 실제 중복 여부는 unknown.
// 독립 작성 초안이며, 별도 작성자의 peer/review 전이다.

const F = "대형가구" as const;
const A = "가전" as const;
const B = "박스·잡화" as const;

function I(
  id: string,
  name: string,
  category: Item["category"],
  count: number,
): Item {
  return { ...SAMPLE_ITEMS[0], id, name, category, count, move: true };
}

function C(
  fromFloor: number,
  fromElevator: Conditions["from"]["elevator"],
  fromParking: Conditions["from"]["parkingFar"],
  toFloor: number,
  toElevator: Conditions["to"]["elevator"],
  toParking: Conditions["to"]["parkingFar"],
): Conditions {
  return {
    ...SAMPLE_CONDITIONS,
    from: {
      floor: fromFloor,
      elevator: fromElevator,
      parkingFar: fromParking,
    },
    to: {
      floor: toFloor,
      elevator: toElevator,
      parkingFar: toParking,
    },
    ladderNeeded: "모름",
  };
}

function D(patch: Partial<QuoteDraft>): QuoteDraft {
  return {
    company: null,
    totalAmount: null,
    deposit: null,
    moveDate: null,
    truck: null,
    workers: null,
    ladder: "미기재",
    stairsNote: null,
    listedItems: [],
    blanketPhrases: [],
    extraFeeClauses: [],
    unreadable: [],
    ...patch,
  };
}

export const QUOTES: QuoteCase[] = [
  {
    id: "H01",
    trait: "투룸 일반이사·쉼표 금액·계약금 10%·깔끔한 확정 견적",
    text: `[가상별조각익스프레스]
11월 6일 오전 8시 / 투룸 일반이사
차량 2.5톤 1대, 작업 인원 3명
침대 1개, 양문형 냉장고 1대, 식탁 1개, 박스 12개 운송 포함
총액 380,000원
계약금 10%인 38,000원 / 잔금 342,000원
추가 비용 없음`,
    items: [
      I("h01-1", "침대", F, 1),
      I("h01-2", "양문형 냉장고", A, 1),
      I("h01-3", "식탁", F, 1),
      I("h01-4", "이삿짐 박스", B, 12),
    ],
    cond: C(1, "없음", "없음", 6, "있음", "없음"),
    gold: D({
      company: "가상별조각익스프레스",
      totalAmount: 380000,
      deposit: 38000,
      moveDate: "11월 6일 오전 8시",
      truck: "2.5톤 1대",
      workers: 3,
      listedItems: [
        { name: "침대", quote: "침대 1개" },
        { name: "냉장고", quote: "양문형 냉장고 1대" },
        { name: "식탁", quote: "식탁 1개" },
        { name: "박스", quote: "박스 12개" },
      ],
      extraFeeClauses: ["추가 비용 없음"],
    }),
    explicit: [
      "item-침대", "item-냉장고", "item-식탁", "item-박스",
      "truck", "workers", "fee",
    ],
    need: [],
  },
  {
    id: "H02",
    trait: "반포장·2층 계단·양문형 냉장고 별도·한글 금액",
    text: `가상달구슬용달 입니다 🙂
11월 7일 오후 1시 반포장
1톤 2대 / 작업자 2명
침대 1개랑 박스 8개 포함이구요
양문형 냉장고 1대는 문짝 탈거 필요하면 별도예요.
출발 2층 계단 작업비는 당일 확인
총 삼십팔만원, 계약금 십만원`,
    items: [
      I("h02-1", "침대", F, 1),
      I("h02-2", "양문형 냉장고", A, 1),
      I("h02-3", "박스", B, 8),
    ],
    cond: C(2, "없음", "없음", 4, "있음", "없음"),
    gold: D({
      company: "가상달구슬용달",
      totalAmount: 380000,
      deposit: 100000,
      moveDate: "11월 7일 오후 1시",
      truck: "1톤 2대",
      workers: 2,
      stairsNote: "출발 2층 계단 작업비는 당일 확인",
      listedItems: [
        { name: "침대", quote: "침대 1개" },
        { name: "박스", quote: "박스 8개" },
        { name: "냉장고", quote: "양문형 냉장고 1대" },
      ],
      extraFeeClauses: [
        "양문형 냉장고 1대는 문짝 탈거 필요하면 별도예요.",
        "출발 2층 계단 작업비는 당일 확인",
      ],
    }),
    explicit: ["item-침대", "item-박스", "truck", "workers"],
    need: ["item-냉장고", "stairs-from", "fee"],
  },
  {
    id: "H03",
    trait: "쓰리룸 포장이사·에어컨 이전설치 미확정·사다리 별도",
    text: `[가상초록자갈이사] 쓰리룸 포장이사
11/08 오전 9시
차량 5톤 1대 / 작업 인원 4명
소파 1개, 옷장 2개 운송·포장 포함.
벽걸이 에어컨 1대 이전설치는 기사님과 협의
사다리차 별도 12만원
총액 88만 / 계약금 22만`,
    items: [
      I("h03-1", "소파", F, 1),
      I("h03-2", "옷장", F, 2),
      I("h03-3", "벽걸이 에어컨", A, 1),
    ],
    cond: C(3, "없음", "없음", 5, "있음", "없음"),
    gold: D({
      company: "가상초록자갈이사",
      totalAmount: 880000,
      deposit: 220000,
      moveDate: "11/08 오전 9시",
      truck: "5톤 1대",
      workers: 4,
      ladder: "별도",
      listedItems: [
        { name: "소파", quote: "소파 1개" },
        { name: "옷장", quote: "옷장 2개" },
        { name: "에어컨", quote: "벽걸이 에어컨 1대" },
      ],
      extraFeeClauses: ["사다리차 별도 12만원"],
    }),
    explicit: ["item-소파", "item-옷장", "truck", "workers"],
    need: ["item-에어컨", "stairs-from", "ladder", "fee"],
  },
  {
    id: "H04",
    trait: "업라이트 피아노·안마의자·특수품 비용 구분",
    text: `가상노을단추익스프레스 견적서
이사일 11월 9일 10시
2.5톤 1대, 작업 인원 3명
업라이트 피아노 1대 운송 포함
안마의자 1대는 중량 확인 후 운임 별도
총액 64만원 / 계약금 0원
특수품 추가 작업비는 현장에서 안내드려요.`,
    items: [
      I("h04-1", "업라이트 피아노", F, 1),
      I("h04-2", "안마의자", F, 1),
      I("h04-3", "책장", F, 1),
    ],
    cond: C(1, "없음", "없음", 1, "없음", "없음"),
    gold: D({
      company: "가상노을단추익스프레스",
      totalAmount: 640000,
      deposit: 0,
      moveDate: "11월 9일 10시",
      truck: "2.5톤 1대",
      workers: 3,
      listedItems: [
        { name: "업라이트 피아노", quote: "업라이트 피아노 1대" },
        { name: "안마의자", quote: "안마의자 1대" },
      ],
      extraFeeClauses: [
        "안마의자 1대는 중량 확인 후 운임 별도",
        "특수품 추가 작업비는 현장에서 안내드려요.",
      ],
    }),
    explicit: ["item-업라이트피아노", "truck", "workers"],
    need: ["item-안마의자", "item-책장", "fee"],
  },
  {
    id: "H05",
    trait: "보관이사·운송과 보관 비용 분리·박스와 잡화 통합",
    text: `[가상구름바늘이사]
11월 10일 입고, 11월 13일 출고 보관이사
운송 총액 57만, 계약금 5만7천원
차량 2.5톤 1대 / 작업 인원 2명
세탁기 1대, 건조기 1대, 박스 6개, 잡화 바구니 2개 운송 포함
보관료는 하루 2만원 별도입니다.`,
    items: [
      I("h05-1", "세탁기", A, 1),
      I("h05-2", "건조기", A, 1),
      I("h05-3", "박스", B, 6),
      I("h05-4", "잡화 바구니", B, 2),
    ],
    cond: C(8, "있음", "없음", 1, "없음", "없음"),
    gold: D({
      company: "가상구름바늘이사",
      totalAmount: 570000,
      deposit: 57000,
      moveDate: "11월 10일 입고, 11월 13일 출고",
      truck: "2.5톤 1대",
      workers: 2,
      listedItems: [
        { name: "세탁기", quote: "세탁기 1대" },
        { name: "건조기", quote: "건조기 1대" },
        { name: "박스", quote: "박스 6개" },
        { name: "잡화 바구니", quote: "잡화 바구니 2개" },
      ],
      extraFeeClauses: ["보관료는 하루 2만원 별도입니다."],
    }),
    explicit: [
      "item-세탁기", "item-건조기", "item-박스", "truck", "workers",
    ],
    need: ["fee"],
  },
  {
    id: "H06",
    trait: "엘리베이터 사용료 별도·양쪽 장거리 운반·차량 미기재",
    text: `가상파도연필용달이에요~
11월 11일 낮 12시
책상 2개 / 의자 2개 / 모니터 2대 운송 포함
작업 인원은 2명입니다
총 29만원, 계약금 3만원
엘베 사용료는 관리실에 직접 납부해주세요.
주차장부터 집까지 운반비는 거리 보고 협의요`,
    items: [
      I("h06-1", "책상", F, 2),
      I("h06-2", "의자", F, 2),
      I("h06-3", "모니터", A, 2),
    ],
    cond: C(7, "있음", "있음", 9, "있음", "있음"),
    gold: D({
      company: "가상파도연필용달",
      totalAmount: 290000,
      deposit: 30000,
      moveDate: "11월 11일 낮 12시",
      workers: 2,
      listedItems: [
        { name: "책상", quote: "책상 2개" },
        { name: "의자", quote: "의자 2개" },
        { name: "모니터", quote: "모니터 2대" },
      ],
      extraFeeClauses: [
        "엘베 사용료는 관리실에 직접 납부해주세요.",
        "주차장부터 집까지 운반비는 거리 보고 협의요",
      ],
    }),
    explicit: ["item-책상", "item-의자", "item-모니터", "workers"],
    need: ["carry-from", "carry-to", "truck", "fee"],
  },
  {
    id: "H07",
    trait: "오후 할증 포함·도착 계단 포함·포장 범위 명시",
    text: `[가상햇살종이이사] 반포장 확정
11월 12일 오후 4시
1톤 1대 / 작업 인원 2명
행거 2개, 전자레인지 1대, 박스 9개 포함
도착 2층 계단 작업 포함
출발 주차장부터 현관까지 70m 운반 포함
오후 할증까지 포함한 총액 38만
계약금 19만
추가 비용 없음`,
    items: [
      I("h07-1", "행거", F, 2),
      I("h07-2", "전자레인지", A, 1),
      I("h07-3", "박스", B, 9),
    ],
    cond: C(1, "없음", "있음", 2, "없음", "없음"),
    gold: D({
      company: "가상햇살종이이사",
      totalAmount: 380000,
      deposit: 190000,
      moveDate: "11월 12일 오후 4시",
      truck: "1톤 1대",
      workers: 2,
      stairsNote: "도착 2층 계단 작업 포함",
      listedItems: [
        { name: "행거", quote: "행거 2개" },
        { name: "전자레인지", quote: "전자레인지 1대" },
        { name: "박스", quote: "박스 9개" },
      ],
      extraFeeClauses: ["추가 비용 없음"],
    }),
    explicit: [
      "item-행거", "item-전자레인지", "item-박스",
      "stairs-to", "carry-from", "truck", "workers", "fee",
    ],
    need: [],
  },
  {
    id: "H08",
    trait: "주말 할증 미확정·인원 미기재·포괄 문구",
    text: `가상보라우체통익스프레스
11월 14일 오전
투룸 짐 전체 반포장으로 잡았어요.
차는 2.5톤 1대
기본 총액 46만원 / 계약금 46,000원
주말 할증은 배차 후 알려드릴께요 ^^`,
    items: [
      I("h08-1", "침대", F, 1),
      I("h08-2", "냉장고", A, 1),
      I("h08-3", "옷장", F, 1),
      I("h08-4", "박스", B, 10),
    ],
    cond: C(4, "있음", "없음", 5, "모름", "없음"),
    gold: D({
      company: "가상보라우체통익스프레스",
      totalAmount: 460000,
      deposit: 46000,
      moveDate: "11월 14일 오전",
      truck: "2.5톤 1대",
      blanketPhrases: ["투룸 짐 전체"],
      extraFeeClauses: ["주말 할증은 배차 후 알려드릴께요 ^^"],
    }),
    explicit: ["truck"],
    need: [
      "item-침대", "item-냉장고", "item-옷장", "item-박스",
      "stairs-to", "ladder", "workers", "fee",
    ],
  },
  {
    id: "H09",
    trait: "가구와 박스 수량 불일치·견적 외 물품 추가",
    text: `[가상모래시계용달] 일반이사
11/15 09:30
1톤 1대, 작업 인원 2명
책장 1개, 책상 1개, 박스 5개 포함
총액 31만 / 계약금 62,000원
견적 외 물품 추가 시 별도`,
    items: [
      I("h09-1", "책장", F, 2),
      I("h09-2", "책상", F, 1),
      I("h09-3", "박스", B, 7),
    ],
    cond: C(1, "없음", "없음", 2, "있음", "없음"),
    gold: D({
      company: "가상모래시계용달",
      totalAmount: 310000,
      deposit: 62000,
      moveDate: "11/15 09:30",
      truck: "1톤 1대",
      workers: 2,
      listedItems: [
        { name: "책장", quote: "책장 1개" },
        { name: "책상", quote: "책상 1개" },
        { name: "박스", quote: "박스 5개" },
      ],
      extraFeeClauses: ["견적 외 물품 추가 시 별도"],
    }),
    explicit: ["item-책상", "truck", "workers"],
    need: ["item-책장", "item-박스", "fee"],
  },
  {
    id: "H10",
    trait: "완비 견적·TV 정규화·양쪽 계단과 사다리 포함",
    text: `가상은빛도토리이사 / 포장이사
11월 16일 오전 8시 30분
차량 2.5톤 1대, 작업 인원 3명
매트리스 1개, TV 1대, 티비선반 1개, 박스 10개 포함
출발 3층과 도착 4층 계단 작업 모두 포함
사다리차 비용 포함
도착지 골목 입구부터 90m 운반 포함
총액 720,000원 / 계약금 72,000원
추가 비용 없음`,
    items: [
      I("h10-1", "매트리스", F, 1),
      I("h10-2", "TV", A, 1),
      I("h10-3", "티비선반", F, 1),
      I("h10-4", "박스", B, 10),
    ],
    cond: C(3, "없음", "없음", 4, "없음", "있음"),
    gold: D({
      company: "가상은빛도토리이사",
      totalAmount: 720000,
      deposit: 72000,
      moveDate: "11월 16일 오전 8시 30분",
      truck: "2.5톤 1대",
      workers: 3,
      ladder: "포함",
      stairsNote: "출발 3층과 도착 4층 계단 작업 모두 포함",
      listedItems: [
        { name: "매트리스", quote: "매트리스 1개" },
        { name: "텔레비전", quote: "TV 1대" },
        { name: "티비선반", quote: "티비선반 1개" },
        { name: "박스", quote: "박스 10개" },
      ],
      extraFeeClauses: ["추가 비용 없음"],
    }),
    explicit: [
      "item-매트리스", "item-텔레비전", "item-티비선반", "item-박스",
      "stairs-from", "stairs-to", "ladder", "carry-to",
      "truck", "workers", "fee",
    ],
    need: [],
  },
  {
    id: "H11",
    trait: "지하 출발·주차 곤란·계단만 확정·장거리 운반 미확정",
    text: `가상물결단풍용달 견적 보내요
11월 17일 오전 10시
차량 1톤 1대 / 작업 인원 2명
소파 1개, 세탁기 1대 포함
출발 지하 1층 계단 작업 포함
골목 주차가 안되면 운반비 별도입니다
총액 34만, 계약금 5만`,
    items: [
      I("h11-1", "소파", F, 1),
      I("h11-2", "세탁기", A, 1),
      I("h11-3", "박스", B, 4),
    ],
    cond: C(-1, "없음", "있음", 1, "없음", "없음"),
    gold: D({
      company: "가상물결단풍용달",
      totalAmount: 340000,
      deposit: 50000,
      moveDate: "11월 17일 오전 10시",
      truck: "1톤 1대",
      workers: 2,
      stairsNote: "출발 지하 1층 계단 작업 포함",
      listedItems: [
        { name: "소파", quote: "소파 1개" },
        { name: "세탁기", quote: "세탁기 1대" },
      ],
      extraFeeClauses: ["골목 주차가 안되면 운반비 별도입니다"],
    }),
    explicit: [
      "item-소파", "item-세탁기", "stairs-from", "truck", "workers",
    ],
    need: ["item-박스", "carry-from", "fee"],
  },
  {
    id: "H12",
    trait: "엘리베이터 모름·인력 별도·계약금 없이 예약",
    text: `[가상자주나침반이사]
11월 18일 오후 2시 / 일반
냉장고 1대, 전자레인지 1대 운송 포함
차량 1톤 1대
총액 26만 / 계약금 없이 예약
상하차 인력은 별도 섭외이고 인원수 미정입니다.
계단 작업은 현장 보고 결정해요.`,
    items: [
      I("h12-1", "냉장고", A, 1),
      I("h12-2", "전자레인지", A, 1),
    ],
    cond: C(4, "모름", "없음", 2, "모름", "없음"),
    gold: D({
      company: "가상자주나침반이사",
      totalAmount: 260000,
      deposit: 0,
      moveDate: "11월 18일 오후 2시",
      truck: "1톤 1대",
      stairsNote: "계단 작업은 현장 보고 결정해요.",
      listedItems: [
        { name: "냉장고", quote: "냉장고 1대" },
        { name: "전자레인지", quote: "전자레인지 1대" },
      ],
      extraFeeClauses: ["상하차 인력은 별도 섭외이고 인원수 미정입니다."],
    }),
    explicit: ["item-냉장고", "item-전자레인지", "truck"],
    need: ["stairs-from", "stairs-to", "ladder", "workers", "fee"],
  },
  {
    id: "H13",
    trait: "총액 누락·계약금만 존재·침대와 매트리스 구분",
    text: `가상새벽구슬익스프레스 입니다.
11월 19일 09시, 반포장
2.5톤 1대 / 작업 인원 3명
침대 프레임 1개, 책장 1개 포함
매트리스는 이번 견적에서 제외했어요.
계약금 50,000원
총액은 방문 후 다시 보내드릴게요.`,
    items: [
      I("h13-1", "침대 프레임", F, 1),
      I("h13-2", "매트리스", F, 1),
      I("h13-3", "책장", F, 1),
    ],
    cond: C(2, "있음", "없음", 3, "있음", "없음"),
    gold: D({
      company: "가상새벽구슬익스프레스",
      deposit: 50000,
      moveDate: "11월 19일 09시",
      truck: "2.5톤 1대",
      workers: 3,
      listedItems: [
        { name: "침대", quote: "침대 프레임 1개" },
        { name: "책장", quote: "책장 1개" },
        { name: "매트리스", quote: "매트리스" },
      ],
    }),
    explicit: ["item-침대", "item-책장", "truck", "workers"],
    need: ["item-매트리스", "fee", "total"],
  },
  {
    id: "H14",
    trait: "보관료·에어컨 이전설치 포함·깔끔한 한글 총액",
    text: `[가상하늘실타래이사] 보관이사 확정서
11월 20일 입고, 11월 22일 출고
차량 2.5톤 1대 / 작업 인원 3명
옷장 1개, 벽걸이 에어컨 1대, 박스 14개 포함
에어컨 철거·운송·재설치와 배관 5m 비용 모두 포함
2일 보관료와 입출고 운송료 포함한 총액 팔십만원
계약금 이십사만원
추가 비용 없음`,
    items: [
      I("h14-1", "옷장", F, 1),
      I("h14-2", "벽걸이 에어컨", A, 1),
      I("h14-3", "박스", B, 14),
    ],
    cond: C(6, "있음", "없음", 7, "있음", "없음"),
    gold: D({
      company: "가상하늘실타래이사",
      totalAmount: 800000,
      deposit: 240000,
      moveDate: "11월 20일 입고, 11월 22일 출고",
      truck: "2.5톤 1대",
      workers: 3,
      listedItems: [
        { name: "옷장", quote: "옷장 1개" },
        { name: "에어컨", quote: "벽걸이 에어컨 1대" },
        { name: "박스", quote: "박스 14개" },
      ],
      extraFeeClauses: ["추가 비용 없음"],
    }),
    explicit: [
      "item-옷장", "item-에어컨", "item-박스", "truck", "workers", "fee",
    ],
    need: [],
  },
  {
    id: "H15",
    trait: "품목 다음 줄의 전역 조건·약식 문구·수량은 일치",
    text: `가상주황돛단배용달
11/21 오후 3시 일반이사
1톤 1대 / 작업 인원 2명
운송 목록: 식탁 1개, 의자 4개, 모니터 1대
※ 위 물품 전부 고객님이 1층에 내려놓는 조건임니다.
총액 24만 / 계약금 2만4천
계단 운반 요청 시 추가요금 협의`,
    items: [
      I("h15-1", "식탁", F, 1),
      I("h15-2", "의자", F, 4),
      I("h15-3", "모니터", A, 1),
    ],
    cond: C(2, "없음", "없음", 1, "없음", "없음"),
    gold: D({
      company: "가상주황돛단배용달",
      totalAmount: 240000,
      deposit: 24000,
      moveDate: "11/21 오후 3시",
      truck: "1톤 1대",
      workers: 2,
      stairsNote: "계단 운반 요청 시 추가요금 협의",
      listedItems: [
        { name: "식탁", quote: "식탁 1개" },
        { name: "의자", quote: "의자 4개" },
        { name: "모니터", quote: "모니터 1대" },
      ],
      extraFeeClauses: ["계단 운반 요청 시 추가요금 협의"],
    }),
    explicit: ["truck", "workers"],
    need: [
      "item-식탁", "item-의자", "item-모니터", "stairs-from", "fee",
    ],
  },
  {
    id: "H16",
    trait: "특수품 확정·주말 할증 포함·주차 장거리 운반 포함",
    text: `[가상민트조약돌익스프레스]
11월 22일 오전 9시 포장이사
차량 2.5톤 1대, 작업 인원 3명
안마의자 1대, 디지털 피아노 1대, 소파 1개 모두 운송 포함
도착 주차 위치부터 건물까지 120m 운반 포함
주말 할증 포함 총액 69만원
계약금 345,000원
추가 비용 없음`,
    items: [
      I("h16-1", "안마의자", F, 1),
      I("h16-2", "디지털 피아노", F, 1),
      I("h16-3", "소파", F, 1),
    ],
    cond: C(5, "있음", "없음", 8, "있음", "있음"),
    gold: D({
      company: "가상민트조약돌익스프레스",
      totalAmount: 690000,
      deposit: 345000,
      moveDate: "11월 22일 오전 9시",
      truck: "2.5톤 1대",
      workers: 3,
      listedItems: [
        { name: "안마의자", quote: "안마의자 1대" },
        { name: "디지털 피아노", quote: "디지털 피아노 1대" },
        { name: "소파", quote: "소파 1개" },
      ],
      extraFeeClauses: ["추가 비용 없음"],
    }),
    explicit: [
      "item-안마의자", "item-디지털피아노", "item-소파",
      "carry-to", "truck", "workers", "fee",
    ],
    need: [],
  },
  {
    id: "H17",
    trait: "최소 정보 문자·총액만 명시·추가비 문구도 없음",
    text: `가상밤하늘종이용달 입니다
보내주신 사진 확인했어요 🙂
이사는 총 38만이에요. 예약 원하시면 답장주세요!`,
    items: [
      I("h17-1", "책상", F, 1),
      I("h17-2", "행거", F, 1),
      I("h17-3", "박스", B, 5),
    ],
    cond: C(1, "없음", "없음", 2, "있음", "없음"),
    gold: D({
      company: "가상밤하늘종이용달",
      totalAmount: 380000,
    }),
    explicit: [],
    need: [
      "item-책상", "item-행거", "item-박스", "truck", "workers", "fee",
    ],
  },
  {
    id: "H18",
    trait: "사다리 언급만으로 카드 생성·엘리베이터 있음·차량 조건부",
    text: `[가상분홍나뭇잎이사] 투룸 반포장
11월 24일 오전 10시
차량은 1톤 2대 예정, 배차 사정에 따라 변경
작업 인원 3명
양문형 냉장고 1대, 건조기 1대, 옷장 1개 포함
사다리차 필요 시 비용 별도
총액 53만 / 계약금 159,000원`,
    items: [
      I("h18-1", "양문형 냉장고", A, 1),
      I("h18-2", "건조기", A, 1),
      I("h18-3", "옷장", F, 1),
    ],
    cond: C(10, "있음", "없음", 12, "있음", "없음"),
    gold: D({
      company: "가상분홍나뭇잎이사",
      totalAmount: 530000,
      deposit: 159000,
      moveDate: "11월 24일 오전 10시",
      truck: "1톤 2대",
      workers: 3,
      ladder: "별도",
      listedItems: [
        { name: "냉장고", quote: "양문형 냉장고 1대" },
        { name: "건조기", quote: "건조기 1대" },
        { name: "옷장", quote: "옷장 1개" },
      ],
      extraFeeClauses: ["사다리차 필요 시 비용 별도"],
    }),
    explicit: ["item-냉장고", "item-건조기", "item-옷장", "workers"],
    need: ["ladder", "truck", "fee"],
  },
  {
    id: "H19",
    trait: "쓰리룸 포괄 문구와 개별 품목 혼합·오후 할증 별도",
    text: `가상푸른책갈피익스프레스 견적 알림
11월 25일 오후 5시 / 쓰리룸 포장이사
차량 5톤 1대 / 작업 인원 4명
쓰리룸 가재도구 일체
세부 확인: 침대 2개, 텔레비전 1대 포함
총액 92만원, 계약금 92,000원
오후 작업 할증 8만원은 별도 청구됩니다.`,
    items: [
      I("h19-1", "침대", F, 2),
      I("h19-2", "텔레비전", A, 1),
      I("h19-3", "식탁", F, 1),
      I("h19-4", "박스", B, 18),
    ],
    cond: C(11, "있음", "없음", 6, "있음", "없음"),
    gold: D({
      company: "가상푸른책갈피익스프레스",
      totalAmount: 920000,
      deposit: 92000,
      moveDate: "11월 25일 오후 5시",
      truck: "5톤 1대",
      workers: 4,
      listedItems: [
        { name: "침대", quote: "침대 2개" },
        { name: "텔레비전", quote: "텔레비전 1대" },
      ],
      blanketPhrases: ["쓰리룸 가재도구 일체"],
      extraFeeClauses: ["오후 작업 할증 8만원은 별도 청구됩니다."],
    }),
    explicit: ["item-침대", "item-텔레비전", "truck", "workers"],
    need: ["item-식탁", "item-박스", "fee"],
  },
  {
    id: "H20",
    trait: "도착 지하·계단 제외·짐 수량 차이·주차 운반비 별도",
    text: `[가상연두풍경용달] 일반이사
11월 26일 오전 11시
차량 1톤 1대 / 작업 인원 1명
세탁기 1대와 박스 3개 운송 포함
도착 지하 1층 계단 작업은 제외입니다.
출발지 주차가 멀어 장거리 운반비 3만원 별도
총액 21만원 / 계약금 7만원`,
    items: [
      I("h20-1", "세탁기", A, 1),
      I("h20-2", "박스", B, 6),
      I("h20-3", "전자레인지", A, 1),
    ],
    cond: C(1, "없음", "있음", -1, "없음", "없음"),
    gold: D({
      company: "가상연두풍경용달",
      totalAmount: 210000,
      deposit: 70000,
      moveDate: "11월 26일 오전 11시",
      truck: "1톤 1대",
      workers: 1,
      stairsNote: "도착 지하 1층 계단 작업은 제외입니다.",
      listedItems: [
        { name: "세탁기", quote: "세탁기 1대" },
        { name: "박스", quote: "박스 3개" },
      ],
      extraFeeClauses: [
        "출발지 주차가 멀어 장거리 운반비 3만원 별도",
      ],
    }),
    explicit: ["item-세탁기", "truck", "workers"],
    need: [
      "item-박스", "item-전자레인지", "stairs-to", "carry-from", "fee",
    ],
  },
];

export const REPLIES: ReplyCase[] = [
  {
    id: "HR01",
    quoteId: "H01",
    type: "무관",
    text: "예약하시면 전날 기사님 연락처 보내드릴게요 🙂",
    allowed: [],
  },
  {
    id: "HR02",
    quoteId: "H02",
    type: "명시적 포함",
    text: "양문형 냉장고 1대는 문짝 탈거가 필요해도 총액에 포함입니다. 출발 2층 계단 작업도 총액에 포함이에요.",
    allowed: ["item-냉장고", "stairs-from"],
  },
  {
    id: "HR03",
    quoteId: "H03",
    type: "조건부",
    text: "에어컨 1대는 기존 배관 그대로 쓸 수 있을 때만 철거랑 재설치까지 포함됩니다.",
    allowed: [],
  },
  {
    id: "HR04",
    quoteId: "H04",
    type: "금액 제시",
    text: "안마의자는 7만원, 책장은 2만원으로 잡으시면 돼요.",
    allowed: [],
  },
  {
    id: "HR05",
    quoteId: "H05",
    type: "제외·별도",
    text: "57만원에 보관료는 안 들어가요. 입고일부터 출고일까지 보관료 따로 받습니다.",
    allowed: [],
  },
  {
    id: "HR06",
    quoteId: "H06",
    type: "명시적 포함",
    text: "차량은 1톤 2대로 확정이고 총액에 포함입니다. 출발 주차장에서 집까지 운반, 도착 주차장에서 집까지 운반도 거리와 관계없이 둘 다 총액에 포함합니다. 엘베 사용료는 안내드린 대로 별도예요.",
    allowed: ["truck", "carry-from", "carry-to"],
  },
  {
    id: "HR07",
    quoteId: "H07",
    type: "무관",
    text: "계약금 보내신 뒤 입금자 성함만 알려주세용.",
    allowed: [],
  },
  {
    id: "HR08",
    quoteId: "H08",
    type: "얼버무림",
    text: "저희 투룸 많이 해봐서 다 알아서 해드려요 ㅎㅎ 걱정마세요.",
    allowed: [],
  },
  {
    id: "HR09",
    quoteId: "H09",
    type: "명시적 포함",
    text: "확인했습니다. 책장 2개와 박스 7개 모두 기존 총액 31만원에 포함으로 정정합니다. 그 밖의 물품을 추가하면 별도인 조건은 그대로예요.",
    allowed: ["item-책장", "item-박스"],
  },
  {
    id: "HR10",
    quoteId: "H10",
    type: "무관",
    text: "도착 아파트 동 번호가 몇 동인가요?",
    allowed: [],
  },
  {
    id: "HR11",
    quoteId: "H11",
    type: "조건부",
    text: "박스 4개는 가로세로높이 합 120cm 이하일 때만 포함이고, 출발지 운반은 차를 골목 안에 댈 수 있으면 포함입니다.",
    allowed: [],
  },
  {
    id: "HR12",
    quoteId: "H12",
    type: "얼버무림",
    text: "출발 4층에 엘베가 있다는 말씀이실까요? 도착 2층은 계단 몇 칸인지 먼저 알려주세요.",
    allowed: [],
  },
  {
    id: "HR13",
    quoteId: "H13",
    type: "명시적 포함",
    text: "제외라고 쓴 건 제가 잘못 적었습니다. 매트리스 1개도 운송 총액에 포함합니다. 최종 총액은 방문 후 안내드릴게요.",
    allowed: ["item-매트리스"],
  },
  {
    id: "HR14",
    quoteId: "H14",
    type: "무관",
    text: "보관 창고 입고 사진은 입고 완료되면 보내드려요.",
    allowed: [],
  },
  {
    id: "HR15",
    quoteId: "H15",
    type: "명시적 포함",
    text: "고객님이 1층에 내려놓는 조건은 삭제하겠습니다. 식탁 1개, 의자 4개, 모니터 1대 운송과 출발 2층 계단 작업 모두 기존 총액에 포함합니다. 추가 비용 없음으로 확정합니다.",
    allowed: [
      "item-식탁", "item-의자", "item-모니터", "stairs-from", "fee",
    ],
  },
  {
    id: "HR16",
    quoteId: "H16",
    type: "무관",
    text: "안마의자 리모컨은 분실되지 않게 따로 챙겨주세요.",
    allowed: [],
  },
  {
    id: "HR17",
    quoteId: "H17",
    type: "명시적 포함",
    text: "책상 1개, 행거 1개, 박스 5개 운송 포함입니다. 차량 1톤 1대와 작업 인원 2명도 총액 38만원에 포함이에요. 추가 비용 없음입니다.",
    allowed: [
      "item-책상", "item-행거", "item-박스", "truck", "workers", "fee",
    ],
  },
  {
    id: "HR18",
    quoteId: "H18",
    type: "제외·별도",
    text: "사다리차는 53만원에 포함 안 됩니다. 필요하시면 장비 업체 비용 따로 내셔야 해요.",
    allowed: [],
  },
  {
    id: "HR19",
    quoteId: "H19",
    type: "얼버무림",
    text: "식탁 크기가 어떻게 되죠? 박스는 직접 포장하시는 건가요? 확인하고 말씀드릴게요.",
    allowed: [],
  },
  {
    id: "HR20",
    quoteId: "H20",
    type: "금액 제시",
    text: "박스 3개 더는 2만원, 전자레인지는 1만원, 지하 계단은 4만원입니다. 출발지 장거리 운반비는 말씀드린 3만원이에요.",
    allowed: [],
  },
];
