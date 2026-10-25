// 요청 본문 검사 — 성남 KAIST src/lib/http.ts 방식(zod 실패 → 400)을 줄여 가져왔다.
import { z } from "zod";

export async function parse<T>(req: Request, schema: z.ZodType<T>, invalid: string): Promise<T | Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const r = schema.safeParse(body);
  return r.success ? r.data : Response.json({ error: invalid }, { status: 400 });
}

export const failed = (e: unknown) =>
  Response.json({ error: (e as Error).name === "TimeoutError" ? "로컬 모델 응답 시간이 초과됐습니다. Ollama가 켜져 있는지 확인해 주세요." : `로컬 모델 처리에 실패했어요: ${(e as Error).message}` }, { status: 502 });
