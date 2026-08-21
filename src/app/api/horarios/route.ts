import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { horarioSchema } from "@/lib/validation";
import { criarHorario, HorarioConflitoError, listarHorarios } from "@/services/horario.service";

export async function GET() {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const horarios = await listarHorarios();
  return NextResponse.json({ horarios });
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = horarioSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const horario = await criarHorario(parsed.data);
    return NextResponse.json({ horario }, { status: 201 });
  } catch (error) {
    if (error instanceof HorarioConflitoError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao criar horário:", error);
    return NextResponse.json({ error: "Não foi possível salvar o horário." }, { status: 500 });
  }
}
