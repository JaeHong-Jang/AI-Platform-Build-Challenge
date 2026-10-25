#!/usr/bin/env python3
"""관측소 실시간 서버.

usage: python3 observatory/server.py [port]   (기본 8777, 127.0.0.1 에서만 열림)
  /              홈페이지 (template.html)
  /api/state     전체 상태 JSON
  /api/stream    Server-Sent Events: 1초마다 live 상태, 파일이 바뀌면 'changed'
"""
import json, sys, time, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from data import collect, live, signature, ROOT

PAGE = ROOT / "observatory" / "template.html"
version = 0  # 파일이 바뀔 때마다 증가 (/mnt/c 에서 전체 스캔이 ~2초라 별도 스레드에서 감시)


def watch():
    global version
    last = signature()
    while True:
        sig = signature()
        if sig != last:
            last, version = sig, version + 1
        time.sleep(1)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send(self, code, body, ctype):
        data = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send(200, PAGE.read_text(encoding="utf-8"), "text/html; charset=utf-8")
        elif self.path == "/api/state":
            self.send(200, json.dumps(collect(), ensure_ascii=False), "application/json; charset=utf-8")
        elif self.path == "/api/stream":
            self.stream()
        else:
            self.send(404, "not found", "text/plain")

    def stream(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        seen = version
        try:
            while True:
                if version != seen:
                    seen = version
                    self.wfile.write(b"event: changed\ndata: {}\n\n")
                self.wfile.write(f"event: live\ndata: {json.dumps(live(), ensure_ascii=False)}\n\n".encode("utf-8"))
                self.wfile.flush()
                time.sleep(1)
        except (BrokenPipeError, ConnectionResetError):
            pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    threading.Thread(target=watch, daemon=True).start()
    print(f"관측소: http://localhost:{port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
