import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { perfilSchema } from "@/lib/validation";
import { atualizarPerfil, obterPerfil, PerfilError } from "@/services/perfil.service";

export async function GET() {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const perfil = await obterPerfil(sessao.sub);
  return NextResponse.json({ perfil });
}

export async function PATCH(request: NextRequest) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = perfilSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    await atualizarPerfil(sessao.sub, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PerfilError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }
}
