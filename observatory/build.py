#!/usr/bin/env python3
"""정적 스냅샷: observatory/index.html (서버 없이 파일로 열 때). 실시간은 server.py."""
import json, pathlib
from data import collect, ROOT

data = collect()
tpl = (ROOT / "observatory" / "template.html").read_text(encoding="utf-8")
payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
(ROOT / "observatory" / "index.html").write_text(tpl.replace("/*__DATA__*/null", payload), encoding="utf-8")
print(f"nodes={len(data['nodes'])} links={len(data['links'])} runs={len(data['runs'])} -> observatory/index.html")
