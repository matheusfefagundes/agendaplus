import { NextRequest, NextResponse } from "next/server";
import { obterSessao } from "@/lib/auth";
import { novoAgendamentoClienteSchema, novoAgendamentoSchema } from "@/lib/validation";
import { obterClientePorUsuarioId } from "@/services/cliente.service";
import {
  calcularHorariosDisponiveis,
  criarAgendamento,
  HorarioIndisponivelError,
} from "@/services/agendamento.service";

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  // Aberto pra qualquer usuário autenticado (admin ou cliente) — não expõe
  // nada sensível, só horários livres, e o fluxo de agendamento do cliente
  // (Etapa 4) vai precisar do mesmo endpoint.
  const sessao = await obterSessao();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const data = searchParams.get("data");
  const servicoId = searchParams.get("servicoId");

  if (!data || !DATA_REGEX.test(data) || !servicoId) {
    return NextResponse.json({ error: "Informe data e serviço válidos." }, { status: 400 });
  }

  const horarios = await calcularHorariosDisponiveis(data, servicoId);
  return NextResponse.json({ horarios });
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessao();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);

  try {
    let dadosCriacao: Parameters<typeof criarAgendamento>[0];

    if (sessao.role === "cliente") {
      const parsed = novoAgendamentoClienteSchema.safeParse(body);
      if (!parsed.success) {
        const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
        return NextResponse.json({ error: mensagem }, { status: 400 });
      }
      // clienteId nunca vem do corpo da requisição — sempre da sessão.
      const cliente = await obterClientePorUsuarioId(sessao.sub);
      if (!cliente) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
      dadosCriacao = { ...parsed.data, clienteId: cliente.id };
    } else {
      const parsed = novoAgendamentoSchema.safeParse(body);
      if (!parsed.success) {
        const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
        return NextResponse.json({ error: mensagem }, { status: 400 });
      }
      dadosCriacao = parsed.data;
    }

    const agendamento = await criarAgendamento(dadosCriacao);
    return NextResponse.json({ agendamento }, { status: 201 });
  } catch (error) {
    if (error instanceof HorarioIndisponivelError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json({ error: "Não foi possível criar o agendamento." }, { status: 500 });
  }
}
