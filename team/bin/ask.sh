#!/usr/bin/env bash
# 외부 팀원(Astra·Argon·Sol) 호출 래퍼. 시작·종료가 runs/events.jsonl 에 기록되어 관측소에 실시간으로 보인다.
# usage: team/bin/ask.sh <astra|argon|sol> <task-id> <prompt-file> <stage>
#   stage: research analysis peer review debate (AGENTS.md §2)
# 결과: runs/out/<task-id>.<member>.md  (진행 로그: 같은 이름 + .log)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
member=$1 task=$2 prompt_file=$(realpath "$3") stage=${4:?stage 필요}
out="runs/out/${task}.${member}.md"
mkdir -p "$ROOT/runs/out"
rid=$(python3 "$ROOT/team/bin/event.py" start "$member" "$task" "$stage" "$out" "$out.log" $$ "${prompt_file#$ROOT/}") || exit 2

case "$member" in
  astra) codex exec --skip-git-repo-check -C "$ROOT" -s read-only -c web_search='"live"' \
           -o "$ROOT/$out" - < "$prompt_file" > "$ROOT/$out.log" 2>&1 ;;
  sol)   codex exec --skip-git-repo-check -C "$ROOT" -s read-only -c web_search='"live"' -m gpt-6.1-sol \
           -o "$ROOT/$out" - < "$prompt_file" > "$ROOT/$out.log" 2>&1 ;;
  argon) (cd "$ROOT" && agy --model gemini-4-argon-high --mode plan -p "$(cat "$prompt_file")") \
           > "$ROOT/$out" 2> "$ROOT/$out.log" ;;
  *) echo "unknown member: $member (astra|argon|sol)" >&2; false ;;
esac
rc=$?

status=ok
[ $rc -ne 0 ] && status=fail
[ -s "$ROOT/$out" ] || status=fail
python3 "$ROOT/team/bin/event.py" end "$rid" "$status"
echo "$member $task -> $status ($out)"
