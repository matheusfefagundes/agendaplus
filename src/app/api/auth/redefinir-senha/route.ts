import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { redefinirSenhaSchema } from "@/lib/validation";
import {
  redefinirSenha,
  TokenRedefinicaoInvalidoError,
} from "@/services/redefinicao-senha.service";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`redefinir-senha:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = redefinirSenhaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    await redefinirSenha(parsed.data.token, parsed.data.novaSenha);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TokenRedefinicaoInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Não foi possível redefinir a senha." }, { status: 500 });
  }
}
