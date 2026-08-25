import { NextRequest, NextResponse } from "next/server";
import { obterSessao, obterSessaoAdmin } from "@/lib/auth";
import { novoAgendamentoSchema } from "@/lib/validation";
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
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = novoAgendamentoSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const agendamento = await criarAgendamento(parsed.data);
    return NextResponse.json({ agendamento }, { status: 201 });
  } catch (error) {
    if (error instanceof HorarioIndisponivelError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json({ error: "Não foi possível criar o agendamento." }, { status: 500 });
  }
}
