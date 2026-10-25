// 채비팀 ③ 서류 안내관 · 안심팀 ③ 계약 점검관 (규칙) — 받아야 할 서류와 기재 항목, 계약금 비율.
// 근거: 이사화물 표준약관 제10035호(2014-09-19 개정) 제4·5·6조 — runs/out/b008-data.sol.md §3, 상호 검증 b008-data-peer.sonnet.md.
// 공정위 원본 최신판 대조 전이므로 화면에 판본을 함께 밝힌다. 계약서에 다르게 정했으면 그것이 우선일 수 있다.
export const TERMS_EDITION = "이사화물 표준약관 제10035호 (2014-09-19 개정) · 공정위 최신 원본 대조 전";

export interface DocItem { id: string; label: string; keys: RegExp }
export interface DocSpec { id: "quote" | "contract"; title: string; article: string; when: string; items: DocItem[] }

// 견적서 기재 항목 (제4조). 고객 개인정보는 '성명·주소·전화'까지만 — 주민등록번호를 요구할 근거로 쓰지 않는다.
const QUOTE_ITEMS: DocItem[] = [
  { id: "biz", label: "사업자 상호·등록번호·대표자·주소·전화", keys: /상호|사업자|등록번호|대표/ },
  { id: "when", label: "화물 인수·인도 일시와 장소", keys: /일시|이사일|날짜|\d+\s*월\s*\d+\s*일|출발|도착/ },
  { id: "cargo", label: "이사화물의 종류·무게·부피, 운임 단가", keys: /품목|짐|화물|냉장고|세탁기|침대|박스|운임/ },
  { id: "work", label: "차량 종류·대수, 작업 인원, 포장·정리, 장비", keys: /톤|차량|인원|명\b|포장|정리|사다리|장비/ },
  { id: "storage", label: "보관 장소·기간·요금 (보관이 있을 때)", keys: /보관/ },
  { id: "total", label: "운임 등 합계액과 내역", keys: /총|합계|금액|운임|만원|원\b/ },
];
// 계약서는 제4조 항목에 더해 (제5조 제2항)
const CONTRACT_ITEMS: DocItem[] = [
  ...QUOTE_ITEMS.filter((i) => i.id !== "storage"),
  { id: "deposit", label: "계약금", keys: /계약금|선금|예약금/ },
  { id: "balance", label: "잔액(잔금)", keys: /잔금|잔액/ },
  { id: "caution", label: "운송상 주의사항", keys: /주의/ },
  { id: "request", label: "고객 요청사항 (추가 서비스·비용 포함)", keys: /요청|추가\s*서비스|추가\s*비용|추가요금/ },
];

export const DOCS: DocSpec[] = [
  { id: "quote", title: "견적서", article: "제4조", when: "계약 전 — 업체마다 받기", items: QUOTE_ITEMS },
  { id: "contract", title: "계약서", article: "제5조 제2항", when: "계약금 보내기 전", items: CONTRACT_ITEMS },
];

export interface DocCheck { item: DocItem; found: string | null }
/** 붙여넣은 글에서 항목 낱말을 찾는다. 찾았다는 것은 '적혀 있을 수 있음'이지 내용이 충분하다는 뜻은 아니다 */
export function checkDoc(spec: DocSpec, text: string): DocCheck[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return spec.items.map((item) => ({ item, found: lines.find((l) => item.keys.test(l)) ?? null }));
}

/** 계약금 비율 (제6조: 운임 등 합계액의 10%까지 청구 가능). 두 숫자가 모두 원문에서 확인될 때만 계산한다 */
export function depositRatio(total: number | null, deposit: number | null): { ratio: number; over: boolean } | null {
  if (!total || deposit === null) return null;
  const ratio = deposit / total;
  return { ratio, over: ratio > 0.1 + 1e-9 };
}
