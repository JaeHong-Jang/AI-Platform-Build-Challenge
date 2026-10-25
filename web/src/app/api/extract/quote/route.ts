import { z } from "zod";
import { extractQuote } from "@/lib/extract.ts";
import { onGpu } from "@/lib/ollama.ts";
import { failed, parse } from "@/lib/http.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

// 붙여넣은 견적서 글 → 항목 초안. 원문에 없는 발췌·숫자는 걷어내고 그 목록도 돌려준다.
export async function POST(req: Request) {
  const body = await parse(req, z.object({ text: z.string().min(10).max(5000) }), "견적서 글은 10~5,000자로 붙여 넣어 주세요.");
  if (body instanceof Response) return body;
  try {
    return Response.json(await onGpu(req.signal, () => extractQuote(body.text, req.signal)));
  } catch (e) {
    return failed(e);
  }
}
