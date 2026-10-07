import { NextRequest, NextResponse } from "next/server";
import { obterSessaoCliente } from "@/lib/auth";
import { clientePerfilSchema } from "@/lib/validation";
import { atualizarPerfil, obterPerfil, PerfilError } from "@/services/perfil.service";
import { atualizarCliente, obterClientePorUsuarioId } from "@/services/cliente.service";

export async function GET() {
  const sessao = await obterSessaoCliente();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const [perfil, cliente] = await Promise.all([
    obterPerfil(sessao.sub),
    obterClientePorUsuarioId(sessao.sub),
  ]);
  return NextResponse.json({ perfil, telefone: cliente?.telefone ?? null });
}

export async function PATCH(request: NextRequest) {
  const sessao = await obterSessaoCliente();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = clientePerfilSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  const cliente = await obterClientePorUsuarioId(sessao.sub);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  try {
    await atualizarPerfil(sessao.sub, { nome: parsed.data.nome, email: parsed.data.email });
    await atualizarCliente(cliente.id, { telefone: parsed.data.telefone ?? null });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PerfilError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao atualizar perfil do cliente:", error);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }
}
