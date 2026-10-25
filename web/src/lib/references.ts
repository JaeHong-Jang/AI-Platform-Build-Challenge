// 참고 조항. 모델은 조항을 쓰지 않는다 — 카드가 id로만 가리키고 문구는 여기서 나간다.
// 기준: 법제처 생활법령정보의 이사화물 표준약관 설명 (공정위 원문 전문 대조 전). 예외 요건을 생략하지 않는다.

const EASYLAW_QUOTE = "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=666";
const EASYLAW_TERMS = "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=1&cnpClsNo=1&csmSeq=629";

export interface Reference { id: string; label: string; text: string; url: string }

export const REFERENCES: Record<string, Reference> = {
  "art4": {
    id: "art4",
    label: "표준약관 제4조 (견적)",
    text: "견적서에는 이사화물의 내역, 작업 조건, 운임 등을 적도록 되어 있습니다.",
    url: EASYLAW_QUOTE,
  },
  "art5-3": {
    id: "art5-3",
    label: "표준약관 제5조 제3항",
    text: "계약금액은 원칙적으로 견적금액을 넘을 수 없습니다. 다만 고객의 요청으로 산정 사항이 바뀌었고 이를 미리 알린 경우는 예외입니다.",
    url: EASYLAW_QUOTE,
  },
  "art5-2": {
    id: "art5-2",
    label: "표준약관 제5조 제2항 (계약서)",
    text: "계약서에는 견적서 항목에 더해 계약금·잔액·운송상 주의사항·고객 요청사항 등을 적고 고객에게 내주도록 되어 있습니다.",
    url: EASYLAW_TERMS,
  },
  "art6": {
    id: "art6",
    label: "표준약관 제6조 (계약금)",
    text: "사업자는 계약을 맺을 때 운임 등 합계액의 10% 이내에서 계약금을 청구할 수 있습니다.",
    url: EASYLAW_QUOTE,
  },
  "art8-2": {
    id: "art8-2",
    label: "표준약관 제8조 제2항",
    text: "사업자는 계약금액을 넘는 금액을 원칙적으로 청구할 수 없습니다. 다만 고객의 책임 있는 사유로 작업 내용이 바뀌었고 이를 미리 알린 경우는 예외입니다.",
    url: EASYLAW_TERMS,
  },
  "kca-ins": {
    id: "kca-ins",
    label: "한국소비자원 소비자 주의사항",
    text: "계약 체결 전에 허가업체인지와 이사화물배상책임보험 가입 여부를 확인하도록 권고합니다. 피해가 생기면 1372 소비자상담센터에서 상담할 수 있습니다.",
    url: "https://www.kca.go.kr/home/sub.do?menukey=4005&mode=view&no=1004458186&page=1",
  },
  "art8-3": {
    id: "art8-3",
    label: "표준약관 제8조 제3항",
    text: "정해진 운임과 정당한 초과금 외에 수고비 등의 명목으로 추가 금액을 요구할 수 없습니다.",
    url: EASYLAW_TERMS,
  },
};

export const REFERENCE_NOTICE =
  "참고 안내입니다 · 법제처 생활법령정보의 표준약관 설명 기준 · 계약서에 따로 정한 내용이 있으면 달라질 수 있으며 법률 자문이 아닙니다.";
