#!/usr/bin/env python3
"""실행 이벤트 기록기. 관측소 서버가 runs/events.jsonl 을 실시간으로 읽는다.

usage:
  event.py start <member> <task> <stage> [out] [log] [pid] [prompt]   → 실행 id 출력
  event.py end <run-id> <ok|fail> [note]                       → 종료 기록 + runs/runs.jsonl 에 완료 1건 추가

stage: brief research analysis peer review debate decision wiki repo
"""
import json, sys, time, datetime, pathlib

MODELS = {
    "opus": ("Claude Opus 5.5", "orchestra"),
    "astra": ("GPT 6 Astra", "orchestra"),
    "argon": ("Gemini 4 Argon", "orchestra"),
    "sol": ("GPT 6.1 Sol", "worker"),
    "sonnet": ("Claude Sonnet 5.5", "worker"),
}
STAGES = ("brief", "research", "analysis", "peer", "review", "debate", "decision", "wiki", "repo")
ROOT = pathlib.Path(__file__).resolve().parents[2]
EVENTS = ROOT / "runs" / "events.jsonl"


def active_brief():
    """진행 중인 과제 지시(status: active) 중 가장 최근 것의 id."""
    best = None
    for f in sorted((ROOT / "briefs").glob("*.md")):
        head = f.read_text(encoding="utf-8").split("---")[1] if f.read_text(encoding="utf-8").startswith("---") else ""
        meta = dict(l.split(":", 1) for l in head.strip().splitlines() if ":" in l)
        if meta.get("status", "").strip() == "active":
            best = meta.get("id", "").strip() or best
    return best


def now():
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def append(path, rec):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


cmd = sys.argv[1]
if cmd == "start":
    member, task, stage = sys.argv[2:5]
    assert member in MODELS, f"unknown member {member}"
    assert stage in STAGES, f"unknown stage {stage}"
    out = sys.argv[5] if len(sys.argv) > 5 else ""
    log = sys.argv[6] if len(sys.argv) > 6 else ""
    pid = int(sys.argv[7]) if len(sys.argv) > 7 and sys.argv[7] else None
    prompt = sys.argv[8] if len(sys.argv) > 8 else ""
    rid = f"{task}.{member}.{int(time.time())}"
    model, tier = MODELS[member]
    append(EVENTS, {"type": "start", "id": rid, "ts": now(), "t": time.time(), "member": member, "model": model,
                    "tier": tier, "task": task, "stage": stage, "out": out, "log": log, "pid": pid,
                    "prompt": prompt, "brief": active_brief()})
    print(rid)
elif cmd == "end":
    rid, status = sys.argv[2:4]
    note = sys.argv[4] if len(sys.argv) > 4 else ""
    start = next((json.loads(l) for l in EVENTS.read_text(encoding="utf-8").splitlines()
                  if l.strip() and json.loads(l).get("id") == rid and json.loads(l)["type"] == "start"), None)
    assert start, f"start event not found: {rid}"
    secs = int(time.time() - start["t"])
    append(EVENTS, {"type": "end", "id": rid, "ts": now(), "t": time.time(), "status": status, "secs": secs, "note": note})
    append(ROOT / "runs" / "runs.jsonl", {
        "ts": now(), "member": start["member"], "model": start["model"], "tier": start["tier"],
        "task": start["task"], "phase": start["stage"], "status": status, "secs": secs,
        "out": start["out"], "note": note, "run": rid, "prompt": start.get("prompt", ""), "brief": start.get("brief")})
else:
    sys.exit(__doc__)
