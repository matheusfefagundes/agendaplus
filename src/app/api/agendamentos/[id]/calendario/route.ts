import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obterSessao } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { obterAgendamentoPorId } from "@/services/agendamento.service";
import { gerarConteudoICS, nomeArquivoICS } from "@/utils/calendario";
import { ROTA_LOGIN_SESSAO_EXPIRADA } from "@/utils/sessao";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessao();
  if (!sessao) return NextResponse.redirect(new URL(ROTA_LOGIN_SESSAO_EXPIRADA, request.url));

  const { id } = await params;
  const naoEncontrado = () => NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  if (!z.string().uuid().safeParse(id).success) return naoEncontrado();

  const agendamento = await obterAgendamentoPorId(id);
  if (!agendamento) return naoEncontrado();

  if (sessao.role === "cliente") {
    const cliente = await obterClientePorUsuarioId(sessao.sub);
    if (!cliente || cliente.id !== agendamento.clienteId) return naoEncontrado();
  }

  if (agendamento.status === "cancelado") {
    return NextResponse.json({ error: "Este agendamento foi cancelado." }, { status: 409 });
  }

  return new NextResponse(gerarConteudoICS(agendamento), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${nomeArquivoICS(agendamento)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
