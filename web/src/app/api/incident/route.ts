import { z } from "zod";
import { respond } from "@/lib/responder.ts";
import { SITUATIONS } from "@/lib/incident.ts";
import { onGpu } from "@/lib/ollama.ts";
import { failed, parse } from "@/lib/http.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  situation: z.enum(SITUATIONS),
  story: z.string().min(4).max(1000),
  records: z.array(z.string().max(300)).max(30),
});

// 사고 대응 에이전트 — 상황·설명·계약 전 기록 → 근거를 고른 대응 순서·증거·업체 문자. 법률 판단은 하지 않는다.
export async function POST(req: Request) {
  const body = await parse(req, bodySchema, "상황과 설명(4~1,000자)을 확인해 주세요.");
  if (body instanceof Response) return body;
  try {
    return Response.json(await onGpu(req.signal, () => respond(body, undefined, req.signal)));
  } catch (e) {
    return failed(e);
  }
}
