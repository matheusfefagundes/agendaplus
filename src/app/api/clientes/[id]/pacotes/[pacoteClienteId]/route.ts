import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { pacoteClienteUpdateSchema } from "@/lib/validation";
import { ajustarSessoesPacoteCliente, cancelarPacoteCliente } from "@/services/pacote-cliente.service";
import { PacoteInvalidoError } from "@/services/pacote.service";

// Ajusta o total de sessões (`quantidadeSessoes`) ou cancela (`ativo: false`) um
// pacote atribuído a um cliente. Cancelar não afeta agendamentos que já usaram
// sessões dele; só impede novos consumos.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pacoteClienteId: string }> },
) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id, pacoteClienteId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = pacoteClienteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    let pacoteCliente = null;
    if (parsed.data.quantidadeSessoes !== undefined) {
      pacoteCliente = await ajustarSessoesPacoteCliente(id, pacoteClienteId, parsed.data.quantidadeSessoes);
      if (!pacoteCliente) return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });
    }
    if (parsed.data.ativo === false) {
      pacoteCliente = await cancelarPacoteCliente(id, pacoteClienteId);
      if (!pacoteCliente) return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ pacoteCliente });
  } catch (error) {
    if (error instanceof PacoteInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erro ao atualizar pacote do cliente:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o pacote." }, { status: 500 });
  }
}
