import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { agendamentoStatusSchema } from "@/lib/validation";
import { atualizarStatusAgendamento, TransicaoInvalidaError } from "@/services/agendamento.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = agendamentoStatusSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const agendamento = await atualizarStatusAgendamento(id, parsed.data.status);
    if (!agendamento) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ agendamento });
  } catch (error) {
    if (error instanceof TransicaoInvalidaError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao atualizar status do agendamento:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o agendamento." }, { status: 500 });
  }
}
