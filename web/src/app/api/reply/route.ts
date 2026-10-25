import { z } from "zod";
import { reviewReply } from "@/lib/agent.ts";
import { onGpu } from "@/lib/ollama.ts";
import { failed, parse } from "@/lib/http.ts";
import type { Card } from "@/lib/types.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

const cardSchema = z.object({
  id: z.string().max(80),
  rule: z.enum(["품목", "작업조건", "추가비"]),
  title: z.string().max(80),
  status: z.enum(["명시됨", "포함 여부 미확인", "조건 모호", "판독 불가"]),
  mine: z.string().max(200),
  cost: z.enum(["총액 포함", "별도", "미확인", "해당 없음"]),
  why: z.string().max(600),
  evidence: z.array(z.string().max(300)).max(10),
  ask: z.string().max(300),
  refs: z.array(z.string().max(20)).max(5),
  by: z.literal("agent").optional(), // 점검 에이전트 표시 (B012)
  kw: z.array(z.string().max(60)).max(12).optional(), // 새 위험 카드의 답변 확인 낱말 — 빠지면 제목 전체가 답변에 있어야 해서 거절된다 (Sonnet B012 리뷰 #1)
});
const bodySchema = z.object({ cards: z.array(cardSchema).max(60), reply: z.string().min(1).max(4000), total: z.number().int().nullable().optional() });

// 업체 답변 → 로컬 Ollama 에이전트가 카드별 갱신 후보를 낸다. 반영은 화면에서 사용자가 승인해야 한다.
export async function POST(req: Request) {
  const body = await parse(req, bodySchema, "확인 항목이나 업체 답변 형식이 올바르지 않습니다 (답변은 4,000자까지).");
  if (body instanceof Response) return body;
  try {
    return Response.json(await onGpu(req.signal, () => reviewReply(body.cards as Card[], body.reply, undefined, body.total ?? null, req.signal)));
  } catch (e) {
    return failed(e);
  }
}
