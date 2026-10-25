#!/usr/bin/env python3
"""논문 표(runs/out/p3-papers.*.md)와 arXiv API 응답을 위키로 ingest 한다.

usage: ingest_papers.py <papers-md> <arxiv-atom-xml>
- wiki/sources/<stem>.md      : arXiv 초록 원문 (요약 원천)
- wiki/notes/papers/<stem>.md : 연결 노트 (어떤 아이디어의 근거인지)
- wiki/notes/ideas/<Lxx-이름>.md : 아이디어 노트가 없으면 골격 생성
"""
import re, sys, pathlib, xml.etree.ElementTree as ET
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[2]
WIKI = ROOT / "wiki"
papers_md, atom = sys.argv[1], sys.argv[2]

ns = {"a": "http://www.w3.org/2005/Atom"}
meta = {}
for e in ET.parse(atom).getroot().findall("a:entry", ns):
    aid = re.sub(r"v\d+$", "", e.find("a:id", ns).text.split("/abs/")[-1])
    meta[aid] = {
        "title": " ".join(e.find("a:title", ns).text.split()),
        "authors": [a.find("a:name", ns).text for a in e.findall("a:author", ns)],
        "published": e.find("a:published", ns).text[:10],
        "abstract": " ".join(e.find("a:summary", ns).text.split()),
    }

idea_of = {}
uses = defaultdict(list)  # stem -> [(idea, relevance)]
info = {}
idea = None
for line in pathlib.Path(papers_md).read_text(encoding="utf-8").splitlines():
    m = re.match(r"## (L\d\d) (.+)", line)
    if m:
        idea = f"{m.group(1)}-{m.group(2).strip().replace(' ', '-').replace('·', '-')}"
        idea_of[m.group(1)] = (idea, m.group(2).strip())
        continue
    if not idea or not line.startswith("| `"):
        continue
    cells = [c.strip() for c in line.strip("|").split("|")]
    stem = cells[0].strip("`")
    aid = re.search(r"\d{4}\.\d{4,5}", cells[3])
    if not aid:
        continue
    info[stem] = aid.group(0)
    uses[stem].append((idea, cells[5]))

(WIKI / "sources").mkdir(exist_ok=True)
(WIKI / "notes" / "papers").mkdir(parents=True, exist_ok=True)
(WIKI / "notes" / "ideas").mkdir(parents=True, exist_ok=True)

for stem, aid in info.items():
    m = meta.get(aid)
    if not m:
        print("skip (arXiv 응답 없음):", stem, aid)
        continue
    url = f"https://arxiv.org/abs/{aid}"
    authors = ", ".join(m["authors"][:4]) + (" 외" if len(m["authors"]) > 4 else "")
    (WIKI / "sources" / f"{stem}.md").write_text(
        f"# {m['title']}\n\n- 저자: {authors}\n- 게시: {m['published']} · arXiv:{aid} · {url}\n\n## 초록 (원문)\n{m['abstract']}\n",
        encoding="utf-8")
    links = "\n".join(f"- [[{i}]] — {rel}" for i, rel in uses[stem])
    tags = ["논문"] + sorted({i.split("-")[0] for i, _ in uses[stem]})
    (WIKI / "notes" / "papers" / f"{stem}.md").write_text(
        f"---\ntype: paper\ntags: [{', '.join(tags)}]\nstatus: verified\nsource: {url}\n---\n"
        f"# {m['title']}\n\n{authors} ({m['published'][:4]}) · arXiv:{aid} · 초록: `wiki/sources/{stem}.md`\n\n"
        f"## 근거로 쓰이는 아이디어\n{links}\n\n상위: [[논문-허브]]\n",
        encoding="utf-8")

for lid, (name, title) in idea_of.items():
    p = WIKI / "notes" / "ideas" / f"{name}.md"
    if p.exists():
        continue
    refs = "\n".join(f"- [[{s}]]" for s, us in uses.items() if any(i == name for i, _ in us) and s in info)
    p.write_text(
        f"---\ntype: idea\ntags: [ideas, {lid}]\nstatus: draft\nsource: wiki/overviews/아이디어-롱리스트.md\n---\n"
        f"# {lid} {title}\n\n요약은 [[아이디어-롱리스트]] 참고. 상위: [[아이디어-허브]]\n\n## 근거 논문\n{refs}\n",
        encoding="utf-8")

hub = WIKI / "notes" / "hubs" / "논문-허브.md"
rows = "\n".join(f"- [[{s}]] — {meta[a]['title']} ({meta[a]['published'][:4]})" for s, a in sorted(info.items()) if a in meta)
hub.write_text(f"---\ntype: hub\ntags: [paper]\nstatus: verified\nsource: {papers_md}\n---\n# 논문 허브\n\n"
               f"arXiv API로 실재를 확인한 논문 {len(rows.splitlines())}편. 아이디어 연결은 각 노트 참고. 상위: [[아이디어-허브]]\n\n{rows}\n",
               encoding="utf-8")
print(f"papers={len(info)} ideas={len(idea_of)}")
