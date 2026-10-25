"""공식 한글 양식(.hwpx)의 7개 내용 칸에 본문을 채운다 (B011).

입력 본문 형식(마크다운 일부): `## 1`~`## 7 제목`, `### 소제목`, 문단, `- `/`  - ` 개조식, `**굵게**`,
마크다운 표(위에 `[표] 제목`), `[그림: 키 | 설명]`, `> ` 강조 상자, `## 출처` 목록.
양식의 머리말·표 틀·글꼴은 그대로 두고, 안내문(파란 글)만 본문으로 바꾼다.

사용: python3 make_hwpx.py 본문.md 그림폴더 양식.hwpx 결과.hwpx
"""
import re
import sys
import zipfile
from html import escape

from PIL import Image

src_md, img_dir, tpl, out = sys.argv[1:5]

# ── 새 글자·문단·테두리 모양 (양식 header.xml 뒤에 덧붙인다)
NAVY = "#1B3A8C"
CHARS = {  # 이름: (크기, 굵게, 색)
    "body": (1000, False, "#000000"),
    "bold": (1000, True, "#000000"),
    "sub": (1100, True, NAVY),
    "title": (1500, True, NAVY),
    "lead": (1050, False, "#333333"),
    "small": (900, False, "#000000"),
    "smallb": (900, True, "#000000"),
    "cap": (880, False, "#555555"),
    "callout": (1050, True, NAVY),
}
PARAS = {  # 이름: (정렬, 왼쪽, 첫 줄, 줄간격%, 앞 간격, 뒤 간격[, 다음 문단과 함께])
    "body": ("JUSTIFY", 0, 0, 160, 0, 200),
    "sub": ("LEFT", 0, 0, 160, 700, 150, True),
    "src": ("LEFT", 900, -900, 135, 0, 40),
    "b1": ("JUSTIFY", 1100, -1100, 155, 0, 80),
    "b2": ("JUSTIFY", 2300, -1100, 150, 0, 60),
    "center": ("CENTER", 0, 0, 130, 0, 0),
    "cap": ("CENTER", 0, 0, 140, 100, 300),
    "cell": ("LEFT", 0, 0, 135, 0, 0),
    "tbltitle": ("LEFT", 0, 0, 150, 300, 100, True),
}
FILLS = {"th": "#E3E9F5", "callout": "#EEF2FA"}

z = zipfile.ZipFile(tpl)
files = {n: z.read(n) for n in z.namelist()}
header = files["Contents/header.xml"].decode("utf-8")
section = files["Contents/section0.xml"].decode("utf-8")
hpf = files["Contents/content.hpf"].decode("utf-8")


def add_items(xml: str, tag: str, group: str, template_id: str, make) -> tuple[str, dict]:
    """tag 요소 하나(template_id)를 본떠 새 항목을 붙이고 itemCnt를 고친다"""
    base = re.search(rf'<hh:{tag} id="{template_id}".*?</hh:{tag}>', xml, re.S).group(0)
    cnt = int(re.search(rf'<hh:{group} itemCnt="(\d+)">', xml).group(1))
    ids, new = {}, []
    for k, spec in make.items():
        ids[k] = cnt
        new.append(spec(re.sub(r' id="\d+"', f' id="{cnt}"', base, count=1)))
        cnt += 1
    xml = xml.replace(f"</hh:{group}>", "".join(new) + f"</hh:{group}>")
    xml = re.sub(rf'<hh:{group} itemCnt="\d+">', f'<hh:{group} itemCnt="{cnt}">', xml)
    return xml, ids


def char_spec(size, bold, color):
    def f(x):
        x = re.sub(r'height="\d+"', f'height="{size}"', x, count=1)
        x = re.sub(r'textColor="[^"]+"', f'textColor="{color}"', x, count=1)
        x = x.replace("<hh:bold/>", "")
        if bold:
            x = x.replace("<hh:underline", "<hh:bold/><hh:underline") if "<hh:underline" in x else x.replace("<hh:strikeout", "<hh:bold/><hh:strikeout")
        return x
    return f


def para_spec(align, left, intent, ls, prev, nxt, keep=False):
    def f(x):
        x = re.sub(r'keepWithNext="\d"', f'keepWithNext="{int(keep)}"', x)
        x = re.sub(r'<hh:align horizontal="\w+"', f'<hh:align horizontal="{align}"', x)
        x = re.sub(r'<hh:heading type="\w+" idRef="\d+" level="\d+"/>', '<hh:heading type="NONE" idRef="0" level="0"/>', x)
        for k, v in (("intent", intent), ("left", left), ("prev", prev), ("next", nxt)):
            x = re.sub(rf'<hc:{k} value="-?\d+"', f'<hc:{k} value="{v}"', x)
        x = re.sub(r'<hh:lineSpacing type="\w+" value="\d+"', f'<hh:lineSpacing type="PERCENT" value="{ls}"', x)
        return x
    return f


def fill_spec(color):
    return lambda x: re.sub(r'faceColor="[^"]+"', f'faceColor="{color}"', x)


header, C = add_items(header, "charPr", "charProperties", "17", {k: char_spec(*v) for k, v in CHARS.items()})
header, P = add_items(header, "paraPr", "paraProperties", "0", {k: para_spec(*v) for k, v in PARAS.items()})
header, B = add_items(header, "borderFill", "borderFills", "8", {k: fill_spec(v) for k, v in FILLS.items()})
B["td"] = 6  # 양식의 얇은 실선 칸

_id = [1500000000]


def nid():
    _id[0] += 7
    return str(_id[0])


def runs(text: str, base: str = "body", strong: str = "bold") -> str:
    out = []
    for i, part in enumerate(re.split(r"\*\*(.+?)\*\*", text)):
        if part:
            out.append(f'<hp:run charPrIDRef="{C[strong if i % 2 else base]}"><hp:t>{escape(part, quote=False)}</hp:t></hp:run>')
    return "".join(out) or f'<hp:run charPrIDRef="{C[base]}"/>'


def para(text: str, p: str = "body", c: str = "body", strong: str = "bold") -> str:
    return f'<hp:p id="2147483648" paraPrIDRef="{P[p]}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">{runs(text, c, strong)}</hp:p>'


CELL_W = 42600  # 내용 칸 안쪽 폭 (HWPUNIT)


def table(rows: list[list[str]], fill_head=True, widths=None, callout=False) -> str:
    ncol = max(len(r) for r in rows)
    rows = [r + [""] * (ncol - len(r)) for r in rows]
    if widths is None:
        lens = [max(min(len(r[c]), 40) for r in rows) + 4 for c in range(ncol)]
        widths = [int(CELL_W * l / sum(lens)) for l in lens]
    trs = []
    for ri, r in enumerate(rows):
        tcs = []
        for ci, cell in enumerate(r):
            head = fill_head and ri == 0
            bf = B["callout"] if callout else B["th"] if head else B["td"]
            ps = "".join(para(line, "cell", "callout" if callout else "smallb" if head else "small", "smallb") for line in cell.split("<br>"))
            tcs.append(f'<hp:tc name="" header="{1 if head else 0}" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="{bf}">'
                       f'<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">{ps}</hp:subList>'
                       f'<hp:cellAddr colAddr="{ci}" rowAddr="{ri}"/><hp:cellSpan colSpan="1" rowSpan="1"/>'
                       f'<hp:cellSz width="{widths[ci]}" height="1600"/><hp:cellMargin left="{700 if callout else 400}" right="{700 if callout else 400}" top="{400 if callout else 160}" bottom="{400 if callout else 160}"/></hp:tc>')
        trs.append("<hp:tr>" + "".join(tcs) + "</hp:tr>")
    w = sum(widths)
    tbl = (f'<hp:tbl id="{nid()}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="{len(rows)}" colCnt="{ncol}" cellSpacing="0" borderFillIDRef="{B["td"]}" noAdjust="0">'
           f'<hp:sz width="{w}" widthRelTo="ABSOLUTE" height="{1600 * len(rows)}" heightRelTo="ABSOLUTE" protect="0"/>'
           '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>'
           '<hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="400" right="400" top="160" bottom="160"/>'
           + "".join(trs) + "</hp:tbl>")
    return f'<hp:p id="2147483648" paraPrIDRef="{P["center"]}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="{C["small"]}">{tbl}</hp:run></hp:p>'


images: list[tuple[str, str]] = []  # (binary id, 파일 경로)


def picture(path: str, width: int = CELL_W) -> str:
    bid = f"image{len(images) + 1}"
    images.append((bid, path))
    px_w, px_h = Image.open(path).size
    h = int(width * px_h / px_w)
    return (f'<hp:p id="2147483648" paraPrIDRef="{P["center"]}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="{C["body"]}">'
            f'<hp:pic id="{nid()}" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="{nid()}" reverse="0">'
            f'<hp:offset x="0" y="0"/><hp:orgSz width="{width}" height="{h}"/><hp:curSz width="{width}" height="{h}"/><hp:flip horizontal="0" vertical="0"/>'
            '<hp:rotationInfo angle="0" centerX="0" centerY="0" rotateimage="1"/><hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo>'
            f'<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="{width}" y="0"/><hc:pt2 x="{width}" y="{h}"/><hc:pt3 x="0" y="{h}"/></hp:imgRect><hp:imgClip left="0" right="0" top="0" bottom="0"/>'
            f'<hp:inMargin left="0" right="0" top="0" bottom="0"/><hc:img binaryItemIDRef="{bid}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects/>'
            f'<hp:sz width="{width}" widthRelTo="ABSOLUTE" height="{h}" heightRelTo="ABSOLUTE" protect="0"/>'
            '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>'
            '<hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:shapeComment>그림입니다.</hp:shapeComment></hp:pic></hp:run></hp:p>')


# ── 본문 읽기
md = open(src_md, encoding="utf-8").read().replace("\r\n", "\n")
blocks: dict[str, list[str]] = {}
titles: dict[str, str] = {}
cur = None
for line in md.split("\n"):
    m = re.match(r"^##\s+(\d|출처)\s*(.*)$", line.strip())
    if m:
        cur = m.group(1)
        titles[cur] = m.group(2).strip()
        blocks[cur] = []
    elif cur:
        blocks[cur].append(line.rstrip())


def render(lines: list[str]) -> str:
    out, i, fig = [], 0, 0
    tbl_title = None
    while i < len(lines):
        s = lines[i]
        t = s.strip()
        if not t:
            i += 1
            continue
        if t.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                    rows.append([c.replace("**", "") if False else c for c in cells])
                i += 1
            if tbl_title:
                out.append(para(tbl_title, "tbltitle", "smallb", "smallb"))
                tbl_title = None
            out.append(table(rows))
            continue
        if t.startswith("[표]"):
            tbl_title = "▪ " + t[3:].strip()
        elif m := re.match(r"\[그림:\s*([\w-]+)\s*\|\s*(.+?)\]$", t):
            fig += 1
            out.append(picture(f"{img_dir}/{m.group(1)}.png"))
            out.append(para(m.group(2), "cap", "cap", "cap"))
        elif t.startswith("> "):
            out.append(table([[t[2:]]], fill_head=False, widths=[CELL_W], callout=True))
        elif t.startswith("### "):
            out.append(para("■ " + t[4:], "sub", "sub", "sub"))
        elif s.startswith("  - ") or s.startswith("    - "):
            out.append(para("– " + t[2:], "b2"))
        elif t.startswith("- "):
            out.append(para("• " + t[2:], "b1"))
        else:
            out.append(para(t))
        i += 1
    return "".join(out)


# 1번(서비스 명칭)은 이름 + 부제
def render_name(lines):
    ls = [l.strip() for l in lines if l.strip()]
    return para(ls[0].replace("**", ""), "body", "title", "title") + "".join(para(l, "body", "lead") for l in ls[1:])


# ── 양식의 내용 칸(안내문이 든 칸) 7개를 차례로 바꾼다
cells = list(re.finditer(r'(<hp:tc [^>]*borderFillIDRef="6"[^>]*><hp:subList [^>]*>)(.*?)(</hp:subList>)', section, re.S))
assert len(cells) == 7, len(cells)
bodies = []
for n in range(1, 8):
    key = str(n)
    body = render_name(blocks[key]) if n == 1 else render(blocks[key])
    if n == 7 and "출처" in blocks:
        body += para("■ 출처", "sub", "sub", "sub") + "".join(para("• " + l.strip()[2:], "src", "cap", "cap") for l in blocks["출처"] if l.strip().startswith("- "))
    bodies.append(body)
for m, body in reversed(list(zip(cells, bodies))):
    section = section[: m.start(2)] + body + section[m.end(2):]
if titles.get("7"):
    section = section.replace("7. (자유타이틀 기재)", f"7. {titles['7']}")

# ── 그림 넣기 + 목록 등록
for bid, path in images:
    files[f"BinData/{bid}.png"] = open(path, "rb").read()
items = "".join(f'<opf:item id="{bid}" href="BinData/{bid}.png" media-type="image/png" isEmbeded="1"/>' for bid, _ in images)
hpf = hpf.replace("</opf:manifest>", items + "</opf:manifest>")

files["Contents/header.xml"] = header.encode("utf-8")
files["Contents/section0.xml"] = section.encode("utf-8")
files["Contents/content.hpf"] = hpf.encode("utf-8")
order = ["mimetype"] + [n for n in files if n != "mimetype"]
with zipfile.ZipFile(out, "w") as zo:
    for n in order:
        zo.writestr(n, files[n], compress_type=zipfile.ZIP_STORED if n == "mimetype" else zipfile.ZIP_DEFLATED)
print(f"ok: {out} · 그림 {len(images)} · 글자 모양 {len(C)} · 문단 모양 {len(P)}")
