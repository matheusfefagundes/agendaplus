import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { senhaSchema } from "@/lib/validation";
import { alterarSenha, PerfilError } from "@/services/perfil.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`senha:${ip}:${sessao.sub}`)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = senhaSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    await alterarSenha(sessao.sub, parsed.data.senhaAtual, parsed.data.novaSenha);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PerfilError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json({ error: "Não foi possível alterar a senha." }, { status: 500 });
  }
}
