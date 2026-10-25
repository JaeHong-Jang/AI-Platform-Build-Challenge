#!/usr/bin/env python3
"""관악구 화물자동차운송주선사업 허가업체현황 CSV(CP949) -> src/data/gwanak-permits.json
사용: python3 scripts/gwanak-permits.py <입력.csv>
전화번호·위도·경도 열은 읽은 뒤 어디에도 담지 않고 버린다(개인 휴대폰일 수 있음).
주소 자르기 규칙: 공백 토큰 중 '층'·'호'로 끝나는 것과 '상가'를 지우고, 괄호 안은 첫 낱말(동 이름)만 남긴다.
"""
import csv, json, re, sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "gwanak-permits.json"


def trim_address(addr: str) -> str:
    m = re.match(r"^(.*?)(?:\(([^)]*)\))?\s*$", addr.strip())
    body, paren = m.group(1), m.group(2)
    toks = [t for t in body.split() if not t.endswith(("층", "호")) and t != "상가"]
    out = " ".join(toks)
    if paren:
        out += f" ({paren.split()[0]})"
    return out


def main(path: str) -> None:
    with open(path, encoding="cp949", newline="") as f:
        src = list(csv.DictReader(f))
    basis = {r["데이터기준일자"] for r in src}
    assert basis == {"2026-04-24"}, basis
    rows = [
        {
            "name": r["업체명"].strip(),
            "licensed": r["인허가일자"].strip(),
            "status": r["영업상태명"].strip(),
            "kind": r["구분"].strip(),
            "address": trim_address(r["소재지주소"]),
        }
        for r in src
    ]
    data = {
        "source": {
            "title": "서울특별시 관악구_화물자동차운송주선사업허가업체현황",
            "url": "https://www.data.go.kr/data/15080952/fileData.do",
            "basis": "2026-04-24",
            "license": "이용허락범위 제한 없음",
            "note": "전화번호·좌표 제외",
        },
        "rows": rows,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(rows)}행 -> {OUT}")


if __name__ == "__main__":
    main(sys.argv[1])
