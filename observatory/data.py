"""관측소 데이터 수집. build.py(정적 HTML)와 server.py(실시간)가 함께 쓴다."""
import json, os, re, time, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
WIKI = ROOT / "wiki"
LINK = re.compile(r"\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]")
# 구조 개편 전 phase 이름 → 현재 stage
OLD_PHASE = {"ideation": "analysis", "verdict": "decision", "ingest": "wiki"}
WORKERS = {"sol", "sonnet"}


def read_jsonl(path):
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def parse_md(path):
    text = path.read_text(encoding="utf-8")
    meta, body = {}, text
    if text.startswith("---"):
        _, fm, body = text.split("---", 2)
        for line in fm.strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                v = v.strip()
                meta[k.strip()] = [t.strip() for t in v[1:-1].split(",") if t.strip()] if v.startswith("[") else v
    title = next((l[2:].strip() for l in body.splitlines() if l.startswith("# ")), path.stem)
    return meta, body.strip(), title


def summary(body):
    """노트 첫 문단을 한 줄 요약으로 (제목·목록·표 제외, 링크는 표시 이름만)."""
    for line in body.splitlines():
        l = line.strip()
        if not l or l[0] in "#|>`-*" or re.match(r"\d+[.)]", l):
            continue
        l = re.sub(r"\[\[([^\]|]+)\|?([^\]]*)\]\]", lambda m: m.group(2) or m.group(1), l)
        l = re.sub(r"\*\*|`", "", l)
        return l[:140]
    return ""


def stage_of(run):
    p = run.get("phase", "")
    if p == "verify":
        return "peer" if run["member"] in WORKERS else "review"
    return OLD_PHASE.get(p, p)


def docs(folder):
    out = []
    for p in sorted((ROOT / folder).glob("*.md")):
        meta, body, title = parse_md(p)
        out.append({**meta, "title": meta.get("title", title), "body": body, "path": str(p.relative_to(ROOT)), "stem": p.stem})
    return out


def read_text(rel):
    f = ROOT / rel if rel else None
    return f.read_text(encoding="utf-8", errors="replace") if f and f.is_file() else ""


def brief_of(r, aliases, windows):
    """실행이 속한 과제: 기록된 값 → 연결표 → 시작 시각이 들어가는 과제 구간."""
    if r.get("brief"):
        return r["brief"]
    a = aliases.get(f'{r["task"]}|{r["member"]}', {})
    if a.get("brief"):
        return a["brief"]
    t = str(r.get("ts", ""))[:19]
    cur = None
    for created, bid in windows:
        if created <= t:
            cur = bid
    return cur


def collect():
    """지식 그래프·실행 기록·brief·판정 전체."""
    nodes, links = {}, []

    def add(stem, meta, body, title, path, default="concept"):
        nodes[stem] = {"id": stem, "title": title, "type": meta.get("type", default), "tags": meta.get("tags", []),
                       "status": meta.get("status", ""), "source": meta.get("source", ""), "path": path, "body": body,
                       "summary": summary(body)}
        links.extend((stem, t.strip()) for t in LINK.findall(body))

    for p in sorted(WIKI.rglob("*.md")):
        rel = p.relative_to(WIKI).parts
        if len(rel) == 1 or rel[0] in ("sources", "papers"):  # index/log 와 원문·요약은 그래프에서 제외
            continue
        meta, body, title = parse_md(p)
        add(p.stem, meta, body, title, str(p.relative_to(ROOT)))

    briefs, decisions = docs("briefs"), docs("decisions")
    for b in briefs:
        add(b["stem"], {"type": "brief", "tags": ["과제-지시"], "status": b.get("status", "")}, b["body"], b["title"], b["path"])
    for d in decisions:
        vf = ROOT / "decisions" / f'{d["stem"]}.verdict.json'   # 항목별 판정 (결과와 근거)
        d["verdict"] = json.loads(vf.read_text(encoding="utf-8")) if vf.exists() else None
        add(d["stem"], {"type": "verdict", "tags": ["판정"], "status": "confirmed"}, d["body"], d["title"], d["path"])
        brief = next((b["stem"] for b in briefs if b.get("id") == d.get("brief")), None)
        if brief:
            links.append((d["stem"], brief))

    af = ROOT / "runs" / "aliases.json"
    aliases = json.loads(af.read_text(encoding="utf-8")) if af.exists() else {}
    windows = sorted((str(b.get("created", ""))[:19], b.get("id")) for b in briefs if b.get("status") != "waiting")
    runs = []
    for i, r in enumerate(read_jsonl(ROOT / "runs" / "runs.jsonl")):
        a = aliases.get(f'{r["task"]}|{r["member"]}', {})
        r["out"] = r.get("out") or a.get("out", "")
        r["prompt"] = r.get("prompt") or a.get("prompt", "")
        r["brief"] = brief_of(r, aliases, windows)
        r["stage"] = stage_of(r)
        r["text"] = read_text(r["out"])
        r["prompt_text"] = read_text(r["prompt"])
        r["id"] = f"run:{i}"
        runs.append(r)
        nodes[r["id"]] = {"id": r["id"], "title": f'{r["task"]} · {r["member"]}', "type": "run", "tags": [r["stage"]],
                          "status": r["status"], "source": r["out"], "path": r["out"], "body": r["text"],
                          "summary": r.get("note", ""), "member": r["member"], "stage": r["stage"], "secs": r["secs"], "ts": r["ts"]}
        links.append((r["id"], r["member"].capitalize()))

    edges = [{"source": s, "target": t} for s, t in links if s in nodes and t in nodes and s != t]
    project = json.loads((ROOT / "project.json").read_text(encoding="utf-8")) if (ROOT / "project.json").exists() else {}
    return {"nodes": list(nodes.values()), "links": edges, "runs": runs, "briefs": briefs, "decisions": decisions,
            "project": project, "live": live()}


def tail(path, n=8):
    """진행 로그에서 팀원이 실제로 한 행동만 뽑는다: 검색어, 실행한 명령, 에이전트 메시지 (codex 로그 형식)."""
    p = ROOT / path
    if not path or not p.is_file():
        return []
    with open(p, "rb") as f:
        f.seek(0, 2)
        f.seek(max(0, f.tell() - 60000))
        lines = f.read().decode("utf-8", errors="replace").splitlines()
    acts, mode = [], None
    for raw in lines:
        l = raw.strip()
        if l and l[:1] in "💬🔎⚙📝📄🤖🔔":   # 훅(hook.py)이 쓴 줄은 그대로
            acts.append(l)
            mode = None
            continue
        if l in ("codex", "exec", "user", "thinking"):
            mode = l
            continue
        if l.startswith("web search:"):
            q = l[len("web search:"):].strip()
            if q:
                acts.append("🔎 " + q)
            mode = None
        elif mode == "exec" and l:
            acts.append("⚙ " + l.split(" in /")[0].replace("/bin/bash -lc ", ""))
            mode = None
        elif mode == "codex" and l:
            acts.append("💬 " + l)
            mode = None
    return [a[:160] for a in acts[-n:]]


def alive(pid):
    if not pid:
        return True  # pid 없는 수동 기록(Claude 서브에이전트)은 end 이벤트로만 끝난다
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def live():
    """진행 중인 실행과 최근 이벤트."""
    events = read_jsonl(ROOT / "runs" / "events.jsonl")
    ended = {e["id"] for e in events if e["type"] == "end"}
    active = []
    for e in events:
        if e["type"] != "start" or e["id"] in ended:
            continue
        active.append({**e, "elapsed": int(time.time() - e["t"]), "alive": alive(e.get("pid")),
                       "tail": tail(e.get("log", ""))})
    pf = ROOT / "runs" / "prompt.json"
    prompt = json.loads(pf.read_text(encoding="utf-8")) if pf.exists() else None
    opus = read_jsonl(ROOT / "runs" / "session.jsonl")[-40:]   # 의장 Opus가 한 일 (훅 기록)
    return {"now": time.time(), "active": active, "events": events[-40:], "prompt": prompt, "opus": opus}


def signature():
    """파일 변화 감지용 값 — 바뀌면 클라이언트가 전체 상태를 다시 받는다."""
    sig = []
    for p in (ROOT / "runs" / "runs.jsonl", ROOT / "runs" / "events.jsonl"):
        sig.append(p.stat().st_size if p.exists() else 0)
    for folder in (WIKI, ROOT / "briefs", ROOT / "decisions"):
        sig.append(max((p.stat().st_mtime for p in folder.rglob("*.md")), default=0))
    return tuple(sig)
