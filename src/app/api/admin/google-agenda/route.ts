import { NextResponse } from "next/server";
import { obterSessaoAdmin } from "@/lib/auth";
import { removerIntegracaoGoogleAgenda } from "@/services/google-agenda.service";

export async function DELETE() {
  const sessao = await obterSessaoAdmin();
  if (!sessao) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    await removerIntegracaoGoogleAgenda();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao desconectar o Google Agenda:", error);
    return NextResponse.json({ error: "Não foi possível desconectar o Google Agenda." }, { status: 500 });
  }
}
