#!/usr/bin/env python3
"""Claude Code 훅 → 관측소 실시간 기록. .claude/settings.json 의 훅들이 이 스크립트를 부른다.

- UserPromptSubmit : 사용자 지시를 받으면 Opus(의장) 실행 시작 + 지시 문장 기록
- PreToolUse       : Opus·서브에이전트가 쓰는 도구를 진행 로그에 한 줄씩 추가.
                     Agent 도구(model: sonnet)면 Sonnet 실행을 시작한다
- PostToolUse      : 백그라운드 Agent의 agentId를 실행과 연결
- SubagentStop     : 해당 Sonnet 실행 종료
- Stop             : Opus 응답이 끝나면 Opus 실행 종료
어떤 경우에도 Claude Code 작업을 막지 않도록 예외는 삼키고 0으로 끝낸다.
"""
import json, re, subprocess, sys, pathlib, time

ROOT = pathlib.Path(__file__).resolve().parents[2]
STATE = ROOT / "runs" / ".hookstate.json"
EVENT = ROOT / "team" / "bin" / "event.py"
STAGE_WORDS = [("상호", "peer"), ("검증", "peer"), ("분석", "analysis"), ("리뷰", "review"), ("토론", "debate"),
               ("위키", "wiki"), ("ingest", "wiki"), ("조사", "research"), ("벤치", "research")]


def load():
    try:
        return json.loads(STATE.read_text(encoding="utf-8"))
    except Exception:
        return {"opus": None, "pending": {}, "agents": {}}


def save(s):
    STATE.write_text(json.dumps(s, ensure_ascii=False), encoding="utf-8")


def event(*args):
    r = subprocess.run([sys.executable, str(EVENT), *args], capture_output=True, text=True)
    return r.stdout.strip()


def log_line(path, text):
    with open(ROOT / path, "a", encoding="utf-8") as f:
        f.write(text.replace("\n", " ")[:200] + "\n")


def opus_act(text):
    """의장 Opus가 한 일을 시각과 함께 남긴다 (관측소 '최근 활동')."""
    with open(ROOT / "runs" / "session.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({"t": time.time(), "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "text": text[:200]}, ensure_ascii=False) + "\n")


def describe(name, inp):
    """도구 호출을 사람이 읽는 한 줄로."""
    if name == "Bash":
        return "⚙ " + (inp.get("description") or inp.get("command", ""))
    if name in ("WebSearch",):
        return "🔎 " + inp.get("query", "")
    if name == "WebFetch":
        return "🔎 열람 " + inp.get("url", "")
    if name in ("Write", "Edit", "NotebookEdit"):
        return "📝 " + ("작성 " if name == "Write" else "수정 ") + pathlib.Path(inp.get("file_path", "")).name
    if name == "Read":
        return "📄 읽기 " + pathlib.Path(inp.get("file_path", "")).name
    if name == "Agent":
        return "🤖 팀원 호출: " + inp.get("description", "")
    if name in ("Grep", "Glob"):
        return "🔎 파일 찾기 " + inp.get("pattern", "")
    return "⚙ " + name


def main():
    h = json.load(sys.stdin)
    ev = h.get("hook_event_name", "")
    s = load()
    agent_id = h.get("agent_id")  # 서브에이전트 안에서 난 훅이면 들어 있다
    if ev == "UserPromptSubmit":
        raw = re.sub(r"</?pasted_content[^>]*>", " ", str(h.get("prompt", "")))  # 붙여넣기 태그는 화면에서 뺀다
        prompt = " ".join(raw.split())
        if s.get("opus"):
            event("end", s["opus"], "ok", "다음 지시가 와서 종료")
        log = "runs/out/session.opus.log"
        # 백그라운드 작업 완료 알림·팀원 보고는 사용자 지시가 아니다
        m = re.search(r"<summary>(.*?)</summary>", prompt)
        if prompt.startswith("<task-notification>") or "[Subagent hand-back]" in prompt or "<agent-message" in prompt:
            what = m.group(1) if m else "팀원 보고"
            s["opus"] = event("start", "opus", "알림 처리: " + what[:36], "brief", "", log)
            log_line(log, "🔔 알림: " + what)
            opus_act("🔔 알림 처리: " + what)
        else:
            s["opus"] = event("start", "opus", "지시: " + prompt[:40], "brief", "", log)
            log_line(log, "💬 사용자 지시: " + prompt)
            opus_act("💬 사용자 지시: " + prompt)
            (ROOT / "runs" / "prompt.json").write_text(json.dumps({"t": time.time(), "text": prompt[:600]}, ensure_ascii=False), encoding="utf-8")
    elif ev == "PreToolUse":
        name, inp = h.get("tool_name", ""), h.get("tool_input", {}) or {}
        rid = s["agents"].get(agent_id) if agent_id else s.get("opus")
        line = describe(name, inp)
        if agent_id:                       # 서브에이전트의 도구 사용은 그 팀원의 로그로만
            if rid:
                log_line(rid.split("|")[1], line)
        elif s.get("opus"):
            log_line("runs/out/session.opus.log", line)
            opus_act(line)
        if name == "Agent" and not agent_id and (inp.get("model") == "sonnet"):
            desc = inp.get("description", "Sonnet 작업")
            stage = next((st for w, st in STAGE_WORDS if w in desc), "research")
            task = re.sub(r"^Sonnet:\s*", "", desc)[:40]
            slug = re.sub(r'[^0-9A-Za-z가-힣_-]+', '-', task).strip("-")
            log = f"runs/out/{slug}.sonnet.log"
            ptxt = str(inp.get("prompt", ""))
            pfile = f"runs/out/{slug}.sonnet.prompt.md"     # 보낸 지시문 원문 보관
            (ROOT / pfile).write_text(ptxt, encoding="utf-8")
            mo = re.findall(r"runs/out/[^\s\"'`)]+?\.md", ptxt)   # 지시문에 적힌 결과 파일
            outp = next((o for o in mo if ".sonnet." in o), mo[0] if mo else "")
            r = event("start", "sonnet", task, stage, outp, log, "", pfile)
            log_line(log, "💬 " + desc)
            s["pending"][h.get("tool_use_id", "")] = r + "|" + log
    elif ev == "PostToolUse" and h.get("tool_name") == "Agent" and not agent_id:
        key = s["pending"].pop(h.get("tool_use_id", ""), None)
        if key:
            m = re.search(r'agentId\\?"?\s*[:=]\s*\\?"?(\w+)', json.dumps(h.get("tool_response", ""), ensure_ascii=False))
            if m:
                s["agents"][m.group(1)] = key           # 백그라운드: SubagentStop 때 종료
            else:
                event("end", key.split("|")[0], "ok")  # 포그라운드: 이미 끝남
    elif ev == "SubagentStop" and agent_id:
        key = s["agents"].pop(agent_id, None)
        if key:
            event("end", key.split("|")[0], "ok")
    elif ev == "Stop" and not agent_id:
        if s.get("opus"):
            event("end", s["opus"], "ok")
            s["opus"] = None
    save(s)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # 관측소 기록 실패가 작업을 막으면 안 된다
        try:
            with open(ROOT / "runs" / "hook-errors.log", "a", encoding="utf-8") as f:
                f.write(f"{time.strftime('%H:%M:%S')} {e!r}\n")
        except Exception:
            pass
    sys.exit(0)
