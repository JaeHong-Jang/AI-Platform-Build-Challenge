import { z } from "zod";
import { inspectQuote } from "@/lib/inspector.ts";
import { onGpu } from "@/lib/ollama.ts";
import { failed, parse } from "@/lib/http.ts";
import { quoteDraftSchema } from "@/lib/types.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

const tri = z.enum(["있음", "없음", "모름"]);
const site = z.object({ floor: z.number().int().min(-5).max(80).nullable(), elevator: tri, parkingFar: tri });
const bodySchema = z.object({
  items: z.array(z.object({ id: z.string().max(80), name: z.string().max(40), category: z.enum(["대형가구", "가전", "박스·잡화"]), count: z.number().int().min(0).max(999).nullable(), move: z.boolean(), pending: z.boolean().optional() })).max(60),
  cond: z.object({ from: site, to: site, ladderNeeded: tri }),
  draft: quoteDraftSchema,
  quoteText: z.string().min(10).max(5000),
});

// 견적 점검 에이전트 — 내 조건과 원문 검증을 거친 견적을 보고 추가 비용 지점을 판정·질문한다. 반영 전 결과는 카드에 '에이전트' 표시로 남는다.
export async function POST(req: Request) {
  const body = await parse(req, bodySchema, "짐·조건·견적 형식이 올바르지 않습니다.");
  if (body instanceof Response) return body;
  try {
    return Response.json(await onGpu(req.signal, () => inspectQuote(body, undefined, req.signal)));
  } catch (e) {
    return failed(e);
  }
}
