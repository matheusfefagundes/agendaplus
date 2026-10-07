import { NextRequest, NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { pacoteSchema } from "@/lib/validation";
import { criarPacote, listarPacotes, PacoteInvalidoError } from "@/services/pacote.service";

export async function GET() {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const pacotes = await listarPacotes();
  return NextResponse.json({ pacotes });
}

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = pacoteSchema.safeParse(body);
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  try {
    const pacote = await criarPacote(parsed.data);
    return NextResponse.json({ pacote }, { status: 201 });
  } catch (error) {
    if (error instanceof PacoteInvalidoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erro ao criar pacote:", error);
    return NextResponse.json({ error: "Não foi possível criar o pacote." }, { status: 500 });
  }
}
