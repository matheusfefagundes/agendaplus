import { NextRequest, NextResponse } from "next/server";
import { obterSessaoCliente } from "@/lib/auth";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import { listarAgendamentosHistoricoCliente } from "@/services/agendamento.service";

const MES_REGEX = /^\d{4}-\d{2}$/;
const LIMITE_POR_PAGINA = 5;

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoCliente();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const servicoId = searchParams.get("servicoId") || undefined;
  const mes = searchParams.get("mes") || undefined;
  const offset = Number(searchParams.get("offset") ?? "0");

  if (mes && !MES_REGEX.test(mes)) {
    return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: "Offset inválido." }, { status: 400 });
  }

  const resultado = await listarAgendamentosHistoricoCliente(
    cliente.id,
    { servicoId, mes },
    LIMITE_POR_PAGINA,
    offset,
  );
  return NextResponse.json(resultado);
}
