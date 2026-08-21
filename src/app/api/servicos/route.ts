import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { servicoSchema } from "@/lib/validation";
import { criarServico, listarServicos } from "@/services/servico.service";

export async function GET() {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const servicos = await listarServicos();
  return NextResponse.json({ servicos });
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = servicoSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  const servico = await criarServico(parsed.data);
  return NextResponse.json({ servico }, { status: 201 });
}
