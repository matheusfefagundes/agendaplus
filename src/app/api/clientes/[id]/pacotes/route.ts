import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { atribuirPacoteSchema } from "@/lib/validation";
import { atribuirPacote } from "@/services/pacote-cliente.service";
import { PacoteInvalidoError } from "@/services/pacote.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = atribuirPacoteSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const pacoteCliente = await atribuirPacote(id, parsed.data.pacoteId);
    return NextResponse.json({ pacoteCliente }, { status: 201 });
  } catch (error) {
    if (error instanceof PacoteInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erro ao atribuir pacote:", error);
    return NextResponse.json({ error: "Não foi possível atribuir o pacote." }, { status: 500 });
  }
}
