import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { pacoteUpdateSchema } from "@/lib/validation";
import {
  atualizarPacote,
  excluirPacote,
  PacoteInvalidoError,
  PacoteVinculadoError,
} from "@/services/pacote.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = pacoteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const pacote = await atualizarPacote(id, parsed.data);
    if (!pacote) return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });
    return NextResponse.json({ pacote });
  } catch (error) {
    if (error instanceof PacoteInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erro ao atualizar pacote:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o pacote." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  try {
    await excluirPacote(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PacoteVinculadoError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao excluir pacote:", error);
    return NextResponse.json({ error: "Não foi possível excluir o pacote." }, { status: 500 });
  }
}
