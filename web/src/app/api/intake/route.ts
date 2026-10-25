import { z } from "zod";
import { extractIntake } from "@/lib/extract.ts";
import { failed, parse } from "@/lib/http.ts";
import { onGpu } from "@/lib/ollama.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

// 한 문장 → 조건·짐 초안. 문장에 없는 값은 걷어내고(모름) 그 목록도 돌려준다.
export async function POST(req: Request) {
  const body = await parse(req, z.object({ text: z.string().min(2).max(500) }), "조건은 2~500자 한 문장으로 적어 주세요.");
  if (body instanceof Response) return body;
  try {
    return Response.json(await onGpu(req.signal, () => extractIntake(body.text, req.signal)));
  } catch (e) {
    return failed(e);
  }
}
