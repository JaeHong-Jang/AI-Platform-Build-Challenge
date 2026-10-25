import { health } from "@/lib/ollama.ts";

export const dynamic = "force-dynamic";

// 상단바의 Ollama 연결 상태
export async function GET() {
  return Response.json(await health());
}
