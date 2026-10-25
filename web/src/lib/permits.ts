import data from "../data/gwanak-permits.json" with { type: "json" };

export type Permit = { name: string; licensed: string; status: string; kind: string; address: string };

export const PERMITS_SOURCE = data.source;
const ROWS: Permit[] = data.rows;

/** 영업 중이면서 구분에 '이사'가 들어간 행("이사", "일반/이사"). 실제 값은 이사 26·일반/이사 1·일반 12, 전부 영업중. */
export function candidates(): Permit[] {
  return ROWS.filter((r) => r.status === "영업중" && r.kind.includes("이사"));
}

/** `(주)`·`주식회사`·공백·괄호만 지운다. 이사/익스프레스 같은 접미어는 그대로 둔다. */
export function normalizeCompany(name: string): string {
  return name.replace(/\(주\)|주식회사|[\s()]/g, "");
}

export type PermitMatch = {
  status: "match" | "no-match" | "no-name";
  row: Permit | null;
  basis: string;
  message: string;
};

const MSG = {
  match: "관악구 허가 목록에 같은 상호 기록 있음 · 같은 업체인지는 미확인 — 계약 전 허가증 사본·사업자등록번호를 대조하세요",
  "no-match": "관악구 목록에서 같은 상호를 찾지 못함 — 무허가라는 뜻은 아닙니다(연 1회 갱신, 다른 구 등록 가능). 허가증 사본을 요청하세요",
  "no-name": "견적서에 업체 이름이 없음 — 업체명과 허가증을 요청하세요",
} as const;

export function matchCompany(name: string | null): PermitMatch {
  const basis = data.source.basis;
  const key = name ? normalizeCompany(name) : "";
  if (!key) return { status: "no-name", row: null, basis, message: MSG["no-name"] };
  const row = ROWS.find((r) => normalizeCompany(r.name) === key) ?? null;
  const status = row ? "match" : "no-match";
  // 같은 상호여도 목록상 구분이 '일반'(일반화물)이면 이사화물 허가로 읽히지 않게 밝힌다 (Argon2 #3-C)
  const message = row && !row.kind.includes("이사") ? `관악구 목록에 같은 상호가 있지만 구분이 '${row.kind}'(이사화물 아님) — 이사화물 허가증을 따로 요청하세요` : MSG[status];
  return { status, row, basis, message };
}
