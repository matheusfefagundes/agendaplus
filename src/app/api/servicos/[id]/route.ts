import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { servicoUpdateSchema } from "@/lib/validation";
import { atualizarServico, excluirServico, ServicoVinculadoError } from "@/services/servico.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = servicoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  const servico = await atualizarServico(id, parsed.data);
  if (!servico) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  return NextResponse.json({ servico });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  try {
    await excluirServico(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ServicoVinculadoError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao excluir serviço:", error);
    return NextResponse.json({ error: "Não foi possível excluir o serviço." }, { status: 500 });
  }
}
