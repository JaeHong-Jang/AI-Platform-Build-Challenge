import { z } from "zod";
import { failed, parse } from "@/lib/http.ts";
import { AGENT_MODEL, onGpu, READER_MODEL, warm } from "@/lib/ollama.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

// 다음에 쓸 모델을 미리 올린다 — GPU 줄을 지켜서, 읽는 중인 작업을 끊지 않는다
export async function POST(req: Request) {
  const body = await parse(req, z.object({ role: z.enum(["reader", "agent"]) }), "role은 reader 또는 agent");
  if (body instanceof Response) return body;
  try {
    const model = body.role === "reader" ? READER_MODEL() : AGENT_MODEL();
    return Response.json({ model, ...(await onGpu(req.signal, () => warm(model))) });
  } catch (e) {
    return failed(e);
  }
}
