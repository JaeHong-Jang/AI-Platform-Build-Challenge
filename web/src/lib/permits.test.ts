import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { candidates, matchCompany, normalizeCompany } from "./permits.ts";

const raw = readFileSync(new URL("../data/gwanak-permits.json", import.meta.url), "utf8");

test("전화번호·좌표 키가 JSON에 없다", () => {
  for (const k of ["전화번호", "위도", "경도", "phone", "tel", "lat", "lng", "lon"]) {
    assert.ok(!raw.toLowerCase().includes(`"${k}"`), k);
  }
  assert.ok(!/0\d{1,2}-\d{3,4}-\d{4}/.test(raw));
});

test("상호 정규화는 (주)·주식회사·공백·괄호만 지운다", () => {
  assert.equal(normalizeCompany("(주) 아이 무빙"), "아이무빙");
  assert.equal(normalizeCompany("주식회사 대리고"), "대리고");
  assert.equal(normalizeCompany("드림이사"), "드림이사");
});

test("일치: 표기가 달라도 같은 상호면 찾는다", () => {
  const m = matchCompany("주식회사 아이무빙");
  assert.equal(m.status, "match");
  assert.equal(m.row?.name, "(주)아이무빙");
  assert.equal(m.basis, "2026-04-24");
  assert.match(m.message, /같은 업체인지는 미확인/);
});

test("불일치: 접미어를 지우지 않으므로 '드림'은 '드림이사'와 다르다", () => {
  const m = matchCompany("드림");
  assert.equal(m.status, "no-match");
  assert.match(m.message, /무허가라는 뜻은 아닙니다/);
});

test("이름 없음", () => {
  for (const n of [null, "", "  "]) assert.equal(matchCompany(n).status, "no-name");
  assert.match(matchCompany(null).message, /업체 이름이 없음/);
});

test("candidates는 영업 중 이사 관련 행만 돌려준다", () => {
  const c = candidates();
  assert.ok(c.length > 0);
  assert.ok(c.every((r) => r.status === "영업중" && r.kind.includes("이사")));
  assert.ok(!c.some((r) => /폐업|휴업/.test(r.status)));
});
