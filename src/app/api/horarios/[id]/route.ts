import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { horarioUpdateSchema } from "@/lib/validation";
import {
  atualizarHorario,
  HorarioConflitoError,
  HorarioOcupadoError,
  removerHorario,
} from "@/services/horario.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = horarioUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const horario = await atualizarHorario(id, parsed.data);
    if (!horario) return NextResponse.json({ error: "Horário não encontrado." }, { status: 404 });
    return NextResponse.json({ horario });
  } catch (error) {
    if (error instanceof HorarioConflitoError || error instanceof HorarioOcupadoError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao atualizar horário:", error);
    return NextResponse.json({ error: "Não foi possível salvar o horário." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  try {
    await removerHorario(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HorarioOcupadoError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao remover horário:", error);
    return NextResponse.json({ error: "Não foi possível remover o horário." }, { status: 500 });
  }
}
