// 로컬 Ollama 클라이언트.
// 주소: OLLAMA_URL → WSL이면 Windows 호스트(기본 게이트웨이) → 127.0.0.1 (TRITON apps/backend/court/llm.py 방식)
// 구조화 출력은 format에 JSON 스키마를 준다 (format:"json"은 스키마를 무시한다 — runs/out/b007-ollama.sonnet.md 실측)
import { readFileSync } from "node:fs";
import { z } from "zod";

export const AGENT_MODEL = () => process.env.OLLAMA_AGENT_MODEL?.trim() || "qwen3:4b-instruct-2507-q4_K_M";
export const READER_MODEL = () => process.env.OLLAMA_READER_MODEL?.trim() || "ax4-light:q4_K_M";

// 첫 호출은 모델을 메모리에 올리느라 37~112초 걸렸다 (실측). 이후 호출은 수 초.
const COLD_TIMEOUT_MS = 180_000;
const WARM_TIMEOUT_MS = 90_000;
// 8GB GPU에서는 두 모델을 번갈아 쓰면 다시 올린다 — 직전에 쓴 모델과 같을 때만 '따뜻한' 것으로 본다
let lastModel = "";

function wslHost(): string | null {
  try {
    if (!/microsoft/i.test(readFileSync("/proc/version", "utf8"))) return null;
    for (const line of readFileSync("/proc/net/route", "utf8").split("\n").slice(1)) {
      const [, dest, gw] = line.trim().split(/\s+/);
      if (dest === "00000000" && gw) return gw.match(/../g)!.reverse().map((h) => parseInt(h, 16)).join(".");
    }
  } catch { /* 리눅스가 아니면 무시 */ }
  return null;
}

export function ollamaUrl(): string {
  const env = process.env.OLLAMA_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = wslHost();
  return `http://${host ?? "127.0.0.1"}:11434`;
}

export interface Health { ok: boolean; url: string; models: string[]; agent: { name: string; ready: boolean }; reader: { name: string; ready: boolean }; error?: string }

export async function health(): Promise<Health> {
  const url = ollamaUrl();
  const base = { url, agent: { name: AGENT_MODEL(), ready: false }, reader: { name: READER_MODEL(), ready: false } };
  try {
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ...base, ok: false, models: [], error: `Ollama ${res.status}` };
    const models: string[] = ((await res.json()).models ?? []).map((m: { name: string }) => m.name);
    return { ok: true, url, models, agent: { ...base.agent, ready: models.includes(AGENT_MODEL()) }, reader: { ...base.reader, ready: models.includes(READER_MODEL()) } };
  } catch {
    return { ...base, ok: false, models: [], error: "Ollama에 연결할 수 없습니다" };
  }
}

export interface ChatMessage { role: "system" | "user" | "assistant" | "tool"; content: string; tool_calls?: ToolCall[]; tool_name?: string }
export interface ToolCall { function: { name: string; arguments: unknown } }
export interface ChatReply { message: ChatMessage; ms: number; done_reason?: string }

// GPU 한 대 — 모델 호출 작업은 서버 전체에서 하나씩 줄 세운다 (D006: 8GB에 두 모델이 함께 올라가지 않는다).
// 기다리는 동안 요청이 취소되면(에이전트 끄기·페이지 이탈) 줄에서 빠진다.
let gpu: Promise<unknown> = Promise.resolve();
export function onGpu<T>(signal: AbortSignal | undefined, job: () => Promise<T>): Promise<T> {
  const run = gpu.then(() => {
    if (signal?.aborted) throw Object.assign(new Error("요청이 취소됐습니다"), { name: "AbortError" });
    return job();
  });
  gpu = run.catch(() => undefined);
  return run;
}

export async function chat(model: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<ChatReply> {
  const t0 = Date.now();
  const timeout = AbortSignal.timeout(lastModel === model ? WARM_TIMEOUT_MS : COLD_TIMEOUT_MS);
  // 보내는 순간 그 모델이 올라간다 — 중간에 끊겨도 '직전 모델'은 이것으로 본다 (Argon#4)
  lastModel = model;
  try {
    const res = await fetch(`${ollamaUrl()}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, stream: false, keep_alive: "30m", options: { temperature: 0, num_ctx: 8192 }, ...body }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return { message: data.message, ms: Date.now() - t0, done_reason: data.done_reason };
  } catch (e) {
    lastModel = ""; // 실패·취소 모두 — 모델이 다 올라갔는지 알 수 없으니 다음 호출은 콜드로 기다린다 (Argon2 #4)
    throw e;
  }
}

/** 모델을 미리 메모리에 올린다 (프롬프트 없는 요청). 같은 num_ctx로 올려야 실제 호출 때 다시 올리지 않는다 — 실측: 설정이 바뀌면 호출마다 5~6초 재적재 (B009) */
export async function warm(model: string): Promise<{ ms: number; already: boolean }> {
  if (lastModel === model) return { ms: 0, already: true };
  const t0 = Date.now();
  const res = await fetch(`${ollamaUrl()}/api/generate`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, keep_alive: "30m", options: { num_ctx: 8192 } }),
    signal: AbortSignal.timeout(COLD_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  await res.json();
  lastModel = model;
  return { ms: Date.now() - t0, already: false };
}

/** system + user → 스키마에 맞는 JSON 하나. 스키마를 어기면 throw. */
export async function chatJSON<T>(model: string, schema: z.ZodType<T>, system: string, user: string, signal?: AbortSignal): Promise<{ data: T; ms: number }> {
  const r = await chat(model, {
    format: z.toJSONSchema(schema),
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  }, signal);
  return { data: schema.parse(JSON.parse(r.message.content)), ms: r.ms };
}

/** 도구 인자는 객체로 오기도, 문자열 JSON으로 오기도 한다 (MoveValue agent_ollama.py _tool_args 방식) */
export function toolArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return {};
}
